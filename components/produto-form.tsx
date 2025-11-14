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
import { Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  addProdutoSupabase,
  updateProdutoSupabase,
  getProdutoByIdSupabase,
  getCategoriasSupabase,
  getUnidadesSupabase,
  getLocalizacoesSupabase,
  addCategoriaSupabase,
  addUnidadeSupabase,
  addLocalizacaoSupabase,
  deleteCategoriaSupabase,
  deleteUnidadeSupabase,
  deleteLocalizacaoSupabase,
  updateCategoriaSupabase,
  updateUnidadeSupabase,
  updateLocalizacaoSupabase,
  type Categoria,
  type Unidade,
  type Localizacao,
} from "@/services/produto-service"
import { atualizarNomesProdutosEntradasSupabase } from "@/services/entrada-service"
import { atualizarNomesProdutosSaidasSupabase } from "@/services/saida-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteConfirmation } from "@/components/delete-confirmation"

// Definição do esquema de validação para o produto
const produtoFormSchema = z.object({
  descricao: z.string().min(3, { message: "Descrição deve ter pelo menos 3 caracteres" }),
  categoria: z.string().min(1, { message: "Categoria é obrigatória" }),
  unidade: z.string().min(1, { message: "Unidade é obrigatória" }),
  localizacao: z.string().min(1, { message: "Localização é obrigatória" }),
})

// Esquema para o formulário de categoria
const categoriaFormSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
})

// Esquema para o formulário de unidade
const unidadeFormSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  sigla: z
    .string()
    .min(1, { message: "Sigla é obrigatória" })
    .max(5, { message: "Sigla deve ter no máximo 5 caracteres" }),
})

// Esquema para o formulário de localização
const localizacaoFormSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  setor: z.string().min(2, { message: "Setor deve ter pelo menos 2 caracteres" }),
})

type ProdutoFormValues = z.infer<typeof produtoFormSchema>
type CategoriaFormValues = z.infer<typeof categoriaFormSchema>
type UnidadeFormValues = z.infer<typeof unidadeFormSchema>
type LocalizacaoFormValues = z.infer<typeof localizacaoFormSchema>

interface ProdutoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  onSuccess?: () => void
}

