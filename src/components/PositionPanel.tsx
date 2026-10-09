import { useEffect, useId, useRef } from 'react'
import { findPosition, sports } from '../sports'
import { useFieldGuide } from '../store'
import { CloseButton, Sheet } from './Sheet'

/** Fiche du poste sélectionné : description, rôle et joueurs célèbres. Échap, ✕ ou glissement pour fermer. */
export function PositionPanel() {
  const sport = useFieldGuide((s) => s.sport)
  const selectedId = useFieldGuide((s) => s.selectedPositionId)
  const selectPosition = useFieldGuide((s) => s.selectPosition)
  const titleId = useId()
  const title = useRef<HTMLHeadingElement>(null)
  const found = selectedId ? findPosition(sport, selectedId) : null

  // Annonce la fiche aux lecteurs d'écran et y place le clavier.
  useEffect(() => {
    title.current?.focus({ preventScroll: true })
  }, [selectedId])

  if (!found) return null
  const { view, position } = found
  const showView = sports[sport].views.length > 1
  const close = () => { selectPosition(null) }

  return (
    // La clé rejoue l'animation d'ouverture et remet le glissement à zéro à chaque poste.
    <Sheet key={position.id} side="right" labelledBy={titleId} onClose={close}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-amber-300 uppercase">
            {sports[sport].name}
            {showView && ` · ${view.name}`}
          </p>
          <h2 id={titleId} ref={title} tabIndex={-1} className="mt-1 text-xl font-semibold outline-none">
            {position.name}{' '}
            <span className="text-sm font-medium text-slate-400">
              ({position.abbreviation}) · n° {position.number}
            </span>
          </h2>
        </div>
        <CloseButton onClick={close} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-200">{position.description}</p>

      <h3 className="mt-5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Rôle</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-200">{position.role}</p>

      {position.famousPlayers.length > 0 && (
        <>
          <h3 className="mt-5 text-xs font-semibold tracking-wide text-slate-400 uppercase">Joueurs célèbres</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {position.famousPlayers.map((player) => (
              <li key={player.wikipediaUrl}>
                <a
                  href={player.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-sky-200 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400 pointer-coarse:py-2"
                >
                  {player.name}
                  <span className="sr-only"> (Wikipedia, nouvel onglet)</span>
                  <span aria-hidden="true" className="text-xs">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  )
}
