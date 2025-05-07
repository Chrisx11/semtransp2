"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { OrdemServicoVisualizacao } from "./ordem-servico-visualizacao"
import { getOrdemServicoById, getOrdemServicoByIdSupabase } from "@/services/ordem-servico-service"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface OrdemServicoVisualizacaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordemId: string | null
  onEdit: () => void
}

export function OrdemServicoVisualizacaoDialog({
  open,
  onOpenChange,
  ordemId,
  onEdit,
}: OrdemServicoVisualizacaoDialogProps) {
  const [ordem, setOrdem] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && ordemId) {
      setLoading(true)
      const fetchOrdem = async () => {
        const ordemData = await getOrdemServicoByIdSupabase(ordemId)
        setOrdem(ordemData)
        setLoading(false)
      }
      fetchOrdem()
    } else {
      setOrdem(null)
    }
  }, [open, ordemId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogTitle className="bg-background dark:bg-gray-900 text-foreground p-4 rounded-t-md">
          Visualização da Ordem de Serviço
        </DialogTitle>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ordem ? (
          <OrdemServicoVisualizacao ordem={ordem} onBack={() => onOpenChange(false)} onEdit={onEdit} />
        ) : (
          <div className="py-4 text-center text-muted-foreground">Ordem de serviço não encontrada ou ID inválido.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
