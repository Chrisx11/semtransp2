"use client"

import React, { useEffect, useState, Fragment } from "react"
import type { Veiculo } from "@/services/veiculo-service"
import type { Saida } from "@/services/saida-service"
import { getVeiculosSupabase } from "@/services/veiculo-service"
import { getSaidasSupabase } from "@/services/saida-service"
import { getAutorizacoesBorracharia, type AutorizacaoBorracharia } from "@/services/autorizacao-borracharia-service"
import { getAutorizacoesLavador, type AutorizacaoLavador } from "@/services/autorizacao-lavador-service"
import { getServicosExternos, type ServicoExterno } from "@/services/servico-externo-service"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, Car, Filter } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Tipo estendido
interface CustoVeiculoItem extends Veiculo {
  custoTotal: number
  saidas: Saida[]
  custoMensal: number
}

// Componente Mobile View
function CustoVeiculoMobileView({
  listaPorSecretaria,
  isLoading,
  placaQuery,
  setPlacaQuery,
  secretariaFilter,
  setSecretariaFilter,
  secretarias,
  cardStartDate,
  setCardStartDate,
  cardEndDate,
  setCardEndDate,
  expandedIds,
  toggleExpand,
  dateFilters,
  handleDateChange,
  setDateFilters,
  autorizacoesBorracharia,
  autorizacoesLavador,
  servicosExternos,
  totalCard,
  custoBorracharia,
  custoLavador,
  custoServicoExterno,
  custoTotalGeral,
  custoQFrotas,
}: {
  listaPorSecretaria: CustoVeiculoItem[]
  isLoading: boolean
  placaQuery: string
  setPlacaQuery: (value: string) => void
  secretariaFilter: string
  setSecretariaFilter: (value: string) => void
  secretarias: string[]
  cardStartDate: string
  setCardStartDate: (value: string) => void
  cardEndDate: string
  setCardEndDate: (value: string) => void
  expandedIds: string[]
  toggleExpand: (id: string) => void
  dateFilters: Record<string, { start?: string; end?: string }>
  handleDateChange: (id: string, field: 'start' | 'end', value: string) => void
  setDateFilters: (prev: any) => any
  autorizacoesBorracharia: AutorizacaoBorracharia[]
  autorizacoesLavador: AutorizacaoLavador[]
  servicosExternos: ServicoExterno[]
  totalCard: number
  custoBorracharia: number
  custoLavador: number
  custoServicoExterno: number
  custoTotalGeral: number
  custoQFrotas: boolean
  setCustoQFrotas: (value: boolean) => void
}) {
  // Função helper para aplicar multiplicador
  const aplicarMultiplicador = (valor: number) => {
    return custoQFrotas ? valor * 1.5 : valor
  }
  const [cardsExpanded, setCardsExpanded] = useState(true)

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 py-4 pb-6 flex flex-col">
      <div className="w-[98%] mb-4">
        <MobileBackButton />
      </div>

      {/* Toggle Custo QFrotas */}
      <div className="flex items-center gap-3 mb-4 w-[98%] p-3 bg-muted/50 rounded-lg">
        <Switch
          id="custo-qfrotas-mobile"
          checked={custoQFrotas}
          onCheckedChange={(checked) => setCustoQFrotas(checked)}
        />
        <Label htmlFor="custo-qfrotas-mobile" className="text-sm font-medium cursor-pointer">
          Custo QFrotas (+50%)
        </Label>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-2.5 mb-4 w-[98%]">
        <Card className="col-span-2 border-2 border-primary bg-primary/5">
          <CardContent className="py-3 px-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-[10px] text-muted-foreground mb-1">Custo Total Geral</div>
                <div className="text-lg font-bold text-primary">R$ {aplicarMultiplicador(custoTotalGeral).toFixed(2)}</div>
                {cardStartDate && cardEndDate ? (
                  <div className="text-[9px] text-muted-foreground mt-1">
                    {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                ) : (
                  <div className="text-[9px] text-muted-foreground mt-1">Mês atual</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCardsExpanded(!cardsExpanded)}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${cardsExpanded ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {cardsExpanded && (
          <>
            <Card>
              <CardContent className="py-2.5 px-3">
                <div className="text-[10px] text-muted-foreground mb-1">
                  {secretariaFilter !== 'all' ? `Custo Total (${secretariaFilter})` : "Peças e Consumíveis"}
                </div>
                <div className="text-sm font-bold">R$ {aplicarMultiplicador(totalCard).toFixed(2)}</div>
                {cardStartDate && cardEndDate ? (
                  <div className="text-[9px] text-muted-foreground mt-1">
                    {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                ) : (
                  <div className="text-[9px] text-muted-foreground mt-1">Mês atual</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2.5 px-3">
                <div className="text-[10px] text-muted-foreground mb-1">Borracharia</div>
                <div className="text-sm font-bold">R$ {aplicarMultiplicador(custoBorracharia).toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2.5 px-3">
                <div className="text-[10px] text-muted-foreground mb-1">Lavadores</div>
                <div className="text-sm font-bold">R$ {aplicarMultiplicador(custoLavador).toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2.5 px-3">
                <div className="text-[10px] text-muted-foreground mb-1">Serviço Externo</div>
                <div className="text-sm font-bold">R$ {aplicarMultiplicador(custoServicoExterno).toFixed(2)}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 mb-4 w-[98%]">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por placa..."
            className="pl-10 h-11 text-base w-full"
            value={placaQuery}
            onChange={(e) => setPlacaQuery(e.target.value)}
          />
        </div>

        <Select value={secretariaFilter} onValueChange={setSecretariaFilter}>
          <SelectTrigger className="w-full h-11 text-base">
            <div className="flex items-center min-w-0">
              <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
              <SelectValue placeholder="Filtrar por secretaria" className="truncate" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as secretarias</SelectItem>
            {secretarias.map((sec) => (
              <SelectItem key={sec} value={sec}>{sec}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-2">
          <Input
            type="date"
            value={cardStartDate}
            onChange={(e) => setCardStartDate(e.target.value)}
            className="w-full h-11 text-base"
            placeholder="Data inicial"
          />
          <Input
            type="date"
            value={cardEndDate}
            onChange={(e) => setCardEndDate(e.target.value)}
            className="w-full h-11 text-base"
            placeholder="Data final"
          />
        </div>

        {(cardStartDate || cardEndDate) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCardStartDate("")
              setCardEndDate("")
            }}
            className="w-full h-11 text-base"
          >
            Limpar Filtros de Data
          </Button>
        )}
      </div>

      {/* Lista de Veículos */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16 w-[98%]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      ) : listaPorSecretaria.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground w-[98%]">
          <Car className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-base font-medium mb-1">Nenhum veículo encontrado</p>
          <p className="text-sm">Tente usar termos diferentes na busca ou remover os filtros</p>
        </div>
      ) : (
        <div className="space-y-3 w-[98%]">
          {listaPorSecretaria.map((v) => {
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
            const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, a) => acc + (a.preco ?? 0), 0);
            const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, a) => acc + (a.preco ?? 0), 0);
            const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id && (!start || new Date(s.dataAutorizacao) >= new Date(start)) && (!end || new Date(s.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, s) => acc + (s.valor ?? 0), 0);
            const totalComExtras = v.custoMensal + borras + lavs + servicosExt;

            return (
              <Card key={v.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow w-full">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {/* Placa e Info Principal */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
                          <Car className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-base text-primary truncate">{v.placa}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {v.modelo} • {v.marca}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {v.secretaria}
                          </div>
                        </div>
                      </div>

                      {/* Custo Total */}
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="font-bold text-base text-primary mb-1">
                          R$ {aplicarMultiplicador(totalComExtras).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          <div className="flex justify-between">
                            <span>Manutenções:</span>
                            <span className="font-medium">R$ {aplicarMultiplicador(v.custoMensal).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Borracharia:</span>
                            <span className="font-medium">R$ {aplicarMultiplicador(borras).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lavador:</span>
                            <span className="font-medium">R$ {aplicarMultiplicador(lavs).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Serviço Externo:</span>
                            <span className="font-medium">R$ {aplicarMultiplicador(servicosExt).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botão Expandir */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleExpand(v.id)} 
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </div>

                  {/* Conteúdo Expandido */}
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                      {/* Filtros de Data do Veículo */}
                      <div className="flex flex-col gap-2">
                        <Input 
                          type="date" 
                          value={start || ""} 
                          onChange={(e) => handleDateChange(v.id, 'start', e.target.value)}
                          className="w-full h-9 text-xs"
                        />
                        <Input 
                          type="date" 
                          value={end || ""} 
                          onChange={(e) => handleDateChange(v.id, 'end', e.target.value)}
                          className="w-full h-9 text-xs"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setDateFilters((prev: any) => ({ ...prev, [v.id]: { start: undefined, end: undefined } }))}
                          className="w-full h-9 text-[10px]"
                        >
                          Limpar Filtros
                        </Button>
                      </div>

                      {/* Saídas */}
                      {filteredSaidas.length > 0 ? (
                        <div className="space-y-2">
                          <div className="font-semibold text-xs mb-2 pb-1 border-b border-border/50">Saídas de Produtos</div>
                          {filteredSaidas.map((s) => (
                            <Card key={s.id} className="p-2 bg-muted/30">
                              <div className="space-y-1">
                                <div className="font-medium text-xs">{s.produtoNome}</div>
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                                  <span>Qtd: {s.quantidade}</span>
                                  <span>•</span>
                                  <span>Unit: R$ {typeof s.valorUnitario === 'number' ? aplicarMultiplicador(s.valorUnitario).toFixed(2) : '-'}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-primary">Total: R$ {aplicarMultiplicador(s.quantidade * (s.valorUnitario ?? 0)).toFixed(2)}</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {s.data ? new Date(s.data).toLocaleDateString('pt-BR') : '-'} • {s.responsavelNome}
                                </div>
                              </div>
                            </Card>
                          ))}
                          <div className="font-bold text-right mt-2 text-xs pt-2 border-t border-border/50">
                            Total: R$ {aplicarMultiplicador(totalFiltrado).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground text-xs py-3">
                          Sem registros de saídas no período
                        </div>
                      )}

                      {/* Borracharia */}
                      <div>
                        <div className="font-semibold text-xs mb-2 pb-1 border-b border-border/50">Custos de Borracharia</div>
                        {autorizacoesBorracharia.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).length > 0 ? (
                          <div className="space-y-1.5">
                            {autorizacoesBorracharia.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).map(a => (
                              <Card key={a.id} className="p-2 bg-muted/30">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-xs">R$ {a.preco ? aplicarMultiplicador(a.preco).toFixed(2) : '-'}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {new Date(a.dataAutorizacao).toLocaleDateString('pt-BR')} • {a.autorizadoPorNome}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-xs py-3">
                            Sem registros no período
                          </div>
                        )}
                      </div>

                      {/* Lavador */}
                      <div>
                        <div className="font-semibold text-xs mb-2 pb-1 border-b border-border/50">Custos de Lavador</div>
                        {autorizacoesLavador.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).length > 0 ? (
                          <div className="space-y-1.5">
                            {autorizacoesLavador.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).map(a => (
                              <Card key={a.id} className="p-2 bg-muted/30">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-xs">R$ {a.preco ? aplicarMultiplicador(a.preco).toFixed(2) : '-'}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {new Date(a.dataAutorizacao).toLocaleDateString('pt-BR')} • {a.autorizadoPorNome}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-xs py-3">
                            Sem registros no período
                          </div>
                        )}
                      </div>

                      {/* Serviço Externo */}
                      <div>
                        <div className="font-semibold text-xs mb-2 pb-1 border-b border-border/50">Custos de Serviço Externo</div>
                        {servicosExternos.filter(s => s.veiculoId === v.id && (!start || new Date(s.dataAutorizacao) >= new Date(start)) && (!end || new Date(s.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).length > 0 ? (
                          <div className="space-y-1.5">
                            {servicosExternos.filter(s => s.veiculoId === v.id && (!start || new Date(s.dataAutorizacao) >= new Date(start)) && (!end || new Date(s.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).map(s => (
                              <Card key={s.id} className="p-2 bg-muted/30">
                                <div className="space-y-0.5">
                                  <div className="font-medium text-xs">R$ {s.valor ? aplicarMultiplicador(s.valor).toFixed(2) : '0.00'}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {new Date(s.dataAutorizacao).toLocaleDateString('pt-BR')} • {s.fornecedorNome}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    OS: {s.ordemServicoNumero}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-xs py-3">
                            Sem registros no período
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CustoVeiculoPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [autorizacoesBorracharia, setAutorizacoesBorracharia] = useState<AutorizacaoBorracharia[]>([])
  const [autorizacoesLavador, setAutorizacoesLavador] = useState<AutorizacaoLavador[]>([])
  const [servicosExternos, setServicosExternos] = useState<ServicoExterno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [dateFilters, setDateFilters] = useState<Record<string, { start?: string; end?: string }>>({})
  const [placaQuery, setPlacaQuery] = useState("")
  const [cardStartDate, setCardStartDate] = useState<string>("")
  const [cardEndDate, setCardEndDate] = useState<string>("")
  const [custoQFrotas, setCustoQFrotas] = useState(false)

  // Função helper para aplicar multiplicador
  const aplicarMultiplicador = (valor: number) => {
    return custoQFrotas ? valor * 1.5 : valor
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [veics, saids, borracharia, lavador, servicosExt] = await Promise.all([
        getVeiculosSupabase(),
        getSaidasSupabase(),
        getAutorizacoesBorracharia(),
        getAutorizacoesLavador(),
        getServicosExternos()
      ])
      setVeiculos(veics)
      setSaidas(saids)
      setAutorizacoesBorracharia(borracharia)
      setAutorizacoesLavador(lavador)
      setServicosExternos(servicosExt)
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

  // Calcular custo total de serviço externo baseado no período
  const calcularCustoServicoExterno = () => {
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

    return servicosExternos.reduce((acc, servico) => {
      if (!servico.valor || servico.valor <= 0) return acc
      const dataAuth = new Date(servico.dataAutorizacao)
      if (dataAuth >= monthStart && dataAuth <= monthEnd) {
        return acc + servico.valor
      }
      return acc
    }, 0)
  }

  const custoServicoExterno = calcularCustoServicoExterno()

  // Calcular custo total geral (soma de todos os cards)
  const custoTotalGeral = totalCard + custoBorracharia + custoLavador + custoServicoExterno

  const handleExportPDF = () => {
    // Filtrar veículos com custo 0
    const veiculosComCusto = listaFiltrada.filter(v => {
      const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
      const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
      const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((acc, s) => acc + (s.valor ?? 0), 0)
      const totalComExtras = v.custoMensal + borras + lavs + servicosExt
      return aplicarMultiplicador(totalComExtras) > 0
    })

    // Calcular total
    const totalRelatorio = veiculosComCusto.reduce((acc, v) => {
      const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((sum, a) => sum + (a.preco ?? 0), 0)
      const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((sum, a) => sum + (a.preco ?? 0), 0)
      const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((sum, s) => sum + (s.valor ?? 0), 0)
      const totalComExtras = v.custoMensal + borras + lavs + servicosExt
      return acc + aplicarMultiplicador(totalComExtras)
    }, 0)

    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(14)
    const periodoTexto = cardStartDate && cardEndDate 
      ? `Período: ${new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
      : "Mês vigente"
    
    // Título à esquerda
    doc.text(`Custo por Veículo - ${periodoTexto}`, 14, 15)
    
    // Total à direita
    const pageWidth = doc.internal.pageSize.getWidth()
    const totalTexto = `Total: R$ ${totalRelatorio.toFixed(2)}`
    doc.setFontSize(12)
    const totalWidth = doc.getTextWidth(totalTexto)
    doc.text(totalTexto, pageWidth - totalWidth - 14, 15)
    
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22)
    
    const headLabel = cardStartDate && cardEndDate ? "Custo no Período (R$)" : "Custo Mensal (R$)"
    const head = [["Placa", "Modelo", "Marca", "Secretaria", headLabel]]
    
    const body = veiculosComCusto.map(v => {
      const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
      const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
      const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((acc, s) => acc + (s.valor ?? 0), 0)
      const totalComExtras = v.custoMensal + borras + lavs + servicosExt
      return [
        v.placa,
        v.modelo,
        v.marca,
        v.secretaria,
        aplicarMultiplicador(totalComExtras).toFixed(2)
      ]
    })
    
    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { 
        fontSize: 8, 
        cellPadding: 2,
        textColor: [33, 37, 41]
      },
      headStyles: { 
        fillColor: [59, 130, 246], // Azul
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { 
        fillColor: [239, 246, 255] // Azul claro
      },
      bodyStyles: {
        fillColor: [255, 255, 255] // Branco
      },
      margin: { top: 28, left: 10, right: 10 },
    })
    doc.save(`custo_veiculo_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    try {
      // Filtrar veículos com custo 0
      const veiculosComCusto = listaFiltrada.filter(v => {
        const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
        const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
        const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((acc, s) => acc + (s.valor ?? 0), 0)
        const totalComExtras = v.custoMensal + borras + lavs + servicosExt
        return aplicarMultiplicador(totalComExtras) > 0
      })

      // Calcular total
      const totalRelatorio = veiculosComCusto.reduce((acc, v) => {
        const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((sum, a) => sum + (a.preco ?? 0), 0)
        const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((sum, a) => sum + (a.preco ?? 0), 0)
        const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((sum, s) => sum + (s.valor ?? 0), 0)
        const totalComExtras = v.custoMensal + borras + lavs + servicosExt
        return acc + aplicarMultiplicador(totalComExtras)
      }, 0)

      // Importação dinâmica do ExcelJS para evitar problemas no client-side
      const ExcelJS = (await import("exceljs")).default
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Custo Mensal")
      const custoLabel = cardStartDate && cardEndDate ? "Custo no Período (R$)" : "Custo Mensal (R$)"
      
      // Adicionar título e total
      const periodoTexto = cardStartDate && cardEndDate 
        ? `Período: ${new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
        : "Mês vigente"
      
      worksheet.mergeCells('A1:E1')
      const titleRow = worksheet.getRow(1)
      titleRow.getCell(1).value = `Custo por Veículo - ${periodoTexto}`
      titleRow.getCell(1).font = { size: 14, bold: true }
      titleRow.getCell(1).alignment = { horizontal: 'left' }
      
      // Total no canto direito
      worksheet.mergeCells('A2:E2')
      const totalRow = worksheet.getRow(2)
      totalRow.getCell(1).value = `Total: R$ ${totalRelatorio.toFixed(2)}`
      totalRow.getCell(1).font = { size: 12, bold: true }
      totalRow.getCell(1).alignment = { horizontal: 'right' }
      
      // Data de geração
      worksheet.mergeCells('A3:E3')
      const dateRow = worksheet.getRow(3)
      dateRow.getCell(1).value = `Gerado em: ${new Date().toLocaleDateString()}`
      dateRow.getCell(1).font = { size: 10 }
      dateRow.getCell(1).alignment = { horizontal: 'left' }
      
      // Definir colunas (começando na linha 5)
      worksheet.getRow(5).values = ["Placa", "Modelo", "Marca", "Secretaria", custoLabel]
      worksheet.columns = [
        { key: "placa", width: 10 },
        { key: "modelo", width: 20 },
        { key: "marca", width: 15 },
        { key: "secretaria", width: 18 },
        { key: "custo", width: 18 },
      ]

      // Estilizar cabeçalho
      const headerRow = worksheet.getRow(5)
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3B82F6" }, // Azul
      }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

      // Adicionar dados
      veiculosComCusto.forEach((v, index) => {
        const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
        const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
        const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((acc, s) => acc + (s.valor ?? 0), 0)
        const totalComExtras = v.custoMensal + borras + lavs + servicosExt
        
        const row = worksheet.addRow({
          placa: v.placa,
          modelo: v.modelo,
          marca: v.marca,
          secretaria: v.secretaria,
          custo: Number(aplicarMultiplicador(totalComExtras).toFixed(2)),
        })
        
        // Alternar cores das linhas
        if (index % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEFF6FF" }, // Azul muito claro
          }
        }
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

  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <CustoVeiculoMobileView
        listaPorSecretaria={listaPorSecretaria}
        isLoading={isLoading}
        placaQuery={placaQuery}
        setPlacaQuery={setPlacaQuery}
        secretariaFilter={secretariaFilter}
        setSecretariaFilter={setSecretariaFilter}
        secretarias={secretarias}
        cardStartDate={cardStartDate}
        setCardStartDate={setCardStartDate}
        cardEndDate={cardEndDate}
        setCardEndDate={setCardEndDate}
        expandedIds={expandedIds}
        toggleExpand={toggleExpand}
        dateFilters={dateFilters}
        handleDateChange={handleDateChange}
        setDateFilters={setDateFilters}
        autorizacoesBorracharia={autorizacoesBorracharia}
        autorizacoesLavador={autorizacoesLavador}
        servicosExternos={servicosExternos}
        totalCard={totalCard}
        custoBorracharia={custoBorracharia}
        custoLavador={custoLavador}
        custoServicoExterno={custoServicoExterno}
        custoTotalGeral={custoTotalGeral}
        custoQFrotas={custoQFrotas}
        setCustoQFrotas={setCustoQFrotas}
      />
    )
  }

  return (
    <React.Fragment>
      <div className="space-y-6">
        {/* Toggle Custo QFrotas */}
        <Card>
          <CardContent className="py-4 px-6">
            <div className="flex items-center gap-3">
              <Switch
                id="custo-qfrotas"
                checked={custoQFrotas}
                onCheckedChange={setCustoQFrotas}
              />
              <Label htmlFor="custo-qfrotas" className="text-sm font-medium cursor-pointer">
                Custo QFrotas (+50%)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="sm:w-auto">
            <CardContent className="py-3 px-4">
              <div className="text-xs text-muted-foreground">
                {secretariaFilter !== 'all' ? `Custo Total (${secretariaFilter})` : "Custo Total de Peças e Consumíveis"}
                {cardStartDate && cardEndDate ? (
                  <div className="mt-1">
                    {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                ) : (
                  <div className="mt-1">Mês atual</div>
                )}
              </div>
              <div className="text-lg font-bold">R$ {aplicarMultiplicador(totalCard).toFixed(2)}</div>
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
              <div className="text-lg font-bold">R$ {aplicarMultiplicador(custoBorracharia).toFixed(2)}</div>
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
              <div className="text-lg font-bold">R$ {aplicarMultiplicador(custoLavador).toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="sm:w-auto">
            <CardContent className="py-3 px-4">
              <div className="text-xs text-muted-foreground">
                Custo Total Serviço Externo
                {cardStartDate && cardEndDate ? (
                  <div className="mt-1">
                    {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                ) : (
                  <div className="mt-1">Mês atual</div>
                )}
              </div>
              <div className="text-lg font-bold">R$ {aplicarMultiplicador(custoServicoExterno).toFixed(2)}</div>
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
              <div className="text-lg font-bold text-primary">R$ {aplicarMultiplicador(custoTotalGeral).toFixed(2)}</div>
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
                      const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id && (!start || new Date(s.dataAutorizacao) >= new Date(start)) && (!end || new Date(s.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, s) => acc + (s.valor ?? 0), 0);
                      const totalComExtras = v.custoMensal + borras + lavs + servicosExt;
                      return (
                        <Fragment key={v.id}>
                          <TableRow className="hover:bg-blue-50/30">
                            <TableCell className="font-medium">{v.placa}</TableCell>
                            <TableCell>{v.modelo}</TableCell>
                            <TableCell>{v.marca}</TableCell>
                            <TableCell>{v.secretaria}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="font-bold text-lg text-primary">Total: R$ {aplicarMultiplicador(totalComExtras).toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  (Manutenções: R$ {aplicarMultiplicador(v.custoMensal).toFixed(2)} | Borracharia: R$ {aplicarMultiplicador(borras).toFixed(2)} | Lavador: R$ {aplicarMultiplicador(lavs).toFixed(2)} | Serviço Externo: R$ {aplicarMultiplicador(servicosExt).toFixed(2)})
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
                                          <TableCell>R$ {typeof s.valorUnitario === 'number' ? aplicarMultiplicador(s.valorUnitario).toFixed(2) : '-'}</TableCell>
                                          <TableCell>R$ {aplicarMultiplicador(s.quantidade * (s.valorUnitario ?? 0)).toFixed(2)}</TableCell>
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
                                  <div className="font-bold text-right mt-3">Valor total no período: R$ {aplicarMultiplicador(totalFiltrado).toFixed(2)}</div>

                                            {/* ---  CUSTOS ESPECÍFICOS: BORRACHARIA, LAVADOR E SERVIÇO EXTERNO --- */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
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
                                                          <TableCell>R$ {a.preco ? aplicarMultiplicador(a.preco).toFixed(2) : '-'}</TableCell>
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
                                                          <TableCell>R$ {a.preco ? aplicarMultiplicador(a.preco).toFixed(2) : '-'}</TableCell>
                                                          <TableCell>{a.autorizadoPorNome}</TableCell>
                                                        </TableRow>
                                                      ))
                                                    )}
                                                  </TableBody>
                                                </Table>
                                              </div>

                                              <div>
                                                <div className="font-semibold text-sm mb-1">Custos de Serviço Externo</div>
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow>
                                                      <TableHead>Data</TableHead>
                                                      <TableHead>Valor</TableHead>
                                                      <TableHead>Fornecedor</TableHead>
                                                      <TableHead>OS</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {servicosExternos.filter(s => s.veiculoId === v.id && (!start || new Date(s.dataAutorizacao) >= new Date(start)) && (!end || new Date(s.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).length === 0 ? (
                                                      <TableRow>
                                                        <TableCell colSpan={4} className="text-muted-foreground text-center">Sem registros no período</TableCell>
                                                      </TableRow>
                                                    ) : (
                                                      servicosExternos.filter(s => s.veiculoId === v.id && (!start || new Date(s.dataAutorizacao) >= new Date(start)) && (!end || new Date(s.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).map(s => (
                                                        <TableRow key={s.id}>
                                                          <TableCell>{new Date(s.dataAutorizacao).toLocaleDateString()}</TableCell>
                                                          <TableCell>R$ {s.valor ? aplicarMultiplicador(s.valor).toFixed(2) : '0.00'}</TableCell>
                                                          <TableCell>{s.fornecedorNome}</TableCell>
                                                          <TableCell>{s.ordemServicoNumero}</TableCell>
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
