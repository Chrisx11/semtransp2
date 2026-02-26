"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"
import { Search, Calendar, Clock, AlertCircle, History, Trash2, Pencil } from "lucide-react"

interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  tacografo: boolean
}

interface VistoriaTacografo {
  id: string
  veiculo_id: string
  data_vistoria: string
  created_at: string
}

interface VeiculoComVistoria extends Veiculo {
  ultimaVistoria: VistoriaTacografo | null
  dataValidade: Date | null
  diasTotais: number
  diasPassados: number
  diasRestantes: number
  progresso: number
  status: "EM_DIA" | "PROXIMO" | "VENCIDO" | "SEM_VISTORIA"
}

export default function VistoriaTacografoPage() {
  const isMobile = useIsMobile()
  const { toast } = useToast()

  const [veiculos, setVeiculos] = useState<VeiculoComVistoria[]>([])
  const [veiculosFiltrados, setVeiculosFiltrados] = useState<VeiculoComVistoria[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoComVistoria | null>(null)
  const [dataInput, setDataInput] = useState("")

  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false)
  const [historicoVistorias, setHistoricoVistorias] = useState<VistoriaTacografo[]>([])
  const [vistoriaEditando, setVistoriaEditando] = useState<VistoriaTacografo | null>(null)
  const [dataEdicao, setDataEdicao] = useState("")
  const [vistoriaExcluindo, setVistoriaExcluindo] = useState<VistoriaTacografo | null>(null)

  useEffect(() => {
    carregarVeiculosComTacografo()
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setVeiculosFiltrados(veiculos)
      return
    }

    const termo = searchTerm.toLowerCase().trim()
    setVeiculosFiltrados(
      veiculos.filter(
        (v) =>
          v.placa.toLowerCase().includes(termo) ||
          v.marca.toLowerCase().includes(termo) ||
          v.modelo.toLowerCase().includes(termo),
      ),
    )
  }, [searchTerm, veiculos])

  function adicionarAnos(data: Date, anos: number): Date {
    const nova = new Date(data)
    nova.setFullYear(nova.getFullYear() + anos)
    return nova
  }

  function diffDias(inicio: Date, fim: Date): number {
    const msPorDia = 1000 * 60 * 60 * 24
    const diffMs = fim.getTime() - inicio.getTime()
    return Math.round(diffMs / msPorDia)
  }

  function calcularProgresso(ultimaVistoria: Date | null): {
    dataValidade: Date | null
    diasTotais: number
    diasPassados: number
    diasRestantes: number
    progresso: number
    status: VeiculoComVistoria["status"]
  } {
    const doisAnosEmDias = 365 * 2

    if (!ultimaVistoria) {
      return {
        dataValidade: null,
        diasTotais: doisAnosEmDias,
        diasPassados: 0,
        diasRestantes: doisAnosEmDias,
        progresso: 0,
        status: "SEM_VISTORIA",
      }
    }

    const hoje = new Date()
    const dataValidade = adicionarAnos(ultimaVistoria, 2)
    const diasTotais = diffDias(ultimaVistoria, dataValidade)
    const diasPassados = Math.max(0, diffDias(ultimaVistoria, hoje))
    const diasRestantes = Math.max(0, diffDias(hoje, dataValidade))

    let progresso = diasTotais > 0 ? Math.round((diasPassados / diasTotais) * 100) : 0
    if (progresso > 100) progresso = 100
    if (progresso < 0) progresso = 0

    let status: VeiculoComVistoria["status"] = "EM_DIA"
    if (hoje > dataValidade) {
      status = "VENCIDO"
      progresso = 100
    } else if (diasRestantes <= 60) {
      status = "PROXIMO"
    }

    return {
      dataValidade,
      diasTotais,
      diasPassados,
      diasRestantes,
      progresso,
      status,
    }
  }

  async function carregarVeiculosComTacografo() {
    setLoading(true)
    try {
      const { data: veiculosData, error } = await supabase
        .from("veiculos")
        .select("id, placa, modelo, marca, tacografo")
        .eq("status", "Ativo")
        .eq("tacografo", true)
        .order("placa")

      if (error) throw error

      const veiculosLista = (veiculosData || []) as Veiculo[]

      if (veiculosLista.length === 0) {
        setVeiculos([])
        setVeiculosFiltrados([])
        return
      }

      const { data: vistoriasData, error: vistoriasError } = await supabase
        .from("vistorias_tacografo")
        .select("*")
        .in(
          "veiculo_id",
          veiculosLista.map((v) => v.id),
        )
        .order("data_vistoria", { ascending: false })

      if (vistoriasError) throw vistoriasError

      const vistoriasPorVeiculo: Record<string, VistoriaTacografo[]> = {}
      ;(vistoriasData || []).forEach((vistoria: any) => {
        const veiculoId = vistoria.veiculo_id
        if (!vistoriasPorVeiculo[veiculoId]) {
          vistoriasPorVeiculo[veiculoId] = []
        }
        vistoriasPorVeiculo[veiculoId].push(vistoria as VistoriaTacografo)
      })

      const hoje = new Date()

      const veiculosComVistoria: VeiculoComVistoria[] = veiculosLista.map((veiculo) => {
        const listaVistorias = vistoriasPorVeiculo[veiculo.id] || []
        const ultimaVistoria = listaVistorias.length > 0 ? listaVistorias[0] : null
        const dataUltima = ultimaVistoria ? new Date(ultimaVistoria.data_vistoria) : null

        const { dataValidade, diasTotais, diasPassados, diasRestantes, progresso, status } =
          calcularProgresso(dataUltima)

        return {
          ...veiculo,
          ultimaVistoria,
          dataValidade,
          diasTotais,
          diasPassados,
          diasRestantes,
          progresso,
          status,
        }
      })

      // Ordenar mostrando vencidos primeiro, depois próximos, depois em dia, depois sem vistoria
      const ordemStatus: Record<VeiculoComVistoria["status"], number> = {
        VENCIDO: 0,
        PROXIMO: 1,
        EM_DIA: 2,
        SEM_VISTORIA: 3,
      }

      veiculosComVistoria.sort((a, b) => {
        const statusDiff = ordemStatus[a.status] - ordemStatus[b.status]
        if (statusDiff !== 0) return statusDiff
        return a.placa.localeCompare(b.placa)
      })

      setVeiculos(veiculosComVistoria)
      setVeiculosFiltrados(veiculosComVistoria)
    } catch (error) {
      console.error("Erro ao carregar veículos com tacógrafo:", error)
      toast({
        title: "Erro ao carregar veículos",
        description: "Não foi possível carregar os veículos com tacógrafo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function formatarData(data: Date | null): string {
    if (!data) return "-"
    return data.toLocaleDateString("pt-BR")
  }

  function getStatusLabel(status: VeiculoComVistoria["status"]): string {
    switch (status) {
      case "EM_DIA":
        return "Em dia"
      case "PROXIMO":
        return "Próximo do vencimento"
      case "VENCIDO":
        return "Vencido"
      case "SEM_VISTORIA":
      default:
        return "Nunca vistoriado"
    }
  }

  function getStatusColor(status: VeiculoComVistoria["status"]): string {
    switch (status) {
      case "EM_DIA":
        return "bg-green-500"
      case "PROXIMO":
        return "bg-yellow-500"
      case "VENCIDO":
        return "bg-red-500"
      case "SEM_VISTORIA":
      default:
        return "bg-gray-400"
    }
  }

  function abrirDialogVistoria(veiculo: VeiculoComVistoria) {
    setVeiculoSelecionado(veiculo)
    const hoje = new Date()
    const dia = hoje.getDate().toString().padStart(2, "0")
    const mes = (hoje.getMonth() + 1).toString().padStart(2, "0")
    const ano = hoje.getFullYear()
    setDataInput(`${dia}/${mes}/${ano}`)
    setDialogOpen(true)
  }

  function formatarDataInput(value: string): string {
    const numericValue = value.replace(/\D/g, "")
    const limitedValue = numericValue.slice(0, 8)

    if (limitedValue.length <= 2) return limitedValue
    if (limitedValue.length <= 4) return `${limitedValue.slice(0, 2)}/${limitedValue.slice(2)}`
    return `${limitedValue.slice(0, 2)}/${limitedValue.slice(2, 4)}/${limitedValue.slice(4)}`
  }

  function handleDataChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDataInput(formatarDataInput(e.target.value))
  }

  function validarData(dataStr: string): boolean {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dataStr.match(regex)
    if (!match) return false
    const dia = Number.parseInt(match[1], 10)
    const mes = Number.parseInt(match[2], 10) - 1
    const ano = Number.parseInt(match[3], 10)
    if (dia < 1 || dia > 31) return false
    if (mes < 0 || mes > 11) return false
    if (ano < 1900 || ano > 2100) return false
    const data = new Date(ano, mes, dia)
    return data.getDate() === dia && data.getMonth() === mes && data.getFullYear() === ano
  }

  function toISODate(dateStr: string): string {
    if (!validarData(dateStr)) return ""
    const [dia, mes, ano] = dateStr.split("/")
    return `${ano}-${mes}-${dia}T00:00:00-03:00`
  }

  async function registrarVistoria() {
    if (!veiculoSelecionado) return

    if (!validarData(dataInput)) {
      toast({
        title: "Data inválida",
        description: "Por favor, insira uma data válida no formato DD/MM/AAAA",
        variant: "destructive",
      })
      return
    }

    try {
      const dataISO = toISODate(dataInput)

      const { data, error } = await supabase
        .from("vistorias_tacografo")
        .insert([
          {
            veiculo_id: veiculoSelecionado.id,
            data_vistoria: dataISO,
          },
        ])
        .select()

      if (error) throw error

      toast({
        title: "Vistoria registrada",
        description: `Vistoria de tacógrafo do veículo ${veiculoSelecionado.placa} registrada com sucesso.`,
      })

      setDialogOpen(false)
      setVeiculoSelecionado(null)

      await carregarVeiculosComTacografo()
    } catch (error: any) {
      console.error("Erro ao registrar vistoria de tacógrafo:", error)
      toast({
        title: "Erro ao registrar vistoria",
        description: error?.message ?? "Ocorreu um erro ao salvar a vistoria.",
        variant: "destructive",
      })
    }
  }

  async function abrirHistorico(veiculo: VeiculoComVistoria) {
    setVeiculoSelecionado(veiculo)
    try {
      const { data, error } = await supabase
        .from("vistorias_tacografo")
        .select("*")
        .eq("veiculo_id", veiculo.id)
        .order("data_vistoria", { ascending: false })

      if (error) throw error

      setHistoricoVistorias((data || []) as VistoriaTacografo[])
      setHistoricoDialogOpen(true)
    } catch (error: any) {
      console.error("Erro ao carregar histórico de vistorias:", error)
      toast({
        title: "Erro ao carregar histórico",
        description: error?.message ?? "Não foi possível carregar o histórico de vistorias.",
        variant: "destructive",
      })
    }
  }

  function abrirEdicao(vistoria: VistoriaTacografo) {
    setVistoriaEditando(vistoria)
    const data = new Date(vistoria.data_vistoria)
    const dia = data.getDate().toString().padStart(2, "0")
    const mes = (data.getMonth() + 1).toString().padStart(2, "0")
    const ano = data.getFullYear()
    setDataEdicao(`${dia}/${mes}/${ano}`)
  }

  async function salvarEdicao() {
    if (!vistoriaEditando) return

    if (!validarData(dataEdicao)) {
      toast({
        title: "Data inválida",
        description: "Por favor, insira uma data válida no formato DD/MM/AAAA",
        variant: "destructive",
      })
      return
    }

    try {
      const dataISO = toISODate(dataEdicao)

      const { error } = await supabase
        .from("vistorias_tacografo")
        .update({ data_vistoria: dataISO })
        .eq("id", vistoriaEditando.id)

      if (error) throw error

      toast({
        title: "Vistoria atualizada",
        description: "Data da vistoria atualizada com sucesso.",
      })

      if (veiculoSelecionado) {
        await abrirHistorico(veiculoSelecionado)
        await carregarVeiculosComTacografo()
      }

      setVistoriaEditando(null)
      setDataEdicao("")
    } catch (error: any) {
      console.error("Erro ao atualizar vistoria:", error)
      toast({
        title: "Erro ao atualizar vistoria",
        description: error?.message ?? "Ocorreu um erro ao atualizar a vistoria.",
        variant: "destructive",
      })
    }
  }

  async function confirmarExclusao() {
    if (!vistoriaExcluindo) return

    try {
      const { error } = await supabase
        .from("vistorias_tacografo")
        .delete()
        .eq("id", vistoriaExcluindo.id)

      if (error) throw error

      toast({
        title: "Vistoria excluída",
        description: "A vistoria foi removida com sucesso.",
      })

      if (veiculoSelecionado) {
        await abrirHistorico(veiculoSelecionado)
        await carregarVeiculosComTacografo()
      }

      setVistoriaExcluindo(null)
    } catch (error: any) {
      console.error("Erro ao excluir vistoria:", error)
      toast({
        title: "Erro ao excluir vistoria",
        description: error?.message ?? "Ocorreu um erro ao excluir a vistoria.",
        variant: "destructive",
      })
    }
  }

  const conteudo = (
    <div className="space-y-6">
      <Card className="shadow-md-custom">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, marca ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Validade das vistorias: <span className="font-semibold">2 anos</span>
            </div>
          </div>

          {loading ? (
            <div className="rounded-md border shadow-sm-custom overflow-hidden">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-muted-foreground">Carregando veículos com tacógrafo...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : veiculos.length === 0 ? (
            <div className="rounded-md border shadow-sm-custom overflow-hidden">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <p className="text-muted-foreground">
                        Nenhum veículo com tacógrafo foi encontrado. Marque a opção de tacógrafo no cadastro do
                        veículo.
                      </p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : veiculosFiltrados.length === 0 ? (
            <div className="rounded-md border shadow-sm-custom overflow-hidden">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <p className="text-muted-foreground">
                        Nenhum veículo encontrado para a busca "{searchTerm}".
                      </p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border shadow-sm-custom overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Última Vistoria</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculosFiltrados.map((veiculo) => {
                    const statusColor = getStatusColor(veiculo.status)
                    const statusLabel = getStatusLabel(veiculo.status)

                    return (
                      <TableRow key={veiculo.id}>
                        <TableCell>
                          <div className="font-medium">{veiculo.placa}</div>
                          <div className="text-sm text-muted-foreground">
                            {veiculo.modelo} {veiculo.marca}
                          </div>
                        </TableCell>
                        <TableCell>
                          {veiculo.ultimaVistoria ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatarData(new Date(veiculo.ultimaVistoria.data_vistoria))}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AlertCircle className="h-4 w-4" />
                              <span>Sem vistoria registrada</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {veiculo.dataValidade ? (
                            <div className="flex flex-col text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{formatarData(veiculo.dataValidade)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {veiculo.status === "VENCIDO"
                                    ? `Vencido há ${veiculo.diasPassados - veiculo.diasTotais} dia(s)`
                                    : `Faltam ${veiculo.diasRestantes} dia(s)`}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={veiculo.progresso} className="h-2 w-full" indicatorClassName={statusColor} />
                            <span className="text-sm w-10">{veiculo.progresso}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{statusLabel}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => abrirDialogVistoria(veiculo)}>
                              Registrar Vistoria
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => abrirHistorico(veiculo)}>
                              <History className="h-4 w-4 mr-1" />
                              Histórico
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Vistoria de Tacógrafo</DialogTitle>
            <DialogDescription>
              Veículo: {veiculoSelecionado?.marca} {veiculoSelecionado?.modelo} - Placa: {veiculoSelecionado?.placa}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
              <label className="text-sm font-medium">Data da Vistoria</label>
              <Input
                value={dataInput}
                onChange={handleDataChange}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">Digite a data no formato DD/MM/AAAA</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={registrarVistoria} disabled={!dataInput}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Histórico de Vistorias de Tacógrafo</DialogTitle>
            <DialogDescription>
              Veículo: {veiculoSelecionado?.marca} {veiculoSelecionado?.modelo} - Placa: {veiculoSelecionado?.placa}
            </DialogDescription>
          </DialogHeader>

          {historicoVistorias.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              <span>Nenhuma vistoria registrada para este veículo.</span>
            </div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto space-y-3 py-2">
              {historicoVistorias.map((vistoria) => {
                const data = new Date(vistoria.data_vistoria)
                return (
                  <div
                    key={vistoria.id}
                    className="border rounded-lg p-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{data.toLocaleDateString("pt-BR")}</div>
                        <div className="text-xs text-muted-foreground">
                          Registrada em{" "}
                          {new Date(vistoria.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => abrirEdicao(vistoria)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setVistoriaExcluindo(vistoria)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setHistoricoDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!vistoriaEditando} onOpenChange={(open) => !open && setVistoriaEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Data da Vistoria</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data da Vistoria</label>
              <Input
                value={dataEdicao}
                onChange={(e) => setDataEdicao(formatarDataInput(e.target.value))}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">Digite a data no formato DD/MM/AAAA</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVistoriaEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao} disabled={!dataEdicao}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!vistoriaExcluindo} onOpenChange={(open) => !open && setVistoriaExcluindo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Vistoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm">
            {vistoriaExcluindo && (
              <p>
                Data:{" "}
                {new Date(vistoriaExcluindo.data_vistoria).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVistoriaExcluindo(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarExclusao}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return (
    <>
      <Toaster />
      {isMobile ? (
        <div className="p-4 space-y-6">
          <MobileBackButton />
          {conteudo}
        </div>
      ) : (
        conteudo
      )}
    </>
  )
}


