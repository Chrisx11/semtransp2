"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { addSaidaSupabase, updateSaidaSupabase } from "@/services/saida-service"
import { getProdutoByIdSupabase, updateProdutoSupabase } from "@/services/produto-service"
import { getColaboradorByIdSupabase } from "@/services/colaborador-service"
import { getVeiculoByIdSupabase } from "@/services/veiculo-service"
import { getEntradasByProdutoIdSupabase } from "@/services/entrada-service"
import { SelecionarProdutoDialog } from "./selecionar-produto-dialog"
import { SelecionarResponsavelDialog } from "./selecionar-responsavel-dialog"
import { SelecionarVeiculoDialog } from "./selecionar-veiculo-dialog"
import type { Produto } from "@/services/produto-service"
import type { Colaborador } from "@/services/colaborador-service"
import type { Veiculo } from "@/services/veiculo-service"
import type { Saida } from "@/services/saida-service"

const formSchema = z.object({
  produtoId: z.string().min(1, "Selecione um produto"),
  responsavelId: z.string().min(1, "Selecione um responsável"),
  veiculoId: z.string().min(1, "Selecione um veículo"),
  quantidade: z.coerce.number().positive("A quantidade deve ser maior que zero"),
  valorUnitario: z.coerce.number().min(0, "O valor unitário não pode ser negativo"),
})

type FormValues = z.infer<typeof formSchema>

interface SaidaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  saidaToEdit?: Saida | null
}

export function SaidaFormDialog({ open, onOpenChange, onSuccess, saidaToEdit }: SaidaFormDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!saidaToEdit)
  const [isProdutoDialogOpen, setIsProdutoDialogOpen] = useState(false)
  const [isResponsavelDialogOpen, setIsResponsavelDialogOpen] = useState(false)
  const [isVeiculoDialogOpen, setIsVeiculoDialogOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [selectedResponsavel, setSelectedResponsavel] = useState<Colaborador | null>(null)
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      produtoId: "",
      responsavelId: "",
      veiculoId: "",
      quantidade: 1,
      valorUnitario: 0,
    },
  })

  // Resetar o formulário quando o diálogo é fechado
  useEffect(() => {
    if (!open) {
      if (!saidaToEdit) {
        form.reset()
        setSelectedProduto(null)
        setSelectedResponsavel(null)
        setSelectedVeiculo(null)
      }
    }
  }, [open, form, saidaToEdit])

  // Carregar dados da saída para edição
  useEffect(() => {
    if (saidaToEdit && open) {
      setIsLoading(true)
      // Carregar produto
      getProdutoByIdSupabase(saidaToEdit.produtoId).then((produto) => {
        if (produto) setSelectedProduto(produto)
      })
      // Carregar responsável
      getColaboradorByIdSupabase(saidaToEdit.responsavelId).then((responsavel) => {
        if (responsavel) setSelectedResponsavel(responsavel)
      })
      // Carregar veículo
      getVeiculoByIdSupabase(saidaToEdit.veiculoId).then((veiculo) => {
        if (veiculo) setSelectedVeiculo(veiculo)
      })
      // Preencher formulário
      form.reset({
        produtoId: saidaToEdit.produtoId,
        responsavelId: saidaToEdit.responsavelId,
        veiculoId: saidaToEdit.veiculoId,
        quantidade: saidaToEdit.quantidade,
        valorUnitario: saidaToEdit.valorUnitario ?? 0,
      })
      setIsLoading(false)
    }
  }, [saidaToEdit, form, open])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      let result
      if (saidaToEdit) {
        // Atualizar saída existente no Supabase
        result = await updateSaidaSupabase(saidaToEdit.id, {
          ...data,
          data: new Date().toISOString(),
          observacao: "",
        })
        if (result) {
          toast({
            title: "Saída atualizada com sucesso",
            description: `A saída foi atualizada e o estoque foi ajustado`,
          })
        }
      } else {
        // Buscar entidades no Supabase
        const produto = await getProdutoByIdSupabase(data.produtoId)
        if (!produto) throw new Error("Produto não encontrado")
        const responsavel = await getColaboradorByIdSupabase(data.responsavelId)
        if (!responsavel) throw new Error("Responsável não encontrado")
        const veiculo = await getVeiculoByIdSupabase(data.veiculoId)
        if (!veiculo) throw new Error("Veículo não encontrado")
        if (produto.estoque < data.quantidade) {
          throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque}`)
        }
        // Adicionar nova saída no Supabase
        result = await addSaidaSupabase({
          produtoId: data.produtoId,
          produtoNome: produto.descricao,
          categoria: produto.categoria,
          quantidade: data.quantidade,
          valorUnitario: data.valorUnitario,
          data: new Date().toISOString(),
          responsavelId: data.responsavelId,
          responsavelNome: responsavel.nome,
          veiculoId: data.veiculoId,
          veiculoPlaca: veiculo.placa,
          veiculoModelo: veiculo.modelo,
          observacao: "",
        })
        // Atualizar estoque do produto no Supabase
        await updateProdutoSupabase(produto.id, {
          estoque: produto.estoque - data.quantidade,
        })
        if (result) {
          toast({
            title: "Saída registrada com sucesso",
            description: `${data.quantidade} unidades removidas do estoque`,
          })
        }
      }
      if (result) {
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: saidaToEdit ? "Erro ao atualizar saída" : "Erro ao registrar saída",
          description: "Verifique os dados e tente novamente",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: saidaToEdit ? "Erro ao atualizar saída" : "Erro ao registrar saída",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProdutoSelect = async (produto: Produto) => {
    setSelectedProduto(produto)
    form.setValue("produtoId", produto.id)
    // Buscar última entrada deste produto e sugerir valor unitário
    const entradas = await getEntradasByProdutoIdSupabase(produto.id)
    if (entradas && entradas[0] && typeof entradas[0].valorUnitario === 'number' && !isNaN(entradas[0].valorUnitario)) {
      form.setValue("valorUnitario", entradas[0].valorUnitario)
    } else {
      form.setValue("valorUnitario", 0)
    }
  }

  const handleResponsavelSelect = (colaborador: Colaborador) => {
    setSelectedResponsavel(colaborador)
    form.setValue("responsavelId", colaborador.id)
  }

  const handleVeiculoSelect = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo)
    form.setValue("veiculoId", veiculo.id)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{saidaToEdit ? "Editar Saída" : "Nova Saída"}</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center p-4">Carregando...</div>
          ) : (
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
                  name="veiculoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start font-normal"
                            onClick={() => setIsVeiculoDialogOpen(true)}
                          >
                            {selectedVeiculo
                              ? `${selectedVeiculo.placa} - ${selectedVeiculo.modelo}`
                              : "Selecionar veículo"}
                          </Button>
                        </div>
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

                <FormField
                  control={form.control}
                  name="valorUnitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Unitário (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? saidaToEdit
                        ? "Atualizando..."
                        : "Registrando..."
                      : saidaToEdit
                        ? "Atualizar"
                        : "Registrar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

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

      <SelecionarVeiculoDialog
        open={isVeiculoDialogOpen}
        onOpenChange={setIsVeiculoDialogOpen}
        onSelect={handleVeiculoSelect}
      />
    </>
  )
}
