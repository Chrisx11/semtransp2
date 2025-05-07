"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Package, Tag, Ruler, MapPin, BarChart2, Eye } from "lucide-react"
import type { Produto } from "@/services/produto-service"

interface ProdutoCardProps {
  produto: Produto
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: () => void
}

export function ProdutoCard({ produto, onEdit, onDelete, onView }: ProdutoCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg line-clamp-2">{produto.descricao}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-1">{produto.categoria}</span>
            </div>

            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{produto.unidade}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-1">{produto.localizacao}</span>
            </div>

            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">Estoque: {produto.estoque}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
          onClick={onView}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
          onClick={() => onEdit(produto.id)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
          onClick={() => onDelete(produto.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
