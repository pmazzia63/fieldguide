import { useId } from 'react'
import { isNarrowScreen } from '../media'
import { sports } from '../sports'
import { useFieldGuide } from '../store'
import type { Sport } from '../types'
import { CloseButton, Sheet } from './Sheet'

/** Identifiant du panneau, référencé par le bouton qui l'ouvre (aria-controls). */
export const POSITION_LIST_ID = 'position-list'

/** Liste textuelle des postes du sport affiché : alternative accessible à la scène 3D. */
export function PositionList() {
  const open = useFieldGuide((s) => s.listOpen)
  const sport = useFieldGuide((s) => s.sport)
  const selectedId = useFieldGuide((s) => s.selectedPositionId)
  const selectPosition = useFieldGuide((s) => s.selectPosition)
  const setListOpen = useFieldGuide((s) => s.setListOpen)
  const titleId = useId()
  if (!open) return null

  const data: Sport = sports[sport]
  const close = () => { setListOpen(false) }
  const select = (id: string) => {
    selectPosition(id)
    // Sur mobile, la fiche du poste prend la place de la liste.
    if (isNarrowScreen()) close()
  }

  return (
    <Sheet id={POSITION_LIST_ID} side="left" labelledBy={titleId} onClose={close}>
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-lg font-semibold">
          Postes · {data.name}
        </h2>
        <CloseButton label="Fermer la liste" onClick={close} />
      </div>
      {data.views.map((view) => (
        <section key={view.id} aria-label={view.name} className="mt-4">
          {data.views.length > 1 && (
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-amber-300 uppercase">{view.name}</h3>
          )}
          <ul className="-mx-2 flex flex-col">
            {view.positions.map((position) => (
              <li key={position.id}>
                <button
                  type="button"
                  aria-pressed={position.id === selectedId}
                  onClick={() => { select(position.id) }}
                  className={`flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                    position.id === selectedId ? 'bg-amber-400/15' : 'hover:bg-white/10'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 w-10 shrink-0 rounded bg-slate-800 py-0.5 text-center text-xs font-semibold text-slate-200 ring-1 ring-white/10"
                  >
                    {position.abbreviation}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-100">{position.name}</span>
                    <span className="block text-xs leading-snug text-slate-400">{position.role}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Sheet>
  )
}
