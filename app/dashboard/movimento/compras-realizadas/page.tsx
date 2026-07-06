"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/components/ui/use-mobile"
import {
  Upload, Trash2, Eye, Search, Car, AlertTriangle, CheckCircle2, Loader2,
  FileWarning, ClipboardList, Pencil, FileText,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  getComprasRealizadasSupabase,
  addCompraRealizadaSupabase,
  updateCompraRealizadaSupabase,
  deleteCompraRealizadaSupabase,
  getCompraRealizadaPorNumeroOSSupabase,
  salvarPdfAnexoSupabase,
  obterUrlPdfAnexoSupabase,
  type CompraRealizada,
} from "@/services/compra-realizada-service"
import { getVeiculosSupabase, type Veiculo } from "@/services/veiculo-service"
import { SelecionarVeiculoDialog } from "@/components/selecionar-veiculo-dialog"
import { DeleteConfirmation } from "@/components/delete-confirmation"

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso?: string | null) =>
  iso ? format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"

const formatBRL = (v?: number | null) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"

const normalizePlaca = (p: string) => p.replace(/[^A-Z0-9]/gi, "").toUpperCase()

interface ParsedResultOk {
  ok: true
  arquivoNome: string
  numeroOS: string | null
  placa: string | null
  fornecedor: string | null
  dataISO: string | null
  itens: { codigo: string; descricao: string; quantidade: number; valorUnitario: number; valorTotal: number }[]
  totalNota: number | null
  avisos: string[]
}
interface ParsedResultErro {
  ok: false
  arquivoNome: string
  erro: string
}
type ParsedResult = ParsedResultOk | ParsedResultErro

interface ImportRow {
  key: string
  file: File
  parsed: ParsedResult
  veiculoId: string | null
  veiculoModelo: string | null
  semVeiculoConfirmado: boolean
  duplicado: boolean
  reimportar: boolean
  incluir: boolean
}

// ─── Import dialog ─────────────────────────────────────────────────────────────

function ImportarPdfsDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  onImported: () => void
}) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setRows([])
      setUploading(false)
    }
  }, [open])

  const handlePickFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    try {
      const veiculosData = await getVeiculosSupabase()
      setVeiculos(veiculosData)

      const filesArray = Array.from(fileList)
      const formData = new FormData()
      filesArray.forEach((f) => formData.append("files", f))

      const res = await fetch("/api/compras-realizadas/parse", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Falha ao processar os PDFs no servidor.")
      const { results } = (await res.json()) as { results: ParsedResult[] }

      const newRows: ImportRow[] = await Promise.all(
        results.map(async (parsed, idx) => {
          let veiculoId: string | null = null
          let veiculoModelo: string | null = null
          if (parsed.ok && parsed.placa) {
            const alvo = normalizePlaca(parsed.placa)
            const match = veiculosData.find((v) => normalizePlaca(v.placa) === alvo)
            if (match) {
              veiculoId = match.id
              veiculoModelo = `${match.modelo} (${match.placa})`
            }
          }
          const duplicado =
            parsed.ok && !!parsed.numeroOS && !!(await getCompraRealizadaPorNumeroOSSupabase(parsed.numeroOS))
          return {
            key: `${parsed.arquivoNome}-${Date.now()}-${idx}`,
            file: filesArray[idx],
            parsed,
            veiculoId,
            veiculoModelo,
            semVeiculoConfirmado: false,
            duplicado,
            reimportar: false,
            incluir: parsed.ok,
          }
        }),
      )
      setRows((prev) => [...prev, ...newRows])
    } catch (e: any) {
      toast({ title: "Erro ao importar PDFs", description: e.message, variant: "destructive" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSelectVeiculo = (veiculo: Veiculo) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === editingRowKey
          ? { ...r, veiculoId: veiculo.id, veiculoModelo: `${veiculo.modelo} (${veiculo.placa})`, semVeiculoConfirmado: false }
          : r,
      ),
    )
    setEditingRowKey(null)
  }

  const toggleIncluir = (key: string, value: boolean) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, incluir: value } : r)))

  const toggleReimportar = (key: string, value: boolean) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, reimportar: value } : r)))

  const marcarSemVeiculo = (key: string) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, semVeiculoConfirmado: true } : r)))

  const marcarTodosParaReimportar = () =>
    setRows((prev) => prev.map((r) => (r.duplicado ? { ...r, reimportar: true } : r)))

  const prontosParaImportar = rows.filter(
    (r) => r.parsed.ok && r.incluir && (!r.duplicado || r.reimportar),
  )
  const qtdDuplicados = rows.filter((r) => r.duplicado && !r.reimportar).length

  const handleConfirmarImportacao = async () => {
    setSaving(true)
    let importados = 0
    try {
      for (const row of prontosParaImportar) {
        if (!row.parsed.ok) continue
        const p = row.parsed
        const existente = p.numeroOS ? await getCompraRealizadaPorNumeroOSSupabase(p.numeroOS) : null
        const input = {
          numeroOS: p.numeroOS ?? p.arquivoNome,
          placa: p.placa,
          veiculoId: row.veiculoId,
          veiculoModelo: row.veiculoModelo,
          data: p.dataISO ?? new Date().toISOString(),
          fornecedor: p.fornecedor,
          itens: p.itens,
          totalNota: p.totalNota ?? 0,
          arquivoNome: p.arquivoNome,
        }
        const salvo =
          existente && row.reimportar
            ? await updateCompraRealizadaSupabase(existente.id, input)
            : await addCompraRealizadaSupabase(input)
        try {
          await salvarPdfAnexoSupabase(salvo.id, row.file, p.arquivoNome)
        } catch (e: any) {
          toast({ title: `PDF de "${p.arquivoNome}" não pôde ser anexado`, description: e.message, variant: "destructive" })
        }
        importados++
      }
      toast({ title: "Importação concluída", description: `${importados} nota(s) importada(s).` })
      onImported()
      onClose()
    } catch (e: any) {
      toast({ title: "Erro ao salvar lançamentos", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Ordens de Serviço (PDF)</DialogTitle>
            <DialogDescription>
              Selecione um ou mais PDFs de Ordem de Serviço. O sistema lê Placa, data, código, produtos, preço e total
              de cada nota automaticamente.
            </DialogDescription>
          </DialogHeader>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed rounded-md">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum arquivo selecionado ainda.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handlePickFiles(e.target.files)}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? "Processando..." : "Selecionar PDFs"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{rows.length} arquivo(s) processado(s)</p>
                <div className="flex gap-2">
                  {qtdDuplicados > 0 && (
                    <Button variant="outline" size="sm" onClick={marcarTodosParaReimportar}>
                      Substituir todos já importados ({qtdDuplicados})
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Adicionar mais
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePickFiles(e.target.files)}
                />
              </div>

              <div className="rounded-md border divide-y">
                {rows.map((row) => (
                  <div key={row.key} className="p-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox
                          checked={row.incluir}
                          disabled={!row.parsed.ok}
                          onCheckedChange={(v) => toggleIncluir(row.key, !!v)}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{row.key}</p>
                          {row.parsed.ok && (
                            <p className="text-xs text-muted-foreground">
                              OS {row.parsed.numeroOS ?? "?"} · {row.parsed.itens.length} item(ns) ·{" "}
                              {formatBRL(row.parsed.totalNota)} · {formatDate(row.parsed.dataISO)}
                            </p>
                          )}
                        </div>
                      </div>
                      {!row.parsed.ok ? (
                        <Badge variant="destructive" className="shrink-0">
                          <FileWarning className="h-3 w-3 mr-1" /> Falhou
                        </Badge>
                      ) : row.duplicado ? (
                        <Badge variant="outline" className="shrink-0 border-amber-400 text-amber-700">
                          Já importado
                        </Badge>
                      ) : row.veiculoId ? (
                        <Badge variant="outline" className="shrink-0 border-green-400 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Veículo OK
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 border-orange-400 text-orange-700">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Sem veículo
                        </Badge>
                      )}
                    </div>

                    {!row.parsed.ok && <p className="text-xs text-destructive pl-6">{row.parsed.erro}</p>}

                    {row.parsed.ok && row.parsed.avisos.length > 0 && (
                      <p className="text-xs text-muted-foreground pl-6">{row.parsed.avisos.join(" · ")}</p>
                    )}

                    {row.parsed.ok && (
                      <div className="pl-6 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Placa: <strong>{row.parsed.placa ?? "não identificada"}</strong>
                        </span>
                        {row.veiculoModelo && (
                          <span className="text-xs text-muted-foreground">→ {row.veiculoModelo}</span>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setEditingRowKey(row.key)}
                        >
                          <Car className="h-3 w-3 mr-1" /> Selecionar veículo
                        </Button>
                        {!row.veiculoId && !row.semVeiculoConfirmado && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground"
                            onClick={() => marcarSemVeiculo(row.key)}
                          >
                            Importar sem veículo
                          </Button>
                        )}
                      </div>
                    )}

                    {row.duplicado && (
                      <label className="pl-6 flex items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox checked={row.reimportar} onCheckedChange={(v) => toggleReimportar(row.key, !!v)} />
                        Substituir lançamento já importado desta OS
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarImportacao} disabled={saving || prontosParaImportar.length === 0}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmar Importação ({prontosParaImportar.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelecionarVeiculoDialog
        open={editingRowKey !== null}
        onOpenChange={(v) => !v && setEditingRowKey(null)}
        onSelect={handleSelectVeiculo}
      />
    </>
  )
}

// ─── Itens dialog ───────────────────────────────────────────────────────────────

function ItensDialog({ compra, onClose }: { compra: CompraRealizada | null; onClose: () => void }) {
  if (!compra) return null
  return (
    <Dialog open={!!compra} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>OS {compra.numeroOS} — Itens</DialogTitle>
          <DialogDescription>
            {compra.placa ?? "Sem placa"} {compra.veiculoModelo ? `· ${compra.veiculoModelo}` : ""} ·{" "}
            {formatDate(compra.data)}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="w-16 text-right">Qtd</TableHead>
                <TableHead className="w-28 text-right">Valor Unit.</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compra.itens.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                  <TableCell className="text-sm">{item.descricao}</TableCell>
                  <TableCell className="text-right">{item.quantidade}</TableCell>
                  <TableCell className="text-right">{formatBRL(item.valorUnitario)}</TableCell>
                  <TableCell className="text-right">{formatBRL(item.valorTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-right font-semibold pr-2">Total da nota: {formatBRL(compra.totalNota)}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ComprasRealizadasPage() {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [compras, setCompras] = useState<CompraRealizada[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [importOpen, setImportOpen] = useState(false)
  const [itensTarget, setItensTarget] = useState<CompraRealizada | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [veiculoEditId, setVeiculoEditId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setCompras(await getComprasRealizadasSupabase())
    } catch (e: any) {
      toast({ title: "Erro ao carregar lançamentos", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return compras
    const s = search.toLowerCase()
    return compras.filter(
      (c) =>
        c.numeroOS.toLowerCase().includes(s) ||
        (c.placa ?? "").toLowerCase().includes(s) ||
        (c.veiculoModelo ?? "").toLowerCase().includes(s) ||
        (c.fornecedor ?? "").toLowerCase().includes(s) ||
        c.itens.some((i) => i.descricao.toLowerCase().includes(s) || i.codigo.includes(s)),
    )
  }, [compras, search])

  const resumo = useMemo(() => ({
    totalGasto: compras.reduce((a, c) => a + c.totalNota, 0),
    qtdNotas: compras.length,
    semVeiculo: compras.filter((c) => !c.veiculoId).length,
  }), [compras])

  const handleDelete = async (id: string) => {
    try {
      await deleteCompraRealizadaSupabase(id)
      toast({ title: "Lançamento excluído" })
      setDeleteId(null)
      load()
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" })
    }
  }

  const handleVerPdf = async (compra: CompraRealizada) => {
    if (!compra.pdfPath) {
      toast({ title: "PDF não disponível", description: "Este lançamento não tem o PDF original anexado.", variant: "destructive" })
      return
    }
    try {
      const url = await obterUrlPdfAnexoSupabase(compra.pdfPath)
      window.open(url, "_blank")
    } catch (e: any) {
      toast({ title: "Erro ao abrir o PDF", description: e.message, variant: "destructive" })
    }
  }

  const handleSelectVeiculo = async (veiculo: Veiculo) => {
    if (!veiculoEditId) return
    try {
      await updateCompraRealizadaSupabase(veiculoEditId, {
        veiculoId: veiculo.id,
        veiculoModelo: `${veiculo.modelo} (${veiculo.placa})`,
      })
      toast({ title: "Veículo vinculado" })
      setVeiculoEditId(null)
      load()
    } catch (e: any) {
      toast({ title: "Erro ao vincular veículo", description: e.message, variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compras Realizadas</h1>
          <p className="text-muted-foreground text-sm">
            Lançamentos importados de Ordens de Serviço em PDF, por veículo
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)} className="w-full sm:w-auto">
          <Upload className="h-4 w-4 mr-2" /> Importar PDFs
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ClipboardList className="h-7 w-7 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="text-xl font-bold">{resumo.qtdNotas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Car className="h-7 w-7 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sem veículo</p>
              <p className="text-xl font-bold">{resumo.semVeiculo}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-7 w-7 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total gasto</p>
              <p className="text-xl font-bold">{formatBRL(resumo.totalGasto)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por OS, placa, veículo, fornecedor ou produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <ClipboardList className="h-12 w-12 opacity-30" />
          <p>Nenhum lançamento encontrado.</p>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" /> Importar PDFs
          </Button>
        </div>
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-base">OS {c.numeroOS}</span>
                  <span className="text-sm font-semibold">{formatBRL(c.totalNota)}</span>
                </div>
                <p className="text-sm">
                  {c.placa ?? "Sem placa"} {c.veiculoModelo ? `· ${c.veiculoModelo}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.itens.length} item(ns) · {formatDate(c.data)}
                </p>
                <div className="flex gap-2 pt-1 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setItensTarget(c)}>
                    <Eye className="h-3 w-3 mr-1" /> Itens
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleVerPdf(c)}>
                    <FileText className="h-3 w-3 mr-1" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setVeiculoEditId(c.id)}>
                    <Car className="h-3 w-3 mr-1" /> Veículo
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
                <TableHead className="w-20">Nº OS</TableHead>
                <TableHead className="w-28">Placa</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead className="w-36">Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="w-16 text-center">Itens</TableHead>
                <TableHead className="w-28">Total</TableHead>
                <TableHead className="w-40 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-semibold">{c.numeroOS}</TableCell>
                  <TableCell>{c.placa ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {c.veiculoModelo ?? (
                      <Badge variant="outline" className="border-orange-400 text-orange-700">
                        Sem veículo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(c.data)}</TableCell>
                  <TableCell>{c.fornecedor ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-center">{c.itens.length}</TableCell>
                  <TableCell>{formatBRL(c.totalNota)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Ver itens" onClick={() => setItensTarget(c)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Ver PDF" onClick={() => handleVerPdf(c)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Vincular veículo" onClick={() => setVeiculoEditId(c.id)}>
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

      <ImportarPdfsDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={load} />
      <ItensDialog compra={itensTarget} onClose={() => setItensTarget(null)} />

      <SelecionarVeiculoDialog
        open={veiculoEditId !== null}
        onOpenChange={(v) => !v && setVeiculoEditId(null)}
        onSelect={handleSelectVeiculo}
      />

      <DeleteConfirmation
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Excluir lançamento"
        description="Tem certeza que deseja excluir esta compra realizada? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
