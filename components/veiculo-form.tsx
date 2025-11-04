// Atualização simples para commit e deploy - 23/10/2025
"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Package, Search } from "lucide-react"
import { addVeiculoSupabase, updateVeiculoSupabase, getVeiculoByIdSupabase } from "@/services/veiculo-service"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { getProdutosCompativeisComVeiculoSupabase } from "@/services/produto-service"

// Definição do esquema de validação
const formSchema = z.object({
  placa: z.string().min(7, { message: "Placa deve ter pelo menos 7 caracteres" }),
  modelo: z.string().min(2, { message: "Modelo deve ter pelo menos 2 caracteres" }),
  marca: z.string().min(2, { message: "Marca deve ter pelo menos 2 caracteres" }),
  ano: z.coerce
    .number()
    .min(1900, { message: "Ano deve ser maior que 1900" })
    .max(new Date().getFullYear() + 1),
  cor: z.string().min(3, { message: "Cor deve ter pelo menos 3 caracteres" }),
  tipo: z.string().min(2, { message: "Tipo deve ter pelo menos 2 caracteres" }),
  chassi: z.string().min(17, { message: "Chassi deve ter pelo menos 17 caracteres" }),
  renavam: z.string().min(9, { message: "Renavam deve ter pelo menos 9 caracteres" }),
  combustivel: z.string().min(3, { message: "Combustível deve ter pelo menos 3 caracteres" }),
  medicao: z.enum(["Horimetro", "Hodometro"]),
  periodoTrocaOleo: z.coerce.number().min(1, { message: "Período deve ser maior que 0" }),
  status: z.enum(["Ativo", "Inativo"]),
  secretaria: z.string().min(2, { message: "Secretaria deve ter pelo menos 2 caracteres" }),
})

type FormValues = z.infer<typeof formSchema>

interface VeiculoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  onSuccess?: () => void
  isViewing?: boolean
}

