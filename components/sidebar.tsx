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
  LogOut,
  ChevronDown,
  PenToolIcon as Tool,
  ArrowRight,
  ArrowLeft,
  FileText,
  FuelIcon as Oil,
  History,
  Moon,
  Sun,
  AlertCircle,
  CalendarRange,
  Disc
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
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { logout, verificarPermissao, user } = useAuth()
  const [openMovimento, setOpenMovimento] = useState(false)
  const [openManutencoes, setOpenManutencoes] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [openCollapsedSubmenu, setOpenCollapsedSubmenu] = useState<string | null>(null)
  const [submenuPosition, setSubmenuPosition] = useState<number | null>(null)

  // Referência para detectar cliques fora do submenu
  const submenuRef = useRef<HTMLDivElement>(null)

  // Evita problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

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
    if (pathname?.includes("/dashboard/movimento")) {
      setOpenMovimento(true)
    }
    if (pathname?.includes("/dashboard/manutencoes")) {
      setOpenManutencoes(true)
    }
  }, [pathname])

  const isDarkTheme = theme === "dark"

  // Função para lidar com o logout
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    logout()
  }

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      requiredPermission: { modulo: "dashboard", acao: "visualizar" }
    },
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
      title: "Produtos",
      href: "/dashboard/produtos",
      icon: Package,
      requiredPermission: { modulo: "produtos", acao: "visualizar" }
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
    {
      title: "Configurações",
      href: "/dashboard/configuracoes",
      icon: Settings,
      requiredPermission: { modulo: "configuracoes", acao: "visualizar" }
    },
  ]

  // Cores para o tema claro (menu claro)
  const lightThemeClasses = {
    sidebar: "bg-white text-slate-800 shadow-lg-custom",
    border: "border-gray-200",
    button: "text-slate-800 hover:bg-gray-100",
    activeItem: "bg-gray-100 shadow-sm-custom",
    hoverItem: "hover:bg-gray-100 transition-all duration-200",
    submenuBg: "bg-white shadow-lg-custom",
  }

  // Cores para o tema escuro (menu escuro)
  const darkThemeClasses = {
    sidebar: "bg-slate-900 text-gray-100 shadow-lg-custom",
    border: "border-slate-700",
    button: "text-gray-100 hover:bg-slate-800",
    activeItem: "bg-slate-800 shadow-sm-custom",
    hoverItem: "hover:bg-slate-800 transition-all duration-200",
    submenuBg: "bg-slate-900 shadow-lg-custom",
  }

  // Seleciona o conjunto de classes com base no tema
  const classes = isDarkTheme ? darkThemeClasses : lightThemeClasses

  // Classes comuns para todos os itens de menu
  const menuItemClasses = cn(
    "flex items-center py-2 rounded-md transition-all duration-200 text-base font-normal",
    classes.hoverItem,
  )

  if (!mounted) {
    return <div className="w-16 h-screen bg-slate-800"></div>
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
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300",
        classes.sidebar,
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex items-center justify-between p-4 border-b", classes.border)}>
        {!isCollapsed && <h2 className="text-xl font-bold tracking-tight">SEMTRANSP</h2>}
        <div
          onClick={onToggle}
          className={cn(
            "cursor-pointer p-2 rounded-md transition-all duration-200",
            classes.hoverItem,
            isCollapsed && "mx-auto",
          )}
        >
          {isCollapsed ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          {menuItems.map((item, index) => {
            // Se o usuário não tem permissão para este item, não renderiza
            if (item.title !== "Sair" && !temPermissao(item)) {
              return null;
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
                      <div className="py-1 px-2 whitespace-nowrap font-medium">{item.title}</div>
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
                  )}
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
                    >
                      <item.icon className="h-5 w-5" />
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
                        <div className="py-1 px-2 font-medium">{item.title}</div>
                        <div className="mt-1 space-y-1">
                          {item.submenu?.map((subItem, subIndex) => {
                            // Verifica permissão para cada item do submenu
                            if (temPermissao(subItem) && subItem.href) {
                              return (
                                <Link
                                  key={subIndex}
                                  href={subItem.href}
                                  className={cn(
                                    "flex items-center py-2 px-3 text-sm font-light rounded-md transition-all duration-200",
                                    classes.hoverItem,
                                    pathname === subItem.href && classes.activeItem,
                                  )}
                                  onClick={() => setOpenCollapsedSubmenu(null)}
                                >
                                  <subItem.icon className="h-4 w-4 mr-2" />
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
                    <div className={cn(menuItemClasses, "px-3 cursor-pointer justify-between")} onClick={item.toggle}>
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5 mr-2" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          item.isOpen && "transform rotate-180",
                        )}
                      />
                    </div>
                    {item.isOpen && (
                      <div className="pl-6 space-y-1 mt-1">
                        {item.submenu?.map((subItem, subIndex) => {
                          // Verifica permissão para cada item do submenu
                          if (temPermissao(subItem) && subItem.href) {
                            return (
                              <Link
                                key={subIndex}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center py-2 px-3 text-sm font-light rounded-md transition-all duration-200",
                                  classes.hoverItem,
                                  pathname === subItem.href && classes.activeItem,
                                )}
                              >
                                <subItem.icon className="h-4 w-4 mr-2" />
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
      </div>

      {/* Botões de ação no final do menu */}
      <div className="mt-auto border-t p-2 space-y-1">
        {/* Nome do usuário */}
        {user && (
          <div className={cn(
            "flex items-center py-2 mb-1",
            isCollapsed ? "justify-center px-2" : "px-3",
            isCollapsed && "relative group",
          )}>
            <Users className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
            {!isCollapsed && <span className="font-normal truncate">{user.nome}</span>}
            {isCollapsed && (
              <div
                className={cn(
                  "absolute left-full ml-2 hidden rounded-md p-2 group-hover:block z-50 shadow-lg-custom",
                  classes.submenuBg,
                )}
              >
                <div className="py-1 px-2 whitespace-nowrap">{user.nome}</div>
              </div>
            )}
          </div>
        )}

        {/* Botão de logoff */}
        <div
          onClick={handleLogout}
          className={cn(
            menuItemClasses,
            "cursor-pointer",
            isCollapsed ? "justify-center px-2" : "px-3",
            isCollapsed && "relative group",
          )}
        >
          <LogOut className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
          {!isCollapsed && <span>Sair</span>}
          {isCollapsed && (
            <div
              className={cn(
                "absolute left-full ml-2 hidden rounded-md p-2 group-hover:block z-50 shadow-lg-custom",
                classes.submenuBg,
              )}
            >
              <div className="py-1 px-2 whitespace-nowrap">Sair</div>
            </div>
          )}
        </div>

        {/* Botão de troca de tema */}
        <div
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            menuItemClasses,
            "cursor-pointer",
            isCollapsed ? "justify-center px-2" : "px-3",
            isCollapsed && "relative group",
          )}
        >
          {theme === "dark" ? (
            <Sun className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
          ) : (
            <Moon className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
          )}
          {!isCollapsed && <span>Alternar Tema</span>}
          {isCollapsed && (
            <div
              className={cn(
                "absolute left-full ml-2 hidden rounded-md p-2 group-hover:block z-50 shadow-lg-custom",
                classes.submenuBg,
              )}
            >
              <div className="py-1 px-2 whitespace-nowrap">Alternar Tema</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
