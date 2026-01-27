"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrdensServicoSupabase, type OrdemServico } from "@/services/ordem-servico-service"
import { cn } from "@/lib/utils"
import { Wrench, Clock, FileText, AlertCircle, Package, CheckCircle, Calendar, Car } from "lucide-react"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MobileBackButton } from "@/components/mobile-back-button"

// Componente para exibir a prioridade com a cor apropriada
const PrioridadeBadge = ({ prioridade, isMobile = false }: { prioridade: string; isMobile?: boolean }) => {
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
  const sizeClasses = isMobile ? "text-[10px] px-1 py-0" : "text-[10px] px-1.5 py-0.5"
  return <Badge className={cn("font-medium rounded-none", sizeClasses, badgeClasses)} variant="outline">{prioridade}</Badge>
}

// Função auxiliar para obter as cores do status
const getStatusColors = (status: string) => {
  switch (status) {
    case "Aguardando Mecânico":
      return {
        bg: "bg-[#6B7280]",
        bgLight: "bg-[#6B7280]/10",
        border: "border-[#6B7280]/30",
        text: "text-[#6B7280]",
        badge: "bg-[#6B7280] text-white hover:bg-[#6B7280]/90",
        icon: FileText
      }
    case "Em Análise":
      return {
        bg: "bg-[#D97706]",
        bgLight: "bg-[#D97706]/10",
        border: "border-[#D97706]/30",
        text: "text-[#D97706]",
        badge: "bg-[#D97706] text-white hover:bg-[#D97706]/90",
        icon: AlertCircle
      }
    case "Aguardando aprovação":
      return {
        bg: "bg-[#F97316]",
        bgLight: "bg-[#F97316]/10",
        border: "border-[#F97316]/30",
        text: "text-[#F97316]",
        badge: "bg-[#F97316] text-white hover:bg-[#F97316]/90",
        icon: Clock
      }
    case "Aguardando OS":
      return {
        bg: "bg-[#3B82F6]",
        bgLight: "bg-[#3B82F6]/10",
        border: "border-[#3B82F6]/30",
        text: "text-[#3B82F6]",
        badge: "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90",
        icon: Package
      }
    case "Aguardando Fornecedor":
      return {
        bg: "bg-[#8B5CF6]",
        bgLight: "bg-[#8B5CF6]/10",
        border: "border-[#8B5CF6]/30",
        text: "text-[#8B5CF6]",
        badge: "bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/90",
        icon: Package
      }
    case "Serviço Externo":
      return {
        bg: "bg-[#047857]",
        bgLight: "bg-[#047857]/10",
        border: "border-[#047857]/30",
        text: "text-[#047857]",
        badge: "bg-[#047857] text-white hover:bg-[#047857]/90",
        icon: Wrench
      }
    case "Comprar na Rua":
      return {
        bg: "bg-[#EF4444]",
        bgLight: "bg-[#EF4444]/10",
        border: "border-[#EF4444]/30",
        text: "text-[#EF4444]",
        badge: "bg-[#EF4444] text-white hover:bg-[#EF4444]/90",
        icon: AlertCircle
      }
    case "Fila de Serviço":
      return {
        bg: "bg-[#06B6D4]",
        bgLight: "bg-[#06B6D4]/10",
        border: "border-[#06B6D4]/30",
        text: "text-[#06B6D4]",
        badge: "bg-[#06B6D4] text-white hover:bg-[#06B6D4]/90",
        icon: Clock
      }
    case "Em Serviço":
    case "Em andamento":
      return {
        bg: "bg-[#10B981]",
        bgLight: "bg-[#10B981]/10",
        border: "border-[#10B981]/30",
        text: "text-[#10B981]",
        badge: "bg-[#10B981] text-white hover:bg-[#10B981]/90",
        icon: Wrench
      }
    case "Finalizado":
      return {
        bg: "bg-[#1D4ED8]",
        bgLight: "bg-[#1D4ED8]/10",
        border: "border-[#1D4ED8]/30",
        text: "text-[#1D4ED8]",
        badge: "bg-[#1D4ED8] text-white hover:bg-[#1D4ED8]/90",
        icon: CheckCircle
      }
    case "Em Aprovação":
      return {
        bg: "bg-[#F97316]",
        bgLight: "bg-[#F97316]/10",
        border: "border-[#F97316]/30",
        text: "text-[#F97316]",
        badge: "bg-[#F97316] text-white hover:bg-[#F97316]/90",
        icon: Clock
      }
    default:
      return {
        bg: "bg-gray-500",
        bgLight: "bg-gray-500/10",
        border: "border-gray-500/30",
        text: "text-gray-500",
        badge: "bg-gray-500 text-white hover:bg-gray-500/90",
        icon: AlertCircle
      }
  }
}

