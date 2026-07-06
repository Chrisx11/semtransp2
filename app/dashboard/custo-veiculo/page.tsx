"use client"

import React, { useEffect, useState, Fragment, useMemo } from "react"
import type { Veiculo } from "@/services/veiculo-service"
import type { Saida } from "@/services/saida-service"
import { getVeiculosSupabase } from "@/services/veiculo-service"
import { getSaidasSupabase } from "@/services/saida-service"
import { getAutorizacoesBorracharia, type AutorizacaoBorracharia } from "@/services/autorizacao-borracharia-service"
import { getAutorizacoesLavador, type AutorizacaoLavador } from "@/services/autorizacao-lavador-service"
import { getServicosExternos, type ServicoExterno } from "@/services/servico-externo-service"
import { getComprasRealizadasSupabase, type CompraRealizada } from "@/services/compra-realizada-service"
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Tipo estendido
interface CustoVeiculoItem extends Veiculo {
  custoTotal: number
  saidas: Saida[]
  custoMensal: number
  custoComprasMensal: number
}

function getPeriodoFiltro(cardStartDate: string, cardEndDate: string) {
  const now = new Date()
  if (cardStartDate && cardEndDate) {
    return {
      start: new Date(cardStartDate + "T00:00:00.000"),
      end: new Date(cardEndDate + "T23:59:59.999"),
    }
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  }
}

function somarComprasVeiculo(
  compras: CompraRealizada[],
  veiculoId: string,
  periodStart: Date,
  periodEnd: Date,
) {
  return compras.reduce((acc, c) => {
    if (c.veiculoId !== veiculoId) return acc
    const d = new Date(c.data)
    if (d >= periodStart && d <= periodEnd) return acc + c.totalNota
    return acc
  }, 0)
}

function filtrarComprasVeiculo(
  compras: CompraRealizada[],
  veiculoId: string,
  start?: string,
  end?: string,
) {
  return compras.filter((c) => {
    if (c.veiculoId !== veiculoId) return false
    const d = new Date(c.data)
    if (start && d < new Date(start)) return false
    if (end) {
      const endDate = new Date(end)
      endDate.setHours(23, 59, 59, 999)
      if (d > endDate) return false
    }
    return true
  })
}

