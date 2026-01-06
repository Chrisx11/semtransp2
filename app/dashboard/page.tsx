"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getVeiculosSupabase } from "@/services/veiculo-service"
import { getTrocasOleo, getUltimaTrocaOleo, getEstatisticasTrocasOleo, getUltimoRegistro, getAllTrocasOleo } from "@/services/troca-oleo-service"
import { getProdutosSupabase } from "@/services/produto-service"

// Interface para filtros registrados
interface FiltroRegistrado {
  veiculoId: string
  categoria: string
  produtoId: string
  produtoDescricao: string
}

// Função para buscar filtros do veículo
async function getFiltrosDoVeiculoSupabase(veiculoId: string): Promise<FiltroRegistrado[]> {
  try {
    const normalizedId = String(veiculoId).trim()
    
    let { data, error } = await supabase
      .from('filtros_registrados')
      .select('veiculoid, categoria, produtoid, produtodescricao')
      .eq('veiculoid', normalizedId)
    
    if (error) {
      console.error(`Erro ao buscar filtros do veículo ${normalizedId}:`, error)
      return []
    }
    
    if (!data) {
      return []
    }
    
    return data.map(item => ({
      veiculoId: String(item.veiculoid).trim(),
      categoria: item.categoria ? String(item.categoria).trim() : '',
      produtoId: String(item.produtoid).trim(),
      produtoDescricao: item.produtodescricao,
    }))
  } catch (err) {
    console.error(`Erro inesperado ao buscar filtros do veículo ${veiculoId}:`, err)
    return []
  }
}
import { getSaidasSupabase } from "@/services/saida-service"
import { getEntradasSupabase } from "@/services/entrada-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Car, Clock, BarChart3, Package, Droplets, ArrowRight, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Activity, ChevronLeft, ChevronRight, Wrench, Users, ArrowLeft, FileText, CalendarRange, Disc, History, ClipboardList, Calendar, Settings, FolderOpen, FuelIcon as Oil, Search, Filter, Download, LogOut, User, ChevronDown, ShoppingCart, FileSpreadsheet } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"
import { useIsMobile } from "@/components/ui/use-mobile"
import { supabase } from "@/lib/supabase"
import { useAuth, rotasPermissoes } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

// Interfaces para os dados
interface VeiculoBase {
  id: string
  placa: string
  marca: string
  modelo: string
  kmAtual: number
  kmProxTroca: number
  status: string
}

interface VeiculoCalculado extends VeiculoBase {
  diff: number
}

interface Historico {
  id: string
  data: string
  tipo: string
  kmAtual?: number
  kmAnterior?: number
  kmProxTroca?: number
  observacao?: string
  veiculoId: string
}

interface ProdutoStatus {
  id: string
  nome: string
  quantidade: number
  unidade: string
  estoqueMinimo: number
}

interface TrocaPorMes {
  mes: string
  quantidade: number
  nomeMes?: string
}

interface Saida {
  id: string
  produtoId: string
  produtoNome: string
  categoria: string
  quantidade: number
  data: string
  responsavelId: string
  responsavelNome: string
  veiculoId: string
  veiculoPlaca: string
  veiculoModelo: string
  observacao?: string
  historicoId?: string
  createdAt: string
  updatedAt: string
}

interface Entrada {
  id: string
  produtoId: string
  produtoDescricao: string
  responsavelId: string
  responsavelNome: string
  quantidade: number
  data: string
  createdAt: string
}

