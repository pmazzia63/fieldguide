export type SportId = 'basketball' | 'football' | 'baseball'

export interface Position {
  id: string
  name: string
  abbreviation: string
  description: string
  /** Position sur le terrain, en mètres, centre du terrain = (0,0,0) */
  coords: [x: number, y: number, z: number]
  wikipediaUrl: string
}

export interface SportData {
  id: SportId
  name: string
  positions: Position[]
}
