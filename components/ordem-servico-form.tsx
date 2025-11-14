"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelecionarVeiculoDialog } from "@/components/selecionar-veiculo-dialog"
import { SelecionarResponsavelDialog } from "@/components/selecionar-responsavel-dialog"
import type { Veiculo } from "@/services/veiculo-service"
import type { Colaborador } from "@/services/colaborador-service"
import { addOrdemServicoSupabase, updateOrdemServicoSupabase, type OrdemServico } from "@/services/ordem-servico-service"
import { getVeiculoById } from "@/services/veiculo-service"
import { getColaboradorById } from "@/services/colaborador-service"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { addPending, syncPendings } from "@/utils/offline-sync"
import useOnlineStatus from "@/hooks/useOnlineStatus"

// Atualizar o esquema de validação do formulário para incluir o campo kmAtual
const formSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),
  solicitanteId: z.string().min(1, "Selecione um solicitante"),
  mecanicoId: z.string().min(1, "Selecione um mecânico"),
  prioridade: z.enum(["Baixa", "Média", "Alta", "Urgente"], {
    required_error: "Selecione uma prioridade",
  }),
  kmAtual: z.string().min(1, "Informe o Km atual do veículo"),
  status: z.string().optional(),
  defeitosRelatados: z.string().min(1, "Descreva os defeitos relatados"),
  pecasServicos: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Função para formatar a informação do veículo
const formatarInfoVeiculo = (veiculo: Veiculo) => {
  return `${veiculo.placa} - ${veiculo.modelo} (${veiculo.marca})`
}

// Função para formatar a informação do colaborador
const formatarInfoColaborador = (colaborador: Colaborador) => {
  return `${colaborador.nome} (${colaborador.funcao})`
}

// Interface para as props do componente
interface OrdemServicoFormProps {
  onSuccess: () => void
  onCancel: () => void
  ordemExistente?: OrdemServico // Nova prop para edição
}

