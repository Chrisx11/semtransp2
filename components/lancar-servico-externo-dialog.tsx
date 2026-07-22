"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Car, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Veiculo } from "@/services/veiculo-service"
import { SelecionarVeiculoDialog } from "@/components/selecionar-veiculo-dialog"
import { getColaboradores, type Colaborador } from "@/services/colaborador-service"
import { createServicoExterno } from "@/services/servico-externo-service"
import { gerarCanhotoServicoExternoPDF } from "@/utils/canhoto-servico-externo-utils"

interface LancarServicoExternoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function isMecanico(funcao?: string | null) {
  if (!funcao) return false
  const normalizada = funcao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
  return normalizada.includes("MECANICO")
}

export function LancarServicoExternoDialog({
  open,
  onOpenChange,
  onSuccess,
}: LancarServicoExternoDialogProps) {
  const { toast } = useToast()
  const [veiculoDialogOpen, setVeiculoDialogOpen] = useState(false)
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null)
  const [mecanicos, setMecanicos] = useState<Colaborador[]>([])
  const [filteredMecanicos, setFilteredMecanicos] = useState<Colaborador[]>([])
  const [fornecedorId, setFornecedorId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [servicoSolicitado, setServicoSolicitado] = useState("")
  const [valorInput, setValorInput] = useState("0,00")
  const [dataAutorizacao, setDataAutorizacao] = useState<Date>(new Date())
  const [observacoes, setObservacoes] = useState("")
  const [gerarCanhoto, setGerarCanhoto] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setVeiculo(null)
    setFornecedorId("")
    setSearchTerm("")
    setServicoSolicitado("")
    setValorInput("0,00")
    setDataAutorizacao(new Date())
    setObservacoes("")
    setGerarCanhoto(true)
  }

  useEffect(() => {
    if (open) {
      resetForm()
      loadMecanicos()
    }
  }, [open])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMecanicos(mecanicos)
      return
    }
    const term = searchTerm.toLowerCase()
    setFilteredMecanicos(
      mecanicos.filter(
        (m) =>
          m.nome.toLowerCase().includes(term) ||
          (m.funcao && m.funcao.toLowerCase().includes(term)) ||
          (m.secretaria && m.secretaria.toLowerCase().includes(term)),
      ),
    )
  }, [searchTerm, mecanicos])

  const loadMecanicos = async () => {
    setIsLoading(true)
    try {
      const data = await getColaboradores()
      const lista = data
        .filter((c) => isMecanico(c.funcao))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      setMecanicos(lista)
      setFilteredMecanicos(lista)
    } catch (error) {
      console.error("Erro ao carregar mecânicos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os mecânicos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const parseValor = (raw: string): number => {
    const num = parseFloat(raw.replace(/\./g, "").replace(",", "."))
    return Number.isNaN(num) ? 0 : num
  }

  const handleSubmit = async () => {
    if (!veiculo) {
      toast({ title: "Veículo obrigatório", description: "Selecione o veículo.", variant: "destructive" })
      return
    }
    if (!fornecedorId) {
      toast({ title: "Fornecedor obrigatório", description: "Selecione o fornecedor.", variant: "destructive" })
      return
    }
    if (!servicoSolicitado.trim()) {
      toast({ title: "Serviço obrigatório", description: "Descreva o serviço solicitado.", variant: "destructive" })
      return
    }

    const fornecedor = mecanicos.find((m) => m.id === fornecedorId)
    if (!fornecedor) return

    setIsSubmitting(true)
    try {
      const valor = parseValor(valorInput)
      const criado = await createServicoExterno({
        ordemServicoId: null,
        ordemServicoNumero: "Sem OS",
        veiculoId: veiculo.id,
        veiculoPlaca: veiculo.placa,
        veiculoModelo: veiculo.modelo,
        veiculoMarca: veiculo.marca,
        veiculoSecretaria: veiculo.secretaria,
        fornecedorId: fornecedor.id,
        fornecedorNome: fornecedor.nome,
        servicoSolicitado: servicoSolicitado.trim(),
        valor,
        dataAutorizacao: dataAutorizacao.toISOString().split("T")[0],
        observacoes: observacoes.trim() || null,
      })

      if (gerarCanhoto) {
        try {
          await gerarCanhotoServicoExternoPDF({
            ordemServico: {
              id: criado.id,
              numero: "Sem OS",
              veiculoId: veiculo.id,
              veiculoInfo: `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`,
              solicitanteInfo: "",
              status: "Serviço Externo",
              kmAtual: "",
              defeitosRelatados: observacoes || "",
            } as any,
            fornecedorNome: fornecedor.nome,
            servicoSolicitado: servicoSolicitado.trim(),
            dataAutorizacao,
          })
        } catch (e) {
          console.error("Erro ao gerar canhoto:", e)
          toast({
            title: "Serviço lançado, mas o canhoto falhou",
            description: "O lançamento foi salvo. Você pode gerar o canhoto depois na lista.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Serviço externo lançado",
        description: `Lançamento criado para o veículo ${veiculo.placa} sem ordem de serviço.`,
      })
      onOpenChange(false)
      resetForm()
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao lançar serviço externo:", error)
      toast({
        title: "Erro ao lançar",
        description: error instanceof Error ? error.message : "Não foi possível lançar o serviço externo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lançar Serviço Externo</DialogTitle>
            <DialogDescription>
              Cadastre um serviço externo diretamente, sem vincular a uma ordem de serviço.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Veículo *</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setVeiculoDialogOpen(true)}
              >
                <Car className="mr-2 h-4 w-4" />
                {veiculo
                  ? `${veiculo.placa} — ${veiculo.marca} ${veiculo.modelo}`
                  : "Selecionar veículo"}
              </Button>
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
                    {filteredMecanicos.length > 0 ? (
                      filteredMecanicos.map((mecanico) => (
                        <SelectItem
                          key={mecanico.id}
                          value={mecanico.id}
                          onSelect={() => {
                            setFornecedorId(mecanico.id)
                            setIsSelectOpen(false)
                            setSearchTerm("")
                          }}
                        >
                          {mecanico.nome}
                          {mecanico.funcao ? ` (${mecanico.funcao})` : ""}
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
                placeholder="Descreva o serviço que será realizado..."
                value={servicoSolicitado}
                onChange={(e) => setServicoSolicitado(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Autorização *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataAutorizacao && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataAutorizacao
                        ? format(dataAutorizacao, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataAutorizacao}
                      onSelect={(d) => d && setDataAutorizacao(d)}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  value={valorInput}
                  onChange={(e) => setValorInput(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações opcionais..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={gerarCanhoto}
                onChange={(e) => setGerarCanhoto(e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              Gerar canhoto em PDF ao salvar
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!veiculo || !fornecedorId || !servicoSolicitado.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lançar Serviço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelecionarVeiculoDialog
        open={veiculoDialogOpen}
        onOpenChange={setVeiculoDialogOpen}
        onSelect={(v) => {
          setVeiculo(v)
          setVeiculoDialogOpen(false)
        }}
      />
    </>
  )
}
