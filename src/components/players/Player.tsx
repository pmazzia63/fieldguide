import { createContext, type ReactNode, useContext } from 'react'
import {
  type BufferGeometry,
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { jerseyNumberTexture } from './jerseyNumber'
import type { Outfit, TeamColors } from './playerConfig'

// Joueur procédural d'environ 1,88 m, pieds en y = 0, regard vers +z.
// Sa gauche est côté +x (SIDES : 1 = gauche, -1 = droite).
type Vec3 = [x: number, y: number, z: number]

const SIDES = [1, -1] as const
const HIP_X = 0.1
const LEG_Y = 0.515
const PELVIS_Y = 0.98
const TORSO_Y = 1.3
const SHOULDER_Y = 1.5
const HEAD_Y = 1.76
const ARM_SPREAD = 0.12 // écartement des bras, en radians
const HAND_Y = -0.58 // position de la main sous l'épaule

const COLORS = { shoe: '#111827', facemask: '#9ca3af', leather: '#7c3f12', bat: '#d4a373' }

// Géométries partagées par tous les joueurs (jamais libérées : elles vivent autant que l'application).
const GEO = {
  leg: new CapsuleGeometry(0.075, 0.72, 4, 12),
  shoe: new BoxGeometry(0.11, 0.08, 0.27),
  pelvis: new RoundedBoxGeometry(0.38, 0.22, 0.24, 2, 0.06),
  torso: new RoundedBoxGeometry(0.42, 0.55, 0.24, 3, 0.07),
  torsoPadded: new RoundedBoxGeometry(0.46, 0.55, 0.28, 3, 0.08),
  neck: new CylinderGeometry(0.06, 0.065, 0.14, 12),
  head: new SphereGeometry(0.12, 20, 14),
  arm: new CapsuleGeometry(0.052, 0.46, 4, 12),
  hand: new SphereGeometry(0.055, 12, 8),
  sleeve: new CylinderGeometry(0.072, 0.066, 0.2, 12),
  number: new PlaneGeometry(1, 1),
  // Bas
  shorts: new CylinderGeometry(0.112, 0.104, 0.36, 14),
  kneePants: new CylinderGeometry(0.096, 0.088, 0.44, 14),
  longPants: new CylinderGeometry(0.096, 0.084, 0.56, 14),
  lowSocks: new CylinderGeometry(0.08, 0.078, 0.12, 12),
  highSocks: new CylinderGeometry(0.083, 0.079, 0.38, 12),
  midSocks: new CylinderGeometry(0.082, 0.079, 0.3, 12),
  // Foot US : casque à visage ouvert, grille et épaulières
  helmetCrown: new SphereGeometry(0.15, 24, 12, 0, Math.PI * 2, 0, 1.3),
  helmetSides: new SphereGeometry(0.15, 24, 6, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 1.3, 0.75),
  facemaskBar: new TorusGeometry(0.15, 0.009, 6, 20, Math.PI),
  facemaskPost: new CylinderGeometry(0.008, 0.008, 0.08, 6),
  shoulderPads: new RoundedBoxGeometry(0.64, 0.16, 0.38, 3, 0.07),
  // Baseball : casquette, casque de frappeur, gant et batte
  capCrown: new SphereGeometry(0.128, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  capBrim: new CylinderGeometry(0.1, 0.1, 0.012, 20),
  battingHelmet: new SphereGeometry(0.138, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2 + 0.1),
  earFlap: new CylinderGeometry(0.06, 0.06, 0.02, 16),
  glove: new RoundedBoxGeometry(0.08, 0.21, 0.17, 2, 0.035),
  bat: new CylinderGeometry(0.033, 0.014, 0.84, 12),
}

/** Surbrillance appliquée à toutes les pièces du joueur (survol ou sélection). */
export type Highlight = 'hovered' | 'selected' | null

const HIGHLIGHT_EMISSIVE = {
  hovered: { color: '#f8fafc', intensity: 0.18 },
  selected: { color: '#fbbf24', intensity: 0.3 },
} as const

const HighlightContext = createContext<Highlight>(null)

interface Garment {
  geometry: BufferGeometry
  y: number
}

/** Silhouette et vêtements propres à chaque tenue. */
interface BodySpec {
  torso: BufferGeometry
  torsoDepth: number
  shoulderX: number
  /** Manches courtes (sinon débardeur, bras nus) */
  sleeves: boolean
  pants: Garment
  socks: Garment
  backNumberY: number
  frontNumber: boolean
}

const BASEBALL_BODY: BodySpec = {
  torso: GEO.torso,
  torsoDepth: 0.24,
  shoulderX: 0.25,
  sleeves: true,
  pants: { geometry: GEO.longPants, y: 0.66 },
  socks: { geometry: GEO.midSocks, y: 0.24 },
  backNumberY: TORSO_Y + 0.04,
  frontNumber: false,
}

const BODIES: Record<Outfit, BodySpec> = {
  basketball: {
    torso: GEO.torso,
    torsoDepth: 0.24,
    shoulderX: 0.25,
    sleeves: false,
    pants: { geometry: GEO.shorts, y: 0.78 },
    socks: { geometry: GEO.lowSocks, y: 0.14 },
    backNumberY: TORSO_Y + 0.04,
    frontNumber: true,
  },
  football: {
    torso: GEO.torsoPadded,
    torsoDepth: 0.28,
    shoulderX: 0.31,
    sleeves: true,
    pants: { geometry: GEO.kneePants, y: 0.72 },
    socks: { geometry: GEO.highSocks, y: 0.29 },
    backNumberY: TORSO_Y - 0.02, // sous les épaulières
    frontNumber: true,
  },
  'baseball-fielder': BASEBALL_BODY,
  'baseball-batter': BASEBALL_BODY,
}

interface PartProps {
  geometry: BufferGeometry
  color: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
  doubleSide?: boolean
}

function Part({ geometry, color, position, rotation, scale, doubleSide }: PartProps) {
  const highlight = useContext(HighlightContext)
  const emissive = highlight ? HIGHLIGHT_EMISSIVE[highlight] : null
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.75}
        side={doubleSide ? DoubleSide : undefined}
        emissive={emissive?.color ?? '#000000'}
        emissiveIntensity={emissive?.intensity ?? 0}
      />
    </mesh>
  )
}

