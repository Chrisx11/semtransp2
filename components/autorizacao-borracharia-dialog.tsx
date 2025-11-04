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
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Car, User, FileCheck, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Veiculo } from "@/services/veiculo-service"
import type { Colaborador } from "@/services/colaborador-service"
import { SelecionarVeiculoDialog } from "@/components/selecionar-veiculo-dialog"
import { SelecionarResponsavelDialog } from "@/components/selecionar-responsavel-dialog"
import { 
  getAutorizacaoBorrachariaById, 
  createAutorizacaoBorracharia, 
  updateAutorizacaoBorracharia,
  type AutorizacaoBorracharia 
} from "@/services/autorizacao-borracharia-service"

// Schema de validação
const autorizacaoSchema = z.object({
  veiculoId: z.string().min(1, "Selecione um veículo"),
  veiculoPlaca: z.string().optional(),
  veiculoModelo: z.string().optional(),
  veiculoMarca: z.string().optional(),
  veiculoSecretaria: z.string().optional(),
  autorizadoPor: z.string().min(1, "Selecione quem autorizou"),
  autorizadoPorNome: z.string().optional(),
  solicitanteId: z.string().min(1, "Selecione o solicitante"),
  solicitanteNome: z.string().optional(),
  dataAutorizacao: z.date({
    required_error: "Data da autorização é obrigatória",
  }),
  dataPrevista: z.date({
    required_error: "Data prevista é obrigatória",
  }),
  preco: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined
      const num = typeof val === "string" ? parseFloat(val) : val
      return isNaN(num) ? undefined : num
    },
    z.number().min(0, "Preço deve ser um valor positivo ou zero").optional()
  ),
  observacoes: z.string().optional(),
})

type AutorizacaoFormValues = z.infer<typeof autorizacaoSchema>

interface AutorizacaoBorrachariaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  viewingId: string | null
  onSuccess?: () => void
}

