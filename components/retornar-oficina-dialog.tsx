"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CornerDownLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { retornarParaOficinaSupabase } from "@/services/ordem-servico-service"

interface RetornarOficinaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordemId: string | null
  origem: "Almoxarifado" | "Compras"
  onSuccess: () => void
}

export function RetornarOficinaDialog({ open, onOpenChange, ordemId, origem, onSuccess }: RetornarOficinaDialogProps) {
  const [observacoes, setObservacoes] = useState("")
  const [statusDestino, setStatusDestino] = useState("Fila de Serviço")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!ordemId) return

    setIsSubmitting(true)

    try {
      // Atualizar o status da ordem para o status selecionado
      const resultado = await retornarParaOficinaSupabase(ordemId, observacoes, origem, statusDestino)

      if (!resultado) {
        throw new Error("Não foi possível atualizar a ordem de serviço")
      }

      toast({
        title: "Ordem retornada para a oficina",
        description: `A ordem de serviço foi retornada para a oficina com status "${statusDestino}" com sucesso.`,
      })

      // Limpar o campo de observações
      setObservacoes("")
      setStatusDestino("Fila de Serviço")

      // Fechar o diálogo
      onOpenChange(false)

      // Notificar o componente pai sobre o sucesso
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro ao retornar para a oficina",
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
            <CornerDownLeft className="h-5 w-5 mr-2 text-blue-500" />
            Retornar para Oficina
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4">Esta ação irá retornar a ordem de serviço para a oficina com o status selecionado.</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status-destino">Selecione o status de destino</Label>
              <RadioGroup value={statusDestino} onValueChange={setStatusDestino} className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Fila de Serviço" id="fila-servico" />
                  <Label htmlFor="fila-servico" className="font-normal cursor-pointer">
                    Fila de Serviço
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Serviço Externo" id="servico-externo" />
                  <Label htmlFor="servico-externo" className="font-normal cursor-pointer">
                    Serviço Externo
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Informe detalhes adicionais sobre o retorno da ordem para a oficina"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Confirmar Retorno"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
