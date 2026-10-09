import baseball from './data/baseball.json'
import basketball from './data/basketball.json'
import football from './data/football.json'
import type { Position, Sport, SportId, SportView } from './types'

/** Données des sports, vérifiées contre les types de src/types.ts à la compilation. */
export const sports = { basketball, football, baseball } satisfies Record<SportId, Sport>

/** Ordre d'affichage des sports dans l'interface. */
export const sportIds: readonly SportId[] = ['basketball', 'football', 'baseball']

/** Poste d'un sport et la vue qui le contient (identifiants uniques au sein d'un sport). */
export function findPosition(sport: SportId, positionId: string): { view: SportView; position: Position } | null {
  const data: Sport = sports[sport]
  for (const view of data.views) {
    const position = view.positions.find((p) => p.id === positionId)
    if (position) return { view, position }
  }
  return null
}
