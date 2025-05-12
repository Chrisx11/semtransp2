"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrdensServicoSupabase, type OrdemServico } from "@/services/ordem-servico-service"
import { cn } from "@/lib/utils"
import { Wrench, Clock, FileText, AlertCircle, Package, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"

// Componente para exibir a prioridade com a cor apropriada
const PrioridadeBadge = ({ prioridade }: { prioridade: string }) => {
  let badgeClasses = ""
  switch (prioridade) {
    case "Baixa":
      badgeClasses = "bg-[#3B82F6] text-white hover:bg-[#2563EB]" // Azul
      break
    case "Média":
      badgeClasses = "bg-[#FACC15] text-black hover:bg-[#EAB308]" // Amarelo
      break
    case "Alta":
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#EA580C]" // Laranja
      break
    case "Urgente":
      badgeClasses = "bg-[#EF4444] text-white hover:bg-[#DC2626]" // Vermelho
      break
    default:
      badgeClasses = "bg-gray-500 text-white hover:bg-gray-500/80" // Cinza
  }
  return <Badge className={cn("font-medium text-sm px-2 py-0.5", badgeClasses)} variant="outline">{prioridade}</Badge>
}

// Componente para exibir o status com a cor apropriada
const StatusBadge = ({ status }: { status: string }) => {
  // Definir as classes de cores personalizadas para cada status
  let badgeClasses = ""

  switch (status) {
    case "Aguardando Mecânico":
      // Cinza (#6B7280)
      badgeClasses = "bg-[#6B7280] text-white hover:bg-[#6B7280]/80"
      break
    case "Em Análise":
      // Amarelo Escuro (#D97706)
      badgeClasses = "bg-[#D97706] text-white hover:bg-[#D97706]/80"
      break
    case "Aguardando aprovação":
      // Laranja (#F97316)
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#F97316]/80"
      break
    case "Aguardando OS":
      // Azul Claro (#3B82F6)
      badgeClasses = "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80"
      break
    case "Aguardando Fornecedor":
      // Roxo (#8B5CF6)
      badgeClasses = "bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/80"
      break
    case "Serviço Externo":
      // Verde Escuro (#047857)
      badgeClasses = "bg-[#047857] text-white hover:bg-[#047857]/80"
      break
    case "Comprar na Rua":
      // Vermelho Claro (#EF4444)
      badgeClasses = "bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
      break
    case "Fila de Serviço":
      // Ciano (#06B6D4)
      badgeClasses = "bg-[#06B6D4] text-white hover:bg-[#06B6D4]/80"
      break
    case "Em Serviço":
    case "Em andamento":
      // Verde Claro (#10B981)
      badgeClasses = "bg-[#10B981] text-white hover:bg-[#10B981]/80"
      break
    case "Finalizado":
      // Azul Escuro (#1D4ED8)
      badgeClasses = "bg-[#1D4ED8] text-white hover:bg-[#1D4ED8]/80"
      break
    case "Em Aprovação":
      // Laranja (#F97316) - mesmo do "Aguardando aprovação"
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#F97316]/80"
      break
    default:
      // Cor padrão para status não especificados
      badgeClasses = "bg-gray-500 text-white hover:bg-gray-500/80"
  }

  return (
    <Badge className={cn("font-medium text-sm px-2 py-0.5", badgeClasses)} variant="outline">
      {status}
    </Badge>
  )
}

// Componente para o card de ordem de serviço
interface OrdemCardProps {
  ordem: OrdemServico
}

const OrdemCard = ({ ordem }: OrdemCardProps) => {
  // Função para formatar a data de yyyy-mm-dd para dd/mm/yyyy
  const formatarData = (dataString: string) => {
    if (!dataString) return "—";
    
    try {
      const [ano, mes, dia] = dataString.split('-');
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
      return dataString;
    } catch (error) {
      return dataString;
    }
  };

  // Determinar ícone baseado no status
  let StatusIcon;
  switch (ordem.status) {
    case "Aguardando Mecânico":
      StatusIcon = FileText;
      break;
    case "Fila de Serviço":
      StatusIcon = Clock;
      break;
    case "Em Serviço":
      StatusIcon = Wrench;
      break;
    case "Aguardando Fornecedor":
    case "Aguardando OS":
      StatusIcon = Package;
      break;
    case "Finalizado":
      StatusIcon = CheckCircle;
      break;
    default:
      StatusIcon = AlertCircle;
  }

  return (
    <Card className="shadow-md border hover:border-primary hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex justify-between mb-1">
          <div className="flex items-center gap-1">
            <StatusIcon className="h-5 w-5 text-primary/70" />
            <h3 className="text-xl font-bold">{ordem.numero}</h3>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={ordem.status} />
            <PrioridadeBadge prioridade={ordem.prioridade} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <div>
            <p className="text-base font-semibold text-muted-foreground">Veículo:</p>
            <p className="text-lg font-bold truncate">{ordem.veiculoInfo}</p>
          </div>
          
          <div className="text-right">
            <p className="text-base font-semibold text-muted-foreground">Data:</p>
            <p className="text-lg">{formatarData(ordem.data)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TelaManutencoesPage() {
  const [mecanicosComOrdens, setMecanicosComOrdens] = useState<{ [key: string]: OrdemServico[] }>({})
  const [ordensAnteriores, setOrdensAnteriores] = useState<OrdemServico[]>([])
  const [loading, setLoading] = useState(true)
  const [mecanicoAtual, setMecanicoAtual] = useState<number>(0)
  const [autopilot, setAutopilot] = useState<boolean>(true)
  
  // Função para buscar dados
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar todas as ordens do Supabase
      const allOrdens = await getOrdensServicoSupabase()
      
      // Guardar todas as ordens para comparação
      const todasOrdensAtuais = [...allOrdens]
      
      // Filtrar apenas ordens não finalizadas para exibição
      const ordensAtivas = allOrdens.filter(
        (ordem) => ordem.status !== "Finalizado"
      )
      
      // Agrupar ordens por mecânico
      const mecanicosMap: { [key: string]: OrdemServico[] } = {}
      
      for (const ordem of ordensAtivas) {
        const mecanicoId = ordem.mecanicoId || "sem-mecanico"
        const mecanicoInfo = ordem.mecanicoInfo || "Sem mecânico atribuído"
        
        if (!mecanicosMap[mecanicoId]) {
          mecanicosMap[mecanicoId] = []
        }
        
        mecanicosMap[mecanicoId].push(ordem)
      }
      
      // Ordenar as ordens de cada mecânico pelo campo ordem_execucao
      Object.keys(mecanicosMap).forEach(mecanicoId => {
        mecanicosMap[mecanicoId] = mecanicosMap[mecanicoId].sort((a, b) => {
          // Primeiro pela prioridade
          const prioridadeOrder = { "Urgente": 0, "Alta": 1, "Média": 2, "Baixa": 3 }
          const prioridadeA = prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] ?? 4
          const prioridadeB = prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] ?? 4
          
          if (prioridadeA !== prioridadeB) {
            return prioridadeA - prioridadeB
          }
          
          // Verificar se as ordens têm ordem_execucao
          const ordemExecucaoA = a.ordem_execucao !== undefined ? a.ordem_execucao : null
          const ordemExecucaoB = b.ordem_execucao !== undefined ? b.ordem_execucao : null
          
          // Se ambas as ordens têm ordem_execucao, comparar diretamente
          if (ordemExecucaoA !== null && ordemExecucaoB !== null) {
            return ordemExecucaoA - ordemExecucaoB
          }
          
          // Se apenas uma tem ordem_execucao, colocar ela primeiro
          if (ordemExecucaoA !== null) return -1
          if (ordemExecucaoB !== null) return 1
          
          // Se nenhuma tem ordem_execucao, ordenar por número
          const numA = parseInt(a.numero.replace(/\D/g, ''), 10) || 0
          const numB = parseInt(b.numero.replace(/\D/g, ''), 10) || 0
          return numA - numB
        })
      })
      
      setMecanicosComOrdens(mecanicosMap)
      setOrdensAnteriores(todasOrdensAtuais)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Obter lista de IDs de mecânicos
  const mecanicosIds = Object.keys(mecanicosComOrdens)

  // Função para avançar para o próximo mecânico
  const proximoMecanico = () => {
    if (mecanicosIds.length === 0) return
    setMecanicoAtual((prev) => (prev + 1) % mecanicosIds.length)
  }

  // Função para voltar para o mecânico anterior
  const mecanicoAnterior = () => {
    if (mecanicosIds.length === 0) return
    setMecanicoAtual((prev) => (prev - 1 + mecanicosIds.length) % mecanicosIds.length)
  }

  // Alternar modo automático/manual
  const toggleAutopilot = () => {
    setAutopilot(!autopilot)
  }

  useEffect(() => {
    // Carregar dados inicialmente
    fetchData()
    
    // Configurar timer para recarregar a cada 10 segundos (10000ms)
    const timerDados = setInterval(() => {
      fetchData()
    }, 10000)
    
    // Limpar timer quando o componente for desmontado
    return () => {
      clearInterval(timerDados)
    }
  }, [])

  // Efeito para trocar de mecânico a cada 10 segundos quando em modo automático
  useEffect(() => {
    if (autopilot && mecanicosIds.length > 1) {
      const timerCarrossel = setInterval(() => {
        setMecanicoAtual((prev) => (prev + 1) % mecanicosIds.length)
      }, 10000)  // 10 segundos
      
      return () => clearInterval(timerCarrossel)
    }
  }, [autopilot, mecanicosIds.length])

  // Atualizar o relógio
  useEffect(() => {
    const timerRelogio = setInterval(() => {
      const relogioElement = document.getElementById('relogio')
      if (relogioElement) {
        relogioElement.textContent = new Date().toLocaleTimeString()
      }
    }, 1000)
    
    return () => clearInterval(timerRelogio)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Wrench className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-muted-foreground">Carregando ordens de serviço...</h2>
        </div>
      </div>
    )
  }

  // Não mostrar nada se não houver mecânicos com ordens
  if (mecanicosIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-10 bg-muted/50 rounded-lg">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Nenhuma ordem de serviço em andamento</h2>
          <p className="text-xl text-muted-foreground mt-2">Todas as ordens foram finalizadas</p>
        </div>
      </div>
    )
  }

  // Obter o ID do mecânico atual
  const mecanicoIdAtual = mecanicosIds[mecanicoAtual]
  const ordens = mecanicosComOrdens[mecanicoIdAtual] || []
  const nomeMecanico = ordens.length > 0 
    ? ordens[0].mecanicoInfo 
    : (mecanicoIdAtual === "sem-mecanico" ? "Sem mecânico atribuído" : `Mecânico ${mecanicoIdAtual}`)

  return (
    <div className="space-y-4 pb-6 h-screen flex flex-col">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel de Acompanhamento</h1>
            <p className="text-lg text-muted-foreground">Ordens de serviço em andamento</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                toggleAutopilot()
              }} 
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                autopilot 
                  ? "bg-primary text-white hover:bg-primary/90" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {autopilot ? "Automático" : "Manual"}
            </button>
            <div className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6" />
              <span id="relogio">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação do carrossel */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {mecanicoAtual + 1} de {mecanicosIds.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              mecanicoAnterior()
            }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Mecânico anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              proximoMecanico()
            }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Próximo mecânico"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Seção do mecânico atual */}
      <div className="flex-1 overflow-auto pb-4 px-1">
        <div className="flex items-center gap-2 mb-3 bg-primary/10 p-3 rounded-lg">
          <Wrench className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{nomeMecanico}</h2>
          <span className="ml-2 bg-primary text-white rounded-full px-2 py-0.5 text-base">
            {ordens.length} {ordens.length === 1 ? "ordem" : "ordens"}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ordens.map((ordem) => (
            <OrdemCard key={ordem.id} ordem={ordem} />
          ))}
        </div>
      </div>
    </div>
  )
} 