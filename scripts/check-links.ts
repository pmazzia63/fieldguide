// Vérifie via l'API Wikipedia que chaque URL de src/data/*.json pointe vers un article existant.
// Échec : format invalide, page inexistante, page d'homonymie, erreur réseau.
// Avertissement seulement : redirection (le lien marche mais mérite d'être mis à jour).
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DATA_DIR = join(import.meta.dirname, '..', 'src', 'data')
const WIKI_URL = /^https:\/\/([a-z-]+)\.wikipedia\.org\/wiki\/([^\s"#?]+)$/
const BATCH_SIZE = 50 // maximum de titres par requête autorisé par l'API
const USER_AGENT = 'FieldGuide-check-links/1.0 (outil de développement, vérification de liens)'

interface Link {
  file: string
  path: string
  url: string
}

interface ApiResponse {
  query?: {
    normalized?: { from: string; to: string }[]
    redirects?: { from: string; to: string }[]
    pages?: { title: string; missing?: boolean; invalid?: boolean; pageprops?: { disambiguation?: string } }[]
  }
}

type Result = { ok: true; redirectedTo?: string } | { ok: false; reason: string }

function collectUrls(value: unknown, path: string, file: string, out: Link[]): void {
  if (typeof value === 'string') {
    if (value.includes('wikipedia.org')) out.push({ file, path, url: value })
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => { collectUrls(v, `${path}[${String(i)}]`, file, out) })
  } else if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectUrls(v, path ? `${path}.${k}` : k, file, out)
  }
}

async function checkTitles(lang: string, titles: string[]): Promise<Map<string, Result>> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    prop: 'pageprops',
    ppprop: 'disambiguation',
    titles: titles.join('|'),
  })
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT },
  })
  const results = new Map<string, Result>()
  if (!res.ok) {
    for (const t of titles) results.set(t, { ok: false, reason: `HTTP ${String(res.status)}` })
    return results
  }
  const { query } = (await res.json()) as ApiResponse
  const normalized = new Map(query?.normalized?.map((n) => [n.from, n.to]))
  const redirects = new Map(query?.redirects?.map((r) => [r.from, r.to]))
  const pages = new Map(query?.pages?.map((p) => [p.title, p]))

  for (const title of titles) {
    const norm = normalized.get(title) ?? title
    const target = redirects.get(norm)
    const page = pages.get(target ?? norm)
    if (!page) results.set(title, { ok: false, reason: 'absent de la réponse API' })
    else if (page.invalid) results.set(title, { ok: false, reason: 'titre invalide' })
    else if (page.missing) results.set(title, { ok: false, reason: 'page inexistante' })
    else if (page.pageprops?.disambiguation !== undefined) results.set(title, { ok: false, reason: "page d'homonymie" })
    else results.set(title, target ? { ok: true, redirectedTo: target } : { ok: true })
  }
  return results
}

const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json')).sort()
const links: Link[] = []
for (const file of files) {
  collectUrls(JSON.parse(await readFile(join(DATA_DIR, file), 'utf8')), '', file, links)
}

// Regroupe les titres par langue pour interroger chaque Wikipedia par lots.
const titleOf = new Map<string, { lang: string; title: string }>()
const byLang = new Map<string, Set<string>>()
let failures = 0
for (const { file, path, url } of links) {
  const match = WIKI_URL.exec(url)
  if (!match?.[1] || !match[2]) {
    console.error(`✗ ${file} ${path}: format invalide ${url}`)
    failures++
    continue
  }
  const lang = match[1]
  const title = decodeURIComponent(match[2]).replaceAll('_', ' ')
  titleOf.set(url, { lang, title })
  if (!byLang.has(lang)) byLang.set(lang, new Set())
  byLang.get(lang)?.add(title)
}

const results = new Map<string, Result>() // clé : `${lang}:${title}`
for (const [lang, set] of byLang) {
  const titles = [...set]
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE)
    try {
      for (const [t, r] of await checkTitles(lang, batch)) results.set(`${lang}:${t}`, r)
    } catch (err) {
      for (const t of batch) results.set(`${lang}:${t}`, { ok: false, reason: `erreur réseau (${String(err)})` })
    }
  }
}

let redirects = 0
for (const { file, path, url } of links) {
  const parsed = titleOf.get(url)
  if (!parsed) continue
  const result = results.get(`${parsed.lang}:${parsed.title}`)
  if (!result) continue
  if (!result.ok) {
    console.error(`✗ ${file} ${path}: ${result.reason} — ${url}`)
    failures++
  } else if (result.redirectedTo) {
    console.warn(`↪ ${file} ${path}: redirection vers « ${result.redirectedTo} » — ${url}`)
    redirects++
  }
}

console.log(
  `\n${String(links.length)} lien(s) vérifié(s) dans ${String(files.length)} fichier(s) : ` +
    `${String(failures)} échec(s), ${String(redirects)} redirection(s).`,
)
if (failures > 0) process.exit(1)
