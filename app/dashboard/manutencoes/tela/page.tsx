"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrdensServicoSupabase, type OrdemServico } from "@/services/ordem-servico-service"
import { cn } from "@/lib/utils"
import { Wrench, Clock, FileText, AlertCircle, Package, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
  const sizeClasses = isMobile ? "text-[10px] px-1 py-0" : "text-sm px-2 py-0.5"
  return <Badge className={cn("font-medium", sizeClasses, badgeClasses)} variant="outline">{prioridade}</Badge>
}

// Componente para exibir o status com a cor apropriada
const StatusBadge = ({ status, isMobile = false }: { status: string; isMobile?: boolean }) => {
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

  const sizeClasses = isMobile ? "text-[10px] px-1 py-0" : "text-sm px-2 py-0.5"
  return (
    <Badge className={cn("font-medium", sizeClasses, badgeClasses)} variant="outline">
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
      <div className="space-y-1 px-1">
        <h1 className="text-xl font-bold text-primary">Tela de Manutenções</h1>
        <p className="text-xs text-muted-foreground">Ordens agrupadas por mecânico</p>
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
                  {ordens.map(ordem => {
                    const formatarData = (dataString: string) => {
                      if (!dataString) return "—"
                      try {
                        const [ano, mes, dia] = dataString.split('-')
                        if (ano && mes && dia) {
                          return `${dia}/${mes}/${ano}`
                        }
                        return dataString
                      } catch {
                        return dataString
                      }
                    }

                    return (
                      <Card key={ordem.id} className="border border-primary/20 shadow-sm max-w-full">
                        <CardContent className="p-2">
                          <div className="flex flex-col gap-1.5 mb-1.5">
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <span className="font-bold text-sm truncate">{ordem.numero}</span>
                              <div className="flex gap-0.5 flex-shrink-0">
                                <StatusBadge status={ordem.status} isMobile={true} />
                                <PrioridadeBadge prioridade={ordem.prioridade} isMobile={true} />
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{ordem.veiculoInfo}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatarData(ordem.data)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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
    <div className="space-y-6">
      {sortedMecanicos.length === 0 ? (
        <div className="text-center p-10 bg-muted/50 rounded-lg">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Nenhuma ordem de serviço em andamento</h2>
          <p className="text-xl text-muted-foreground mt-2">Todas as ordens foram finalizadas</p>
        </div>
      ) : (
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${sortedMecanicos.length}, 1fr)`
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
              <div key={mecanicoId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border p-3 flex flex-col min-h-[500px] min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg truncate" title={nomeMecanico}>{nomeMecanico}</span>
                  <span className="ml-auto bg-primary text-white rounded-full px-2 py-0.5 text-xs">
                    {ordens.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                  {ordens.map(ordem => (
                    <div key={ordem.id} className="border rounded bg-primary/5 hover:bg-primary/10 transition flex flex-col gap-0.5 px-2 py-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{ordem.numero}</span>
                        <StatusBadge status={ordem.status} />
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{ordem.veiculoInfo}</div>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span className="font-medium">{(() => { const d = ordem.data?.split('-'); return d ? `${d[2]}/${d[1]}/${d[0]}` : ordem.data })()}</span>
                        <PrioridadeBadge prioridade={ordem.prioridade} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 