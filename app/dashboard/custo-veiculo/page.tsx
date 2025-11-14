"use client"

import React, { useEffect, useState, Fragment } from "react"
import type { Veiculo } from "@/services/veiculo-service"
import type { Saida } from "@/services/saida-service"
import { getVeiculosSupabase } from "@/services/veiculo-service"
import { getSaidasSupabase } from "@/services/saida-service"
import { getAutorizacoesBorracharia, type AutorizacaoBorracharia } from "@/services/autorizacao-borracharia-service"
import { getAutorizacoesLavador, type AutorizacaoLavador } from "@/services/autorizacao-lavador-service"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
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
  const [autorizacoesBorracharia, setAutorizacoesBorracharia] = useState<AutorizacaoBorracharia[]>([])
  const [autorizacoesLavador, setAutorizacoesLavador] = useState<AutorizacaoLavador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [dateFilters, setDateFilters] = useState<Record<string, { start?: string; end?: string }>>({})
  const [placaQuery, setPlacaQuery] = useState("")
  const [cardStartDate, setCardStartDate] = useState<string>("")
  const [cardEndDate, setCardEndDate] = useState<string>("")

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [veics, saids, borracharia, lavador] = await Promise.all([
        getVeiculosSupabase(),
        getSaidasSupabase(),
        getAutorizacoesBorracharia(),
        getAutorizacoesLavador()
      ])
      setVeiculos(veics)
      setSaidas(saids)
      setAutorizacoesBorracharia(borracharia)
      setAutorizacoesLavador(lavador)
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Calcular custo por veículo
  const custosPorVeiculo = veiculos.map(v => {
    const saidasVeiculo = saidas.filter(s => s.veiculoId === v.id)
    const total = saidasVeiculo.reduce((acc, s) => acc + ((s.valorUnitario ?? 0) * s.quantidade), 0)

    // Cálculo do custo mensal (mês vigente ou período filtrado)
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date

    // Se as datas do card estiverem preenchidas, usar esse período
    if (cardStartDate && cardEndDate) {
      periodStart = new Date(cardStartDate + 'T00:00:00.000')
      periodEnd = new Date(cardEndDate + 'T23:59:59.999')
    } else {
      // Por padrão, usar mês atual
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const mensal = saidasVeiculo.reduce((acc, s) => {
      if (!s.data) return acc
      const d = new Date(s.data)
      if (d >= periodStart && d <= periodEnd) {
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

  // Calcular custo total de borracharia baseado no período
  const calcularCustoBorracharia = () => {
    const now = new Date()
    let monthStart: Date
    let monthEnd: Date

    if (cardStartDate && cardEndDate) {
      monthStart = new Date(cardStartDate + 'T00:00:00.000')
      monthEnd = new Date(cardEndDate + 'T23:59:59.999')
    } else {
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    return autorizacoesBorracharia.reduce((acc, auth) => {
      if (!auth.preco || auth.preco <= 0) return acc
      const dataAuth = new Date(auth.dataAutorizacao)
      if (dataAuth >= monthStart && dataAuth <= monthEnd) {
        return acc + auth.preco
      }
      return acc
    }, 0)
  }

  const custoBorracharia = calcularCustoBorracharia()

  // Calcular custo total de lavadores baseado no período
  const calcularCustoLavador = () => {
    const now = new Date()
    let monthStart: Date
    let monthEnd: Date

    if (cardStartDate && cardEndDate) {
      monthStart = new Date(cardStartDate + 'T00:00:00.000')
      monthEnd = new Date(cardEndDate + 'T23:59:59.999')
    } else {
      monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    return autorizacoesLavador.reduce((acc, auth) => {
      if (!auth.preco || auth.preco <= 0) return acc
      const dataAuth = new Date(auth.dataAutorizacao)
      if (dataAuth >= monthStart && dataAuth <= monthEnd) {
        return acc + auth.preco
      }
      return acc
    }, 0)
  }

  const custoLavador = calcularCustoLavador()

  // Calcular custo total geral (soma de todos os cards)
  const custoTotalGeral = totalCard + custoBorracharia + custoLavador

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(14)
    const periodoTexto = cardStartDate && cardEndDate 
      ? `Período: ${new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
      : "Mês vigente"
    doc.text(`Custo por Veículo - ${periodoTexto}`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22)
    const headLabel = cardStartDate && cardEndDate ? "Custo no Período (R$)" : "Custo Mensal (R$)"
    const head = [["Placa", "Modelo", "Marca", "Secretaria", headLabel]]
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

  const handleExportExcel = async () => {
    try {
      // Importação dinâmica do ExcelJS para evitar problemas no client-side
      const ExcelJS = (await import("exceljs")).default
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Custo Mensal")
      const custoLabel = cardStartDate && cardEndDate ? "Custo no Período (R$)" : "Custo Mensal (R$)"
      
      // Definir colunas
      worksheet.columns = [
        { header: "Placa", key: "placa", width: 10 },
        { header: "Modelo", key: "modelo", width: 20 },
        { header: "Marca", key: "marca", width: 15 },
        { header: "Secretaria", key: "secretaria", width: 18 },
        { header: custoLabel, key: "custo", width: 18 },
      ]

      // Estilizar cabeçalho
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      }

      // Adicionar dados
      listaFiltrada.forEach(v => {
        worksheet.addRow({
          placa: v.placa,
          modelo: v.modelo,
          marca: v.marca,
          secretaria: v.secretaria,
          custo: Number(v.custoMensal.toFixed(2)),
        })
      })

      // Gerar buffer e fazer download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `custo_veiculo_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
    }
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
    <React.Fragment>
      <div className="space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="sm:w-auto">
            <CardContent className="py-3 px-4">
              <div className="text-xs text-muted-foreground">
                {secretariaFilter !== 'all' ? `Custo Total (${secretariaFilter})` : "Custo Total de Manutenções"}
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

          <Card className="sm:w-auto">
            <CardContent className="py-3 px-4">
              <div className="text-xs text-muted-foreground">
                Custo Total Borracharia
                {cardStartDate && cardEndDate ? (
                  <div className="mt-1">
                    {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                ) : (
                  <div className="mt-1">Mês atual</div>
                )}
              </div>
              <div className="text-lg font-bold">R$ {custoBorracharia.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="sm:w-auto">
            <CardContent className="py-3 px-4">
              <div className="text-xs text-muted-foreground">
                Custo Total Lavadores
                {cardStartDate && cardEndDate ? (
                  <div className="mt-1">
                    {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                ) : (
                  <div className="mt-1">Mês atual</div>
                )}
              </div>
              <div className="text-lg font-bold">R$ {custoLavador.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="sm:w-auto border-2 border-primary">
            <CardContent className="py-3 px-4">
              <div className="text-xs text-muted-foreground">
                Custo Total Geral
                {cardStartDate && cardEndDate ? (
                  <div className="mt-1">
                    {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                ) : (
                  <div className="mt-1">Mês atual</div>
                )}
              </div>
              <div className="text-lg font-bold text-primary">R$ {custoTotalGeral.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md-custom">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por placa..."
                  value={placaQuery}
                  onChange={(e) => setPlacaQuery(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                <div className="flex gap-2">
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
            </div>

            <div className="rounded-md border shadow-sm-custom overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Secretaria</TableHead>
                    <TableHead>
                      {cardStartDate && cardEndDate 
                        ? `Custo no Período` 
                        : `Custo Mensal`}
                    </TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Carregando dados...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : listaPorSecretaria.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <p className="text-muted-foreground">Nenhum veículo encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    listaPorSecretaria.map(v => {
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
                      // Calcular custos adicionais por veículo e período
                      const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, a) => acc + (a.preco ?? 0), 0);
                      const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, a) => acc + (a.preco ?? 0), 0);
                      const totalComExtras = v.custoMensal + borras + lavs;
                      return (
                        <Fragment key={v.id}>
                          <TableRow className="hover:bg-blue-50/30">
                            <TableCell className="font-medium">{v.placa}</TableCell>
                            <TableCell>{v.modelo}</TableCell>
                            <TableCell>{v.marca}</TableCell>
                            <TableCell>{v.secretaria}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="font-bold text-lg text-primary">Total: R$ {totalComExtras.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  (Manutenções: R$ {v.custoMensal.toFixed(2)} | Borracharia: R$ {borras.toFixed(2)} | Lavador: R$ {lavs.toFixed(2)})
                                </div>
                              </div>
                            </TableCell>
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

                                            {/* ---  CUSTOS ESPECÍFICOS: BORRACHARIA E LAVADOR --- */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                              <div>
                                                <div className="font-semibold text-sm mb-1">Custos de Borracharia</div>
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow>
                                                      <TableHead>Data</TableHead>
                                                      <TableHead>Valor</TableHead>
                                                      <TableHead>Autorizado por</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {autorizacoesBorracharia.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).length === 0 ? (
                                                      <TableRow>
                                                        <TableCell colSpan={3} className="text-muted-foreground text-center">Sem registros no período</TableCell>
                                                      </TableRow>
                                                    ) : (
                                                      autorizacoesBorracharia.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).map(a => (
                                                        <TableRow key={a.id}>
                                                          <TableCell>{new Date(a.dataAutorizacao).toLocaleDateString()}</TableCell>
                                                          <TableCell>R$ {a.preco?.toFixed(2) ?? '-'}</TableCell>
                                                          <TableCell>{a.autorizadoPorNome}</TableCell>
                                                        </TableRow>
                                                      ))
                                                    )}
                                                  </TableBody>
                                                </Table>
                                              </div>

                                              <div>
                                                <div className="font-semibold text-sm mb-1">Custos de Lavador</div>
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow>
                                                      <TableHead>Data</TableHead>
                                                      <TableHead>Valor</TableHead>
                                                      <TableHead>Autorizado por</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {autorizacoesLavador.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).length === 0 ? (
                                                      <TableRow>
                                                        <TableCell colSpan={3} className="text-muted-foreground text-center">Sem registros no período</TableCell>
                                                      </TableRow>
                                                    ) : (
                                                      autorizacoesLavador.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).map(a => (
                                                        <TableRow key={a.id}>
                                                          <TableCell>{new Date(a.dataAutorizacao).toLocaleDateString()}</TableCell>
                                                          <TableCell>R$ {a.preco?.toFixed(2) ?? '-'}</TableCell>
                                                          <TableCell>{a.autorizadoPorNome}</TableCell>
                                                        </TableRow>
                                                      ))
                                                    )}
                                                  </TableBody>
                                                </Table>
                                              </div>
                                            </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </React.Fragment>
  )
}
