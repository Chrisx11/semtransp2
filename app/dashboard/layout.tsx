"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { GlobalNotifications } from "@/components/global-notifications"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, logout, verificarPermissao, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

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

  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Se não estiver autenticado, não renderiza nada
  if (!isAuthenticated && !loading) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div
        className="flex-1"
        style={{
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          transition: 'margin-left 0.3s'
        }}
      >
        {/* Conteúdo principal */}
        <main>
          <div className="px-6 pt-6 pb-6 transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
      <GlobalNotifications />
    </div>
  )
}
