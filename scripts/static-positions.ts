// Plugin Vite : insère dans index.html la liste des postes en HTML statique, générée depuis src/data/*.json.
// Lisible sans JavaScript et par les moteurs de recherche ; React remplace ce contenu au démarrage.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import type { Sport, SportId } from '../src/types.ts'

const PLACEHOLDER = '<!--static-positions-->'
const DATA_DIR = join(import.meta.dirname, '..', 'src', 'data')
const SPORT_IDS: readonly SportId[] = ['basketball', 'football', 'baseball']

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

function renderSport(sport: Sport): string {
  const views = sport.views.map((view) => {
    const positions = view.positions.map((p) => {
      const players = p.famousPlayers
        .map((f) => `<li><a href="${escapeHtml(f.wikipediaUrl)}">${escapeHtml(f.name)}</a></li>`)
        .join('')
      return [
        `<article><h4>${escapeHtml(p.name)} (${escapeHtml(p.abbreviation)})</h4>`,
        `<p>${escapeHtml(p.description)}</p>`,
        `<p><strong>Rôle :</strong> ${escapeHtml(p.role)}</p>`,
        players && `<p>Joueurs célèbres :</p><ul>${players}</ul>`,
        '</article>',
      ].join('')
    })
    return `<section><h3>${escapeHtml(view.name)}</h3>${positions.join('')}</section>`
  })
  return `<section><h2>${escapeHtml(sport.name)}</h2>${views.join('')}</section>`
}

function renderAll(): string {
  const sports = SPORT_IDS.map((id) => JSON.parse(readFileSync(join(DATA_DIR, `${id}.json`), 'utf8')) as Sport)
  return `<div id="static-positions"><h1>FieldGuide : les postes du basket, du football américain et du baseball</h1>${sports
    .map(renderSport)
    .join('')}</div>`
}

export function staticPositions(): Plugin {
  return {
    name: 'fieldguide:static-positions',
    configureServer(server) {
      // Recharge la page quand les données changent en développement.
      server.watcher.add(DATA_DIR)
    },
    transformIndexHtml(html) {
      if (!html.includes(PLACEHOLDER)) throw new Error(`index.html : marqueur ${PLACEHOLDER} introuvable`)
      return html.replace(PLACEHOLDER, renderAll())
    },
  }
}
