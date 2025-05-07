"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Search } from "lucide-react"
import { getProdutosSupabase, type Produto } from "@/services/produto-service"

interface SelecionarProdutosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (produtos: Produto[]) => void
  produtosSelecionadosIds?: string[]
}

export function SelecionarProdutosDialog({
  open,
  onOpenChange,
  onSave,
  produtosSelecionadosIds = [],
}: SelecionarProdutosDialogProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(produtosSelecionadosIds))

  useEffect(() => {
    if (open) {
      getProdutosSupabase().then((todosProdutos) => {
        setProdutos(todosProdutos)
        setFilteredProdutos(todosProdutos)
        setSelectedIds(new Set(produtosSelecionadosIds))
      })
    }
  }, [open, produtosSelecionadosIds])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProdutos(produtos)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = produtos.filter(
        (produto) =>
          produto.descricao.toLowerCase().includes(query) ||
          produto.categoria.toLowerCase().includes(query) ||
          produto.localizacao.toLowerCase().includes(query),
      )
      setFilteredProdutos(filtered)
    }
  }, [searchQuery, produtos])

  const handleToggleSelect = (id: string) => {
    const newSelectedIds = new Set(selectedIds)
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id)
    } else {
      newSelectedIds.add(id)
    }
    setSelectedIds(newSelectedIds)
  }

  const handleSave = () => {
    const selectedProdutos = produtos.filter((produto) => selectedIds.has(produto.id))
    onSave(selectedProdutos)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Produtos</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1 pr-4 h-[400px]">
          {filteredProdutos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</div>
          ) : (
            <div className="space-y-2">
              {filteredProdutos.map((produto) => (
                <div
                  key={produto.id}
                  className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors flex items-center"
                  onClick={() => handleToggleSelect(produto.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(produto.id)}
                    onCheckedChange={() => handleToggleSelect(produto.id)}
                    className="mr-3"
                    id={`produto-${produto.id}`}
                  />
                  <div className="flex-1">
                    <label htmlFor={`produto-${produto.id}`} className="font-medium cursor-pointer flex-1">
                      {produto.descricao}
                    </label>
                    <div className="text-sm text-muted-foreground flex justify-between mt-1">
                      <span>Categoria: {produto.categoria}</span>
                      <span>Estoque: {produto.estoque}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-4">
          <div className="flex justify-between w-full items-center">
            <div className="text-sm text-muted-foreground">{selectedIds.size} produto(s) selecionado(s)</div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar Seleção</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
