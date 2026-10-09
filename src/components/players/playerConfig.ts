import type { SportId } from '../../types'
import { FOOT, INCH, type XZ } from '../fields/geometry'

/** Tenue complète d'un joueur : détermine ses accessoires. */
export type Outfit = 'basketball' | 'football' | 'baseball-fielder' | 'baseball-batter'

/** Couleurs d'une équipe fictive (aucune équipe réelle). */
export interface TeamColors {
  jersey: string
  /** Numéro, chaussettes, liserés */
  accent: string
  pants: string
  /** Casque ou casquette */
  headgear: string
}

/** Orientation : vers un point du terrain, ou selon un angle (de +x vers +z). */
export type Facing = { towards: XZ } | { angle: number }

export interface PlayerStyle {
  outfit: Outfit
  team: TeamColors
  facing: Facing
  /** Hauteur du sol sous le joueur (ex. monticule), en mètres */
  elevation?: number
}

interface SportPlayers {
  /** Style par identifiant de vue (src/data/*.json), puis surcharges par identifiant de poste */
  views: Record<string, PlayerStyle>
  overrides?: Record<string, Partial<PlayerStyle>>
}

const TEAMS = {
  blue: { jersey: '#1d4ed8', accent: '#f8fafc', pants: '#1d4ed8', headgear: '#1d4ed8' },
  navy: { jersey: '#1e3a8a', accent: '#f8fafc', pants: '#e2e8f0', headgear: '#cbd5e1' },
  red: { jersey: '#f8fafc', accent: '#b91c1c', pants: '#e5e7eb', headgear: '#b91c1c' },
  home: { jersey: '#f8fafc', accent: '#1e3a8a', pants: '#f1f5f9', headgear: '#1e3a8a' },
  away: { jersey: '#9ca3af', accent: '#991b1b', pants: '#9ca3af', headgear: '#991b1b' },
} satisfies Record<string, TeamColors>

const BASKET: XZ = [14 - 1.575, 0] // centre du panier attaqué (cf. BasketballCourt)
const HOME_PLATE: XZ = [-(90 * FOOT) / Math.SQRT2, 0] // cf. BaseballField

export const sportPlayers: Record<SportId, SportPlayers> = {
  basketball: {
    views: { team: { outfit: 'basketball', team: TEAMS.blue, facing: { towards: BASKET } } },
  },
  football: {
    views: {
      offense: { outfit: 'football', team: TEAMS.navy, facing: { angle: 0 } },
      defense: { outfit: 'football', team: TEAMS.red, facing: { angle: Math.PI } },
    },
  },
  baseball: {
    views: { defense: { outfit: 'baseball-fielder', team: TEAMS.home, facing: { towards: HOME_PLATE } } },
    overrides: {
      pitcher: { elevation: 10 * INCH }, // sur le plateau du monticule
      // Le frappeur appartient à l'équipe adverse ; dans la boîte côté -z, il fait face au marbre.
      'designated-hitter': { outfit: 'baseball-batter', team: TEAMS.away },
    },
  },
}

/** Style par défaut si une vue n'est pas décrite ci-dessus. */
export const DEFAULT_STYLE: PlayerStyle = { outfit: 'basketball', team: TEAMS.blue, facing: { angle: 0 } }

/** Rotation autour de l'axe vertical pour qu'un joueur en (x, z), regardant +z au repos, suive `facing`. */
export function facingRotation(facing: Facing, x: number, z: number): number {
  const [dx, dz] =
    'towards' in facing ? [facing.towards[0] - x, facing.towards[1] - z] : [Math.cos(facing.angle), Math.sin(facing.angle)]
  return Math.atan2(dx, dz)
}

/** Style effectif d'un poste : style de sa vue, puis surcharges propres au poste. */
export function playerStyle(sport: SportId, viewId: string, positionId: string): PlayerStyle {
  const config = sportPlayers[sport]
  return { ...(config.views[viewId] ?? DEFAULT_STYLE), ...config.overrides?.[positionId] }
}
