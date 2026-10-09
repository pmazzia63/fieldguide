import { create } from 'zustand'
import type { SportId } from './types'

interface FieldGuideState {
  sport: SportId
  selectedPositionId: string | null
  setSport: (sport: SportId) => void
  selectPosition: (id: string | null) => void
}

export const useFieldGuide = create<FieldGuideState>()((set) => ({
  sport: 'basketball',
  selectedPositionId: null,
  setSport: (sport) => { set({ sport, selectedPositionId: null }) },
  selectPosition: (id) => { set({ selectedPositionId: id }) },
}))
