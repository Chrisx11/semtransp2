"use client"

import { useEffect, useState, Fragment } from "react"
import type { Veiculo } from "@/services/veiculo-service"
import type { Saida } from "@/services/saida-service"
import { getVeiculosSupabase } from "@/services/veiculo-service"
import { getSaidasSupabase } from "@/services/saida-service"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Tipo estendido
interface CustoVeiculoItem extends Veiculo {
  custoTotal: number
  saidas: Saida[]
  custoMensal: number
}

export default function CustoVeiculoPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [dateFilters, setDateFilters] = useState<Record<string, { start?: string; end?: string }>>({})
  const [placaQuery, setPlacaQuery] = useState("")
  const [cardStartDate, setCardStartDate] = useState<string>("")
  const [cardEndDate, setCardEndDate] = useState<string>("")

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [veics, saids] = await Promise.all([
        getVeiculosSupabase(),
        getSaidasSupabase()
      ])
      setVeiculos(veics)
      setSaidas(saids)
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Calcular custo por veículo
  const custosPorVeiculo = veiculos.map(v => {
    const saidasVeiculo = saidas.filter(s => s.veiculoId === v.id)
    const total = saidasVeiculo.reduce((acc, s) => acc + ((s.valorUnitario ?? 0) * s.quantidade), 0)

    // Cálculo do custo mensal (mês vigente)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const mensal = saidasVeiculo.reduce((acc, s) => {
      if (!s.data) return acc
      const d = new Date(s.data)
      if (d >= monthStart && d <= monthEnd) {
        return acc + ((s.valorUnitario ?? 0) * s.quantidade)
      }
      return acc
    }, 0)

    return {
      ...v,
      custoTotal: total,
      saidas: saidasVeiculo,
      custoMensal: mensal,
    }
  }).sort((a, b) => b.custoMensal - a.custoMensal)

  const listaFiltrada = placaQuery
    ? custosPorVeiculo.filter(v => v.placa.toLowerCase().includes(placaQuery.toLowerCase()))
    : custosPorVeiculo

  const totalGeral = custosPorVeiculo.reduce((acc, v) => acc + v.custoTotal, 0)

  // Filtro por secretaria
  const [secretariaFilter, setSecretariaFilter] = useState<string>("all")
  const secretarias = Array.from(new Set(veiculos.map(v => v.secretaria).filter(Boolean))) as string[]

  const listaPorSecretaria = secretariaFilter !== 'all'
    ? listaFiltrada.filter(v => v.secretaria === secretariaFilter)
    : listaFiltrada

  // Calcular total do card baseado no período (mês atual por padrão ou período filtrado)
  const calcularTotalCard = () => {
    const now = new Date()
    let monthStart: Date
    let monthEnd: Date

    // Só usar período filtrado se AMBAS as datas estiverem preenchidas
    if (cardStartDate && cardEndDate) {
      monthStart = new Date(cardStartDate + 'T00:00:00.000')
      monthEnd = new Date(cardEndDate + 'T23:59:59.999')
    } else {
      // Por padrão, sempre usar mês atual
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const veiculosParaCalcular = secretariaFilter !== 'all' ? listaPorSecretaria : custosPorVeiculo
    
    return veiculosParaCalcular.reduce((acc, v) => {
      const custoPeriodo = v.saidas.reduce((sum, s) => {
        if (!s.data) return sum
        const d = new Date(s.data)
        if (d >= monthStart && d <= monthEnd) {
          return sum + ((s.valorUnitario ?? 0) * s.quantidade)
        }
        return sum
      }, 0)
      return acc + custoPeriodo
    }, 0)
  }

  const totalCard = calcularTotalCard()

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(14)
    doc.text("Custo por Veículo - Lista (Mês vigente)", 14, 15)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22)
    const head = [["Placa", "Modelo", "Marca", "Secretaria", "Custo Mensal (R$)"]]
    const body = listaFiltrada.map(v => [
      v.placa,
      v.modelo,
      v.marca,
      v.secretaria,
      v.custoMensal.toFixed(2)
    ])
    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 28, left: 10, right: 10 },
    })
    doc.save(`custo_veiculo_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new()
    const data = listaFiltrada.map(v => ({
      "Placa": v.placa,
      "Modelo": v.modelo,
      "Marca": v.marca,
      "Secretaria": v.secretaria,
      "Custo Mensal (R$)": Number(v.custoMensal.toFixed(2)),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(workbook, ws, "Custo Mensal")
    XLSX.writeFile(workbook, `custo_veiculo_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleDateChange = (id: string, field: 'start' | 'end', value: string) => {
    setDateFilters(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold tracking-tight">Custo por Veículo</h1>
        <Card className="sm:w-auto">
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground">
              {secretariaFilter !== 'all' ? `Custo Total (${secretariaFilter})` : "Custo Total (todos os veículos)"}
              {cardStartDate && cardEndDate ? (
                <div className="mt-1">
                  {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </div>
              ) : (
                <div className="mt-1">Mês atual</div>
              )}
            </div>
            <div className="text-lg font-bold">R$ {totalCard.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-2">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <Input
            type="search"
            placeholder="Buscar por placa..."
            value={placaQuery}
            onChange={(e) => setPlacaQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={secretariaFilter} onValueChange={setSecretariaFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por secretaria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as secretarias</SelectItem>
              {secretarias.map(sec => (
                <SelectItem key={sec} value={sec}>{sec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={cardStartDate}
            onChange={(e) => setCardStartDate(e.target.value)}
            className="w-[150px]"
            placeholder="Data inicial"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            value={cardEndDate}
            onChange={(e) => setCardEndDate(e.target.value)}
            className="w-[150px]"
            placeholder="Data final"
          />
          {(cardStartDate || cardEndDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCardStartDate("")
                setCardEndDate("")
              }}
            >
              Limpar
            </Button>
          )}
        </div>
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleExportPDF}
          >
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
            onClick={handleExportExcel}
          >
            Exportar Excel
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="text-muted-foreground p-12 text-center">Carregando dados...</div>
      ) : (
        <Card className="shadow-md-custom">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Secretaria</TableHead>
                  <TableHead>Custo Mensal</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaPorSecretaria.map(v => {
                  const isOpen = expandedIds.includes(v.id)
                  const start = dateFilters[v.id]?.start
                  const end = dateFilters[v.id]?.end
                  const filteredSaidas = v.saidas.filter(s => {
                    const d = s.data ? new Date(s.data) : null
                    if (!d) return false
                    if (start && d < new Date(start)) return false
                    if (end) {
                      const endDate = new Date(end)
                      endDate.setHours(23, 59, 59, 999)
                      if (d > endDate) return false
                    }
                    return true
                  })
                  const totalFiltrado = filteredSaidas.reduce((acc, s) => acc + ((s.valorUnitario ?? 0) * s.quantidade), 0)
                  return (
                    <Fragment key={v.id}>
                      <TableRow className="hover:bg-blue-50/30">
                        <TableCell className="font-medium">{v.placa}</TableCell>
                        <TableCell>{v.modelo}</TableCell>
                        <TableCell>{v.marca}</TableCell>
                        <TableCell>{v.secretaria}</TableCell>
                        <TableCell className="font-bold">R$ {v.custoMensal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => toggleExpand(v.id)} className="h-6 w-6 p-0">
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="p-4 bg-muted/30 rounded-md space-y-3">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <div className="mr-2">
                                  <b>Placa:</b> {v.placa}
                                </div>
                                <div className="mr-2">
                                  <b>Modelo:</b> {v.modelo}
                                </div>
                                <div className="mr-4">
                                  <b>Marca:</b> {v.marca}
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                  <Input type="date" value={start || ""} onChange={(e) => handleDateChange(v.id, 'start', e.target.value)} />
                                  <span className="text-muted-foreground">até</span>
                                  <Input type="date" value={end || ""} onChange={(e) => handleDateChange(v.id, 'end', e.target.value)} />
                                  <Button variant="outline" size="sm" onClick={() => setDateFilters(prev => ({ ...prev, [v.id]: { start: undefined, end: undefined } }))}>Limpar</Button>
                                </div>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Qtde</TableHead>
                                    <TableHead>Valor Unit.</TableHead>
                                    <TableHead>Custo</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Responsável</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredSaidas.map((s) => (
                                    <TableRow key={s.id}>
                                      <TableCell>{s.produtoNome}</TableCell>
                                      <TableCell>{s.quantidade}</TableCell>
                                      <TableCell>R$ {typeof s.valorUnitario === 'number' ? s.valorUnitario.toFixed(2) : '-'}</TableCell>
                                      <TableCell>R$ {(s.quantidade * (s.valorUnitario ?? 0)).toFixed(2)}</TableCell>
                                      <TableCell>{s.data ? new Date(s.data).toLocaleDateString() : '-'}</TableCell>
                                      <TableCell>{s.responsavelNome}</TableCell>
                                    </TableRow>
                                  ))}
                                  {filteredSaidas.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={6} className="text-center text-muted-foreground">Sem registros no período</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                              <div className="font-bold text-right mt-3">Valor total no período: R$ {totalFiltrado.toFixed(2)}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