export function ProdutoForm({ open, onOpenChange, editingId, onSuccess }: ProdutoFormProps) {
  const [activeTab, setActiveTab] = useState("informacoes")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([])

  // Estados para confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"categoria" | "unidade" | "localizacao" | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Estados para edição
  const [editingCategoriaId, setEditingCategoriaId] = useState<string | null>(null)
  const [editingUnidadeId, setEditingUnidadeId] = useState<string | null>(null)
  const [editingLocalizacaoId, setEditingLocalizacaoId] = useState<string | null>(null)

  const { toast } = useToast()

  // Formulário principal de produto
  const produtoForm = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoFormSchema),
    defaultValues: {
      descricao: "",
      categoria: "",
      unidade: "",
      localizacao: "",
    },
  })

  // Formulário para adicionar categoria
  const categoriaForm = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues: {
      nome: "",
    },
  })

  // Formulário para adicionar unidade
  const unidadeForm = useForm<UnidadeFormValues>({
    resolver: zodResolver(unidadeFormSchema),
    defaultValues: {
      nome: "",
      sigla: "",
    },
  })

  // Formulário para adicionar localização
  const localizacaoForm = useForm<LocalizacaoFormValues>({
    resolver: zodResolver(localizacaoFormSchema),
    defaultValues: {
      nome: "",
      setor: "",
    },
  })

  // Carregar dados iniciais
  useEffect(() => {
    loadCategorias()
    loadUnidades()
    loadLocalizacoes()
  }, [])

  // Carregar dados do produto quando estiver editando
  useEffect(() => {
    if (editingId && open) {
      (async () => {
        try {
          const produto = await getProdutoByIdSupabase(editingId)
          if (produto) {
            produtoForm.reset({
              descricao: produto.descricao,
              categoria: produto.categoria,
              unidade: produto.unidade,
              localizacao: produto.localizacao,
            })
          }
        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar o produto para edição.",
            variant: "destructive",
          })
        }
      })()
    } else if (!editingId && open) {
      produtoForm.reset({
        descricao: "",
        categoria: "",
        unidade: "",
        localizacao: "",
      })
    }
  }, [editingId, open, produtoForm])

  // Funções para carregar dados
  const loadCategorias = async () => {
    const data = await getCategoriasSupabase()
    setCategorias(data)
  }

  const loadUnidades = async () => {
    const data = await getUnidadesSupabase()
    setUnidades(data)
  }

  const loadLocalizacoes = async () => {
    const data = await getLocalizacoesSupabase()
    setLocalizacoes(data)
  }

  // Função para lidar com o envio do formulário de produto
  const onSubmitProduto = async (values: ProdutoFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingId) {
        // Atualizar produto existente no Supabase
        const updated = await updateProdutoSupabase(editingId, values)
        if (updated) {
          // Atualizar automaticamente os nomes nas entradas e saídas
          try {
            const [entradasAtualizadas, saidasAtualizadas] = await Promise.all([
              atualizarNomesProdutosEntradasSupabase(),
              atualizarNomesProdutosSaidasSupabase(),
            ])
            
            toast({
              title: "Produto atualizado",
              description: `${values.descricao} foi atualizado com sucesso. ${entradasAtualizadas + saidasAtualizadas > 0 ? `Registros atualizados: ${entradasAtualizadas} entrada(s) e ${saidasAtualizadas} saída(s).` : ''}`,
            })
          } catch (updateError) {
            // Se houver erro na atualização dos nomes, ainda mostra sucesso na atualização do produto
            console.error("Erro ao atualizar nomes nas entradas/saídas:", updateError)
            toast({
              title: "Produto atualizado",
              description: `${values.descricao} foi atualizado com sucesso.`,
            })
          }
        }
      } else {
        // Adicionar novo produto no Supabase
        const added = await addProdutoSupabase({
          ...values,
          produtosSimilares: [],
          veiculosCompativeis: [],
        })
        if (added) {
          toast({
            title: "Produto adicionado",
            description: `${values.descricao} foi adicionado com sucesso.`,
          })
        }
      }
      onOpenChange(false)
      produtoForm.reset()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Erro ao enviar formulário:", error, JSON.stringify(error));
      toast({
        title: "Erro",
        description:
          error && typeof error === "object"
            ? JSON.stringify(error)
            : String(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função para adicionar nova categoria
  const onSubmitCategoria = async (values: CategoriaFormValues) => {
    try {
      if (editingCategoriaId) {
        // Atualizar categoria existente
        const updated = await updateCategoriaSupabase(editingCategoriaId, values.nome)
        if (updated) {
          toast({
            title: "Categoria atualizada",
            description: `${values.nome} foi atualizada com sucesso. Todos os produtos relacionados também foram atualizados.`,
          })
          setEditingCategoriaId(null)
          categoriaForm.reset()
          loadCategorias()
        }
      } else {
        // Adicionar nova categoria
        const added = await addCategoriaSupabase(values.nome)
        if (added) {
          toast({
            title: "Categoria adicionada",
            description: `${values.nome} foi adicionada com sucesso.`,
          })
          categoriaForm.reset()
          loadCategorias()
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a categoria.",
        variant: "destructive",
      })
    }
  }

  // Função para adicionar nova unidade
  const onSubmitUnidade = async (values: UnidadeFormValues) => {
    try {
      if (editingUnidadeId) {
        // Atualizar unidade existente
        const updated = await updateUnidadeSupabase(editingUnidadeId, values.nome, values.sigla)
        if (updated) {
          toast({
            title: "Unidade atualizada",
            description: `${values.nome} (${values.sigla}) foi atualizada com sucesso. Todos os produtos relacionados também foram atualizados.`,
          })
          setEditingUnidadeId(null)
          unidadeForm.reset()
          loadUnidades()
        }
      } else {
        // Adicionar nova unidade
        const added = await addUnidadeSupabase(values.nome, values.sigla)
        if (added) {
          toast({
            title: "Unidade adicionada",
            description: `${values.nome} (${values.sigla}) foi adicionada com sucesso.`,
          })
          unidadeForm.reset()
          loadUnidades()
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a unidade.",
        variant: "destructive",
      })
    }
  }

  // Função para adicionar nova localização
  const onSubmitLocalizacao = async (values: LocalizacaoFormValues) => {
    try {
      if (editingLocalizacaoId) {
        // Atualizar localização existente
        const updated = await updateLocalizacaoSupabase(editingLocalizacaoId, values.nome, values.setor)
        if (updated) {
          toast({
            title: "Localização atualizada",
            description: `${values.nome} foi atualizada com sucesso. Todos os produtos relacionados também foram atualizados.`,
          })
          setEditingLocalizacaoId(null)
          localizacaoForm.reset()
          loadLocalizacoes()
        }
      } else {
        // Adicionar nova localização
        const added = await addLocalizacaoSupabase(values.nome, values.setor)
        if (added) {
          toast({
            title: "Localização adicionada",
            description: `${values.nome} foi adicionada com sucesso.`,
          })
          localizacaoForm.reset()
          loadLocalizacoes()
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a localização.",
        variant: "destructive",
      })
    }
  }

  // Funções para iniciar edição
  const startEditCategoria = (categoria: Categoria) => {
    categoriaForm.reset({ nome: categoria.nome })
    setEditingCategoriaId(categoria.id)
  }

  const startEditUnidade = (unidade: Unidade) => {
    unidadeForm.reset({ nome: unidade.nome, sigla: unidade.sigla })
    setEditingUnidadeId(unidade.id)
  }

  const startEditLocalizacao = (localizacao: Localizacao) => {
    localizacaoForm.reset({ nome: localizacao.nome, setor: localizacao.setor })
    setEditingLocalizacaoId(localizacao.id)
  }

  // Funções para cancelar edição
  const cancelEditCategoria = () => {
    setEditingCategoriaId(null)
    categoriaForm.reset({ nome: "" })
  }

  const cancelEditUnidade = () => {
    setEditingUnidadeId(null)
    unidadeForm.reset({ nome: "", sigla: "" })
  }

  const cancelEditLocalizacao = () => {
    setEditingLocalizacaoId(null)
    localizacaoForm.reset({ nome: "", setor: "" })
  }

  // Função para confirmar exclusão
  const handleDelete = async () => {
    if (!deleteId || !deleteType) return

    try {
      let success = false
      let message = ""

      switch (deleteType) {
        case "categoria":
          success = await deleteCategoriaSupabase(deleteId)
          message = "Categoria excluída com sucesso."
          if (success) loadCategorias()
          break
        case "unidade":
          success = await deleteUnidadeSupabase(deleteId)
          message = "Unidade excluída com sucesso."
          if (success) loadUnidades()
          break
        case "localizacao":
          success = await deleteLocalizacaoSupabase(deleteId)
          message = "Localização excluída com sucesso."
          if (success) loadLocalizacoes()
          break
      }

      if (success) {
        toast({
          title: "Exclusão concluída",
          description: message,
        })
      } else {
        throw new Error("Não foi possível excluir o item.")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o item.",
        variant: "destructive",
      })
    }
  }

  // Função para abrir o diálogo de confirmação de exclusão
  const confirmDelete = (type: "categoria" | "unidade" | "localizacao", id: string) => {
    setDeleteType(type)
    setDeleteId(id)
    setDeleteConfirmOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isSubmitting && onOpenChange(isOpen)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Edite as informações do produto no formulário abaixo."
                : "Preencha as informações para adicionar um novo produto."}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="informacoes" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="informacoes" className="flex-1">
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger value="cadastros" className="flex-1">
                Cadastros Adicionais
              </TabsTrigger>
            </TabsList>

            {/* Aba de Informações Básicas */}
            <TabsContent value="informacoes" className="space-y-4 mt-4">
              <Form {...produtoForm}>
                <form onSubmit={produtoForm.handleSubmit(onSubmitProduto)} className="space-y-4">
                  <FormField
                    control={produtoForm.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Descrição do produto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={produtoForm.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria.id} value={categoria.nome}>
                                {categoria.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={produtoForm.control}
                    name="unidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma unidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {unidades.map((unidade) => (
                              <SelectItem key={unidade.id} value={unidade.nome}>
                                {unidade.nome} ({unidade.sigla})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={produtoForm.control}
                    name="localizacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma localização" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {localizacoes.map((localizacao) => (
                              <SelectItem key={localizacao.id} value={localizacao.nome}>
                                {localizacao.nome} - {localizacao.setor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="btn-gradient" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingId ? "Salvar Alterações" : "Cadastrar Produto"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>

            {/* Aba de Cadastros Adicionais */}
            <TabsContent value="cadastros" className="space-y-6 mt-4">
              {/* Formulário de Categoria */}
              <div className="border rounded-md p-4 bg-card shadow-sm">
                <h3 className="text-lg font-medium mb-4">
                  {editingCategoriaId ? "Editar Categoria" : "Adicionar Categoria"}
                </h3>
                <Form {...categoriaForm}>
                  <form onSubmit={categoriaForm.handleSubmit(onSubmitCategoria)} className="space-y-4">
                    <FormField
                      control={categoriaForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Categoria</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Peças Automotivas" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      {editingCategoriaId && (
                        <Button type="button" variant="outline" onClick={cancelEditCategoria} className="flex-1">
                          <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                      )}
                      <Button type="submit" className={editingCategoriaId ? "flex-1" : "w-full"}>
                        {editingCategoriaId ? (
                          <>
                            <Check className="mr-2 h-4 w-4" /> Salvar Alterações
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Categoria
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>

                <div className="mt-4 border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorias.length > 0 ? (
                        categorias.map((categoria) => (
                          <TableRow key={categoria.id}>
                            <TableCell>{categoria.nome}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                                  onClick={() => startEditCategoria(categoria)}
                                  disabled={!!editingCategoriaId}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                  onClick={() => confirmDelete("categoria", categoria.id)}
                                  disabled={!!editingCategoriaId}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            Nenhuma categoria cadastrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Formulário de Unidade */}
              <div className="border rounded-md p-4 bg-card shadow-sm">
                <h3 className="text-lg font-medium mb-4">
                  {editingUnidadeId ? "Editar Unidade" : "Adicionar Unidade"}
                </h3>
                <Form {...unidadeForm}>
                  <form onSubmit={unidadeForm.handleSubmit(onSubmitUnidade)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={unidadeForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Unidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Quilograma" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={unidadeForm.control}
                        name="sigla"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sigla</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: KG" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-2">
                      {editingUnidadeId && (
                        <Button type="button" variant="outline" onClick={cancelEditUnidade} className="flex-1">
                          <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                      )}
                      <Button type="submit" className={editingUnidadeId ? "flex-1" : "w-full"}>
                        {editingUnidadeId ? (
                          <>
                            <Check className="mr-2 h-4 w-4" /> Salvar Alterações
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Unidade
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>

                <div className="mt-4 border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Sigla</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unidades.length > 0 ? (
                        unidades.map((unidade) => (
                          <TableRow key={unidade.id}>
                            <TableCell>{unidade.nome}</TableCell>
                            <TableCell>{unidade.sigla}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                                  onClick={() => startEditUnidade(unidade)}
                                  disabled={!!editingUnidadeId}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                  onClick={() => confirmDelete("unidade", unidade.id)}
                                  disabled={!!editingUnidadeId}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            Nenhuma unidade cadastrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Formulário de Localização */}
              <div className="border rounded-md p-4 bg-card shadow-sm">
                <h3 className="text-lg font-medium mb-4">
                  {editingLocalizacaoId ? "Editar Localização" : "Adicionar Localização"}
                </h3>
                <Form {...localizacaoForm}>
                  <form onSubmit={localizacaoForm.handleSubmit(onSubmitLocalizacao)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={localizacaoForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Localização</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Almoxarifado Central" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={localizacaoForm.control}
                        name="setor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Setor</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Almoxarifado" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-2">
                      {editingLocalizacaoId && (
                        <Button type="button" variant="outline" onClick={cancelEditLocalizacao} className="flex-1">
                          <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                      )}
                      <Button type="submit" className={editingLocalizacaoId ? "flex-1" : "w-full"}>
                        {editingLocalizacaoId ? (
                          <>
                            <Check className="mr-2 h-4 w-4" /> Salvar Alterações
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Localização
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>

                <div className="mt-4 border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {localizacoes.length > 0 ? (
                        localizacoes.map((localizacao) => (
                          <TableRow key={localizacao.id}>
                            <TableCell>{localizacao.nome}</TableCell>
                            <TableCell>{localizacao.setor}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                                  onClick={() => startEditLocalizacao(localizacao)}
                                  disabled={!!editingLocalizacaoId}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                  onClick={() => confirmDelete("localizacao", localizacao.id)}
                                  disabled={!!editingLocalizacaoId}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            Nenhuma localização cadastrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title={`Excluir ${
          deleteType === "categoria" ? "categoria" : deleteType === "unidade" ? "unidade" : "localização"
        }`}
        description={`Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.`}
      />
    </>
  )
}
