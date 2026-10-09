import { create } from 'zustand'
import { findPosition } from './sports'
import type { SportId } from './types'

interface FieldGuideState {
  /** Sport affiché dans la scène */
  sport: SportId
  /** Sport choisi ; diffère de `sport` pendant le fondu de transition */
  requestedSport: SportId
  /** Vue affichée pour un sport à plusieurs vues (ex. attaque / défense) ; null = toutes */
  viewId: string | null
  selectedPositionId: string | null
  /** Liste textuelle des postes ouverte */
  listOpen: boolean
  /** Premier rendu de la scène 3D terminé (ou scène indisponible) */
  sceneReady: boolean
  /** Incrémenté à chaque demande de recentrage de la caméra */
  cameraResets: number
  requestSport: (sport: SportId) => void
  /** Termine la transition : affiche le sport demandé. */
  commitSport: () => void
  setView: (viewId: string | null) => void
  /** Sélectionne un poste ; affiche sa vue si elle était masquée. */
  selectPosition: (id: string | null) => void
  setListOpen: (open: boolean) => void
  setSceneReady: () => void
  resetCamera: () => void
}

export const useFieldGuide = create<FieldGuideState>()((set, get) => ({
  sport: 'basketball',
  requestedSport: 'basketball',
  viewId: null,
  selectedPositionId: null,
  listOpen: false,
  sceneReady: false,
  cameraResets: 0,
  requestSport: (sport) => { set({ requestedSport: sport, selectedPositionId: null }) },
  commitSport: () => { set((s) => ({ sport: s.requestedSport, viewId: null, selectedPositionId: null })) },
  setView: (viewId) => {
    const { sport, selectedPositionId } = get()
    const selectedView = selectedPositionId ? findPosition(sport, selectedPositionId)?.view.id : undefined
    set({ viewId, selectedPositionId: viewId === null || selectedView === viewId ? selectedPositionId : null })
  },
  selectPosition: (id) => {
    const { sport, viewId } = get()
    const view = id ? findPosition(sport, id)?.view.id : undefined
    set({ selectedPositionId: id, viewId: viewId !== null && view !== undefined && view !== viewId ? view : viewId })
  },
  setListOpen: (open) => { set({ listOpen: open }) },
  setSceneReady: () => { set({ sceneReady: true }) },
  resetCamera: () => { set((s) => ({ cameraResets: s.cameraResets + 1 })) },
}))
