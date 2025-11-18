"use client"

import React from "react"

import { useEffect, useState, Fragment } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { getOrdensServico, getOrdensServicoSupabase, type OrdemServico } from "@/services/ordem-servico-service"
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Truck,
  Wrench,
  ShoppingBag,
  ChevronsUpDown,
  Trophy,
  ClipboardList,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"

// Componente para o card de status
interface StatusCardProps {
  title: string
  count: number
  icon: React.ReactNode
  color: string
  bgColor: string
  hoverColor: string
}

const StatusCard = ({ title, count, icon, color, bgColor, hoverColor }: StatusCardProps) => (
  <Card className={cn("transition-all duration-200 hover:shadow-md", hoverColor)}>
    <CardHeader className={cn("pb-2 min-h-[56px]", bgColor, "text-white rounded-t-lg")}>
      <CardTitle className="text-lg font-medium flex items-center justify-between">
        {title}
        {icon}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-4">
      <div className="text-3xl font-bold">{count}</div>
      <p className="text-xs text-muted-foreground mt-1">{count === 1 ? "ordem de serviço" : "ordens de serviço"}</p>
    </CardContent>
  </Card>
)

// Componente para o card de mecânico
interface MecanicoCardProps {
  nome: string
  ordens: OrdemServico[]
}

