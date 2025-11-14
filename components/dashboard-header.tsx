"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { SoundToggle } from "@/components/sound-toggle"
import { Menu, X } from "lucide-react"

interface DashboardHeaderProps {
  sidebarCollapsed: boolean
  sidebarHidden: boolean
  onToggleSidebarVisibility: () => void
}

// Mapeamento de rotas para títulos e descrições
const pageInfo: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Visão geral do sistema",
  },
  "/dashboard/veiculos": {
    title: "Veículos",
    description: "Gerenciamento de veículos",
  },
  "/dashboard/produtos": {
    title: "Produtos",
    description: "Gerenciamento de produtos",
  },
  "/dashboard/colaboradores": {
    title: "Colaboradores",
    description: "Gerenciamento de colaboradores",
  },
  "/dashboard/movimento/entradas": {
    title: "Entradas",
    description: "Gerenciamento de entradas de produtos",
  },
  "/dashboard/movimento/saidas": {
    title: "Saídas",
    description: "Gerenciamento de saídas de produtos",
  },
  "/dashboard/servico-externo/borracharia": {
    title: "Borracharia",
    description: "Autorizações para borracharia",
  },
  "/dashboard/servico-externo/lavador": {
    title: "Lavador",
    description: "Autorizações para serviços de lavagem",
  },
  "/dashboard/filtros": {
    title: "Filtros",
    description: "Gerenciamento de filtros dos veículos",
  },
  "/dashboard/manutencoes/painel": {
    title: "Painel de Manutenções",
    description: "Visão geral das manutenções",
  },
  "/dashboard/manutencoes/ordem-servico": {
    title: "Ordens de Serviço",
    description: "Gerenciamento de ordens de serviço",
  },
  "/dashboard/manutencoes/planejamento": {
    title: "Planejamento",
    description: "Planejamento de manutenções",
  },
  "/dashboard/manutencoes/troca-oleo": {
    title: "Troca de Óleo",
    description: "Gerenciamento de trocas de óleo",
  },
  "/dashboard/manutencoes/troca-pneu": {
    title: "Troca de Pneu",
    description: "Gerenciamento de trocas de pneu",
  },
  "/dashboard/manutencoes/historicos": {
    title: "Históricos de Manutenção",
    description: "Consulta de históricos de manutenção",
  },
  "/dashboard/manutencoes/tela": {
    title: "Tela de Manutenções",
    description: "Visualização em tela de manutenções",
  },
  "/dashboard/custo-veiculo": {
    title: "Custo por Veículo",
    description: "Análise de custos por veículo",
  },
  "/dashboard/planner": {
    title: "Planner",
    description: "Agendamento de compromissos",
  },
  "/dashboard/configuracoes": {
    title: "Configurações",
    description: "Configurações do sistema",
  },
}

export function DashboardHeader({ sidebarCollapsed, sidebarHidden, onToggleSidebarVisibility }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const handleLogout = () => {
    logout()
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    })
    router.push("/")
  }

  // Buscar informações da página atual
  // Tratar rotas dinâmicas (com [id])
  const getPageInfo = () => {
    if (!pathname) {
      return { title: "Dashboard", description: "Sistema de gestão" }
    }

    // Verificar se há uma correspondência exata
    if (pageInfo[pathname]) {
      return pageInfo[pathname]
    }

    // Verificar rotas dinâmicas (ex: /dashboard/manutencoes/ordem-servico/[id])
    if (pathname.startsWith("/dashboard/manutencoes/ordem-servico/")) {
      return {
        title: "Detalhes da Ordem de Serviço",
        description: "Visualização detalhada da ordem de serviço",
      }
    }

    // Verificar se começa com algum caminho conhecido
    for (const route in pageInfo) {
      if (pathname.startsWith(route) && route !== "/dashboard") {
        return pageInfo[route]
      }
    }

    return { title: "Dashboard", description: "Sistema de gestão" }
  }

  const currentPageInfo = getPageInfo()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-gradient-to-r from-background/95 via-background/90 to-background/95 backdrop-blur-xl shadow-sm"
      style={{
        height: '68px',
        marginLeft: sidebarHidden ? '0' : (sidebarCollapsed ? '64px' : '256px'),
        transition: 'margin-left 0.3s ease-in-out',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Lado esquerdo - Botão de menu e título */}
        <div className="flex items-center gap-3">
          {/* Botão para mostrar/ocultar sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebarVisibility}
            className="relative h-9 w-9 hover:bg-accent/50"
            aria-label={sidebarHidden ? "Mostrar menu lateral" : "Ocultar menu lateral"}
            title={sidebarHidden ? "Mostrar menu lateral" : "Ocultar menu lateral"}
          >
            {sidebarHidden ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>
          
          {/* Título e descrição da página */}
          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-semibold tracking-tight leading-none">
              {currentPageInfo.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 leading-none">
              {currentPageInfo.description}
            </p>
          </div>
        </div>

        {/* Lado direito - ações do usuário */}
        <div className="flex items-center gap-3">
          {/* Toggle de tema */}
          <ThemeToggle />
          
          {/* Toggle de som */}
          <SoundToggle />
          
          {/* Dropdown de notificações */}
          <NotificationsDropdown />
          
          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-3 hover:bg-accent/50"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.nome || user?.login || "Usuário"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.nome || user?.login || "Usuário"}
                  </p>
                  {user?.login && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.login}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

