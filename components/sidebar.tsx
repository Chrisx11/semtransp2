"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import {
  BarChart3,
  Users,
  Car,
  Package,
  ArrowDownUp,
  Settings,
  ChevronDown,
  PenToolIcon as Tool,
  ArrowRight,
  ArrowLeft,
  FileText,
  FuelIcon as Oil,
  History,
  AlertCircle,
  CalendarRange,
  Disc,
  Briefcase,
  Store,
  Wrench,
  Droplets,
  FolderOpen,
  ClipboardList,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  isSubmenu?: boolean;
  isOpen?: boolean;
  toggle?: () => void;
  submenu?: MenuItem[];
  onClick?: (e: React.MouseEvent) => void;
  requiredPermission?: { modulo: string; acao: string; submodulo?: boolean; pagina?: string };
  desktopOnly?: boolean;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { verificarPermissao } = useAuth()
  const [openCadastros, setOpenCadastros] = useState(false)
  const [openMovimento, setOpenMovimento] = useState(false)
  const [openManutencoes, setOpenManutencoes] = useState(false)
  const [openServicos, setOpenServicos] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [openCollapsedSubmenu, setOpenCollapsedSubmenu] = useState<string | null>(null)
  const [submenuPosition, setSubmenuPosition] = useState<number | null>(null)
  const [menuMode, setMenuMode] = useState<"simple" | "sophisticated">("sophisticated")

  // Referência para detectar cliques fora do submenu
  const submenuRef = useRef<HTMLDivElement>(null)

  // Evita problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const savedMode = localStorage.getItem("sidebar_menu_mode")
    if (savedMode === "simple" || savedMode === "sophisticated") {
      setMenuMode(savedMode)
    }
  }, [])

  useEffect(() => {
    const cad = localStorage.getItem("sidebar_open_cadastros")
    const mov = localStorage.getItem("sidebar_open_movimento")
    const man = localStorage.getItem("sidebar_open_manutencoes")
    const srv = localStorage.getItem("sidebar_open_servicos")
    if (cad !== null) setOpenCadastros(cad === "true")
    if (mov !== null) setOpenMovimento(mov === "true")
    if (man !== null) setOpenManutencoes(man === "true")
    if (srv !== null) setOpenServicos(srv === "true")
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebar_open_cadastros", openCadastros ? "true" : "false")
  }, [openCadastros])
  useEffect(() => {
    localStorage.setItem("sidebar_open_movimento", openMovimento ? "true" : "false")
  }, [openMovimento])
  useEffect(() => {
    localStorage.setItem("sidebar_open_manutencoes", openManutencoes ? "true" : "false")
  }, [openManutencoes])
  useEffect(() => {
    localStorage.setItem("sidebar_open_servicos", openServicos ? "true" : "false")
  }, [openServicos])

  useEffect(() => {
    localStorage.setItem("sidebar_menu_mode", menuMode)
  }, [menuMode])

  // Fechar submenu quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        setOpenCollapsedSubmenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Verifica se o caminho atual está em uma das subseções
  useEffect(() => {
    if (pathname?.includes("/dashboard/colaboradores") || 
        pathname?.includes("/dashboard/veiculos") || 
        pathname?.includes("/dashboard/documentos") ||
        pathname?.includes("/dashboard/produtos") || 
        pathname?.includes("/dashboard/filtros")) {
      setOpenCadastros(true)
    }
    if (pathname?.includes("/dashboard/movimento")) {
      setOpenMovimento(true)
    }
    if (pathname?.includes("/dashboard/manutencoes")) {
      setOpenManutencoes(true)
    }
    if (pathname?.includes("/dashboard/custo-veiculo") || 
        pathname?.includes("/dashboard/servico-externo/borracharia") || 
        pathname?.includes("/dashboard/servico-externo/lavador") ||
        pathname?.includes("/dashboard/servico-externo/servico-externo")) {
      setOpenServicos(true)
    }
  }, [pathname])

  const isDarkTheme = theme === "dark"

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      requiredPermission: { modulo: "dashboard", acao: "visualizar" }
    },
    {
      title: "Cadastros",
      icon: FolderOpen,
      isSubmenu: true,
      isOpen: openCadastros,
      toggle: () => setOpenCadastros(!openCadastros),
      submenu: [
        {
          title: "Colaboradores",
          href: "/dashboard/colaboradores",
          icon: Users,
          requiredPermission: { modulo: "veiculos", acao: "visualizar" }
        },
        {
          title: "Veículos",
          href: "/dashboard/veiculos",
          icon: Car,
          requiredPermission: { modulo: "veiculos", acao: "visualizar" }
        },
        {
          title: "Documentos",
          href: "/dashboard/documentos",
          icon: FileText,
          requiredPermission: { modulo: "veiculos", acao: "visualizar" },
          desktopOnly: true
        },
        {
          title: "Produtos",
          href: "/dashboard/produtos",
          icon: Package,
          requiredPermission: { modulo: "produtos", acao: "visualizar" }
        },
        {
          title: "Filtros",
          href: "/dashboard/filtros",
          icon: Oil,
          requiredPermission: { modulo: "produtos", acao: "visualizar" }
        },
      ],
    },
    {
      title: "Movimento",
      icon: ArrowDownUp,
      isSubmenu: true,
      isOpen: openMovimento,
      toggle: () => setOpenMovimento(!openMovimento),
      requiredPermission: { modulo: "produtos", acao: "visualizar" },
      submenu: [
        {
          title: "Entradas",
          href: "/dashboard/movimento/entradas",
          icon: ArrowRight,
          requiredPermission: { modulo: "produtos", acao: "visualizar" }
        },
        {
          title: "Saídas",
          href: "/dashboard/movimento/saidas",
          icon: ArrowLeft,
          requiredPermission: { modulo: "produtos", acao: "visualizar" }
        },
      ],
    },
    {
      title: "Manutenções",
      icon: Tool,
      isSubmenu: true,
      isOpen: openManutencoes,
      toggle: () => setOpenManutencoes(!openManutencoes),
      requiredPermission: { modulo: "manutencoes", acao: "visualizar" },
      submenu: [
        {
          title: "Painel",
          href: "/dashboard/manutencoes/painel",
          icon: BarChart3,
          requiredPermission: { modulo: "manutencoes", acao: "visualizar" }
        },
        {
          title: "Tela",
          href: "/dashboard/manutencoes/tela",
          icon: AlertCircle,
          requiredPermission: { modulo: "manutencoes", acao: "visualizar" }
        },
        {
          title: "Ordem de Serviço",
          href: "/dashboard/manutencoes/ordem-servico",
          icon: FileText,
          requiredPermission: { modulo: "ordemServico", acao: "visualizar", submodulo: true }
        },
        {
          title: "Planejamento",
          href: "/dashboard/manutencoes/planejamento",
          icon: CalendarRange,
          requiredPermission: { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "planejamento" }
        },
        {
          title: "Troca de Óleo",
          href: "/dashboard/manutencoes/troca-oleo",
          icon: Oil,
          requiredPermission: { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "troca-oleo" }
        },
        {
          title: "Vistoria de Tacógrafo",
          href: "/dashboard/manutencoes/vistoria-tacografo",
          icon: CalendarRange,
          requiredPermission: { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "vistoria-tacografo" }
        },
        {
          title: "Troca de Pneu",
          href: "/dashboard/manutencoes/troca-pneu",
          icon: Disc,
          requiredPermission: { modulo: "manutencoes", acao: "visualizar", submodulo: true, pagina: "troca-pneu" }
        },
        {
          title: "Históricos",
          href: "/dashboard/manutencoes/historicos",
          icon: History,
          requiredPermission: { modulo: "manutencoes", acao: "visualizar" }
        },
      ],
    },
    // Item 'Notas' removido
    {
      title: "Serviços",
      icon: ClipboardList,
      isSubmenu: true,
      isOpen: openServicos,
      toggle: () => setOpenServicos(!openServicos),
      submenu: [
        {
          title: "Custo por Veículo",
          href: "/dashboard/custo-veiculo",
          icon: BarChart3,
          requiredPermission: { modulo: "dashboard", acao: "visualizar" }
        },
        {
          title: "Borracharia",
          href: "/dashboard/servico-externo/borracharia",
          icon: Disc,
          requiredPermission: { modulo: "servicoExterno", acao: "visualizar" }
        },
        {
          title: "Lavador",
          href: "/dashboard/servico-externo/lavador",
          icon: Droplets,
          requiredPermission: { modulo: "servicoExterno", acao: "visualizar" }
        },
        {
          title: "Serviço Externo",
          href: "/dashboard/servico-externo/servico-externo",
          icon: Wrench,
          requiredPermission: { modulo: "servicoExterno", acao: "visualizar" }
        },
      ],
    },
    {
      title: "Planner",
      href: "/dashboard/planner",
      icon: Calendar,
      requiredPermission: { modulo: "dashboard", acao: "visualizar" }
    },
    {
      title: "Configurações",
      href: "/dashboard/configuracoes",
      icon: Settings,
      requiredPermission: { modulo: "configuracoes", acao: "visualizar" }
    },
  ]

  // Cores para o tema claro (menu azul)
  const lightThemeClasses = {
    sidebar: "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-xl-custom",
    border: "border-white/15",
    button: "text-white hover:bg-white/10",
    activeItem: "bg-white/20 shadow-sm border border-white/20 text-white font-semibold",
    hoverItem: "hover:bg-white/10 transition-all duration-200",
    submenuBg: "bg-blue-700 shadow-xl-custom border border-white/15 rounded-xl",
  }

  // Cores para o tema escuro
  const darkThemeClasses = {
    sidebar: "gradient-sidebar text-slate-100 shadow-xl-custom",
    border: "border-primary/20",
    button: "text-slate-100 hover:bg-primary/10",
    activeItem: "bg-primary/20 shadow-sm border border-primary/30 text-primary font-semibold",
    hoverItem: "hover:bg-primary/10 transition-all duration-200",
    submenuBg: "bg-[hsl(217,33%,15%)] shadow-xl-custom border border-primary/20 rounded-xl",
  }

  // Seleciona o conjunto de classes com base no tema
  const classes = isDarkTheme ? darkThemeClasses : lightThemeClasses

  // Classes comuns para todos os itens de menu
  const menuItemClasses = cn(
    "flex items-center py-1.5 px-2.5 rounded-lg transition-all duration-200 text-[12px] font-medium relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 leading-tight",
    classes.hoverItem,
  )

  if (!mounted) {
    return <div className={cn("w-16 h-screen", isDarkTheme ? "bg-slate-900" : "bg-blue-600")}></div>
  }

  // Função para lidar com o clique em um item de submenu
  const handleSubmenuClick = (e: React.MouseEvent, title: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setSubmenuPosition(rect.top)

    if (openCollapsedSubmenu === title) {
      setOpenCollapsedSubmenu(null)
    } else {
      setOpenCollapsedSubmenu(title)
    }
  }

  // Verificar permissão para um item do menu
  const temPermissao = (item: MenuItem): boolean => {
    // Sem requisito de permissão, permite
    if (!item.requiredPermission) return true;
    
    // Se o item tem href, verificamos a permissão para essa rota específica
    if (item.href) {
      return verificarPermissao(item.href);
    }
    
    // Se é um submenu, verificamos apenas a permissão para o módulo principal
    // Os itens dentro do submenu serão verificados individualmente
    if (item.isSubmenu && item.submenu) {
      // Se pelo menos um item do submenu tem permissão, o submenu deve ser exibido
      return item.submenu.some(subItem => temPermissao(subItem));
    }
    
    return false;
    
    /* CÓDIGO ORIGINAL - COMENTADO PARA REFATORAÇÃO
    if (!item.requiredPermission) return true; // Sem requisito de permissão, permite

    const { modulo, acao, submodulo, pagina } = item.requiredPermission;
    
    // Log para debug específico de troca-oleo
    if (pagina === "troca-oleo") {
      console.log("Verificando permissão para Troca de Óleo no sidebar...", item.href);
    }
    
    // Se o item tem href, verificamos a permissão para essa rota específica
    if (item.href) {
      // Para rotas que são submódulos com página específica, adicionar mais informações ao log
      if (submodulo && pagina) {
        console.log(`Verificando permissão para rota ${item.href} (${modulo}/${pagina}):`, verificarPermissao(item.href));
      }
      return verificarPermissao(item.href);
    }
    
    // Se é um submenu, verificamos apenas a permissão para o módulo principal
    // Os itens dentro do submenu serão verificados individualmente
    if (item.isSubmenu && item.submenu) {
      // Se pelo menos um item do submenu tem permissão, o submenu deve ser exibido
      return item.submenu.some(subItem => temPermissao(subItem));
    }
    
    return false;
    */
  }

  const simpleMenuItems = menuItems.flatMap((item) => {
    if (!item.isSubmenu) return [item]
    return item.submenu || []
  })

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300",
        classes.sidebar,
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("h-[66px] flex items-center justify-between px-3 border-b", classes.border)}>
        {!isCollapsed && (
          <h2 className={cn(
            "text-sm font-semibold tracking-wide uppercase",
            isDarkTheme 
              ? "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              : "text-white/95"
          )}>
            SEMTRANSP
          </h2>
        )}
        <div
          onClick={onToggle}
          className={cn(
            "cursor-pointer p-1.5 rounded-lg transition-all duration-200 hover:scale-105",
            classes.hoverItem,
            isCollapsed && "mx-auto",
          )}
          role="button"
          aria-label="Alternar largura do menu"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onToggle()
            }
          }}
        >
          {isCollapsed ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </div>
      </div>
      <div className="relative flex-1 overflow-auto py-1.5 min-h-0">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/10 to-transparent dark:from-white/10" />
        <nav className="space-y-0.5 px-1.5" role="navigation" aria-label="Menu lateral">
          {(menuMode === "simple" ? simpleMenuItems : menuItems).map((item, index) => {
            // Se o usuário não tem permissão para este item, não renderiza
            if (!temPermissao(item)) {
              return null;
            }

            if (menuMode === "simple") {
              if (!item.href) return null
              if (item.desktopOnly) return null

              return (
                <Link
                  key={`${item.title}-${index}`}
                  href={item.href}
                  className={cn(
                    menuItemClasses,
                    pathname === item.href && classes.activeItem,
                    isCollapsed ? "justify-center px-2" : "px-3",
                    isCollapsed && "relative group",
                    "animate-fade-in group",
                  )}
                  style={{ animationDelay: `${index * 0.03}s` }}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-white",
                      isCollapsed ? "" : "mr-2",
                    )}
                  />
                  {!isCollapsed && <span>{item.title}</span>}
                  {isCollapsed && (
                    <div
                      className={cn(
                        "absolute left-full ml-2 hidden rounded-md p-2 group-hover:block z-50 shadow-lg-custom",
                        classes.submenuBg,
                      )}
                    >
                      <div className="py-1 px-2 whitespace-nowrap text-xs font-medium">{item.title}</div>
                    </div>
                  )}
                </Link>
              )
            }

            // Item normal (sem submenu)
            if (!item.isSubmenu) {
              const itemContent = (
                <>
                  <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
                  {!isCollapsed && <span>{item.title}</span>}
                  {isCollapsed && (
                    <div
                      className={cn(
                        "absolute left-full ml-2 hidden rounded-md p-2 group-hover:block z-50 shadow-lg-custom",
                        classes.submenuBg,
                      )}
                    >
                      <div className="py-1 px-2 whitespace-nowrap text-xs font-medium">{item.title}</div>
                    </div>
                  )}
                </>
              );

              // Se tiver onClick, usar button em vez de Link
              if (item.onClick) {
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={cn(
                      menuItemClasses,
                      pathname === item.href && classes.activeItem,
                      isCollapsed ? "justify-center px-2" : "px-3",
                      isCollapsed && "relative group",
                      "w-full text-left"
                    )}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {itemContent}
                  </button>
                );
              }

              // Caso contrário, usar Link normal
              return (
                <Link
                  key={index}
                  href={item.href || "#"}
                  className={cn(
                    menuItemClasses,
                    pathname === item.href && classes.activeItem,
                    isCollapsed ? "justify-center px-2" : "px-3",
                    isCollapsed && "relative group",
                    "animate-fade-in",
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {itemContent}
                </Link>
              );
            }

            // Item com submenu
            return (
              <div key={index} className="relative">
                {isCollapsed ? (
                  // Versão colapsada do submenu
                  <div className="group">
                    <div
                      className={cn(
                        menuItemClasses,
                        "justify-center px-2 cursor-pointer",
                        openCollapsedSubmenu === item.title && classes.activeItem,
                      )}
                      onClick={(e) => handleSubmenuClick(e, item.title)}
                      role="button"
                      aria-haspopup="menu"
                      aria-expanded={openCollapsedSubmenu === item.title}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          const fakeEvent = { currentTarget: e.currentTarget } as unknown as React.MouseEvent
                          handleSubmenuClick(fakeEvent, item.title)
                        }
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>

                    {/* Dropdown lateral fora do menu */}
                    {openCollapsedSubmenu === item.title && (
                      <div
                        ref={submenuRef}
                        className={cn(
                          "fixed left-16 rounded-md p-2 z-50 min-w-[180px] animate-in fade-in-0 zoom-in-95",
                          classes.submenuBg,
                        )}
                        style={{ top: submenuPosition ? `${submenuPosition}px` : "auto" }}
                      >
                        <div className="py-1 px-2 text-xs font-medium">{item.title}</div>
                        <div className="mt-1 space-y-1">
                          {item.submenu?.map((subItem, subIndex) => {
                            // Verifica permissão para cada item do submenu
                            if (temPermissao(subItem) && subItem.href) {
                              // Se for desktopOnly, não mostrar na versão colapsada (mobile)
                              if (subItem.desktopOnly) {
                                return null;
                              }
                              return (
                                <Link
                                  key={subIndex}
                                  href={subItem.href}
                                  className={cn(
                                    "flex items-center py-1.5 px-2.5 text-[10px] font-medium rounded-md transition-all duration-200 leading-tight",
                                    classes.hoverItem,
                                    pathname === subItem.href && classes.activeItem,
                                  )}
                                  onClick={() => setOpenCollapsedSubmenu(null)}
                                >
                                  <subItem.icon className="h-3.5 w-3.5 mr-2" />
                                  <span>{subItem.title}</span>
                                </Link>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Versão expandida do submenu
                  <div>
                    <div
                      className={cn(menuItemClasses, "px-3 cursor-pointer justify-between")}
                      onClick={item.toggle}
                      role="button"
                      aria-haspopup="menu"
                      aria-expanded={!!item.isOpen}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          item.toggle?.()
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-4 w-4 mr-2" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          item.isOpen && "transform rotate-180",
                        )}
                      />
                    </div>
                    {item.isOpen && (
                      <div className="pl-2 ml-1.5 border-l border-white/20 dark:border-border/40 space-y-0.5 mt-0.5">
                        {item.submenu?.map((subItem, subIndex) => {
                          // Verifica permissão para cada item do submenu
                          if (temPermissao(subItem) && subItem.href) {
                            return (
                              <Link
                                key={subIndex}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center py-1.5 px-2.5 text-[10px] font-medium rounded-md transition-all duration-200 hover:shadow-sm-custom leading-tight",
                                  classes.hoverItem,
                                  pathname === subItem.href && classes.activeItem,
                                  subItem.desktopOnly && "hidden md:flex"
                                )}
                                aria-current={pathname === subItem.href ? "page" : undefined}
                              >
                                <subItem.icon className="h-3.5 w-3.5 mr-2" />
                                <span>{subItem.title}</span>
                              </Link>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/10 to-transparent dark:from-white/10" />
      </div>

      <div className={cn("border-t p-1", classes.border)}>
        {isCollapsed ? (
          <button
            onClick={() => setMenuMode((prev) => (prev === "sophisticated" ? "simple" : "sophisticated"))}
              className={cn(
                "w-full rounded-md px-1.5 py-1.5 text-[10px] font-medium transition-all",
              classes.hoverItem,
            )}
            title={menuMode === "sophisticated" ? "Modo sofisticado" : "Modo simples"}
          >
            {menuMode === "sophisticated" ? "S" : "M"}
          </button>
        ) : (
          <div className="space-y-1">
            <p className={cn("text-[11px] uppercase tracking-wide", isDarkTheme ? "text-slate-400" : "text-white/80")}>
              Visual do menu
            </p>
            <div className="grid grid-cols-2 gap-0.5 rounded-md p-0.5 bg-black/10 dark:bg-white/5">
              <button
                onClick={() => setMenuMode("simple")}
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-[9px] font-medium transition-all",
                  menuMode === "simple" ? "bg-white/20 text-white dark:bg-primary/20" : classes.hoverItem,
                )}
              >
                Simples
              </button>
              <button
                onClick={() => setMenuMode("sophisticated")}
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-[9px] font-medium transition-all",
                  menuMode === "sophisticated" ? "bg-white/20 text-white dark:bg-primary/20" : classes.hoverItem,
                )}
              >
                Sofisticado
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
