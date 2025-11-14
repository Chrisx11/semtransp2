"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { getProdutosSupabase, type Produto } from "@/services/produto-service"

interface SelecionarProdutoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (produto: Produto) => void
}

export function SelecionarProdutoDialog({ open, onOpenChange, onSelect }: SelecionarProdutoDialogProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([])

  useEffect(() => {
    if (open) {
      getProdutosSupabase().then((todosProdutos) => {
        setProdutos(todosProdutos)
        setFilteredProdutos(todosProdutos)
      })
    }
  }, [open])

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

  const handleSelect = (produto: Produto) => {
    onSelect(produto)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Produto</DialogTitle>
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

        <ScrollArea className="flex-1 pr-4 h-[350px]">
          {filteredProdutos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</div>
          ) : (
            <div className="space-y-2">
              {filteredProdutos.map((produto) => (
                <div
                  key={produto.id}
                  className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSelect(produto)}
                >
                  <div className="font-medium">{produto.descricao}</div>
                  <div className="text-sm text-muted-foreground flex justify-between mt-1">
                    <span>Categoria: {produto.categoria}</span>
                    <span>Estoque: {produto.estoque}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
