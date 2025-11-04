import { TableCell, TableRow } from "@/components/ui/table"
import type { ReactNode } from "react"

interface EmptyStateProps {
  colSpan: number
  title?: string
  description?: string
  icon?: ReactNode
}

export function EmptyState({
  colSpan,
  title = "Nenhum dado encontrado",
  description = "Adicione um novo item para começar",
  icon,
}: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          {icon && <div className="mb-2">{icon}</div>}
          <p className="mb-2">{title}</p>
          <p className="text-sm">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}
