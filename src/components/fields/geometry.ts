/** Point au sol (x, z) en mètres. */
export type XZ = readonly [x: number, z: number]

/** Rectangle plat posé au sol, éventuellement tourné autour de l'axe vertical. */
export interface Rect {
  x: number
  z: number
  /** Longueur selon l'axe local x (avant rotation) */
  sx: number
  /** Largeur selon l'axe local z (avant rotation) */
  sz: number
  /** Angle en radians, mesuré de +x vers +z */
  angle?: number
}

/**
 * Hauteurs des couches superposées au sol, pour éviter le z-fighting.
 * 1 cm d'écart suffit avec near = 1 jusqu'à ~200 m de distance.
 */
export const LAYER = { ground: 0, surface: 0.01, paint: 0.02, line: 0.03 } as const

/** Un mètre = 1 unité ; conversions pour les cotes officielles en unités impériales. */
export const FOOT = 0.3048
export const YARD = 0.9144
export const INCH = 0.0254

/** Segment de ligne d'épaisseur `width` entre deux points. */
export function segment([x1, z1]: XZ, [x2, z2]: XZ, width: number): Rect {
  const dx = x2 - x1
  const dz = z2 - z1
  return { x: (x1 + x2) / 2, z: (z1 + z2) / 2, sx: Math.hypot(dx, dz), sz: width, angle: Math.atan2(dz, dx) }
}

/** Contour d'un rectangle aligné sur les axes, lignes centrées sur les bords. */
export function outline([cx, cz]: XZ, sx: number, sz: number, width: number): Rect[] {
  const hx = sx / 2
  const hz = sz / 2
  return [
    { x: cx, z: cz - hz, sx: sx + width, sz: width },
    { x: cx, z: cz + hz, sx: sx + width, sz: width },
    { x: cx - hx, z: cz, sx: width, sz: sz + width },
    { x: cx + hx, z: cz, sx: width, sz: sz + width },
  ]
}

/** Point à `radius` de `center` dans la direction `angle` (de +x vers +z). */
export function polar([cx, cz]: XZ, radius: number, angle: number): XZ {
  return [cx + radius * Math.cos(angle), cz + radius * Math.sin(angle)]
}

/**
 * Les géométries 2D de three.js (ring, circle, shape) sont dans le plan XY.
 * Couchées au sol par une rotation de -π/2 autour de x, le point local (x, y)
 * devient (x, 0, -y) : un angle monde a correspond donc à l'angle local -a.
 */
export function localTheta(start: number, length: number): number {
  return -(start + length)
}
