"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/components/ui/use-mobile"
import {
  Plus, Trash2, Pencil, Printer, Search, X, ShoppingCart, PackageCheck, BadgeCheck,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  getComprasSupabase,
  addCompraSupabase,
  updateCompraSupabase,
  deleteCompraSupabase,
  type Compra,
  type CompraItem,
  type CompraInput,
} from "@/services/compras-service"

// ─── helpers ─────────────────────────────────────────────────────────────────

const newItemId = () => Math.random().toString(36).slice(2)

const formatDate = (iso?: string) =>
  iso ? format(new Date(iso), "dd/MM/yyyy", { locale: ptBR }) : "—"

const formatBRL = (v?: number) =>
  v != null
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—"

const totalCompra = (itens: CompraItem[]) =>
  itens.reduce((acc, i) => acc + (i.quantidade ?? 0) * (i.valorUnitario ?? 0), 0)

const STATUS_LABEL: Record<string, string> = {
  pedido: "Pedido",
  entregue: "Entregue",
  pago: "Pago",
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pedido: "bg-yellow-100 text-yellow-800 border-yellow-300",
    entregue: "bg-blue-100 text-blue-800 border-blue-300",
    pago: "bg-green-100 text-green-800 border-green-300",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? ""}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ─── Print view ──────────────────────────────────────────────────────────────

const C = {
  navy:   "#1e3a5f",
  blue:   "#1d4ed8",
  mid:    "#2563eb",
  light:  "#dbeafe",
  xlight: "#eff6ff",
  border: "#93c5fd",
  text:   "#1e3a5f",
  muted:  "#64748b",
  white:  "#ffffff",
  black:  "#000000",
}

