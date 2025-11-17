"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Car, Wrench, DollarSign, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getServicoExternoById,
  updateServicoExterno,
  type ServicoExterno 
} from "@/services/servico-externo-service"

// Schema de validação
const servicoExternoSchema = z.object({
  valor: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return 0
      const num = typeof val === "string" ? parseFloat(val.replace(",", ".")) : val
      return isNaN(num) ? 0 : num
    },
    z.number().min(0, "Valor deve ser um número positivo ou zero")
  ),
  status: z.enum(["Pendente", "Em Andamento", "Concluído", "Cancelado"]),
  observacoes: z.string().optional(),
})

type ServicoExternoFormValues = z.infer<typeof servicoExternoSchema>

interface ServicoExternoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  viewingId: string | null
  onSuccess?: () => void
}

export function ServicoExternoDialog({
  open,
  onOpenChange,
  editingId,
  viewingId,
  onSuccess,
}: ServicoExternoDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [servicoExterno, setServicoExterno] = useState<ServicoExterno | null>(null)
  const { toast } = useToast()

  const isViewing = !!viewingId && !editingId
  const isEditing = !!editingId

  const form = useForm<ServicoExternoFormValues>({
    resolver: zodResolver(servicoExternoSchema),
    defaultValues: {
      valor: 0,
      status: "Pendente",
      observacoes: "",
    },
  })

  // Carregar dados quando abrir para edição ou visualização
  useEffect(() => {
    if (open && (editingId || viewingId)) {
      loadServicoExterno(editingId || viewingId || "")
    } else if (open) {
      // Resetar formulário quando abrir sem ID
      form.reset({
        valor: 0,
        status: "Pendente",
        observacoes: "",
      })
      setServicoExterno(null)
    }
  }, [open, editingId, viewingId])

  const loadServicoExterno = async (id: string) => {
    setIsLoading(true)
    try {
      const servico = await getServicoExternoById(id)
      
      if (servico) {
        setServicoExterno(servico)
        form.reset({
          valor: servico.valor || 0,
          status: servico.status,
          observacoes: servico.observacoes || "",
        })
      } else {
        toast({
          title: "Erro",
          description: "Serviço externo não encontrado.",
          variant: "destructive",
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Erro ao carregar serviço externo:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o serviço externo.",
        variant: "destructive",
      })
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: ServicoExternoFormValues) => {
    if (!editingId || !servicoExterno) return

    setIsSubmitting(true)
    try {
      await updateServicoExterno(editingId, {
        valor: values.valor,
        status: values.status,
        observacoes: values.observacoes,
      })

      toast({
        title: "Serviço externo atualizado",
        description: "O serviço externo foi atualizado com sucesso.",
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar serviço externo:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o serviço externo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewing ? "Visualizar Serviço Externo" : isEditing ? "Editar Serviço Externo" : "Serviço Externo"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : servicoExterno ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Informações da OS e Veículo (somente leitura) */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ordem de Serviço</label>
                    <div className="text-base font-semibold">{servicoExterno.ordemServicoNumero}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Autorização</label>
                    <div className="text-base">
                      {new Date(servicoExterno.dataAutorizacao).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Veículo</label>
                    <div className="text-base font-semibold">{servicoExterno.veiculoPlaca}</div>
                    <div className="text-sm text-muted-foreground">
                      {servicoExterno.veiculoMarca} {servicoExterno.veiculoModelo}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Secretaria</label>
                    <div className="text-base">{servicoExterno.veiculoSecretaria}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fornecedor</label>
                  <div className="text-base font-semibold">{servicoExterno.fornecedorNome}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Serviço Solicitado</label>
                  <div className="text-base">{servicoExterno.servicoSolicitado}</div>
                </div>
              </div>

              {/* Campos editáveis */}
              {!isViewing && (
                <>
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="0,00"
                              className="pl-10"
                              {...field}
                              value={field.value?.toFixed(2).replace(".", ",") || "0,00"}
                              onChange={(e) => {
                                const value = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "")
                                const numValue = parseFloat(value) || 0
                                field.onChange(numValue)
                              }}
                            />
                          </div>
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewing}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Adicione observações sobre o serviço externo..."
                            className="resize-none"
                            rows={4}
                            {...field}
                            disabled={isViewing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Campos somente leitura na visualização */}
              {isViewing && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor</label>
                    <div className="text-base font-semibold">
                      R$ {servicoExterno.valor.toFixed(2).replace(".", ",")}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="text-base">{servicoExterno.status}</div>
                  </div>

                  {servicoExterno.observacoes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Observações</label>
                      <div className="text-base whitespace-pre-wrap">{servicoExterno.observacoes}</div>
                    </div>
                  )}
                </>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {isViewing ? "Fechar" : "Cancelar"}
                </Button>
                {!isViewing && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum serviço externo selecionado
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

