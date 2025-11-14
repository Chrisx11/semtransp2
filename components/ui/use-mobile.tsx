import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Verificar se está no cliente
    if (typeof window === "undefined") return

    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Verificar imediatamente
    checkMobile()

    // Criar media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Adicionar listener para mudanças (usando addEventListener moderno)
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // Adicionar listener (suporta tanto addEventListener quanto addListener para compatibilidade)
    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange)
    } else {
      // Fallback para navegadores antigos
      mql.addListener(() => setIsMobile(mql.matches))
    }

    // Também adicionar listener de resize como fallback
    window.addEventListener("resize", checkMobile)

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handleChange)
      } else {
        // Fallback para navegadores antigos - não podemos remover o listener específico
        // mas isso é ok pois o componente será desmontado
      }
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return isMobile
}
