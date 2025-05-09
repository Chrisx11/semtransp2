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
import { createFornecedor, updateFornecedor, type Fornecedor } from "@/services/fornecedor-service"

// Schema de validação
const fornecedorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  telefone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(15, "Telefone não deve exceder 15 caracteres")
    .refine((val) => /^[0-9()-\s]+$/.test(val), "Telefone deve conter apenas números, parênteses, traços e espaços"),
})

type FornecedorFormValues = z.infer<typeof fornecedorSchema>

interface FornecedorFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  fornecedor: Fornecedor | null
}

export function FornecedorForm({ isOpen, onClose, onSubmit, fornecedor }: FornecedorFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!fornecedor

  // Inicializar o formulário
  const form = useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: fornecedor?.nome || "",
      endereco: fornecedor?.endereco || "",
      telefone: fornecedor?.telefone || "",
    },
  })

  // Resetar o formulário quando o fornecedor mudar
  useEffect(() => {
    if (isOpen) {
      form.reset({
        nome: fornecedor?.nome || "",
        endereco: fornecedor?.endereco || "",
        telefone: fornecedor?.telefone || "",
      })
    }
  }, [isOpen, fornecedor, form])

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: FornecedorFormValues) => {
    setIsSubmitting(true)

    try {
      if (isEditing && fornecedor) {
        // Atualizar fornecedor existente
        const updated = await updateFornecedor(fornecedor.id, values)
        if (updated) {
          toast({
            title: "Fornecedor atualizado",
            description: `${values.nome} foi atualizado com sucesso.`,
          })
          onSubmit()
          onClose()
        } else {
          throw new Error("Falha ao atualizar fornecedor")
        }
      } else {
        // Criar novo fornecedor
        const created = await createFornecedor(values)
        if (created) {
          toast({
            title: "Fornecedor criado",
            description: `${values.nome} foi adicionado com sucesso.`,
          })
          onSubmit()
          onClose()
        } else {
          throw new Error("Falha ao criar fornecedor")
        }
      }
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o fornecedor. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do fornecedor" {...field} />
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
                  <FormLabel>Endereço</FormLabel>
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
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
  )
} 