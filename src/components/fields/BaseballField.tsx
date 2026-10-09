import { FOOT, INCH, LAYER, outline, polar, segment, type Rect, type XZ } from './geometry'
import { Disc, Lines, Polygon } from './marks'
import { Stands } from './Stands'

// Cotes MLB. Origine au centre du losange, x : marbre → champ centre, premier but côté +z.
const BASE_DIST = 90 * FOOT
const HALF_DIAG = BASE_DIST / Math.SQRT2
const HOME: XZ = [-HALF_DIAG, 0]
const BASES: XZ[] = [
  [0, HALF_DIAG],
  [HALF_DIAG, 0],
  [0, -HALF_DIAG],
]
const RUBBER_X = HOME[0] + 60.5 * FOOT // bord avant de la plaque du lanceur
const MOUND: XZ = [HOME[0] + 59 * FOOT, 0]
const MOUND_R = 9 * FOOT
const MOUND_H = 10 * INCH
const INFIELD_ARC_R = 95 * FOOT // limite terre / gazon, centrée sur la plaque du lanceur
const GRASS_HALF_DIAG = HALF_DIAG - 3 * FOOT * Math.SQRT2 // gazon à 3 pieds à l'intérieur des lignes de base
const HOME_CIRCLE_R = 13 * FOOT
const LINE = 4 * INCH
const FOUL = Math.PI / 4 // angle des lignes de fausse balle depuis le marbre
const FENCE_HEIGHT = 2.5
const WARNING_TRACK = 15 * FOOT

// Clôture : 330 pieds le long des lignes, 400 pieds au champ centre.
const fenceDistance = (angle: number) => 330 * FOOT + 70 * FOOT * Math.cos(2 * angle) ** 2
const arcPoints = (count: number, from: number, to: number, point: (angle: number) => XZ): XZ[] =>
  Array.from({ length: count + 1 }, (_, i) => point(from + ((to - from) * i) / count))

const FENCE = arcPoints(48, -FOUL, FOUL, (a) => polar(HOME, fenceDistance(a), a))
const TRACK_INNER = arcPoints(48, -FOUL, FOUL, (a) => polar(HOME, fenceDistance(a) - WARNING_TRACK, a))
const WARNING_TRACK_BAND: XZ[] = [...FENCE, ...TRACK_INNER.toReversed()]

// Terre du champ intérieur : arc de 95 pieds prolongé un peu au-delà des lignes de fausse balle.
const INFIELD_ARC_CENTER: XZ = [RUBBER_X, 0]
const INFIELD_DIRT: XZ[] = [
  [HOME[0] - 2, 0],
  ...arcPoints(40, -1.32, 1.32, (a) => polar(INFIELD_ARC_CENTER, INFIELD_ARC_R, a)),
]
const INFIELD_GRASS: XZ[] = [
  [-GRASS_HALF_DIAG, 0],
  [0, GRASS_HALF_DIAG],
  [GRASS_HALF_DIAG, 0],
  [0, -GRASS_HALF_DIAG],
]

// Marbre : pentagone de 17 pouces, pointe vers le receveur.
const PLATE_HALF = (17 / 2) * INCH
const HOME_PLATE: XZ[] = [
  HOME,
  [HOME[0] + PLATE_HALF, PLATE_HALF],
  [HOME[0] + 2 * PLATE_HALF, PLATE_HALF],
  [HOME[0] + 2 * PLATE_HALF, -PLATE_HALF],
  [HOME[0] + PLATE_HALF, -PLATE_HALF],
]
const PLATE_MID_X = HOME[0] + PLATE_HALF

// Rectangles des frappeurs (4 × 6 pieds, à 6 pouces du marbre) et du receveur (43 pouces × 8 pieds).
const BOX_LINE = 3 * INCH
const BATTER_BOX_Z = PLATE_HALF + 6 * INCH + 2 * FOOT
const CATCHER_FRONT_X = PLATE_MID_X - 3 * FOOT
const CATCHER_BACK_X = CATCHER_FRONT_X - 8 * FOOT
const CATCHER_HALF_W = (43 / 2) * INCH

const LINES: Rect[] = [
  segment(HOME, polar(HOME, fenceDistance(FOUL), FOUL), LINE),
  segment(HOME, polar(HOME, fenceDistance(-FOUL), -FOUL), LINE),
  ...outline([PLATE_MID_X, BATTER_BOX_Z], 6 * FOOT, 4 * FOOT, BOX_LINE),
  ...outline([PLATE_MID_X, -BATTER_BOX_Z], 6 * FOOT, 4 * FOOT, BOX_LINE),
  segment([CATCHER_FRONT_X, CATCHER_HALF_W], [CATCHER_BACK_X, CATCHER_HALF_W], BOX_LINE),
  segment([CATCHER_FRONT_X, -CATCHER_HALF_W], [CATCHER_BACK_X, -CATCHER_HALF_W], BOX_LINE),
  segment([CATCHER_BACK_X, -CATCHER_HALF_W], [CATCHER_BACK_X, CATCHER_HALF_W], BOX_LINE),
]

