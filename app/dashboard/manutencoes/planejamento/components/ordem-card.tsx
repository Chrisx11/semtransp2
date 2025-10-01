import React, { useEffect, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrdemServico } from "@/services/ordem-servico-service"
import { Car, Clock, Truck, ArrowUpDown, FileText, X } from "lucide-react"
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface OrdemCardProps {
  ordem: OrdemServico
  mecanicoId: string
  getStatusColor: (status: string) => string
  isDragging?: boolean
}

export const OrdemCard: React.FC<OrdemCardProps> = ({ 
  ordem, 
  mecanicoId, 
  getStatusColor,
  isDragging = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `${mecanicoId}_${ordem.id}`,
    data: {
      ordem,
      mecanicoId
    }
  })
  
  // Log de renderização e mudanças
  useEffect(() => {
    console.log(`Ordem renderizada: ${ordem.id}, mecanico: ${mecanicoId}, ordem_execucao: ${ordem.ordem_execucao || 'N/A'}`);
  }, [ordem.id, mecanicoId, ordem.ordem_execucao]);

  useEffect(() => {
    if (isSortableDragging) {
      console.log(`Ordem está sendo arrastada: ${ordem.id}`);
    }
  }, [isSortableDragging, ordem.id]);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? '0.4' : '1',
    zIndex: isDragging ? 1000 : 1,
  }
  
  // Extrair placa do veículo da string veiculoInfo (formato comum: "PLACA - Marca Modelo (Ano)")
  const placa = typeof ordem.veiculoInfo === 'string' 
    ? ordem.veiculoInfo.split(' - ')[0] 
    : 'Placa'
  
  // Extrair o modelo do veículo
  const modelo = typeof ordem.veiculoInfo === 'string' && ordem.veiculoInfo.includes(' - ')
    ? ordem.veiculoInfo.split(' - ')[1]
    : 'Veículo não especificado'
  
  // Extrair o solicitante
  const solicitante = ordem.solicitanteInfo || 'Sem solicitante'
  
  // Extrair o mecânico
  const mecanico = ordem.mecanicoInfo || 'Sem mecânico'
    
  // Calcular a data formatada
  const dataFormatada = new Date(ordem.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
  
  // Função para abrir modal no duplo clique
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "cursor-move group transition-all duration-200",
          isSortableDragging ? "z-50" : "z-0"
        )}
        data-active={isSortableDragging}
        onDoubleClick={handleDoubleClick}
      >
        <Card className={cn(
          "border border-transparent hover:border-primary/60",
          isDragging || isSortableDragging ? "shadow-lg scale-105 border-primary" : "shadow-sm",
          "transition-all duration-200 h-[120px]"
        )}>
          <CardContent className="p-3 relative h-full">
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="bg-primary/10 w-full h-full flex items-center justify-center rounded">
                <ArrowUpDown className="h-5 w-5 text-primary" />
              </div>
            </div>
            
            <div className="flex items-start gap-2 relative z-10 h-full">
              <div className={`w-1 self-stretch rounded-full ${getStatusColor(ordem.status)}`} />
              
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{placa}</span>
                    </div>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      #{ordem.numero.replace('OS-', '')}
                    </Badge>
                  </div>
                  
                  <div className="mb-1.5 text-xs line-clamp-2 text-muted-foreground h-[32px]">
                    {ordem.defeitosRelatados || "Sem descrição"}
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{dataFormatada}</span>
                  </div>
                  
                  <Badge 
                    className={cn(
                      "text-xs",
                      getStatusColor(ordem.status),
                      "text-white"
                    )}
                  >
                    {ordem.status}
                  </Badge>
                </div>
              </div>
              
              <div className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex items-center justify-center">
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </div>
            
            {/* Indicador de ordem de execução */}
            {ordem.ordem_execucao && (
              <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md" 
                title={`Ordem de execução: ${ordem.ordem_execucao}`}
              >
                {ordem.ordem_execucao}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modal com detalhes da ordem */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ordem de Serviço #{ordem.numero}</span>
              <Badge 
                className={cn(
                  getStatusColor(ordem.status),
                  "text-white ml-2"
                )}
              >
                {ordem.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Informações básicas da ordem de serviço
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Veículo</h4>
                <p className="text-sm font-semibold">{placa}</p>
                <p className="text-xs text-muted-foreground">{modelo}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Data</h4>
                <p className="text-sm font-semibold">{new Date(ordem.data).toLocaleDateString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Criado em {new Date(ordem.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Solicitante</h4>
                <p className="text-sm">{solicitante}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Mecânico</h4>
                <p className="text-sm">{mecanico}</p>
              </div>
              
              <div className="sm:col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Km Atual</h4>
                <p className="text-sm">{ordem.kmAtual || "Não informado"}</p>
              </div>
              
              <div className="sm:col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Defeitos Relatados</h4>
                <p className="text-sm border rounded-md p-2 bg-muted/50 min-h-[60px] whitespace-pre-wrap">
                  {ordem.defeitosRelatados || "Não informado"}
                </p>
              </div>
              
              <div className="sm:col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Serviços/Peças</h4>
                <p className="text-sm border rounded-md p-2 bg-muted/50 min-h-[60px] whitespace-pre-wrap">
                  {ordem.pecasServicos || "Não informado"}
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Fechar
            </Button>
            
            <Button
              type="button"
              onClick={() => {
                window.open(`/dashboard/manutencoes/ordem-servico/${ordem.id}`, '_blank');
              }}
            >
              Ver Completo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 