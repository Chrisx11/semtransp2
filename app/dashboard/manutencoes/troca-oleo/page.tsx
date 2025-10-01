"use client"

import { useState, useEffect } from "react"
import { getVeiculosSupabase, updateVeiculoSupabase } from "@/services/veiculo-service"
import { 
  getTrocasOleo, 
  registrarTrocaOleo, 
  atualizarKmVeiculo, 
  getEstatisticasTrocasOleo,
  TrocaOleo 
} from "@/services/troca-oleo-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Trash2, CheckCircle, AlertCircle, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import * as XLSX from "xlsx"
import { format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  kmAtual?: number
  periodoTrocaOleo?: number
  periodotrocaoleo?: number
}

interface VeiculoComDados extends Veiculo {
  ultimaTroca: TrocaOleo | null
  kmAtual: number
  kmProxTroca: number
  progresso: number
}

// Interface para o relatório de importação
interface RelatorioImportacao {
  totalAtualizados: number
  totalRejeitados: number
}

// Definir tipos para ordenação
type SortColumn = 'veiculo' | 'kmAtual' | 'kmProxTroca' | 'progresso'
type SortDirection = 'asc' | 'desc' | null

export default function TrocaOleoPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [veiculosComDados, setVeiculosComDados] = useState<VeiculoComDados[]>([])
  const [veiculosFiltrados, setVeiculosFiltrados] = useState<VeiculoComDados[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [atualizarKmDialogOpen, setAtualizarKmDialogOpen] = useState(false)
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoComDados | null>(null)
  const [kmAtual, setKmAtual] = useState("")
  const [kmProxTroca, setKmProxTroca] = useState("")
  const [observacao, setObservacao] = useState("")
  const [dataInput, setDataInput] = useState("")
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false)
  const [historicoVeiculo, setHistoricoVeiculo] = useState<TrocaOleo[]>([])
  const [confirmacaoExclusaoAberta, setConfirmacaoExclusaoAberta] = useState(false)
  const [registroParaExcluir, setRegistroParaExcluir] = useState<TrocaOleo | null>(null)
  const [importResults, setImportResults] = useState<any[]>([])
  const [relatorioImport, setRelatorioImport] = useState<RelatorioImportacao>({ totalAtualizados: 0, totalRejeitados: 0 })
  const [relatorioModalOpen, setRelatorioModalOpen] = useState(false)
  // Estados para ordenação
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    carregarVeiculos()
  }, [])
  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setVeiculosFiltrados(ordenarVeiculos(veiculosComDados))
      return
    }
    
    const termoBusca = searchTerm.toLowerCase().trim()
    const resultados = veiculosComDados.filter(veiculo => 
      veiculo.placa.toLowerCase().includes(termoBusca) ||
      veiculo.modelo.toLowerCase().includes(termoBusca) ||
      veiculo.marca.toLowerCase().includes(termoBusca)
    )
    
    setVeiculosFiltrados(ordenarVeiculos(resultados))
  }, [searchTerm, veiculosComDados, sortColumn, sortDirection])
  
  useEffect(() => {
    const hoje = new Date()
    const dia = hoje.getDate().toString().padStart(2, "0")
    const mes = (hoje.getMonth() + 1).toString().padStart(2, "0")
    const ano = hoje.getFullYear()
    setDataInput(`${dia}/${mes}/${ano}`)
  }, [])

  // Função para ordenar veículos com base na coluna e direção selecionadas
  const ordenarVeiculos = (veiculos: VeiculoComDados[]): VeiculoComDados[] => {
    if (!sortColumn || !sortDirection) {
      return veiculos
    }

    return [...veiculos].sort((a, b) => {
      let comparacao = 0
      
      switch (sortColumn) {
        case 'veiculo':
          comparacao = a.placa.localeCompare(b.placa)
          break
        case 'kmAtual':
          comparacao = a.kmAtual - b.kmAtual
          break
        case 'kmProxTroca':
          comparacao = a.kmProxTroca - b.kmProxTroca
          break
        case 'progresso':
          comparacao = a.progresso - b.progresso
          break
      }
      
      return sortDirection === 'asc' ? comparacao : -comparacao
    })
  }

  // Função para alternar a ordenação quando um cabeçalho é clicado
  const alternarOrdenacao = (coluna: SortColumn) => {
    if (sortColumn === coluna) {
      // Se a mesma coluna for clicada, alterne a direção ou redefina
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      // Se uma nova coluna for clicada, defina-a como ascendente
      setSortColumn(coluna)
      setSortDirection('asc')
    }
  }

  // Função para renderizar o ícone de ordenação
  const renderSortIcon = (coluna: SortColumn) => {
    if (sortColumn !== coluna) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    
    return <ArrowDown className="ml-2 h-4 w-4" />
  }
  
  async function carregarVeiculos() {
    setLoading(true)
    try {
      // Buscar todos os veículos diretamente do banco para obter o periodotrocaoleo
      const { data: veiculosData, error } = await supabase
        .from("veiculos")
        .select("*")
        .order("placa")
      
      if (error) throw error
      
      setVeiculos(veiculosData || [])
      
      // Buscar dados de troca de óleo para cada veículo
      const veiculosPromises = veiculosData.map(async (veiculo) => {
        const estatisticas = await getEstatisticasTrocasOleo(veiculo.id)
        return {
          ...veiculo,
          ultimaTroca: estatisticas.ultimaTroca,
          kmAtual: estatisticas.kmAtual || veiculo.kmAtual || 0,
          kmProxTroca: estatisticas.kmProxTroca || 0,
          progresso: estatisticas.progresso
        }
      })
      
      const veiculosProcessados = await Promise.all(veiculosPromises)
      setVeiculosComDados(veiculosProcessados)
      setVeiculosFiltrados(ordenarVeiculos(veiculosProcessados))
    } catch (error) {
      console.error("Erro ao carregar veículos:", error)
    } finally {
      setLoading(false)
    }
  }
  
  async function registrarTrocaOleoAction() {
    if (!veiculoSelecionado || !kmAtual || !kmProxTroca) return
    
    if (!validarData(dataInput)) {
      toast({
        title: "Data inválida",
        description: "Por favor, insira uma data válida no formato DD/MM/AAAA",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      const dataISO = toISODate(dataInput)
      
      const dadosTroca = {
        veiculo_id: veiculoSelecionado.id,
        data_troca: dataISO,
        km_anterior: veiculoSelecionado.kmAtual,
        km_atual: Number(kmAtual),
        km_proxima_troca: Number(kmProxTroca),
        tipo_servico: "Troca de Óleo",
        observacao: observacao || undefined
      }
      
      console.log("Tentando registrar troca de óleo:", dadosTroca)
      
      const { data, error } = await supabase
        .from("trocas_oleo")
        .insert([{
          veiculo_id: veiculoSelecionado.id,
          data_troca: dataISO,
          km_anterior: Number(veiculoSelecionado.kmAtual),
          km_atual: Number(kmAtual),
          km_proxima_troca: Number(kmProxTroca),
          tipo_servico: "Troca de Óleo",
          observacao: observacao || null
        }])
        .select()
      
      if (error) {
        console.error("Erro SQL ao registrar troca:", error)
        toast({
          variant: "destructive",
          title: "Erro ao registrar troca",
          description: error.message,
          duration: 5000,
        })
        throw error
      }
      
      console.log("Troca registrada com sucesso:", data)
      
      toast({
        title: "Troca de óleo registrada",
        description: "Registro efetuado com sucesso",
        duration: 3000,
        className: "bg-green-50 border-green-200 text-green-900",
      })
      
      setKmAtual("")
      setKmProxTroca("")
      setObservacao("")
      setDialogOpen(false)
      
      await carregarVeiculos()
    } catch (error) {
      console.error("Erro ao registrar troca de óleo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao registrar troca",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function atualizarKmAction() {
    if (!veiculoSelecionado || !kmAtual) return
    
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from("trocas_oleo")
        .insert([{
          veiculo_id: veiculoSelecionado.id,
          data_troca: new Date().toISOString(),
          km_anterior: Number(veiculoSelecionado.kmAtual),
          km_atual: Number(kmAtual),
          km_proxima_troca: Number(veiculoSelecionado.kmProxTroca),
          tipo_servico: "Atualização de Km",
          observacao: observacao || "Atualização de quilometragem"
        }])
        .select()
      
      if (error) {
        console.error("Erro SQL ao atualizar km:", error)
        toast({
          variant: "destructive",
          title: "Erro ao atualizar quilometragem",
          description: error.message,
          duration: 5000,
        })
        throw error
      }
      
      console.log("Km atualizado com sucesso:", data)
      
      toast({
        title: "Quilometragem atualizada",
        description: "Atualização efetuada com sucesso",
        duration: 3000,
        className: "bg-green-50 border-green-200 text-green-900",
      })
      
      setKmAtual("")
      setObservacao("")
      setAtualizarKmDialogOpen(false)
      
      await carregarVeiculos()
    } catch (error) {
      console.error("Erro ao atualizar km:", error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar quilometragem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }
  
  function calcularProximaTroca(kmAtualValue: string, veiculo: VeiculoComDados): string {
    if (!kmAtualValue) return ""
    
    const periodoTroca = veiculo.periodotrocaoleo || veiculo.periodoTrocaOleo || 5000
    
    return (Number(kmAtualValue) + periodoTroca).toString()
  }

  function abrirDialogTrocaOleo(veiculo: VeiculoComDados) {
    setVeiculoSelecionado(veiculo)
    
    const kmAtualInicial = veiculo.kmAtual.toString()
    setKmAtual(kmAtualInicial)
    
    setKmProxTroca(calcularProximaTroca(kmAtualInicial, veiculo))
    
    setDialogOpen(true)
  }

  function abrirDialogAtualizarKm(veiculo: VeiculoComDados) {
    setVeiculoSelecionado(veiculo)
    setKmAtual(veiculo.kmAtual.toString())
    setAtualizarKmDialogOpen(true)
  }

  async function abrirHistorico(veiculo: VeiculoComDados) {
    setVeiculoSelecionado(veiculo)
    try {
      const historico = await getTrocasOleo(veiculo.id)
      setHistoricoVeiculo(historico)
      setHistoricoDialogOpen(true)
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    }
  }

  function getCorProgresso(progresso: number) {
    if (progresso < 50) return "bg-green-500"
    if (progresso < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  async function excluirRegistro(registro: TrocaOleo) {
    setRegistroParaExcluir(registro)
    setConfirmacaoExclusaoAberta(true)
  }

  async function confirmarExclusao() {
    if (!registroParaExcluir) return
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from("trocas_oleo")
        .delete()
        .eq("id", registroParaExcluir.id)
      
      if (error) {
        console.error("Erro ao excluir registro:", error)
        toast({
          variant: "destructive",
          title: "Erro ao excluir registro",
          description: error.message,
          duration: 5000,
        })
        throw error
      }
      
      setConfirmacaoExclusaoAberta(false)
      setRegistroParaExcluir(null)
      
      if (veiculoSelecionado && historicoDialogOpen) {
        const historico = await getTrocasOleo(veiculoSelecionado.id)
        setHistoricoVeiculo(historico)
      }
      
      await carregarVeiculos()
      
      toast({
        title: "Registro excluído",
        description: "O registro foi removido com sucesso",
        duration: 3000,
        className: "bg-green-50 border-green-200 text-green-900",
      })
    } catch (error) {
      console.error("Erro ao excluir registro:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir registro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleImportXLSX(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      const placaKmMap = new Map<string, number>()
      for (let i = 1; i < rows.length; i++) {
        const [placa, kmArquivo] = rows[i]
        if (!placa || !kmArquivo) continue
        placaKmMap.set(String(placa).replace(/\W/g, "").toLowerCase(), Number(kmArquivo))
      }
      const relatorio: any[] = []
      let atualizou = false
      let totalAtualizados = 0
      let totalRejeitados = 0
      for (const veiculo of veiculosComDados) {
        const placaNormalizada = veiculo.placa.replace(/\W/g, "").toLowerCase()
        const kmArquivo = placaKmMap.get(placaNormalizada)
        if (kmArquivo !== undefined && kmArquivo > veiculo.kmAtual) {
          try {
            const registro = await atualizarKmVeiculo(veiculo.id, kmArquivo, veiculo.kmProxTroca)
            await updateVeiculoSupabase(veiculo.id, { kmAtual: kmArquivo })
            totalAtualizados++
            atualizou = true
          } catch (err: any) {
            totalRejeitados++
          }
        } else if (kmArquivo !== undefined) {
          totalRejeitados++
        }
      }
      if (atualizou) await carregarVeiculos()
      setRelatorioImport({ totalAtualizados, totalRejeitados })
      setRelatorioModalOpen(true)
    }
    reader.readAsArrayBuffer(file)
  }

  const formatarData = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    const limitedValue = numericValue.slice(0, 8)

    let formattedDate = ""

    if (limitedValue.length <= 2) {
      formattedDate = limitedValue
    } else if (limitedValue.length <= 4) {
      formattedDate = `${limitedValue.slice(0, 2)}/${limitedValue.slice(2)}`
    } else {
      formattedDate = `${limitedValue.slice(0, 2)}/${limitedValue.slice(2, 4)}/${limitedValue.slice(4)}`
    }

    return formattedDate
  }

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedValue = formatarData(value)
    setDataInput(formattedValue)
  }

  const validarData = (dataStr: string): boolean => {
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
    return (
      data.getDate() === dia &&
      data.getMonth() === mes &&
      data.getFullYear() === ano
    )
  }

  const toISODate = (dateStr: string): string => {
    if (!validarData(dateStr)) return ""
    const [dia, mes, ano] = dateStr.split('/')
    // Criar a data com o fuso horário de Brasília (UTC-3)
    return `${ano}-${mes}-${dia}T00:00:00-03:00`
  }

  return (
    <div className="container mx-auto py-6">
      <Toaster />
      
      <h1 className="text-2xl font-bold mb-6">Controle de Troca de Óleo</h1>
      
      <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por placa, marca ou modelo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={carregarVeiculos} disabled={loading}>
            Atualizar dados
          </Button>
          <label htmlFor="import-xlsx" className="inline-block">
            <Button asChild type="button" variant="secondary">
              <span>Importar XLSX</span>
            </Button>
            <input
              id="import-xlsx"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportXLSX}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>
      
      {importResults.length > 0 && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Resultado da Importação</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Km no Site</TableHead>
                <TableHead>Km do Arquivo</TableHead>
                <TableHead>Novo Km</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importResults.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.placa}</TableCell>
                  <TableCell>{r.kmSite ?? '-'}</TableCell>
                  <TableCell>{r.kmArquivo ?? '-'}</TableCell>
                  <TableCell>{r.novoKm ?? '-'}</TableCell>
                  <TableCell>{r.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {loading && veiculos.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : veiculosComDados.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhum veículo encontrado no sistema</p>
      ) : veiculosFiltrados.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum veículo encontrado para a busca "{searchTerm}"
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => alternarOrdenacao('veiculo')}
              >
                <div className="flex items-center">
                  Veículo
                  {renderSortIcon('veiculo')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => alternarOrdenacao('kmAtual')}
              >
                <div className="flex items-center">
                  Km Atual
                  {renderSortIcon('kmAtual')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => alternarOrdenacao('kmProxTroca')}
              >
                <div className="flex items-center">
                  Próxima Troca
                  {renderSortIcon('kmProxTroca')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => alternarOrdenacao('progresso')}
              >
                <div className="flex items-center">
                  Progresso
                  {renderSortIcon('progresso')}
                </div>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {veiculosFiltrados.map((veiculo) => {
              const progressoClass = getCorProgresso(veiculo.progresso)
              
              return (
                <TableRow key={veiculo.id}>
                  <TableCell>
                    <div className="font-medium">{veiculo.placa}</div>
                    <div className="text-sm text-muted-foreground">
                      {veiculo.modelo} {veiculo.marca} 
                      {veiculo.periodotrocaoleo && 
                        <span className="ml-2">(Troca: {veiculo.periodotrocaoleo.toLocaleString()} km)</span>}
                    </div>
                  </TableCell>
                  <TableCell>{veiculo.kmAtual.toLocaleString()} km</TableCell>
                  <TableCell>{veiculo.kmProxTroca.toLocaleString()} km</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={veiculo.progresso} className="h-2 w-full" indicatorClassName={progressoClass} />
                      <span className="text-sm w-10">{veiculo.progresso}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => abrirDialogTrocaOleo(veiculo)}
                      >
                        Troca de Óleo
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => abrirDialogAtualizarKm(veiculo)}
                      >
                        Atualizar Km
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => abrirHistorico(veiculo)}
                      >
                        Histórico
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Troca de Óleo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <p className="mb-2 text-sm font-medium">
                Veículo: {veiculoSelecionado?.placa} ({veiculoSelecionado?.modelo})
              </p>
              {veiculoSelecionado?.periodotrocaoleo && (
                <p className="text-xs text-muted-foreground">
                  Período de troca: {veiculoSelecionado.periodotrocaoleo.toLocaleString()} km
                </p>
              )}
            </div>
            <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
              <label className="text-sm font-medium">Data da Troca</label>
              <Input
                value={dataInput}
                onChange={handleDataChange}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">Digite a data no formato DD/MM/AAAA</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Km Atual</label>
                <Input 
                  type="number" 
                  value={kmAtual} 
                  onChange={(e) => {
                    const valor = e.target.value
                    setKmAtual(valor)
                    if (veiculoSelecionado) {
                      setKmProxTroca(calcularProximaTroca(valor, veiculoSelecionado))
                    }
                  }} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Km Próx. Troca</label>
                <Input 
                  type="number" 
                  value={kmProxTroca} 
                  onChange={(e) => setKmProxTroca(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observação</label>
              <Input 
                value={observacao} 
                onChange={(e) => setObservacao(e.target.value)} 
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={registrarTrocaOleoAction}
              disabled={loading || !kmAtual || !kmProxTroca}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={atualizarKmDialogOpen} onOpenChange={setAtualizarKmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Km</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <p className="mb-2 text-sm font-medium">
                Veículo: {veiculoSelecionado?.placa} ({veiculoSelecionado?.modelo})
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Km Atual</label>
              <Input 
                type="number" 
                value={kmAtual} 
                onChange={(e) => setKmAtual(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observação</label>
              <Input 
                value={observacao} 
                onChange={(e) => setObservacao(e.target.value)} 
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAtualizarKmDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={atualizarKmAction}
              disabled={loading || !kmAtual}
            >
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Histórico - {veiculoSelecionado?.placa} ({veiculoSelecionado?.modelo})
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {historicoVeiculo.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum registro encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Km Anterior</TableHead>
                    <TableHead>Km Atual</TableHead>
                    <TableHead>Km Próx. Troca</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoVeiculo.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>{new Date(registro.data_troca).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{registro.tipo_servico}</TableCell>
                      <TableCell>{registro.km_anterior.toLocaleString()}</TableCell>
                      <TableCell>{registro.km_atual.toLocaleString()}</TableCell>
                      <TableCell>{registro.km_proxima_troca.toLocaleString()}</TableCell>
                      <TableCell>{registro.observacao || "-"}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => excluirRegistro(registro)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setHistoricoDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={confirmacaoExclusaoAberta} onOpenChange={setConfirmacaoExclusaoAberta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {registroParaExcluir && (
            <div className="py-4">
              <p className="text-sm"><strong>Data:</strong> {new Date(registroParaExcluir.data_troca).toLocaleDateString('pt-BR')}</p>
              <p className="text-sm"><strong>Tipo:</strong> {registroParaExcluir.tipo_servico}</p>
              <p className="text-sm"><strong>Km Atual:</strong> {registroParaExcluir.km_atual.toLocaleString()}</p>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmacaoExclusaoAberta(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={loading}
            >
              {loading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={relatorioModalOpen} onOpenChange={setRelatorioModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Resumo da Importação</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="mb-2 text-lg font-semibold text-green-700">
              {relatorioImport.totalAtualizados ?? 0} veículo(s) atualizado(s)
            </div>
            <div className="mb-2 text-lg font-semibold text-red-700">
              {relatorioImport.totalRejeitados ?? 0} linha(s) rejeitada(s)
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              Imprimir Resumo
            </Button>
            <Button onClick={() => setRelatorioModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
