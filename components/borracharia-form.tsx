"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createServicoBorracharia, updateServicoBorracharia, type ServicoBorracharia } from "@/services/borracharia-service"
import { getFornecedores, type Fornecedor } from "@/services/fornecedor-service"
import { getVeiculos, getVeiculosSupabase, type Veiculo } from "@/services/veiculo-service"
import { getColaboradores, type Colaborador } from "@/services/colaborador-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Car, User } from "lucide-react"

// Schema de validação
const borrachariaSchema = z.object({
  veiculo: z.object({
    placa: z.string().min(7, "Placa deve ter pelo menos 7 caracteres"),
    modelo: z.string().min(2, "Modelo deve ter pelo menos 2 caracteres"),
    marca: z.string().min(2, "Marca deve ter pelo menos 2 caracteres"),
    secretaria: z.string().min(2, "Secretaria deve ter pelo menos 2 caracteres"),
  }),
  fornecedorId: z.string().min(1, "Selecione um fornecedor"),
  solicitanteId: z.string().min(1, "Informe o solicitante"),
  solicitanteNome: z.string().optional(),
  servico: z.string().min(3, "Serviço deve ter pelo menos 3 caracteres"),
  quantidade: z.coerce.number().int().positive("Quantidade deve ser um número positivo"),
})

type BorrachariaFormValues = z.infer<typeof borrachariaSchema>

interface BorrachariaFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  servicoBorracharia: ServicoBorracharia | null
}

