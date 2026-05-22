export const TELA_FULLSCREEN_EVENT = "tela-fullscreen-change"

export function setTelaFullscreenAtivo(active: boolean) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(TELA_FULLSCREEN_EVENT, { detail: { active } })
  )
}

export function subscribeTelaFullscreen(
  onChange: (active: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => {}

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ active: boolean }>).detail
    onChange(!!detail?.active)
  }

  window.addEventListener(TELA_FULLSCREEN_EVENT, handler)
  return () => window.removeEventListener(TELA_FULLSCREEN_EVENT, handler)
}
