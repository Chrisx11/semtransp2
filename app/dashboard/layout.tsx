"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast"
import { GlobalNotifications } from "@/components/global-notifications"
import { useIsMobile } from "@/components/ui/use-mobile"
import { subscribeTelaFullscreen } from "@/lib/tela-fullscreen"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, logout, verificarPermissao, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [telaFullscreen, setTelaFullscreen] = useState(false)

  const isTelaPage = pathname?.includes("/manutencoes/tela") ?? false
  const telaKiosk = isTelaPage && telaFullscreen

  useEffect(() => {
    return subscribeTelaFullscreen(setTelaFullscreen)
  }, [])

  useEffect(() => {
    if (!isTelaPage) setTelaFullscreen(false)
  }, [isTelaPage])

  // Carregar preferência de sidebar do localStorage
  useEffect(() => {
    const sidebarHiddenPreference = localStorage.getItem('sidebar_hidden')
    if (sidebarHiddenPreference !== null) {
      setSidebarHidden(sidebarHiddenPreference === 'true')
    }
  }, [])

  // Redirecionar para o login se não estiver autenticado
  useEffect(() => {
    // Esperar o carregamento da autenticação para tomar decisões
    if (!loading) {
      if (!isAuthenticated) {
        console.log("Usuário não autenticado, redirecionando para login")
        router.push("/")
      } else if (pathname) {
        // Verificar se o usuário tem permissão para acessar a página atual
        const temPermissao = verificarPermissao(pathname)
        if (!temPermissao) {
          // Não tem permissão para acessar esta página - redirecionar para o dashboard
          toast({
            variant: "destructive",
            title: "Acesso não autorizado",
            description: "Você não tem permissão para acessar esta página."
          })
          
          // Redireciona para uma página que o usuário tenha acesso
          // Se tiver acesso ao dashboard, redireciona para lá
          if (verificarPermissao("/dashboard")) {
            router.push("/dashboard")
          } else {
            // Senão, faz logout
            logout()
          }
        }
      }
    }

    setMounted(true)
  }, [isAuthenticated, pathname, router, verificarPermissao, logout, loading])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleSidebarVisibility = () => {
    const newState = !sidebarHidden
    setSidebarHidden(newState)
    localStorage.setItem('sidebar_hidden', newState ? 'true' : 'false')
    // Se ocultar, também colapsar
    // Se mostrar, manter colapsada inicialmente
    if (newState) {
      setSidebarCollapsed(true)
    } else {
      // Ao mostrar, manter colapsada (usuário pode expandir depois)
      setSidebarCollapsed(true)
    }
  }

  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <img 
              src="/icons/icon-192x192.png" 
              alt="SEMTRANSP" 
              className="h-20 w-20 animate-pulse opacity-90"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-foreground">Prefeitura Municipal de Italva</p>
            <p className="text-xs text-muted-foreground">Secretaria Municipal de Transportes</p>
          </div>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado, não renderiza nada
  if (!isAuthenticated && !loading) {
    return null
  }

  return (
    <div className="flex h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-primary/[0.03] blur-3xl dark:bg-primary/[0.06]" />
      </div>
      {!telaKiosk && !sidebarHidden && !isMobile && (
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      )}
      <div
        className="flex-1 flex flex-col relative z-10 min-w-0 overflow-x-hidden"
        style={{
          marginLeft: telaKiosk || isMobile || sidebarHidden ? "0" : sidebarCollapsed ? "64px" : "256px",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        {/* Header fixo no topo */}
        {!telaKiosk && !isMobile && (
          <DashboardHeader
            sidebarCollapsed={sidebarCollapsed}
            sidebarHidden={sidebarHidden}
            onToggleSidebarVisibility={toggleSidebarVisibility}
          />
        )}

        {/* Conteúdo principal */}
        <main
          className={
            telaKiosk
              ? "flex-1 overflow-hidden h-screen"
              : "flex-1 overflow-y-auto overflow-x-hidden"
          }
        >
          <div
            className={
              telaKiosk
                ? "h-screen w-full overflow-hidden"
                : isMobile
                  ? "px-0 pt-0 pb-0 page-transition w-full min-w-0 overflow-x-hidden"
                  : "px-5 pb-6 pt-5 page-transition lg:px-6"
            }
            style={telaKiosk || isMobile ? {} : { paddingTop: "calc(64px + 20px)" }}
          >
            {children}
          </div>
        </main>
      </div>
      <Toaster />
      <GlobalNotifications />
    </div>
  )
}
