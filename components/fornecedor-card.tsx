import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, MapPin, Phone } from "lucide-react"
import { type Fornecedor } from "@/services/fornecedor-service"
import { formatPhoneForDisplay } from "@/utils/export-utils"

interface FornecedorCardProps {
  fornecedor: Fornecedor
  onEdit: () => void
  onDelete: () => void
}

export function FornecedorCard({ fornecedor, onEdit, onDelete }: FornecedorCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md-custom">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
          <h3 className="text-lg font-semibold text-white truncate">{fornecedor.nome}</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">{fornecedor.endereco}</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">{formatPhoneForDisplay(fornecedor.telefone)}</p>
          </div>
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