export function AutorizacaoBorrachariaDialog({
  open,
  onOpenChange,
  editingId,
  viewingId,
  onSuccess,
}: AutorizacaoBorrachariaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [veiculoDialogOpen, setVeiculoDialogOpen] = useState(false)
  const [autorizadoPorDialogOpen, setAutorizadoPorDialogOpen] = useState(false)
  const [solicitanteDialogOpen, setSolicitanteDialogOpen] = useState(false)
  const { toast } = useToast()

  const isViewing = !!viewingId && !editingId
  const isEditing = !!editingId

  const form = useForm<AutorizacaoFormValues>({
    resolver: zodResolver(autorizacaoSchema),
    defaultValues: {
      veiculoId: "",
      veiculoPlaca: "",
      veiculoModelo: "",
      veiculoMarca: "",
      veiculoSecretaria: "",
      autorizadoPor: "",
      autorizadoPorNome: "",
      solicitanteId: "",
      solicitanteNome: "",
      dataAutorizacao: new Date(),
      dataPrevista: new Date(),
      preco: undefined,
      observacoes: "",
    },
  })

  // Carregar dados quando necessário
  useEffect(() => {
    if (open) {
      if (isEditing || isViewing) {
        loadAutorizacao()
      } else {
        form.reset({
          veiculoId: "",
          veiculoPlaca: "",
          veiculoModelo: "",
          veiculoMarca: "",
          veiculoSecretaria: "",
          autorizadoPor: "",
          autorizadoPorNome: "",
          solicitanteId: "",
          solicitanteNome: "",
          dataAutorizacao: new Date(),
          dataPrevista: new Date(),
          preco: undefined,
          observacoes: "",
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId, viewingId])

  const loadAutorizacao = async () => {
    setIsLoading(true)
    try {
      const autorizacao = await getAutorizacaoBorrachariaById(editingId || viewingId || "")
      if (autorizacao) {
        form.reset({
          veiculoId: autorizacao.veiculoId,
          veiculoPlaca: autorizacao.veiculoPlaca,
          veiculoModelo: autorizacao.veiculoModelo,
          veiculoMarca: autorizacao.veiculoMarca,
          veiculoSecretaria: autorizacao.veiculoSecretaria,
          autorizadoPor: autorizacao.autorizadoPor,
          autorizadoPorNome: autorizacao.autorizadoPorNome,
          solicitanteId: autorizacao.solicitanteId,
          solicitanteNome: autorizacao.solicitanteNome,
          dataAutorizacao: new Date(autorizacao.dataAutorizacao),
          dataPrevista: new Date(autorizacao.dataPrevista),
          preco: autorizacao.preco,
          observacoes: autorizacao.observacoes || "",
        })
      } else {
        toast({
          title: "Erro",
          description: "Autorização não encontrada.",
          variant: "destructive",
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Erro ao carregar autorização:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da autorização.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: AutorizacaoFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEditing) {
        await updateAutorizacaoBorracharia(editingId!, {
          veiculoId: data.veiculoId,
          veiculoPlaca: data.veiculoPlaca || "",
          veiculoModelo: data.veiculoModelo || "",
          veiculoMarca: data.veiculoMarca || "",
          veiculoSecretaria: data.veiculoSecretaria || "",
          autorizadoPor: data.autorizadoPor,
          autorizadoPorNome: data.autorizadoPorNome || "",
          solicitanteId: data.solicitanteId,
          solicitanteNome: data.solicitanteNome || "",
          dataAutorizacao: data.dataAutorizacao,
          dataPrevista: data.dataPrevista,
          preco: data.preco,
          observacoes: data.observacoes,
        })
        toast({
          title: "Sucesso",
          description: "Autorização atualizada com sucesso.",
        })
      } else {
        await createAutorizacaoBorracharia({
          veiculoId: data.veiculoId,
          veiculoPlaca: data.veiculoPlaca || "",
          veiculoModelo: data.veiculoModelo || "",
          veiculoMarca: data.veiculoMarca || "",
          veiculoSecretaria: data.veiculoSecretaria || "",
          autorizadoPor: data.autorizadoPor,
          autorizadoPorNome: data.autorizadoPorNome || "",
          solicitanteId: data.solicitanteId,
          solicitanteNome: data.solicitanteNome || "",
          dataAutorizacao: data.dataAutorizacao,
          dataPrevista: data.dataPrevista,
          preco: data.preco,
          observacoes: data.observacoes,
        })
        toast({
          title: "Sucesso",
          description: "Autorização criada com sucesso.",
        })
      }

      onOpenChange(false)
      form.reset()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Erro ao salvar autorização:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a autorização.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handlers para seleção
  const handleVeiculoSelect = (veiculo: Veiculo) => {
    form.setValue("veiculoId", veiculo.id)
    form.setValue("veiculoPlaca", veiculo.placa)
    form.setValue("veiculoModelo", veiculo.modelo)
    form.setValue("veiculoMarca", veiculo.marca)
    form.setValue("veiculoSecretaria", veiculo.secretaria)
    setVeiculoDialogOpen(false)
  }

  const handleAutorizadoPorSelect = (colaborador: Colaborador) => {
    form.setValue("autorizadoPor", colaborador.id)
    form.setValue("autorizadoPorNome", colaborador.nome)
    setAutorizadoPorDialogOpen(false)
  }

  const handleSolicitanteSelect = (colaborador: Colaborador) => {
    form.setValue("solicitanteId", colaborador.id)
    form.setValue("solicitanteNome", colaborador.nome)
    setSolicitanteDialogOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            {isViewing
              ? "Visualizar Autorização"
              : isEditing
              ? "Editar Autorização"
              : "Nova Autorização - Borracharia"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Veículo */}
            <FormField
              control={form.control}
              name="veiculoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Veículo *
                  </FormLabel>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => !isViewing && setVeiculoDialogOpen(true)}
                      disabled={isViewing}
                    >
                      {form.watch("veiculoPlaca") ? (
                        `${form.watch("veiculoPlaca")} - ${form.watch("veiculoMarca")} ${form.watch("veiculoModelo")}`
                      ) : (
                        "Selecione um veículo"
                      )}
                    </Button>
                  </FormControl>
                  {form.watch("veiculoSecretaria") && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Secretaria: {form.watch("veiculoSecretaria")}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Autorizado Por */}
              <FormField
                control={form.control}
                name="autorizadoPor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Autorizado Por *
                    </FormLabel>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => !isViewing && setAutorizadoPorDialogOpen(true)}
                        disabled={isViewing}
                      >
                        {form.watch("autorizadoPorNome") || "Selecione quem autorizou"}
                      </Button>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Solicitante */}
              <FormField
                control={form.control}
                name="solicitanteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Solicitante *
                    </FormLabel>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => !isViewing && setSolicitanteDialogOpen(true)}
                        disabled={isViewing}
                      >
                        {form.watch("solicitanteNome") || "Selecione o solicitante"}
                      </Button>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Autorização */}
              <FormField
                control={form.control}
                name="dataAutorizacao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Data de Autorização *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                              isViewing && "cursor-default"
                            )}
                            disabled={isViewing}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data Prevista */}
              <FormField
                control={form.control}
                name="dataPrevista"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Data Prevista *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                              isViewing && "cursor-default"
                            )}
                            disabled={isViewing}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < form.getValues("dataAutorizacao")}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preço */}
            <FormField
              control={form.control}
              name="preco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço (Opcional)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                        value={field.value === undefined || field.value === "" ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "") {
                            field.onChange(undefined)
                          } else {
                            const numValue = parseFloat(value)
                            if (!isNaN(numValue) && numValue >= 0) {
                              field.onChange(numValue)
                            }
                          }
                        }}
                        disabled={isViewing}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre a autorização..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isViewing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isViewing ? "Fechar" : "Cancelar"}
              </Button>
              {!isViewing && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar Autorização"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>

        {/* Diálogos de seleção */}
        <SelecionarVeiculoDialog
          open={veiculoDialogOpen}
          onOpenChange={setVeiculoDialogOpen}
          onSelect={handleVeiculoSelect}
        />

        <SelecionarResponsavelDialog
          open={autorizadoPorDialogOpen}
          onOpenChange={setAutorizadoPorDialogOpen}
          onSelect={handleAutorizadoPorSelect}
        />

        <SelecionarResponsavelDialog
          open={solicitanteDialogOpen}
          onOpenChange={setSolicitanteDialogOpen}
          onSelect={handleSolicitanteSelect}
        />
      </DialogContent>
    </Dialog>
  )
}

