import { LAYER, outline, segment, type Rect } from './geometry'
import { Arc, Area, DashedArc, Disc, Lines } from './marks'
import { Stands } from './Stands'

// Cotes FIBA. Le panier attaqué est côté +x ; l'autre moitié est obtenue par rotation de 180°.
const LENGTH = 28
const WIDTH = 15
const LINE = 0.05
const HALF_L = LENGTH / 2
const HALF_W = WIDTH / 2
const RUNOFF = 2 // zone dégagée autour du terrain

const CIRCLE_R = 1.8 // cercle central et cercles des lancers francs
const BASKET_X = HALF_L - 1.575 // centre du cercle, à l'aplomb
const BOARD_X = HALF_L - 1.2 // face avant de la planche
const RIM_HEIGHT = 3.05
const FT_X = HALF_L - 5.8 // ligne des lancers francs
const KEY_HALF_W = 4.9 / 2
const THREE_R = 6.75
const THREE_SIDE_Z = HALF_W - 0.9 // segments droits à 0,90 m des lignes de touche
const THREE_SIDE_X = BASKET_X - Math.sqrt(THREE_R ** 2 - THREE_SIDE_Z ** 2)
const THREE_START = Math.atan2(THREE_SIDE_Z, THREE_SIDE_X - BASKET_X)
const NO_CHARGE_R = 1.25

const COLORS = {
  arena: '#111827',
  wood: '#c99559',
  runoff: '#7c4a24',
  paint: '#9a3412',
  rim: '#ea580c',
  structure: '#1f2937',
  padding: '#334155',
}

const COURT_LINES: Rect[] = [
  ...outline([0, 0], LENGTH + LINE, WIDTH + LINE, LINE),
  segment([0, -HALF_W - 0.15], [0, HALF_W + 0.15], LINE),
]

const HALF_LINES: Rect[] = [
  // Raquette et ligne des lancers francs
  segment([FT_X, -KEY_HALF_W], [FT_X, KEY_HALF_W], LINE),
  segment([FT_X, -KEY_HALF_W], [HALF_L, -KEY_HALF_W], LINE),
  segment([FT_X, KEY_HALF_W], [HALF_L, KEY_HALF_W], LINE),
  // Segments droits de la ligne à 3 points
  segment([THREE_SIDE_X, -THREE_SIDE_Z], [HALF_L, -THREE_SIDE_Z], LINE),
  segment([THREE_SIDE_X, THREE_SIDE_Z], [HALF_L, THREE_SIDE_Z], LINE),
  // Prolongements du demi-cercle de non-charge jusqu'à l'aplomb de la planche
  segment([BASKET_X, -NO_CHARGE_R], [BOARD_X, -NO_CHARGE_R], LINE),
  segment([BASKET_X, NO_CHARGE_R], [BOARD_X, NO_CHARGE_R], LINE),
]

const RUNOFF_BAND = outline([0, 0], LENGTH + RUNOFF, WIDTH + RUNOFF, RUNOFF)

const STANDS_ROWS = 14
const STANDS = [
  { front: [0, HALF_W + RUNOFF + 1] as const, outward: Math.PI / 2, length: LENGTH + 2 * RUNOFF, rows: STANDS_ROWS },
  { front: [0, -HALF_W - RUNOFF - 1] as const, outward: -Math.PI / 2, length: LENGTH + 2 * RUNOFF, rows: STANDS_ROWS },
  { front: [HALF_L + 3.5, 0] as const, outward: 0, length: WIDTH + 2 * RUNOFF + 2, rows: STANDS_ROWS },
  { front: [-HALF_L - 3.5, 0] as const, outward: Math.PI, length: WIDTH + 2 * RUNOFF + 2, rows: STANDS_ROWS },
]

