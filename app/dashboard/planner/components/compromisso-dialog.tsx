"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Trash2 } from "lucide-react"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { type Compromisso } from "@/services/compromisso-service"

const compromissoSchema = z.object({
  titulo: z.string().min(1, { message: "Título é obrigatório" }),
  descricao: z.string().optional(),
  data: z.string().min(1, { message: "Data é obrigatória" }),
  hora: z.string().min(1, { message: "Hora é obrigatória" }),
  duracao: z.string().optional(),
  cor: z.string().optional(),
})

type CompromissoFormValues = z.infer<typeof compromissoSchema>

interface CompromissoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compromisso: Compromisso | null
  selectedDate: string
  selectedTime: string
  onSave: (compromisso: Compromisso) => void
  onDelete: (id: string) => void
}

const cores = [
  { value: "bg-blue-500", label: "Azul", hex: "#3b82f6" },
  { value: "bg-green-500", label: "Verde", hex: "#22c55e" },
  { value: "bg-red-500", label: "Vermelho", hex: "#ef4444" },
  { value: "bg-yellow-500", label: "Amarelo", hex: "#eab308" },
  { value: "bg-purple-500", label: "Roxo", hex: "#a855f7" },
  { value: "bg-pink-500", label: "Rosa", hex: "#ec4899" },
  { value: "bg-orange-500", label: "Laranja", hex: "#f97316" },
  { value: "bg-indigo-500", label: "Índigo", hex: "#6366f1" },
]

export function CompromissoDialog({
  open,
  onOpenChange,
  compromisso,
  selectedDate,
  selectedTime,
  onSave,
  onDelete,
}: CompromissoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const form = useForm<CompromissoFormValues>({
    resolver: zodResolver(compromissoSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      data: selectedDate,
      hora: selectedTime,
      duracao: "60",
      cor: cores[0].value,
    },
  })

  // Atualizar form quando selectedDate ou selectedTime mudarem
  useEffect(() => {
    if (selectedDate) {
      form.setValue("data", selectedDate)
    }
    if (selectedTime) {
      form.setValue("hora", selectedTime)
    }
  }, [selectedDate, selectedTime, form])

  // Carregar dados do compromisso quando editar
  useEffect(() => {
    if (compromisso && open) {
      // Formatar data (pode vir como YYYY-MM-DD ou ISO string)
      const dataFormatada = compromisso.data.includes("T") 
        ? compromisso.data.split("T")[0] 
        : compromisso.data
      // Formatar hora (pode vir como HH:MM:SS ou HH:MM)
      const horaFormatada = compromisso.hora.length > 5 
        ? compromisso.hora.substring(0, 5) 
        : compromisso.hora
      
      form.reset({
        titulo: compromisso.titulo,
        descricao: compromisso.descricao || "",
        data: dataFormatada,
        hora: horaFormatada,
        duracao: compromisso.duracao?.toString() || "60",
        cor: compromisso.cor || cores[0].value,
      })
    } else if (!compromisso && open) {
      form.reset({
        titulo: "",
        descricao: "",
        data: selectedDate,
        hora: selectedTime,
        duracao: "60",
        cor: cores[0].value,
      })
    }
  }, [compromisso, open, selectedDate, selectedTime, form])

  const onSubmit = async (data: CompromissoFormValues) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      // Validar dados antes de processar
      if (!data.titulo || !data.data || !data.hora) {
        throw new Error("Dados obrigatórios não preenchidos")
      }

      // Formatar data para YYYY-MM-DD
      const dataFormatada = data.data.includes("T") 
        ? data.data.split("T")[0] 
        : data.data

      const compromissoData: Compromisso = {
        id: compromisso?.id || "",
        titulo: (data.titulo || "").trim(),
        descricao: data.descricao && data.descricao.trim() !== "" ? data.descricao.trim() : null,
        data: dataFormatada,
        hora: data.hora,
        duracao: data.duracao && data.duracao.trim() !== "" ? parseInt(data.duracao, 10) : 60,
        cor: data.cor || cores[0].value,
      }
      
      onSave(compromissoData)
    } catch (error) {
      console.error("Erro ao salvar compromisso:", error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (compromisso) {
      onDelete(compromisso.id)
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    }
  }

  // Gerar opções de hora
  const horas = []
  for (let i = 7; i <= 16; i++) {
    horas.push(`${i.toString().padStart(2, "0")}:00`)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isSubmitting && onOpenChange(isOpen)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {compromisso ? "Editar Compromisso" : "Novo Compromisso"}
            </DialogTitle>
            <DialogDescription>
              {compromisso
                ? "Edite as informações do compromisso abaixo."
                : "Preencha as informações para criar um novo compromisso."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error("Erros de validação:", errors)
            })} className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do compromisso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição do compromisso (opcional)"
                        {...field}
                        value={field.value || ""}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          try {
                            field.onChange(value)
                          } catch (error) {
                            console.error("Erro ao alterar hora:", error)
                          }
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a hora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {horas.map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duracao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="60"
                        {...field}
                        value={field.value || ""}
                        min="15"
                        step="15"
                        onChange={(e) => field.onChange(e.target.value)}
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
                      <Select
                        onValueChange={(value) => {
                          try {
                            field.onChange(value)
                          } catch (error) {
                            console.error("Erro ao alterar cor:", error)
                          }
                        }}
                        value={field.value || cores[0].value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a cor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cores.map((cor) => (
                            <SelectItem key={cor.value} value={cor.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: cor.hex }}
                                />
                                <span>{cor.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {compromisso && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="mr-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {compromisso ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => {
          try {
            handleDelete()
          } catch (error) {
            console.error("Erro ao confirmar exclusão:", error)
          }
        }}
        title="Excluir Compromisso"
        description="Tem certeza que deseja excluir este compromisso? Esta ação não pode ser desfeita."
      />
    </>
  )
}

