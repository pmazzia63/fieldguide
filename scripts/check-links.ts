// Vérifie que chaque URL Wikipedia de src/data/*.json existe réellement.
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DATA_DIR = join(import.meta.dirname, '..', 'src', 'data')
const WIKI_URL = /^https:\/\/[a-z-]+\.wikipedia\.org\/wiki\/[^\s"]+$/

function collectUrls(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    if (value.includes('wikipedia.org')) out.push(value)
  } else if (Array.isArray(value)) {
    for (const v of value) collectUrls(v, out)
  } else if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value)) collectUrls(v, out)
  }
}

const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'))
const urls: { file: string; url: string }[] = []
for (const file of files) {
  const found: string[] = []
  collectUrls(JSON.parse(await readFile(join(DATA_DIR, file), 'utf8')), found)
  for (const url of found) urls.push({ file, url })
}

let failures = 0
for (const { file, url } of urls) {
  if (!WIKI_URL.test(url)) {
    console.error(`✗ ${file}: format invalide ${url}`)
    failures++
    continue
  }
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
  if (res.ok) {
    console.log(`✓ ${url}`)
  } else {
    console.error(`✗ ${file}: ${String(res.status)} ${url}`)
    failures++
  }
}

console.log(`\n${String(urls.length)} lien(s) vérifié(s) dans ${String(files.length)} fichier(s), ${String(failures)} échec(s).`)
if (failures > 0) process.exit(1)
