import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { EventoHistorico } from "@/services/ordem-servico-service"

interface TimelineProps {
  eventos: EventoHistorico[]
  className?: string
}

export function Timeline({ eventos, className }: TimelineProps) {
  // Ordenar eventos do mais recente para o mais antigo
  const eventosOrdenados = [...eventos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return (
    <div className={cn("space-y-8", className)}>
      {eventosOrdenados.map((evento, index) => (
        <TimelineItem key={evento.id} evento={evento} isLast={index === eventosOrdenados.length - 1} />
      ))}
    </div>
  )
}

interface TimelineItemProps {
  evento: EventoHistorico
  isLast: boolean
}

function TimelineItem({ evento, isLast }: TimelineItemProps) {
  // Formatar a data
  const data = new Date(evento.data)
  const dataFormatada = data.toLocaleDateString("pt-BR")
  const horaFormatada = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Definir cores com base no tipo de evento
  let dotColor = "bg-primary"
  let lineColor = "bg-primary/20"

  switch (evento.tipo) {
    case "Criação":
      dotColor = "bg-green-500"
      lineColor = "bg-green-500/20"
      break
    case "Mudança de Status":
      dotColor = "bg-blue-500"
      lineColor = "bg-blue-500/20"
      break
    case "Envio para Almoxarifado":
      dotColor = "bg-amber-500"
      lineColor = "bg-amber-500/20"
      break
    case "Envio para Compras":
      dotColor = "bg-purple-500"
      lineColor = "bg-purple-500/20"
      break
    case "Retorno para Oficina":
      dotColor = "bg-indigo-500"
      lineColor = "bg-indigo-500/20"
      break
  }

  return (
    <div className="relative pl-6">
      {/* Dot */}
      <div className={cn("absolute left-0 top-1 h-3 w-3 rounded-full", dotColor)} />

      {/* Line */}
      {!isLast && <div className={cn("absolute left-1.5 top-4 h-full w-px -translate-x-1/2", lineColor)} />}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{dataFormatada}</span>
          <span className="text-xs text-muted-foreground">{horaFormatada}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-medium">{evento.tipo}</h4>
          <Badge variant="outline" className="font-normal">
            {evento.status}
          </Badge>
        </div>

        {evento.de !== evento.para && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">De:</span>
            <span className="font-medium">{evento.de}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{evento.para}</span>
          </div>
        )}

        {evento.observacao && <div className="rounded-md bg-muted/50 p-3 text-sm">{evento.observacao}</div>}
      </div>
    </div>
  )
}
