import { CanvasTexture, SRGBColorSpace } from 'three'

const SIZE = 128
const cache = new Map<string, CanvasTexture>()

/** Texture transparente portant un numéro de maillot, partagée entre joueurs identiques. */
export function jerseyNumberTexture(value: number, color: string): CanvasTexture {
  const key = `${String(value)}:${color}`
  const cached = cache.get(key)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const text = String(value)
    ctx.font = `800 ${String(SIZE * 0.78)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    // Les numéros à deux chiffres sont resserrés pour tenir dans le carré.
    const width = ctx.measureText(text).width
    const squeeze = Math.min(1, (SIZE * 0.92) / width)
    ctx.translate(SIZE / 2, SIZE / 2 + SIZE * 0.04)
    ctx.scale(squeeze, 1)
    ctx.fillText(text, 0, 0)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  cache.set(key, texture)
  return texture
}
