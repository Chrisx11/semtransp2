"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, User, Briefcase, Phone, Building, MoreVertical } from "lucide-react"
import type { Colaborador } from "@/services/colaborador-service"
import { formatPhoneForDisplay } from "@/utils/export-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ColaboradorCardProps {
  colaborador: Colaborador
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function ColaboradorCard({ colaborador, onEdit, onDelete }: ColaboradorCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{colaborador.nome}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-1">{colaborador.funcao}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{formatPhoneForDisplay(colaborador.telefone)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-1">{colaborador.secretaria}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onEdit(colaborador.id)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(colaborador.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
