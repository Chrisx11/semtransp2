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
import { supabase } from "@/lib/supabase"

// Esquema de validação do formulário
const formSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),
  solicitanteId: z.string().min(1, "Selecione um solicitante"),
  mecanicoId: z.string().min(1, "Selecione um mecânico"),
  prioridade: z.enum(["Baixa", "Média", "Alta", "Urgente"], {
    required_error: "Selecione uma prioridade",
  }),
  kmAtual: z
    .string()
    .min(1, "O campo Km Atual é obrigatório")
    .refine(
      (val) => {
        if (!val || val.trim() === "") return false
        const kmNum = Number(val)
        return !isNaN(kmNum) && kmNum > 0
      },
      {
        message: "Informe um valor válido para o Km Atual",
      }
    ),
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

  // Revalidar o campo kmAtual quando o veículo selecionado mudar
  useEffect(() => {
    if (selectedVeiculo && form.getValues("kmAtual")) {
      form.trigger("kmAtual")
    }
  }, [selectedVeiculo, form])

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


  // Função para lidar com a seleção de veículo
  const handleVeiculoSelect = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo)
    form.setValue("veiculoId", veiculo.id)
    // Limpar o campo kmAtual quando trocar de veículo para forçar nova validação
    form.setValue("kmAtual", "")
    // Revalidar após limpar
    setTimeout(() => form.trigger("kmAtual"), 0)
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

      // Validar se o Km Atual é maior ou igual ao Km Atual do veículo
      if (data.kmAtual) {
        const kmAtualNum = Number(data.kmAtual)
        // Garantir que kmAtualVeiculo seja sempre um número válido
        const kmAtualVeiculo = typeof selectedVeiculo.kmAtual === 'number' 
          ? selectedVeiculo.kmAtual 
          : (Number(selectedVeiculo.kmAtual) || 0)
        
        if (isNaN(kmAtualNum) || kmAtualNum < kmAtualVeiculo) {
          form.setError("kmAtual", {
            type: "manual",
            message: `O Km Atual deve ser igual ou maior que ${kmAtualVeiculo.toLocaleString()} km (Km atual do veículo)`,
          })
          toast({
            title: "Validação de Km Atual",
            description: `O Km Atual informado (${kmAtualNum.toLocaleString()} km) deve ser igual ou maior que o Km Atual do veículo (${kmAtualVeiculo.toLocaleString()} km)`,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
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

          // Atualizar o Km Atual do veículo usando a mesma lógica da página de troca de óleo
          if (selectedVeiculo && data.kmAtual) {
            try {
              const kmAtualNum = Number(data.kmAtual)
              // Garantir que kmAtualVeiculo seja sempre um número válido
              const kmAtualVeiculo = typeof selectedVeiculo.kmAtual === 'number' 
                ? selectedVeiculo.kmAtual 
                : (Number(selectedVeiculo.kmAtual) || 0)
              
              if (!isNaN(kmAtualNum) && kmAtualNum >= kmAtualVeiculo) {
                // Primeiro, atualizar o campo kmAtual na tabela veiculos (igual à página de troca de óleo)
                const { error: errorVeiculo } = await supabase
                  .from("veiculos")
                  .update({ 
                    kmAtual: kmAtualNum 
                  })
                  .eq("id", selectedVeiculo.id)
                
                if (errorVeiculo) {
                  console.error("Erro ao atualizar kmAtual no veículo:", errorVeiculo)
                  throw errorVeiculo
                }
                
                // Depois, inserir registro na tabela trocas_oleo (igual à página de troca de óleo)
                const { data: trocaData, error: errorTroca } = await supabase
                  .from("trocas_oleo")
                  .insert([{
                    veiculo_id: selectedVeiculo.id,
                    data_troca: new Date().toISOString(),
                    km_anterior: kmAtualVeiculo,
                    km_atual: kmAtualNum,
                    km_proxima_troca: typeof selectedVeiculo.kmProxTroca === 'number' 
                      ? selectedVeiculo.kmProxTroca 
                      : (Number(selectedVeiculo.kmProxTroca) || 0),
                    tipo_servico: "Atualização de Km",
                    observacao: `Atualização de Km através da Ordem de Serviço ${novaOrdem.numero}`,
                    user_id: user?.id || null
                  }])
                  .select()
                
                if (errorTroca) {
                  console.error("Erro ao registrar atualização de km na tabela trocas_oleo:", errorTroca)
                  throw errorTroca
                }
                
                console.log("Km atualizado com sucesso na tabela trocas_oleo:", trocaData)
                
                // Disparar eventos para notificar outras páginas da atualização
                window.dispatchEvent(new CustomEvent('veiculo-atualizado', { 
                  detail: { veiculoId: selectedVeiculo.id, kmAtual: kmAtualNum } 
                }))
                
                // Usar localStorage para notificar outras abas
                const updateData = {
                  veiculoId: selectedVeiculo.id,
                  kmAtual: kmAtualNum,
                  timestamp: Date.now()
                }
                
                localStorage.setItem('veiculo-km-atualizado', JSON.stringify(updateData))
                localStorage.setItem('last-veiculo-update', Date.now().toString())
                
                // Remover após um delay para disparar evento storage em outras abas
                setTimeout(() => {
                  localStorage.removeItem('veiculo-km-atualizado')
                }, 100)
                
                console.log(`Km Atual do veículo ${selectedVeiculo.placa} atualizado para ${kmAtualNum} através da ordem de serviço`)
              }
            } catch (kmError) {
              console.error("Erro ao atualizar Km Atual do veículo:", kmError)
              // Não falhar a criação da ordem se houver erro ao atualizar o km
              toast({
                title: "Aviso",
                description: "Ordem criada com sucesso, mas houve um erro ao atualizar o Km Atual do veículo.",
                variant: "default",
              })
            }
          }

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
                render={({ field }) => {
                  // Garantir que kmAtual seja sempre um número válido
                  const kmAtualVeiculo = selectedVeiculo 
                    ? (typeof selectedVeiculo.kmAtual === 'number' 
                        ? selectedVeiculo.kmAtual 
                        : Number(selectedVeiculo.kmAtual) || 0)
                    : 0
                  
                  return (
                    <FormItem>
                      <FormLabel>Km Atual *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder={
                            selectedVeiculo 
                              ? `Informe o Km atual (mínimo: ${kmAtualVeiculo.toLocaleString()} km)`
                              : "Selecione um veículo primeiro"
                          }
                          {...field}
                          disabled={!selectedVeiculo}
                          min={selectedVeiculo ? kmAtualVeiculo : undefined}
                        />
                      </FormControl>
                      {selectedVeiculo && (
                        <p className="text-xs text-muted-foreground">
                          Km atual do veículo: {kmAtualVeiculo.toLocaleString()} km
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
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
