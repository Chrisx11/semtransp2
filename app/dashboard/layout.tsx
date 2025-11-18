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
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Ícone */}
          <div className="relative">
            <img 
              src="/icons/icon-192x192.png" 
              alt="SEMTRANSP" 
              className="w-24 h-24 animate-pulse"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          </div>
          
          {/* Texto */}
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-gray-700">Prefeitura Municipal de Italva</p>
            <p className="text-xs text-gray-600">Secretaria Municipal de Transportes</p>
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
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
      {/* Padrão de fundo sutil */}
      <div 
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
      {!sidebarHidden && !isMobile && (
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      )}
      <div
        className="flex-1 flex flex-col relative z-10 min-w-0 overflow-x-hidden"
        style={{
          marginLeft: isMobile || sidebarHidden ? '0' : (sidebarCollapsed ? '64px' : '256px'),
          transition: 'margin-left 0.3s ease-in-out'
        }}
      >
        {/* Header fixo no topo */}
        {!isMobile && (
          <DashboardHeader 
            sidebarCollapsed={sidebarCollapsed} 
            sidebarHidden={sidebarHidden}
            onToggleSidebarVisibility={toggleSidebarVisibility}
          />
        )}
        
        {/* Conteúdo principal com padding-top para compensar o header */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className={isMobile ? "px-0 pt-0 pb-0 page-transition w-full min-w-0 overflow-x-hidden" : "px-6 pt-6 pb-6 page-transition"} style={isMobile ? {} : { paddingTop: 'calc(68px + 24px)' }}>
            {children}
          </div>
        </main>
      </div>
      <Toaster />
      <GlobalNotifications />
    </div>
  )
}
