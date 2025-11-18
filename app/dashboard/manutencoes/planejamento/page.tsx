"use client"

import { useState, useEffect, useCallback } from "react"
import { getOrdensAgrupadasPorMecanicoSupabase, atualizarOrdemExecucaoSupabase, alterarMecanicoOrdemSupabase } from "@/services/ordem-servico-service"
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, MouseSensor, TouchSensor, DragStartEvent, DragEndEvent, DragOverEvent, closestCorners, MeasuringStrategy } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { MecanicoCard } from "./components/mecanico-card"
import { OrdemCard } from "./components/ordem-card"
import { OrdemPlaceholder } from "./components/ordem-placeholder"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MobileBackButton } from "@/components/mobile-back-button"

// Componente Mobile View
function PlanejamentoMobileView({
  mecanicos,
  loading,
  error,
  getStatusColor,
  onRefresh,
}: {
  mecanicos: any[]
  loading: boolean
  error: string | null
  getStatusColor: (status: string) => string
  onRefresh: () => void
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center p-4">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <RefreshCw className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">Erro ao carregar dados</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Não foi possível carregar os dados do planejamento.
        </p>
        <Button onClick={onRefresh} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (mecanicos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center p-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhuma ordem encontrada</h3>
        <p className="text-muted-foreground text-sm">
          Não há ordens de serviço disponíveis para planejamento.
        </p>
      </div>
    )
  }

  // Ordenar mecânicos por número de ordens
  const mecanicosOrdenados = [...mecanicos].sort((a, b) => {
    const ordensA = a.ordens.filter((o: any) => o.status !== 'Finalizado' && o.status !== 'Concluída').length
    const ordensB = b.ordens.filter((o: any) => o.status !== 'Finalizado' && o.status !== 'Concluída').length
    return ordensB - ordensA
  })

  return (
    <div className="p-2 space-y-3 max-w-full overflow-x-hidden">
      <div className="w-[96%] pl-3 pr-0 mb-2">
        <MobileBackButton />
      </div>

      <Accordion type="single" collapsible className="w-full space-y-2">
        {mecanicosOrdenados.map((mecanico) => {
          const ordensFiltradas = mecanico.ordens.filter((ordem: any) => 
            ordem.status !== 'Finalizado' && ordem.status !== 'Concluída'
          )
          
          const ordensOrdenadas = [...ordensFiltradas].sort((a: any, b: any) => {
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
            <AccordionItem key={mecanico.id} value={mecanico.id} className="border rounded-lg px-2 bg-card max-w-full">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {mecanico.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-sm truncate">{mecanico.nome}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs px-1.5 py-0">
                    {ordensOrdenadas.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5 pt-1.5 pb-2">
                  {ordensOrdenadas.length > 0 ? (
                    ordensOrdenadas.map((ordem: any) => {
                      const placa = typeof ordem.veiculoInfo === 'string' 
                        ? ordem.veiculoInfo.split(' - ')[0] 
                        : 'Placa'
                      
                      const dataFormatada = new Date(ordem.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })

                      return (
                        <Card key={ordem.id} className="border border-primary/20 shadow-sm max-w-full">
                          <CardContent className="p-2">
                            <div className="flex items-start gap-2">
                              <div className={cn("w-1 h-full rounded-full flex-shrink-0", getStatusColor(ordem.status))} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="font-bold text-sm truncate">{placa}</span>
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">
                                      #{ordem.numero.replace('OS-', '')}
                                    </Badge>
                                  </div>
                                  {ordem.ordem_execucao && (
                                    <Badge className="bg-primary text-white text-[10px] w-4 h-4 p-0 flex items-center justify-center flex-shrink-0">
                                      {ordem.ordem_execucao}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                  {ordem.defeitosRelatados || "Sem descrição"}
                                </div>
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-xs text-muted-foreground">{dataFormatada}</span>
                                  <Badge 
                                    className={cn(
                                      "text-[10px] px-1 py-0",
                                      getStatusColor(ordem.status),
                                      "text-white"
                                    )}
                                  >
                                    {ordem.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="text-center text-muted-foreground text-xs py-4">
                      Nenhuma ordem pendente
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

export default function PlanejamentoPage() {
  const isMobile = useIsMobile()
  const [mecanicos, setMecanicos] = useState<any[]>([])
  const [mecanicoIds, setMecanicoIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOrdem, setActiveOrdem] = useState<any>(null)
  const [activeMecanico, setActiveMecanico] = useState<any>(null)
  const [activeMecanicoId, setActiveMecanicoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragType, setDragType] = useState<'ordem' | 'mecanico' | null>(null)

  // Sensores para controlar o comportamento do drag-and-drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Diminuir a distância que o mouse precisa se mover antes de iniciar o drag
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      // Diminuir o tempo que o touch precisa ser mantido
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  )

  // Função para carregar os dados
  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const mecanicosData = await getOrdensAgrupadasPorMecanicoSupabase()
      
      // Extrair IDs de mecânicos para a ordenação
      const mecanicoIdsArray = mecanicosData.map(mecanico => mecanico.id)
      setMecanicoIds(mecanicoIdsArray)
      
      // Corrigir a sequência de ordem_execucao para cada mecânico
      const mecanicosCorrigidos = mecanicosData.map(mecanico => {
        // Filtrar ordens finalizadas/concluídas como no componente MecanicoCard
        const ordensFiltradas = mecanico.ordens.filter(ordem => 
          ordem.status !== 'Finalizado' && ordem.status !== 'Concluída'
        );
        
        // Ordenar as ordens como no componente MecanicoCard
        const ordensOrdenadas = [...ordensFiltradas].sort((a, b) => {
          if (a.ordem_execucao && b.ordem_execucao) {
            return a.ordem_execucao - b.ordem_execucao;
          }
          if (a.ordem_execucao) return -1;
          if (b.ordem_execucao) return 1;
          
          const numA = parseInt(a.numero.replace(/\D/g, ''));
          const numB = parseInt(b.numero.replace(/\D/g, ''));
          return numA - numB;
        });
        
        // Aplicar sequência correta (começando em 1)
        const ordensComSequenciaCorrigida = ordensOrdenadas.map((ordem, index) => ({
          ...ordem,
          ordem_execucao: index + 1
        }));
        
        // Atualizar as ordens no banco de dados para manter consistência
        ordensComSequenciaCorrigida.forEach((ordem, index) => {
          // Se a ordem_execucao for diferente do valor calculado, atualizar no banco
          if (ordem.ordem_execucao !== ordensOrdenadas[index].ordem_execucao) {
            atualizarOrdemExecucaoSupabase(ordem.id, ordem.ordem_execucao)
              .catch(err => console.error(`Erro ao corrigir sequência da ordem ${ordem.id}:`, err));
          }
        });
        
        return {
          ...mecanico,
          ordens: ordensComSequenciaCorrigida
        };
      });
      
      setMecanicos(mecanicosCorrigidos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error("Erro ao buscar ordens de serviço:", err);
      setError(errorMessage);
      
      // Mensagem de erro mais amigável
      toast.error("Não foi possível carregar o planejamento", {
        description: "Verifique se o banco de dados está configurado corretamente e se há ordens de serviço cadastradas"
      })
      
      // Mesmo com erro, inicializamos com um array vazio
      setMecanicos([])
      setMecanicoIds([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aguardando Mecânico":
        return "bg-gray-500 hover:bg-gray-600 text-white"
      case "Nova":
      case "Aguardando OS":
        // Azul Claro (#3B82F6)
        return "bg-blue-500"
      case "Em Análise":
        // Amarelo Escuro (#D97706)
        return "bg-yellow-600"
      case "Fila de Serviço":
        // Ciano (#06B6D4)
        return "bg-cyan-500"
      case "Em Andamento":
      case "Em Serviço":
        // Verde Claro (#10B981)
        return "bg-emerald-500"
      case "Concluída":
      case "Finalizado":
        // Azul Escuro (#1D4ED8)
        return "bg-blue-700"
      case "Cancelada":
        // Vermelho (#EF4444)
        return "bg-red-500"
      case "Serviço Externo":
        // Verde Escuro (#047857)
        return "bg-green-700"
      case "Em Aprovação":
      case "Aguardando aprovação":
        // Laranja (#F97316)
        return "bg-orange-500"
      case "Aguardando Fornecedor":
      case "Ag. Fornecedor":
        // Roxo (#8B5CF6)
        return "bg-purple-500"
      case "Comprar na Rua":
        // Vermelho Claro (#EF4444)
        return "bg-red-400"
      default:
        return "bg-gray-500"
    }
  }

  // Manipulador de início de arrasto
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string
    
    // Verificar se estamos arrastando um mecânico ou uma ordem
    if (activeId.includes('_')) {
      // É uma ordem
      setDragType('ordem')
      const [mecanicoId, ordemId] = activeId.split('_')
      
      // Placeholder não é arrastável para iniciar
      if (ordemId === 'placeholder') return
      
      setActiveMecanicoId(mecanicoId)
      
      // Encontrar a ordem sendo arrastada
      const mecanico = mecanicos.find(m => m.id === mecanicoId)
      if (mecanico) {
        const ordem = mecanico.ordens.find((o: any) => o.id === ordemId)
        if (ordem) {
          setActiveOrdem(ordem)
        }
      }
    } else {
      // É um mecânico
      setDragType('mecanico')
      const mecanico = mecanicos.find(m => m.id === activeId)
      if (mecanico) {
        setActiveMecanico(mecanico)
      }
    }
  }

  // Manipulador de fim de arrasto
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveOrdem(null)
      setActiveMecanico(null)
      setActiveMecanicoId(null)
      setDragType(null)
      return
    }
    
    // Verificar se estamos arrastando um mecânico ou uma ordem
    if (dragType === 'ordem') {
      const [fromMecanicoId, ordemId] = (active.id as string).split('_')
      const [toMecanicoId, overId] = (over.id as string).split('_')
      
      // Placeholder não é arrastável para iniciar
      if (ordemId === 'placeholder') {
        setActiveOrdem(null)
        setActiveMecanicoId(null)
        setDragType(null)
        return
      }
      
      // Se mecânico de origem e destino forem diferentes, mover a ordem
      if (fromMecanicoId !== toMecanicoId) {
        try {
          console.log(`Movendo ordem entre mecânicos: De ${fromMecanicoId} para ${toMecanicoId}`);
          
          // Encontrar o mecânico de destino
          const toMecanico = mecanicos.find(m => m.id === toMecanicoId)
          if (!toMecanico) {
            throw new Error("Mecânico de destino não encontrado")
          }
          
          // Encontrar a ordem a ser movida
          const fromMecanico = mecanicos.find(m => m.id === fromMecanicoId)
          if (!fromMecanico) {
            throw new Error("Mecânico de origem não encontrado")
          }
          
          const ordemIndex = fromMecanico.ordens.findIndex((o: any) => o.id === ordemId)
          if (ordemIndex === -1) {
            throw new Error("Ordem não encontrada")
          }
          
          // Obter a ordem
          const ordem = fromMecanico.ordens[ordemIndex]
          
          // Atualizar o estado local primeiro para feedback imediato
          const novasMecanicos = [...mecanicos]
          const novoFromMecanico = {...fromMecanico, ordens: [...fromMecanico.ordens]}
          novoFromMecanico.ordens.splice(ordemIndex, 1)
          
          // Adicionar ao destino
          const novoToMecanico = {...toMecanico, ordens: [...toMecanico.ordens, {...ordem, mecanicoId: toMecanicoId, mecanicoInfo: `${toMecanico.nome} (${toMecanicoId})`}]}
          
          // Atualizar os arrays
          const fromIndex = novasMecanicos.findIndex(m => m.id === fromMecanicoId)
          const toIndex = novasMecanicos.findIndex(m => m.id === toMecanicoId)
          
          if (fromIndex !== -1) novasMecanicos[fromIndex] = novoFromMecanico
          if (toIndex !== -1) novasMecanicos[toIndex] = novoToMecanico
          
          setMecanicos(novasMecanicos)
          
          // Atualizar no Supabase
          console.log(`Enviando atualização para Supabase - ID: ${ordemId}, Novo Mecânico: ${toMecanicoId}`);
          const success = await alterarMecanicoOrdemSupabase(
            ordemId,
            toMecanicoId,
            `${toMecanico.nome} (${toMecanicoId})`
          )
          
          if (success) {
            toast.success("Ordem movida com sucesso", {
              description: `A ordem foi transferida para ${toMecanico.nome}`
            })
            
            // Recarregar dados do servidor após algum tempo para garantir consistência
            setTimeout(async () => {
              try {
                const mecanicosAtualizados = await getOrdensAgrupadasPorMecanicoSupabase();
                setMecanicos(mecanicosAtualizados);
              } catch (refreshError) {
                console.error('Erro ao atualizar dados após mover ordem:', refreshError);
              }
            }, 1000); // Atualizar após 1 segundo
          } else {
            toast.error("Falha ao mover ordem", {
              description: "Ocorreu um erro ao transferir a ordem. Tente novamente."
            })
            
            // Recarregar dados do servidor em caso de erro para restaurar estado
            carregarDados();
          }
        } catch (error) {
          console.error("Erro ao mover ordem:", error)
          toast.error("Erro ao mover ordem", {
            description: "Não foi possível mover a ordem. Tente novamente mais tarde."
          })
          
          // Recarregar dados do servidor em caso de erro para restaurar estado
          carregarDados();
        }
      } else if (ordemId !== overId) {
        // Reordenar dentro do mesmo mecânico
        try {
          console.log(`Reordenando no mesmo mecânico: ${fromMecanicoId} - De ${ordemId} para ${overId}`);
          
          const mecanicoIndex = mecanicos.findIndex(m => m.id === fromMecanicoId);
          if (mecanicoIndex === -1) {
            console.error(`Mecânico não encontrado: ${fromMecanicoId}`);
            return;
          }
          
          const mecanico = mecanicos[mecanicoIndex];
          
          // Filtrar ordens finalizadas/concluídas
          const ordensFiltradas = mecanico.ordens.filter((ordem: any) => 
            ordem.status !== 'Finalizado' && ordem.status !== 'Concluída'
          );
          
          const oldIndex = ordensFiltradas.findIndex((o: any) => o.id === ordemId);
          const newIndex = ordensFiltradas.findIndex((o: any) => o.id === overId);
          
          console.log(`Índices: oldIndex=${oldIndex}, newIndex=${newIndex}`);
          
          if (oldIndex === -1 || newIndex === -1) {
            console.error(`Índices inválidos: oldIndex=${oldIndex}, newIndex=${newIndex}`);
            return;
          }
          
          // Reordenar as ordens localmente primeiro
          const novasOrdens = arrayMove(ordensFiltradas, oldIndex, newIndex);
          
          // Garantir que as ordens tenham ordem_execucao começando em 1 e sequencial
          const ordensAtualizadas = novasOrdens.map((ordem: any, index: number) => ({
            ...ordem,
            ordem_execucao: index + 1
          }));
          
          // Atualizar todas as ordens do mecânico com a sequência normalizada
          const todasAsOrdens = [...mecanico.ordens];
          // Substituir apenas as ordens que foram reordenadas (não finalizadas/concluídas)
          ordensAtualizadas.forEach((ordem: any) => {
            const index = todasAsOrdens.findIndex((o: any) => o.id === ordem.id);
            if (index !== -1) {
              todasAsOrdens[index] = ordem;
            }
          });
          
          // Atualize o estado local imediatamente para uma resposta rápida de UI
          const novosMecanicosTemp = [...mecanicos];
          novosMecanicosTemp[mecanicoIndex] = {
            ...mecanico,
            ordens: todasAsOrdens
          };
          setMecanicos(novosMecanicosTemp);
          
          // Atualizar as ordens de execução no banco de dados
          let sucessos = 0;
          const totalOperacoes = ordensAtualizadas.length;
          
          // Usar Promise.all para executar todas as atualizações em paralelo
          const resultados = await Promise.all(ordensAtualizadas.map(async (ordem: any) => {
            try {
              console.log(`Atualizando ordem ${ordem.id} para posição ${ordem.ordem_execucao}`);
              
              const success = await atualizarOrdemExecucaoSupabase(ordem.id, ordem.ordem_execucao);
              if (success) {
                sucessos++;
                return { id: ordem.id, success: true };
              }
              return { id: ordem.id, success: false };
            } catch (error) {
              console.error(`Erro ao atualizar ordem de execução para ${ordem.id}:`, error);
              return { id: ordem.id, success: false, error };
            }
          }));
          
          console.log('Resultados das atualizações:', resultados);
          
          // Buscar as ordens atualizadas do servidor para garantir consistência
          if (sucessos > 0) {
            try {
              setTimeout(async () => {
                const mecanicosAtualizados = await getOrdensAgrupadasPorMecanicoSupabase();
                setMecanicos(mecanicosAtualizados);
              }, 1000); // Atualizar após 1 segundo
            } catch (refreshError) {
              console.error('Erro ao atualizar dados após reordenação:', refreshError);
            }
          }
          
          if (sucessos === totalOperacoes) {
            toast.success("Ordens reordenadas com sucesso", {
              description: `A sequência de ordens foi atualizada para ${mecanico.nome}`
            });
          } else if (sucessos > 0) {
            toast.success("Ordens parcialmente reordenadas", {
              description: `${sucessos} de ${totalOperacoes} ordens foram atualizadas com sucesso`
            });
          } else {
            toast.error("Falha ao reordenar ordens", {
              description: "Ocorreu um erro ao salvar a nova ordem. Tente novamente."
            });
            
            // Reverta a mudança local se nenhuma ordem foi atualizada com sucesso
            carregarDados();
          }
        } catch (error) {
          console.error("Erro ao reordenar ordens:", error);
          toast.error("Erro ao reordenar ordens", {
            description: "Não foi possível salvar a nova ordem. Tente novamente mais tarde."
          });
          
          // Recarregar os dados em caso de erro
          carregarDados();
        }
      }
    } else if (dragType === 'mecanico') {
      // Reorganizar os mecânicos
      const activeId = active.id as string;
      const overId = over.id as string;
      
      if (activeId !== overId) {
        const oldIndex = mecanicoIds.indexOf(activeId);
        const newIndex = mecanicoIds.indexOf(overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Atualizar a ordem dos IDs
          const novosMecanicoIds = arrayMove(mecanicoIds, oldIndex, newIndex);
          setMecanicoIds(novosMecanicoIds);
          
          // Reorganizar a lista de mecânicos com base na nova ordem
          const novosMecanicos = [...mecanicos].sort((a, b) => {
            const indexA = novosMecanicoIds.indexOf(a.id);
            const indexB = novosMecanicoIds.indexOf(b.id);
            return indexA - indexB;
          });
          
          setMecanicos(novosMecanicos);
          
          toast.success("Mecânicos reorganizados", {
            description: "A ordem dos mecânicos foi atualizada com sucesso."
          });
        }
      }
    }
    
    setActiveOrdem(null)
    setActiveMecanico(null)
    setActiveMecanicoId(null)
    setDragType(null)
  }

  // Manipulador de arrastar sobre
  const handleDragOver = (event: DragOverEvent) => {
    // Não precisa fazer nada especial aqui por enquanto
  }

  // Renderizar versão mobile
  if (isMobile) {
    return (
      <PlanejamentoMobileView
        mecanicos={mecanicos}
        loading={loading}
        error={error}
        getStatusColor={getStatusColor}
        onRefresh={carregarDados}
      />
    )
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <RefreshCw className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Erro ao carregar dados</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Não foi possível carregar os dados do planejamento. Verifique a conexão com o banco de dados.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted p-3 rounded-md text-left text-sm mb-6 max-w-xl overflow-auto">
              <pre>{error}</pre>
            </div>
          )}
          <Button onClick={() => carregarDados()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      ) : mecanicos.length > 0 ? (
        <Card className="shadow-md-custom">
          <CardContent className="p-6">
            <DndContext 
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              collisionDetection={closestCorners}
              measuring={{
                droppable: {
                  strategy: MeasuringStrategy.Always
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                <SortableContext items={mecanicoIds} strategy={horizontalListSortingStrategy}>
                  {[...mecanicos]
                    .sort((a, b) => b.ordens.length - a.ordens.length)
                    .map(mecanico => (
                      <MecanicoCard 
                        key={mecanico.id} 
                        mecanico={mecanico} 
                        getStatusColor={getStatusColor}
                      />
                    ))}
                </SortableContext>
              </div>
              
              {/* Overlay que segue o cursor durante o arrasto */}
              <DragOverlay>
                {activeOrdem && activeMecanicoId && dragType === 'ordem' && (
                  <div className="w-full max-w-[350px]">
                    <OrdemCard 
                      ordem={activeOrdem}
                      mecanicoId={activeMecanicoId}
                      getStatusColor={getStatusColor}
                      isDragging={true}
                    />
                  </div>
                )}
                {activeMecanico && dragType === 'mecanico' && (
                  <div className="w-full max-w-[350px] opacity-80">
                    <MecanicoCard 
                      mecanico={activeMecanico} 
                      getStatusColor={getStatusColor}
                      isDragging={true}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Loader2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">Nenhuma ordem de serviço encontrada</h3>
          <p className="text-muted-foreground max-w-md">
            Não há ordens de serviço disponíveis para planejamento. Crie novas ordens de serviço
            para visualizá-las aqui.
          </p>
        </div>
      )}
    </div>
  )
} 