// Helper functions
function getMonthYear(dateStr: string) {
  try {
    // Garantir que a data está em formato válido
    let dateToParse = dateStr
    if (dateStr && !dateStr.includes('T') && dateStr.length === 10) {
      // Formato YYYY-MM-DD, adicionar hora para garantir parsing correto
      dateToParse = `${dateStr}T00:00:00.000Z`
    }
    const d = new Date(dateToParse)
    // Verificar se a data é válida
    if (isNaN(d.getTime())) {
      console.warn(`Data inválida: ${dateStr}`)
      return null
    }
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`
  } catch (err) {
    console.error(`Erro ao processar data: ${dateStr}`, err)
    return null
  }
}

function formatarData(data: string) {
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR')
}

// Adicionar uma função auxiliar para verificar se um registro é uma troca de óleo
function isTrocaOleo(tipoServico: string) {
  if (!tipoServico) return false
  
  const tipoLower = tipoServico.toLowerCase().trim()
  return tipoLower.includes('óleo') || 
         tipoLower.includes('oleo') || 
         tipoLower.includes('troca') || 
         tipoLower === 'óleo' || 
         tipoLower === 'oleo'
}

// Adicionar função auxiliar para mobile
function DashboardMobileView() {
  const { verificarPermissao, user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  
  const handleNavigation = (href: string) => {
    setNavigatingTo(href)
    // Pequeno delay para mostrar a animação antes de navegar
    setTimeout(() => {
      router.push(href)
    }, 150)
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao fazer logout."
      })
    }
  }
  
  const categorias = [
    {
      nome: "Cadastros",
      cor: "blue",
      icon: FolderOpen,
      atalhos: [
        { href: "/dashboard/colaboradores", title: "Colaboradores", icon: Users, desc: "Gerenciar colaboradores" },
        { href: "/dashboard/veiculos", title: "Veículos", icon: Car, desc: "Gerenciar veículos" },
        { href: "/dashboard/produtos", title: "Produtos", icon: Package, desc: "Gerenciar produtos" },
        { href: "/dashboard/filtros", title: "Filtros", icon: Oil, desc: "Gerenciar filtros" },
      ]
    },
    {
      nome: "Movimento",
      cor: "green",
      icon: Activity,
      atalhos: [
        { href: "/dashboard/movimento/entradas", title: "Entradas", icon: ArrowRight, desc: "Registrar entradas" },
        { href: "/dashboard/movimento/saidas", title: "Saídas", icon: ArrowLeft, desc: "Registrar saídas" },
      ]
    },
    {
      nome: "Manutenções",
      cor: "orange",
      icon: Wrench,
      atalhos: [
        { href: "/dashboard/manutencoes/painel", title: "Painel", icon: BarChart3, desc: "Painel de manutenções" },
        { href: "/dashboard/manutencoes/tela", title: "Tela", icon: AlertTriangle, desc: "Tela de manutenções" },
        { href: "/dashboard/manutencoes/ordem-servico", title: "Ordem de Serviço", icon: FileText, desc: "Abrir, visualizar e atualizar O.S." },
        { href: "/dashboard/manutencoes/planejamento", title: "Planejamento", icon: CalendarRange, desc: "Planejamento de manutenções" },
        { href: "/dashboard/manutencoes/troca-oleo", title: "Atualizar Km", icon: Droplets, desc: "Registrar ou acompanhar trocas" },
        { href: "/dashboard/manutencoes/troca-pneu", title: "Troca de Pneu", icon: Disc, desc: "Registrar trocas de pneu" },
        { href: "/dashboard/manutencoes/historicos", title: "Históricos", icon: History, desc: "Histórico de manutenções" },
      ]
    },
    {
      nome: "Serviços",
      cor: "purple",
      icon: ClipboardList,
      atalhos: [
        { href: "/dashboard/custo-veiculo", title: "Custo por Veículo", icon: BarChart3, desc: "Custos por veículo" },
        { href: "/dashboard/servico-externo/borracharia", title: "Borracharia", icon: Disc, desc: "Serviços de borracharia" },
        { href: "/dashboard/servico-externo/lavador", title: "Lavador", icon: Droplets, desc: "Serviços de lavador" },
        { href: "/dashboard/servico-externo/servico-externo", title: "Serviço Externo", icon: Wrench, desc: "Gerenciar serviços externos" },
      ]
    },
    {
      nome: "Sistema",
      cor: "gray",
      icon: Settings,
      atalhos: [
        { href: "/dashboard/configuracoes", title: "Configurações", icon: Settings, desc: "Configurações do sistema" },
      ]
    },
  ]

  // Filtrar atalhos baseado nas permissões do usuário
  // Verificação mais restritiva: apenas mostra páginas que estão explicitamente permitidas nas configurações
  const categoriasFiltradas = categorias.map(categoria => ({
    ...categoria,
    atalhos: categoria.atalhos.filter(atalho => {
      // Verificar permissão usando a função padrão
      const temPermissao = verificarPermissao(atalho.href)
      
      // Se não tem permissão básica, não mostrar
      if (!temPermissao) {
        return false
      }
      
      // Se o usuário tem permissões customizadas e não é admin, verificar se o módulo existe explicitamente
      if (user?.permissoes_customizadas && user.perfil !== "admin") {
        // Obter configuração da rota
        let rotaConfig = rotasPermissoes[atalho.href]
        if (!rotaConfig) {
          // Tentar encontrar rota base
          const rotaBase = Object.keys(rotasPermissoes).find(r => 
            atalho.href.startsWith(r) && (atalho.href === r || atalho.href[r.length] === '/')
          )
          if (rotaBase) {
            rotaConfig = rotasPermissoes[rotaBase]
          }
        }
        
        if (rotaConfig) {
          const { modulo, submodulo, pagina } = rotaConfig
          
          // Caso especial para submódulos de manutenções
          if (modulo === "manutencoes" && submodulo && pagina) {
            const manutencaoPerms = user.permissoes_customizadas.manutencoes
            if (manutencaoPerms && Array.isArray(manutencaoPerms.submodulos)) {
              // Verificar se tem "todos" ou a página específica
              if (!manutencaoPerms.submodulos.includes("todos") && 
                  !manutencaoPerms.submodulos.includes(pagina)) {
                return false
              }
            } else {
              // Se não tem estrutura de submódulos, verificar se tem permissão para manutenções
              if (!user.permissoes_customizadas.hasOwnProperty("manutencoes")) {
                return false
              }
            }
          } else {
            // Para outros módulos, verificar se o módulo existe nas permissões customizadas
            const moduloExiste = user.permissoes_customizadas.hasOwnProperty(modulo)
            // Se o módulo não existe explicitamente nas permissões, não mostrar
            if (!moduloExiste) {
              return false
            }
          }
        }
      }
      
      return true
    })
  })).filter(categoria => categoria.atalhos.length > 0)

  const getColorClasses = (cor: string) => {
    const colors = {
      blue: {
        border: "border-blue-500",
        bg: "bg-blue-500/10",
        iconBg: "bg-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        hover: "hover:bg-blue-500/15"
      },
      green: {
        border: "border-green-500",
        bg: "bg-green-500/10",
        iconBg: "bg-green-500/20",
        text: "text-green-600 dark:text-green-400",
        hover: "hover:bg-green-500/15"
      },
      orange: {
        border: "border-orange-500",
        bg: "bg-orange-500/10",
        iconBg: "bg-orange-500/20",
        text: "text-orange-600 dark:text-orange-400",
        hover: "hover:bg-orange-500/15"
      },
      purple: {
        border: "border-purple-500",
        bg: "bg-purple-500/10",
        iconBg: "bg-purple-500/20",
        text: "text-purple-600 dark:text-purple-400",
        hover: "hover:bg-purple-500/15"
      },
      gray: {
        border: "border-gray-500",
        bg: "bg-gray-500/10",
        iconBg: "bg-gray-500/20",
        text: "text-gray-600 dark:text-gray-400",
        hover: "hover:bg-gray-500/15"
      }
    }
    return colors[cor as keyof typeof colors] || colors.blue
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 py-4 pb-6 flex flex-col">
      {/* Header */}
      <div className="w-[98%] mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Início</h1>
                <p className="text-xs text-muted-foreground">Escolha um atalho para continuar</p>
              </div>
            </div>
          </div>
          
          {/* Usuário com opção de sair */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-2.5 px-3 hover:bg-accent/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-left">
                      {user?.nome || user?.login || "Usuário"}
                    </span>
                    {user?.login && user?.nome && (
                      <span className="text-[10px] text-muted-foreground text-left">
                        {user.login}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(98vw-24px)]">
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
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Categorias e Atalhos */}
      <div className="w-[98%] space-y-5">
        {categoriasFiltradas.map((categoria) => {
          const CategoryIcon = categoria.icon
          const colors = getColorClasses(categoria.cor)
          
          return (
            <div key={categoria.nome} className="space-y-2.5">
              {/* Título da Categoria */}
              <div className="flex items-center gap-2 px-1">
                <div className={`p-1.5 ${colors.iconBg} rounded-lg`}>
                  <CategoryIcon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <h2 className={`text-base font-bold ${colors.text}`}>{categoria.nome}</h2>
                <div className="flex-1 h-px bg-border/50"></div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {categoria.atalhos.length}
                </Badge>
              </div>

              {/* Cards de Atalhos */}
              <div className="grid gap-2.5">
                {categoria.atalhos.map((atalho) => {
                  const Icon = atalho.icon
                  const isNavigating = navigatingTo === atalho.href
                  
                  return (
                    <div
                      key={atalho.href}
                      onClick={() => handleNavigation(atalho.href)}
                      className="block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
                      role="button"
                      aria-label={`${atalho.title}. ${atalho.desc}`}
                      aria-busy={isNavigating}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleNavigation(atalho.href)
                        }
                      }}
                    >
                      <Card className={`border-l-4 ${colors.border} border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97] ${colors.bg} ${colors.hover} ${
                        isNavigating ? 'opacity-75 scale-95' : ''
                      }`}>
                        <CardContent className="p-3 sm:p-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 ${colors.iconBg} rounded-lg flex-shrink-0 transition-transform duration-200 ${
                              isNavigating ? 'scale-110 rotate-3' : ''
                            }`}>
                              <Icon className={`h-5 w-5 ${colors.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-bold ${colors.text} truncate mb-0.5`}>{atalho.title}</h3>
                              <p className="text-[11px] text-muted-foreground truncate leading-snug">{atalho.desc}</p>
                            </div>
                            {isNavigating ? (
                              <div className="flex-shrink-0">
                                <div className={`animate-spin rounded-full h-4 w-4 border-2 ${colors.border} border-t-transparent`}></div>
                              </div>
                            ) : (
                              <div className="flex-shrink-0">
                                <ArrowRight className={`h-4 w-4 ${colors.text} opacity-50`} />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [veiculos, setVeiculos] = useState<VeiculoBase[]>([])
  const [proximasTrocas, setProximasTrocas] = useState<VeiculoCalculado[]>([])
  const [emAtraso, setEmAtraso] = useState<VeiculoCalculado[]>([])
  const [trocasPorMes, setTrocasPorMes] = useState<TrocaPorMes[]>([])
  const [ultimasTrocas, setUltimasTrocas] = useState<Historico[]>([])
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<ProdutoStatus[]>([])
  const [produtosMaisUsados, setProdutosMaisUsados] = useState<ProdutoStatus[]>([])
  const [ultimasSaidas, setUltimasSaidas] = useState<Saida[]>([])
  const [ultimasEntradas, setUltimasEntradas] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)
  const [veiculosEmDia, setVeiculosEmDia] = useState<any[]>([])
  const [veiculosComDados, setVeiculosComDados] = useState<any[]>([])
  const [abaTrocaOleo, setAbaTrocaOleo] = useState("em-dia")
  const [verMais, setVerMais] = useState({
    'em-dia': false,
    'proximo': false,
    'vencido': false,
    'nunca': false
  })
  const [trocasAtrasoDialogOpen, setTrocasAtrasoDialogOpen] = useState(false)
  const [anoOffset, setAnoOffset] = useState(0) // Offset em anos para navegação no gráfico (0 = ano atual, 1 = ano passado, etc)
  const [todasTrocas, setTodasTrocas] = useState<Historico[]>([]) // Armazenar todas as trocas para navegação
  const [trocasMesAtual, setTrocasMesAtual] = useState(0) // Contador de trocas do mês atual
  const [veiculosSemAtualizacaoKm, setVeiculosSemAtualizacaoKm] = useState<any[]>([])
  const [veiculosComAtualizacaoKm, setVeiculosComAtualizacaoKm] = useState<any[]>([])
  const [kmAtualizacaoDialogOpen, setKmAtualizacaoDialogOpen] = useState(false)
  // ---------- ESTADO GLOBAL USUÁRIO (topo do componente)
  const [usuariosKmMap, setUsuariosKmMap] = useState<Record<string, string>>({});
  // Estados para filtros do diálogo de KM
  const [kmSearchTerm, setKmSearchTerm] = useState("")
  const [kmSecretariaFilter, setKmSecretariaFilter] = useState<string>("all")
  const [kmPdfDialogOpen, setKmPdfDialogOpen] = useState(false)
  const [kmPdfOption, setKmPdfOption] = useState<"sem-atualizacao" | "com-atualizacao" | "ambos">("ambos")
  // Estados para vistoria de pneu
  const [vistoriaPneuStats, setVistoriaPneuStats] = useState({
    precisaAlinhar: 0,
    precisaBalancear: 0
  })
  const [vistoriaPneuDialogOpen, setVistoriaPneuDialogOpen] = useState(false)
  const [veiculosPrecisamAlinhar, setVeiculosPrecisamAlinhar] = useState<any[]>([])
  const [veiculosPrecisamBalancear, setVeiculosPrecisamBalancear] = useState<any[]>([])
  const [vistoriaPneuExportLoading, setVistoriaPneuExportLoading] = useState(false)
  const [vistoriaPneuAbaAtiva, setVistoriaPneuAbaAtiva] = useState("alinhar")

  // Função para atualizar todos os dados
  const atualizarDashboard = async () => {
    setLoading(true)
    try {
      // Carregar dados de veículos
      const veiculosData = await getVeiculosSupabase()
      setVeiculos(veiculosData)
      
      // Próximas trocas
      const veiculosAtivos = veiculosData.filter(v => v.status === "Ativo" && v.kmAtual !== undefined)
      
      // OTIMIZAÇÃO: Buscar TODAS as trocas de óleo de uma vez em vez de uma por veículo
      const todasTrocasOleo = await getAllTrocasOleo().catch(() => [])
      
      // Criar um mapa de trocas por veículo para acesso rápido
      const trocasPorVeiculo = new Map<string, typeof todasTrocasOleo>()
      todasTrocasOleo.forEach(troca => {
        const veiculoId = troca.veiculo_id
        if (!trocasPorVeiculo.has(veiculoId)) {
          trocasPorVeiculo.set(veiculoId, [])
        }
        trocasPorVeiculo.get(veiculoId)!.push(troca)
      })
      
      // Mapear todas as trocas para o formato esperado pelo componente
      const historicos = todasTrocasOleo.map(item => {
        // Garantir que a data está no formato correto
        let dataStr = item.data_troca || new Date().toISOString()
        // Se a data não estiver em formato ISO completo, converter
        if (dataStr && !dataStr.includes('T') && dataStr.length === 10) {
          // Formato YYYY-MM-DD, adicionar hora para garantir parsing correto
          dataStr = `${dataStr}T00:00:00.000Z`
        }
        return {
          id: item.id,
          data: dataStr,
          tipo: item.tipo_servico || "Troca de Óleo",
          kmAtual: item.km_atual,
          kmAnterior: item.km_anterior,
          kmProxTroca: item.km_proxima_troca,
          observacao: item.observacao,
          veiculoId: item.veiculo_id
        }
      })
      
      const proximasTrocasData = [...veiculosAtivos]
        .map(v => ({
          ...v,
          diff: v.kmProxTroca - v.kmAtual
        }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 5)
        
      setProximasTrocas(proximasTrocasData)
      
      // Veículos em atraso - MOVIDO PARA DEPOIS DA INICIALIZAÇÃO DE HISTORICOS
      const atrasados = veiculosAtivos
        .filter(v => {
          // Verificar se o veículo tem registros de troca de óleo
          const temTrocaRegistrada = historicos.some(h => 
            h.veiculoId === v.id && isTrocaOleo(h.tipo)
          );
          
          // Só considerar em atraso se tiver pelo menos uma troca registrada
          // e se a quilometragem atual ultrapassou a próxima troca
          return temTrocaRegistrada && ((v.kmProxTroca - v.kmAtual) <= 0);
        })
        .map(v => ({
          ...v,
          diff: v.kmProxTroca - v.kmAtual
        }))
        .sort((a, b) => (a.kmAtual - a.kmProxTroca) - (b.kmAtual - b.kmProxTroca))
      
      setEmAtraso(atrasados)
      
      // Últimas trocas
      const ultimasTrocasData = historicos
        .filter(h => isTrocaOleo(h.tipo))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5)
      
      setUltimasTrocas(ultimasTrocasData)
      
      // Trocas por mês - filtrar apenas trocas de óleo
      const trocas = historicos.filter(h => isTrocaOleo(h.tipo))
      
      // Armazenar todas as trocas para navegação
      setTodasTrocas(trocas)
      
      // Calcular trocas do mês atual
      const dataAtual = new Date()
      const anoAtual = dataAtual.getFullYear()
      const mesAtual = dataAtual.getMonth() + 1 // 1-12
      const mesAtualStr = `${anoAtual}-${mesAtual.toString().padStart(2, "0")}`
      
      const trocasMesAtualCount = trocas.filter(t => {
        try {
          // t.data já vem do banco no formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
          const mesTroca = getMonthYear(t.data)
          return mesTroca === mesAtualStr
        } catch (err) {
          return false
        }
      }).length
      
      setTrocasMesAtual(trocasMesAtualCount)
      
      // Calcular trocas por mês inicial (sem offset)
      const trocasPorMesData = calcularTrocasPorMes(trocas, 0)
      setTrocasPorMes(trocasPorMesData)
      
      // Carregar produtos, saídas e entradas em paralelo
      const [produtosData, saidasData, entradasData] = await Promise.all([
        getProdutosSupabase(),
        getSaidasSupabase().catch(() => []),
        getEntradasSupabase().catch(() => [])
      ])
      
      // Produtos com baixo estoque
      const baixoEstoque = produtosData
        .filter(p => p.estoque <= 5) // Consideramos produtos com estoque <=5 como baixo estoque
        .map(p => ({
          id: p.id,
          nome: p.descricao,
          quantidade: p.estoque,
          unidade: p.unidade,
          estoqueMinimo: 10 // Estoque mínimo padrão, pode ser ajustado conforme necessário
        }))
        .slice(0, 5) // Limitamos a 5 produtos com estoque baixo
      
      setProdutosBaixoEstoque(baixoEstoque)
      
      // Produtos mais usados - usar dados reais das saídas
      try {
        // Criar mapa de produtos para acesso rápido
        const produtosMap = new Map(produtosData.map(p => [p.id, p]))
        
        // Agrupar saídas por produto e calcular quantidade total
        const produtosUsados: Record<string, { id: string, nome: string, quantidade: number, unidade: string }> = {}
        
        saidasData.forEach(saida => {
          // Verificar se já temos este produto no mapa
          if (produtosUsados[saida.produtoId]) {
            // Somar a quantidade
            produtosUsados[saida.produtoId].quantidade += saida.quantidade
          } else {
            // Adicionar novo produto
            const produto = produtosMap.get(saida.produtoId)
            produtosUsados[saida.produtoId] = {
              id: saida.produtoId,
              nome: saida.produtoNome,
              quantidade: saida.quantidade,
              unidade: produto?.unidade || 'un'
            }
          }
        })
        
        // Transformar o mapa em array e ordenar por quantidade (do maior para o menor)
        const produtosMaisUsadosData = Object.values(produtosUsados)
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5) // Pegar os 5 mais usados
          .map(p => ({
            id: p.id,
            nome: p.nome,
            quantidade: p.quantidade,
            unidade: p.unidade,
            estoqueMinimo: 10 // Valor fixo para estoque mínimo
          }))
        
        setProdutosMaisUsados(produtosMaisUsadosData)
      } catch (err) {
        console.error("Erro ao carregar produtos mais usados:", err)
        
        // Fallback para dados simulados em caso de erro
        const maisUsados = [...produtosData]
          .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            nome: p.descricao,
            quantidade: Math.floor(Math.random() * 20) + 5, // Quantidade usada simulada
            unidade: p.unidade,
            estoqueMinimo: 10 // Valor fixo para estoque mínimo
          }))
        
        setProdutosMaisUsados(maisUsados)
      }
      
      // Últimas saídas e entradas
      const ultimasSaidasData = saidasData
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5) // Pegar as 5 mais recentes
      
      setUltimasSaidas(ultimasSaidasData)
      
      const ultimasEntradasData = entradasData
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5) // Pegar as 5 mais recentes
      
      setUltimasEntradas(ultimasEntradasData)
      
      // Buscar veículos em dia com base na última troca de óleo
      const veiculosEmDiaList = veiculosData
        .filter(v => v.status === "Ativo" && v.kmAtual !== 0 && (v.kmProxTroca - v.kmAtual) > 500)
        .map(v => ({
          id: v.id,
          placa: v.placa,
          modelo: v.modelo,
          marca: v.marca,
          kmAtual: v.kmAtual,
          kmProxTroca: v.kmProxTroca
        }))
      setVeiculosEmDia(veiculosEmDiaList)
      
      // OTIMIZAÇÃO: Calcular estatísticas usando os dados já carregados em memória
      const veiculosComDadosList = veiculosData.map((veiculo) => {
        const trocasDoVeiculo = trocasPorVeiculo.get(veiculo.id) || []
        
        // Encontrar última troca de óleo (não atualização)
        const ultimaTrocaOleo = trocasDoVeiculo
          .filter(t => t.tipo_servico === "Troca de Óleo" || 
                   (t.tipo_servico?.toLowerCase().includes("troca") && t.tipo_servico?.toLowerCase().includes("óleo")))
          .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())[0] || null
        
        // Último registro (pode ser troca ou atualização)
        const ultimoRegistro = trocasDoVeiculo
          .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())[0] || null
        
        let kmAtual = veiculo.kmAtual || 0
        let kmProxTroca = 0
        let progresso = 0
        let ultimaTroca = ultimaTrocaOleo ? {
          id: ultimaTrocaOleo.id,
          data: ultimaTrocaOleo.data_troca,
          tipo: ultimaTrocaOleo.tipo_servico || "Troca de Óleo",
          kmAtual: ultimaTrocaOleo.km_atual,
          kmAnterior: ultimaTrocaOleo.km_anterior,
          kmProxTroca: ultimaTrocaOleo.km_proxima_troca,
          observacao: ultimaTrocaOleo.observacao,
          veiculoId: ultimaTrocaOleo.veiculo_id
        } : null
        
        if (ultimoRegistro) {
          kmAtual = ultimoRegistro.km_atual || kmAtual
        }
        
        if (ultimaTrocaOleo) {
          kmProxTroca = ultimaTrocaOleo.km_proxima_troca
          const kmInicial = ultimaTrocaOleo.km_atual
          const kmFinal = ultimaTrocaOleo.km_proxima_troca
          const totalKm = kmFinal - kmInicial
          const kmPercorrido = kmAtual - kmInicial
          progresso = totalKm <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((kmPercorrido / totalKm) * 100)))
        } else if (ultimoRegistro) {
          kmProxTroca = ultimoRegistro.km_proxima_troca || 0
        }
        
        return {
          ...veiculo,
          ultimaTroca,
          kmAtual,
          kmProxTroca,
          progresso
        }
      })
      setVeiculosComDados(veiculosComDadosList)
      
      // Calcular estatísticas de vistoria de pneu
      try {
        const { data: trocasPneuData, error: trocasPneuError } = await supabase
          .from("trocas_pneu")
          .select("*")
        
        if (!trocasPneuError && trocasPneuData) {
          // Função para calcular progresso de manutenção (similar à página de troca de pneu)
          const calcularProgressoPneu = (veiculo: any, trocas: any[]) => {
            const kmAtual = veiculo.kmAtual || 0
            const trocasDoVeiculo = trocas
              .filter(t => t.veiculo_id === veiculo.id)
              .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())
            
            if (trocasDoVeiculo.length === 0) {
              return { rodizio: { progresso: 0 }, alinhamento: { progresso: 0 }, balanceamento: { progresso: 0 } }
            }
            
            // Última troca com rodízio
            const ultimaTrocaRodizio = trocasDoVeiculo.find(t => t.rodizio)
            const periodoRodizio = ultimaTrocaRodizio?.periodo_rodizio || 10000
            const kmRodizio = ultimaTrocaRodizio ? (kmAtual - ultimaTrocaRodizio.km) : 0
            const progressoRodizio = periodoRodizio > 0 ? Math.min(100, Math.round((kmRodizio / periodoRodizio) * 100)) : 0
            
            // Última manutenção com alinhamento
            const ultimaAlinhamento = trocasDoVeiculo.find(t => t.alinhamento)
            const periodoAlinhamento = ultimaAlinhamento?.periodo_alinhamento || 10000
            const kmAlinhamento = ultimaAlinhamento ? (kmAtual - ultimaAlinhamento.km) : 0
            const progressoAlinhamento = periodoAlinhamento > 0 ? Math.min(100, Math.round((kmAlinhamento / periodoAlinhamento) * 100)) : 0
            
            // Última manutenção com balanceamento
            const ultimaBalanceamento = trocasDoVeiculo.find(t => t.balanceamento)
            const periodoBalanceamento = ultimaBalanceamento?.periodo_balanceamento || 10000
            const kmBalanceamento = ultimaBalanceamento ? (kmAtual - ultimaBalanceamento.km) : 0
            const progressoBalanceamento = periodoBalanceamento > 0 ? Math.min(100, Math.round((kmBalanceamento / periodoBalanceamento) * 100)) : 0
            
            return {
              rodizio: { progresso: progressoRodizio },
              alinhamento: { progresso: progressoAlinhamento },
              balanceamento: { progresso: progressoBalanceamento }
            }
          }
          
          const veiculosAtivos = veiculosData.filter(v => v.status === "Ativo")
          let precisaAlinhar = 0
          let precisaBalancear = 0
          const veiculosAlinhar: any[] = []
          const veiculosBalancear: any[] = []
          
          veiculosAtivos.forEach(veiculo => {
            const temRegistro = trocasPneuData.some(t => t.veiculo_id === veiculo.id)
            
            if (temRegistro) {
              const progresso = calcularProgressoPneu(veiculo, trocasPneuData)
              
              // Considera que precisa alinhar se progresso >= 85
              if (progresso.alinhamento.progresso >= 85) {
                precisaAlinhar++
                veiculosAlinhar.push({
                  ...veiculo,
                  progressoAlinhamento: progresso.alinhamento.progresso
                })
              }
              
              // Considera que precisa balancear se progresso >= 85
              if (progresso.balanceamento.progresso >= 85) {
                precisaBalancear++
                veiculosBalancear.push({
                  ...veiculo,
                  progressoBalanceamento: progresso.balanceamento.progresso
                })
              }
            }
          })
          
          setVistoriaPneuStats({
            precisaAlinhar,
            precisaBalancear
          })
          
          // Armazenar listas de veículos para o diálogo
          setVeiculosPrecisamAlinhar(veiculosAlinhar)
          setVeiculosPrecisamBalancear(veiculosBalancear)
        } else {
          setVistoriaPneuStats({
            precisaAlinhar: 0,
            precisaBalancear: 0
          })
        }
      } catch (error) {
        console.error("Erro ao calcular estatísticas de vistoria de pneu:", error)
        setVistoriaPneuStats({
          precisaAlinhar: 0,
          precisaBalancear: 0
        })
      }
      
      // OTIMIZAÇÃO: Calcular veículos que não atualizaram KM usando dados já carregados
      const dataLimite = new Date()
      dataLimite.setHours(0, 0, 0, 0) // Zerar horas para comparar apenas datas
      dataLimite.setDate(dataLimite.getDate() - 3) // 3 dias atrás
      
      const veiculosComInfoKm = veiculosData
        .filter(v => v.status === "Ativo")
        .map((veiculo) => {
          const trocasDoVeiculo = trocasPorVeiculo.get(veiculo.id) || []
          const ultimoRegistro = trocasDoVeiculo
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null
          
          // Usar created_at para saber quando o registro foi realmente criado
          const dataUltimaAtualizacao = ultimoRegistro?.created_at
            ? new Date(ultimoRegistro.created_at) 
            : null
          
          // Calcular dias sem atualizar
          let diasSemAtualizar: number | null = null
          if (dataUltimaAtualizacao) {
            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)
            const dataAtualizacao = new Date(dataUltimaAtualizacao)
            dataAtualizacao.setHours(0, 0, 0, 0)
            diasSemAtualizar = Math.floor((hoje.getTime() - dataAtualizacao.getTime()) / (1000 * 60 * 60 * 24))
          }
          
          return {
            ...veiculo,
            ultimaAtualizacaoKm: dataUltimaAtualizacao,
            diasSemAtualizar: diasSemAtualizar,
            tipoUltimaAtualizacao: ultimoRegistro?.tipo_servico || null,
            userId: ultimoRegistro?.user_id || null
          }
        })
      
      // Separar veículos que não atualizaram KM em 3 dias
      // Considera que não atualizou se: nunca atualizou OU última atualização foi há mais de 3 dias
      // IMPORTANTE: Filtrar apenas veículos ATIVOS (já filtrado acima, mas garantindo aqui também)
      const semAtualizacao = veiculosComInfoKm.filter(v => {
        // Garantir que apenas veículos ativos sejam contados
        if (v.status !== "Ativo") return false
        if (!v.ultimaAtualizacaoKm) return true // Nunca atualizou
        const dataAtualizacao = new Date(v.ultimaAtualizacaoKm)
        dataAtualizacao.setHours(0, 0, 0, 0)
        return dataAtualizacao < dataLimite
      })
      
      // Veículos que atualizaram KM nos últimos 3 dias
      // IMPORTANTE: Filtrar apenas veículos ATIVOS (já filtrado acima, mas garantindo aqui também)
      const comAtualizacao = veiculosComInfoKm.filter(v => {
        // Garantir que apenas veículos ativos sejam contados
        if (v.status !== "Ativo") return false
        if (!v.ultimaAtualizacaoKm) return false
        const dataAtualizacao = new Date(v.ultimaAtualizacaoKm)
        dataAtualizacao.setHours(0, 0, 0, 0)
        return dataAtualizacao >= dataLimite
      })
      
      setVeiculosSemAtualizacaoKm(semAtualizacao)
      setVeiculosComAtualizacaoKm(comAtualizacao)
      
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }

  // Função para calcular trocas por mês do ano selecionado
  const calcularTrocasPorMes = (trocas: Historico[], offsetAnos: number): TrocaPorMes[] => {
    // Obter os 12 meses do ano baseado no offset (0 = ano atual, 1 = ano passado, etc)
    const dataAtual = new Date()
    const anoSelecionado = dataAtual.getFullYear() - offsetAnos
    
    // Criar array com os 12 meses do ano selecionado
    const meses: string[] = []
    for (let mes = 1; mes <= 12; mes++) {
      const data = new Date(anoSelecionado, mes - 1, 1)
      meses.push(getMonthYear(data.toISOString()))
    }
    
    // Contar trocas por mês
    const counts: Record<string, number> = {}
    trocas.forEach(t => {
      try {
        const mes = getMonthYear(t.data)
        if (mes) {
          counts[mes] = (counts[mes] || 0) + 1
        }
      } catch (err) {
        console.error(`Erro ao processar troca:`, err, "Data:", t.data)
      }
    })
    
    // Criar array com os 12 meses, preenchendo zeros quando não houver trocas
    return meses.map(mes => {
      const quantidade = counts[mes] || 0
      const [ano, mesNum] = mes.split('-')
      return {
        mes,
        quantidade,
        nomeMes: new Date(parseInt(ano), parseInt(mesNum) - 1)
          .toLocaleDateString('pt-BR', { month: 'short' })
          .toUpperCase()
      }
    })
  }

  // Efeito para recalcular trocasPorMes quando o ano mudar
  useEffect(() => {
    if (todasTrocas.length > 0) {
      const novasTrocasPorMes = calcularTrocasPorMes(todasTrocas, anoOffset)
      setTrocasPorMes(novasTrocasPorMes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoOffset])

  useEffect(() => {
    atualizarDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listener para atualizar quando houver atualização de KM
  useEffect(() => {
    const handleVeiculoAtualizado = () => {
      atualizarDashboard()
    }

    // Listener para eventos customizados
    window.addEventListener('veiculo-atualizado', handleVeiculoAtualizado)
    
    // Listener para mudanças no localStorage (atualizações em outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'last-veiculo-update') {
        atualizarDashboard()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Polling para verificar mudanças no localStorage (mesma aba)
    const interval = setInterval(() => {
      const lastUpdate = localStorage.getItem('last-veiculo-update')
      if (lastUpdate) {
        const lastUpdateTime = parseInt(lastUpdate)
        const now = Date.now()
        // Se a atualização foi há menos de 5 segundos, atualizar
        if (now - lastUpdateTime < 5000) {
          atualizarDashboard()
        }
      }
    }, 2000) // Verificar a cada 2 segundos

    return () => {
      window.removeEventListener('veiculo-atualizado', handleVeiculoAtualizado)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- FUNÇÃO AUXILIAR
  async function carregarNomesUsuariosKmDialog(list: any[]) {
    const ids = Array.from(new Set(list.map(v => v.userId || v.user_id).filter(Boolean)));
    if (ids.length > 0) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .in('id', ids);
      if (!error && data) {
        const map = Object.fromEntries(data.map((u: any) => [u.id, u.name]));
        setUsuariosKmMap(map);
      }
    }
  }

  // ---------- EFFECT AO ABRIR O KM DIALOG
  useEffect(() => {
    if (kmAtualizacaoDialogOpen) {
      carregarNomesUsuariosKmDialog([...veiculosSemAtualizacaoKm, ...veiculosComAtualizacaoKm]);
    }
  }, [kmAtualizacaoDialogOpen, veiculosSemAtualizacaoKm, veiculosComAtualizacaoKm]);

  // ---------- FUNÇÕES DE EXPORTAÇÃO PARA VISTORIA DE PNEU
  const exportarVistoriaPneuPDF = async (tipo: "alinhar" | "balancear") => {
    if (typeof window === "undefined") {
      toast({
        title: "Erro",
        description: "Exportação só pode ser executada no cliente",
        variant: "destructive",
      })
      return
    }

    try {
      setVistoriaPneuExportLoading(true)
      const dados = tipo === "alinhar" ? veiculosPrecisamAlinhar : veiculosPrecisamBalancear
      const titulo = tipo === "alinhar" ? "Alinhamento" : "Balanceamento"
      
      if (dados.length === 0) {
        toast({
          title: "Nenhum veículo encontrado",
          description: `Não há veículos que precisam de ${titulo.toLowerCase()} para exportar.`,
          variant: "default",
        })
        return
      }

      const doc = new jsPDF({ orientation: "landscape" })
      doc.setFontSize(16)
      doc.text(`Relatório de Vistoria de Pneu - ${titulo}`, 14, 15)
      doc.setFontSize(10)
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22)

      const tableColumn = ["Placa", "Modelo", "Marca", "Secretaria", "Km Atual", "Progresso (%)"]
      const tableRows = dados.map((veiculo) => [
        veiculo.placa,
        veiculo.modelo,
        veiculo.marca,
        veiculo.secretaria || "N/A",
        (veiculo.kmAtual || 0).toLocaleString(),
        `${tipo === "alinhar" ? veiculo.progressoAlinhamento : veiculo.progressoBalanceamento}%`,
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [51, 51, 51] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 30, left: 10, right: 10 },
      })

      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        )
      }

      doc.save(`vistoria_pneu_${tipo}_${new Date().toISOString().split("T")[0]}.pdf`)
      
      toast({
        title: "Relatório PDF gerado",
        description: `O relatório de ${titulo.toLowerCase()} foi baixado com sucesso`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Erro ao exportar PDF:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório PDF",
        duration: 5000,
      })
    } finally {
      setVistoriaPneuExportLoading(false)
    }
  }

  const exportarVistoriaPneuExcel = async (tipo: "alinhar" | "balancear") => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      toast({
        title: "Erro",
        description: "Exportação só pode ser executada no cliente",
        variant: "destructive",
      })
      return
    }

    try {
      setVistoriaPneuExportLoading(true)
      const dados = tipo === "alinhar" ? veiculosPrecisamAlinhar : veiculosPrecisamBalancear
      const titulo = tipo === "alinhar" ? "Alinhamento" : "Balanceamento"
      
      if (dados.length === 0) {
        toast({
          title: "Nenhum veículo encontrado",
          description: `Não há veículos que precisam de ${titulo.toLowerCase()} para exportar.`,
          variant: "default",
        })
        return
      }

      const ExcelJS = (await import("exceljs")).default
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(titulo)
      
      worksheet.columns = [
        { header: "Placa", key: "placa", width: 12 },
        { header: "Modelo", key: "modelo", width: 20 },
        { header: "Marca", key: "marca", width: 15 },
        { header: "Secretaria", key: "secretaria", width: 18 },
        { header: "Km Atual", key: "kmAtual", width: 12 },
        { header: "Progresso (%)", key: "progresso", width: 15 },
      ]

      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      }

      dados.forEach((veiculo) => {
        worksheet.addRow({
          placa: veiculo.placa,
          modelo: veiculo.modelo,
          marca: veiculo.marca,
          secretaria: veiculo.secretaria || "N/A",
          kmAtual: veiculo.kmAtual || 0,
          progresso: tipo === "alinhar" ? veiculo.progressoAlinhamento : veiculo.progressoBalanceamento,
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const today = new Date().toISOString().split("T")[0]
      link.download = `vistoria_pneu_${tipo}_${today}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Relatório Excel gerado",
        description: `O relatório de ${titulo.toLowerCase()} foi baixado com sucesso`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Erro ao exportar Excel:", error)
      toast({
        variant: "destructive",
        title: "Erro ao gerar Excel",
        description: "Não foi possível gerar o relatório Excel",
        duration: 5000,
      })
    } finally {
      setVistoriaPneuExportLoading(false)
    }
  }

  // ---------- FUNÇÕES DE EXPORTAÇÃO PARA RELATÓRIOS DE TROCA DE ÓLEO
  const exportarProximoPrazo = async () => {
    try {
      const veiculosProximo = veiculosComDados.filter(
        v => v.status === "Ativo" && 
        (v.kmProxTroca - v.kmAtual) <= 500 && 
        (v.kmProxTroca - v.kmAtual) > 0 && 
        v.ultimaTroca
      )

      if (veiculosProximo.length === 0) {
        toast({
          title: "Nenhum veículo encontrado",
          description: "Não há veículos próximos do prazo para exportar.",
          variant: "default",
        })
        return
      }

      // Buscar produtos para verificar estoque
      const todosProdutos = await getProdutosSupabase()
      const produtosMap = new Map(todosProdutos.map(p => [p.id, p]))

      // Preparar dados dos veículos com filtros
      const relatorioData: Array<{
        veiculo: any
        filtrosTem: Array<{ categoria: string; descricao: string; estoque: number }>
        filtrosNaoTem: Array<{ categoria: string; descricao: string }>
      }> = []

      for (const veiculo of veiculosProximo) {
        const filtros = await getFiltrosDoVeiculoSupabase(veiculo.id)
        const filtrosEmEstoque: Array<{ categoria: string; descricao: string; estoque: number }> = []
        const filtrosFaltando: Array<{ categoria: string; descricao: string }> = []

        // Agrupar filtros por categoria
        const filtrosPorCategoria = new Map<string, FiltroRegistrado[]>()
        for (const filtro of filtros) {
          if (!filtrosPorCategoria.has(filtro.categoria)) {
            filtrosPorCategoria.set(filtro.categoria, [])
          }
          filtrosPorCategoria.get(filtro.categoria)!.push(filtro)
        }

        // Para cada categoria que tem filtros registrados
        for (const [categoria, filtrosCategoria] of filtrosPorCategoria.entries()) {
          // Encontrar o primeiro produto com estoque
          let produtoComEstoque: { categoria: string; descricao: string; estoque: number } | null = null
          
          for (const filtro of filtrosCategoria) {
            const produto = produtosMap.get(filtro.produtoId)
            if (!produto) continue
            
            const estoque = typeof produto.estoque === 'string' ? parseInt(produto.estoque) : produto.estoque
            
            if (estoque > 0) {
              produtoComEstoque = {
                categoria,
                descricao: filtro.produtoDescricao,
                estoque
              }
              break
            }
          }

          if (produtoComEstoque) {
            filtrosEmEstoque.push(produtoComEstoque)
          } else {
            if (filtrosCategoria.length > 0) {
              filtrosFaltando.push({
                categoria,
                descricao: filtrosCategoria[0].produtoDescricao
              })
            }
          }
        }

        relatorioData.push({
          veiculo,
          filtrosTem: filtrosEmEstoque,
          filtrosNaoTem: filtrosFaltando
        })
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Título
              new Paragraph({
                text: "Relatório de Troca de Óleo - Próximo do Prazo",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              // Data de geração
              new Paragraph({
                text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              // Informações gerais
              new Paragraph({
                text: `Total de veículos encontrados: ${relatorioData.length}`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: "",
                spacing: { after: 200 },
              }),
              // Conteúdo do relatório
              ...relatorioData.flatMap((item, index) => [
                new Paragraph({
                  text: `${index + 1}. ${item.veiculo.placa} - ${item.veiculo.modelo} ${item.veiculo.marca}`,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Status: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: item.veiculo.status,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Km Atual: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: item.veiculo.kmAtual.toLocaleString('pt-BR'),
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Km Próxima Troca: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: item.veiculo.kmProxTroca.toLocaleString('pt-BR'),
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Faltam: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: `${(item.veiculo.kmProxTroca - item.veiculo.kmAtual).toLocaleString('pt-BR')} km`,
                      bold: true,
                      color: "FFA500",
                    }),
                  ],
                  spacing: { after: 200 },
                }),
                // Filtros em Estoque
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Filtros em Estoque",
                      bold: true,
                      color: "008000",
                    }),
                    new TextRun({
                      text: ` (${item.filtrosTem.length})`,
                      bold: true,
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                }),
                ...(item.filtrosTem.length > 0
                  ? item.filtrosTem.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria}) - Estoque: ${filtro.estoque.toLocaleString('pt-BR')}`,
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    )
                  : [
                      new Paragraph({
                        text: "Nenhum filtro em estoque",
                        spacing: { after: 100 },
                      }),
                    ]),
                // Filtros Faltando
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Filtros Faltando",
                      bold: true,
                      color: "FF0000",
                    }),
                    new TextRun({
                      text: ` (${item.filtrosNaoTem.length})`,
                      bold: true,
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                }),
                ...(item.filtrosNaoTem.length > 0
                  ? item.filtrosNaoTem.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria})`,
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    )
                  : [
                      new Paragraph({
                        text: "Todos os filtros estão em estoque!",
                        spacing: { after: 100 },
                      }),
                    ]),
                new Paragraph({
                  text: "",
                  spacing: { after: 200 },
                }),
              ]),
              // Lista consolidada de filtros faltando
              ...((): Paragraph[] => {
                const filtrosFaltandoConsolidados = new Map<string, { categoria: string; descricao: string; quantidade: number }>()
                
                relatorioData.forEach(item => {
                  item.filtrosNaoTem.forEach(filtro => {
                    const key = `${filtro.categoria}-${filtro.descricao}`
                    if (filtrosFaltandoConsolidados.has(key)) {
                      filtrosFaltandoConsolidados.get(key)!.quantidade++
                    } else {
                      filtrosFaltandoConsolidados.set(key, { ...filtro, quantidade: 1 })
                    }
                  })
                })

                const listaConsolidada = Array.from(filtrosFaltandoConsolidados.values())
                
                if (listaConsolidada.length > 0) {
                  return [
                    new Paragraph({
                      text: "",
                      spacing: { before: 600, after: 200 },
                    }),
                    new Paragraph({
                      text: "LISTA DE FILTROS PARA COMPRA",
                      heading: HeadingLevel.HEADING_1,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 200 },
                    }),
                    new Paragraph({
                      text: `Filtros faltando consolidados de todos os veículos do relatório (${listaConsolidada.length} ${listaConsolidada.length === 1 ? 'item' : 'itens'})`,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 400 },
                    }),
                    ...listaConsolidada.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria}) - `,
                            }),
                            new TextRun({
                              text: `Quantidade: ${filtro.quantidade}`,
                              bold: true,
                              color: "FF0000",
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    ),
                  ]
                }
                return []
              })(),
            ],
          },
        ],
      })

      // Gerar o arquivo e fazer download
      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const today = new Date().toISOString().split("T")[0]
      link.download = `relatorio_troca_oleo_proximo_prazo_${today}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Relatório exportado!",
        description: "O arquivo Word foi gerado com sucesso.",
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao exportar para Word:", error)
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao gerar o arquivo Word.",
        variant: "destructive",
      })
    }
  }

  const exportarVencido = async () => {
    try {
      const veiculosVencidos = veiculosComDados.filter(
        v => v.status === "Ativo" && 
        (v.kmProxTroca - v.kmAtual) <= 0 && 
        v.ultimaTroca
      )

      if (veiculosVencidos.length === 0) {
        toast({
          title: "Nenhum veículo encontrado",
          description: "Não há veículos vencidos para exportar.",
          variant: "default",
        })
        return
      }

      // Buscar produtos para verificar estoque
      const todosProdutos = await getProdutosSupabase()
      const produtosMap = new Map(todosProdutos.map(p => [p.id, p]))

      // Preparar dados dos veículos com filtros
      const relatorioData: Array<{
        veiculo: any
        filtrosTem: Array<{ categoria: string; descricao: string; estoque: number }>
        filtrosNaoTem: Array<{ categoria: string; descricao: string }>
      }> = []

      for (const veiculo of veiculosVencidos) {
        const filtros = await getFiltrosDoVeiculoSupabase(veiculo.id)
        const filtrosEmEstoque: Array<{ categoria: string; descricao: string; estoque: number }> = []
        const filtrosFaltando: Array<{ categoria: string; descricao: string }> = []

        // Agrupar filtros por categoria
        const filtrosPorCategoria = new Map<string, FiltroRegistrado[]>()
        for (const filtro of filtros) {
          if (!filtrosPorCategoria.has(filtro.categoria)) {
            filtrosPorCategoria.set(filtro.categoria, [])
          }
          filtrosPorCategoria.get(filtro.categoria)!.push(filtro)
        }

        // Para cada categoria que tem filtros registrados
        for (const [categoria, filtrosCategoria] of filtrosPorCategoria.entries()) {
          // Encontrar o primeiro produto com estoque
          let produtoComEstoque: { categoria: string; descricao: string; estoque: number } | null = null
          
          for (const filtro of filtrosCategoria) {
            const produto = produtosMap.get(filtro.produtoId)
            if (!produto) continue
            
            const estoque = typeof produto.estoque === 'string' ? parseInt(produto.estoque) : produto.estoque
            
            if (estoque > 0) {
              produtoComEstoque = {
                categoria,
                descricao: filtro.produtoDescricao,
                estoque
              }
              break
            }
          }

          if (produtoComEstoque) {
            filtrosEmEstoque.push(produtoComEstoque)
          } else {
            if (filtrosCategoria.length > 0) {
              filtrosFaltando.push({
                categoria,
                descricao: filtrosCategoria[0].produtoDescricao
              })
            }
          }
        }

        relatorioData.push({
          veiculo,
          filtrosTem: filtrosEmEstoque,
          filtrosNaoTem: filtrosFaltando
        })
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Título
              new Paragraph({
                text: "Relatório de Troca de Óleo - Vencido",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              // Data de geração
              new Paragraph({
                text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              // Informações gerais
              new Paragraph({
                text: `Total de veículos encontrados: ${relatorioData.length}`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: "",
                spacing: { after: 200 },
              }),
              // Conteúdo do relatório
              ...relatorioData.flatMap((item, index) => [
                new Paragraph({
                  text: `${index + 1}. ${item.veiculo.placa} - ${item.veiculo.modelo} ${item.veiculo.marca}`,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Status: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: item.veiculo.status,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Km Atual: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: item.veiculo.kmAtual.toLocaleString('pt-BR'),
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Km Próxima Troca: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: item.veiculo.kmProxTroca.toLocaleString('pt-BR'),
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Atraso: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: `${Math.abs(item.veiculo.kmProxTroca - item.veiculo.kmAtual).toLocaleString('pt-BR')} km`,
                      bold: true,
                      color: "FF0000",
                    }),
                  ],
                  spacing: { after: 200 },
                }),
                // Filtros em Estoque
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Filtros em Estoque",
                      bold: true,
                      color: "008000",
                    }),
                    new TextRun({
                      text: ` (${item.filtrosTem.length})`,
                      bold: true,
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                }),
                ...(item.filtrosTem.length > 0
                  ? item.filtrosTem.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria}) - Estoque: ${filtro.estoque.toLocaleString('pt-BR')}`,
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    )
                  : [
                      new Paragraph({
                        text: "Nenhum filtro em estoque",
                        spacing: { after: 100 },
                      }),
                    ]),
                // Filtros Faltando
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Filtros Faltando",
                      bold: true,
                      color: "FF0000",
                    }),
                    new TextRun({
                      text: ` (${item.filtrosNaoTem.length})`,
                      bold: true,
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                }),
                ...(item.filtrosNaoTem.length > 0
                  ? item.filtrosNaoTem.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria})`,
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    )
                  : [
                      new Paragraph({
                        text: "Todos os filtros estão em estoque!",
                        spacing: { after: 100 },
                      }),
                    ]),
                new Paragraph({
                  text: "",
                  spacing: { after: 200 },
                }),
              ]),
              // Lista consolidada de filtros faltando
              ...((): Paragraph[] => {
                const filtrosFaltandoConsolidados = new Map<string, { categoria: string; descricao: string; quantidade: number }>()
                
                relatorioData.forEach(item => {
                  item.filtrosNaoTem.forEach(filtro => {
                    const key = `${filtro.categoria}-${filtro.descricao}`
                    if (filtrosFaltandoConsolidados.has(key)) {
                      filtrosFaltandoConsolidados.get(key)!.quantidade++
                    } else {
                      filtrosFaltandoConsolidados.set(key, { ...filtro, quantidade: 1 })
                    }
                  })
                })

                const listaConsolidada = Array.from(filtrosFaltandoConsolidados.values())
                
                if (listaConsolidada.length > 0) {
                  return [
                    new Paragraph({
                      text: "",
                      spacing: { before: 600, after: 200 },
                    }),
                    new Paragraph({
                      text: "LISTA DE FILTROS PARA COMPRA",
                      heading: HeadingLevel.HEADING_1,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 200 },
                    }),
                    new Paragraph({
                      text: `Filtros faltando consolidados de todos os veículos do relatório (${listaConsolidada.length} ${listaConsolidada.length === 1 ? 'item' : 'itens'})`,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 400 },
                    }),
                    ...listaConsolidada.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria}) - `,
                            }),
                            new TextRun({
                              text: `Quantidade: ${filtro.quantidade}`,
                              bold: true,
                              color: "FF0000",
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    ),
                  ]
                }
                return []
              })(),
            ],
          },
        ],
      })

      // Gerar o arquivo e fazer download
      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const today = new Date().toISOString().split("T")[0]
      link.download = `relatorio_troca_oleo_vencido_${today}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Relatório exportado!",
        description: "O arquivo Word foi gerado com sucesso.",
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao exportar para Word:", error)
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao gerar o arquivo Word.",
        variant: "destructive",
      })
    }
  }

  if (isMobile) {
    return <DashboardMobileView />
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <div className="w-full">
          {/* Cards de resumo para visão geral rápida */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-xl animate-fade-in card-interactive" style={{ animationDelay: '0.1s' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-sm">
                    <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Total de Veículos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">{veiculos.length}</div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Total</p>
                  </div>
                  <div className="flex-1 text-center border-l border-r border-border">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {veiculos.filter(v => v.status === "Ativo").length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Ativos</p>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {veiculos.filter(v => v.status === "Inativo").length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Inativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="group relative overflow-hidden border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={() => setTrocasAtrasoDialogOpen(true)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Trocas em Atraso</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                    {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length > 0 ? "Requer atenção urgente" : "Tudo em dia ✓"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-green-200 dark:hover:border-green-800 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Trocas este Mês</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {trocasMesAtual}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium capitalize">
                    {new Date().toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="group relative overflow-hidden border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={() => setKmAtualizacaoDialogOpen(true)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">KM Não Atualizado</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                    {veiculosSemAtualizacaoKm.length}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Mais de 3 dias sem atualizar
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="group relative overflow-hidden border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={() => setVistoriaPneuDialogOpen(true)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Disc className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Vistoria de Pneu</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {vistoriaPneuStats.precisaAlinhar}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Alinhar</p>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {vistoriaPneuStats.precisaBalancear}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Balancear</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      
          {/* Seção de indicadores-chave */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="border-2 shadow-lg bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20">
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Trocas Realizadas
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Histórico mensal de trocas de óleo
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnoOffset(anoOffset + 1)}
                      className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      title="Ano anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300 min-w-[80px] text-center">
                      {new Date().getFullYear() - anoOffset}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnoOffset(Math.max(0, anoOffset - 1))}
                      disabled={anoOffset === 0}
                      className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50"
                      title="Próximo ano"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  </div>
                ) : trocasPorMes.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum dado disponível</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Estatísticas resumidas */}
                    {(() => {
                      const totalAno = trocasPorMes.reduce((acc, item) => acc + item.quantidade, 0)
                      const mediaMensal = Math.round(totalAno / 12)
                      const mesComMaisTrocas = trocasPorMes.reduce((max, item) => 
                        item.quantidade > max.quantidade ? item : max, trocasPorMes[0]
                      )
                      return (
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-muted-foreground mb-1">Total do Ano</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalAno}</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                            <p className="text-xs text-muted-foreground mb-1">Média Mensal</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{mediaMensal}</p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                            <p className="text-xs text-muted-foreground mb-1">Mês com Mais Trocas</p>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {mesComMaisTrocas.nomeMes} ({mesComMaisTrocas.quantidade})
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                    
                    {/* Gráfico de barras */}
                    <div className="h-72 w-full relative p-4 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/20 rounded-lg border">
                      {/* Grade de fundo */}
                      <div className="absolute inset-0 grid grid-cols-1 grid-rows-4 w-full h-full pointer-events-none">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="w-full border-t border-gray-200/50 dark:border-gray-700/50" />
                        ))}
                      </div>
                      {/* Escala Y no lado esquerdo */}
                      <div className="absolute left-2 inset-y-0 flex flex-col justify-between text-xs text-muted-foreground pointer-events-none font-medium">
                        {[...Array(5)].map((_, i) => {
                          const maxQtd = Math.max(...trocasPorMes.map(item => item.quantidade), 1)
                          const max = maxQtd <= 2 ? 4 : maxQtd
                          const value = Math.round((max / 4) * (4 - i))
                          return (
                            <div key={i} className="h-6 flex items-center">
                              {value}
                            </div>
                          )
                        })}
                      </div>
                      {/* Gráfico de barras */}
                      <div className="absolute inset-0 pl-10 pr-4 pt-4 pb-10 flex items-end gap-1.5">
                        {(() => {
                          const maxQtd = Math.max(...trocasPorMes.map(item => item.quantidade), 1)
                          const max = maxQtd <= 2 ? 4 : maxQtd
                          const barWidth = `calc((100% - 16.5px) / ${trocasPorMes.length})`
                          const barColors = [
                            'bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300',
                            'bg-gradient-to-t from-green-600 to-green-400 dark:from-green-500 dark:to-green-300',
                            'bg-gradient-to-t from-yellow-500 to-yellow-300 dark:from-yellow-400 dark:to-yellow-200',
                            'bg-gradient-to-t from-red-600 to-red-400 dark:from-red-500 dark:to-red-300',
                            'bg-gradient-to-t from-purple-600 to-purple-400 dark:from-purple-500 dark:to-purple-300',
                            'bg-gradient-to-t from-pink-600 to-pink-400 dark:from-pink-500 dark:to-pink-300',
                            'bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300',
                            'bg-gradient-to-t from-teal-600 to-teal-400 dark:from-teal-500 dark:to-teal-300',
                            'bg-gradient-to-t from-orange-600 to-orange-400 dark:from-orange-500 dark:to-orange-300',
                            'bg-gradient-to-t from-cyan-600 to-cyan-400 dark:from-cyan-500 dark:to-cyan-300',
                            'bg-gradient-to-t from-lime-600 to-lime-400 dark:from-lime-500 dark:to-lime-300',
                            'bg-gradient-to-t from-gray-500 to-gray-400 dark:from-gray-400 dark:to-gray-300',
                          ];
                          const maxBarHeight = 200; // px
                          return trocasPorMes.map((item, index) => {
                            const alturaPx = item.quantidade > 0 ? (item.quantidade / max) * maxBarHeight : 8;
                            const color = barColors[index % barColors.length];
                            return (
                              <div key={index} className="flex flex-col items-center justify-end group" style={{ minWidth: 0, width: barWidth }}>
                                <div className="mb-1 text-xs font-bold text-blue-700 dark:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" style={{ minHeight: 20 }}>
                                  {item.quantidade > 0 ? item.quantidade : ''}
                                </div>
                                <div
                                  className={`rounded-t-lg transition-all duration-300 ${color} w-full shadow-md hover:shadow-lg hover:scale-105 cursor-pointer`}
                                  style={{ 
                                    height: `${alturaPx}px`, 
                                    minHeight: item.quantidade > 0 ? '4px' : '2px' 
                                  }}
                                  title={`${item.nomeMes}: ${item.quantidade} troca${item.quantidade !== 1 ? 's' : ''}`}
                                />
                              </div>
                            )
                          })
                        })()}
                      </div>
                      {/* Rótulos do eixo X (meses) */}
                      <div className="absolute inset-x-10 bottom-0 flex justify-between text-[10px] font-medium pointer-events-none gap-1.5">
                        {trocasPorMes.map((item, index) => (
                          <div key={index} className="flex-1 text-center" style={{ width: `calc((100% - 16.5px) / ${trocasPorMes.length})` }}>
                            {item.nomeMes}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Alertas e próximas trocas */}
          <div className="grid grid-cols-1 gap-6">
            {/* Espaço reservado para outros cards */}
          </div>
          
          {/* Gráfico de status da troca de óleo */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-2 shadow-lg bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20">
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Distribuição dos Status da Troca de Óleo
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Quantidade de veículos em cada status
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {(() => {
                  // Filtrar apenas veículos ativos para os cálculos
                  const veiculosAtivosComDados = veiculosComDados.filter(v => v.status === "Ativo")
                  const emDia = veiculosAtivosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length
                  const proximo = veiculosAtivosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length
                  const vencido = veiculosAtivosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length
                  const nunca = veiculosAtivosComDados.filter(v => !v.ultimaTroca).length
                  const total = emDia + proximo + vencido + nunca || 1
                  const data = [
                    { label: 'Em Dia', value: emDia, color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400', bgLight: 'bg-green-50 dark:bg-green-950/20' },
                    { label: 'Próximo', value: proximo, color: 'bg-yellow-400', textColor: 'text-yellow-600 dark:text-yellow-400', bgLight: 'bg-yellow-50 dark:bg-yellow-950/20' },
                    { label: 'Vencido', value: vencido, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400', bgLight: 'bg-red-50 dark:bg-red-950/20' },
                    { label: 'Nunca', value: nunca, color: 'bg-gray-400', textColor: 'text-gray-600 dark:text-gray-400', bgLight: 'bg-gray-50 dark:bg-gray-950/20' },
                  ]
                  const maxHeight = 200
                  return (
                    <div className="w-full space-y-6">
                      {/* Gráfico de barras */}
                      <div className="flex w-full items-end gap-3 h-52">
                        {data.map((d, i) => {
                          const porcentagem = total > 0 ? Math.round((d.value / total) * 100) : 0
                          const altura = total > 0 ? Math.round((d.value / total) * maxHeight) : 0
                          return (
                            <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group">
                              {/* Valor e porcentagem acima da barra */}
                              <div className="flex flex-col items-center mb-1">
                                <span className={`text-lg font-bold ${d.textColor}`}>{d.value}</span>
                                <span className="text-xs text-muted-foreground font-medium">{porcentagem}%</span>
                              </div>
                              {/* Barra */}
                              <div 
                                className={`w-full ${d.color} rounded-t-lg transition-all duration-300 hover:opacity-90 shadow-md group-hover:shadow-lg`} 
                                style={{ 
                                  height: `${Math.max(altura, 8)}px`,
                                  minHeight: '8px'
                                }}
                              />
                              {/* Label abaixo da barra */}
                              <span className="text-xs font-medium text-muted-foreground text-center mt-1">
                                {d.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Legenda com cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        {data.map((d) => {
                          const porcentagem = total > 0 ? Math.round((d.value / total) * 100) : 0
                          return (
                            <div 
                              key={d.label} 
                              className={`${d.bgLight} rounded-lg p-3 border border-current/10 transition-all hover:shadow-md`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-3 h-3 rounded-full ${d.color}`} />
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                  {d.label}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-bold ${d.textColor}`}>
                                  {d.value}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({porcentagem}%)
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Card Troca de Óleo - Movido para o final */}
            <Card className="border-2 shadow-lg bg-gradient-to-br from-white to-cyan-50/30 dark:from-gray-900 dark:to-cyan-950/20">
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-md">
                      <Droplets className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        Troca de Óleo
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Status das trocas de óleo da frota
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="em-dia" value={abaTrocaOleo} onValueChange={setAbaTrocaOleo} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                    <TabsTrigger value="em-dia" className="text-green-600 data-[state=active]:font-bold data-[state=active]:bg-green-50 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-950/30">
                      Em Dia
                    </TabsTrigger>
                    <TabsTrigger value="proximo" className="text-yellow-600 data-[state=active]:font-bold data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 dark:data-[state=active]:bg-yellow-950/30">
                      Próximo do Prazo
                    </TabsTrigger>
                    <TabsTrigger value="vencido" className="text-red-600 data-[state=active]:font-bold data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-950/30">
                      Vencido
                    </TabsTrigger>
                    <TabsTrigger value="nunca" className="text-gray-500 data-[state=active]:font-bold data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 dark:data-[state=active]:bg-gray-950/30">
                      Nunca Registrado
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="em-dia" className="mt-6">
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-50/50 dark:bg-green-950/20">
                            <TableHead className="text-xs font-semibold text-muted-foreground h-10">Placa</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Modelo</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Marca</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Km Atual</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Km Próx. Troca</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Faltam (km)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca)
                            .slice(0, verMais['em-dia'] ? undefined : 10)
                            .map(v => (
                              <TableRow key={v.id} className="hover:bg-green-50/30 dark:hover:bg-green-950/10 transition-colors">
                                <TableCell className="text-xs py-2 font-medium">{v.placa}</TableCell>
                                <TableCell className="text-xs py-2">{v.modelo}</TableCell>
                                <TableCell className="text-xs py-2 text-muted-foreground">{v.marca}</TableCell>
                                <TableCell className="text-xs py-2 font-mono">{v.kmAtual.toLocaleString()}</TableCell>
                                <TableCell className="text-xs py-2 font-mono">{v.kmProxTroca.toLocaleString()}</TableCell>
                                <TableCell className="text-xs py-2 font-mono text-green-600 dark:text-green-400 font-semibold">
                                  {(v.kmProxTroca - v.kmAtual).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4 pb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setVerMais(prev => ({ ...prev, 'em-dia': !prev['em-dia'] }))}
                          >
                            {verMais['em-dia'] ? 'Ver menos' : 'Ver mais'}
                          </Button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length === 0 && (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                          Nenhum veículo em dia
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="proximo" className="mt-6">
                    <div className="mb-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportarProximoPrazo}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Exportar Relatório Word
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-yellow-50/50 dark:bg-yellow-950/20">
                            <TableHead className="text-xs font-semibold text-muted-foreground h-10">Placa</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Modelo</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Marca</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Km Atual</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Km Próx. Troca</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Faltam (km)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca)
                            .slice(0, verMais['proximo'] ? undefined : 10)
                            .map(v => (
                              <TableRow key={v.id} className="hover:bg-yellow-50/30 dark:hover:bg-yellow-950/10 transition-colors">
                                <TableCell className="text-xs py-2 font-medium">{v.placa}</TableCell>
                                <TableCell className="text-xs py-2">{v.modelo}</TableCell>
                                <TableCell className="text-xs py-2 text-muted-foreground">{v.marca}</TableCell>
                                <TableCell className="text-xs py-2 font-mono">{v.kmAtual.toLocaleString()}</TableCell>
                                <TableCell className="text-xs py-2 font-mono">{v.kmProxTroca.toLocaleString()}</TableCell>
                                <TableCell className="text-xs py-2 font-mono text-yellow-600 dark:text-yellow-400 font-semibold">
                                  {(v.kmProxTroca - v.kmAtual).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4 pb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setVerMais(prev => ({ ...prev, 'proximo': !prev['proximo'] }))}
                          >
                            {verMais['proximo'] ? 'Ver menos' : 'Ver mais'}
                          </Button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length === 0 && (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                          Nenhum veículo próximo do prazo
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="vencido" className="mt-6">
                    <div className="mb-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportarVencido}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Exportar Relatório Word
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                            <TableHead className="text-xs font-semibold text-muted-foreground h-10">Placa</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Modelo</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Marca</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Km Atual</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Km Próx. Troca</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Faltam (km)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca)
                            .slice(0, verMais['vencido'] ? undefined : 10)
                            .map(v => (
                              <TableRow key={v.id} className="hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-colors">
                                <TableCell className="text-xs py-2 font-medium">{v.placa}</TableCell>
                                <TableCell className="text-xs py-2">{v.modelo}</TableCell>
                                <TableCell className="text-xs py-2 text-muted-foreground">{v.marca}</TableCell>
                                <TableCell className="text-xs py-2 font-mono">{v.kmAtual.toLocaleString()}</TableCell>
                                <TableCell className="text-xs py-2 font-mono">{v.kmProxTroca.toLocaleString()}</TableCell>
                                <TableCell className="text-xs py-2 font-mono text-red-600 dark:text-red-400 font-semibold">
                                  {(v.kmProxTroca - v.kmAtual).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4 pb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setVerMais(prev => ({ ...prev, 'vencido': !prev['vencido'] }))}
                          >
                            {verMais['vencido'] ? 'Ver menos' : 'Ver mais'}
                          </Button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => v.status === "Ativo" && (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length === 0 && (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                          Nenhum veículo vencido
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="nunca" className="mt-6">
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/50 dark:bg-gray-950/20">
                            <TableHead className="text-xs font-semibold text-muted-foreground h-10">Placa</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Modelo</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Marca</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Km Atual</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground">Km Próx. Troca</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {veiculosComDados.filter(v => v.status === "Ativo" && !v.ultimaTroca)
                            .slice(0, verMais['nunca'] ? undefined : 10)
                            .map(v => (
                              <TableRow key={v.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-950/10 transition-colors">
                                <TableCell className="text-xs py-2 font-medium">{v.placa}</TableCell>
                                <TableCell className="text-xs py-2">{v.modelo}</TableCell>
                                <TableCell className="text-xs py-2 text-muted-foreground">{v.marca}</TableCell>
                                <TableCell className="text-xs py-2 font-mono">{v.kmAtual.toLocaleString()}</TableCell>
                                <TableCell className="text-xs py-2 font-mono">{v.kmProxTroca.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      {veiculosComDados.filter(v => v.status === "Ativo" && !v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4 pb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setVerMais(prev => ({ ...prev, 'nunca': !prev['nunca'] }))}
                          >
                            {verMais['nunca'] ? 'Ver menos' : 'Ver mais'}
                          </Button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => v.status === "Ativo" && !v.ultimaTroca).length === 0 && (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                          Nenhum veículo sem registro
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
      </div>

      {/* Diálogo de Trocas em Atraso */}
      <Dialog open={trocasAtrasoDialogOpen} onOpenChange={setTrocasAtrasoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trocas de Óleo em Atraso</DialogTitle>
            <DialogDescription>
              Lista de veículos que estão com a troca de óleo em atraso
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">Nenhum veículo com troca em atraso!</p>
                <p className="text-sm">Todos os veículos estão em dia com suas trocas de óleo.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-right">Km Atual</TableHead>
                    <TableHead className="text-right">Km Próx. Troca</TableHead>
                    <TableHead className="text-right">Atraso (km)</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculosComDados
                    .filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca)
                    .sort((a, b) => (a.kmAtual - a.kmProxTroca) - (b.kmAtual - b.kmProxTroca))
                    .map((veiculo) => {
                      const atraso = veiculo.kmAtual - veiculo.kmProxTroca
                      return (
                        <TableRow key={veiculo.id} className="hover:bg-red-50 dark:hover:bg-red-900/10">
                          <TableCell className="font-medium">{veiculo.placa}</TableCell>
                          <TableCell>{veiculo.modelo}</TableCell>
                          <TableCell>{veiculo.marca}</TableCell>
                          <TableCell className="text-right">{veiculo.kmAtual.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{veiculo.kmProxTroca.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                            {atraso.toLocaleString()} km
                          </TableCell>
                          <TableCell>
                            {veiculo.userId || veiculo.user_id
                              ? usuariosKmMap[veiculo.userId || veiculo.user_id] || 'Sistema'
                              : 'Sistema'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Atualização de KM */}
      <Dialog open={kmAtualizacaoDialogOpen} onOpenChange={(open) => {
        setKmAtualizacaoDialogOpen(open)
        if (!open) {
          // Limpar filtros ao fechar
          setKmSearchTerm("")
          setKmSecretariaFilter("all")
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Atualização de Quilometragem</DialogTitle>
            <DialogDescription className="text-base">
              Veículos que atualizaram e não atualizaram KM nos últimos 3 dias
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-3">
            {/* Barra de pesquisa e filtros */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por placa, modelo ou marca..."
                  className="pl-8 h-9 text-sm"
                  value={kmSearchTerm}
                  onChange={(e) => setKmSearchTerm(e.target.value)}
                />
              </div>
              <Select value={kmSecretariaFilter} onValueChange={setKmSecretariaFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Filtrar por secretaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as secretarias</SelectItem>
                  {Array.from(new Set([...veiculosSemAtualizacaoKm, ...veiculosComAtualizacaoKm]
                    .map(v => v.secretaria)
                    .filter(Boolean)))
                    .sort()
                    .map(secretaria => (
                      <SelectItem key={secretaria} value={secretaria}>{secretaria}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-sm"
                onClick={() => setKmPdfDialogOpen(true)}
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                Baixar PDF
              </Button>
            </div>

            <Tabs defaultValue="sem-atualizacao" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sem-atualizacao" className="text-amber-600 data-[state=active]:font-bold">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Não Atualizaram ({veiculosSemAtualizacaoKm.filter(v => {
                    const matchesSearch = !kmSearchTerm || 
                      v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                    const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                    return matchesSearch && matchesSecretaria
                  }).length})
                </TabsTrigger>
                <TabsTrigger value="com-atualizacao" className="text-green-600 data-[state=active]:font-bold">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Atualizaram ({veiculosComAtualizacaoKm.filter(v => {
                    const matchesSearch = !kmSearchTerm || 
                      v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                    const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                    return matchesSearch && matchesSecretaria
                  }).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sem-atualizacao" className="mt-6">
                {(() => {
                  const filtered = veiculosSemAtualizacaoKm.filter(v => {
                    const matchesSearch = !kmSearchTerm || 
                      v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                    const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                    return matchesSearch && matchesSecretaria
                  })

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p className="text-lg font-medium">
                          {veiculosSemAtualizacaoKm.length === 0 
                            ? "Todos os veículos atualizaram KM nos últimos 3 dias!"
                            : "Nenhum veículo encontrado com os filtros aplicados"}
                        </p>
                        <p className="text-sm mt-2">
                          {veiculosSemAtualizacaoKm.length === 0 
                            ? "Nenhum veículo precisa de atenção."
                            : "Tente ajustar os filtros de busca ou secretaria."}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="border rounded-lg overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Placa</TableHead>
                            <TableHead className="font-semibold">Modelo</TableHead>
                            <TableHead className="font-semibold">Marca</TableHead>
                            <TableHead className="font-semibold">Secretaria</TableHead>
                            <TableHead className="text-right font-semibold">Km Atual</TableHead>
                            <TableHead className="font-semibold">Última Atualização</TableHead>
                            <TableHead className="text-right font-semibold">Dias Sem Atualizar</TableHead>
                            <TableHead className="font-semibold">Usuário</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered
                            .sort((a, b) => {
                              const diasA = a.diasSemAtualizar ?? 999
                              const diasB = b.diasSemAtualizar ?? 999
                              return diasB - diasA
                            })
                            .map((veiculo) => (
                            <TableRow key={veiculo.id} className="hover:bg-amber-50 dark:hover:bg-amber-900/10 border-b">
                              <TableCell className="font-medium">{veiculo.placa}</TableCell>
                              <TableCell>{veiculo.modelo}</TableCell>
                              <TableCell>{veiculo.marca}</TableCell>
                              <TableCell className="text-muted-foreground">{veiculo.secretaria || 'N/A'}</TableCell>
                              <TableCell className="text-right font-medium">{veiculo.kmAtual?.toLocaleString() || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {veiculo.ultimaAtualizacaoKm 
                                    ? formatarData(veiculo.ultimaAtualizacaoKm.toISOString())
                                    : 'Nunca atualizado'}
                                  {veiculo.userId || veiculo.user_id
                                    ? (
                                        <div className="text-xs text-muted-foreground">
                                          {usuariosKmMap[veiculo.userId || veiculo.user_id] || 'Sistema'}
                                        </div>
                                      )
                                    : (
                                        <div className="text-xs text-muted-foreground">Sistema</div>
                                      )}
                                  {veiculo.tipoUltimaAtualizacao && (
                                    <div className="text-xs text-muted-foreground">
                                      {veiculo.tipoUltimaAtualizacao}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">
                                {veiculo.diasSemAtualizar !== null 
                                  ? `${veiculo.diasSemAtualizar} ${veiculo.diasSemAtualizar === 1 ? 'dia' : 'dias'}`
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {veiculo.userId || veiculo.user_id
                                  ? usuariosKmMap[veiculo.userId || veiculo.user_id] || 'Sistema'
                                  : 'Sistema'}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  )
                })()}
              </TabsContent>

              <TabsContent value="com-atualizacao" className="mt-6">
                {(() => {
                  const filtered = veiculosComAtualizacaoKm.filter(v => {
                    const matchesSearch = !kmSearchTerm || 
                      v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                    const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                    return matchesSearch && matchesSecretaria
                  })

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                        <p className="text-lg font-medium">
                          {veiculosComAtualizacaoKm.length === 0 
                            ? "Nenhum veículo atualizou KM nos últimos 3 dias."
                            : "Nenhum veículo encontrado com os filtros aplicados"}
                        </p>
                        <p className="text-sm mt-2">
                          {veiculosComAtualizacaoKm.length === 0 
                            ? "Todos os veículos precisam atualizar a quilometragem."
                            : "Tente ajustar os filtros de busca ou secretaria."}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="border rounded-lg overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Placa</TableHead>
                            <TableHead className="font-semibold">Modelo</TableHead>
                            <TableHead className="font-semibold">Marca</TableHead>
                            <TableHead className="font-semibold">Secretaria</TableHead>
                            <TableHead className="text-right font-semibold">Km Atual</TableHead>
                            <TableHead className="font-semibold">Última Atualização</TableHead>
                            <TableHead className="text-right font-semibold">Dias Desde Atualização</TableHead>
                            <TableHead className="font-semibold">Usuário</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered
                            .sort((a, b) => {
                              const dataA = a.ultimaAtualizacaoKm?.getTime() || 0
                              const dataB = b.ultimaAtualizacaoKm?.getTime() || 0
                              return dataB - dataA
                            })
                            .map((veiculo) => {
                            const diasDesdeAtualizacao = veiculo.ultimaAtualizacaoKm
                              ? Math.floor((new Date().getTime() - veiculo.ultimaAtualizacaoKm.getTime()) / (1000 * 60 * 60 * 24))
                              : null
                            return (
                              <TableRow key={veiculo.id} className="hover:bg-green-50 dark:hover:bg-green-900/10 border-b">
                                <TableCell className="font-medium">{veiculo.placa}</TableCell>
                                <TableCell>{veiculo.modelo}</TableCell>
                                <TableCell>{veiculo.marca}</TableCell>
                                <TableCell className="text-muted-foreground">{veiculo.secretaria || 'N/A'}</TableCell>
                                <TableCell className="text-right font-medium">{veiculo.kmAtual?.toLocaleString() || 'N/A'}</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {veiculo.ultimaAtualizacaoKm 
                                      ? formatarData(veiculo.ultimaAtualizacaoKm.toISOString())
                                      : 'N/A'}
                                    {veiculo.tipoUltimaAtualizacao && (
                                      <div className="text-xs text-muted-foreground">
                                        {veiculo.tipoUltimaAtualizacao}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                                  {diasDesdeAtualizacao !== null 
                                    ? `${diasDesdeAtualizacao} ${diasDesdeAtualizacao === 1 ? 'dia' : 'dias'}`
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {veiculo.userId || veiculo.user_id
                                    ? usuariosKmMap[veiculo.userId || veiculo.user_id] || 'Sistema'
                                    : 'Sistema'}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                  )
                })()}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para escolher opção de PDF */}
      <Dialog open={kmPdfDialogOpen} onOpenChange={setKmPdfDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Baixar Relatório PDF</DialogTitle>
            <DialogDescription>
              Escolha quais veículos deseja incluir no relatório
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={kmPdfOption} onValueChange={(value: "sem-atualizacao" | "com-atualizacao" | "ambos") => setKmPdfOption(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sem-atualizacao">
                  Não Atualizaram ({veiculosSemAtualizacaoKm.filter(v => {
                    const matchesSearch = !kmSearchTerm || 
                      v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                    const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                    return matchesSearch && matchesSecretaria
                  }).length})
                </SelectItem>
                <SelectItem value="com-atualizacao">
                  Atualizaram ({veiculosComAtualizacaoKm.filter(v => {
                    const matchesSearch = !kmSearchTerm || 
                      v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                    const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                    return matchesSearch && matchesSecretaria
                  }).length})
                </SelectItem>
                <SelectItem value="ambos">
                  Ambos ({veiculosSemAtualizacaoKm.filter(v => {
                    const matchesSearch = !kmSearchTerm || 
                      v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                    const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                    return matchesSearch && matchesSecretaria
                  }).length + veiculosComAtualizacaoKm.filter(v => {
                    const matchesSearch = !kmSearchTerm || 
                      v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                      v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                    const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                    return matchesSearch && matchesSecretaria
                  }).length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setKmPdfDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Filtrar veículos baseado nos filtros aplicados
              const filterVeiculos = (veiculos: any[]) => {
                return veiculos.filter(v => {
                  const matchesSearch = !kmSearchTerm || 
                    v.placa?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                    v.modelo?.toLowerCase().includes(kmSearchTerm.toLowerCase()) ||
                    v.marca?.toLowerCase().includes(kmSearchTerm.toLowerCase())
                  const matchesSecretaria = kmSecretariaFilter === "all" || v.secretaria === kmSecretariaFilter
                  return matchesSearch && matchesSecretaria
                })
              }

              let veiculosParaPdf: any[] = []
              let tituloSecao = ""

              if (kmPdfOption === "sem-atualizacao") {
                veiculosParaPdf = filterVeiculos(veiculosSemAtualizacaoKm)
                tituloSecao = "Veículos que NÃO Atualizaram KM"
              } else if (kmPdfOption === "com-atualizacao") {
                veiculosParaPdf = filterVeiculos(veiculosComAtualizacaoKm)
                tituloSecao = "Veículos que Atualizaram KM"
              } else {
                const semAtualizacao = filterVeiculos(veiculosSemAtualizacaoKm)
                const comAtualizacao = filterVeiculos(veiculosComAtualizacaoKm)
                veiculosParaPdf = [...semAtualizacao, ...comAtualizacao]
                tituloSecao = "Todos os Veículos"
              }

              // Gerar PDF
              const doc = new jsPDF({ orientation: "landscape" })
              doc.setFontSize(16)
              doc.text("Relatório de Atualização de Quilometragem", 14, 15)
              doc.setFontSize(10)
              doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22)
              
              let startY = 30

              if (kmPdfOption === "ambos") {
                // Seção: Não Atualizaram
                const semAtualizacao = filterVeiculos(veiculosSemAtualizacaoKm)
                if (semAtualizacao.length > 0) {
                  if (startY > 20) {
                    doc.addPage()
                    startY = 20
                  }
                  doc.setFontSize(12)
                  doc.setTextColor(255, 140, 0) // Laranja/Amber
                  doc.text("Veículos que NÃO Atualizaram KM", 14, startY)
                  startY += 8
                  
                  const tableData = semAtualizacao
                    .sort((a, b) => {
                      const diasA = a.diasSemAtualizar ?? 999
                      const diasB = b.diasSemAtualizar ?? 999
                      return diasB - diasA
                    })
                    .map(v => [
                      v.placa || "",
                      v.modelo || "",
                      v.marca || "",
                      v.secretaria || "N/A",
                      v.kmAtual?.toLocaleString() || "N/A",
                      v.ultimaAtualizacaoKm 
                        ? formatarData(v.ultimaAtualizacaoKm.toISOString())
                        : "Nunca atualizado",
                      v.diasSemAtualizar !== null 
                        ? `${v.diasSemAtualizar} ${v.diasSemAtualizar === 1 ? 'dia' : 'dias'}`
                        : "N/A",
                      v.userId || v.user_id
                        ? usuariosKmMap[v.userId || v.user_id] || "Sistema"
                        : "Sistema"
                    ])

                  autoTable(doc, {
                    head: [["Placa", "Modelo", "Marca", "Secretaria", "Km Atual", "Última Atualização", "Dias Sem Atualizar", "Usuário"]],
                    body: tableData,
                    startY: startY,
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [255, 140, 0] },
                    alternateRowStyles: { fillColor: [255, 250, 240] },
                    margin: { top: startY, left: 10, right: 10 },
                  })
                  startY = doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 15 : startY + 50
                }

                // Seção: Atualizaram
                const comAtualizacao = filterVeiculos(veiculosComAtualizacaoKm)
                if (comAtualizacao.length > 0) {
                  if (startY > 150) {
                    doc.addPage()
                    startY = 20
                  }
                  doc.setFontSize(12)
                  doc.setTextColor(34, 197, 94) // Verde
                  doc.text("Veículos que Atualizaram KM", 14, startY)
                  startY += 8
                  
                  const tableData = comAtualizacao
                    .sort((a, b) => {
                      const dataA = a.ultimaAtualizacaoKm?.getTime() || 0
                      const dataB = b.ultimaAtualizacaoKm?.getTime() || 0
                      return dataB - dataA
                    })
                    .map(v => {
                      const diasDesdeAtualizacao = v.ultimaAtualizacaoKm
                        ? Math.floor((new Date().getTime() - v.ultimaAtualizacaoKm.getTime()) / (1000 * 60 * 60 * 24))
                        : null
                      return [
                        v.placa || "",
                        v.modelo || "",
                        v.marca || "",
                        v.secretaria || "N/A",
                        v.kmAtual?.toLocaleString() || "N/A",
                        v.ultimaAtualizacaoKm 
                          ? formatarData(v.ultimaAtualizacaoKm.toISOString())
                          : "N/A",
                        diasDesdeAtualizacao !== null 
                          ? `${diasDesdeAtualizacao} ${diasDesdeAtualizacao === 1 ? 'dia' : 'dias'}`
                          : "N/A",
                        v.userId || v.user_id
                          ? usuariosKmMap[v.userId || v.user_id] || "Sistema"
                          : "Sistema"
                      ]
                    })

                  autoTable(doc, {
                    head: [["Placa", "Modelo", "Marca", "Secretaria", "Km Atual", "Última Atualização", "Dias Desde Atualização", "Usuário"]],
                    body: tableData,
                    startY: startY,
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [34, 197, 94] },
                    alternateRowStyles: { fillColor: [240, 253, 244] },
                    margin: { top: startY, left: 10, right: 10 },
                  })
                }
              } else {
                // Uma única seção
                doc.setFontSize(12)
                doc.setTextColor(0, 0, 0)
                doc.text(tituloSecao, 14, startY)
                startY += 8

                const tableData = veiculosParaPdf
                  .sort((a, b) => {
                    if (kmPdfOption === "sem-atualizacao") {
                      const diasA = a.diasSemAtualizar ?? 999
                      const diasB = b.diasSemAtualizar ?? 999
                      return diasB - diasA
                    } else {
                      const dataA = a.ultimaAtualizacaoKm?.getTime() || 0
                      const dataB = b.ultimaAtualizacaoKm?.getTime() || 0
                      return dataB - dataA
                    }
                  })
                  .map(v => {
                    if (kmPdfOption === "sem-atualizacao") {
                      return [
                        v.placa || "",
                        v.modelo || "",
                        v.marca || "",
                        v.secretaria || "N/A",
                        v.kmAtual?.toLocaleString() || "N/A",
                        v.ultimaAtualizacaoKm 
                          ? formatarData(v.ultimaAtualizacaoKm.toISOString())
                          : "Nunca atualizado",
                        v.diasSemAtualizar !== null 
                          ? `${v.diasSemAtualizar} ${v.diasSemAtualizar === 1 ? 'dia' : 'dias'}`
                          : "N/A",
                        v.userId || v.user_id
                          ? usuariosKmMap[v.userId || v.user_id] || "Sistema"
                          : "Sistema"
                      ]
                    } else {
                      const diasDesdeAtualizacao = v.ultimaAtualizacaoKm
                        ? Math.floor((new Date().getTime() - v.ultimaAtualizacaoKm.getTime()) / (1000 * 60 * 60 * 24))
                        : null
                      return [
                        v.placa || "",
                        v.modelo || "",
                        v.marca || "",
                        v.secretaria || "N/A",
                        v.kmAtual?.toLocaleString() || "N/A",
                        v.ultimaAtualizacaoKm 
                          ? formatarData(v.ultimaAtualizacaoKm.toISOString())
                          : "N/A",
                        diasDesdeAtualizacao !== null 
                          ? `${diasDesdeAtualizacao} ${diasDesdeAtualizacao === 1 ? 'dia' : 'dias'}`
                          : "N/A",
                        v.userId || v.user_id
                          ? usuariosKmMap[v.userId || v.user_id] || "Sistema"
                          : "Sistema"
                      ]
                    }
                  })

                const headers = kmPdfOption === "sem-atualizacao"
                  ? [["Placa", "Modelo", "Marca", "Secretaria", "Km Atual", "Última Atualização", "Dias Sem Atualizar", "Usuário"]]
                  : [["Placa", "Modelo", "Marca", "Secretaria", "Km Atual", "Última Atualização", "Dias Desde Atualização", "Usuário"]]

                autoTable(doc, {
                  head: headers,
                  body: tableData,
                  startY: startY,
                  styles: { fontSize: 8, cellPadding: 2 },
                  headStyles: { 
                    fillColor: kmPdfOption === "sem-atualizacao" ? [255, 140, 0] : [34, 197, 94] 
                  },
                  alternateRowStyles: { 
                    fillColor: kmPdfOption === "sem-atualizacao" ? [255, 250, 240] : [240, 253, 244] 
                  },
                  margin: { top: startY, left: 10, right: 10 },
                })
              }

              // Adicionar rodapé com número de página
              const pageCount = doc.internal.getNumberOfPages()
              for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(0, 0, 0)
                doc.text(
                  `Página ${i} de ${pageCount}`,
                  doc.internal.pageSize.getWidth() / 2,
                  doc.internal.pageSize.getHeight() - 10,
                  { align: "center" }
                )
              }

              // Salvar o PDF
              const nomeArquivo = `atualizacao_km_${kmPdfOption}_${new Date().toISOString().split("T")[0]}.pdf`
              doc.save(nomeArquivo)
              
              setKmPdfDialogOpen(false)
            }}>
              Baixar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Vistoria de Pneu */}
      <Dialog open={vistoriaPneuDialogOpen} onOpenChange={setVistoriaPneuDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Vistoria de Pneu</DialogTitle>
                <DialogDescription>
                  Lista de veículos que precisam de alinhamento e balanceamento
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportarVistoriaPneuPDF(vistoriaPneuAbaAtiva as "alinhar" | "balancear")}
                  disabled={vistoriaPneuExportLoading || (vistoriaPneuAbaAtiva === "alinhar" ? veiculosPrecisamAlinhar.length === 0 : veiculosPrecisamBalancear.length === 0)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportarVistoriaPneuExcel(vistoriaPneuAbaAtiva as "alinhar" | "balancear")}
                  disabled={vistoriaPneuExportLoading || (vistoriaPneuAbaAtiva === "alinhar" ? veiculosPrecisamAlinhar.length === 0 : veiculosPrecisamBalancear.length === 0)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="alinhar" value={vistoriaPneuAbaAtiva} onValueChange={setVistoriaPneuAbaAtiva} className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="alinhar" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Alinhar
                <Badge variant="secondary" className="ml-1">
                  {veiculosPrecisamAlinhar.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="balancear" className="flex items-center gap-2">
                <Disc className="h-4 w-4" />
                Balancear
                <Badge variant="secondary" className="ml-1">
                  {veiculosPrecisamBalancear.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="alinhar" className="flex-1 overflow-y-auto mt-4">
              {veiculosPrecisamAlinhar.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum veículo precisa de alinhamento no momento.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Km Atual</TableHead>
                        <TableHead>Progresso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {veiculosPrecisamAlinhar.map((veiculo) => (
                        <TableRow key={veiculo.id}>
                          <TableCell className="font-medium">{veiculo.placa}</TableCell>
                          <TableCell>{veiculo.modelo}</TableCell>
                          <TableCell>{veiculo.marca}</TableCell>
                          <TableCell>{veiculo.kmAtual?.toLocaleString() || 0} km</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={veiculo.progressoAlinhamento} className="h-2 w-20" />
                              <span className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                                {veiculo.progressoAlinhamento}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="balancear" className="flex-1 overflow-y-auto mt-4">
              {veiculosPrecisamBalancear.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Disc className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum veículo precisa de balanceamento no momento.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Km Atual</TableHead>
                        <TableHead>Progresso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {veiculosPrecisamBalancear.map((veiculo) => (
                        <TableRow key={veiculo.id}>
                          <TableCell className="font-medium">{veiculo.placa}</TableCell>
                          <TableCell>{veiculo.modelo}</TableCell>
                          <TableCell>{veiculo.marca}</TableCell>
                          <TableCell>{veiculo.kmAtual?.toLocaleString() || 0} km</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={veiculo.progressoBalanceamento} className="h-2 w-20" />
                              <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                {veiculo.progressoBalanceamento}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button onClick={() => setVistoriaPneuDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
