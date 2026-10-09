// Préférences et capacités de l'appareil, lues au moment de l'appel.

const matches = (query: string) => typeof window !== 'undefined' && window.matchMedia(query).matches

/** L'utilisateur a demandé à limiter les animations. */
export const prefersReducedMotion = () => matches('(prefers-reduced-motion: reduce)')

/** Écran tactile sans pointeur précis (téléphone, tablette). */
export const isCoarsePointer = () => matches('(pointer: coarse)')

/** Écran plus étroit que le point de rupture `sm` de Tailwind (40rem). */
export const isNarrowScreen = () => !matches('(min-width: 40rem)')
