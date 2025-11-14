"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { addEntradaSupabase, updateEntradaSupabase, getEntradaByIdSupabase } from "@/services/entrada-service"
import { SelecionarProdutoDialog } from "./selecionar-produto-dialog"
import { SelecionarResponsavelDialog } from "./selecionar-responsavel-dialog"
import { getProdutoByIdSupabase } from "@/services/produto-service"
import { getColaboradorById } from "@/services/colaborador-service"
import type { Produto } from "@/services/produto-service"
import type { Colaborador } from "@/services/colaborador-service"

const formSchema = z.object({
  produtoId: z.string().min(1, "Selecione um produto"),
  responsavelId: z.string().min(1, "Selecione um responsável"),
  quantidade: z.coerce.number().positive("A quantidade deve ser maior que zero"),
  valorUnitario: z.coerce.number().min(0.01, "O valor unitário deve ser maior que zero")
})

type FormValues = z.infer<typeof formSchema>

interface EntradaFormProps {
  onSuccess: () => void
  entradaId?: string
}

export function EntradaForm({ onSuccess, entradaId }: EntradaFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!entradaId)
  const [isProdutoDialogOpen, setIsProdutoDialogOpen] = useState(false)
  const [isResponsavelDialogOpen, setIsResponsavelDialogOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [selectedResponsavel, setSelectedResponsavel] = useState<Colaborador | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      produtoId: "",
      responsavelId: "",
      quantidade: 1,
      valorUnitario: 0
    },
  })

  // Carregar dados da entrada para edição (Supabase)
  useEffect(() => {
    if (!entradaId) return
    setIsLoading(true)
    const load = async () => {
      try {
        const entrada = await getEntradaByIdSupabase(entradaId)
        if (entrada) {
          // Carregar produto (Supabase)
          const produto = await getProdutoByIdSupabase(entrada.produtoId)
          if (produto) setSelectedProduto(produto)
          // Carregar responsável (Supabase)
          const responsavel = await getColaboradorById(entrada.responsavelId)
          if (responsavel) setSelectedResponsavel(responsavel)
          // Preencher formulário
          form.reset({
            produtoId: entrada.produtoId,
            responsavelId: entrada.responsavelId,
            quantidade: entrada.quantidade,
            valorUnitario: entrada.valorUnitario ?? 0,
          })
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [entradaId, form])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      let result

      if (entradaId) {
        // Atualizar entrada existente no Supabase
        result = await updateEntradaSupabase(entradaId, {
          produtoId: data.produtoId,
          responsavelId: data.responsavelId,
          quantidade: data.quantidade,
          valorUnitario: data.valorUnitario
        })
        if (result) {
          toast({
            title: "Entrada atualizada com sucesso",
            description: `A entrada foi atualizada e o estoque foi ajustado`,
          })
        }
      } else {
        // Adicionar nova entrada no Supabase
        result = await addEntradaSupabase({
          produtoId: data.produtoId,
          responsavelId: data.responsavelId,
          quantidade: data.quantidade,
          valorUnitario: data.valorUnitario,
          produtoDescricao: selectedProduto?.descricao || "",
          responsavelNome: selectedResponsavel?.nome || "",
          data: new Date().toISOString(),
        })
        if (result) {
          toast({
            title: "Entrada registrada com sucesso",
            description: `${data.quantidade} unidades adicionadas ao estoque`,
          })
        }
      }

      if (result) {
        if (!entradaId) {
          form.reset()
          setSelectedProduto(null)
          setSelectedResponsavel(null)
        }
        onSuccess()
      } else {
        toast({
          title: entradaId ? "Erro ao atualizar entrada" : "Erro ao registrar entrada",
          description: "Verifique os dados e tente novamente",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: entradaId ? "Erro ao atualizar entrada" : "Erro ao registrar entrada",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProdutoSelect = (produto: Produto) => {
    setSelectedProduto(produto)
    form.setValue("produtoId", produto.id)
  }

  const handleResponsavelSelect = (colaborador: Colaborador) => {
    setSelectedResponsavel(colaborador)
    form.setValue("responsavelId", colaborador.id)
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando...</div>
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="produtoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produto</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                      onClick={() => setIsProdutoDialogOpen(true)}
                    >
                      {selectedProduto ? selectedProduto.descricao : "Selecionar produto"}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsavelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                      onClick={() => setIsResponsavelDialogOpen(true)}
                    >
                      {selectedResponsavel ? selectedResponsavel.nome : "Selecionar responsável"}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valorUnitario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Unitário (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0.01" {...field} />
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? entradaId
                ? "Atualizando..."
                : "Registrando..."
              : entradaId
                ? "Atualizar Entrada"
                : "Registrar Entrada"}
          </Button>
        </form>
      </Form>

      <SelecionarProdutoDialog
        open={isProdutoDialogOpen}
        onOpenChange={setIsProdutoDialogOpen}
        onSelect={handleProdutoSelect}
      />

      <SelecionarResponsavelDialog
        open={isResponsavelDialogOpen}
        onOpenChange={setIsResponsavelDialogOpen}
        onSelect={handleResponsavelSelect}
      />
    </>
  )
}
