"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getVeiculosSupabase } from "@/services/veiculo-service"
import { getTrocasOleo, getUltimaTrocaOleo, getEstatisticasTrocasOleo, getUltimoRegistro } from "@/services/troca-oleo-service"
import { getProdutosSupabase } from "@/services/produto-service"
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
import { CalendarIcon, Car, Clock, BarChart3, Package, Droplets, ArrowRight, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Activity, ChevronLeft, ChevronRight, Wrench, Users, ArrowLeft, FileText, CalendarRange, Disc, History, ClipboardList, Calendar, Settings, FolderOpen, FuelIcon as Oil, Search, Filter, Download } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useIsMobile } from "@/components/ui/use-mobile"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
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
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`
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
  const { verificarPermissao } = useAuth()
  const router = useRouter()
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  
  const handleNavigation = (href: string) => {
    setNavigatingTo(href)
    // Pequeno delay para mostrar a animação antes de navegar
    setTimeout(() => {
      router.push(href)
    }, 150)
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
  const categoriasFiltradas = categorias.map(categoria => ({
    ...categoria,
    atalhos: categoria.atalhos.filter(atalho => verificarPermissao(atalho.href))
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
        <div className="space-y-2">
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
                      className="block cursor-pointer"
                    >
                      <Card className={`border-l-4 ${colors.border} border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97] ${colors.bg} ${colors.hover} ${
                        isNavigating ? 'opacity-75 scale-95' : ''
                      }`}>
                        <CardContent className="p-3">
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
  const [mesOffset, setMesOffset] = useState(0) // Offset em meses para navegação no gráfico
  const [todasTrocas, setTodasTrocas] = useState<Historico[]>([]) // Armazenar todas as trocas para navegação
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

  // Função para atualizar todos os dados
  const atualizarDashboard = async () => {
    setLoading(true)
    try {
      // Carregar dados de veículos
      const veiculosData = await getVeiculosSupabase()
      setVeiculos(veiculosData)
      
      // Próximas trocas
      const veiculosAtivos = veiculosData.filter(v => v.status === "Ativo" && v.kmAtual !== undefined)
      
      const proximasTrocasData = [...veiculosAtivos]
        .map(v => ({
          ...v,
          diff: v.kmProxTroca - v.kmAtual
        }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 5)
        
      setProximasTrocas(proximasTrocasData)
      
      // Históricos - carregar em paralelo para melhor performance
      const historicosPromises = veiculosAtivos.map(async (v) => {
        try {
          // Usar o serviço da nova tabela trocas_oleo
          const trocasData = await getTrocasOleo(v.id)
          
          // Mapear para o formato esperado pelo componente
          return trocasData.map(item => {
            const dataProcessada = item.data_troca ? new Date(item.data_troca) : new Date()
            
            return {
              id: item.id,
              data: dataProcessada.toISOString(), // Garantir que seja uma string ISO válida
              tipo: item.tipo_servico || "Troca de Óleo", // Valor padrão se não estiver definido
              kmAtual: item.km_atual,
              kmAnterior: item.km_anterior,
              kmProxTroca: item.km_proxima_troca,
              observacao: item.observacao,
              veiculoId: item.veiculo_id
            }
          })
        } catch (err) {
          // Tratar especificamente erros de rede/fetch
          if (err instanceof TypeError && err.message === 'Failed to fetch') {
            console.warn(`⚠️ Erro de conexão ao buscar histórico do veículo ${v.id}. Verifique a conexão com o Supabase.`)
          } else {
            console.error(`Erro ao buscar histórico do veículo ${v.id}:`, err)
          }
          return []
        }
      })
      
      // Aguardar todas as chamadas em paralelo
      const historicosArrays = await Promise.all(historicosPromises)
      const historicos = historicosArrays.flat()
      
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
      
      // Trocas por mês - últimos 6 meses, incluindo meses sem trocas
      const trocas = historicos.filter(h => isTrocaOleo(h.tipo))
      
      // Armazenar todas as trocas para navegação
      setTodasTrocas(trocas)
      
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
      
      // Após carregar veiculosData:
      const veiculosPromises = veiculosData.map(async (veiculo) => {
        try {
          const estatisticas = await getEstatisticasTrocasOleo(veiculo.id)
          return {
            ...veiculo,
            ultimaTroca: estatisticas.ultimaTroca,
            kmAtual: estatisticas.kmAtual || veiculo.kmAtual || 0,
            kmProxTroca: estatisticas.kmProxTroca || 0,
            progresso: estatisticas.progresso
          }
        } catch (error) {
          // Erro ao buscar estatísticas - usar valores padrão
          console.warn(`Erro ao buscar estatísticas do veículo ${veiculo.id}:`, error)
          return {
            ...veiculo,
            ultimaTroca: null,
            kmAtual: veiculo.kmAtual || 0,
            kmProxTroca: 0,
            progresso: 0
          }
        }
      })
      const veiculosComDadosList = await Promise.all(veiculosPromises)
      setVeiculosComDados(veiculosComDadosList)
      
      // Calcular veículos que não atualizaram KM em 3 dias
      const dataLimite = new Date()
      dataLimite.setHours(0, 0, 0, 0) // Zerar horas para comparar apenas datas
      dataLimite.setDate(dataLimite.getDate() - 3) // 3 dias atrás
      
      const veiculosKmPromises = veiculosData
        .filter(v => v.status === "Ativo")
        .map(async (veiculo) => {
          try {
            const ultimoRegistro = await getUltimoRegistro(veiculo.id)
            // Usar created_at para saber quando o registro foi realmente criado
            // Isso é mais confiável que data_troca que pode ser uma data passada escolhida pelo usuário
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
          } catch (error) {
            console.warn(`Erro ao buscar último registro do veículo ${veiculo.id}:`, error)
            return {
              ...veiculo,
              ultimaAtualizacaoKm: null,
              diasSemAtualizar: null,
              tipoUltimaAtualizacao: null,
              userId: null
            }
          }
        })
      
      const veiculosComInfoKm = await Promise.all(veiculosKmPromises)
      
      // Separar veículos que não atualizaram KM em 3 dias
      // Considera que não atualizou se: nunca atualizou OU última atualização foi há mais de 3 dias
      const semAtualizacao = veiculosComInfoKm.filter(v => {
        if (!v.ultimaAtualizacaoKm) return true // Nunca atualizou
        const dataAtualizacao = new Date(v.ultimaAtualizacaoKm)
        dataAtualizacao.setHours(0, 0, 0, 0)
        return dataAtualizacao < dataLimite
      })
      
      // Veículos que atualizaram KM nos últimos 3 dias
      const comAtualizacao = veiculosComInfoKm.filter(v => {
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

  // Função para calcular trocas por mês com offset
  const calcularTrocasPorMes = (trocas: Historico[], offset: number): TrocaPorMes[] => {
    // Obter os 6 meses baseado no offset (offset de 0 = últimos 6 meses, offset de 6 = 7-12 meses atrás)
    const meses: string[] = []
    const dataAtual = new Date()
    
    // Começar a partir do offset
    const mesInicial = 5 + offset
    const mesFinal = offset
    
    for (let i = mesInicial; i >= mesFinal; i--) {
      const data = new Date(dataAtual)
      data.setMonth(dataAtual.getMonth() - i)
      meses.push(getMonthYear(data.toISOString()))
    }
    
    // Contar trocas por mês
    const counts: Record<string, number> = {}
    trocas.forEach(t => {
      try {
        const mes = getMonthYear(t.data)
        counts[mes] = (counts[mes] || 0) + 1
      } catch (err) {
        console.error(`Erro ao processar troca:`, err, "Data:", t.data)
      }
    })
    
    // Criar array com os meses, preenchendo zeros quando não houver trocas
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

  // Efeito para recalcular trocasPorMes quando o offset mudar
  useEffect(() => {
    if (todasTrocas.length > 0) {
      const novasTrocasPorMes = calcularTrocasPorMes(todasTrocas, mesOffset)
      setTrocasPorMes(novasTrocasPorMes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesOffset])

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

  if (isMobile) {
    return <DashboardMobileView />
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-950 p-8 md:p-10 rounded-2xl shadow-2xl-custom">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl shadow-lg">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Dashboard</h1>
            </div>
            <p className="text-blue-100 text-base md:text-lg ml-16">Sistema Integrado de Gestão de Frotas</p>
          </div>
        </div>
      </div>

      <div className="w-full">
          {/* Cards de resumo para visão geral rápida */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
                    {trocasPorMes.length > 0 
                      ? trocasPorMes[trocasPorMes.length - 1].quantidade 
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium capitalize">
                    {new Date().toLocaleDateString('pt-BR', {month: 'long'})}
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
          </div>
      
          {/* Seção de indicadores-chave */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Trocas Realizadas</CardTitle>
                      <CardDescription className="text-sm">Histórico mensal de trocas de óleo</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMesOffset(mesOffset + 6)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[80px] text-center">
                      {mesOffset === 0 ? 'Últimos 6 meses' : `${mesOffset}-${mesOffset + 5} meses atrás`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMesOffset(Math.max(0, mesOffset - 6))}
                      disabled={mesOffset === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-32 flex items-center justify-center">Carregando...</div>
                ) : trocasPorMes.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                ) : (
                  <div className="h-64 w-full relative p-4">
                    {/* Grade de fundo */}
                    <div className="absolute inset-0 grid grid-cols-1 grid-rows-4 w-full h-full pointer-events-none">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="w-full border-t border-gray-200 dark:border-gray-800" />
                      ))}
                    </div>
                    {/* Escala Y no lado esquerdo */}
                    <div className="absolute left-2 inset-y-0 flex flex-col justify-between text-xs text-muted-foreground pointer-events-none">
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
                    <div className="absolute inset-0 pl-8 pr-4 pt-4 pb-8 flex items-end">
                      {(() => {
                        const maxQtd = Math.max(...trocasPorMes.map(item => item.quantidade), 1)
                        const max = maxQtd <= 2 ? 4 : maxQtd
                        const barWidth = `calc(100% / ${trocasPorMes.length} - 12px)`
                        const barColors = [
                          'bg-blue-500 dark:bg-blue-400',
                          'bg-green-500 dark:bg-green-400',
                          'bg-yellow-400 dark:bg-yellow-300',
                          'bg-red-500 dark:bg-red-400',
                          'bg-purple-500 dark:bg-purple-400',
                          'bg-gray-400 dark:bg-gray-500',
                        ];
                        const maxBarHeight = 180; // px
                        return trocasPorMes.map((item, index) => {
                          const alturaPx = item.quantidade > 0 ? (item.quantidade / max) * maxBarHeight : 8;
                          const color = barColors[index % barColors.length];
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center justify-end" style={{ minWidth: 0 }}>
                              <div className="mb-2 text-sm font-bold text-blue-600 dark:text-blue-400" style={{ minHeight: 24 }}>
                                {item.quantidade > 0 ? item.quantidade : ''}
                              </div>
                              <div
                                className={`rounded-t transition-all ${color}`}
                                style={{ height: `${alturaPx}px`, width: barWidth, minWidth: 24, maxWidth: 60 }}
                              />
                            </div>
                          )
                        })
                      })()}
                    </div>
                    {/* Rótulos do eixo X (meses) */}
                    <div className="absolute inset-x-8 bottom-0 flex justify-between text-xs font-medium pointer-events-none">
                      {trocasPorMes.map((item, index) => (
                        <div key={index} className="flex-1 text-center">
                          {item.nomeMes}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Alertas e próximas trocas */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                      <Droplets className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Troca de Óleo</CardTitle>
                      <CardDescription className="text-sm">Status das trocas de óleo da frota</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="em-dia" value={abaTrocaOleo} onValueChange={setAbaTrocaOleo} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="em-dia" className="text-green-600 data-[state=active]:font-bold">Em Dia</TabsTrigger>
                    <TabsTrigger value="proximo" className="text-yellow-600 data-[state=active]:font-bold">Próximo do Prazo</TabsTrigger>
                    <TabsTrigger value="vencido" className="text-red-600 data-[state=active]:font-bold">Vencido</TabsTrigger>
                    <TabsTrigger value="nunca" className="text-gray-500 data-[state=active]:font-bold">Nunca Registrado</TabsTrigger>
                  </TabsList>

                  <TabsContent value="em-dia" className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">Placa</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Km Atual</th>
                            <th className="px-4 py-2 text-left">Km Próx. Troca</th>
                            <th className="px-4 py-2 text-left">Faltam (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca)
                            .slice(0, verMais['em-dia'] ? undefined : 10)
                            .map(v => (
                              <tr key={v.id} className="border-b">
                                <td className="px-4 py-2">{v.placa}</td>
                                <td className="px-4 py-2">{v.modelo}</td>
                                <td className="px-4 py-2">{v.marca}</td>
                                <td className="px-4 py-2">{v.kmAtual.toLocaleString()}</td>
                                <td className="px-4 py-2">{v.kmProxTroca.toLocaleString()}</td>
                                <td className="px-4 py-2">{(v.kmProxTroca - v.kmAtual).toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            onClick={() => setVerMais(prev => ({ ...prev, 'em-dia': !prev['em-dia'] }))}
                          >
                            {verMais['em-dia'] ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length === 0 && (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          Nenhum veículo em dia
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="proximo" className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">Placa</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Km Atual</th>
                            <th className="px-4 py-2 text-left">Km Próx. Troca</th>
                            <th className="px-4 py-2 text-left">Faltam (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca)
                            .slice(0, verMais['proximo'] ? undefined : 10)
                            .map(v => (
                              <tr key={v.id} className="border-b">
                                <td className="px-4 py-2">{v.placa}</td>
                                <td className="px-4 py-2">{v.modelo}</td>
                                <td className="px-4 py-2">{v.marca}</td>
                                <td className="px-4 py-2">{v.kmAtual.toLocaleString()}</td>
                                <td className="px-4 py-2">{v.kmProxTroca.toLocaleString()}</td>
                                <td className="px-4 py-2">{(v.kmProxTroca - v.kmAtual).toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            onClick={() => setVerMais(prev => ({ ...prev, 'proximo': !prev['proximo'] }))}
                          >
                            {verMais['proximo'] ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length === 0 && (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          Nenhum veículo próximo do prazo
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="vencido" className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">Placa</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Km Atual</th>
                            <th className="px-4 py-2 text-left">Km Próx. Troca</th>
                            <th className="px-4 py-2 text-left">Faltam (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca)
                            .slice(0, verMais['vencido'] ? undefined : 10)
                            .map(v => (
                              <tr key={v.id} className="border-b">
                                <td className="px-4 py-2">{v.placa}</td>
                                <td className="px-4 py-2">{v.modelo}</td>
                                <td className="px-4 py-2">{v.marca}</td>
                                <td className="px-4 py-2">{v.kmAtual.toLocaleString()}</td>
                                <td className="px-4 py-2">{v.kmProxTroca.toLocaleString()}</td>
                                <td className="px-4 py-2">{(v.kmProxTroca - v.kmAtual).toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            onClick={() => setVerMais(prev => ({ ...prev, 'vencido': !prev['vencido'] }))}
                          >
                            {verMais['vencido'] ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length === 0 && (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          Nenhum veículo vencido
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="nunca" className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">Placa</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Km Atual</th>
                            <th className="px-4 py-2 text-left">Km Próx. Troca</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculosComDados.filter(v => !v.ultimaTroca)
                            .slice(0, verMais['nunca'] ? undefined : 10)
                            .map(v => (
                              <tr key={v.id} className="border-b">
                                <td className="px-4 py-2">{v.placa}</td>
                                <td className="px-4 py-2">{v.modelo}</td>
                                <td className="px-4 py-2">{v.marca}</td>
                                <td className="px-4 py-2">{v.kmAtual.toLocaleString()}</td>
                                <td className="px-4 py-2">{v.kmProxTroca.toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {veiculosComDados.filter(v => !v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            onClick={() => setVerMais(prev => ({ ...prev, 'nunca': !prev['nunca'] }))}
                          >
                            {verMais['nunca'] ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => !v.ultimaTroca).length === 0 && (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          Nenhum veículo sem registro
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Gráfico de status da troca de óleo */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Distribuição dos Status da Troca de Óleo</CardTitle>
                    <CardDescription className="text-sm">Quantidade de veículos em cada status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const emDia = veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length
                  const proximo = veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length
                  const vencido = veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length
                  const nunca = veiculosComDados.filter(v => !v.ultimaTroca).length
                  const total = emDia + proximo + vencido + nunca || 1
                  const data = [
                    { label: 'Em Dia', value: emDia, color: 'bg-green-500' },
                    { label: 'Próximo', value: proximo, color: 'bg-yellow-400' },
                    { label: 'Vencido', value: vencido, color: 'bg-red-500' },
                    { label: 'Nunca', value: nunca, color: 'bg-gray-400' },
                  ]
                  return (
                    <div className="w-full flex flex-col items-center">
                      <div className="flex w-full max-w-xl h-40 items-end gap-4">
                        {data.map((d, i) => (
                          <div key={d.label} className="flex-1 flex flex-col items-center">
                            <div className={`w-10 ${d.color} rounded-t transition-all`} style={{ height: `${Math.round((d.value / total) * 120)}px` }} />
                            <span className={
                              d.label === 'Em Dia' ? 'mt-2 font-medium text-sm text-green-600 text-center' :
                              d.label === 'Próximo' ? 'mt-2 font-medium text-sm text-yellow-500 text-center' :
                              d.label === 'Vencido' ? 'mt-2 font-medium text-sm text-red-600 text-center' :
                              d.label === 'Nunca' ? 'mt-2 font-medium text-sm text-gray-500 text-center' :
                              'mt-2 font-medium text-sm text-center'
                            }>{d.value}</span>
                            <span className="text-xs text-muted-foreground text-center">{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
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
    </div>
  )
}
