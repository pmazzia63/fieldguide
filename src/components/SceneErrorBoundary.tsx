import { Component, type ReactNode } from 'react'
import { useFieldGuide } from '../store'

interface Props {
  children: ReactNode
}

/** Remplace la scène 3D par un message si WebGL est indisponible ; la liste des postes reste utilisable. */
export class SceneErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override componentDidCatch(error: unknown) {
    console.error('Scène 3D indisponible :', error)
    const { setSceneReady, setListOpen } = useFieldGuide.getState()
    setSceneReady()
    setListOpen(true)
  }

  override render() {
    if (!this.state.failed) return this.props.children
    return (
      <p className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-400">
        La vue 3D n'a pas pu s'afficher sur cet appareil (WebGL indisponible).
      </p>
    )
  }
}