export function VeiculoForm({ open, onOpenChange, editingId, onSuccess, isViewing = false }: VeiculoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("informacoes")
  const [produtosCompativeis, setProdutosCompativeis] = useState<any[]>([])
  const [produtosCarregados, setProdutosCarregados] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [produtosFiltrados, setProdutosFiltrados] = useState<any[]>([])
  const { toast } = useToast()

  // Estado para visualização
  const [veiculoVisualizado, setVeiculoVisualizado] = useState<null | any>(null)
  const [loadingVisualizacao, setLoadingVisualizacao] = useState(false)

  // Inicializar o formulário com react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      placa: "",
      modelo: "",
      marca: "",
      ano: new Date().getFullYear(),
      cor: "",
      tipo: "",
      chassi: "",
      renavam: "",
      combustivel: "",
      medicao: "Hodometro",
      periodoTrocaOleo: 0,
      status: "Ativo",
      secretaria: "",
    },
  })

  // Observar mudanças no tipo de medição para atualizar o placeholder
  const medicaoValue = form.watch("medicao")

  // Carregar dados do veículo quando estiver editando ou visualizando
  useEffect(() => {
    if (editingId && open) {
      // Buscar do Supabase
      getVeiculoByIdSupabase(editingId).then((veiculo) => {
        if (veiculo) {
          console.log("Veículo carregado:", veiculo);
          form.reset({
            placa: veiculo.placa,
            modelo: veiculo.modelo,
            marca: veiculo.marca,
            ano: veiculo.ano,
            cor: veiculo.cor,
            tipo: veiculo.tipo,
            chassi: veiculo.chassi,
            renavam: veiculo.renavam,
            combustivel: veiculo.combustivel,
            medicao: veiculo.medicao,
            periodoTrocaOleo: veiculo.periodotrocaoleo || veiculo.periodoTrocaOleo || 0,
            status: veiculo.status,
            secretaria: veiculo.secretaria,
          })
        }
      })
    } else if (!editingId && open) {
      form.reset({
        placa: "",
        modelo: "",
        marca: "",
        ano: new Date().getFullYear(),
        cor: "",
        tipo: "",
        chassi: "",
        renavam: "",
        combustivel: "",
        medicao: "Hodometro",
        periodoTrocaOleo: 0,
        status: "Ativo",
        secretaria: "",
      })
    }
  }, [editingId, open, form])

  // Buscar veículo do Supabase ao visualizar
  useEffect(() => {
    if (isViewing && editingId && open) {
      setLoadingVisualizacao(true)
      getVeiculoByIdSupabase(editingId)
        .then((veiculo) => setVeiculoVisualizado(veiculo))
        .finally(() => setLoadingVisualizacao(false))
    } else if (!isViewing) {
      setVeiculoVisualizado(null)
    }
  }, [isViewing, editingId, open])

  // Função para carregar produtos compatíveis (adaptada para Supabase)
  const carregarProdutosCompativeis = async () => {
    setProdutosCarregados(false)
    try {
      let produtos: any[] = []
      if (editingId) {
        // Buscar produtos compatíveis do Supabase
        produtos = await getProdutosCompativeisComVeiculoSupabase(editingId)
      }
      // Agrupar por categoria e ordenar
      const produtosPorCategoria: Record<string, any[]> = {}
      produtos.forEach((produto) => {
        if (!produtosPorCategoria[produto.categoria]) {
          produtosPorCategoria[produto.categoria] = []
        }
        produtosPorCategoria[produto.categoria].push(produto)
      })
      const produtosAgrupados = Object.entries(produtosPorCategoria)
        .map(([categoria, produtos]) => ({ categoria, produtos }))
        .sort((a, b) => a.categoria.localeCompare(b.categoria))
      setProdutosCompativeis(produtosAgrupados)
      setProdutosFiltrados(produtosAgrupados)
      setProdutosCarregados(true)
    } catch (error) {
      console.error("Erro ao carregar produtos compatíveis:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos compatíveis.",
        variant: "destructive",
      })
    }
  }

  // useEffect para carregar produtos compatíveis ao abrir o modal em modo visualização
  useEffect(() => {
    if (open && isViewing && editingId) {
      carregarProdutosCompativeis()
    }
  }, [open, isViewing, editingId])

  // Filtrar produtos quando o termo de pesquisa mudar
  useEffect(() => {
    if (produtosCompativeis.length > 0) {
      if (!searchTerm.trim()) {
        setProdutosFiltrados(produtosCompativeis)
        return
      }

      const termLower = searchTerm.toLowerCase()
      const categoriasFiltradas = produtosCompativeis
        .map((grupo) => {
          // Filtrar produtos dentro de cada categoria
          const produtosFiltrados = grupo.produtos.filter((produto: any) =>
            produto.descricao.toLowerCase().includes(termLower),
          )

          // Retornar apenas categorias que têm produtos correspondentes
          if (produtosFiltrados.length > 0) {
            return {
              ...grupo,
              produtos: produtosFiltrados,
            }
          }
          return null
        })
        .filter(Boolean) // Remover categorias sem produtos correspondentes

      setProdutosFiltrados(categoriasFiltradas)
    }
  }, [searchTerm, produtosCompativeis])

  // Função para lidar com o envio do formulário
  const onSubmit = async (values: FormValues) => {
    if (isViewing) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)

    try {
      // Simular um pequeno atraso para mostrar o estado de carregamento
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (editingId) {
        // Atualizar veículo existente no Supabase
        const { periodoTrocaOleo, secretaria, ...restEdit } = values;
        const payloadEdit = {
          ...restEdit,
          periodotrocaoleo: periodoTrocaOleo,
          secretaria: secretaria.toUpperCase(),
          kmAtual: 0,
          kmProxTroca: 0,
        };
        const updated = await updateVeiculoSupabase(editingId, payloadEdit);
        if (updated) {
          toast({
            title: "Veículo atualizado",
            description: `${values.placa} foi atualizado com sucesso.`,
          })
        }
      } else {
        // Adicionar novo veículo no Supabase
        const { periodoTrocaOleo, secretaria, ...restAdd } = values;
        const payloadAdd = {
          ...restAdd,
          periodotrocaoleo: periodoTrocaOleo,
          secretaria: secretaria.toUpperCase(),
          kmAtual: 0,
          kmProxTroca: 0,
        };
        const added = await addVeiculoSupabase(payloadAdd);
        if (added) {
          toast({
            title: "Veículo adicionado",
            description: `${values.placa} foi adicionado com sucesso.`,
          })
        }
      }

      // Fechar o modal após o envio bem-sucedido
      onOpenChange(false)
      form.reset()

      // Notificar o componente pai sobre o sucesso
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar os dados.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Lista de secretarias
  const secretarias = [
    "Semgov",
    "Semplad",
    "Semfaz",
    "Semeduc",
    "Semusa",
    "Semathrab",
    "Semosp",
    "Semalp",
    "Semaev",
    "Semci",
    "Semgap",
    "Semctel",
    "Semseg",
    "Semtransp",
    "Progem",
  ]

  // Lista de tipos de veículos
  const tiposVeiculos = [
    "Carro",
    "Caminhão",
    "Ônibus",
    "Van",
    "Motocicleta",
    "Trator",
    "Máquina Pesada",
    "Ambulância",
    "Outro",
  ]

  // Lista de combustíveis
  const combustiveis = ["Gasolina", "Diesel", "Diesel S10", "Etanol", "Flex", "GNV", "Elétrico", "Híbrido"]

  // Renderização condicional baseada no modo (visualização ou edição)
  if (isViewing) {
    if (loadingVisualizacao) {
      return <div className="flex items-center justify-center p-8">Carregando...</div>
    }
    if (!veiculoVisualizado) {
      return null
    }
    const veiculo = veiculoVisualizado
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalhes do Veículo</DialogTitle>
            <DialogDescription>Informações detalhadas do veículo.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="informacoes" className="w-full flex-1 flex flex-col" onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="informacoes" className="flex-1">
                Informações
              </TabsTrigger>
              <TabsTrigger value="pecas" className="flex-1">
                Peças Compatíveis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informacoes" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{veiculo.modelo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {veiculo.marca} - {veiculo.ano}
                  </p>
                </div>
                <Badge variant={veiculo.status === "Ativo" ? "default" : "destructive"}>{veiculo.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Placa</p>
                  <p className="text-sm">{veiculo.placa}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Renavam</p>
                  <p className="text-sm">{veiculo.renavam}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Chassi</p>
                  <p className="text-sm">{veiculo.chassi}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cor</p>
                  <p className="text-sm">{veiculo.cor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tipo</p>
                  <p className="text-sm">{veiculo.tipo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Combustível</p>
                  <p className="text-sm">{veiculo.combustivel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Secretaria</p>
                  <p className="text-sm">{veiculo.secretaria}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tipo de Medição</p>
                  <p className="text-sm">{veiculo.medicao}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-sm font-medium">Período para Troca de Óleo</p>
                  <p className="text-sm">
                    {veiculo.periodoTrocaOleo || veiculo.periodotrocaoleo || 0} {veiculo.medicao === "Hodometro" ? "km" : "horas"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pecas" className="mt-4">
              {!produtosCarregados ? (
                <Card>
                  <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <CardDescription className="text-base">Carregando peças compatíveis...</CardDescription>
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-y-auto max-h-[400px] pr-2">
                  <div className="sticky top-0 z-50 bg-background pb-2 shadow-none border-none outline-none">
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Pesquisar peças compatíveis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-background border border-input shadow-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <Accordion type="multiple" className="w-full">
                    {produtosFiltrados.map((grupo) => (
                      <AccordionItem key={grupo.categoria} value={grupo.categoria}>
                        <AccordionTrigger>
                          <span className="font-medium text-sm text-muted-foreground">{grupo.categoria}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {grupo.produtos.map((produto: any) => (
                              <Card key={produto.id} className="overflow-hidden">
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium text-sm">{produto.descricao}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        Estoque: {produto.estoque} {produto.unidadeSigla}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {produto.unidadeSigla}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Modo de edição ou criação
  return (
    <Dialog open={open} onOpenChange={isViewing ? onOpenChange : (isOpen) => !isSubmitting && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
          <DialogDescription>
            {editingId
              ? "Edite as informações do veículo no formulário abaixo."
              : "Preencha as informações para adicionar um novo veículo."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC1234" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="renavam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renavam</FormLabel>
                    <FormControl>
                      <Input placeholder="00000000000" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Modelo do veículo" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Marca do veículo" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chassi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chassi</FormLabel>
                    <FormControl>
                      <Input placeholder="9BWHE21JX24060960" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={new Date().getFullYear().toString()}
                        {...field}
                        disabled={isViewing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <Input placeholder="Cor do veículo" {...field} disabled={isViewing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || undefined}
                      disabled={isViewing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposVeiculos.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="combustivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combustível</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || undefined}
                      disabled={isViewing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o combustível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {combustiveis.map((combustivel) => (
                          <SelectItem key={combustivel} value={combustivel}>
                            {combustivel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secretaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secretaria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || undefined}
                      disabled={isViewing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a secretaria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {secretarias.map((secretaria) => (
                          <SelectItem key={secretaria} value={secretaria.toUpperCase()}>
                            {secretaria.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isViewing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="medicao"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Medição</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        className="flex flex-row space-x-4"
                        disabled={isViewing}
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Hodometro" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Hodômetro (Km)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Horimetro" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Horímetro (Horas)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodoTrocaOleo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período para Troca de Óleo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={medicaoValue === "Hodometro" ? "Ex: 10000 km" : "Ex: 250 horas"}
                        {...field}
                        disabled={isViewing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-gradient" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Salvar Alterações" : "Cadastrar Veículo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
