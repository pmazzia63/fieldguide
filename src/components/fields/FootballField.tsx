import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { FOOT, INCH, LAYER, outline, YARD, type Rect, type XZ } from './geometry'
import { Area, Lines, Polygon } from './marks'
import { Stands } from './Stands'

// Cotes NFL. x : axe longitudinal, ligne des 50 yards en x = 0.
const HALF_W = (160 * FOOT) / 2
const GOAL_X = 50 * YARD
const END_X = 60 * YARD // ligne de fond des zones d'en-but
const LINE = 4 * INCH
const BORDER = 6 * FOOT // bordure blanche hors du terrain
const HASH_Z = (18.5 * FOOT) / 2 // lignes de hachures (écartement des poteaux)
const TICK = 2 * FOOT

const COLORS = {
  surround: '#2f5f2b',
  grass: '#3f7f38',
  stripe: '#4a8d42',
  endZoneA: '#1e3a5f',
  endZoneB: '#5b1f1f',
  post: '#facc15',
  pad: '#334155',
  pylon: '#f97316',
}

const yardX = (yardsFromLeftGoal: number) => -GOAL_X + yardsFromLeftGoal * YARD

/** Bandes de tonte alternées tous les 5 yards. */
const STRIPES: Rect[] = Array.from({ length: 10 }, (_, i) => ({
  x: yardX(i * 10 + 2.5),
  z: 0,
  sx: 5 * YARD,
  sz: 2 * HALF_W,
}))

const FIELD_LINES: Rect[] = [
  // Lignes tous les 5 yards (lignes de but deux fois plus larges)
  ...Array.from({ length: 21 }, (_, i): Rect => ({
    x: yardX(i * 5),
    z: 0,
    sx: i === 0 || i === 20 ? 2 * LINE : LINE,
    sz: 2 * HALF_W,
  })),
  // Repères de chaque yard : le long des lignes de touche et sur les hachures
  ...Array.from({ length: 99 }, (_, i) => i + 1)
    .filter((yard) => yard % 5 !== 0)
    .flatMap((yard): Rect[] =>
      [HALF_W - LINE - TICK / 2, HASH_Z + TICK / 2].flatMap((z) => [
        { x: yardX(yard), z, sx: LINE, sz: TICK },
        { x: yardX(yard), z: -z, sx: LINE, sz: TICK },
      ]),
    ),
  // Marques de transformation à 2 points
  { x: yardX(2), z: 0, sx: LINE, sz: YARD },
  { x: yardX(98), z: 0, sx: LINE, sz: YARD },
]

const BORDER_BAND = outline([0, 0], 2 * END_X + BORDER, 2 * HALF_W + BORDER, BORDER)

// Numéros tous les 10 yards : haut des chiffres à 9 yards de la ligne de touche, hauts de 6 pieds.
const NUMBER_Z = HALF_W - 10 * YARD
const NUMBER_SIZE: XZ = [3.4, 6 * FOOT]
const NUMBERS = Array.from({ length: 9 }, (_, i) => ({
  x: yardX((i + 1) * 10),
  label: String(i < 5 ? (i + 1) * 10 : (9 - i) * 10),
  /** Sens de la flèche vers le but le plus proche (0 pour la ligne des 50) */
  arrow: i < 4 ? -1 : i > 4 ? 1 : 0,
}))

const ARROWS: XZ[][] = NUMBERS.filter((n) => n.arrow !== 0).flatMap(({ x, arrow }) =>
  [-1, 1].map((side) => {
    // Flèche triangulaire côté ligne de touche, à l'extérieur du numéro.
    const tipX = x + arrow * (NUMBER_SIZE[0] / 2 + 0.75)
    const baseX = tipX - arrow * 0.45
    const z = side * (NUMBER_Z + 0.5)
    return [
      [tipX, z],
      [baseX, z - 0.23],
      [baseX, z + 0.23],
    ] as XZ[]
  }),
)

const STANDS = [
  { front: [0, HALF_W + BORDER + 9] as const, outward: Math.PI / 2, length: 2 * END_X + 4, rows: 30 },
  { front: [0, -HALF_W - BORDER - 9] as const, outward: -Math.PI / 2, length: 2 * END_X + 4, rows: 30 },
  { front: [END_X + BORDER + 9, 0] as const, outward: 0, length: 2 * HALF_W + 16, rows: 18 },
  { front: [-END_X - BORDER - 9, 0] as const, outward: Math.PI, length: 2 * HALF_W + 16, rows: 18 },
]

