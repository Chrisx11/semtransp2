"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { getColaboradores, type Colaborador } from "@/services/colaborador-service"
import { type OrdemServico } from "@/services/ordem-servico-service"
import { Loader2, Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ServicoExternoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordemServico: OrdemServico | null
  onConfirm: (fornecedorId: string, fornecedorNome: string, servicoSolicitado: string) => Promise<void>
}

export function ServicoExternoDialog({
  open,
  onOpenChange,
  ordemServico,
  onConfirm,
}: ServicoExternoDialogProps) {
  const [fornecedorId, setFornecedorId] = useState("")
  const [servicoSolicitado, setServicoSolicitado] = useState("")
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [filteredColaboradores, setFilteredColaboradores] = useState<Colaborador[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setFornecedorId("")
      setServicoSolicitado("")
      setSearchTerm("")
      loadColaboradores()
    }
  }, [open])

  const loadColaboradores = async () => {
    setIsLoading(true)
    try {
      const data = await getColaboradores()
      // Filtrar apenas colaboradores com função MECÂNICO
      const mecanicos = data.filter(
        (colaborador) => colaborador.funcao && colaborador.funcao.toUpperCase() === "MECÂNICO"
      )
      setColaboradores(mecanicos)
      setFilteredColaboradores(mecanicos)
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar colaboradores com base no termo de pesquisa
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredColaboradores(colaboradores)
      return
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filtered = colaboradores.filter(
      (colaborador) =>
        colaborador.nome.toLowerCase().includes(lowerSearchTerm) ||
        (colaborador.funcao && colaborador.funcao.toLowerCase().includes(lowerSearchTerm)) ||
        (colaborador.secretaria && colaborador.secretaria.toLowerCase().includes(lowerSearchTerm))
    )

    setFilteredColaboradores(filtered)
  }, [searchTerm, colaboradores])

  const handleSubmit = async () => {
    if (!fornecedorId || !servicoSolicitado.trim()) {
      return
    }

    const fornecedor = colaboradores.find((c) => c.id === fornecedorId)
    if (!fornecedor) {
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(fornecedorId, fornecedor.nome, servicoSolicitado.trim())
      onOpenChange(false)
      setFornecedorId("")
      setServicoSolicitado("")
      setSearchTerm("")
    } catch (error) {
      console.error("Erro ao confirmar serviço externo:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar para Serviço Externo</DialogTitle>
        </DialogHeader>

        {ordemServico && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Dados da Ordem de Serviço</Label>
              <div className="rounded-md border p-3 space-y-1 text-sm">
                <div><span className="font-medium">Número:</span> {ordemServico.numero}</div>
                <div><span className="font-medium">Veículo:</span> {ordemServico.veiculoInfo}</div>
                <div><span className="font-medium">Km Atual:</span> {ordemServico.kmAtual || "—"}</div>
                <div><span className="font-medium">Solicitante:</span> {ordemServico.solicitanteInfo}</div>
                <div><span className="font-medium">Status:</span> {ordemServico.status}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor (Mecânico) *</Label>
              <Select 
                value={fornecedorId} 
                onValueChange={setFornecedorId} 
                disabled={isLoading}
                open={isSelectOpen}
                onOpenChange={setIsSelectOpen}
              >
                <SelectTrigger id="fornecedor">
                  <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione o mecânico/fornecedor"} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar mecânico..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setIsSelectOpen(true)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    {filteredColaboradores.length > 0 ? (
                      filteredColaboradores.map((colaborador) => (
                        <SelectItem 
                          key={colaborador.id} 
                          value={colaborador.id}
                          onSelect={() => {
                            setFornecedorId(colaborador.id)
                            setIsSelectOpen(false)
                            setSearchTerm("")
                          }}
                        >
                          {colaborador.nome}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {searchTerm ? "Nenhum mecânico encontrado" : "Nenhum mecânico cadastrado"}
                      </div>
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico">Serviço Solicitado *</Label>
              <Textarea
                id="servico"
                placeholder="Descreva o serviço que será realizado pelo fornecedor..."
                value={servicoSolicitado}
                onChange={(e) => setServicoSolicitado(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!fornecedorId || !servicoSolicitado.trim() || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e Gerar Canhoto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