export function BorrachariaForm({ isOpen, onClose, onSubmit, servicoBorracharia }: BorrachariaFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [isVeiculoSelectorOpen, setIsVeiculoSelectorOpen] = useState(false)
  const [isColaboradorSelectorOpen, setIsColaboradorSelectorOpen] = useState(false)
  const [searchTermVeiculo, setSearchTermVeiculo] = useState("")
  const [searchTermColaborador, setSearchTermColaborador] = useState("")
  const [isLoadingVeiculos, setIsLoadingVeiculos] = useState(false)
  const [isLoadingColaboradores, setIsLoadingColaboradores] = useState(false)
  const isEditing = !!servicoBorracharia

  // Inicializar o formulário
  const form = useForm<BorrachariaFormValues>({
    resolver: zodResolver(borrachariaSchema),
    defaultValues: {
      veiculo: {
        placa: servicoBorracharia?.veiculo.placa || "",
        modelo: servicoBorracharia?.veiculo.modelo || "",
        marca: servicoBorracharia?.veiculo.marca || "",
        secretaria: servicoBorracharia?.veiculo.secretaria || "",
      },
      fornecedorId: servicoBorracharia?.fornecedorId || "",
      solicitanteId: servicoBorracharia?.solicitanteId || "",
      solicitanteNome: "",
      servico: servicoBorracharia?.servico || "",
      quantidade: servicoBorracharia?.quantidade || 1,
    },
  })

  // Carregar fornecedores
  useEffect(() => {
    async function loadFornecedores() {
      try {
        const data = await getFornecedores()
        setFornecedores(data)
      } catch (error) {
        console.error("Erro ao carregar fornecedores:", error)
      }
    }

    if (isOpen) {
      loadFornecedores()
    }
  }, [isOpen])

  // Carregar veículos
  useEffect(() => {
    async function loadVeiculos() {
      try {
        setIsLoadingVeiculos(true);
        // Tentar carregar do Supabase primeiro
        try {
          const veiculosData = await getVeiculosSupabase();
          if (veiculosData && veiculosData.length > 0) {
            setVeiculos(veiculosData);
            return;
          }
        } catch (error) {
          console.log("Erro ao carregar do Supabase, tentando localStorage:", error);
        }
        
        // Se falhar ou não retornar dados, usar localStorage
        const localVeiculos = getVeiculos();
        setVeiculos(localVeiculos);
      } catch (error) {
        console.error("Erro ao carregar veículos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de veículos.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingVeiculos(false);
      }
    }

    if (isVeiculoSelectorOpen) {
      loadVeiculos();
    }
  }, [isVeiculoSelectorOpen, toast]);

  // Carregar colaboradores
  useEffect(() => {
    async function loadColaboradores() {
      try {
        setIsLoadingColaboradores(true);
        const data = await getColaboradores();
        setColaboradores(data);
      } catch (error) {
        console.error("Erro ao carregar colaboradores:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de colaboradores.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingColaboradores(false);
      }
    }

    if (isColaboradorSelectorOpen) {
      loadColaboradores();
    }
  }, [isColaboradorSelectorOpen, toast]);

  // Resetar o formulário quando o serviço mudar
  useEffect(() => {
    if (isOpen) {
      form.reset({
        veiculo: {
          placa: servicoBorracharia?.veiculo.placa || "",
          modelo: servicoBorracharia?.veiculo.modelo || "",
          marca: servicoBorracharia?.veiculo.marca || "",
          secretaria: servicoBorracharia?.veiculo.secretaria || "",
        },
        fornecedorId: servicoBorracharia?.fornecedorId || "",
        solicitanteId: servicoBorracharia?.solicitanteId || "",
        solicitanteNome: "",
        servico: servicoBorracharia?.servico || "",
        quantidade: servicoBorracharia?.quantidade || 1,
      })
    }
  }, [isOpen, servicoBorracharia, form])

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: BorrachariaFormValues) => {
    setIsSubmitting(true)

    try {
      // Remover o campo solicitanteNome antes de enviar
      const { solicitanteNome, ...dataToSubmit } = values;
      
      if (isEditing && servicoBorracharia) {
        // Atualizar serviço existente
        const updated = await updateServicoBorracharia(servicoBorracharia.id, dataToSubmit)
        if (updated) {
          toast({
            title: "Serviço atualizado",
            description: `Serviço de borracharia para ${values.veiculo.placa} foi atualizado com sucesso.`,
          })
          onSubmit()
          onClose()
        } else {
          throw new Error("Falha ao atualizar serviço")
        }
      } else {
        // Criar novo serviço
        const created = await createServicoBorracharia(dataToSubmit)
        if (created) {
          toast({
            title: "Serviço criado",
            description: `Serviço de borracharia para ${values.veiculo.placa} foi adicionado com sucesso.`,
          })
          onSubmit()
          onClose()
        } else {
          throw new Error("Falha ao criar serviço")
        }
      }
    } catch (error) {
      console.error("Erro ao salvar serviço de borracharia:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o serviço de borracharia. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função para selecionar um veículo
  const selectVeiculo = (veiculo: Veiculo) => {
    form.setValue("veiculo.placa", veiculo.placa)
    form.setValue("veiculo.modelo", veiculo.modelo)
    form.setValue("veiculo.marca", veiculo.marca)
    form.setValue("veiculo.secretaria", veiculo.secretaria)
    setIsVeiculoSelectorOpen(false)
  }

  // Função para selecionar um colaborador
  const selectColaborador = (colaborador: Colaborador) => {
    form.setValue("solicitanteId", colaborador.id)
    form.setValue("solicitanteNome", colaborador.nome)
    setIsColaboradorSelectorOpen(false)
  }

  // Filtrar veículos com base na pesquisa
  const filteredVeiculos = veiculos.filter(veiculo => {
    if (!searchTermVeiculo) return true;
    
    const term = searchTermVeiculo.toLowerCase();
    return (
      veiculo.placa.toLowerCase().includes(term) ||
      veiculo.modelo.toLowerCase().includes(term) ||
      veiculo.marca.toLowerCase().includes(term) ||
      veiculo.secretaria.toLowerCase().includes(term)
    );
  });

  // Filtrar colaboradores com base na pesquisa
  const filteredColaboradores = colaboradores.filter(colaborador => {
    if (!searchTermColaborador) return true;
    
    const term = searchTermColaborador.toLowerCase();
    return (
      colaborador.nome.toLowerCase().includes(term) ||
      colaborador.funcao.toLowerCase().includes(term) ||
      colaborador.secretaria.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Serviço" : "Novo Serviço de Borracharia"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Dados do Veículo</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="veiculo.placa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="ABC1234" 
                              {...field} 
                              onClick={() => setIsVeiculoSelectorOpen(true)}
                              readOnly
                              className="cursor-pointer"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              onClick={() => setIsVeiculoSelectorOpen(true)}
                            >
                              <Car className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="veiculo.modelo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Modelo do veículo" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="veiculo.marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Marca do veículo" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="veiculo.secretaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secretaria</FormLabel>
                        <FormControl>
                          <Input placeholder="Secretaria responsável" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="fornecedorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fornecedores.length > 0 ? (
                          fornecedores.map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nome}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="sem-fornecedores" disabled>
                            Nenhum fornecedor cadastrado
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
                        <Input 
                          placeholder="Selecione um solicitante" 
                          value={form.watch("solicitanteNome") || ""}
                          onClick={() => setIsColaboradorSelectorOpen(true)}
                          readOnly
                          className="cursor-pointer"
                        />
                        <input type="hidden" {...field} />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setIsColaboradorSelectorOpen(true)}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição do serviço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Salvando...
                    </>
                  ) : isEditing ? (
                    "Atualizar"
                  ) : (
                    "Criar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de seleção de veículos */}
      <Dialog open={isVeiculoSelectorOpen} onOpenChange={setIsVeiculoSelectorOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Veículo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar veículos por placa, modelo, marca ou secretaria..."
                className="pl-8 w-full"
                value={searchTermVeiculo}
                onChange={(e) => setSearchTermVeiculo(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md overflow-hidden flex-1 h-[300px]">
              <div className="overflow-auto h-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Secretaria</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingVeiculos ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                            <p className="text-sm text-muted-foreground">Carregando veículos...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredVeiculos.length > 0 ? (
                      filteredVeiculos.map((veiculo) => (
                        <TableRow key={veiculo.id}>
                          <TableCell className="font-medium">{veiculo.placa}</TableCell>
                          <TableCell>{veiculo.modelo}</TableCell>
                          <TableCell>{veiculo.marca}</TableCell>
                          <TableCell>{veiculo.secretaria}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => selectVeiculo(veiculo)}
                            >
                              Selecionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {searchTermVeiculo ? (
                            <div className="text-muted-foreground">
                              Nenhum veículo encontrado com os termos da busca.
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              Nenhum veículo cadastrado.
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsVeiculoSelectorOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de seleção de colaboradores */}
      <Dialog open={isColaboradorSelectorOpen} onOpenChange={setIsColaboradorSelectorOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Colaborador</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar colaboradores por nome, função ou secretaria..."
                className="pl-8 w-full"
                value={searchTermColaborador}
                onChange={(e) => setSearchTermColaborador(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md overflow-hidden flex-1 h-[300px]">
              <div className="overflow-auto h-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Secretaria</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingColaboradores ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                            <p className="text-sm text-muted-foreground">Carregando colaboradores...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredColaboradores.length > 0 ? (
                      filteredColaboradores.map((colaborador) => (
                        <TableRow key={colaborador.id}>
                          <TableCell className="font-medium">{colaborador.nome}</TableCell>
                          <TableCell>{colaborador.funcao}</TableCell>
                          <TableCell>{colaborador.secretaria}</TableCell>
                          <TableCell>{colaborador.telefone}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => selectColaborador(colaborador)}
                            >
                              Selecionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {searchTermColaborador ? (
                            <div className="text-muted-foreground">
                              Nenhum colaborador encontrado com os termos da busca.
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              Nenhum colaborador cadastrado.
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsColaboradorSelectorOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 