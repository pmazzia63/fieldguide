import { useMemo } from 'react'
import { Shape } from 'three'
import type { XZ } from './geometry'

export interface StandProps {
  /** Milieu du bord avant (côté terrain), au sol */
  front: XZ
  /** Direction dans laquelle la tribune s'éloigne du terrain (de +x vers +z), en radians */
  outward: number
  /** Longueur de la tribune le long du terrain */
  length: number
  rows: number
  /** Hauteur du muret avant */
  base?: number
  rowDepth?: number
  rowHeight?: number
  color?: string
}

/** Tribune simplifiée : un profil en gradins extrudé sur sa longueur. */
export function Stand({
  front,
  outward,
  length,
  rows,
  base = 1.2,
  rowDepth = 0.85,
  rowHeight = 0.42,
  color = '#475569',
}: StandProps) {
  // Profil dans le plan local (x = profondeur, y = hauteur), extrudé selon z.
  const profile = useMemo(() => {
    const s = new Shape()
    s.moveTo(0, 0)
    s.lineTo(0, base)
    for (let i = 0; i < rows; i++) {
      s.lineTo(i * rowDepth, base + i * rowHeight)
      s.lineTo((i + 1) * rowDepth, base + i * rowHeight)
    }
    s.lineTo(rows * rowDepth, base + rows * rowHeight + 1)
    s.lineTo(rows * rowDepth + 0.3, base + rows * rowHeight + 1)
    s.lineTo(rows * rowDepth + 0.3, 0)
    s.closePath()
    return s
  }, [rows, base, rowDepth, rowHeight])

  return (
    // La rotation y = -outward aligne l'axe local x sur la direction `outward`.
    <group position={[front[0], 0, front[1]]} rotation={[0, -outward, 0]}>
      <mesh position={[0, 0, -length / 2]} castShadow receiveShadow>
        <extrudeGeometry args={[profile, { depth: length, bevelEnabled: false }]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  )
}

/** Plusieurs tribunes partageant les mêmes réglages par défaut. */
export function Stands({ stands, ...defaults }: Omit<StandProps, 'front' | 'outward' | 'length' | 'rows'> & {
  stands: readonly Pick<StandProps, 'front' | 'outward' | 'length' | 'rows'>[]
}) {
  return stands.map((s, i) => <Stand key={i} {...defaults} {...s} />)
}
