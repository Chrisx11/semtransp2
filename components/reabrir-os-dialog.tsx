"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateOrdemServicoSupabase } from "@/services/ordem-servico-service"
import { useAuth } from "@/lib/auth-context"

interface ReabrirOSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordemId: string | null
  onSuccess: () => void
}

export function ReabrirOSDialog({ open, onOpenChange, ordemId, onSuccess }: ReabrirOSDialogProps) {
  const [motivo, setMotivo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!ordemId) return

    if (!motivo.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o motivo da reabertura da ordem de serviço.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Prefixar a observação para deixar claro que é uma reabertura
      const observacaoFormatada = `Reabertura de OS: ${motivo}`
      
      // Atualizar o status da ordem para o status "Aguardando Mecânico"
      const resultado = await updateOrdemServicoSupabase(
        ordemId, 
        { status: "Aguardando Mecânico" }, 
        observacaoFormatada,
        user?.id,
        user?.nome || user?.login || "Sistema"
      )

      if (!resultado) {
        throw new Error("Não foi possível reabrir a ordem de serviço")
      }

      toast({
        title: "Ordem de serviço reaberta",
        description: "A ordem de serviço foi reaberta com sucesso e está disponível na aba Oficina.",
      })

      // Limpar o campo de motivo
      setMotivo("")

      // Fechar o diálogo
      onOpenChange(false)

      // Notificar o componente pai sobre o sucesso
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro ao reabrir ordem de serviço",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-blue-500" />
            Reabrir Ordem de Serviço
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4">Esta ação irá reabrir a ordem de serviço e movê-la para a aba Oficina com o status "Aguardando Mecânico".</p>

          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-sm font-medium">
              Motivo da reabertura <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da reabertura da ordem de serviço"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Processando..." : "Confirmar Reabertura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 