const MecanicoCard = ({ nome, ordens }: MecanicoCardProps) => {
  // Função para mapear status do banco para o status exibido (versão simplificada)
  const mapStatusLocal = (status: string) => {
    if (status === "Aguardando Fornecedor") return "Ag. Fornecedor"
    if (status === "Rascunho") return "Aguardando Mecânico"
    return status
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {nome}
        </CardTitle>
        <CardDescription>
          {ordens.length} {ordens.length === 1 ? "ordem pendente" : "ordens pendentes"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {ordens.map((ordem) => (
            <div key={ordem.id} className="flex justify-between items-center text-sm border-b pb-2">
              <div className="flex-1">
                <div className="normal-case">
                  {ordem.numero.startsWith('OS-') ? ordem.numero : `OS ${ordem.numero}`}
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={ordem.veiculoInfo}>
                  {ordem.veiculoInfo?.split(' - ')[0] || "Veículo não especificado"}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {ordem.prioridade && 
                  <span 
                    className="w-2 h-2 rounded-full inline-block mr-1" 
                    style={{ backgroundColor: getPrioridadeColor(ordem.prioridade) }}
                    title={`Prioridade: ${ordem.prioridade}`}
                  />
                }
                <StatusBadge status={mapStatusLocal(ordem.status)} />
              </div>
            </div>
          ))}
          {ordens.length === 0 && <div className="text-sm text-muted-foreground italic">Nenhuma ordem pendente</div>}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para o badge de status
const StatusBadge = ({ status }: { status: string }) => {
  const mappedStatus = status?.toLowerCase() || "";
  let iconClasses = "h-4 w-4 mr-2";
  let statusClasses = "";
  let Icon = ClipboardList;

  // Definir classes para cada status
  switch (mappedStatus) {
    case "em aberto":
    case "aguardando mecânico":
      iconClasses += " text-[#6B7280]";
      statusClasses = "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/30";
      Icon = FileText;
      break;
    case "em análise":
      iconClasses += " text-[#D97706]";
      statusClasses = "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30";
      Icon = AlertCircle;
      break;
    case "em aprovação":
      iconClasses += " text-[#F97316]";
      statusClasses = "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30";
      Icon = Clock;
      break;
    case "aguardando os":
      iconClasses += " text-[#3B82F6]";
      statusClasses = "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30";
      Icon = Calendar;
      break;
    case "ag. fornecedor":
    case "aguardando fornecedor":
      iconClasses += " text-[#8B5CF6]";
      statusClasses = "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30";
      Icon = Truck;
      break;
    case "serviço externo":
      iconClasses += " text-[#047857]";
      statusClasses = "bg-[#047857]/10 text-[#047857] border-[#047857]/30";
      Icon = Wrench;
      break;
    case "comprar na rua":
      iconClasses += " text-[#EF4444]";
      statusClasses = "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30";
      Icon = ShoppingBag;
      break;
    case "fila de serviço":
      iconClasses += " text-[#06B6D4]";
      statusClasses = "bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30";
      Icon = Clock;
      break;
    case "em serviço":
      iconClasses += " text-[#10B981]";
      statusClasses = "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30";
      Icon = Activity;
      break;
    case "finalizado":
      iconClasses += " text-[#1D4ED8]";
      statusClasses = "bg-[#1D4ED8]/10 text-[#1D4ED8] border-[#1D4ED8]/30";
      Icon = CheckCircle2;
      break;
    default:
      iconClasses += " text-gray-400";
      statusClasses = "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
      break;
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center whitespace-nowrap", statusClasses)}
    >
      <Icon className={iconClasses} />
      <span>{status}</span>
    </Badge>
  );
}

// Função utilitária para cor de prioridade
const getPrioridadeColor = (prioridade: string) => {
  switch (prioridade) {
    case "Baixa":
      return "#3B82F6" // Azul
    case "Média":
      return "#FACC15" // Amarelo
    case "Alta":
      return "#F97316" // Laranja
    case "Urgente":
      return "#EF4444" // Vermelho
    default:
      return "#6B7280" // Cinza
  }
}

// Badge de prioridade colorido
const PrioridadeBadge = ({ prioridade }: { prioridade: string }) => (
  <span
    className="ml-2 px-2 py-0.5 rounded text-xs font-medium border"
    style={{
      background: getPrioridadeColor(prioridade),
      color: prioridade === "Média" ? "#000" : "#fff",
      borderColor: prioridade === "Média" ? "#EAB308" : "transparent"
    }}
  >
    {prioridade}
  </span>
)

// Função utilitária para cor de status (para o gráfico)
const getStatusBarColor = (status: string) => {
  switch (status) {
    case "Aguardando Mecânico":
      return "#6B7280"
    case "Em Análise":
      return "#D97706"
    case "Em Aprovação":
      return "#F97316"
    case "Aguardando OS":
      return "#3B82F6"
    case "Ag. Fornecedor":
      return "#8B5CF6"
    case "Serviço Externo":
      return "#047857"
    case "Comprar na Rua":
      return "#EF4444"
    case "Fila de Serviço":
      return "#06B6D4"
    case "Em Serviço":
      return "#10B981"
    case "Finalizado":
      return "#1D4ED8"
    default:
      return "#888888"
  }
}

// Função utilitária para ordenar prioridades
const prioridadeOrder = ["Urgente", "Alta", "Média", "Baixa"]

interface OrdemComPrioridade {
  prioridade: string
}

const sortByPrioridade = (
  a: OrdemComPrioridade,
  b: OrdemComPrioridade,
  asc = false
): number => {
  const idxA = prioridadeOrder.indexOf(a.prioridade)
  const idxB = prioridadeOrder.indexOf(b.prioridade)
  if (idxA === -1 && idxB === -1) return 0
  if (idxA === -1) return 1
  if (idxB === -1) return -1
  return asc ? idxA - idxB : idxB - idxA
}

// Página principal do painel
export default function PainelManutencaoPage() {
  const isMobile = useIsMobile()
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [mecanicosComOrdens, setMecanicosComOrdens] = useState<{ [key: string]: OrdemServico[] }>({})
  const [loading, setLoading] = useState(true)
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    emAndamento: 0,
    finalizadas: 0,
    atrasadas: 0,
    tempoMedio: 0,
  })
  const [modalStatus, setModalStatus] = useState<string | null>(null)
  const [searchFinalizados, setSearchFinalizados] = useState("")
  const [mecanicoSelecionado, setMecanicoSelecionado] = useState<{ id: string, nome: string, ordens: OrdemServico[] } | null>(null)
  const [filtroStatusMecanico, setFiltroStatusMecanico] = useState<string>("")
  const [ordemPrioridadeStatusAsc, setOrdemPrioridadeStatusAsc] = useState(false)
  const [ordemPrioridadeMecanicoAsc, setOrdemPrioridadeMecanicoAsc] = useState(false)
  const [searchStatusModal, setSearchStatusModal] = useState("")
  const [searchMecanicoModal, setSearchMecanicoModal] = useState("")
  const [cardExplicacao, setCardExplicacao] = useState<null | keyof typeof explicacoesCards>(null)
  const [modalRankingVeiculos, setModalRankingVeiculos] = useState(false)
  const [modalRankingMotoristas, setModalRankingMotoristas] = useState(false)
  const [modalPrioridade, setModalPrioridade] = useState(false)
  const [modalRankingMecanicos, setModalRankingMecanicos] = useState(false)
  const [modalTempoMedio, setModalTempoMedio] = useState(false)
  const [modalTotalOrdens, setModalTotalOrdens] = useState(false)
  const [modalEmAndamento, setModalEmAndamento] = useState(false)
  const [modalEficiencia, setModalEficiencia] = useState(false)
  const [detalhesTempoMedio, setDetalhesTempoMedio] = useState<{
    ordensFinalizadas: number,
    ordensValidas: number,
    detalhes: Array<{
      numero: string,
      veiculoInfo: string,
      inicio: string,
      fim: string,
      dias: number
    }>
  }>({
    ordensFinalizadas: 0,
    ordensValidas: 0,
    detalhes: []
  })
  // Estado para datas individuais (usados apenas no modal)
  const [draftDataInicio, setDraftDataInicio] = useState("")
  const [draftDataFim, setDraftDataFim] = useState("")
  // Estado do período realmente aplicado
  const [periodo, setPeriodo] = useState<{from: string, to: string}>(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    return { from, to }
  })
  const [modalPeriodo, setModalPeriodo] = useState(false)

  // Função para filtrar ordens pelo período selecionado
  const ordensFiltradas = React.useMemo(() => {
    if (!periodo.from || !periodo.to) return ordens
    const fromTime = new Date(periodo.from + 'T00:00:00')
    const toTime = new Date(periodo.to + 'T23:59:59')
    return ordens.filter(o => {
      const created = new Date(o.createdAt).getTime()
      return created >= fromTime.getTime() && created <= toTime.getTime()
    })
  }, [ordens, periodo])

  // Estatísticas filtradas
  const estatisticasFiltradas = React.useMemo(() => {
    const total = ordensFiltradas.length
    const finalizadas = ordensFiltradas.filter((o) => o.status.toLowerCase() === "finalizado").length
    return { total, finalizadas }
  }, [ordensFiltradas])

  // Cores para os status
  const statusColors = {
    "Aguardando Mecânico": {
      bg: "bg-[#6B7280]/10",
      text: "text-[#6B7280]",
      hover: "hover:border-[#6B7280]",
      icon: <FileText className="h-5 w-5" />,
    },
    "Em Análise": {
      bg: "bg-[#D97706]/10",
      text: "text-[#D97706]",
      hover: "hover:border-[#D97706]",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    "Em Aprovação": {
      bg: "bg-[#F97316]/10",
      text: "text-[#F97316]",
      hover: "hover:border-[#F97316]",
      icon: <Clock className="h-5 w-5" />,
    },
    "Aguardando OS": {
      bg: "bg-[#3B82F6]/10",
      text: "text-[#3B82F6]",
      hover: "hover:border-[#3B82F6]",
      icon: <Calendar className="h-5 w-5" />,
    },
    "Ag. Fornecedor": {
      bg: "bg-[#8B5CF6]/10",
      text: "text-[#8B5CF6]",
      hover: "hover:border-[#8B5CF6]",
      icon: <Truck className="h-5 w-5" />,
    },
    "Serviço Externo": {
      bg: "bg-[#047857]/10",
      text: "text-[#047857]",
      hover: "hover:border-[#047857]",
      icon: <Wrench className="h-5 w-5" />,
    },
    "Comprar na Rua": {
      bg: "bg-[#EF4444]/10",
      text: "text-[#EF4444]",
      hover: "hover:border-[#EF4444]",
      icon: <Truck className="h-5 w-5" />,
    },
    "Fila de Serviço": {
      bg: "bg-[#06B6D4]/10",
      text: "text-[#06B6D4]",
      hover: "hover:border-[#06B6D4]",
      icon: <Clock className="h-5 w-5" />,
    },
    "Em Serviço": {
      bg: "bg-[#10B981]/10",
      text: "text-[#10B981]",
      hover: "hover:border-[#10B981]",
      icon: <Activity className="h-5 w-5" />,
    },
    Finalizado: {
      bg: "bg-[#1D4ED8]/10",
      text: "text-[#1D4ED8]",
      hover: "hover:border-[#1D4ED8]",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
  }

  // Status para exibir nos cards
  const statusList = [
    "Aguardando Mecânico",
    "Em Análise",
    "Em Aprovação",
    "Aguardando OS",
    "Ag. Fornecedor",
    "Serviço Externo",
    "Comprar na Rua",
    "Fila de Serviço",
    "Em Serviço",
    "Finalizado"
  ]

  // Função para mapear status do banco para o status exibido
  const mapStatus = (status: string) => {
    if (status === "Aguardando Fornecedor") return "Ag. Fornecedor"
    if (status === "Rascunho") return "Aguardando Mecânico"
    return status
  }

  // Função para determinar setor atual da ordem e ícone
  function getSetorAtual(ordem: OrdemServico): { nome: string; icon: React.ReactNode } {
    if (!ordem.historico || ordem.historico.length === 0) return { nome: "Oficina", icon: <Wrench className="inline h-4 w-4 mr-1 text-[#6366f1]" /> }
    const ultimo = ordem.historico[ordem.historico.length - 1]
    if (ultimo.para) {
      if (ultimo.para.toLowerCase().includes("almoxarifado")) return { nome: "Almoxarifado", icon: <Truck className="inline h-4 w-4 mr-1 text-[#8B5CF6]" /> }
      if (ultimo.para.toLowerCase().includes("compras")) return { nome: "Compras", icon: <ShoppingBag className="inline h-4 w-4 mr-1 text-[#F97316]" /> }
      if (ultimo.para.toLowerCase().includes("oficina")) return { nome: "Oficina", icon: <Wrench className="inline h-4 w-4 mr-1 text-[#6366f1]" /> }
    }
    return { nome: "Oficina", icon: <Wrench className="inline h-4 w-4 mr-1 text-[#6366f1]" /> }
  }

  // Função para calcular o tempo médio em dias que uma ordem ficou em um status
  function calcularTempoMedioStatus(status: string): number {
    // Implementação aprimorada para calcular o tempo médio por status
    const temposPorStatus = []
    
    // Para cada ordem, calcular quanto tempo ela ficou em cada status
    for (const ordem of ordens) {
      if (!ordem.historico || ordem.historico.length < 2) continue
      
      // Ordenar histórico por data
      const historicoOrdenado = [...ordem.historico]
        .filter(h => h.data && h.status) // Filtrar apenas registros válidos
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      
      // Para cada entrada no histórico que corresponde ao status procurado
      for (let i = 0; i < historicoOrdenado.length; i++) {
        const evento = historicoOrdenado[i]
        if (mapStatus(evento.status) !== status) continue
        
        // Encontramos um evento com o status que estamos procurando
        const dataInicio = new Date(evento.data)
        
        // Procurar o próximo evento com status diferente
        let dataFim = null
        for (let j = i + 1; j < historicoOrdenado.length; j++) {
          if (mapStatus(historicoOrdenado[j].status) !== status) {
            dataFim = new Date(historicoOrdenado[j].data)
            break
          }
        }
        
        // Se não encontrou data fim e a ordem ainda está neste status, usar data atual
        if (!dataFim && mapStatus(ordem.status) === status) {
          dataFim = new Date()
        }
        
        // Se encontrou uma data de fim, calcular a duração
        if (dataFim) {
          const duracao = (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24) // em dias
          if (duracao > 0) {
            temposPorStatus.push(duracao)
          }
        }
      }
    }
    
    // Calcular a média dos tempos
    if (temposPorStatus.length === 0) return 0
    
    const media = temposPorStatus.reduce((soma, tempo) => soma + tempo, 0) / temposPorStatus.length
    return Number(media.toFixed(1))
  }

  // Função para buscar dados
  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("Atualizando dados...") // Ajuda a depurar a atualização

      // Buscar todas as ordens do Supabase
      const allOrdens = await getOrdensServicoSupabase()
      setOrdens(allOrdens)

      // Agrupar ordens por mecânico
      const mecanicosMap: { [key: string]: OrdemServico[] } = {}

      for (const ordem of allOrdens) {
        // Filtrar apenas ordens não finalizadas
        if (ordem.status.toLowerCase() !== "finalizado") {
          const mecanicoId = ordem.mecanicoId || "sem-mecanico"

          if (!mecanicosMap[mecanicoId]) {
            mecanicosMap[mecanicoId] = []
          }

          mecanicosMap[mecanicoId].push(ordem)
        }
      }

      // Ordenar as ordens de cada mecânico pelo campo ordem_execucao
      // de forma similar à página de planejamento
      Object.keys(mecanicosMap).forEach(mecanicoId => {
        // Aplicar a mesma lógica de ordenação da página de planejamento
        mecanicosMap[mecanicoId] = mecanicosMap[mecanicoId].sort((a, b) => {
          // Ordenação por ordem_execucao e depois por número da OS
          try {
            // Verificar se as ordens têm a propriedade ordem_execucao e se têm valores
            const ordemExecucaoA = a.ordem_execucao !== undefined ? a.ordem_execucao : null;
            const ordemExecucaoB = b.ordem_execucao !== undefined ? b.ordem_execucao : null;
            
            // Se ambas as ordens têm ordem_execucao, comparar diretamente
            if (ordemExecucaoA !== null && ordemExecucaoB !== null) {
              return ordemExecucaoA - ordemExecucaoB;
            }
            
            // Se apenas uma tem ordem_execucao, colocar ela primeiro
            if (ordemExecucaoA !== null) return -1;
            if (ordemExecucaoB !== null) return 1;
            
            // Se nenhuma tem ordem_execucao, ordenar por número
            const numA = parseInt(a.numero.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.numero.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
          } catch (error) {
            // Em caso de erro, manter a ordem atual
            return 0;
          }
        });
      });

      setMecanicosComOrdens(mecanicosMap)

      // Calcular estatísticas
      const emAndamento = allOrdens.filter((o) => o.status.toLowerCase() !== "finalizado").length
      const finalizadas = allOrdens.filter((o) => o.status.toLowerCase() === "finalizado").length

      // Calcular ordens atrasadas (baseado em alguma lógica de negócio real)
      const atrasadas = Math.floor(emAndamento * 0.2)

      // Calcular tempo médio real de finalização
      const ordensFinalizadas = allOrdens.filter((o) => 
        o.status.toLowerCase() === "finalizado" && 
        o.historico && 
        Array.isArray(o.historico) && 
        o.historico.length > 0 && 
        o.createdAt
      )
      
      console.log(`Total de ordens finalizadas para cálculo: ${ordensFinalizadas.length}`)
      
      let tempoMedio = 0
      let ordensComCalculoValido = 0
      const detalhesCalculo: Array<{
        numero: string,
        veiculoInfo: string,
        inicio: string,
        fim: string,
        dias: number
      }> = []
      
      if (ordensFinalizadas.length > 0) {
        let tempoTotal = 0
        
        for (const ordem of ordensFinalizadas) {
          try {
            const inicio = new Date(ordem.createdAt)
            if (isNaN(inicio.getTime())) {
              console.log(`Data de criação inválida para ordem ${ordem.numero}: ${ordem.createdAt}`)
              continue
            }
            
            // Buscar evento de finalização no historico
            const eventoFinalizado = ordem.historico.find(
              (h) => h.status && h.status.toLowerCase() === "finalizado" && h.data
            )
            
            if (!eventoFinalizado) {
              console.log(`Ordem ${ordem.numero} não tem evento de finalização no histórico`)
              continue
            }
            
            const fim = new Date(eventoFinalizado.data)
            if (isNaN(fim.getTime())) {
              console.log(`Data de finalização inválida para ordem ${ordem.numero}: ${eventoFinalizado.data}`)
              continue
            }
            
            const diff = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24) // diferença em dias
            
            if (diff <= 0) {
              console.log(`Diferença de tempo inválida para ordem ${ordem.numero}: ${diff} dias`)
              continue
            }
            
            tempoTotal += diff
            ordensComCalculoValido++
            
            // Adicionar aos detalhes para mostrar no modal
            detalhesCalculo.push({
              numero: ordem.numero,
              veiculoInfo: ordem.veiculoInfo,
              inicio: inicio.toLocaleDateString(),
              fim: fim.toLocaleDateString(),
              dias: Number(diff.toFixed(1))
            })
            
            console.log(`Ordem ${ordem.numero}: ${diff.toFixed(1)} dias (de ${inicio.toLocaleDateString()} até ${fim.toLocaleDateString()})`)
          } catch (err) {
            console.error(`Erro ao calcular tempo para ordem ${ordem.numero || 'desconhecida'}:`, err)
          }
        }
        
        if (ordensComCalculoValido > 0) {
          tempoMedio = Math.round(tempoTotal / ordensComCalculoValido)
          console.log(`Tempo médio calculado: ${tempoMedio} dias (baseado em ${ordensComCalculoValido} ordens válidas)`)
        } else {
          console.log('Nenhuma ordem com cálculo válido de tempo')
        }
      } else {
        console.log('Não há ordens finalizadas para calcular o tempo médio')
      }

      // Atualizar o estado com os detalhes do cálculo
      setDetalhesTempoMedio({
        ordensFinalizadas: ordensFinalizadas.length,
        ordensValidas: ordensComCalculoValido,
        detalhes: detalhesCalculo
      })

      setEstatisticas({
        total: allOrdens.length,
        emAndamento,
        finalizadas,
        atrasadas,
        tempoMedio,
      })
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Executar a busca assim que o componente for montado
    fetchData()

    // Configurar a atualização automática a cada 60 segundos (1 minuto)
    const intervalId = setInterval(() => {
      fetchData()
    }, 60000)

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId)
  }, [])

  // Preparar dados para os gráficos
  const statusData = statusList
    .map((status) => ({
      name: status,
      quantidade: ordens.filter((o) => mapStatus(o.status) === status).length,
    }))
    .filter((item) => item.quantidade > 0)

  const prioridadeData = [
    { name: "Baixa", value: ordens.filter((o) => o.prioridade === "Baixa").length },
    { name: "Média", value: ordens.filter((o) => o.prioridade === "Média").length },
    { name: "Alta", value: ordens.filter((o) => o.prioridade === "Alta").length },
    { name: "Urgente", value: ordens.filter((o) => o.prioridade === "Urgente").length },
  ].filter((item) => item.value > 0)

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  // Calcular a porcentagem de conclusão
  const conclusionPercentage =
    estatisticas.total > 0 ? Math.round((estatisticas.finalizadas / estatisticas.total) * 100) : 0

  const explicacoesCards = {
    total: {
      titulo: "Total de Ordens",
      texto: "O total de ordens corresponde à soma de todas as ordens de serviço cadastradas no sistema, independentemente do status."
    },
    andamento: {
      titulo: "Em Andamento",
      texto: "Em Andamento representa todas as ordens que ainda não foram finalizadas. São consideradas em andamento aquelas cujo status não é 'Finalizado'."
    },
    tempo: {
      titulo: "Tempo Médio",
      texto: "O tempo médio é calculado considerando a diferença de dias entre a data de criação e a data de finalização de cada ordem finalizada. O valor exibido é a média desses tempos."
    },
    eficiencia: {
      titulo: "Eficiência",
      texto: "A eficiência é a porcentagem de ordens finalizadas em relação ao total de ordens cadastradas. É calculada como: (ordens finalizadas / total de ordens) x 100."
    }
  }

  // Ao abrir o modal, inicializar os drafts com o valor atual do período
  const openPeriodoModal = () => {
    setDraftDataInicio(periodo.from)
    setDraftDataFim(periodo.to)
    setModalPeriodo(true)
  }

  // Função para calcular o tempo médio de finalização das ordens filtradas
  const tempoMedioInfo = React.useMemo(() => {
    const ordensFinalizadas = ordensFiltradas.filter((o) =>
      o.status.toLowerCase() === "finalizado" &&
      o.historico &&
      Array.isArray(o.historico) &&
      o.historico.length > 0 &&
      o.createdAt
    )
    let tempoTotal = 0
    let ordensComCalculoValido = 0
    const detalhesCalculo: Array<{
      numero: string,
      veiculoInfo: string,
      inicio: string,
      fim: string,
      dias: number
    }> = []
    for (const ordem of ordensFinalizadas) {
      try {
        const inicio = new Date(ordem.createdAt)
        if (isNaN(inicio.getTime())) continue
        const eventoFinalizado = ordem.historico.find(
          (h) => h.status && h.status.toLowerCase() === "finalizado" && h.data
        )
        if (!eventoFinalizado) continue
        const fim = new Date(eventoFinalizado.data)
        if (isNaN(fim.getTime())) continue
        const diff = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
        if (diff <= 0) continue
        tempoTotal += diff
        ordensComCalculoValido++
        detalhesCalculo.push({
          numero: ordem.numero,
          veiculoInfo: ordem.veiculoInfo,
          inicio: inicio.toLocaleDateString(),
          fim: fim.toLocaleDateString(),
          dias: Number(diff.toFixed(1))
        })
      } catch {}
    }
    const tempoMedio = ordensComCalculoValido > 0 ? Math.round(tempoTotal / ordensComCalculoValido) : 0
    return {
      tempoMedio,
      ordensFinalizadas: ordensFinalizadas.length,
      ordensValidas: ordensComCalculoValido,
      detalhes: detalhesCalculo
    }
  }, [ordensFiltradas])

  return (
    <div className="space-y-6">
      {/* Botão de voltar no mobile */}
      {isMobile && (
        <div className="w-[96%] pl-3 pr-0">
          <MobileBackButton />
        </div>
      )}
      {/* Resumo de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer" onClick={openPeriodoModal}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticasFiltradas.total}</div>
            <p className="text-xs text-muted-foreground">{estatisticasFiltradas.finalizadas} finalizadas</p>
            <Progress value={estatisticasFiltradas.total > 0 ? Math.round((estatisticasFiltradas.finalizadas / estatisticasFiltradas.total) * 100) : 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{estatisticasFiltradas.total > 0 ? Math.round((estatisticasFiltradas.finalizadas / estatisticasFiltradas.total) * 100) : 0}% concluído</p>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">Período: {periodo.from && periodo.to ? `${periodo.from.split('-').reverse().join('/')} - ${periodo.to.split('-').reverse().join('/')}` : ""}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer" onClick={() => setCardExplicacao('andamento')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.emAndamento}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.atrasadas > 0 ? `${estatisticas.atrasadas} atrasadas` : "Nenhuma atrasada"}
            </p>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setModalEmAndamento(true); 
              }} 
              className="text-xs text-blue-500 hover:underline mt-1"
            >
              Ver detalhes
            </button>
          </CardContent>
        </Card>

        <Card className="transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer" onClick={() => setCardExplicacao('tempo')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tempoMedioInfo.tempoMedio} dias</div>
            <p className="text-xs text-muted-foreground">Para finalização de ordens</p>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setModalTempoMedio(true); 
              }} 
              className="text-xs text-blue-500 hover:underline mt-1"
            >
              Ver detalhes do cálculo
            </button>
          </CardContent>
        </Card>

        <Card className="transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer" onClick={() => setCardExplicacao('eficiencia')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estatisticas.total > 0 ? Math.round((estatisticas.finalizadas / estatisticas.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Taxa de conclusão</p>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setModalEficiencia(true); 
              }} 
              className="text-xs text-blue-500 hover:underline mt-1"
            >
              Ver detalhes
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de explicação dos cards de estatística */}
      <Dialog open={!!cardExplicacao} onOpenChange={open => { if (!open) setCardExplicacao(null) }}>
        <DialogContent className="max-w-md">
          <DialogTitle>{cardExplicacao ? explicacoesCards[cardExplicacao].titulo : ""}</DialogTitle>
          <p className="text-muted-foreground mt-2">{cardExplicacao ? explicacoesCards[cardExplicacao].texto : ""}</p>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="mecanicos">Mecânicos</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Aba de Status */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statusList.map((status) => {
              const count = ordens.filter((o) => mapStatus(o.status) === status).length
              const { bg, text, hover, icon } = statusColors[status as keyof typeof statusColors]

              return (
                <Dialog key={status} open={modalStatus === status} onOpenChange={(open) => setModalStatus(open ? status : null)}>
                  <DialogTrigger asChild>
                    <div>
                      <StatusCard
                        title={status}
                        count={count}
                        icon={icon}
                        color={text}
                        bgColor={bg.replace("/10", "")}
                        hoverColor={hover}
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
                    <DialogTitle className="sr-only">Ordens com status: {status}</DialogTitle>
                    {/* Cabeçalho colorido igual ao card */}
                    <div className={cn("flex items-center gap-3 px-6 py-4", bg.replace("/10", ""), "text-white flex-shrink-0")}> 
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <div className="text-lg font-bold leading-tight">{status}</div>
                        <div className="text-xs opacity-80">{count} {count === 1 ? "ordem" : "ordens"} neste status</div>
                      </div>
                    </div>
                    {/* Barra de pesquisa e botão de ordenação para todos os status */}
                    <div className="px-6 pb-2 bg-background flex-shrink-0 flex items-center gap-2">
                      <input
                        type="text"
                        value={status === "Finalizado" ? searchFinalizados : searchStatusModal}
                        onChange={e => status === "Finalizado" ? setSearchFinalizados(e.target.value) : setSearchStatusModal(e.target.value)}
                        placeholder="Pesquisar por número da OS ou veículo..."
                        className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:border-gray-200 border-gray-200"
                        autoFocus={false}
                      />
                      <button
                        className="ml-2 p-2 rounded border bg-white hover:bg-muted transition"
                        title="Ordenar por prioridade"
                        onClick={() => setOrdemPrioridadeStatusAsc((v) => !v)}
                        type="button"
                      >
                        <ChevronsUpDown className={ordemPrioridadeStatusAsc ? "rotate-180 transition" : "transition"} size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="px-6 pt-4 pb-2 flex-1 overflow-y-auto scrollbar-none">
                      <Accordion type="multiple" className="w-full">
                        {(() => {
                          let filteredOrdens = ordens.filter((o) => mapStatus(o.status) === status);
                          const search = (status === "Finalizado" ? searchFinalizados : searchStatusModal).trim().toLowerCase();
                          if (search !== "") {
                            filteredOrdens = filteredOrdens.filter(o =>
                              o.numero.toLowerCase().includes(search) ||
                              (o.veiculoInfo && o.veiculoInfo.toLowerCase().includes(search))
                            );
                          }
                          filteredOrdens = filteredOrdens.slice().sort((a, b) => sortByPrioridade(a, b, ordemPrioridadeStatusAsc))
                          if (filteredOrdens.length === 0) {
                            return <div className="text-center text-muted-foreground py-8">Nenhuma ordem neste status.</div>;
                          }
                          return filteredOrdens.map((ordem) => {
                            const setor = getSetorAtual(ordem);
                            return (
                              <AccordionItem key={ordem.id} value={ordem.id}>
                                <AccordionTrigger>
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">
                                        {ordem.numero.startsWith('OS-') ? ordem.numero : `OS ${ordem.numero}`} - {ordem.veiculoInfo.split(' - ')[0]}
                                      </span>
                                      <span className="ml-2"><StatusBadge status={ordem.status} /></span>
                                      <PrioridadeBadge prioridade={ordem.prioridade} />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      {setor.icon}
                                      <span className="font-medium">{setor.nome}</span>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <Tabs defaultValue="dados" className="w-full">
                                    <TabsList className="mb-2">
                                      <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
                                      <TabsTrigger value="detalhes">Defeitos e Peças</TabsTrigger>
                                      <TabsTrigger value="historico">Histórico</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="dados">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                          <div className="flex flex-col items-start">
                                            <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Truck className="h-4 w-4" />Veículo</span>
                                            <span className="text-base font-medium break-words">{ordem.veiculoInfo}</span>
                                          </div>
                                          <div className="flex flex-col items-start">
                                            <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><FileText className="h-4 w-4" />Solicitante</span>
                                            <span className="text-base font-medium break-words">{ordem.solicitanteInfo}</span>
                                          </div>
                                          <div className="flex flex-col items-start">
                                            <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Wrench className="h-4 w-4" />Mecânico</span>
                                            <span className="text-base font-medium break-words">{ordem.mecanicoInfo || "-"}</span>
                                          </div>
                                          <div className="flex flex-col items-start">
                                            <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                                              <AlertCircle className="h-4 w-4" style={{ color: getPrioridadeColor(ordem.prioridade) }} />Prioridade
                                            </span>
                                            <span className="text-base font-medium break-words">{ordem.prioridade}</span>
                                          </div>
                                          <div className="flex flex-col items-start">
                                            <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Clock className="h-4 w-4" />Data de criação</span>
                                            <span className="text-base font-medium break-words">{new Date(ordem.createdAt).toLocaleString()}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-4">
                                          <div className="flex flex-col items-start">
                                            <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><AlertCircle className="h-4 w-4" />Status</span>
                                            <span className="text-base font-medium break-words">{ordem.status}</span>
                                          </div>
                                          {ordem.observacoesAlmoxarifado && <div className="flex flex-col items-start"><span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Truck className="h-4 w-4" />Obs. Almoxarifado</span><span className="text-base font-medium break-words">{ordem.observacoesAlmoxarifado}</span></div>}
                                          {ordem.observacoesCompras && <div className="flex flex-col items-start"><span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><ShoppingBag className="h-4 w-4" />Obs. Compras</span><span className="text-base font-medium break-words">{ordem.observacoesCompras}</span></div>}
                                          {ordem.observacoesRetorno && <div className="flex flex-col items-start"><span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Wrench className="h-4 w-4" />Obs. Retorno</span><span className="text-base font-medium break-words">{ordem.observacoesRetorno}</span></div>}
                                        </div>
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="detalhes">
                                      <div className="space-y-4">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1"><FileText className="h-4 w-4 text-muted-foreground" /><b>Defeitos relatados:</b></div>
                                          <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{ordem.defeitosRelatados}</div>
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4" style={{ color: getPrioridadeColor(ordem.prioridade) }} /><b>Peças/Serviços:</b></div>
                                          <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{ordem.pecasServicos}</div>
                                        </div>
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="historico">
                                      <div>
                                        <b>Histórico:</b>
                                        <ul className="text-xs mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                                          {ordem.historico && ordem.historico.length > 0 ? ordem.historico.map((h) => (
                                            <li key={h.id} className="flex items-center gap-2">
                                              <Clock className="h-3 w-3 text-muted-foreground" />
                                              <span className="font-semibold">[{new Date(h.data).toLocaleString()}]</span>
                                              <span>{h.tipo}</span>
                                              <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">{h.status}</span>
                                              <span className="italic text-muted-foreground">{h.observacao}</span>
                                            </li>
                                          )) : <li>Nenhum evento registrado.</li>}
                                        </ul>
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </AccordionContent>
                              </AccordionItem>
                            )
                          })
                        })()}
                      </Accordion>
                    </div>
                  </DialogContent>
                </Dialog>
              )
            })}
          </div>

          {/* Gráfico de status */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Tempo médio (em dias) que as ordens permanecem em cada status</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusList
                      .filter(status => status !== "Finalizado") // Remover o status "Finalizado"
                      .map(status => ({
                        name: status,
                        tempo: calcularTempoMedioStatus(status)
                      }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Dias', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value} dias`, 'Tempo médio']} />
                    <Legend />
                    <Bar dataKey="tempo" name="Tempo Médio (dias)">
                      {statusList
                        .filter(status => status !== "Finalizado")
                        .map((status) => {
                          // Usar a função getStatusBarColor que já está definida para mapear status para cores
                          return (
                            <Cell key={status} fill={getStatusBarColor(status)} />
                          );
                        })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Mecânicos */}
        <TabsContent value="mecanicos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.keys(mecanicosComOrdens).length > 0 ? (
              Object.entries(mecanicosComOrdens).map(([mecanicoId, ordens]) => {
                const nomeMecanico =
                  ordens[0]?.mecanicoInfo ||
                  (mecanicoId === "sem-mecanico" ? "Sem mecânico atribuído" : `Mecânico ${mecanicoId}`)
                return (
                  <div key={mecanicoId} onClick={() => setMecanicoSelecionado({ id: mecanicoId, nome: nomeMecanico, ordens })} className="cursor-pointer">
                    <MecanicoCard nome={nomeMecanico} ordens={ordens} />
                  </div>
                )
              })
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">Nenhum mecânico com ordens pendentes</p>
                </CardContent>
              </Card>
            )}
          </div>
          {/* Modal de mecânico global */}
          <Dialog open={!!mecanicoSelecionado} onOpenChange={open => { if (!open) setMecanicoSelecionado(null) }}>
            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
              <DialogTitle className="sr-only">Ordens do mecânico: {mecanicoSelecionado?.nome}</DialogTitle>
              {mecanicoSelecionado && (
                <>
                  <div className="flex items-center gap-3 px-6 py-4 bg-[#10B981] text-white flex-shrink-0">
                    <Wrench className="text-white text-2xl" />
                    <div>
                      <div className="text-lg font-bold leading-tight">{mecanicoSelecionado.nome}</div>
                      <div className="text-xs opacity-80">{mecanicoSelecionado.ordens.length} {mecanicoSelecionado.ordens.length === 1 ? "ordem" : "ordens"} atribuídas</div>
                    </div>
                  </div>
                  <div className="px-6 pt-2 pb-2 bg-background flex-shrink-0 flex items-center gap-2">
                    <input
                      type="text"
                      value={searchMecanicoModal}
                      onChange={e => setSearchMecanicoModal(e.target.value)}
                      placeholder="Pesquisar por número da OS ou veículo..."
                      className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:border-gray-200 border-gray-200"
                      autoFocus={false}
                    />
                    <select
                      className="rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={filtroStatusMecanico}
                      onChange={e => setFiltroStatusMecanico(e.target.value)}
                    >
                      <option value="">Todos os status</option>
                      {statusList.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <button
                      className="ml-2 p-2 rounded border bg-white hover:bg-muted transition"
                      title="Ordenar por prioridade"
                      onClick={() => setOrdemPrioridadeMecanicoAsc((v) => !v)}
                      type="button"
                    >
                      <ChevronsUpDown className={ordemPrioridadeMecanicoAsc ? "rotate-180 transition" : "transition"} size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="px-6 pt-4 pb-2 flex-1 overflow-y-auto scrollbar-none">
                    <Accordion type="multiple" className="w-full">
                      {(() => {
                        let filteredOrdens = mecanicoSelecionado.ordens;
                        const search = searchMecanicoModal.trim().toLowerCase();
                        if (search !== "") {
                          filteredOrdens = filteredOrdens.filter(o =>
                            o.numero.toLowerCase().includes(search) ||
                            (o.veiculoInfo && o.veiculoInfo.toLowerCase().includes(search))
                          );
                        }
                        if (filtroStatusMecanico) {
                          filteredOrdens = filteredOrdens.filter(o => mapStatus(o.status) === filtroStatusMecanico)
                        }
                        filteredOrdens = filteredOrdens.slice().sort((a, b) => sortByPrioridade(a, b, ordemPrioridadeMecanicoAsc))
                        if (filteredOrdens.length === 0) {
                          return <div className="text-center text-muted-foreground py-8">Nenhuma ordem neste status.</div>;
                        }
                        return filteredOrdens.map((ordem) => {
                          const setor = getSetorAtual(ordem);
                          return (
                            <AccordionItem key={ordem.id} value={ordem.id}>
                              <AccordionTrigger>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">
                                      {ordem.numero.startsWith('OS-') ? ordem.numero : `OS ${ordem.numero}`} - {ordem.veiculoInfo.split(' - ')[0]}
                                    </span>
                                    <span className="ml-2"><StatusBadge status={ordem.status} /></span>
                                    <PrioridadeBadge prioridade={ordem.prioridade} />
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    {setor.icon}
                                    <span className="font-medium">{setor.nome}</span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <Tabs defaultValue="dados" className="w-full">
                                  <TabsList className="mb-2">
                                    <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
                                    <TabsTrigger value="detalhes">Defeitos e Peças</TabsTrigger>
                                    <TabsTrigger value="historico">Histórico</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="dados">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-4">
                                        <div className="flex flex-col items-start">
                                          <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Truck className="h-4 w-4" />Veículo</span>
                                          <span className="text-base font-medium break-words">{ordem.veiculoInfo}</span>
                                        </div>
                                        <div className="flex flex-col items-start">
                                          <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><FileText className="h-4 w-4" />Solicitante</span>
                                          <span className="text-base font-medium break-words">{ordem.solicitanteInfo}</span>
                                        </div>
                                        <div className="flex flex-col items-start">
                                          <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Wrench className="h-4 w-4" />Mecânico</span>
                                          <span className="text-base font-medium break-words">{ordem.mecanicoInfo || "-"}</span>
                                        </div>
                                        <div className="flex flex-col items-start">
                                          <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                                            <AlertCircle className="h-4 w-4" style={{ color: getPrioridadeColor(ordem.prioridade) }} />Prioridade
                                          </span>
                                          <span className="text-base font-medium break-words">{ordem.prioridade}</span>
                                        </div>
                                        <div className="flex flex-col items-start">
                                          <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Clock className="h-4 w-4" />Data de criação</span>
                                          <span className="text-base font-medium break-words">{new Date(ordem.createdAt).toLocaleString()}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <div className="flex flex-col items-start">
                                          <span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><AlertCircle className="h-4 w-4" />Status</span>
                                          <span className="text-base font-medium break-words">{ordem.status}</span>
                                        </div>
                                        {ordem.observacoesAlmoxarifado && <div className="flex flex-col items-start"><span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Truck className="h-4 w-4" />Obs. Almoxarifado</span><span className="text-base font-medium break-words">{ordem.observacoesAlmoxarifado}</span></div>}
                                        {ordem.observacoesCompras && <div className="flex flex-col items-start"><span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><ShoppingBag className="h-4 w-4" />Obs. Compras</span><span className="text-base font-medium break-words">{ordem.observacoesCompras}</span></div>}
                                        {ordem.observacoesRetorno && <div className="flex flex-col items-start"><span className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide"><Wrench className="h-4 w-4" />Obs. Retorno</span><span className="text-base font-medium break-words">{ordem.observacoesRetorno}</span></div>}
                                      </div>
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="detalhes">
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1"><FileText className="h-4 w-4 text-muted-foreground" /><b>Defeitos relatados:</b></div>
                                        <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{ordem.defeitosRelatados}</div>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 mb-1"><AlertCircle className="h-4 w-4" style={{ color: getPrioridadeColor(ordem.prioridade) }} /><b>Peças/Serviços:</b></div>
                                        <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{ordem.pecasServicos}</div>
                                      </div>
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="historico">
                                    <div>
                                      <b>Histórico:</b>
                                      <ul className="text-xs mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                                        {ordem.historico && ordem.historico.length > 0 ? ordem.historico.map((h) => (
                                          <li key={h.id} className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-semibold">[{new Date(h.data).toLocaleString()}]</span>
                                            <span>{h.tipo}</span>
                                            <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">{h.status}</span>
                                            <span className="italic text-muted-foreground">{h.observacao}</span>
                                          </li>
                                        )) : <li>Nenhum evento registrado.</li>}
                                      </ul>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </AccordionContent>
                            </AccordionItem>
                          )
                        })
                      })()}
                    </Accordion>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Aba de Relatórios */}
        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Gráfico de prioridades */}
            <Card onClick={() => setModalPrioridade(true)} className="cursor-pointer transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg">
              <CardHeader>
                <CardTitle>Distribuição por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {prioridadeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prioridadeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prioridadeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Sem dados disponíveis</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de veículos */}
            <Card onClick={() => setModalRankingVeiculos(true)} className="cursor-pointer transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg">
              <CardHeader>
                <CardTitle>Veículos com Mais Manutenções</CardTitle>
              </CardHeader>
              <CardContent>
                {ordens.length > 0 ? (
                  <div className="space-y-4">
                    {/* Agrupar ordens por veículo e contar */}
                    {Object.entries(
                      ordens.reduce((acc: { [key: string]: { info: string; count: number } }, ordem) => {
                        if (!acc[ordem.veiculoId]) {
                          acc[ordem.veiculoId] = { info: ordem.veiculoInfo, count: 0 }
                        }
                        acc[ordem.veiculoId].count++
                        return acc
                      }, {}),
                    )
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 5)
                      .map(([veiculoId, { info, count }]) => (
                        <div key={veiculoId} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{info}</p>
                            <p className="text-sm text-muted-foreground">
                              {count} {count === 1 ? "ordem" : "ordens"}
                            </p>
                          </div>
                          <div className="ml-auto font-medium">{count}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Sem dados disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas de motoristas/solicitantes */}
            <Card onClick={() => setModalRankingMotoristas(true)} className="cursor-pointer transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg">
              <CardHeader>
                <CardTitle>Motoristas que Mais Solicitam Manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                {ordens.length > 0 ? (
                  <div className="space-y-4">
                    {/* Agrupar ordens por solicitante e contar */}
                    {Object.entries(
                      ordens.reduce((acc: { [key: string]: { info: string; count: number } }, ordem) => {
                        if (!acc[ordem.solicitanteId]) {
                          acc[ordem.solicitanteId] = { info: ordem.solicitanteInfo, count: 0 }
                        }
                        acc[ordem.solicitanteId].count++
                        return acc
                      }, {}),
                    )
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 5)
                      .map(([solicitanteId, { info, count }]) => (
                        <div key={solicitanteId} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{info}</p>
                            <p className="text-sm text-muted-foreground">
                              {count} {count === 1 ? "ordem" : "ordens"}
                            </p>
                          </div>
                          <div className="ml-auto font-medium">{count}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Sem dados disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mecânicos que mais atenderam */}
            <Card onClick={() => setModalRankingMecanicos(true)} className="cursor-pointer transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg">
              <CardHeader>
                <CardTitle>Mecânicos que mais atenderam</CardTitle>
              </CardHeader>
              <CardContent>
                {ordens.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      ordens.filter(o => o.status.toLowerCase() === 'finalizado' && o.mecanicoId)
                        .reduce((acc: { [key: string]: { info: string; count: number } }, ordem) => {
                          if (!acc[ordem.mecanicoId]) {
                            acc[ordem.mecanicoId] = { info: ordem.mecanicoInfo || 'Desconhecido', count: 0 }
                          }
                          acc[ordem.mecanicoId].count++
                          return acc
                        }, {}),
                    )
                      .map(([mecanicoId, { info, count }]) => ({ mecanicoId, info, count }))
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={item.mecanicoId} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{item.info}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.count} {item.count === 1 ? 'ordem' : 'ordens'} finalizadas
                            </p>
                          </div>
                          <div className="ml-auto font-medium">{item.count}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Sem dados disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Todos os modais de ranking e prioridade devem ficar aqui, fora da grid: */}
      <Dialog open={modalRankingVeiculos} onOpenChange={open => setModalRankingVeiculos(open)}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogTitle className="sr-only">Ranking de Veículos com Mais Manutenções</DialogTitle>
          <div className="flex items-center gap-3 px-6 py-4 bg-[#6366f1] text-white flex-shrink-0 rounded-t-md">
            <Truck className="text-white text-2xl" />
            <div>
              <div className="text-lg font-bold leading-tight">Ranking de Veículos com Mais Manutenções</div>
              <div className="text-xs opacity-80">Todos os veículos cadastrados</div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 bg-background flex-1 overflow-y-auto scrollbar-none">
            {ordens.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Veículo</th>
                      <th className="px-3 py-2 text-right">Manutenções</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      ordens.reduce((acc: { [key: string]: { info: string; count: number } }, ordem) => {
                        if (!acc[ordem.veiculoId]) {
                          acc[ordem.veiculoId] = { info: ordem.veiculoInfo, count: 0 }
                        }
                        acc[ordem.veiculoId].count++
                        return acc
                      }, {}),
                    )
                      .map(([veiculoId, { info, count }]) => ({ veiculoId, info, count }))
                      .sort((a, b) => b.count - a.count)
                      .map((item, idx) => (
                        <tr key={item.veiculoId} className={idx === 0 ? "bg-yellow-50 font-bold" : ""}>
                          <td className="px-3 py-2 flex items-center gap-1">
                            {idx === 0 && <Trophy className="text-yellow-500" size={16} />} {idx + 1}
                          </td>
                          <td className="px-3 py-2">{item.info}</td>
                          <td className="px-3 py-2 text-right">{item.count}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">Sem dados disponíveis</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalRankingMotoristas} onOpenChange={open => setModalRankingMotoristas(open)}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogTitle className="sr-only">Ranking de Motoristas que Mais Solicitam Manutenção</DialogTitle>
          <div className="flex items-center gap-3 px-6 py-4 bg-[#10b981] text-white flex-shrink-0 rounded-t-md">
            <FileText className="text-white text-2xl" />
            <div>
              <div className="text-lg font-bold leading-tight">Ranking de Motoristas que Mais Solicitam Manutenção</div>
              <div className="text-xs opacity-80">Todos os motoristas cadastrados</div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 bg-background flex-1 overflow-y-auto scrollbar-none">
            {ordens.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Motorista</th>
                      <th className="px-3 py-2 text-right">Solicitações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      ordens.reduce((acc: { [key: string]: { info: string; count: number } }, ordem) => {
                        if (!acc[ordem.solicitanteId]) {
                          acc[ordem.solicitanteId] = { info: ordem.solicitanteInfo, count: 0 }
                        }
                        acc[ordem.solicitanteId].count++
                        return acc
                      }, {}),
                    )
                      .map(([solicitanteId, { info, count }]) => ({ solicitanteId, info, count }))
                      .sort((a, b) => b.count - a.count)
                      .map((item, idx) => (
                        <tr key={item.solicitanteId} className={idx === 0 ? "bg-yellow-50 font-bold" : ""}>
                          <td className="px-3 py-2 flex items-center gap-1">
                            {idx === 0 && <Trophy className="text-yellow-500" size={16} />} {idx + 1}
                          </td>
                          <td className="px-3 py-2">{item.info}</td>
                          <td className="px-3 py-2 text-right">{item.count}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">Sem dados disponíveis</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalRankingMecanicos} onOpenChange={setModalRankingMecanicos}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogTitle className="sr-only">Mecânicos que mais atenderam</DialogTitle>
          <div className="flex items-center gap-3 px-6 py-4 bg-[#6366f1] text-white flex-shrink-0 rounded-t-md">
            <Wrench className="text-white text-2xl" />
            <div>
              <div className="text-lg font-bold leading-tight">Mecânicos que mais atenderam</div>
              <div className="text-xs opacity-80">Ranking por ordens finalizadas</div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 bg-background flex-1 overflow-y-auto scrollbar-none">
            {ordens.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Mecânico</th>
                      <th className="px-3 py-2 text-right">Finalizadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      ordens.filter(o => o.status.toLowerCase() === 'finalizado' && o.mecanicoId)
                        .reduce((acc: { [key: string]: { info: string; count: number } }, ordem) => {
                          if (!acc[ordem.mecanicoId]) {
                            acc[ordem.mecanicoId] = { info: ordem.mecanicoInfo || 'Desconhecido', count: 0 }
                          }
                          acc[ordem.mecanicoId].count++
                          return acc
                        }, {}),
                    )
                      .map(([mecanicoId, { info, count }]) => ({ mecanicoId, info, count }))
                      .sort((a, b) => b.count - a.count)
                      .map((item, idx) => (
                        <tr key={item.mecanicoId} className={idx === 0 ? "bg-yellow-50 font-bold" : ""}>
                          <td className="px-3 py-2 flex items-center gap-1">
                            {idx === 0 && <Trophy className="text-yellow-500" size={16} />} {idx + 1}
                          </td>
                          <td className="px-3 py-2">{item.info}</td>
                          <td className="px-3 py-2 text-right">{item.count}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">Sem dados disponíveis</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalPrioridade} onOpenChange={setModalPrioridade}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogTitle className="sr-only">Distribuição por Prioridade</DialogTitle>
          <div className="flex items-center gap-3 px-6 py-4 bg-[#facc15] text-black flex-shrink-0 rounded-t-md">
            <AlertCircle className="text-yellow-700 text-2xl" />
            <div>
              <div className="text-lg font-bold leading-tight">Distribuição por Prioridade</div>
              <div className="text-xs opacity-80">Veja detalhes das prioridades das ordens</div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 bg-background flex-1 overflow-y-auto scrollbar-none">
            {prioridadeData.length > 0 ? (
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={prioridadeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prioridadeData.map((entry, index) => (
                        <Cell key={`cell-modal-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">Sem dados disponíveis</p>
              </div>
            )}
            {/* Tabela detalhada */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border rounded text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Prioridade</th>
                    <th className="px-3 py-2 text-right">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {prioridadeData.map((item, idx) => (
                    <tr key={item.name}>
                      <td className="px-3 py-2 font-medium" style={{ color: COLORS[idx % COLORS.length] }}>{item.name}</td>
                      <td className="px-3 py-2 text-right">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Explicação das prioridades */}
            <div className="text-xs text-muted-foreground">
              <b>O que significa cada prioridade?</b>
              <ul className="list-disc ml-5 mt-1">
                <li><span style={{ color: COLORS[3] }}>Urgente</span>: Ordem que precisa ser atendida imediatamente.</li>
                <li><span style={{ color: COLORS[2] }}>Alta</span>: Ordem importante, mas não emergencial.</li>
                <li><span style={{ color: COLORS[1] }}>Média</span>: Ordem relevante, pode aguardar um pouco.</li>
                <li><span style={{ color: COLORS[0] }}>Baixa</span>: Ordem sem urgência, pode ser programada.</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal detalhado do Tempo Médio */}
      <Dialog open={modalTempoMedio} onOpenChange={setModalTempoMedio}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogTitle className="sr-only">Detalhes do Cálculo do Tempo Médio</DialogTitle>
          <div className="flex items-center gap-3 px-6 py-4 bg-[#06B6D4] text-white flex-shrink-0 rounded-t-md">
            <Clock className="text-white text-2xl" />
            <div>
              <div className="text-lg font-bold leading-tight">Detalhes do Cálculo do Tempo Médio</div>
              <div className="text-xs opacity-80">
                Tempo médio: {tempoMedioInfo.tempoMedio} dias
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 bg-background flex-1 overflow-y-auto scrollbar-none">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Resumo do Cálculo</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Total de ordens finalizadas:</span>
                      <span className="font-medium">{tempoMedioInfo.ordensFinalizadas}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Ordens com dados válidos:</span>
                      <span className="font-medium">{tempoMedioInfo.ordensValidas}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Tempo médio calculado:</span>
                      <span className="font-medium">{tempoMedioInfo.tempoMedio} dias</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Como é calculado?</h3>
                  <p className="text-sm text-muted-foreground">
                    O tempo médio é calculado considerando a diferença em dias entre a data de criação da ordem 
                    e a data do evento de finalização no histórico. Apenas ordens com status "Finalizado" e 
                    com datas válidas são consideradas no cálculo.
                  </p>
                </div>
              </div>
              
              <h3 className="font-medium mt-6">Detalhes por Ordem</h3>
              {tempoMedioInfo.detalhes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border rounded text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Ordem</th>
                        <th className="px-3 py-2 text-left">Veículo</th>
                        <th className="px-3 py-2 text-center">Data Início</th>
                        <th className="px-3 py-2 text-center">Data Fim</th>
                        <th className="px-3 py-2 text-right">Tempo (dias)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempoMedioInfo.detalhes.map((detalhe) => (
                        <tr key={detalhe.numero} className="border-t">
                          <td className="px-3 py-2">{detalhe.numero}</td>
                          <td className="px-3 py-2">{detalhe.veiculoInfo.split(' - ')[0]}</td>
                          <td className="px-3 py-2 text-center">{detalhe.inicio}</td>
                          <td className="px-3 py-2 text-center">{detalhe.fim}</td>
                          <td className="px-3 py-2 text-right font-medium">{detalhe.dias}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right font-medium">Média:</td>
                        <td className="px-3 py-2 text-right font-bold">{tempoMedioInfo.tempoMedio}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-muted-foreground">Não há ordens com dados válidos para mostrar o cálculo.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Possíveis razões: não há ordens finalizadas, as ordens não têm evento de finalização no histórico, 
                    ou há problemas com as datas registradas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal detalhado do Total de Ordens */}
      <Dialog open={modalTotalOrdens} onOpenChange={setModalTotalOrdens}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogTitle className="sr-only">Detalhes do Total de Ordens</DialogTitle>
          <div className="flex items-center gap-3 px-6 py-4 bg-[#3B82F6] text-white flex-shrink-0 rounded-t-md">
            <FileText className="text-white text-2xl" />
            <div>
              <div className="text-lg font-bold leading-tight">Detalhes do Total de Ordens</div>
              <div className="text-xs opacity-80">
                Total: {estatisticas.total} ordens
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 bg-background flex-1 overflow-y-auto scrollbar-none">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Resumo</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Total de ordens:</span>
                      <span className="font-medium">{estatisticas.total}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Ordens finalizadas:</span>
                      <span className="font-medium">{estatisticas.finalizadas}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Ordens em andamento:</span>
                      <span className="font-medium">{estatisticas.emAndamento}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Taxa de conclusão:</span>
                      <span className="font-medium">{conclusionPercentage}%</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Distribuição por Status</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Finalizadas', value: estatisticas.finalizadas },
                            { name: 'Em andamento', value: estatisticas.emAndamento }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#1D4ED8" /> {/* Azul para finalizadas */}
                          <Cell fill="#10B981" /> {/* Verde para em andamento */}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium mt-6">Distribuição por Status</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Quantidade</th>
                      <th className="px-3 py-2 text-right">Percentual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusList.map((status) => {
                      const count = ordens.filter((o) => mapStatus(o.status) === status).length;
                      const percentage = estatisticas.total > 0 ? ((count / estatisticas.total) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={status} className="border-t">
                          <td className="px-3 py-2 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusBarColor(status) }}></span>
                            {status}
                          </td>
                          <td className="px-3 py-2 text-right">{count}</td>
                          <td className="px-3 py-2 text-right">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal detalhado de Em Andamento */}
      <Dialog open={modalEmAndamento} onOpenChange={setModalEmAndamento}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogTitle className="sr-only">Detalhes de Ordens em Andamento</DialogTitle>
          <div className="flex items-center gap-3 px-6 py-4 bg-[#10B981] text-white flex-shrink-0 rounded-t-md">
            <Activity className="text-white text-2xl" />
            <div>
              <div className="text-lg font-bold leading-tight">Detalhes de Ordens em Andamento</div>
              <div className="text-xs opacity-80">
                Total em andamento: {estatisticas.emAndamento} ordens
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 bg-background flex-1 overflow-y-auto scrollbar-none">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Resumo</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Total em andamento:</span>
                      <span className="font-medium">{estatisticas.emAndamento}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Ordens atrasadas:</span>
                      <span className="font-medium">{estatisticas.atrasadas}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Percentual de atraso:</span>
                      <span className="font-medium">
                        {estatisticas.emAndamento > 0 
                          ? ((estatisticas.atrasadas / estatisticas.emAndamento) * 100).toFixed(1) 
                          : "0.0"}%
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Distribuição por Prioridade</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              name: 'Urgente', 
                              value: ordens.filter(o => o.status.toLowerCase() !== "finalizado" && o.prioridade === "Urgente").length 
                            },
                            { 
                              name: 'Alta', 
                              value: ordens.filter(o => o.status.toLowerCase() !== "finalizado" && o.prioridade === "Alta").length 
                            },
                            { 
                              name: 'Média', 
                              value: ordens.filter(o => o.status.toLowerCase() !== "finalizado" && o.prioridade === "Média").length 
                            },
                            { 
                              name: 'Baixa', 
                              value: ordens.filter(o => o.status.toLowerCase() !== "finalizado" && o.prioridade === "Baixa").length 
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#EF4444" /> {/* Vermelho para Urgente */}
                          <Cell fill="#F97316" /> {/* Laranja para Alta */}
                          <Cell fill="#FACC15" /> {/* Amarelo para Média */}
                          <Cell fill="#3B82F6" /> {/* Azul para Baixa */}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium mt-6">Distribuição por Status (Exceto Finalizadas)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Quantidade</th>
                      <th className="px-3 py-2 text-right">Percentual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusList.filter(status => status !== "Finalizado").map((status) => {
                      const count = ordens.filter((o) => mapStatus(o.status) === status).length;
                      const percentage = estatisticas.emAndamento > 0 
                        ? ((count / estatisticas.emAndamento) * 100).toFixed(1) 
                        : "0.0";
                      return (
                        <tr key={status} className="border-t">
                          <td className="px-3 py-2 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusBarColor(status) }}></span>
                            {status}
                          </td>
                          <td className="px-3 py-2 text-right">{count}</td>
                          <td className="px-3 py-2 text-right">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal detalhado da Eficiência */}
      <Dialog open={modalEficiencia} onOpenChange={setModalEficiencia}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogTitle className="sr-only">Detalhes da Eficiência</DialogTitle>
          <div className="flex items-center gap-3 px-6 py-4 bg-[#F97316] text-white flex-shrink-0 rounded-t-md">
            <TrendingUp className="text-white text-2xl" />
            <div>
              <div className="text-lg font-bold leading-tight">Detalhes da Eficiência</div>
              <div className="text-xs opacity-80">
                Taxa de conclusão: {conclusionPercentage}%
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 bg-background flex-1 overflow-y-auto scrollbar-none">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Resumo</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Total de ordens:</span>
                      <span className="font-medium">{estatisticas.total}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Ordens finalizadas:</span>
                      <span className="font-medium">{estatisticas.finalizadas}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Taxa de conclusão:</span>
                      <span className="font-medium">{conclusionPercentage}%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Tempo médio de finalização:</span>
                      <span className="font-medium">{estatisticas.tempoMedio} dias</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Como é calculado?</h3>
                  <p className="text-sm text-muted-foreground">
                    A eficiência é calculada como a porcentagem de ordens finalizadas em relação ao total de ordens cadastradas:
                  </p>
                  <div className="bg-muted p-3 rounded-md mt-2 text-center">
                    <p className="font-mono">
                      Eficiência = (Ordens Finalizadas ÷ Total de Ordens) × 100%
                    </p>
                    <p className="font-mono mt-2">
                      {estatisticas.finalizadas} ÷ {estatisticas.total} × 100% = {conclusionPercentage}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-md mt-4">
                <h3 className="font-medium mb-4">Progresso de Conclusão</h3>
                <div className="w-full bg-gray-200 rounded-full h-6 mb-2">
                  <div 
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${conclusionPercentage}%` }}
                  >
                    {conclusionPercentage}%
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="p-4 border rounded-md mt-4">
                <h3 className="font-medium mb-2">Comparativo por Mecânico</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border rounded text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Mecânico</th>
                        <th className="px-3 py-2 text-right">Total de Ordens</th>
                        <th className="px-3 py-2 text-right">Finalizadas</th>
                        <th className="px-3 py-2 text-right">Taxa de Conclusão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        ordens.reduce((acc: { [key: string]: { 
                          info: string, 
                          total: number, 
                          finalizadas: number 
                        } }, ordem) => {
                          const mecanicoId = ordem.mecanicoId || "sem-mecanico";
                          const mecanicoInfo = ordem.mecanicoInfo || "Sem mecânico";
                          
                          if (!acc[mecanicoId]) {
                            acc[mecanicoId] = { 
                              info: mecanicoInfo, 
                              total: 0, 
                              finalizadas: 0 
                            };
                          }
                          
                          acc[mecanicoId].total++;
                          if (ordem.status.toLowerCase() === "finalizado") {
                            acc[mecanicoId].finalizadas++;
                          }
                          
                          return acc;
                        }, {})
                      )
                        .map(([mecanicoId, { info, total, finalizadas }]) => ({
                          mecanicoId,
                          info,
                          total,
                          finalizadas,
                          taxa: total > 0 ? Math.round((finalizadas / total) * 100) : 0
                        }))
                        .sort((a, b) => b.taxa - a.taxa)
                        .map((item) => (
                          <tr key={item.mecanicoId} className="border-t">
                            <td className="px-3 py-2">{item.info}</td>
                            <td className="px-3 py-2 text-right">{item.total}</td>
                            <td className="px-3 py-2 text-right">{item.finalizadas}</td>
                            <td className="px-3 py-2 text-right">{item.taxa}%</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Esconder barra de rolagem visual do modal (scrollbar-none) */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Modal para selecionar período do card Total de Ordens */}
      <Dialog open={modalPeriodo} onOpenChange={setModalPeriodo}>
        <DialogContent className="max-w-md">
          <DialogTitle>Selecionar Período</DialogTitle>
          <div className="my-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data de início</label>
              <Input type="date" value={draftDataInicio} onChange={e => setDraftDataInicio(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de fim</label>
              <Input type="date" value={draftDataFim} onChange={e => setDraftDataFim(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" onClick={() => setModalPeriodo(false)}>
              Cancelar
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => { setPeriodo({ from: draftDataInicio, to: draftDataFim }); setModalPeriodo(false); }}>
              Aplicar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
