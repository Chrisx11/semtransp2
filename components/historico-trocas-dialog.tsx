"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, GaugeIcon, ShellIcon as OilCanIcon, Pencil, Trash2, ArrowDownAZ, ArrowUpZA, FilterIcon, InfoIcon, Disc } from "lucide-react"
import { EditarHistoricoDialog } from "./editar-historico-dialog"
import { ExcluirHistoricoDialog } from "./excluir-historico-dialog"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export interface HistoricoItem {
  id: string
  data: string
  tipo: string
  kmAnterior?: number
  kmAtual: number
  kmProxTroca?: number
  observacao?: string
  posicoes?: string[]
  tipoPneu?: string
  alinhamento?: boolean
  balanceamento?: boolean
}

interface HistoricoTrocasDialogProps {
  isOpen: boolean
  onClose: () => void
  veiculo: {
    id: string
    placa: string
    marca: string
    modelo: string
    kmAtual: number
    kmProxTroca: number
    historico: HistoricoItem[]
  }
  onEditHistorico: (item: HistoricoItem) => void
  onDeleteHistorico: (itemId: string) => void
}

// Normalizar os tipos do histórico para evitar problemas de capitalização
function normalizeTipo(tipo: string): string {
  tipo = tipo.toLowerCase().trim();
  
  if (tipo.includes('óleo') || tipo.includes('oleo') || tipo.includes('troca')) {
    return "Troca de Óleo";
  }
  
  if (tipo.includes('km') || tipo.includes('atual') || tipo.includes('atualiz')) {
    return "Atualização de Km";
  }
  
  if (tipo.includes('pneu') || tipo.includes('roda') || tipo.includes('pneumatico')) {
    return "Troca de Pneu";
  }
  
  return tipo.charAt(0).toUpperCase() + tipo.slice(1); // Capitalizar primeira letra
}

