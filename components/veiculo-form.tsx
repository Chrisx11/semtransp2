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
import { Loader2, Package, Search, Car, Gauge, Fuel, Palette, Building2, Wrench, Droplet, Hash, FileText } from "lucide-react"
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

  // Função para normalizar valor e encontrar correspondência case-insensitive
  const normalizarValor = (valor: string | null | undefined, opcoes: string[]): string => {
    if (!valor) return ""
    const valorTrim = valor.trim()
    
    // Buscar correspondência exata primeiro
    const correspondenciaExata = opcoes.find(opcao => opcao === valorTrim)
    if (correspondenciaExata) return correspondenciaExata
    
    // Buscar correspondência case-insensitive
    const correspondenciaCaseInsensitive = opcoes.find(
      opcao => opcao.toLowerCase() === valorTrim.toLowerCase()
    )
    if (correspondenciaCaseInsensitive) return correspondenciaCaseInsensitive
    
    // Se não encontrar, retornar o valor original (pode ser um valor válido que não está na lista)
    return valorTrim
  }

  // Carregar dados do veículo quando estiver editando ou visualizando
  useEffect(() => {
    if (editingId && open) {
      // Buscar do Supabase
      getVeiculoByIdSupabase(editingId).then((veiculo) => {
        if (veiculo) {
          console.log("Veículo carregado para edição:", veiculo);
          
          // Normalizar valores para garantir correspondência com as opções (case-insensitive)
          // Normalizar tipo para maiúsculo
          const tipoNormalizado = veiculo.tipo 
            ? normalizarValor(veiculo.tipo, tiposVeiculos).toUpperCase()
            : "";
          // Normalizar combustível para maiúsculo
          const combustivelNormalizado = veiculo.combustivel 
            ? normalizarValor(veiculo.combustivel, combustiveis).toUpperCase()
            : "";
          const secretariaNormalizada = veiculo.secretaria ? veiculo.secretaria.trim().toUpperCase() : "";
          
          console.log("Valores normalizados:", {
            tipoOriginal: veiculo.tipo,
            tipoNormalizado: tipoNormalizado,
            combustivelOriginal: veiculo.combustivel,
            combustivelNormalizado: combustivelNormalizado,
            secretariaOriginal: veiculo.secretaria,
            secretariaNormalizada: secretariaNormalizada
          });
          
          const valoresForm = {
            placa: veiculo.placa || "",
            modelo: veiculo.modelo || "",
            marca: veiculo.marca || "",
            ano: veiculo.ano || new Date().getFullYear(),
            cor: veiculo.cor || "",
            tipo: tipoNormalizado,
            chassi: veiculo.chassi || "",
            renavam: veiculo.renavam || "",
            combustivel: combustivelNormalizado,
            medicao: veiculo.medicao || "Hodometro",
            periodoTrocaOleo: veiculo.periodotrocaoleo || veiculo.periodoTrocaOleo || 0,
            status: veiculo.status || "Ativo",
            secretaria: secretariaNormalizada,
          };
          
          console.log("Valores do formulário:", valoresForm);
          
          form.reset(valoresForm);
        }
      }).catch((error) => {
        console.error("Erro ao carregar veículo:", error);
      });
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
        const { periodoTrocaOleo, secretaria, combustivel, tipo, ...restEdit } = values;
        const payloadEdit = {
          ...restEdit,
          tipo: tipo ? tipo.toUpperCase() : "",
          combustivel: combustivel ? combustivel.toUpperCase() : "",
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
        const { periodoTrocaOleo, secretaria, combustivel, tipo, ...restAdd } = values;
        const payloadAdd = {
          ...restAdd,
          tipo: tipo ? tipo.toUpperCase() : "",
          combustivel: combustivel ? combustivel.toUpperCase() : "",
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
    "Leonardo",
  ]

  // Renderização condicional baseada no modo (visualização ou edição)
  if (isViewing) {
    if (loadingVisualizacao) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="sr-only">Carregando informações do veículo</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Carregando informações do veículo...</p>
            </div>
          </DialogContent>
        </Dialog>
      )
    }
    if (!veiculoVisualizado) {
      return null
    }
    const veiculo = veiculoVisualizado
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[950px] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Detalhes do Veículo
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Informações completas do veículo cadastrado
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="informacoes" className="w-full flex-1 flex flex-col overflow-hidden" onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 mx-6 mt-4 mb-3">
              <TabsTrigger value="informacoes" className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="pecas" className="flex items-center gap-2 text-sm">
                <Package className="h-3.5 w-3.5" />
                Peças Compatíveis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informacoes" className="mt-0 px-6 pb-6 space-y-3">
              {/* Header Compacto do Veículo */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800">
                        <Car className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{veiculo.modelo}</h3>
                        <p className="text-sm text-muted-foreground">
                          {veiculo.marca} • {veiculo.ano}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={veiculo.status === "Ativo" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {veiculo.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {veiculo.tipo}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid Compacto com Todas as Informações */}
              <div className="grid grid-cols-3 gap-3">
                {/* Placa */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30">
                        <Hash className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Placa</p>
                    </div>
                    <p className="text-sm font-semibold ml-9">{veiculo.placa}</p>
                  </CardContent>
                </Card>

                {/* Renavam */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-green-100 dark:bg-green-900/30">
                        <FileText className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Renavam</p>
                    </div>
                    <p className="text-sm font-semibold ml-9">{veiculo.renavam}</p>
                  </CardContent>
                </Card>

                {/* Chassi */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-900/30">
                        <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Chassi</p>
                    </div>
                    <p className="text-xs font-semibold font-mono ml-9 break-all">{veiculo.chassi}</p>
                  </CardContent>
                </Card>

                {/* Cor */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-pink-100 dark:bg-pink-900/30">
                        <Palette className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Cor</p>
                    </div>
                    <p className="text-sm font-semibold ml-9">{veiculo.cor}</p>
                  </CardContent>
                </Card>

                {/* Combustível */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-orange-100 dark:bg-orange-900/30">
                        <Fuel className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Combustível</p>
                    </div>
                    <p className="text-sm font-semibold ml-9">{veiculo.combustivel}</p>
                  </CardContent>
                </Card>

                {/* Secretaria */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-indigo-100 dark:bg-indigo-900/30">
                        <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Secretaria</p>
                    </div>
                    <p className="text-sm font-semibold ml-9">{veiculo.secretaria}</p>
                  </CardContent>
                </Card>

                {/* Tipo de Medição */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-cyan-100 dark:bg-cyan-900/30">
                        <Gauge className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Medição</p>
                    </div>
                    <p className="text-sm font-semibold ml-9">{veiculo.medicao}</p>
                  </CardContent>
                </Card>

                {/* Período Troca de Óleo */}
                <Card className="col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-amber-100 dark:bg-amber-900/30">
                        <Droplet className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Período para Troca de Óleo</p>
                    </div>
                    <p className="text-base font-bold ml-9">
                      {veiculo.periodoTrocaOleo || veiculo.periodotrocaoleo || 0} 
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {veiculo.medicao === "Hodometro" ? "km" : "horas"}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pecas" className="mt-0 flex-1 overflow-hidden flex flex-col">
              {!produtosCarregados ? (
                <Card className="flex-1">
                  <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <CardDescription className="text-base font-medium">Carregando peças compatíveis...</CardDescription>
                    <p className="text-sm text-muted-foreground mt-2">Aguarde enquanto buscamos os produtos</p>
                  </CardContent>
                </Card>
              ) : produtosFiltrados.length === 0 ? (
                <Card className="flex-1">
                  <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                    <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <CardDescription className="text-base font-medium">Nenhuma peça compatível encontrada</CardDescription>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchTerm ? "Tente usar outros termos de busca" : "Este veículo não possui peças compatíveis cadastradas"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="mb-4 pb-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Pesquisar peças compatíveis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {produtosFiltrados.reduce((acc, grupo) => acc + grupo.produtos.length, 0)} peça(s) encontrada(s)
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <Accordion type="multiple" className="w-full">
                      {produtosFiltrados.map((grupo) => (
                        <AccordionItem key={grupo.categoria} value={grupo.categoria} className="border rounded-lg mb-2">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-sm">{grupo.categoria}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {grupo.produtos.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2 mt-2">
                              {grupo.produtos.map((produto: any) => (
                                <Card key={produto.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-sm mb-1">{produto.descricao}</h4>
                                        <div className="flex items-center gap-4 mt-2">
                                          <div className="flex items-center gap-1">
                                            <Package className="h-3 w-3 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">
                                              Estoque: <span className="font-semibold text-foreground">{produto.estoque}</span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-xs font-medium shrink-0">
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
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t px-6 py-4 mt-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
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
                      onValueChange={(value) => field.onChange(value.toUpperCase())}
                      value={field.value ? field.value.toUpperCase() : ""}
                      disabled={isViewing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposVeiculos.map((tipo) => {
                          const tipoUpper = tipo.toUpperCase();
                          return (
                            <SelectItem key={tipo} value={tipoUpper}>
                              {tipoUpper}
                            </SelectItem>
                          );
                        })}
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
                      onValueChange={(value) => field.onChange(value.toUpperCase())}
                      value={field.value ? field.value.toUpperCase() : ""}
                      disabled={isViewing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o combustível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {combustiveis.map((combustivel) => {
                          const combustivelUpper = combustivel.toUpperCase();
                          return (
                            <SelectItem key={combustivel} value={combustivelUpper}>
                              {combustivelUpper}
                            </SelectItem>
                          );
                        })}
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
                      value={field.value ? field.value.toUpperCase() : ""}
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
                      value={field.value || "Ativo"}
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
