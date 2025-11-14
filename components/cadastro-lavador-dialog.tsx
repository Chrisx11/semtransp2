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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Plus, Search, Users } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { 
  getLavadores, 
  createLavador, 
  updateLavador, 
  deleteLavador,
  type Lavador 
} from "@/services/cadastro-lavador-service"

// Schema de validação
const lavadorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  telefone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(15, "Telefone não deve exceder 15 caracteres")
    .refine((val) => /^[0-9()-\s]+$/.test(val), "Telefone deve conter apenas números, parênteses, traços e espaços"),
})

type LavadorFormValues = z.infer<typeof lavadorSchema>

interface CadastroLavadorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CadastroLavadorDialog({ open, onOpenChange }: CadastroLavadorDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lavadores, setLavadores] = useState<Lavador[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const isEditing = !!editingId
  const editingLavador = lavadores.find(l => l.id === editingId)

  const form = useForm<LavadorFormValues>({
    resolver: zodResolver(lavadorSchema),
    defaultValues: {
      nome: "",
      endereco: "",
      telefone: "",
    },
  })

  // Carregar lavadores
  const loadLavadores = async () => {
    setIsLoading(true)
    try {
      const data = await getLavadores()
      setLavadores(data)
    } catch (error) {
      console.error("Erro ao carregar lavadores:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os lavadores.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadLavadores()
    }
  }, [open])

  // Resetar formulário quando mudar o lavador em edição
  useEffect(() => {
    if (editingLavador) {
      form.reset({
        nome: editingLavador.nome,
        endereco: editingLavador.endereco,
        telefone: editingLavador.telefone,
      })
    } else {
      form.reset({
        nome: "",
        endereco: "",
        telefone: "",
      })
    }
  }, [editingLavador, form])

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: LavadorFormValues) => {
    setIsSubmitting(true)

    try {
      if (isEditing && editingLavador) {
        await updateLavador(editingLavador.id, values)
        toast({
          title: "Lavador atualizado",
          description: `${values.nome} foi atualizado com sucesso.`,
        })
      } else {
        await createLavador(values)
        toast({
          title: "Lavador criado",
          description: `${values.nome} foi adicionado com sucesso.`,
        })
      }
      
      await loadLavadores()
      setEditingId(null)
      form.reset()
    } catch (error) {
      console.error("Erro ao salvar lavador:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o lavador. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função para iniciar edição
  const handleEdit = (id: string) => {
    setEditingId(id)
  }

  // Função para cancelar edição
  const handleCancel = () => {
    setEditingId(null)
    form.reset()
  }

  // Função para excluir
  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      await deleteLavador(deletingId)
      toast({
        title: "Lavador excluído",
        description: "O lavador foi excluído com sucesso.",
      })
      await loadLavadores()
      if (editingId === deletingId) {
        setEditingId(null)
        form.reset()
      }
    } catch (error) {
      console.error("Erro ao excluir lavador:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lavador.",
        variant: "destructive",
      })
    } finally {
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  // Filtrar lavadores
  const filteredLavadores = lavadores.filter(lavador => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      lavador.nome.toLowerCase().includes(term) ||
      lavador.endereco.toLowerCase().includes(term) ||
      lavador.telefone.toLowerCase().includes(term)
    )
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cadastro de Lavadores
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Formulário */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">
                {isEditing ? "Editar Lavador" : "Novo Lavador"}
              </h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do lavador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço *</FormLabel>
                          <FormControl>
                            <Input placeholder="Endereço completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      <Plus className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Adicionar"}
                    </Button>
                    {isEditing && (
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </div>

            {/* Lista de lavadores */}
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar lavadores..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredLavadores.length > 0 ? (
                      filteredLavadores.map((lavador) => (
                        <TableRow key={lavador.id}>
                          <TableCell className="font-medium">{lavador.nome}</TableCell>
                          <TableCell>{lavador.endereco}</TableCell>
                          <TableCell>{lavador.telefone}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(lavador.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(lavador.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyState
                        colSpan={4}
                        title={searchTerm ? "Nenhum lavador encontrado" : "Nenhum lavador cadastrado"}
                        description={
                          searchTerm
                            ? "Tente usar termos diferentes na busca"
                            : "Adicione um novo lavador para começar"
                        }
                        icon={<Users className="h-10 w-10 text-muted-foreground/50" />}
                      />
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir lavador"
        description="Tem certeza que deseja excluir este lavador? Esta ação não pode ser desfeita."
      />
    </>
  )
}