export function OrdemServicoForm({ onSuccess, onCancel, ordemExistente }: OrdemServicoFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("informacoes")
  const isEdicao = !!ordemExistente
  const isOnline = useOnlineStatus();

  // Estados para os diálogos de seleção
  const [isVeiculoDialogOpen, setIsVeiculoDialogOpen] = useState(false)
  const [isSolicitanteDialogOpen, setIsSolicitanteDialogOpen] = useState(false)
  const [isMecanicoDialogOpen, setIsMecanicoDialogOpen] = useState(false)

  // Estados para os itens selecionados
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null)
  const [selectedSolicitante, setSelectedSolicitante] = useState<Colaborador | null>(null)
  const [selectedMecanico, setSelectedMecanico] = useState<Colaborador | null>(null)
  const [loadingVeiculo, setLoadingVeiculo] = useState(false)

  // Atualizar os valores padrão do formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculoId: ordemExistente?.veiculoId || "",
      solicitanteId: ordemExistente?.solicitanteId || "",
      mecanicoId: ordemExistente?.mecanicoId || "",
      prioridade: (ordemExistente?.prioridade as any) || "Média",
      kmAtual: ordemExistente?.kmAtual || "",
      status: ordemExistente?.status || "Aguardando Mecânico",
      defeitosRelatados: ordemExistente?.defeitosRelatados || "",
      pecasServicos: ordemExistente?.pecasServicos || "",
    },
  })

  // Carregar dados dos itens selecionados quando estiver editando
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (ordemExistente) {
          console.log("Carregando dados para edição:", ordemExistente);
  
          // Carregar veículo
          if (ordemExistente.veiculoId) {
            setLoadingVeiculo(true);
            try {
              // Primeiro tenta carregar do serviço Supabase
              const veiculo = await getVeiculoById(ordemExistente.veiculoId);
              if (veiculo) {
                console.log("Veículo carregado:", veiculo);
                setSelectedVeiculo(veiculo);
                form.setValue("veiculoId", veiculo.id);
              } else {
                console.warn("Veículo não encontrado:", ordemExistente.veiculoId);
                // Se não encontrou o veículo pelo ID, cria um objeto com as informações disponíveis
                // para evitar que o campo fique vazio
                const veiculoInfo = ordemExistente.veiculoInfo || "";
                if (veiculoInfo) {
                  const partes = veiculoInfo.split(" - ");
                  const placa = partes[0] || "";
                  let modelo = "";
                  let marca = "";
                  
                  if (partes.length > 1) {
                    const modeloMarca = partes[1].replace(/[()]/g, "").split(" ");
                    if (modeloMarca.length > 0) {
                      marca = modeloMarca.pop() || "";
                      modelo = modeloMarca.join(" ");
                    }
                  }
                  
                  const veiculoTemp = {
                    id: ordemExistente.veiculoId,
                    placa,
                    modelo,
                    marca,
                    kmAtual: parseInt(ordemExistente.kmAtual) || 0
                  } as Veiculo;
                  
                  console.log("Criado veículo a partir das informações disponíveis:", veiculoTemp);
                  setSelectedVeiculo(veiculoTemp);
                  form.setValue("veiculoId", ordemExistente.veiculoId);
                }
              }
            } catch (err) {
              console.error("Erro ao carregar veículo:", err);
            } finally {
              setLoadingVeiculo(false);
            }
          }
  
          // Carregar solicitante
          if (ordemExistente.solicitanteId) {
            try {
              const solicitante = await getColaboradorById(ordemExistente.solicitanteId);
              if (solicitante) {
                console.log("Solicitante carregado:", solicitante);
                setSelectedSolicitante(solicitante);
                form.setValue("solicitanteId", solicitante.id);
              } else if (ordemExistente.solicitanteInfo) {
                // Criar objeto temporário com informações existentes
                const solicitanteTemp = {
                  id: ordemExistente.solicitanteId,
                  nome: ordemExistente.solicitanteInfo.split("(")[0]?.trim() || "",
                  funcao: ordemExistente.solicitanteInfo.match(/\((.*?)\)/)?.[1] || ""
                } as Colaborador;
                
                setSelectedSolicitante(solicitanteTemp);
                form.setValue("solicitanteId", ordemExistente.solicitanteId);
              }
            } catch (err) {
              console.error("Erro ao carregar solicitante:", err);
            }
          }
  
          // Carregar mecânico
          if (ordemExistente.mecanicoId) {
            try {
              const mecanico = await getColaboradorById(ordemExistente.mecanicoId);
              if (mecanico) {
                console.log("Mecânico carregado:", mecanico);
                setSelectedMecanico(mecanico);
                form.setValue("mecanicoId", mecanico.id);
              } else if (ordemExistente.mecanicoInfo) {
                // Criar objeto temporário com informações existentes
                const mecanicoTemp = {
                  id: ordemExistente.mecanicoId,
                  nome: ordemExistente.mecanicoInfo.split("(")[0]?.trim() || "",
                  funcao: ordemExistente.mecanicoInfo.match(/\((.*?)\)/)?.[1] || ""
                } as Colaborador;
                
                setSelectedMecanico(mecanicoTemp);
                form.setValue("mecanicoId", ordemExistente.mecanicoId);
              }
            } catch (err) {
              console.error("Erro ao carregar mecânico:", err);
            }
          }
  
          // Preencher outros dados do formulário
          if (ordemExistente.kmAtual) {
            form.setValue("kmAtual", ordemExistente.kmAtual);
          }
          
          if (ordemExistente.prioridade) {
            form.setValue("prioridade", ordemExistente.prioridade as any);
          }
          
          if (ordemExistente.status) {
            form.setValue("status", ordemExistente.status);
          }
          
          if (ordemExistente.defeitosRelatados) {
            form.setValue("defeitosRelatados", ordemExistente.defeitosRelatados);
          }
          
          if (ordemExistente.pecasServicos) {
            form.setValue("pecasServicos", ordemExistente.pecasServicos);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados para edição:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados completos para edição",
          variant: "destructive",
        });
      }
    };
    
    fetchData();
  }, [ordemExistente, form, toast]);

  // Sincronizar pendentes ao reconectar
  useEffect(() => {
    if (isOnline) {
      syncPendings({
        ordemServico: async (payload) => await addOrdemServicoSupabase(payload),
        atualizarKm: async () => Promise.resolve(), // nada por enquanto
      }).then((ok) => {
        if (ok) {
          toast({
            title: "Pendências sincronizadas",
            description: "Todas as ordens pendentes foram enviadas!",
            variant: "success",
          });
        }
      }).catch(() => {});
    }
  }, [isOnline, toast]);

  // Função para lidar com a seleção de veículo
  const handleVeiculoSelect = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo)
    form.setValue("veiculoId", veiculo.id)
  }

  // Função para lidar com a seleção de solicitante
  const handleSolicitanteSelect = (colaborador: Colaborador) => {
    setSelectedSolicitante(colaborador)
    form.setValue("solicitanteId", colaborador.id)
  }

  // Função para lidar com a seleção de mecânico
  const handleMecanicoSelect = (colaborador: Colaborador) => {
    setSelectedMecanico(colaborador)
    form.setValue("mecanicoId", colaborador.id)
  }

  // Função para enviar o formulário
  const onSubmit = async (data: FormValues) => {
    try {
      console.log("Dados do formulário:", data)
      
      // Verificar se os campos obrigatórios foram preenchidos
      if (!selectedVeiculo || !selectedSolicitante || !selectedMecanico) {
        toast({
          title: "Campos obrigatórios",
          description: "Selecione veículo, solicitante e mecânico antes de salvar.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      if (!selectedVeiculo.id || !selectedSolicitante.id || !selectedMecanico.id) {
        toast({
          title: "Erro ao criar ordem de serviço",
          description: "Todos os campos obrigatórios devem ser preenchidos (veículo, solicitante, mecânico).",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      try {
        setIsSubmitting(true)

        // Prepara os dados para enviar
        const formData = {
          ...data,
          veiculoInfo: selectedVeiculo ? formatarInfoVeiculo(selectedVeiculo) : "",
          solicitanteInfo: selectedSolicitante ? formatarInfoColaborador(selectedSolicitante) : "",
          mecanicoInfo: selectedMecanico ? formatarInfoColaborador(selectedMecanico) : "",
          status: data.status || "Aguardando Mecânico",
          pecasServicos: data.pecasServicos || "", // Garante que nunca será undefined
        }

        // NOVO: Salvar localmente se offline
        if (!isOnline) {
          addPending({ tipo: 'ordem-servico', data: formData });
          toast({
            title: "Ordem salva offline",
            description: "A ordem foi salva no dispositivo e será enviada automaticamente quando houver conexão.",
          });
          onSuccess();
          return;
        }

        console.log("Dados processados da ordem:", formData);

        if (isEdicao && ordemExistente) {
          // Atualizar ordem existente no Supabase
          console.log("Atualizando ordem existente:", ordemExistente.id);
          const resultado = await updateOrdemServicoSupabase(
            ordemExistente.id, 
            {
              ...formData,
              status: ordemExistente.status, // Preservar o status original
              pecasServicos: formData.pecasServicos || "", // Garantir que não é undefined
            },
            undefined, // observacao
            user?.id,
            user?.nome || user?.login || "Sistema"
          );

          if (!resultado) {
            throw new Error("Erro ao atualizar a ordem de serviço")
          }

          toast({
            title: "Ordem de serviço atualizada",
            description: `A ordem de serviço ${resultado.numero} foi atualizada com sucesso`,
          });
          console.log("Ordem atualizada com sucesso:", resultado);
          onSuccess();
        } else {
          // Criar nova ordem no Supabase
          const novaOrdemPayload = {
            ...formData,
            data: new Date().toLocaleDateString("pt-BR"),
            pecasServicos: formData.pecasServicos || "", // Garantir novamente que não é undefined
          }
          console.log("Payload enviado para o Supabase:", novaOrdemPayload)
          const novaOrdem = await addOrdemServicoSupabase(
            novaOrdemPayload,
            user?.id,
            user?.nome || user?.login || "Sistema"
          )

          toast({
            title: "Ordem de serviço criada",
            description: `A ordem de serviço ${novaOrdem.numero} foi criada com sucesso`,
          });
          console.log("Nova ordem criada com sucesso:", novaOrdem);
          onSuccess();
        }
      } catch (error) {
        console.error("Erro ao salvar ordem de serviço:", error);
        toast({
          title: isEdicao ? "Erro ao atualizar ordem de serviço" : "Erro ao criar ordem de serviço",
          description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro no processamento do formulário:", error);
      toast({
        title: isEdicao ? "Erro ao atualizar ordem de serviço" : "Erro ao criar ordem de serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Verificar se todos os campos da primeira aba estão preenchidos
  const primeiraAbaCompleta = () => {
    const { veiculoId, solicitanteId, mecanicoId, prioridade, kmAtual } = form.getValues()
    return veiculoId && solicitanteId && mecanicoId && prioridade && kmAtual
  }

  // Avançar para a próxima aba
  const avancarParaProximaAba = () => {
    if (primeiraAbaCompleta()) {
      setActiveTab("detalhes")
    } else {
      // Disparar validação para mostrar erros
      form.trigger(["veiculoId", "solicitanteId", "mecanicoId", "prioridade", "kmAtual"])

      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de avançar",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="informacoes">Informações Básicas</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes Técnicos</TabsTrigger>
            </TabsList>

            {/* Aba de Informações Básicas */}
            <TabsContent value="informacoes" className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="veiculoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start font-normal"
                          onClick={() => setIsVeiculoDialogOpen(true)}
                        >
                          {loadingVeiculo
                            ? "Carregando veículo..."
                            : selectedVeiculo
                              ? formatarInfoVeiculo(selectedVeiculo)
                              : "Selecionar veículo"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="solicitanteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitante</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start font-normal"
                          onClick={() => setIsSolicitanteDialogOpen(true)}
                        >
                          {selectedSolicitante
                            ? formatarInfoColaborador(selectedSolicitante)
                            : "Selecionar solicitante"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mecanicoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mecânico</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start font-normal"
                          onClick={() => setIsMecanicoDialogOpen(true)}
                        >
                          {selectedMecanico
                            ? formatarInfoColaborador(selectedMecanico)
                            : "Selecionar mecânico"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kmAtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Km Atual</FormLabel>
                    <FormControl>
                      <Input placeholder="Informe o Km atual do veículo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end mt-6">
                <Button type="button" variant="outline" className="mr-2" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button type="button" onClick={avancarParaProximaAba}>
                  Próximo
                </Button>
              </div>
            </TabsContent>

            {/* Aba de Detalhes Técnicos */}
            <TabsContent value="detalhes" className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="defeitosRelatados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Defeitos relatados pelo condutor</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os defeitos relatados pelo condutor"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pecasServicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relação de Peças e/ou Serviços</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Liste as peças e/ou serviços necessários"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={() => setActiveTab("informacoes")}>
                  Voltar
                </Button>
                <div>
                  <Button type="button" variant="outline" className="mr-2" onClick={onCancel}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : isEdicao ? "Atualizar Ordem de Serviço" : "Salvar Ordem de Serviço"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      {/* Diálogos de seleção */}
      <SelecionarVeiculoDialog
        open={isVeiculoDialogOpen}
        onOpenChange={setIsVeiculoDialogOpen}
        onSelect={handleVeiculoSelect}
      />

      <SelecionarResponsavelDialog
        open={isSolicitanteDialogOpen}
        onOpenChange={setIsSolicitanteDialogOpen}
        onSelect={handleSolicitanteSelect}
      />

      <SelecionarResponsavelDialog
        open={isMecanicoDialogOpen}
        onOpenChange={setIsMecanicoDialogOpen}
        onSelect={handleMecanicoSelect}
        filtroFuncao="Mecânico"
      />
    </div>
  )
}