interface ArmProps {
  side: 1 | -1
  shoulderX: number
  skin: string
  sleeve: string | null
  /** Objet tenu, positionné par rapport à l'épaule */
  children?: ReactNode
}

function Arm({ side, shoulderX, skin, sleeve, children }: ArmProps) {
  return (
    <group position={[side * shoulderX, SHOULDER_Y, 0]} rotation={[0, 0, side * ARM_SPREAD]}>
      <Part geometry={GEO.arm} color={skin} position={[0, -0.28, 0]} />
      {sleeve && <Part geometry={GEO.sleeve} color={sleeve} position={[0, -0.09, 0]} />}
      <Part geometry={GEO.hand} color={skin} position={[0, HAND_Y, 0]} />
      {children}
    </group>
  )
}

function JerseyNumber({ value, color, y, z, size }: { value: number; color: string; y: number; z: number; size: number }) {
  return (
    <mesh geometry={GEO.number} position={[0, y, z]} rotation={[0, z < 0 ? Math.PI : 0, 0]} scale={[size, size, 1]}>
      <meshStandardMaterial map={jerseyNumberTexture(value, color)} alphaTest={0.5} roughness={0.75} />
    </mesh>
  )
}

function FootballHelmet({ color }: { color: string }) {
  const y = HEAD_Y + 0.02
  return (
    <>
      <Part geometry={GEO.helmetCrown} color={color} position={[0, y, 0]} doubleSide />
      <Part geometry={GEO.helmetSides} color={color} position={[0, y, 0]} doubleSide />
      {[y - 0.04, y - 0.085].map((barY) => (
        <Part key={barY} geometry={GEO.facemaskBar} color={COLORS.facemask} position={[0, barY, 0]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
      <Part geometry={GEO.facemaskPost} color={COLORS.facemask} position={[0, y - 0.06, 0.15]} />
    </>
  )
}

function Cap({ color }: { color: string }) {
  return (
    <>
      <Part geometry={GEO.capCrown} color={color} position={[0, HEAD_Y + 0.005, 0]} />
      <Part geometry={GEO.capBrim} color={color} position={[0, HEAD_Y + 0.01, 0.13]} scale={[1, 1, 0.75]} />
    </>
  )
}

function BattingHelmet({ color }: { color: string }) {
  return (
    <>
      <Part geometry={GEO.battingHelmet} color={color} position={[0, HEAD_Y, 0]} doubleSide />
      <Part geometry={GEO.capBrim} color={color} position={[0, HEAD_Y + 0.005, 0.125]} scale={[0.85, 1, 0.55]} />
      {/* Protège-oreille côté lanceur (frappeur droitier : à gauche) */}
      <Part geometry={GEO.earFlap} color={color} position={[0.125, HEAD_Y - 0.05, 0]} rotation={[0, 0, Math.PI / 2]} />
    </>
  )
}

export interface PlayerProps {
  outfit: Outfit
  team: TeamColors
  number: number
  skin: string
  highlight?: Highlight
}

/** Joueur générique : corps, tête, maillot numéroté et accessoires de la tenue. */
export function Player({ outfit, team, number, skin, highlight = null }: PlayerProps) {
  const body = BODIES[outfit]
  const backZ = -(body.torsoDepth / 2 + 0.004)
  const sleeve = body.sleeves ? team.jersey : null

  return (
    <HighlightContext value={highlight}>
      {SIDES.map((side) => (
        <group key={side} position={[side * HIP_X, 0, 0]}>
          <Part geometry={GEO.leg} color={skin} position={[0, LEG_Y, 0]} />
          <Part geometry={body.pants.geometry} color={team.pants} position={[0, body.pants.y, 0]} />
          <Part geometry={body.socks.geometry} color={team.accent} position={[0, body.socks.y, 0]} />
          <Part geometry={GEO.shoe} color={COLORS.shoe} position={[0, 0.04, 0.04]} />
        </group>
      ))}
      <Part geometry={GEO.pelvis} color={team.pants} position={[0, PELVIS_Y, 0]} />

      <Part geometry={body.torso} color={team.jersey} position={[0, TORSO_Y, 0]} />
      {outfit === 'football' && <Part geometry={GEO.shoulderPads} color={team.jersey} position={[0, 1.52, 0]} />}
      <JerseyNumber value={number} color={team.accent} y={body.backNumberY} z={backZ} size={0.27} />
      {body.frontNumber && <JerseyNumber value={number} color={team.accent} y={TORSO_Y + 0.06} z={-backZ} size={0.17} />}

      <Part geometry={GEO.neck} color={skin} position={[0, 1.62, 0]} />
      <Part geometry={GEO.head} color={skin} position={[0, HEAD_Y, 0]} />
      {outfit === 'football' && <FootballHelmet color={team.headgear} />}
      {outfit === 'baseball-fielder' && <Cap color={team.headgear} />}
      {outfit === 'baseball-batter' && <BattingHelmet color={team.headgear} />}

      <Arm side={1} shoulderX={body.shoulderX} skin={skin} sleeve={sleeve}>
        {outfit === 'baseball-fielder' && (
          <Part geometry={GEO.glove} color={COLORS.leather} position={[0.03, HAND_Y - 0.03, 0.02]} />
        )}
      </Arm>
      <Arm side={-1} shoulderX={body.shoulderX} skin={skin} sleeve={sleeve}>
        {outfit === 'baseball-batter' && (
          // Batte tenue dans la main droite, inclinée vers l'avant
          <group position={[0, HAND_Y, 0]} rotation={[0.6, 0, 0]}>
            <Part geometry={GEO.bat} color={COLORS.bat} position={[0, 0.38, 0]} />
          </group>
        )}
      </Arm>
    </HighlightContext>
  )
}
