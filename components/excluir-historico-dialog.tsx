"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trash2, AlertTriangle, ShellIcon as OilCanIcon, GaugeIcon } from "lucide-react"
import type { HistoricoItem } from "./historico-trocas-dialog"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

interface ExcluirHistoricoDialogProps {
  isOpen: boolean
  onClose: () => void
  item: HistoricoItem
  onConfirm: () => void
}

export function ExcluirHistoricoDialog({
  isOpen,
  onClose,
  item,
  onConfirm,
}: ExcluirHistoricoDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

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

  const handleDelete = async () => {
    try {
      setLoading(true)
      
      // Excluir registro diretamente do Supabase
      const { error } = await supabase
        .from("trocas_oleo")
        .delete()
        .eq("id", item.id)
      
      if (error) {
        console.error("Erro ao excluir registro:", error)
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: error.message,
        })
        throw error
      }
      
      toast({
        title: "Registro excluído",
        description: "O registro foi removido com sucesso",
        className: "bg-green-50 border-green-200 text-green-900",
      })

      onConfirm()
    } catch (error) {
      console.error("Erro ao excluir registro:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Tem certeza que deseja excluir este registro? 
            <span className="font-medium"> Esta ação não pode ser desfeita.</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-3">
          <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <Badge 
                  variant={item.tipo === "Troca de Óleo" ? "default" : "secondary"}
                  className="flex items-center"
                >
                  {item.tipo === "Troca de Óleo" ? 
                    <OilCanIcon className="h-3 w-3 mr-1" /> : 
                    <GaugeIcon className="h-3 w-3 mr-1" />
                  }
                  {item.tipo}
                </Badge>
                <span className="text-sm font-medium">
                  {formatarData(item.data)}
                </span>
              </div>
              
              <Separator className="my-3" />
              
              <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {item.tipo === "Troca de Óleo" ? (
                    <>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Km na troca</span>
                        <span className="font-medium">{item.kmAtual.toLocaleString()} km</span>
                      </div>
                      
                      {item.kmProxTroca && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Próxima troca</span>
                          <span className="font-medium">{item.kmProxTroca.toLocaleString()} km</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {item.kmAnterior && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Km anterior</span>
                          <span className="font-medium">{item.kmAnterior.toLocaleString()} km</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Novo km</span>
                        <span className="font-medium">{item.kmAtual.toLocaleString()} km</span>
                      </div>
                      
                      {item.kmAnterior && (
                        <div className="flex flex-col col-span-2 mt-1">
                          <span className="text-xs text-muted-foreground">Alteração</span>
                          <span className="font-medium text-green-600">
                            +{(item.kmAtual - item.kmAnterior).toLocaleString()} km
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {item.observacao && (
                    <div className="col-span-2 mt-2">
                      <span className="text-xs text-muted-foreground block">Observações</span>
                      <p className="text-sm mt-1">{item.observacao}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="sm:mr-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {loading ? "Excluindo..." : "Excluir Registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
