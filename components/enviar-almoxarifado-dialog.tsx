"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { enviarParaAlmoxarifadoSupabase } from "@/services/ordem-servico-service"
import { useAuth } from "@/lib/auth-context"

interface EnviarAlmoxarifadoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordemId: string
  onSuccess?: () => void
}

export function EnviarAlmoxarifadoDialog({ open, onOpenChange, ordemId, onSuccess }: EnviarAlmoxarifadoDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const [observacoes, setObservacoes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!observacoes.trim()) {
      toast({
        title: "Observações obrigatórias",
        description: "Por favor, informe as observações para o almoxarifado.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const resultado = await enviarParaAlmoxarifadoSupabase(
        ordemId, 
        observacoes,
        user?.id,
        user?.nome || user?.login || "Sistema"
      )

      if (!resultado) {
        throw new Error("Não foi possível enviar a ordem para o almoxarifado")
      }

      toast({
        title: "Ordem enviada para o almoxarifado",
        description: "A ordem de serviço foi enviada para o almoxarifado com sucesso.",
      })

      onOpenChange(false)
      setObservacoes("")

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar para o almoxarifado",
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
          <DialogTitle>Enviar para Almoxarifado</DialogTitle>
          <DialogDescription>Informe as observações e peças necessárias para o almoxarifado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="observacoes" className="text-sm font-medium">
              Observações e peças necessárias
            </label>
            <Textarea
              id="observacoes"
              placeholder="Descreva as peças necessárias e outras observações relevantes..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar para Almoxarifado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
