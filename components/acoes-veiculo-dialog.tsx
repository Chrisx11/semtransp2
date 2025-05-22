"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Gauge, History, FuelIcon as Oil } from "lucide-react"

interface AcoesVeiculoDialogProps {
  isOpen: boolean
  onClose: () => void
  veiculo: {
    id: string
    placa: string
    marca: string
    modelo: string
  }
  onAtualizarKm: () => void
  onTrocaOleo: () => void
  onHistorico: () => void
}

export function AcoesVeiculoDialog({
  isOpen,
  onClose,
  veiculo,
  onAtualizarKm,
  onTrocaOleo,
  onHistorico,
}: AcoesVeiculoDialogProps) {
  const handleAction = (action: () => void) => {
    onClose()
    action()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ações do Veículo</DialogTitle>
          <DialogDescription>
            Selecione uma ação para o veículo {veiculo.marca} {veiculo.modelo} ({veiculo.placa})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="flex items-center justify-start gap-2 h-12"
            onClick={() => handleAction(onAtualizarKm)}
          >
            <Gauge className="h-5 w-5" />
            <span>Atualizar Km</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-start gap-2 h-12"
            onClick={() => handleAction(onTrocaOleo)}
          >
            <Oil className="h-5 w-5" />
            <span>Troca de Óleo</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-start gap-2 h-12"
            onClick={() => handleAction(onHistorico)}
          >
            <History className="h-5 w-5" />
            <span>Histórico</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
