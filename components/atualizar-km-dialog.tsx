"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { HistoricoItem } from "./historico-trocas-dialog"

interface AtualizarKmDialogProps {
  isOpen: boolean
  onClose: () => void
  veiculo: {
    id: string
    placa: string
    marca: string
    modelo: string
    medicao: "Hodometro" | "Horimetro"
    kmAtual: number
    kmProxTroca: number
    historico: HistoricoItem[]
  }
  onSuccess: (novoKm: number) => void
}

export function AtualizarKmDialog({ isOpen, onClose, veiculo, onSuccess }: AtualizarKmDialogProps) {
  const [kmAtual, setKmAtual] = useState(veiculo.kmAtual !== undefined ? veiculo.kmAtual.toString() : "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const kmAtualNum = Number.parseInt(kmAtual)
    if (isNaN(kmAtualNum) || kmAtualNum <= 0) {
      toast({
        title: "Erro de validação",
        description: `Por favor, insira um valor de ${veiculo.medicao === "Hodometro" ? "quilometragem" : "hora"} válido.`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }
    if (kmAtualNum <= veiculo.kmAtual) {
      toast({
        title: "Erro de validação",
        description: `A ${veiculo.medicao === "Hodometro" ? "quilometragem" : "hora"} atual não pode ser menor ou igual à anterior.`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Chamar o callback com o novo valor de km
      onSuccess(kmAtualNum);
      
      // Fechar o diálogo
      onClose();
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar quilometragem",
        description: err && err.message ? err.message : "Ocorreu um erro ao processar a solicitação.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Texto para o tipo de medição
  const unidade = veiculo.medicao === "Hodometro" ? "Km" : "Horas"
  const titulo = veiculo.medicao === "Hodometro" ? "Atualizar Quilometragem" : "Atualizar Horímetro"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Atualize o {veiculo.medicao.toLowerCase()} atual do veículo {veiculo.marca} {veiculo.modelo} (
            {veiculo.placa}).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="kmAtual" className="text-right">
              {unidade} Atual
            </Label>
            <Input
              id="kmAtual"
              type="number"
              value={kmAtual}
              onChange={(e) => setKmAtual(e.target.value)}
              className="col-span-3"
              min={veiculo.kmAtual + 1}
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-muted-foreground">Anterior</Label>
            <div className="col-span-3 text-muted-foreground">
              {veiculo.kmAtual !== undefined ? veiculo.kmAtual.toLocaleString() : "-"} {unidade}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Atualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}