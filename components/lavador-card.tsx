"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { type ServicoLavador } from "@/services/lavador-service"
import { type Fornecedor } from "@/services/fornecedor-service"

interface LavadorCardProps {
  servico: ServicoLavador
  fornecedor: Fornecedor | undefined
  onEdit: () => void
  onDelete: () => void
}

export function LavadorCard({ servico, fornecedor, onEdit, onDelete }: LavadorCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{servico.veiculo.placa}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {servico.veiculo.marca} {servico.veiculo.modelo}
            </p>
          </div>
          <Badge variant="outline" className="ml-2">
            {format(new Date(servico.createdAt), "dd/MM/yyyy")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <div>
              <p className="text-sm font-medium">Fornecedor:</p>
              <p className="text-sm text-muted-foreground">{fornecedor?.nome || "Desconhecido"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Secretaria:</p>
              <p className="text-sm text-muted-foreground">{servico.veiculo.secretaria}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Serviço:</p>
            <p className="text-sm">{servico.servico}</p>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Quantidade:</p>
              <p className="text-sm">{servico.quantidade}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 mr-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-1" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  )
} 