const BACKSTOP = arcPoints(16, (2 * Math.PI) / 3, (4 * Math.PI) / 3, (a) => polar(HOME, 60 * FOOT, a))

// Tribunes : octogone autour du marbre prolongé le long des lignes, gradins au champ extérieur.
const STAND_OFFSET = 20
const STAND_HALF_SEG = STAND_OFFSET * Math.tan(Math.PI / 8)
const LINE_STAND_END = 95
const lineStand = (side: 1 | -1) => {
  const along = (LINE_STAND_END - STAND_HALF_SEG) / 2
  const outward = side * (3 * Math.PI) / 4
  const [x, z] = polar(polar(HOME, along, side * FOUL), STAND_OFFSET, outward)
  return { front: [x, z] as const, outward, length: LINE_STAND_END + STAND_HALF_SEG, rows: 24 }
}
const STANDS = [
  { front: polar(HOME, STAND_OFFSET, Math.PI), outward: Math.PI, length: 2 * STAND_HALF_SEG, rows: 24 },
  lineStand(1),
  lineStand(-1),
  ...[-30, -15, 0, 15, 30].map((deg) => {
    const a = (deg * Math.PI) / 180
    const d = fenceDistance(a) + 5
    return { front: polar(HOME, d, a), outward: a, length: 2 * d * Math.tan(Math.PI / 24) + 0.5, rows: 14 }
  }),
]

const COLORS = {
  grass: '#3d7a34',
  infieldGrass: '#468a3c',
  dirt: '#b07a4a',
  track: '#9c6a3f',
  fence: '#14532d',
  pole: '#facc15',
  white: '#f8fafc',
}

// Couches propres au baseball (plus de niveaux superposés que les autres terrains).
const Y = { grass: LAYER.ground, dirt: LAYER.surface, infieldGrass: LAYER.paint, cutouts: LAYER.line, lines: LAYER.line + 0.01 }

/** Mur vertical suivant une polyligne. */
function Wall({ points, height, thickness, color, opacity = 1 }: {
  points: readonly XZ[]
  height: number
  thickness: number
  color: string
  opacity?: number
}) {
  return points.slice(1).map((q, i) => {
    const p = points[i] ?? q
    const { x, z, sx, angle = 0 } = segment(p, q, thickness)
    return (
      <mesh key={i} position={[x, height / 2, z]} rotation-y={-angle} castShadow={opacity === 1} receiveShadow>
        <boxGeometry args={[sx + 0.05, height, thickness]} />
        <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    )
  })
}

/** Monticule surélevé et plaque du lanceur. */
function Mound() {
  const rubberDepth = 6 * INCH
  return (
    <group>
      <mesh position={[MOUND[0], MOUND_H / 2, MOUND[1]]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, MOUND_R, MOUND_H, 48]} />
        <meshStandardMaterial color={COLORS.dirt} roughness={1} />
      </mesh>
      <mesh position={[RUBBER_X + rubberDepth / 2, MOUND_H + 0.01, 0]} receiveShadow>
        <boxGeometry args={[rubberDepth, 0.02, 24 * INCH]} />
        <meshStandardMaterial color={COLORS.white} />
      </mesh>
    </group>
  )
}

/** Terrain de baseball : losange, monticule, champ intérieur en terre, champ extérieur et clôture. */
export function BaseballField() {
  const foulPoles = [FOUL, -FOUL].map((a) => polar(HOME, fenceDistance(a) + 0.3, a))
  return (
    <group>
      <Disc center={[40, 0]} radius={260} color={COLORS.grass} y={Y.grass} />
      <Polygon points={WARNING_TRACK_BAND} color={COLORS.track} y={Y.dirt} />
      <Polygon points={INFIELD_DIRT} color={COLORS.dirt} y={Y.dirt} />
      <Polygon points={INFIELD_GRASS} color={COLORS.infieldGrass} y={Y.infieldGrass} />
      <Disc center={HOME} radius={HOME_CIRCLE_R} color={COLORS.dirt} y={Y.cutouts} />
      {BASES.map((b, i) => (
        <Disc key={i} center={b} radius={2.6} color={COLORS.dirt} y={Y.cutouts} />
      ))}
      <Lines rects={LINES} y={Y.lines} />
      <Polygon points={HOME_PLATE} color={COLORS.white} y={Y.lines + 0.005} />
      {BASES.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.04, z]} rotation-y={Math.PI / 4} castShadow>
          <boxGeometry args={[15 * INCH, 0.08, 15 * INCH]} />
          <meshStandardMaterial color={COLORS.white} />
        </mesh>
      ))}
      <Mound />
      <Wall points={FENCE} height={FENCE_HEIGHT} thickness={0.3} color={COLORS.fence} />
      <Wall points={BACKSTOP} height={1.2} thickness={0.3} color={COLORS.fence} />
      <Wall points={BACKSTOP} height={8} thickness={0.05} color="#cbd5e1" opacity={0.15} />
      {foulPoles.map(([x, z], i) => (
        <mesh key={i} position={[x, 10, z]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 20, 12]} />
          <meshStandardMaterial color={COLORS.pole} />
        </mesh>
      ))}
      <Stands stands={STANDS} color="#475569" />
    </group>
  )
}