function formatBRL(v?: number | null) {
  if (v == null || Number.isNaN(v)) return "—"
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function classificarComprasParaCusto(
  todasCompras: CompraRealizada[],
  idsVeiculosAtivos: Set<string>,
  periodStart: Date,
  periodEnd: Date,
) {
  const incluidas: CompraRealizada[] = []
  const excluidas: { compra: CompraRealizada; motivo: string }[] = []

  for (const compra of todasCompras) {
    if (!compra.veiculoId) {
      excluidas.push({ compra, motivo: "Sem veículo vinculado" })
      continue
    }
    if (!idsVeiculosAtivos.has(compra.veiculoId)) {
      excluidas.push({ compra, motivo: "Veículo inativo" })
      continue
    }
    const d = new Date(compra.data)
    if (d < periodStart || d > periodEnd) {
      excluidas.push({ compra, motivo: "Fora do período selecionado" })
      continue
    }
    incluidas.push(compra)
  }

  return { incluidas, excluidas }
}

type SecaoCustoKey = "saidas" | "borracharia" | "lavador" | "servico_externo" | "compras"

const TODAS_SECOES_CUSTO: SecaoCustoKey[] = [
  "saidas",
  "borracharia",
  "lavador",
  "servico_externo",
  "compras",
]

function fimDoDia(dateStr: string) {
  const d = new Date(dateStr)
  d.setHours(23, 59, 59, 999)
  return d
}

function noPeriodoVeiculo(data: string | Date, start?: string, end?: string) {
  const d = new Date(data)
  if (start && d < new Date(start)) return false
  if (end && d > fimDoDia(end)) return false
  return true
}

function SecaoCascataCustos({
  titulo,
  total,
  quantidade,
  aberta,
  onOpenChange,
  exibirCusto,
  children,
}: {
  titulo: string
  total: number
  quantidade: number
  aberta: boolean
  onOpenChange: (open: boolean) => void
  exibirCusto: (valor: number) => string
  children: React.ReactNode
}) {
  return (
    <Collapsible open={aberta} onOpenChange={onOpenChange} className="border rounded-md bg-background">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${aberta ? "rotate-180" : ""}`} />
        <span className="flex-1 font-medium text-sm">{titulo}</span>
        <Badge variant="secondary" className="text-xs shrink-0">
          {quantidade} {quantidade === 1 ? "registro" : "registros"}
        </Badge>
        <span className="font-semibold text-sm text-primary shrink-0">{exibirCusto(total)}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t bg-muted/20">
        <div className="p-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function DetalhesCustosVeiculoExpandido({
  veiculo,
  start,
  end,
  onDateChange,
  onClearDates,
  autorizacoesBorracharia,
  autorizacoesLavador,
  servicosExternos,
  comprasRealizadas,
  exibirCusto,
  variant,
}: {
  veiculo: CustoVeiculoItem
  start?: string
  end?: string
  onDateChange: (field: "start" | "end", value: string) => void
  onClearDates: () => void
  autorizacoesBorracharia: AutorizacaoBorracharia[]
  autorizacoesLavador: AutorizacaoLavador[]
  servicosExternos: ServicoExterno[]
  comprasRealizadas: CompraRealizada[]
  exibirCusto: (valor: number) => string
  variant: "mobile" | "desktop"
}) {
  const [secoesAbertas, setSecoesAbertas] = useState<Set<SecaoCustoKey>>(new Set())

  const toggleSecao = (secao: SecaoCustoKey, open: boolean) => {
    setSecoesAbertas((prev) => {
      const next = new Set(prev)
      if (open) next.add(secao)
      else next.delete(secao)
      return next
    })
  }

  const filteredSaidas = veiculo.saidas.filter((s) => s.data && noPeriodoVeiculo(s.data, start, end))
  const totalSaidas = filteredSaidas.reduce((acc, s) => acc + ((s.valorUnitario ?? 0) * s.quantidade), 0)

  const borrachariaItems = autorizacoesBorracharia.filter(
    (a) => a.veiculoId === veiculo.id && noPeriodoVeiculo(a.dataAutorizacao, start, end),
  )
  const totalBorracharia = borrachariaItems.reduce((acc, a) => acc + (a.preco ?? 0), 0)

  const lavadorItems = autorizacoesLavador.filter(
    (a) => a.veiculoId === veiculo.id && noPeriodoVeiculo(a.dataAutorizacao, start, end),
  )
  const totalLavador = lavadorItems.reduce((acc, a) => acc + (a.preco ?? 0), 0)

  const servicosExtItems = servicosExternos.filter(
    (s) => s.veiculoId === veiculo.id && noPeriodoVeiculo(s.dataAutorizacao, start, end),
  )
  const totalServicoExt = servicosExtItems.reduce((acc, s) => acc + (s.valor ?? 0), 0)

  const comprasItems = filtrarComprasVeiculo(comprasRealizadas, veiculo.id, start, end)
  const totalCompras = comprasItems.reduce((acc, c) => acc + c.totalNota, 0)

  const isMobile = variant === "mobile"

  const filtrosData = (
    <div className={isMobile ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-2 text-sm mb-1"}>
      {!isMobile && (
        <>
          <span><b>Placa:</b> {veiculo.placa}</span>
          <span><b>Modelo:</b> {veiculo.modelo}</span>
          <span><b>Marca:</b> {veiculo.marca}</span>
        </>
      )}
      <div className={`flex items-center gap-2 ${isMobile ? "flex-col" : "ml-auto"}`}>
        <Input
          type="date"
          value={start || ""}
          onChange={(e) => onDateChange("start", e.target.value)}
          className={isMobile ? "w-full h-9 text-xs" : "w-auto"}
        />
        {!isMobile && <span className="text-muted-foreground">até</span>}
        <Input
          type="date"
          value={end || ""}
          onChange={(e) => onDateChange("end", e.target.value)}
          className={isMobile ? "w-full h-9 text-xs" : "w-auto"}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onClearDates}
          className={isMobile ? "w-full h-9 text-[10px]" : ""}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  )

  const vazio = (msg = "Sem registros no período") => (
    <p className={`text-center text-muted-foreground ${isMobile ? "text-xs py-3" : "text-sm py-4"}`}>{msg}</p>
  )

  return (
    <div className="space-y-3">
      {filtrosData}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={isMobile ? "h-8 text-xs flex-1" : "h-8 text-xs"}
          onClick={() => setSecoesAbertas(new Set(TODAS_SECOES_CUSTO))}
        >
          Abrir todas
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={isMobile ? "h-8 text-xs flex-1" : "h-8 text-xs"}
          onClick={() => setSecoesAbertas(new Set())}
        >
          Recolher todas
        </Button>
      </div>

      <div className="space-y-2">
        <SecaoCascataCustos
          titulo="Saídas de Produtos (Manutenções)"
          total={totalSaidas}
          quantidade={filteredSaidas.length}
          aberta={secoesAbertas.has("saidas")}
          onOpenChange={(open) => toggleSecao("saidas", open)}
          exibirCusto={exibirCusto}
        >
          {filteredSaidas.length === 0 ? vazio() : isMobile ? (
            <div className="space-y-2">
              {filteredSaidas.map((s) => (
                <Card key={s.id} className="p-2 bg-background/80">
                  <div className="space-y-1">
                    <div className="font-medium text-xs">{s.produtoNome}</div>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                      <span>Qtd: {s.quantidade}</span>
                      <span>•</span>
                      <span>Unit: {typeof s.valorUnitario === "number" ? exibirCusto(s.valorUnitario) : "—"}</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">Total: {exibirCusto(s.quantidade * (s.valorUnitario ?? 0))}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {s.data ? new Date(s.data).toLocaleDateString("pt-BR") : "—"} • {s.responsavelNome}
                    </div>
                  </div>
                </Card>
              ))}
              <div className="font-bold text-right text-xs pt-2 border-t">Total: {exibirCusto(totalSaidas)}</div>
            </div>
          ) : (
            <>
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
                      <TableCell>{typeof s.valorUnitario === "number" ? exibirCusto(s.valorUnitario) : "—"}</TableCell>
                      <TableCell>{exibirCusto(s.quantidade * (s.valorUnitario ?? 0))}</TableCell>
                      <TableCell>{s.data ? new Date(s.data).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>{s.responsavelNome}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="font-bold text-right mt-2 text-sm">Total: {exibirCusto(totalSaidas)}</div>
            </>
          )}
        </SecaoCascataCustos>

        <SecaoCascataCustos
          titulo="Borracharia"
          total={totalBorracharia}
          quantidade={borrachariaItems.length}
          aberta={secoesAbertas.has("borracharia")}
          onOpenChange={(open) => toggleSecao("borracharia", open)}
          exibirCusto={exibirCusto}
        >
          {borrachariaItems.length === 0 ? vazio() : isMobile ? (
            <div className="space-y-1.5">
              {borrachariaItems.map((a) => (
                <Card key={a.id} className="p-2 bg-background/80">
                  <div className="font-medium text-xs">{a.preco ? exibirCusto(a.preco) : "—"}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(a.dataAutorizacao).toLocaleDateString("pt-BR")} • {a.autorizadoPorNome}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Autorizado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrachariaItems.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.dataAutorizacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{a.preco ? exibirCusto(a.preco) : "—"}</TableCell>
                    <TableCell>{a.autorizadoPorNome}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SecaoCascataCustos>

        <SecaoCascataCustos
          titulo="Lavador"
          total={totalLavador}
          quantidade={lavadorItems.length}
          aberta={secoesAbertas.has("lavador")}
          onOpenChange={(open) => toggleSecao("lavador", open)}
          exibirCusto={exibirCusto}
        >
          {lavadorItems.length === 0 ? vazio() : isMobile ? (
            <div className="space-y-1.5">
              {lavadorItems.map((a) => (
                <Card key={a.id} className="p-2 bg-background/80">
                  <div className="font-medium text-xs">{a.preco ? exibirCusto(a.preco) : "—"}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(a.dataAutorizacao).toLocaleDateString("pt-BR")} • {a.autorizadoPorNome}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Autorizado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lavadorItems.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.dataAutorizacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{a.preco ? exibirCusto(a.preco) : "—"}</TableCell>
                    <TableCell>{a.autorizadoPorNome}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SecaoCascataCustos>

        <SecaoCascataCustos
          titulo="Serviço Externo"
          total={totalServicoExt}
          quantidade={servicosExtItems.length}
          aberta={secoesAbertas.has("servico_externo")}
          onOpenChange={(open) => toggleSecao("servico_externo", open)}
          exibirCusto={exibirCusto}
        >
          {servicosExtItems.length === 0 ? vazio() : isMobile ? (
            <div className="space-y-1.5">
              {servicosExtItems.map((s) => (
                <Card key={s.id} className="p-2 bg-background/80">
                  <div className="font-medium text-xs">{s.valor ? exibirCusto(s.valor) : formatBRL(0)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(s.dataAutorizacao).toLocaleDateString("pt-BR")} • {s.fornecedorNome}
                  </div>
                  <div className="text-[10px] text-muted-foreground">OS: {s.ordemServicoNumero}</div>
                </Card>
              ))}
            </div>
          ) : (
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
                {servicosExtItems.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.dataAutorizacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{s.valor ? exibirCusto(s.valor) : formatBRL(0)}</TableCell>
                    <TableCell>{s.fornecedorNome}</TableCell>
                    <TableCell>{s.ordemServicoNumero}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SecaoCascataCustos>

        <SecaoCascataCustos
          titulo="Compras Realizadas"
          total={totalCompras}
          quantidade={comprasItems.length}
          aberta={secoesAbertas.has("compras")}
          onOpenChange={(open) => toggleSecao("compras", open)}
          exibirCusto={exibirCusto}
        >
          {comprasItems.length === 0 ? vazio() : isMobile ? (
            <div className="space-y-1.5">
              {comprasItems.map((c) => (
                <Card key={c.id} className="p-2 bg-background/80">
                  <div className="font-medium text-xs">OS {c.numeroOS} — {exibirCusto(c.totalNota)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(c.data).toLocaleDateString("pt-BR")} • {c.fornecedor ?? "Sem fornecedor"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{c.itens.length} item(ns)</div>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Fornecedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comprasItems.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.data).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{c.numeroOS}</TableCell>
                    <TableCell>{exibirCusto(c.totalNota)}</TableCell>
                    <TableCell>{c.fornecedor ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SecaoCascataCustos>
      </div>
    </div>
  )
}

function DetalheComprasRealizadasDialog({
  open,
  onClose,
  incluidas,
  excluidas,
  exibirCusto,
  periodoLabel,
}: {
  open: boolean
  onClose: () => void
  incluidas: CompraRealizada[]
  excluidas: { compra: CompraRealizada; motivo: string }[]
  exibirCusto: (valor: number) => string
  periodoLabel: string
}) {
  const totalIncluido = incluidas.reduce((acc, c) => acc + c.totalNota, 0)
  const totalExcluido = excluidas.reduce((acc, e) => acc + e.compra.totalNota, 0)

  const renderLinha = (compra: CompraRealizada, motivo?: string) => (
    <TableRow key={compra.id}>
      <TableCell className="font-mono text-xs">{compra.numeroOS}</TableCell>
      <TableCell>{compra.placa ?? "—"}</TableCell>
      <TableCell className="text-sm">{compra.veiculoModelo ?? "—"}</TableCell>
      <TableCell>{new Date(compra.data).toLocaleDateString("pt-BR")}</TableCell>
      <TableCell className="text-right">{exibirCusto(compra.totalNota)}</TableCell>
      {motivo != null && <TableCell className="text-xs text-muted-foreground">{motivo}</TableCell>}
    </TableRow>
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhamento — Compras Realizadas</DialogTitle>
          <DialogDescription>
            {periodoLabel}. Apenas compras de veículos ativos no período entram no total do card.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Badge className="bg-green-600 hover:bg-green-600">Incluídas na soma</Badge>
                <span className="text-muted-foreground font-normal">({incluidas.length})</span>
              </h3>
              <span className="font-bold text-green-700 dark:text-green-400">{exibirCusto(totalIncluido)}</span>
            </div>
            {incluidas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                Nenhuma compra incluída neste período.
              </p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OS</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{incluidas.map((c) => renderLinha(c))}</TableBody>
                </Table>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500 text-amber-700">Não incluídas</Badge>
                <span className="text-muted-foreground font-normal">({excluidas.length})</span>
              </h3>
              <span className="font-bold text-amber-700 dark:text-amber-400">{exibirCusto(totalExcluido)}</span>
            </div>
            {excluidas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                Todas as compras cadastradas estão incluídas na soma.
              </p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OS</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excluidas.map(({ compra, motivo }) => renderLinha(compra, motivo))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
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
  comprasRealizadas,
  totalCard,
  custoBorracharia,
  custoLavador,
  custoServicoExterno,
  custoComprasRealizadas,
  custoTotalGeral,
  custoQFrotas,
  setCustoQFrotas,
  onOpenComprasDetalhe,
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
  comprasRealizadas: CompraRealizada[]
  totalCard: number
  custoBorracharia: number
  custoLavador: number
  custoServicoExterno: number
  custoComprasRealizadas: number
  custoTotalGeral: number
  custoQFrotas: boolean
  setCustoQFrotas: (value: boolean) => void
  onOpenComprasDetalhe: () => void
}) {
  // Função helper para aplicar multiplicador
  const aplicarMultiplicador = (valor: number) => {
    return custoQFrotas ? valor * 1.36 : valor
  }
  const exibirCusto = (valor: number) => formatBRL(aplicarMultiplicador(valor))
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
          Custo QFrotas (+36%)
        </Label>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-2.5 mb-4 w-[98%]">
        <Card className="col-span-2 border-2 border-primary bg-primary/5">
          <CardContent className="py-3 px-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-[10px] text-muted-foreground mb-1">Custo Total Geral</div>
                <div className="text-lg font-bold text-primary">{exibirCusto(custoTotalGeral)}</div>
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
                <div className="text-sm font-bold">{exibirCusto(totalCard)}</div>
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
                <div className="text-sm font-bold">{exibirCusto(custoBorracharia)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2.5 px-3">
                <div className="text-[10px] text-muted-foreground mb-1">Lavadores</div>
                <div className="text-sm font-bold">{exibirCusto(custoLavador)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-2.5 px-3">
                <div className="text-[10px] text-muted-foreground mb-1">Serviço Externo</div>
                <div className="text-sm font-bold">{exibirCusto(custoServicoExterno)}</div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={onOpenComprasDetalhe}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onOpenComprasDetalhe()}
            >
              <CardContent className="py-2.5 px-3">
                <div className="text-[10px] text-muted-foreground mb-1">Compras Realizadas</div>
                <div className="text-sm font-bold">{exibirCusto(custoComprasRealizadas)}</div>
                <div className="text-[9px] text-muted-foreground mt-1">Toque para ver detalhes</div>
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
            const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, a) => acc + (a.preco ?? 0), 0);
            const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, a) => acc + (a.preco ?? 0), 0);
            const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id && (!start || new Date(s.dataAutorizacao) >= new Date(start)) && (!end || new Date(s.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, s) => acc + (s.valor ?? 0), 0);
            const compras = (start || end)
              ? filtrarComprasVeiculo(comprasRealizadas, v.id, start, end).reduce((acc, c) => acc + c.totalNota, 0)
              : v.custoComprasMensal;
            const totalComExtras = v.custoMensal + borras + lavs + servicosExt + compras;

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
                          {exibirCusto(totalComExtras)}
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          <div className="flex justify-between">
                            <span>Manutenções:</span>
                            <span className="font-medium">{exibirCusto(v.custoMensal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Borracharia:</span>
                            <span className="font-medium">{exibirCusto(borras)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lavador:</span>
                            <span className="font-medium">{exibirCusto(lavs)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Serviço Externo:</span>
                            <span className="font-medium">{exibirCusto(servicosExt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Compras Realizadas:</span>
                            <span className="font-medium">{exibirCusto(compras)}</span>
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
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <DetalhesCustosVeiculoExpandido
                        veiculo={v}
                        start={start}
                        end={end}
                        onDateChange={(field, value) => handleDateChange(v.id, field, value)}
                        onClearDates={() => setDateFilters((prev: any) => ({ ...prev, [v.id]: { start: undefined, end: undefined } }))}
                        autorizacoesBorracharia={autorizacoesBorracharia}
                        autorizacoesLavador={autorizacoesLavador}
                        servicosExternos={servicosExternos}
                        comprasRealizadas={comprasRealizadas}
                        exibirCusto={exibirCusto}
                        variant="mobile"
                      />
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
  const [comprasRealizadas, setComprasRealizadas] = useState<CompraRealizada[]>([])
  const [todasCompras, setTodasCompras] = useState<CompraRealizada[]>([])
  const [idsVeiculosAtivos, setIdsVeiculosAtivos] = useState<Set<string>>(new Set())
  const [comprasDetalheOpen, setComprasDetalheOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [dateFilters, setDateFilters] = useState<Record<string, { start?: string; end?: string }>>({})
  const [placaQuery, setPlacaQuery] = useState("")
  const [cardStartDate, setCardStartDate] = useState<string>("")
  const [cardEndDate, setCardEndDate] = useState<string>("")
  const [custoQFrotas, setCustoQFrotas] = useState(false)

  // Função helper para aplicar multiplicador
  const aplicarMultiplicador = (valor: number) => {
    return custoQFrotas ? valor * 1.36 : valor
  }
  const exibirCusto = (valor: number) => formatBRL(aplicarMultiplicador(valor))

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [veics, saids, borracharia, lavador, servicosExt, compras] = await Promise.all([
        getVeiculosSupabase(),
        getSaidasSupabase(),
        getAutorizacoesBorracharia(),
        getAutorizacoesLavador(),
        getServicosExternos(),
        getComprasRealizadasSupabase(),
      ])
      const veiculosAtivos = veics.filter((v) => v.status === "Ativo")
      const idsAtivos = new Set(veiculosAtivos.map((v) => v.id))
      setVeiculos(veiculosAtivos)
      setSaidas(saids)
      setAutorizacoesBorracharia(borracharia)
      setAutorizacoesLavador(lavador)
      setServicosExternos(servicosExt)
      setTodasCompras(compras)
      setIdsVeiculosAtivos(idsAtivos)
      setComprasRealizadas(compras.filter((c) => c.veiculoId && idsAtivos.has(c.veiculoId)))
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Calcular custo por veículo
  const { start: periodStart, end: periodEnd } = getPeriodoFiltro(cardStartDate, cardEndDate)

  const custosPorVeiculo = veiculos.map(v => {
    const saidasVeiculo = saidas.filter(s => s.veiculoId === v.id)
    const total = saidasVeiculo.reduce((acc, s) => acc + ((s.valorUnitario ?? 0) * s.quantidade), 0)

    const mensal = saidasVeiculo.reduce((acc, s) => {
      if (!s.data) return acc
      const d = new Date(s.data)
      if (d >= periodStart && d <= periodEnd) {
        return acc + ((s.valorUnitario ?? 0) * s.quantidade)
      }
      return acc
    }, 0)

    const custoComprasMensal = somarComprasVeiculo(comprasRealizadas, v.id, periodStart, periodEnd)

    return {
      ...v,
      custoTotal: total,
      saidas: saidasVeiculo,
      custoMensal: mensal,
      custoComprasMensal,
    }
  }).sort((a, b) => (b.custoMensal + b.custoComprasMensal) - (a.custoMensal + a.custoComprasMensal))

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

  const calcularCustoComprasRealizadas = () => {
    const { start: monthStart, end: monthEnd } = getPeriodoFiltro(cardStartDate, cardEndDate)
    return comprasRealizadas.reduce((acc, compra) => {
      const d = new Date(compra.data)
      if (d >= monthStart && d <= monthEnd) return acc + compra.totalNota
      return acc
    }, 0)
  }

  const custoComprasRealizadas = calcularCustoComprasRealizadas()

  const { incluidas: comprasIncluidas, excluidas: comprasExcluidas } = useMemo(
    () => classificarComprasParaCusto(todasCompras, idsVeiculosAtivos, periodStart, periodEnd),
    [todasCompras, idsVeiculosAtivos, periodStart, periodEnd],
  )

  const periodoComprasLabel = cardStartDate && cardEndDate
    ? `Período: ${new Date(cardStartDate + "T00:00:00").toLocaleDateString("pt-BR")} a ${new Date(cardEndDate + "T00:00:00").toLocaleDateString("pt-BR")}`
    : "Período: mês atual"

  // Calcular custo total geral (soma de todos os cards)
  const custoTotalGeral = totalCard + custoBorracharia + custoLavador + custoServicoExterno + custoComprasRealizadas

  const handleExportPDF = () => {
    // Filtrar veículos com custo 0
    const veiculosComCusto = listaFiltrada.filter(v => {
      const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
      const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((acc, a) => acc + (a.preco ?? 0), 0)
      const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((acc, s) => acc + (s.valor ?? 0), 0)
      const compras = v.custoComprasMensal
      const totalComExtras = v.custoMensal + borras + lavs + servicosExt + compras
      return aplicarMultiplicador(totalComExtras) > 0
    })

    // Calcular total
    const totalRelatorio = veiculosComCusto.reduce((acc, v) => {
      const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((sum, a) => sum + (a.preco ?? 0), 0)
      const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((sum, a) => sum + (a.preco ?? 0), 0)
      const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((sum, s) => sum + (s.valor ?? 0), 0)
      const totalComExtras = v.custoMensal + borras + lavs + servicosExt + v.custoComprasMensal
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
    const totalTexto = `Total: ${formatBRL(totalRelatorio)}`
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
      const totalComExtras = v.custoMensal + borras + lavs + servicosExt + v.custoComprasMensal
      return [
        v.placa,
        v.modelo,
        v.marca,
        v.secretaria,
        formatBRL(aplicarMultiplicador(totalComExtras))
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
        const totalComExtras = v.custoMensal + borras + lavs + servicosExt + v.custoComprasMensal
        return aplicarMultiplicador(totalComExtras) > 0
      })

      // Calcular total
      const totalRelatorio = veiculosComCusto.reduce((acc, v) => {
        const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id).reduce((sum, a) => sum + (a.preco ?? 0), 0)
        const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id).reduce((sum, a) => sum + (a.preco ?? 0), 0)
        const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id).reduce((sum, s) => sum + (s.valor ?? 0), 0)
        const totalComExtras = v.custoMensal + borras + lavs + servicosExt + v.custoComprasMensal
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
      totalRow.getCell(1).value = `Total: ${formatBRL(totalRelatorio)}`
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
        const totalComExtras = v.custoMensal + borras + lavs + servicosExt + v.custoComprasMensal
        
        const row = worksheet.addRow({
          placa: v.placa,
          modelo: v.modelo,
          marca: v.marca,
          secretaria: v.secretaria,
          custo: aplicarMultiplicador(totalComExtras),
        })
        
        row.getCell("custo").numFmt = '"R$" #.##0,00'
        
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

  const detalheComprasDialog = (
    <DetalheComprasRealizadasDialog
      open={comprasDetalheOpen}
      onClose={() => setComprasDetalheOpen(false)}
      incluidas={comprasIncluidas}
      excluidas={comprasExcluidas}
      exibirCusto={exibirCusto}
      periodoLabel={periodoComprasLabel}
    />
  )

  if (isMobile) {
    return (
      <>
        {detalheComprasDialog}
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
        comprasRealizadas={comprasRealizadas}
        totalCard={totalCard}
        custoBorracharia={custoBorracharia}
        custoLavador={custoLavador}
        custoServicoExterno={custoServicoExterno}
        custoComprasRealizadas={custoComprasRealizadas}
        custoTotalGeral={custoTotalGeral}
        custoQFrotas={custoQFrotas}
        setCustoQFrotas={setCustoQFrotas}
        onOpenComprasDetalhe={() => setComprasDetalheOpen(true)}
      />
      </>
    )
  }

  return (
    <React.Fragment>
      {detalheComprasDialog}
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
                Custo QFrotas (+36%)
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
              <div className="text-lg font-bold">{exibirCusto(totalCard)}</div>
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
              <div className="text-lg font-bold">{exibirCusto(custoBorracharia)}</div>
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
              <div className="text-lg font-bold">{exibirCusto(custoLavador)}</div>
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
              <div className="text-lg font-bold">{exibirCusto(custoServicoExterno)}</div>
            </CardContent>
          </Card>

          <Card
            className="sm:w-auto cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setComprasDetalheOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setComprasDetalheOpen(true)}
          >
            <CardContent className="py-3 px-4">
              <div className="text-xs text-muted-foreground">
                Custo Total Compras Realizadas
                {cardStartDate && cardEndDate ? (
                  <div className="mt-1">
                    {new Date(cardStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(cardEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                ) : (
                  <div className="mt-1">Mês atual</div>
                )}
              </div>
              <div className="text-lg font-bold">{exibirCusto(custoComprasRealizadas)}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Clique para ver detalhes</div>
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
              <div className="text-lg font-bold text-primary">{exibirCusto(custoTotalGeral)}</div>
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
                      // Calcular custos adicionais por veículo e período
                      const borras = autorizacoesBorracharia.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, a) => acc + (a.preco ?? 0), 0);
                      const lavs = autorizacoesLavador.filter(a => a.veiculoId === v.id && (!start || new Date(a.dataAutorizacao) >= new Date(start)) && (!end || new Date(a.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, a) => acc + (a.preco ?? 0), 0);
                      const servicosExt = servicosExternos.filter(s => s.veiculoId === v.id && (!start || new Date(s.dataAutorizacao) >= new Date(start)) && (!end || new Date(s.dataAutorizacao) <= (() => { let d = new Date(end); d.setHours(23,59,59,999); return d; })())).reduce((acc, s) => acc + (s.valor ?? 0), 0);
                      const compras = (start || end)
                        ? filtrarComprasVeiculo(comprasRealizadas, v.id, start, end).reduce((acc, c) => acc + c.totalNota, 0)
                        : v.custoComprasMensal;
                      const totalComExtras = v.custoMensal + borras + lavs + servicosExt + compras;
                      return (
                        <Fragment key={v.id}>
                          <TableRow className="hover:bg-blue-50/30">
                            <TableCell className="font-medium">{v.placa}</TableCell>
                            <TableCell>{v.modelo}</TableCell>
                            <TableCell>{v.marca}</TableCell>
                            <TableCell>{v.secretaria}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="font-bold text-lg text-primary">Total: {exibirCusto(totalComExtras)}</div>
                                <div className="text-xs text-muted-foreground">
                                  (Manutenções: {exibirCusto(v.custoMensal)} | Borracharia: {exibirCusto(borras)} | Lavador: {exibirCusto(lavs)} | Serviço Externo: {exibirCusto(servicosExt)} | Compras Realizadas: {exibirCusto(compras)})
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
                                <div className="p-4 bg-muted/30 rounded-md">
                                  <DetalhesCustosVeiculoExpandido
                                    veiculo={v}
                                    start={start}
                                    end={end}
                                    onDateChange={(field, value) => handleDateChange(v.id, field, value)}
                                    onClearDates={() => setDateFilters((prev) => ({ ...prev, [v.id]: { start: undefined, end: undefined } }))}
                                    autorizacoesBorracharia={autorizacoesBorracharia}
                                    autorizacoesLavador={autorizacoesLavador}
                                    servicosExternos={servicosExternos}
                                    comprasRealizadas={comprasRealizadas}
                                    exibirCusto={exibirCusto}
                                    variant="desktop"
                                  />
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