// Componente para exibir o status com a cor apropriada
const StatusBadge = ({ status, isMobile = false }: { status: string; isMobile?: boolean }) => {
  const colors = getStatusColors(status)
  const sizeClasses = isMobile ? "text-[10px] px-1 py-0.5" : "text-xs px-2 py-1"
  return (
    <Badge className={cn("font-semibold shadow-sm border-0 rounded-none", sizeClasses, colors.badge)}>
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

  const colors = getStatusColors(ordem.status)
  const StatusIcon = colors.icon

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-200",
      "border-2",
      colors.border
    )}>
      {/* Barra lateral colorida */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        colors.bg
      )} />
      
      <CardContent 
        className="p-2 relative"
        style={{
          background: ordem.status === "Aguardando Mecânico" ? "linear-gradient(to bottom right, rgba(107, 114, 128, 0.15), rgba(107, 114, 128, 0.05))" :
                      ordem.status === "Em Análise" ? "linear-gradient(to bottom right, rgba(217, 119, 6, 0.15), rgba(217, 119, 6, 0.05))" :
                      ordem.status === "Aguardando aprovação" ? "linear-gradient(to bottom right, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))" :
                      ordem.status === "Aguardando OS" ? "linear-gradient(to bottom right, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))" :
                      ordem.status === "Aguardando Fornecedor" ? "linear-gradient(to bottom right, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))" :
                      ordem.status === "Serviço Externo" ? "linear-gradient(to bottom right, rgba(4, 120, 87, 0.15), rgba(4, 120, 87, 0.05))" :
                      ordem.status === "Comprar na Rua" ? "linear-gradient(to bottom right, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))" :
                      ordem.status === "Fila de Serviço" ? "linear-gradient(to bottom right, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))" :
                      ordem.status === "Em Serviço" || ordem.status === "Em andamento" ? "linear-gradient(to bottom right, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))" :
                      ordem.status === "Finalizado" ? "linear-gradient(to bottom right, rgba(29, 78, 216, 0.15), rgba(29, 78, 216, 0.05))" :
                      ordem.status === "Em Aprovação" ? "linear-gradient(to bottom right, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05))" :
                      "linear-gradient(to bottom right, rgba(107, 114, 128, 0.15), rgba(107, 114, 128, 0.05))"
        }}
      >
        {/* Header com número e badges */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={cn(
              "p-1 rounded flex-shrink-0",
              colors.bg
            )}>
              <StatusIcon className="h-3 w-3 text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground truncate" style={{ fontWeight: 700, letterSpacing: '0.02em' }}>
              {ordem.numero}
            </h3>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={ordem.status} />
          </div>
        </div>
        
        {/* Informações do veículo e data */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Car className={cn("h-3 w-3 flex-shrink-0", colors.text)} />
            <p className="text-xs font-medium text-foreground truncate" style={{ letterSpacing: '0.01em' }}>
              {ordem.veiculoInfo}
            </p>
          </div>
          
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar className={cn("h-3 w-3 flex-shrink-0", colors.text)} />
              <p className="text-xs font-medium text-foreground">
                {formatarData(ordem.data)}
              </p>
            </div>
            <PrioridadeBadge prioridade={ordem.prioridade} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente Mobile View
function TelaMobileView({ 
  mecanicosComOrdens, 
  loading 
}: { 
  mecanicosComOrdens: { [key: string]: OrdemServico[] }
  loading: boolean 
}) {
  const sortedMecanicos = Object.keys(mecanicosComOrdens).sort((a, b) => {
    const nomeA = mecanicosComOrdens[a][0]?.mecanicoInfo || "Sem mecânico"
    const nomeB = mecanicosComOrdens[b][0]?.mecanicoInfo || "Sem mecânico"
    return nomeA.localeCompare(nomeB)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center">
          <Wrench className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-muted-foreground">Carregando ordens de serviço...</h2>
        </div>
      </div>
    )
  }

  if (sortedMecanicos.length === 0) {
    return (
      <div className="text-center p-6 bg-muted/50 rounded-lg m-4">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold">Nenhuma ordem de serviço em andamento</h2>
        <p className="text-sm text-muted-foreground mt-2">Todas as ordens foram finalizadas</p>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-3 max-w-full overflow-x-hidden">
      <div className="w-[96%] pl-3 pr-0 mb-2">
        <MobileBackButton />
      </div>

      <Accordion type="single" collapsible className="w-full space-y-2">
        {sortedMecanicos.map((mecanicoId) => {
          const ordensOriginais = mecanicosComOrdens[mecanicoId]
          const nomeMecanicoOriginal = ordensOriginais[0]?.mecanicoInfo || "Sem mecânico atribuído"
          const nomeMecanico = nomeMecanicoOriginal.replace(/\s*\([^)]*\)\s*$/, '').trim()
          
          const ordens = ordensOriginais
            .filter(ordem =>
              ordem.status === "Em Serviço" ||
              ordem.status === "Fila de Serviço" ||
              ordem.status === "Aguardando Mecânico"
            )
            .sort((a, b) => {
              if (a.ordem_execucao && b.ordem_execucao) {
                return a.ordem_execucao - b.ordem_execucao
              }
              if (a.ordem_execucao) return -1
              if (b.ordem_execucao) return 1
              const numA = parseInt(a.numero.replace(/\D/g, ''), 10) || 0
              const numB = parseInt(b.numero.replace(/\D/g, ''), 10) || 0
              return numA - numB
            })

          return (
            <AccordionItem key={mecanicoId} value={mecanicoId} className="border rounded-lg px-2 bg-card max-w-full">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Wrench className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-sm truncate">{nomeMecanico}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs px-1.5 py-0">
                    {ordens.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5 pt-1.5 pb-2">
                  {ordens.map(ordem => (
                    <OrdemCard key={ordem.id} ordem={ordem} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

export default function TelaManutencoesPage() {
  const isMobile = useIsMobile()
  const [mecanicosComOrdens, setMecanicosComOrdens] = useState<{ [key: string]: OrdemServico[] }>({})
  const [loading, setLoading] = useState(true)

  // Função para buscar dados
  const fetchData = async () => {
    try {
      setLoading(true)
      const allOrdens = await getOrdensServicoSupabase()
      const ordensAtivas = allOrdens.filter(
        (ordem) =>
          ordem.status === "Em Serviço" ||
          ordem.status === "Fila de Serviço" ||
          ordem.status === "Aguardando Mecânico"
      )
      // Agrupar ordens por mecânico
      const mecanicosMap: { [key: string]: OrdemServico[] } = {}
      for (const ordem of ordensAtivas) {
        const mecanicoId = ordem.mecanicoId || "sem-mecanico"
        if (!mecanicosMap[mecanicoId]) {
          mecanicosMap[mecanicoId] = []
        }
        mecanicosMap[mecanicoId].push(ordem)
      }
      // Ordenar os mecânicos por nome
      const sortedMecanicos = Object.keys(mecanicosMap).sort((a, b) => {
        const nomeA = mecanicosMap[a][0]?.mecanicoInfo || "Sem mecânico"
        const nomeB = mecanicosMap[b][0]?.mecanicoInfo || "Sem mecânico"
        return nomeA.localeCompare(nomeB)
      })
      // Ordenar as ordens de cada mecânico por prioridade e ordem_execucao
      sortedMecanicos.forEach(mecanicoId => {
        mecanicosMap[mecanicoId] = mecanicosMap[mecanicoId].sort((a, b) => {
          const prioridadeOrder = { "Urgente": 0, "Alta": 1, "Média": 2, "Baixa": 3 }
          const prioridadeA = prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] ?? 4
          const prioridadeB = prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] ?? 4
          if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB
          const ordemExecucaoA = a.ordem_execucao !== undefined ? a.ordem_execucao : null
          const ordemExecucaoB = b.ordem_execucao !== undefined ? b.ordem_execucao : null
          if (ordemExecucaoA !== null && ordemExecucaoB !== null) return ordemExecucaoA - ordemExecucaoB
          if (ordemExecucaoA !== null) return -1
          if (ordemExecucaoB !== null) return 1
          const numA = parseInt(a.numero.replace(/\D/g, ''), 10) || 0
          const numB = parseInt(b.numero.replace(/\D/g, ''), 10) || 0
          return numA - numB
        })
      })
      setMecanicosComOrdens(mecanicosMap)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const timerDados = setInterval(() => { fetchData() }, 10000)
    return () => { clearInterval(timerDados) }
  }, [])

  if (isMobile) {
    return <TelaMobileView mecanicosComOrdens={mecanicosComOrdens} loading={loading} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Wrench className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-muted-foreground">Carregando ordens de serviço...</h2>
        </div>
      </div>
    )
  }

  const sortedMecanicos = Object.keys(mecanicosComOrdens).sort((a, b) => {
    const nomeA = mecanicosComOrdens[a][0]?.mecanicoInfo || "Sem mecânico"
    const nomeB = mecanicosComOrdens[b][0]?.mecanicoInfo || "Sem mecânico"
    return nomeA.localeCompare(nomeB)
  })

  return (
    <div className="h-[calc(100vh-4rem)] p-2 overflow-hidden font-sans" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.01em' }}>
      {sortedMecanicos.length === 0 ? (
        <Card className="border-2 h-full">
          <CardContent className="text-center p-12 h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Nenhuma ordem de serviço em andamento</h2>
                <p className="text-muted-foreground">Todas as ordens foram finalizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className="grid gap-2 h-full"
          style={{
            gridTemplateColumns: `repeat(${Math.min(sortedMecanicos.length, 4)}, minmax(280px, 1fr))`
          }}
        >
          {sortedMecanicos.map(mecanicoId => {
            const ordensOriginais = mecanicosComOrdens[mecanicoId]
            const nomeMecanicoOriginal = ordensOriginais[0]?.mecanicoInfo || "Sem mecânico atribuído"
            const nomeMecanico = nomeMecanicoOriginal.replace(/\s*\([^)]*\)\s*$/, '').trim()
            // Filtrar pelos status permitidos e ordenar igual ao planejamento
            const ordens = ordensOriginais
              .filter(ordem =>
                ordem.status === "Em Serviço" ||
                ordem.status === "Fila de Serviço" ||
                ordem.status === "Aguardando Mecânico"
              )
              .sort((a, b) => {
                if (a.ordem_execucao && b.ordem_execucao) {
                  return a.ordem_execucao - b.ordem_execucao
                }
                if (a.ordem_execucao) return -1
                if (b.ordem_execucao) return 1
                const numA = parseInt(a.numero.replace(/\D/g, ''), 10) || 0
                const numB = parseInt(b.numero.replace(/\D/g, ''), 10) || 0
                return numA - numB
              })
            
            return (
              <Card key={mecanicoId} className="flex flex-col h-full shadow-md border-2 overflow-hidden">
                {/* Header do mecânico */}
                <div className="p-2 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm truncate" title={nomeMecanico} style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
              {nomeMecanico}
            </h3>
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5 flex-shrink-0">
                      {ordens.length}
                    </Badge>
                  </div>
                </div>

                {/* Lista de ordens */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0 bg-muted/20">
                  {ordens.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-xs">Nenhuma ordem disponível</p>
                    </div>
                  ) : (
                    ordens.map(ordem => (
                      <OrdemCard key={ordem.id} ordem={ordem} />
                    ))
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 