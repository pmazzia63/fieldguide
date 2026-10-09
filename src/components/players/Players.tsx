import { Html, useCursor } from '@react-three/drei'
import { type ThreeEvent, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { type Group, MathUtils } from 'three'
import { prefersReducedMotion } from '../../media'
import { sports } from '../../sports'
import { useFieldGuide } from '../../store'
import type { Position, Sport, SportId } from '../../types'
import { LAYER } from '../fields/geometry'
import { Player } from './Player'
import { facingRotation, type PlayerStyle, playerStyle } from './playerConfig'

const LABEL_HEIGHT = 2.2
const SKIN_TONES = ['#f5d0b0', '#e8b48a', '#c68642', '#a0663d', '#7a4a2a', '#4f3020']
const RING = { selected: '#fbbf24', hovered: '#f8fafc' }
/** Vitesse d'apparition / disparition des joueurs lors d'un changement de vue (1/s). */
const SHOW_SPEED = 9

/** Teinte de peau stable pour un poste donné. */
function skinTone(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return SKIN_TONES[Math.abs(hash) % SKIN_TONES.length] ?? '#e8b48a'
}

interface PlacedPlayerProps {
  position: Position
  style: PlayerStyle
  selected: boolean
  /** Faux si le joueur appartient à une vue masquée : il rétrécit puis disparaît. */
  shown: boolean
  /** Afficher le label du poste au-dessus de la tête */
  label: boolean
  onSelect: (id: string) => void
}

/** Joueur posé à ses coordonnées, orienté, avec le label de son poste au-dessus de la tête. */
function PlacedPlayer({ position, style, selected, shown, label, onSelect }: PlacedPlayerProps) {
  const root = useRef<Group>(null)
  // Échelle initiale seulement : elle est ensuite animée dans useFrame.
  const [initialScale] = useState(shown ? 1 : 0)
  const [hoveredState, setHovered] = useState(false)
  const hovered = hoveredState && shown
  useCursor(hovered)
  const { x, z } = position

  useFrame((_, delta) => {
    const g = root.current
    const goal = shown ? 1 : 0
    if (!g || g.scale.x === goal) return
    const next = prefersReducedMotion() ? goal : MathUtils.damp(g.scale.x, goal, SHOW_SPEED, delta)
    g.scale.setScalar(Math.abs(next - goal) < 0.01 ? goal : next)
    g.visible = g.scale.x > 0
  })

  const select = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(position.id)
  }
  const hover = (value: boolean) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(value)
  }

  return (
    <group ref={root} position={[x, style.elevation ?? 0, z]} scale={initialScale} visible={initialScale > 0}>
      <group
        rotation={[0, facingRotation(style.facing, x, z), 0]}
        onClick={shown ? select : undefined}
        onPointerOver={shown ? hover(true) : undefined}
        onPointerOut={shown ? hover(false) : undefined}
      >
        <Player
          outfit={style.outfit}
          team={style.team}
          number={position.number}
          skin={skinTone(position.id)}
          highlight={selected ? 'selected' : hovered ? 'hovered' : null}
        />
      </group>
      {(selected || hovered) && (
        <mesh position={[0, LAYER.line + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 48]} />
          <meshBasicMaterial color={selected ? RING.selected : RING.hovered} transparent opacity={selected ? 1 : 0.7} />
        </mesh>
      )}
      {label && (
        <Html position={[0, LABEL_HEIGHT, 0]} center zIndexRange={[10, 0]}>
          <button
            type="button"
            // Reste monté quand le joueur est masqué : démonter un Html de drei pendant un rendu React est fragile.
            hidden={!shown}
            title={position.name}
            aria-label={position.name}
            aria-pressed={selected}
            onClick={() => { onSelect(position.id) }}
            onPointerEnter={() => { setHovered(true) }}
            onPointerLeave={() => { setHovered(false) }}
            className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold pointer-coarse:px-2.5 pointer-coarse:py-1.5 pointer-coarse:text-sm shadow ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
              selected ? 'bg-amber-400 text-slate-900 ring-amber-200' : 'bg-slate-900/80 text-white ring-white/20 hover:bg-slate-700'
            }`}
          >
            {position.abbreviation}
          </button>
        </Html>
      )}
    </group>
  )
}

/** Joueurs du sport, placés d'après src/data/<sport>.json ; seuls ceux de `viewId` sont affichés (null = tous). */
export function Players({ sport, viewId }: { sport: SportId; viewId: string | null }) {
  const data: Sport = sports[sport]
  const selectedId = useFieldGuide((s) => s.selectedPositionId)
  const selectPosition = useFieldGuide((s) => s.selectPosition)
  // Contournement : un label Html de drei créé pendant le tout premier rendu de l'application reste vide
  // et lève une erreur à son démontage. Les labels sont donc montés une fois la scène prête.
  const showLabels = useFieldGuide((s) => s.sceneReady)

  return data.views.flatMap((view) =>
    view.positions.map((position) => (
      <PlacedPlayer
        key={`${view.id}:${position.id}`}
        position={position}
        style={playerStyle(sport, view.id, position.id)}
        selected={position.id === selectedId}
        shown={viewId === null || view.id === viewId}
        label={showLabels}
        onSelect={selectPosition}
      />
    )),
  )
}
