"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateProdutoSupabase, type Produto } from "@/services/produto-service"
import { getVeiculosSupabase, type Veiculo } from "@/services/veiculo-service"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface SelecionarVeiculosCompativeisProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto
  onSuccess: () => void
}

export function SelecionarVeiculosCompativeis({
  open,
  onOpenChange,
  produto,
  onSuccess,
}: SelecionarVeiculosCompativeisProps) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [veiculosSelecionados, setVeiculosSelecionados] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Carregar veículos
  useEffect(() => {
    if (open && produto) {
      (async () => {
        const todosVeiculos = await getVeiculosSupabase()
        setVeiculos(todosVeiculos)
        setVeiculosSelecionados(produto.veiculosCompativeis || [])
      })()
    }
  }, [open, produto])

  // Filtrar veículos com base na pesquisa
  const veiculosFiltrados = veiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Função para alternar a seleção de um veículo
  const toggleVeiculoSelecionado = (id: string) => {
    setVeiculosSelecionados((prev) => {
      if (prev.includes(id)) {
        return prev.filter((veiculoId) => veiculoId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // Função para salvar as alterações
  const handleSalvar = async () => {
    setIsSubmitting(true)
    try {
      // Atualizar o produto atual
      await updateProdutoSupabase(produto.id, { veiculosCompativeis: veiculosSelecionados })

      // Buscar todos os produtos similares do Supabase (produtosSimilares contém o produto atual)
      const { data: similares, error } = await supabase
        .from("produtos")
        .select("id")
        .contains("produtosSimilares", [produto.id])

      if (error) throw error

      // Atualizar todos os produtos similares para ter a mesma lista de veículos compatíveis
      if (similares && similares.length > 0) {
        for (const similar of similares) {
          await updateProdutoSupabase(similar.id, { veiculosCompativeis: veiculosSelecionados })
        }
      }

      toast({
        title: "Veículos compatíveis atualizados",
        description: "A lista de veículos compatíveis foi atualizada em todos os produtos similares.",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar veículos compatíveis:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar os veículos compatíveis.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Veículos Compatíveis</DialogTitle>
          <DialogDescription>
            Selecione os veículos que são compatíveis com <strong>{produto?.descricao}</strong>. Os veículos
            selecionados serão aplicados a todos os produtos similares.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar veículos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {veiculosFiltrados.length > 0 ? (
            <ScrollArea className="h-[300px] border rounded-md p-2">
              <div className="space-y-2">
                {veiculosFiltrados.map((v) => (
                  <div key={v.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                    <Checkbox
                      id={`veiculo-${v.id}`}
                      checked={veiculosSelecionados.includes(v.id)}
                      onCheckedChange={() => toggleVeiculoSelecionado(v.id)}
                    />
                    <label
                      htmlFor={`veiculo-${v.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{v.placa}</span>
                        <span className="text-xs text-muted-foreground">
                          {v.marca} {v.modelo} - {v.ano}
                        </span>
                      </div>
                    </label>
                    <Badge variant={v.status === "Ativo" ? "default" : "destructive"} className="ml-auto">
                      {v.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="border rounded-md p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Nenhum veículo encontrado com este termo de busca."
                  : "Não há veículos cadastrados no sistema."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isSubmitting}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
