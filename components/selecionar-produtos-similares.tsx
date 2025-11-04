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
import { getProdutosSupabase, updateProdutoSupabase, type Produto } from "@/services/produto-service"
import { useToast } from "@/hooks/use-toast"

interface SelecionarProdutosSimilaresProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto
  onSuccess: () => void
}

export function SelecionarProdutosSimilares({
  open,
  onOpenChange,
  produto,
  onSuccess,
}: SelecionarProdutosSimilaresProps) {
  const [produtosMesmaCategoria, setProdutosMesmaCategoria] = useState<Produto[]>([])
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Carregar produtos da mesma categoria do Supabase
  useEffect(() => {
    if (open && produto) {
      (async () => {
        const todosProdutos = await getProdutosSupabase()
        const produtos = todosProdutos.filter(
          (p) => p.categoria === produto.categoria && p.id !== produto.id
        )
        setProdutosMesmaCategoria(produtos)
        setProdutosSelecionados(produto.produtosSimilares || [])
      })()
    }
  }, [open, produto])

  // Filtrar produtos com base na pesquisa
  const produtosFiltrados = produtosMesmaCategoria.filter((p) =>
    p.descricao.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Função para alternar a seleção de um produto
  const toggleProdutoSelecionado = (id: string) => {
    setProdutosSelecionados((prev) => {
      if (prev.includes(id)) {
        return prev.filter((produtoId) => produtoId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // Função para salvar as alterações
  const handleSalvar = async () => {
    setIsSubmitting(true)
    try {
      // Todos os produtos similares (incluindo o atual)
      const todosSimilares = [...produtosSelecionados, produto.id]

      // Atualizar o produto atual
      await updateProdutoSupabase(produto.id, { produtosSimilares: produtosSelecionados })

      // Atualizar todos os outros produtos da mesma categoria
      const todosProdutos = await getProdutosSupabase()
      const produtosMesmaCategoria = todosProdutos.filter(
        (p) => p.categoria === produto.categoria
      )

      // Para cada produto da mesma categoria
      for (const p of produtosMesmaCategoria) {
        // Se ele está na lista de similares, atualize para conter todos os outros (menos ele mesmo)
        if (todosSimilares.includes(p.id)) {
          const novosSimilares = todosSimilares.filter((id) => id !== p.id)
          await updateProdutoSupabase(p.id, { produtosSimilares: novosSimilares })
        } else if (p.produtosSimilares && p.produtosSimilares.includes(produto.id)) {
          // Se não está mais na lista, remova o produto atual dos similares dele
          const novosSimilares = p.produtosSimilares.filter((id) => id !== produto.id)
          await updateProdutoSupabase(p.id, { produtosSimilares: novosSimilares })
        }
      }

      toast({
        title: "Produtos similares atualizados",
        description: "A lista de produtos similares foi atualizada com sucesso.",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar produtos similares:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar os produtos similares.",
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
          <DialogTitle>Selecionar Produtos Similares</DialogTitle>
          <DialogDescription>
            Selecione os produtos que são similares a <strong>{produto?.descricao}</strong>. Todos os produtos
            selecionados serão considerados similares entre si.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {produtosFiltrados.length > 0 ? (
            <ScrollArea className="h-[300px] border rounded-md p-2">
              <div className="space-y-2">
                {produtosFiltrados.map((p) => (
                  <div key={p.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                    <Checkbox
                      id={`produto-${p.id}`}
                      checked={produtosSelecionados.includes(p.id)}
                      onCheckedChange={() => toggleProdutoSelecionado(p.id)}
                    />
                    <label
                      htmlFor={`produto-${p.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {p.descricao}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="border rounded-md p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Nenhum produto encontrado com este termo de busca."
                  : "Não há outros produtos na mesma categoria."}
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
