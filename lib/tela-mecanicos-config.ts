const STORAGE_KEY = "semtransp_tela_mecanicos_ocultos"
export const TELA_MECANICOS_CONFIG_EVENT = "tela-mecanicos-config-changed"

export function getMecanicosOcultosNaTela(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []
  } catch {
    return []
  }
}

export function isMecanicoVisivelNaTela(mecanicoId: string): boolean {
  return !getMecanicosOcultosNaTela().includes(mecanicoId)
}

export function setMecanicoVisivelNaTela(mecanicoId: string, visivel: boolean): string[] {
  const ocultos = new Set(getMecanicosOcultosNaTela())
  if (visivel) {
    ocultos.delete(mecanicoId)
  } else {
    ocultos.add(mecanicoId)
  }
  const next = [...ocultos]
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(TELA_MECANICOS_CONFIG_EVENT, { detail: next }))
  }
  return next
}

export function subscribeTelaMecanicosConfig(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  const onCustom = () => onChange()
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange()
  }

  window.addEventListener(TELA_MECANICOS_CONFIG_EVENT, onCustom)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(TELA_MECANICOS_CONFIG_EVENT, onCustom)
    window.removeEventListener("storage", onStorage)
  }
}