/** Texture d'un numéro de yards : deux chiffres de part et d'autre de la ligne. */
function useNumberTexture(label: string) {
  const texture = useMemo(() => {
    const pxPerMeter = 140
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(NUMBER_SIZE[0] * pxPerMeter)
    canvas.height = Math.round(NUMBER_SIZE[1] * pxPerMeter)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const digitW = 4 * FOOT * pxPerMeter
      const gap = canvas.width - 2 * digitW
      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 200px Arial, Helvetica, sans-serif'
      ;[label.charAt(0), label.charAt(1)].forEach((digit, i) => {
        // Chaque chiffre est étiré pour remplir sa boîte de 4 × 6 pieds.
        const m = ctx.measureText(digit)
        const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
        const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
        ctx.setTransform(digitW / w, 0, 0, canvas.height / h, i * (digitW + gap), 0)
        ctx.fillText(digit, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent)
      })
    }
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [label])

  useEffect(() => () => { texture.dispose() }, [texture])
  return texture
}

/** Numéro peint au sol ; le haut des chiffres est tourné vers la ligne de touche la plus proche. */
function YardNumber({ label, x, side }: { label: string; x: number; side: 1 | -1 }) {
  const texture = useNumberTexture(label)
  return (
    <mesh position={[x, LAYER.line, side * NUMBER_Z]} rotation={[-Math.PI / 2, 0, side === 1 ? Math.PI : 0]} receiveShadow>
      <planeGeometry args={NUMBER_SIZE} />
      <meshStandardMaterial map={texture} transparent alphaTest={0.5} roughness={0.9} />
    </mesh>
  )
}

/** Poteau en « col de cygne » sur la ligne de fond côté +x. */
function Goalpost() {
  const crossbarY = 10 * FOOT
  const uprightHeight = 35 * FOOT
  const halfSpan = (18.5 * FOOT) / 2
  const baseX = END_X + 6 * FOOT
  const elbowY = crossbarY - 0.4
  const r = 0.09
  return (
    <group>
      <mesh position={[baseX, elbowY / 2, 0]} castShadow>
        <cylinderGeometry args={[r * 1.4, r * 1.4, elbowY, 12]} />
        <meshStandardMaterial color={COLORS.post} />
      </mesh>
      <mesh position={[baseX, 1, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 2, 16]} />
        <meshStandardMaterial color={COLORS.pad} />
      </mesh>
      <mesh position={[(baseX + END_X) / 2, elbowY, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[r * 1.2, r * 1.2, baseX - END_X, 12]} />
        <meshStandardMaterial color={COLORS.post} />
      </mesh>
      <mesh position={[END_X, (elbowY + crossbarY) / 2, 0]} castShadow>
        <cylinderGeometry args={[r * 1.2, r * 1.2, crossbarY - elbowY, 12]} />
        <meshStandardMaterial color={COLORS.post} />
      </mesh>
      <mesh position={[END_X, crossbarY, 0]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[r, r, 2 * halfSpan, 12]} />
        <meshStandardMaterial color={COLORS.post} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[END_X, crossbarY + uprightHeight / 2, s * halfSpan]} castShadow>
          <cylinderGeometry args={[r * 0.8, r * 0.8, uprightHeight, 12]} />
          <meshStandardMaterial color={COLORS.post} />
        </mesh>
      ))}
    </group>
  )
}

/** Pylônes orange aux quatre coins de la zone d'en-but côté +x. */
function Pylons() {
  return [GOAL_X, END_X].flatMap((x) =>
    [-1, 1].map((s) => (
      <mesh key={`${String(x)}${String(s)}`} position={[x, 0.23, s * (HALF_W + 0.06)]} castShadow>
        <boxGeometry args={[0.1, 0.46, 0.1]} />
        <meshStandardMaterial color={COLORS.pylon} />
      </mesh>
    )),
  )
}

/** Terrain de football américain NFL (120 × 53⅓ yards) avec poteaux et tribunes. */
export function FootballField() {
  const endZoneSize: XZ = [END_X - GOAL_X, 2 * HALF_W]
  const endZoneX = (GOAL_X + END_X) / 2
  return (
    <group>
      <Area center={[0, 0]} size={[320, 240]} color={COLORS.surround} y={LAYER.ground} />
      <Area center={[0, 0]} size={[2 * GOAL_X, 2 * HALF_W]} color={COLORS.grass} y={LAYER.surface} />
      <Lines rects={STRIPES} color={COLORS.stripe} y={LAYER.paint} />
      <Area center={[endZoneX, 0]} size={endZoneSize} color={COLORS.endZoneA} y={LAYER.paint} />
      <Area center={[-endZoneX, 0]} size={endZoneSize} color={COLORS.endZoneB} y={LAYER.paint} />
      <Lines rects={BORDER_BAND} />
      <Lines rects={FIELD_LINES} />
      {NUMBERS.flatMap(({ x, label }) =>
        ([-1, 1] as const).map((side) => <YardNumber key={`${String(x)}${String(side)}`} label={label} x={x} side={side} />),
      )}
      {ARROWS.map((points, i) => (
        <Polygon key={i} points={points} color="#f8fafc" y={LAYER.line} />
      ))}
      {[0, Math.PI].map((rotation) => (
        <group key={rotation} rotation-y={rotation}>
          <Goalpost />
          <Pylons />
        </group>
      ))}
      <Stands stands={STANDS} color="#475569" />
    </group>
  )
}