// Via única — reutilizada duas vezes na impressão
function Via({ compra, label }: { compra: Compra; label: string }) {
  const total = totalCompra(compra.itens)
  const hasValues = compra.itens.some((i) => i.valorUnitario != null)

  const td: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    padding: "2px 5px",
    fontSize: 9,
    color: C.text,
    lineHeight: 1.3,
  }
  const thStyle: React.CSSProperties = {
    ...td,
    background: C.navy,
    color: C.white,
    fontWeight: 700,
    fontSize: 8,
    borderColor: C.navy,
    whiteSpace: "nowrap",
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: C.black, background: C.white, boxSizing: "border-box" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: `2px solid ${C.navy}`, paddingBottom: 4, marginBottom: 0 }}>
        <div style={{ flex: 1.2 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: C.navy, letterSpacing: 1, lineHeight: 1 }}>
            SEM<span style={{ color: C.mid }}>TRANSP</span>
          </div>
          <div style={{ fontSize: 8, color: C.muted }}>Secretaria Municipal de Transportes</div>
          <div style={{ fontSize: 7.5, color: C.muted }}>CNPJ: 30.417.158/0001-22 · Av. Herivelton Alves Marinho, 168 · CEP 28.250-000</div>
        </div>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: C.navy, letterSpacing: 0.5 }}>PEDIDO DE COMPRA</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 2 }}>
            <span style={{ border: `1px solid ${C.mid}`, borderRadius: 3, padding: "1px 5px", fontSize: 7, color: C.mid, fontWeight: 700 }}>
              Controle Interno — Não Fiscal
            </span>
            <span style={{ background: C.mid, borderRadius: 3, padding: "1px 6px", fontSize: 7, color: C.white, fontWeight: 700 }}>
              {label}
            </span>
          </div>
        </div>

        <div style={{ flex: 0.8, textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.mid, lineHeight: 1 }}>
            {String(compra.numero).padStart(6, "0")}
          </div>
          <div style={{ fontSize: 8, color: C.muted }}>{formatDate(compra.dataPedido)}</div>
        </div>
      </div>

      {/* ── INFO STRIP ── */}
      <div style={{ display: "flex", border: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, marginBottom: 0 }}>
        <div style={{ flex: 2.5, borderRight: `1px solid ${C.border}`, padding: "3px 6px", background: C.xlight }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Fornecedor</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.navy }}>{compra.fornecedor || "—"}</div>
        </div>
        <div style={{ flex: 1, borderRight: `1px solid ${C.border}`, padding: "3px 6px", background: C.xlight }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Nº NF Fornecedor</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: C.navy }}>{compra.notaFornecedor || "—"}</div>
        </div>
        <div style={{ flex: 0.8, borderRight: `1px solid ${C.border}`, padding: "3px 6px", background: C.xlight }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Status</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.navy }}>{STATUS_LABEL[compra.status]}</div>
        </div>
        {/* Total box integrado ao header */}
        <div style={{ flex: 0.9, padding: "3px 8px", background: C.blue, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase" }}>TOTAL DO PEDIDO</div>
          <div style={{ fontSize: 13, color: C.white, fontWeight: 900, lineHeight: 1.1 }}>
            {hasValues ? formatBRL(total) : "A definir"}
          </div>
        </div>
      </div>

      {/* ── ITEMS TABLE ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: "center", width: "4%" }}>#</th>
            <th style={{ ...thStyle, textAlign: "left" }}>DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
            <th style={{ ...thStyle, textAlign: "center", width: "7%" }}>QTD</th>
            <th style={{ ...thStyle, textAlign: "right", width: "13%" }}>VALOR UNIT.</th>
            <th style={{ ...thStyle, textAlign: "right", width: "13%" }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {compra.itens.map((item, idx) => (
            <tr key={item.id} style={{ background: idx % 2 === 0 ? C.white : C.xlight }}>
              <td style={{ ...td, textAlign: "center" }}>{idx + 1}</td>
              <td style={{ ...td }}>{item.descricao}</td>
              <td style={{ ...td, textAlign: "center" }}>{item.quantidade}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {item.valorUnitario != null ? formatBRL(item.valorUnitario) : "—"}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                {item.valorUnitario != null ? formatBRL(item.quantidade * item.valorUnitario) : "—"}
              </td>
            </tr>
          ))}
          {/* linhas em branco para preencher */}
          {Array.from({ length: Math.max(0, 8 - compra.itens.length) }).map((_, i) => (
            <tr key={`b${i}`} style={{ background: (compra.itens.length + i) % 2 === 0 ? C.white : C.xlight }}>
              <td style={{ ...td, height: 14 }}>&nbsp;</td>
              <td style={td}>&nbsp;</td>
              <td style={td}>&nbsp;</td>
              <td style={td}>&nbsp;</td>
              <td style={td}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── RODAPÉ ── */}
      <div style={{ display: "flex", border: `1px solid ${C.border}`, borderTop: "none" }}>
        <div style={{ flex: 1, borderRight: `1px solid ${C.border}`, padding: "4px 6px" }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Observações</div>
          <div style={{ fontSize: 8, color: C.text, minHeight: 20, whiteSpace: "pre-wrap" }}>{compra.observacoes || "—"}</div>
        </div>
        <div style={{ flex: 1, borderRight: `1px solid ${C.border}`, padding: "4px 6px" }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Assinatura do Secretário</div>
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.black}`, paddingTop: 2, textAlign: "center" }}>
            <div style={{ fontSize: 8, fontWeight: 700 }}>Leonardo Almeida</div>
            <div style={{ fontSize: 7, color: C.muted }}>Secretário de Transportes</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "4px 6px" }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>Assinatura do Fornecedor</div>
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.black}`, paddingTop: 2 }}>&nbsp;</div>
        </div>
      </div>
    </div>
  )
}

function PrintView({ compra }: { compra: Compra }) {
  return (
    <div id="print-area" style={{ background: C.white, padding: "12px 16px", maxWidth: 800, margin: "0 auto" }}>
      <Via compra={compra} label="VIA SECRETARIA" />
      <div style={{ margin: "10px 0", borderTop: "1px dashed #aaa", textAlign: "center", paddingTop: 4 }}>
        <span style={{ fontSize: 8, color: "#aaa", letterSpacing: 2 }}>✂ RECORTAR AQUI</span>
      </div>
      <Via compra={compra} label="VIA FORNECEDOR" />
    </div>
  )
}

// ─── Item row inside the form ─────────────────────────────────────────────────

function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: CompraItem
  onChange: (updated: CompraItem) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-5">
        <Input
          placeholder="Descrição do item"
          value={item.descricao}
          onChange={(e) => onChange({ ...item, descricao: e.target.value })}
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Qtde"
          min={1}
          value={item.quantidade || ""}
          onChange={(e) => onChange({ ...item, quantidade: Number(e.target.value) })}
        />
      </div>
      <div className="col-span-3">
        <Input
          type="number"
          placeholder="Valor unit. (R$)"
          step="0.01"
          min={0}
          value={item.valorUnitario ?? ""}
          onChange={(e) =>
            onChange({
              ...item,
              valorUnitario: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      </div>
      <div className="col-span-1 text-right text-sm text-muted-foreground">
        {item.valorUnitario != null && item.quantidade > 0
          ? formatBRL(item.quantidade * item.valorUnitario)
          : ""}
      </div>
      <div className="col-span-1 flex justify-end">
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

// ─── Form dialog ──────────────────────────────────────────────────────────────

function CompraFormDialog({
  open,
  compra,
  onClose,
  onSave,
}: {
  open: boolean
  compra: Compra | null
  onClose: () => void
  onSave: (input: CompraInput) => Promise<void>
}) {
  const [itens, setItens] = useState<CompraItem[]>([])
  const [status, setStatus] = useState<"pedido" | "entregue" | "pago">("pedido")
  const [fornecedor, setFornecedor] = useState("")
  const [notaFornecedor, setNotaFornecedor] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [dataPedido, setDataPedido] = useState(format(new Date(), "yyyy-MM-dd"))
  const [dataEntrega, setDataEntrega] = useState("")
  const [dataPagamento, setDataPagamento] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (compra) {
      setItens(compra.itens.map((i) => ({ ...i })))
      setStatus(compra.status)
      setFornecedor(compra.fornecedor ?? "")
      setNotaFornecedor(compra.notaFornecedor ?? "")
      setObservacoes(compra.observacoes ?? "")
      setDataPedido(compra.dataPedido ? compra.dataPedido.slice(0, 10) : format(new Date(), "yyyy-MM-dd"))
      setDataEntrega(compra.dataEntrega ? compra.dataEntrega.slice(0, 10) : "")
      setDataPagamento(compra.dataPagamento ? compra.dataPagamento.slice(0, 10) : "")
    } else {
      setItens([{ id: newItemId(), descricao: "", quantidade: 1 }])
      setStatus("pedido")
      setFornecedor("")
      setNotaFornecedor("")
      setObservacoes("")
      setDataPedido(format(new Date(), "yyyy-MM-dd"))
      setDataEntrega("")
      setDataPagamento("")
    }
  }, [compra, open])

  const addItem = () =>
    setItens((prev) => [...prev, { id: newItemId(), descricao: "", quantidade: 1 }])

  const updateItem = (id: string, updated: CompraItem) =>
    setItens((prev) => prev.map((i) => (i.id === id ? updated : i)))

  const removeItem = (id: string) =>
    setItens((prev) => prev.filter((i) => i.id !== id))

  const handleSubmit = async () => {
    if (itens.some((i) => !i.descricao.trim())) {
      alert("Preencha a descrição de todos os itens.")
      return
    }
    setSaving(true)
    await onSave({
      status,
      fornecedor: fornecedor || undefined,
      notaFornecedor: notaFornecedor || undefined,
      observacoes: observacoes || undefined,
      itens,
      dataPedido: dataPedido ? new Date(dataPedido + "T12:00:00").toISOString() : undefined,
      dataEntrega: dataEntrega ? new Date(dataEntrega + "T12:00:00").toISOString() : undefined,
      dataPagamento: dataPagamento ? new Date(dataPagamento + "T12:00:00").toISOString() : undefined,
    })
    setSaving(false)
  }

  const total = totalCompra(itens)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{compra ? "Editar Pedido de Compra" : "Novo Pedido de Compra"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fornecedor</Label>
              <Input
                placeholder="Nome do fornecedor"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pedido">Pedido</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2 – dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Data do Pedido</Label>
              <Input type="date" value={dataPedido} onChange={(e) => setDataPedido(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Data de Entrega</Label>
              <Input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Data de Pagamento</Label>
              <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
            </div>
          </div>

          {/* Nota fornecedor */}
          <div className="space-y-1">
            <Label>Nº Nota Fiscal do Fornecedor</Label>
            <Input
              placeholder="Preencher após recebimento"
              value={notaFornecedor}
              onChange={(e) => setNotaFornecedor(e.target.value)}
            />
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-0">
              <div className="col-span-5">Descrição</div>
              <div className="col-span-2">Qtde</div>
              <div className="col-span-3">Valor Unit. (R$)</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>
            {itens.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onChange={(u) => updateItem(item.id, u)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-1">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Item
            </Button>
            {total > 0 && (
              <p className="text-right text-sm font-semibold pr-8">
                Total: {formatBRL(total)}
              </p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              placeholder="Informações adicionais..."
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Print dialog ─────────────────────────────────────────────────────────────

function PrintDialog({
  open,
  compra,
  onClose,
}: {
  open: boolean
  compra: Compra | null
  onClose: () => void
}) {
  const handlePrint = () => {
    const el = document.getElementById("print-area")
    if (!el) return
    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) return
    win.document.write(`
      <html><head><title>Pedido de Compra</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 9px; color: #000; background: #fff; margin: 0; padding: 8px 12px; }
        table { border-collapse: collapse; width: 100%; }
        @page { margin: 8mm; size: A4 portrait; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>${el.innerHTML}</body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  if (!compra) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedido de Compra #{String(compra.numero).padStart(6, "0")}</DialogTitle>
        </DialogHeader>
        <PrintView compra={compra} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ComprasPage() {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Compra | null>(null)

  const [printOpen, setPrintOpen] = useState(false)
  const [printTarget, setPrintTarget] = useState<Compra | null>(null)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setCompras(await getComprasSupabase())
    } catch (e: any) {
      toast({ title: "Erro ao carregar compras", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = compras
    if (statusFilter !== "todos") list = list.filter((c) => c.status === statusFilter)
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(
        (c) =>
          String(c.numero).includes(s) ||
          (c.fornecedor ?? "").toLowerCase().includes(s) ||
          c.itens.some((i) => i.descricao.toLowerCase().includes(s)),
      )
    }
    return list
  }, [compras, search, statusFilter])

  const handleSave = async (input: CompraInput) => {
    try {
      if (editTarget) {
        await updateCompraSupabase(editTarget.id, input)
        toast({ title: "Pedido atualizado com sucesso" })
      } else {
        await addCompraSupabase(input)
        toast({ title: "Pedido criado com sucesso" })
      }
      setFormOpen(false)
      setEditTarget(null)
      await load()
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCompraSupabase(id)
      toast({ title: "Pedido excluído" })
      setDeleteId(null)
      await load()
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" })
    }
  }

  const openEdit = (c: Compra) => {
    setEditTarget(c)
    setFormOpen(true)
  }

  const openPrint = (c: Compra) => {
    setPrintTarget(c)
    setPrintOpen(true)
  }

  const openNew = () => {
    setEditTarget(null)
    setFormOpen(true)
  }

  // summary counts
  const counts = useMemo(() => ({
    pedido: compras.filter((c) => c.status === "pedido").length,
    entregue: compras.filter((c) => c.status === "entregue").length,
    pago: compras.filter((c) => c.status === "pago").length,
  }), [compras])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compras</h1>
          <p className="text-muted-foreground text-sm">Pedidos de compra da secretaria</p>
        </div>
        <Button onClick={openNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Novo Pedido
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "pedido" ? "ring-2 ring-yellow-400" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "pedido" ? "todos" : "pedido")}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <ShoppingCart className="h-7 w-7 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pedidos</p>
              <p className="text-xl font-bold">{counts.pedido}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "entregue" ? "ring-2 ring-blue-400" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "entregue" ? "todos" : "entregue")}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <PackageCheck className="h-7 w-7 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Entregues</p>
              <p className="text-xl font-bold">{counts.entregue}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "pago" ? "ring-2 ring-green-400" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "pago" ? "todos" : "pago")}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <BadgeCheck className="h-7 w-7 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pagos</p>
              <p className="text-xl font-bold">{counts.pago}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search / filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por número, fornecedor ou item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pedido">Pedido</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table / mobile cards */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 opacity-30" />
          <p>Nenhum pedido encontrado.</p>
          <Button variant="outline" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Criar primeiro pedido
          </Button>
        </div>
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-base">#{String(c.numero).padStart(6, "0")}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm text-muted-foreground">{c.fornecedor || "Sem fornecedor"}</p>
                <p className="text-xs text-muted-foreground">
                  {c.itens.length} {c.itens.length === 1 ? "item" : "itens"} · {formatDate(c.dataPedido)}
                </p>
                {totalCompra(c.itens) > 0 && (
                  <p className="text-sm font-semibold">{formatBRL(totalCompra(c.itens))}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => openPrint(c)}>
                    <Printer className="h-3 w-3 mr-1" /> Imprimir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Nº Pedido</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="w-20">Itens</TableHead>
                <TableHead className="w-28">Data</TableHead>
                <TableHead className="w-28">Total</TableHead>
                <TableHead className="w-32">Nota Fornec.</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold">
                    #{String(c.numero).padStart(6, "0")}
                  </TableCell>
                  <TableCell>{c.fornecedor || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-center">{c.itens.length}</TableCell>
                  <TableCell>{formatDate(c.dataPedido)}</TableCell>
                  <TableCell>
                    {totalCompra(c.itens) > 0 ? formatBRL(totalCompra(c.itens)) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {c.notaFornecedor || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Imprimir" onClick={() => openPrint(c)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        onClick={() => setDeleteId(c.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <CompraFormDialog
        open={formOpen}
        compra={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSave={handleSave}
      />

      <PrintDialog
        open={printOpen}
        compra={printTarget}
        onClose={() => { setPrintOpen(false); setPrintTarget(null) }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
