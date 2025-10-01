"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Car, Calendar, Palette, Building, Eye } from "lucide-react"
import type { Veiculo } from "@/services/veiculo-service"
import { Badge } from "@/components/ui/badge"

interface VeiculoCardProps {
  veiculo: Veiculo
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
}

export function VeiculoCard({ veiculo, onEdit, onDelete, onView }: VeiculoCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{veiculo.placa}</h3>
              <p className="text-sm text-muted-foreground">{veiculo.modelo}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">
                {veiculo.marca} - {veiculo.ano}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{veiculo.cor}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-1">{veiculo.secretaria}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={veiculo.status === "Ativo" ? "success" : "destructive"} className="text-xs">
                {veiculo.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
          onClick={() => onView(veiculo.id)}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
          onClick={() => onEdit(veiculo.id)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
          onClick={() => onDelete(veiculo.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
