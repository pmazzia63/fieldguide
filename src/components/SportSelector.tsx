import { sportIds, sports } from '../sports'
import { useFieldGuide } from '../store'
import type { Sport } from '../types'
import { SegmentedControl } from './SegmentedControl'

const ALL_VIEWS = 'all'
const sportOptions = sportIds.map((id) => ({ id, label: sports[id].name }))

/** Choix de la vue (ex. attaque / défense), pour les sports qui en ont plusieurs. */
function ViewToggle() {
  const sport = useFieldGuide((s) => s.sport)
  const viewId = useFieldGuide((s) => s.viewId)
  const setView = useFieldGuide((s) => s.setView)
  const data: Sport = sports[sport]
  if (data.views.length < 2) return null

  const options = [{ id: ALL_VIEWS, label: 'Tous' }, ...data.views.map((v) => ({ id: v.id, label: v.shortName }))]
  return (
    <SegmentedControl
      label="Joueurs affichés"
      size="sm"
      options={options}
      value={viewId ?? ALL_VIEWS}
      onChange={(id) => { setView(id === ALL_VIEWS ? null : id) }}
    />
  )
}

/** Choix du sport et de la vue, en bas de l'écran. */
export function SportSelector() {
  const requested = useFieldGuide((s) => s.requestedSport)
  const requestSport = useFieldGuide((s) => s.requestSport)
  return (
    <nav
      aria-label="Choix du sport"
      className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <ViewToggle />
      <SegmentedControl label="Sport" options={sportOptions} value={requested} onChange={requestSport} />
    </nav>
  )
}
