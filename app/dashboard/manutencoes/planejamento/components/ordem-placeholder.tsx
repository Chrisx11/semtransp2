import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from "@/components/ui/card"
import { GripVertical, Plus } from "lucide-react"
import { cn } from '@/lib/utils'

interface OrdemPlaceholderProps {
  mecanicoId: string
}

export const OrdemPlaceholder: React.FC<OrdemPlaceholderProps> = ({ mecanicoId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${mecanicoId}_placeholder`,
    data: {
      isPlaceholder: true,
      mecanicoId
    }
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? '0.4' : '1'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Card className={cn(
        "border border-dashed border-blue-300 bg-blue-50/30",
        isDragging ? "shadow-lg" : "shadow-sm",
        "transition-all duration-200 group hover:border-blue-400 hover:bg-blue-50/50 h-[120px]"
      )}>
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="flex flex-col items-center text-blue-500 gap-3">
            <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Arraste uma ordem para cá</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 