export function HistoricoTrocasDialog({
  isOpen,
  onClose,
  veiculo,
  onEditHistorico,
  onDeleteHistorico,
}: HistoricoTrocasDialogProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HistoricoItem | null>(null)
  const [ordemDecrescente, setOrdemDecrescente] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")

  // Função para ordenar o histórico por data
  const historicoOrdenado = [...(veiculo.historico || [])].map(item => ({
    ...item,
    tipo: normalizeTipo(item.tipo || '') // Normalizar o tipo ao processar o histórico
  })).sort((a, b) => {
    const parseData = (data: string) => {
      if (data.includes("-")) {
        // Formato ISO
        return new Date(data)
      } else {
        // Formato DD/MM/YYYY
        const parts = data.split("/").map(Number)
        return new Date(parts[2], parts[1] - 1, parts[0])
      }
    }
    const dateA = parseData(a.data)
    const dateB = parseData(b.data)
    return ordemDecrescente ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
  })

  // Filtrar o histórico pelo tipo selecionado e termo de busca
  const historicoFiltrado = useMemo(() => {
    let filtrado = historicoOrdenado;
    
    // Filtro por tipo
    if (tipoFiltro === "troca") {
      filtrado = filtrado.filter(item => item.tipo === "Troca de Óleo");
    } else if (tipoFiltro === "km") {
      filtrado = filtrado.filter(item => item.tipo === "Atualização de Km");
    } else if (tipoFiltro === "pneu") {
      filtrado = filtrado.filter(item => item.tipo === "Troca de Pneu");
    }
    
    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase().trim();
      filtrado = filtrado.filter(item => 
        formatarData(item.data).toLowerCase().includes(termo) || 
        (item.observacao && item.observacao.toLowerCase().includes(termo)) ||
        (item.kmAtual && item.kmAtual.toString().includes(termo)) ||
        (item.kmProxTroca && item.kmProxTroca.toString().includes(termo)) ||
        (item.kmAnterior && item.kmAnterior.toString().includes(termo))
      );
    }
    
    return filtrado;
  }, [historicoOrdenado, tipoFiltro, searchTerm]);

  // Renderizar ícone de acordo com o tipo
  const renderIcone = (tipo: string) => {
    switch (tipo) {
      case "Troca de Óleo":
        return <OilCanIcon className="h-4 w-4 mr-1" />
      case "Atualização de Km":
        return <GaugeIcon className="h-4 w-4 mr-1" />
      case "Troca de Pneu":
        return <Disc className="h-4 w-4 mr-1" />
      default:
        return <CalendarIcon className="h-4 w-4 mr-1" />
    }
  }

  // Definir variante do badge por tipo
  const getBadgeVariant = (tipo: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (tipo) {
      case "Troca de Óleo":
        return "default"
      case "Atualização de Km":
        return "secondary"
      case "Troca de Pneu":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Formatação da data para exibição
  const formatarData = (dataStr: string) => {
    try {
      // Se a data estiver no formato ISO (YYYY-MM-DD)
      if (dataStr.includes("-")) {
        return format(new Date(dataStr), "dd/MM/yyyy", { locale: ptBR });
      }
      
      // Se já estiver no formato DD/MM/YYYY
      if (dataStr.includes("/")) {
        const [dia, mes, ano] = dataStr.split("/").map(Number);
        return format(new Date(ano, mes - 1, dia), "dd/MM/yyyy", { locale: ptBR });
      }
      
      // Tentar como timestamp
      return format(new Date(dataStr), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      return dataStr; // Se falhar, retorna a string original
    }
  };

  // Manipuladores de eventos
  const handleEdit = (item: HistoricoItem) => {
    setSelectedItem(item)
    setEditDialogOpen(true)
  }

  const handleDelete = (item: HistoricoItem) => {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  const handleEditConfirm = (editedItem: HistoricoItem) => {
    onEditHistorico(editedItem)
    setEditDialogOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (selectedItem) {
      onDeleteHistorico(selectedItem.id)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-xl font-bold">
                Histórico de Manutenções
              </DialogTitle>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setOrdemDecrescente((v) => !v)}
                >
                  {ordemDecrescente ? <ArrowDownAZ className="h-4 w-4 mr-1" /> : <ArrowUpZA className="h-4 w-4 mr-1" />}
                  {ordemDecrescente ? "Mais recente" : "Mais antigo"}
                </Button>
              </div>
            </div>
            
            <div className="mt-2 flex flex-col space-y-1">
              <div className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                <span className="text-primary">{veiculo.placa}</span>
                <span>•</span>
                <span>{veiculo.marca} {veiculo.modelo}</span>
              </div>
              
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <GaugeIcon className="h-3.5 w-3.5" />
                  <span>Atual: {veiculo.kmAtual.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <OilCanIcon className="h-3.5 w-3.5" />
                  <span>Próx. troca: {veiculo.kmProxTroca.toLocaleString()} km</span>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <Input
                placeholder="Buscar nos registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <FilterIcon className="h-4 w-4" />
              </span>
            </div>
            
            <Tabs value={tipoFiltro} onValueChange={setTipoFiltro} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="troca">Óleo</TabsTrigger>
                <TabsTrigger value="pneu">Pneus</TabsTrigger>
                <TabsTrigger value="km">Km</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <ScrollArea className="h-[450px] overflow-y-auto pr-4">
            {historicoFiltrado.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                <InfoIcon className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum registro encontrado</p>
                <p className="max-w-md text-sm">
                  {searchTerm 
                    ? "Tente ajustar os filtros de busca para encontrar o que procura." 
                    : "Não existem registros de manutenção para este veículo."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historicoFiltrado.map((item) => (
                  <Card key={item.id} className="relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      item.tipo === "Troca de Óleo" 
                        ? "bg-blue-500" 
                        : item.tipo === "Troca de Pneu" 
                          ? "bg-yellow-500" 
                          : "bg-green-500"
                    }`} />
                    
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getBadgeVariant(item.tipo)} className="flex items-center">
                          {renderIcone(item.tipo)}
                          {item.tipo}
                        </Badge>
                        <span className="text-sm font-medium">{formatarData(item.data)}</span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar registro
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>

                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {item.tipo === "Troca de Óleo" ? (
                          <>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Km na troca</span>
                              <span className="font-medium text-base">{item.kmAtual?.toLocaleString() || "-"} km</span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Próxima troca</span>
                              <span className="font-medium text-base">{item.kmProxTroca?.toLocaleString() || "-"} km</span>
                            </div>
                          </>
                        ) : item.tipo === "Troca de Pneu" ? (
                          <>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Quilometragem</span>
                              <span className="font-medium text-base">{item.kmAtual?.toLocaleString() || "-"} km</span>
                            </div>
                         
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Tipo de Pneu</span>
                              <span className="font-medium text-base">{item.tipoPneu || "Não especificado"}</span>
                            </div>
                         
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Posições</span>
                              <span className="font-medium text-base">
                                {item.posicoes && item.posicoes.length > 0 
                                  ? item.posicoes.join(', ') 
                                  : "Todas"}
                              </span>
                            </div>
                         
                            <div className="flex flex-wrap gap-2 sm:col-span-3">
                              {item.alinhamento && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                  Alinhamento
                                </Badge>
                              )}
                              {item.balanceamento && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  Balanceamento
                                </Badge>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Km anterior</span>
                              <span className="font-medium text-base">{item.kmAnterior?.toLocaleString() || "-"} km</span>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">Novo Km</span>
                              <span className="font-medium text-base">{item.kmAtual?.toLocaleString() || "-"} km</span>
                            </div>
                            
                            {item.kmAnterior !== undefined && (
                              <div className="flex flex-col sm:col-span-2">
                                <span className="text-xs text-muted-foreground">Alteração</span>
                                <span className="font-medium text-green-600 text-base">
                                  +{(item.kmAtual - item.kmAnterior)?.toLocaleString() || "-"} km
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {item.observacao && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Observações:</p>
                          <p className="text-sm">{item.observacao}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="border-t pt-4 mt-2">
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedItem && (
        <>
          <EditarHistoricoDialog
            isOpen={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            item={selectedItem}
            onConfirm={handleEditConfirm}
          />
          <ExcluirHistoricoDialog
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            item={selectedItem}
            onConfirm={handleDeleteConfirm}
          />
        </>
      )}
    </>
  )
}
