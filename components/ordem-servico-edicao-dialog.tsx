"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrdemServicoForm } from "./ordem-servico-form"
import { getOrdemServicoById, getOrdemServicoByIdSupabase } from "@/services/ordem-servico-service"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrdemServicoEdicaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  ordemId: string | null
}

export function OrdemServicoEdicaoDialog({ open, onOpenChange, onSuccess, ordemId }: OrdemServicoEdicaoDialogProps) {
  const [ordem, setOrdem] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && ordemId) {
      setLoading(true)
      const fetchOrdem = async () => {
        try {
          console.log("Buscando ordem para edição, ID:", ordemId)
          const ordemData = await getOrdemServicoByIdSupabase(ordemId)
          console.log("Ordem obtida para edição:", ordemData)
          setOrdem(ordemData)
        } catch (error) {
          console.error("Erro ao buscar ordem para edição:", error)
          toast({
            title: "Erro ao carregar ordem de serviço",
            description: "Não foi possível carregar os dados para edição",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
      fetchOrdem()
    } else {
      setOrdem(null)
    }
  }, [open, ordemId, toast])

  const handleSuccess = () => {
    console.log("Edição concluída com sucesso")
    onSuccess()
    onOpenChange(false)
  }

  const handleCancel = () => {
    console.log("Edição cancelada")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Editar Ordem de Serviço</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ordem ? (
          <OrdemServicoForm
            ordemExistente={ordem}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        ) : (
          <div className="py-4 text-center text-muted-foreground">Ordem de serviço não encontrada ou ID inválido.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
