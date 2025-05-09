import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Car, Building, User, Wrench, Hash } from "lucide-react"
import { type ServicoBorracharia } from "@/services/borracharia-service"
import { Badge } from "@/components/ui/badge"

interface BorrachariaCardProps {
  servicoBorracharia: ServicoBorracharia
  fornecedorNome?: string
  onEdit: () => void
  onDelete: () => void
}

export function BorrachariaCard({ servicoBorracharia, fornecedorNome, onEdit, onDelete }: BorrachariaCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md-custom">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white truncate">
              {servicoBorracharia.veiculo.placa}
            </h3>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              {servicoBorracharia.veiculo.marca}
            </Badge>
          </div>
          <p className="text-sm text-white/80 truncate">{servicoBorracharia.veiculo.modelo}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">
              <span className="font-medium">Veículo:</span> {servicoBorracharia.veiculo.modelo} ({servicoBorracharia.veiculo.placa})
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">
              <span className="font-medium">Secretaria:</span> {servicoBorracharia.veiculo.secretaria}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">
              <span className="font-medium">Solicitante:</span> {servicoBorracharia.solicitanteId}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">
              <span className="font-medium">Serviço:</span> {servicoBorracharia.servico}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">
              <span className="font-medium">Quantidade:</span> {servicoBorracharia.quantidade}
            </p>
          </div>
          {fornecedorNome && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Badge variant="secondary" className="text-xs">
                Fornecedor: {fornecedorNome}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </CardFooter>
    </Card>
  )
} 