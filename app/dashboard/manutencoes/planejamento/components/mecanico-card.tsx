import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { User, GripHorizontal, Monitor, MonitorOff } from 'lucide-react'
import { isMecanicoVisivelNaTela } from '@/lib/tela-mecanicos-config'
import { OrdemServico } from '@/services/ordem-servico-service'
import { OrdemCard } from './ordem-card'
import { OrdemPlaceholder } from './ordem-placeholder'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface MecanicoCardProps {
  mecanico: {
    id: string
    nome: string
    ordens: OrdemServico[]
  }
  getStatusColor: (status: string) => string
  isDragging?: boolean
  visivelNaTela?: boolean
  onToggleVisivelNaTela?: (mecanicoId: string, visivel: boolean) => void
}

export const MecanicoCard: React.FC<MecanicoCardProps> = ({
  mecanico,
  getStatusColor,
  isDragging = false,
  visivelNaTela: visivelNaTelaProp,
  onToggleVisivelNaTela,
}) => {
  const visivelNaTela = visivelNaTelaProp ?? isMecanicoVisivelNaTela(mecanico.id)
  // Configuração para tornar o próprio card sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: mecanico.id,
    data: {
      type: 'mecanico',
      mecanico
    }
  });

  // Estilo para o drag-and-drop do card
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? '0.6' : '1',
    zIndex: isDragging ? 1000 : 1,
  };

  // Filtrar para remover ordens finalizadas ou concluídas
  const ordensFiltradas = mecanico.ordens.filter(ordem => 
    ordem.status !== 'Finalizado' && ordem.status !== 'Concluída'
  );
  
  // Ordenar as ordens por ordem_execucao, se disponível
  const ordensOrdenadas = [...ordensFiltradas].sort((a, b) => {
    // Se ambos têm ordem_execucao, ordenar por isso
    if (a.ordem_execucao && b.ordem_execucao) {
      return a.ordem_execucao - b.ordem_execucao;
    }
    // Se apenas um tem ordem_execucao, colocar o que tem primeiro
    if (a.ordem_execucao) return -1;
    if (b.ordem_execucao) return 1;
    
    // Se nenhum tem ordem_execucao, ordenar por número da OS
    const numA = parseInt(a.numero.replace(/\D/g, ''));
    const numB = parseInt(b.numero.replace(/\D/g, ''));
    return numA - numB;
  });
  
  // Criar array de IDs para o contexto de ordenação
  const ordensIds = ordensOrdenadas.map(ordem => `${mecanico.id}_${ordem.id}`)
  
  // Adicionar ID do placeholder
  if (ordensOrdenadas.length === 0) {
    ordensIds.push(`${mecanico.id}_placeholder`)
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      className={cn(
        "transition-all duration-200 h-[500px] w-full",
        isSortableDragging ? "z-50" : "z-0"
      )}
    >
      <Card className={cn(
        "overflow-hidden flex flex-col shadow-md border-none h-full",
        isSortableDragging || isDragging ? "shadow-xl ring-2 ring-primary/30" : "",
        "transition-all duration-200"
      )}>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex flex-row items-center flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2 flex-1">
            <div className="bg-white/20 p-1.5 rounded-full">
              <User className="h-5 w-5" />
            </div>
            <span className="font-medium">{mecanico.nome}</span>
            <span className="ml-auto bg-white/30 px-2.5 py-1 rounded-full font-bold text-base min-w-6 h-6 flex items-center justify-center" title="Número de ordens">
              {ordensOrdenadas.length}
            </span>
          </CardTitle>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onToggleVisivelNaTela?.(mecanico.id, !visivelNaTela)
            }}
            className={cn(
              "p-1.5 rounded-md flex items-center justify-center ml-1 transition-colors",
              visivelNaTela
                ? "bg-white/25 hover:bg-white/35 text-white"
                : "bg-white/10 hover:bg-white/20 text-white/60"
            )}
            title={visivelNaTela ? "Exibindo na Tela — clique para ocultar" : "Oculto na Tela — clique para exibir"}
          >
            {visivelNaTela ? (
              <Monitor className="h-5 w-5" />
            ) : (
              <MonitorOff className="h-5 w-5" />
            )}
          </button>
          <div
            {...listeners}
            className="p-1.5 hover:bg-white/20 rounded-md cursor-move flex items-center justify-center ml-1"
            title="Arrastar para reorganizar mecânicos"
          >
            <GripHorizontal className="h-5 w-5 text-white/70" />
          </div>
        </CardHeader>
        
        <CardContent className="p-2 flex-1 overflow-auto bg-gray-50/50 h-[calc(100%-60px)]">
          <SortableContext items={ordensIds} strategy={verticalListSortingStrategy}>
            {ordensOrdenadas.length > 0 ? (
              <div className="space-y-2">
                {ordensOrdenadas.map((ordem, index) => (
                  <div 
                    key={ordem.id} 
                    className="py-1 relative group"
                  >
                    {/* Indicador de posição de drop */}
                    <div className="absolute -top-1 left-0 right-0 h-2 bg-transparent group-hover:bg-primary/10 rounded transition-colors" />
                    
                    <OrdemCard
                      ordem={ordem}
                      mecanicoId={mecanico.id}
                      getStatusColor={getStatusColor}
                    />
                    
                    {/* Indicador de posição de drop após o item */}
                    <div className="absolute -bottom-1 left-0 right-0 h-2 bg-transparent group-hover:bg-primary/10 rounded transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <OrdemPlaceholder mecanicoId={mecanico.id} />
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
} 