/** Cadre peint sur la face avant de la planche (rectangle extérieur ou cible). */
function BoardFrame({ y, width, height }: { y: number; width: number; height: number }) {
  const x = BOARD_X - 0.001
  const t = LINE
  return (
    <group position={[x, y, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={`h${String(s)}`} position={[0, (s * (height - t)) / 2, 0]}>
          <boxGeometry args={[0.005, t, width]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`v${String(s)}`} position={[0, 0, (s * (width - t)) / 2]}>
          <boxGeometry args={[0.005, height, t]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
    </group>
  )
}

/** Panier complet : planche, cercle, filet et support, côté +x. */
function Hoop() {
  const boardBottom = 2.9
  const boardHeight = 1.05
  const boardY = boardBottom + boardHeight / 2
  const postX = HALF_L + 2.2
  const armY = boardY + 0.2
  return (
    <group>
      {/* Planche en verre */}
      <mesh position={[BOARD_X + 0.015, boardY, 0]} castShadow>
        <boxGeometry args={[0.03, boardHeight, 1.8]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.3} roughness={0.1} />
      </mesh>
      <BoardFrame y={boardY} width={1.8} height={boardHeight} />
      <BoardFrame y={RIM_HEIGHT + 0.45 / 2} width={0.59} height={0.45} />

      {/* Cercle (diamètre intérieur 45 cm) et fixation */}
      <mesh position={[BASKET_X, RIM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.2325, 0.01, 8, 40]} />
        <meshStandardMaterial color={COLORS.rim} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[(BASKET_X + 0.2325 + BOARD_X) / 2, RIM_HEIGHT, 0]}>
        <boxGeometry args={[BOARD_X - BASKET_X - 0.2325, 0.03, 0.12]} />
        <meshStandardMaterial color={COLORS.rim} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Filet */}
      <mesh position={[BASKET_X, RIM_HEIGHT - 0.2, 0]}>
        <cylinderGeometry args={[0.225, 0.14, 0.4, 16, 4, true]} />
        <meshBasicMaterial color="#f8fafc" wireframe />
      </mesh>

      {/* Support : bras, poteau et embase protégée, derrière la ligne de fond */}
      <mesh position={[(BOARD_X + 0.03 + postX) / 2, armY, 0]} castShadow>
        <boxGeometry args={[postX - BOARD_X - 0.03, 0.15, 0.15]} />
        <meshStandardMaterial color={COLORS.structure} />
      </mesh>
      <mesh position={[postX, armY / 2, 0]} castShadow>
        <boxGeometry args={[0.25, armY, 0.25]} />
        <meshStandardMaterial color={COLORS.structure} />
      </mesh>
      <mesh position={[postX + 0.3, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.9, 1.3]} />
        <meshStandardMaterial color={COLORS.padding} />
      </mesh>
    </group>
  )
}

/** Moitié de terrain attaquant vers +x : peinture, marquages et panier. */
function HalfCourt() {
  return (
    <group>
      <Area center={[(FT_X + HALF_L) / 2, 0]} size={[HALF_L - FT_X, 2 * KEY_HALF_W]} color={COLORS.paint} y={LAYER.paint} />
      <Lines rects={HALF_LINES} />
      <Arc center={[BASKET_X, 0]} radius={THREE_R} width={LINE} start={THREE_START} length={2 * (Math.PI - THREE_START)} />
      <Arc center={[FT_X, 0]} radius={CIRCLE_R} width={LINE} start={Math.PI / 2} length={Math.PI} />
      <DashedArc center={[FT_X, 0]} radius={CIRCLE_R} width={LINE} start={-Math.PI / 2} length={Math.PI} dashes={6} />
      <Arc center={[BASKET_X, 0]} radius={NO_CHARGE_R} width={LINE} start={Math.PI / 2} length={Math.PI} />
      <Hoop />
    </group>
  )
}

/** Terrain de basket FIBA (28 × 15 m) dans une salle avec tribunes. */
export function BasketballCourt() {
  return (
    <group>
      <Area center={[0, 0]} size={[90, 70]} color={COLORS.arena} y={LAYER.ground} />
      <Area center={[0, 0]} size={[LENGTH + 2 * RUNOFF, WIDTH + 2 * RUNOFF]} color={COLORS.wood} y={LAYER.surface} />
      <Lines rects={RUNOFF_BAND} color={COLORS.runoff} y={LAYER.paint} />
      <Disc center={[0, 0]} radius={CIRCLE_R} color={COLORS.paint} y={LAYER.paint} />
      <Lines rects={COURT_LINES} />
      <Arc center={[0, 0]} radius={CIRCLE_R} width={LINE} />
      <HalfCourt />
      <group rotation-y={Math.PI}>
        <HalfCourt />
      </group>
      <Stands stands={STANDS} color="#334155" />
    </group>
  )
}
