"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CornerDownLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { retornarParaAlmoxarifadoSupabase } from "@/services/ordem-servico-service"
import { useAuth } from "@/lib/auth-context"

interface RetornarAlmoxarifadoComprasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordemId: string | null
  onSuccess: () => void
}

export function RetornarAlmoxarifadoComprasDialog({
  open,
  onOpenChange,
  ordemId,
  onSuccess,
}: RetornarAlmoxarifadoComprasDialogProps) {
  const [observacoes, setObservacoes] = useState("")
  const [statusDestino, setStatusDestino] = useState("Aguardando OS")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!ordemId) return

    setIsSubmitting(true)

    try {
      // Atualizar o status da ordem para o status selecionado
      const resultado = await retornarParaAlmoxarifadoSupabase(
        ordemId, 
        observacoes, 
        statusDestino,
        user?.id,
        user?.nome || user?.login || "Sistema"
      )

      if (!resultado) {
        throw new Error("Não foi possível atualizar a ordem de serviço")
      }

      toast({
        title: "Ordem retornada para o almoxarifado",
        description: `A ordem de serviço foi retornada para o almoxarifado com status "${statusDestino}" com sucesso.`,
      })

      // Limpar o campo de observações
      setObservacoes("")
      setStatusDestino("Aguardando peças")

      // Fechar o diálogo
      onOpenChange(false)

      // Notificar o componente pai sobre o sucesso
      onSuccess()
    } catch (error) {
      toast({
        title: "Erro ao retornar para o almoxarifado",
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
            Retornar para Almoxarifado
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4">
            Esta ação irá retornar a ordem de serviço para o Almoxarifado com o status selecionado.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status-destino">Selecione o status de destino</Label>
              <RadioGroup value={statusDestino} onValueChange={setStatusDestino} className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Aguardando OS" id="aguardando-os" />
                  <Label htmlFor="aguardando-os" className="font-normal cursor-pointer">
                    Aguardando OS
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Aguardando Fornecedor" id="aguardando-fornecedor" />
                  <Label htmlFor="aguardando-fornecedor" className="font-normal cursor-pointer">
                    Aguardando Fornecedor
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Serviço Externo" id="servico-externo" />
                  <Label htmlFor="servico-externo" className="font-normal cursor-pointer">
                    Serviço Externo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Comprar na Rua" id="comprar-rua" />
                  <Label htmlFor="comprar-rua" className="font-normal cursor-pointer">
                    Comprar na Rua
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informe detalhes adicionais sobre o retorno da ordem para o Almoxarifado"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="min-h-[100px]"
                required
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
