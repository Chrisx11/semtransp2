import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { User } from 'lucide-react'
import { OrdemServico } from '@/services/ordem-servico-service'
import { OrdemCard } from './ordem-card'
import { OrdemPlaceholder } from './ordem-placeholder'

interface MecanicoCardProps {
  mecanico: {
    id: string
    nome: string
    ordens: OrdemServico[]
  }
  getStatusColor: (status: string) => string
}

export const MecanicoCard: React.FC<MecanicoCardProps> = ({ mecanico, getStatusColor }) => {
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
    <Card className="overflow-hidden flex flex-col shadow-md border-none">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-full">
            <User className="h-5 w-5" />
          </div>
          <span className="font-medium">{mecanico.nome}</span>
          <span className="ml-auto bg-white/30 px-2.5 py-1 rounded-full font-bold text-base min-w-6 h-6 flex items-center justify-center" title="Número de ordens">
            {ordensOrdenadas.length}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-2 flex-1 overflow-auto min-h-[200px] max-h-[500px] bg-gray-50/50">
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
  )
} 