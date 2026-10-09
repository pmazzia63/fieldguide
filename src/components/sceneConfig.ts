import type { SportId } from '../types'

type Vec3 = [x: number, y: number, z: number]

export interface SportSceneConfig {
  /** Position initiale de la caméra et point visé */
  camera: Vec3
  target: Vec3
  minDistance: number
  maxDistance: number
  /** Boîte dans laquelle le point visé peut être déplacé (pan) */
  targetBounds: { min: Vec3; max: Vec3 }
  /** Position du soleil / de l'éclairage principal (dirigé vers l'origine) */
  sun: Vec3
  /** Demi-côté de la zone couverte par les ombres portées */
  shadowExtent: number
  /** Ciel extérieur ou salle couverte */
  outdoor: boolean
}

export const sceneConfigs: Record<SportId, SportSceneConfig> = {
  basketball: {
    camera: [0, 13, 22],
    target: [0, 0, 0],
    minDistance: 3,
    maxDistance: 55,
    targetBounds: { min: [-16, 0, -10], max: [16, 4, 10] },
    sun: [4, 30, 8],
    shadowExtent: 26,
    outdoor: false,
  },
  football: {
    camera: [0, 38, 72],
    target: [0, 0, 0],
    minDistance: 5,
    maxDistance: 200,
    targetBounds: { min: [-62, 0, -32], max: [62, 15, 32] },
    sun: [-60, 120, 70],
    shadowExtent: 95,
    outdoor: true,
  },
  baseball: {
    camera: [-75, 42, 28],
    target: [15, 0, 0],
    minDistance: 5,
    maxDistance: 260,
    targetBounds: { min: [-30, 0, -85], max: [115, 15, 85] },
    sun: [-80, 150, -60],
    shadowExtent: 165,
    outdoor: true,
  },
}
