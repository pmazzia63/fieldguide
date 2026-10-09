export type SportId = 'basketball' | 'football' | 'baseball'

export interface FamousPlayer {
  name: string
  /** URL d'un article Wikipedia existant, vérifiée par `npm run check-links` */
  wikipediaUrl: string
}

export interface Position {
  /** Identifiant unique au sein d'un sport (toutes vues confondues) */
  id: string
  name: string
  abbreviation: string
  /** Numéro de maillot du joueur affiché à ce poste */
  number: number
  /** Présentation générale du poste */
  description: string
  /** Rôle tactique résumé en une phrase */
  role: string
  /** Position au sol en mètres (y = 0), centre du terrain = (0,0,0). Voir `axes` du sport. */
  x: number
  z: number
  famousPlayers: FamousPlayer[]
}

/** Une disposition de joueurs à afficher (ex. attaque / défense au foot US). */
export interface SportView {
  id: string
  name: string
  /** Libellé court pour les boutons (ex. « Attaque ») */
  shortName: string
  positions: Position[]
}

/** Contenu d'un fichier src/data/<SportId>.json */
export interface Sport {
  name: string
  /** Convention d'orientation des axes x/z pour ce sport */
  axes: string
  views: SportView[]
}
