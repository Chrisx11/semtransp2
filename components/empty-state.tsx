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
      <TableCell colSpan={colSpan} className="h-32 text-center">
        <div className="empty-state animate-fade-in">
          {icon && (
            <div className="empty-state-icon opacity-60">
              {icon}
            </div>
          )}
          <p className="empty-state-title">{title}</p>
          <p className="empty-state-description">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}
