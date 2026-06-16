"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getVeiculosSupabase, type Veiculo } from "@/services/veiculo-service"
import {
  addDespesaNotaSupabase,
  deleteDespesaNotaSupabase,
  getDespesasNotasSupabase,
  getImagemNotaUrlAssinada,
  uploadImagemNotaSupabase,
  type DespesaNota,
  type DespesaNotaItem,
} from "@/services/despesa-nota-service"
import { parseTextoNota } from "@/lib/ocr-nota-parser"
import { FileImage, Loader2, Plus, Trash2, Upload, ScanLine, ExternalLink, Camera } from "lucide-react"
import { MobileBackButton } from "@/components/mobile-back-button"

export default function ArquivoPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [despesas, setDespesas] = useState<DespesaNota[]>([])
  const [carregandoLista, setCarregandoLista] = useState(true)

  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processandoOcr, setProcessandoOcr] = useState(false)
  const [progressoOcr, setProgressoOcr] = useState(0)
  const [salvando, setSalvando] = useState(false)

  const [numeroNota, setNumeroNota] = useState("")
  const [dataNota, setDataNota] = useState("")
  const [fornecedor, setFornecedor] = useState("")
  const [semPlaca, setSemPlaca] = useState(false)
  const [veiculoId, setVeiculoId] = useState<string>("")
  const [itens, setItens] = useState<DespesaNotaItem[]>([])
  const [valorTotal, setValorTotal] = useState("")
  const [textoExtraido, setTextoExtraido] = useState("")

  useEffect(() => {
    carregarVeiculos()
    carregarDespesas()
  }, [])

  const carregarVeiculos = async () => {
    try {
      const data = await getVeiculosSupabase()
      setVeiculos(data)
    } catch {
      toast({ title: "Erro ao carregar veículos", variant: "destructive" })
    }
  }

  const carregarDespesas = async () => {
    setCarregandoLista(true)
    try {
      const data = await getDespesasNotasSupabase()
      setDespesas(data)
    } catch {
      toast({ title: "Erro ao carregar despesas registradas", variant: "destructive" })
    } finally {
      setCarregandoLista(false)
    }
  }

  const resetarFormulario = () => {
    setArquivo(null)
    setPreviewUrl(null)
    setNumeroNota("")
    setDataNota("")
    setFornecedor("")
    setSemPlaca(false)
    setVeiculoId("")
    setItens([])
    setValorTotal("")
    setTextoExtraido("")
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const handleArquivoSelecionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivo(file)
    setPreviewUrl(URL.createObjectURL(file))
    setNumeroNota("")
    setDataNota("")
    setVeiculoId("")
    setSemPlaca(false)
    setItens([])
    setValorTotal("")
    setTextoExtraido("")

    await rodarOcr(file)
  }

  const rodarOcr = async (file: File) => {
    setProcessandoOcr(true)
    setProgressoOcr(0)
    try {
      const Tesseract = await import("tesseract.js")
      const { data } = await Tesseract.recognize(file, "por", {
        logger: (m: any) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setProgressoOcr(Math.round(m.progress * 100))
          }
        },
      })

      const texto = data.text || ""
      setTextoExtraido(texto)

      const extraido = parseTextoNota(texto)
      setNumeroNota(extraido.numeroNota || "")
      setDataNota(extraido.dataNota || "")
      setValorTotal(extraido.valorTotal ? extraido.valorTotal.toFixed(2).replace(".", ",") : "")
      setItens(
        extraido.itens.length
          ? extraido.itens
          : [{ descricao: "", quantidade: 1, valorUnitario: 0, valorTotal: 0 }]
      )

      if (extraido.placa) {
        const veiculoEncontrado = veiculos.find(
          (v) => v.placa.replace(/[\s-]/g, "").toUpperCase() === extraido.placa
        )
        if (veiculoEncontrado) {
          setVeiculoId(veiculoEncontrado.id)
        } else {
          setSemPlaca(true)
        }
      } else {
        setSemPlaca(true)
      }

      toast({ title: "Leitura concluída", description: "Revise os campos extraídos antes de salvar." })
    } catch (error) {
      console.error("Erro no OCR:", error)
      toast({
        title: "Erro ao ler a imagem",
        description: "Preencha os campos manualmente.",
        variant: "destructive",
      })
      setItens([{ descricao: "", quantidade: 1, valorUnitario: 0, valorTotal: 0 }])
    } finally {
      setProcessandoOcr(false)
    }
  }

  const atualizarItem = (index: number, campo: keyof DespesaNotaItem, valor: string) => {
    setItens((prev) => {
      const novos = [...prev]
      const item = { ...novos[index] }
      if (campo === "descricao") {
        item.descricao = valor
      } else {
        const numero = parseFloat(valor.replace(",", ".")) || 0
        if (campo === "quantidade") item.quantidade = numero
        if (campo === "valorUnitario") item.valorUnitario = numero
        if (campo === "valorTotal") item.valorTotal = numero
      }
      novos[index] = item
      return novos
    })
  }

  const adicionarItem = () => {
    setItens((prev) => [...prev, { descricao: "", quantidade: 1, valorUnitario: 0, valorTotal: 0 }])
  }

  const removerItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index))
  }

  const totalCalculadoItens = itens.reduce((soma, item) => soma + (item.valorTotal || 0), 0)

  const handleSalvar = async () => {
    if (!arquivo) {
      toast({ title: "Selecione uma imagem da nota", variant: "destructive" })
      return
    }
    if (!semPlaca && !veiculoId) {
      toast({ title: "Selecione o veículo da placa ou marque 'Sem placa'", variant: "destructive" })
      return
    }
    const valorTotalNumero = parseFloat(valorTotal.replace(",", ".")) || totalCalculadoItens
    if (!valorTotalNumero) {
      toast({ title: "Informe o valor total da nota", variant: "destructive" })
      return
    }

    setSalvando(true)
    try {
      const caminhoImagem = await uploadImagemNotaSupabase(arquivo)
      const veiculoSelecionado = veiculos.find((v) => v.id === veiculoId)

      await addDespesaNotaSupabase({
        numeroNota: numeroNota || undefined,
        dataNota: dataNota || undefined,
        fornecedor: fornecedor || undefined,
        veiculoId: semPlaca ? undefined : veiculoId || undefined,
        placa: semPlaca ? undefined : veiculoSelecionado?.placa,
        itens: itens.filter((i) => i.descricao.trim()),
        valorTotal: valorTotalNumero,
        caminhoImagem,
        textoExtraido: textoExtraido || undefined,
      })

      toast({ title: "Despesa registrada com sucesso!" })
      resetarFormulario()
      carregarDespesas()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar despesa",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm("Excluir esta despesa registrada?")) return
    try {
      await deleteDespesaNotaSupabase(id)
      toast({ title: "Despesa excluída" })
      carregarDespesas()
    } catch {
      toast({ title: "Erro ao excluir despesa", variant: "destructive" })
    }
  }

  const verImagem = async (caminho: string) => {
    const url = await getImagemNotaUrlAssinada(caminho)
    window.open(url, "_blank")
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <MobileBackButton />
      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Importar nota de fornecedor</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleArquivoSelecionado}
              className="hidden"
              id="input-nota-camera"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleArquivoSelecionado}
              className="hidden"
              id="input-nota-imagem"
            />

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <label htmlFor="input-nota-camera" className="w-full sm:w-auto">
                <Button type="button" variant="default" asChild className="cursor-pointer w-full sm:w-auto h-11">
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    Tirar foto agora
                  </span>
                </Button>
              </label>
              <label htmlFor="input-nota-imagem" className="w-full sm:w-auto">
                <Button type="button" variant="outline" asChild className="cursor-pointer w-full sm:w-auto h-11">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar da galeria
                  </span>
                </Button>
              </label>
            </div>

            {previewUrl && (
              <div className="border rounded-lg p-2 bg-muted/30">
                <img src={previewUrl} alt="Pré-visualização da nota" className="max-h-48 rounded-md object-contain" />
              </div>
            )}
          </div>

          {processandoOcr && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lendo a imagem... {progressoOcr}%
            </div>
          )}

          {arquivo && !processandoOcr && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Número da nota</label>
                  <Input value={numeroNota} onChange={(e) => setNumeroNota(e.target.value)} placeholder="Ex: 169025" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <Input type="date" value={dataNota} onChange={(e) => setDataNota(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fornecedor</label>
                  <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Nome do fornecedor" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Placa do veículo</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={veiculoId} onValueChange={setVeiculoId} disabled={semPlaca}>
                    <SelectTrigger className="w-full sm:w-72">
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.placa} - {v.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sem-placa"
                      checked={semPlaca}
                      onCheckedChange={(checked) => {
                        setSemPlaca(checked === true)
                        if (checked) setVeiculoId("")
                      }}
                    />
                    <label htmlFor="sem-placa" className="text-sm text-muted-foreground cursor-pointer">
                      Nota sem placa / não identificada
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Itens da nota</label>
                  <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar item
                  </Button>
                </div>
                <div className="overflow-x-auto -mx-1 px-1">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-24">Qtde</TableHead>
                        <TableHead className="w-32">Valor unit.</TableHead>
                        <TableHead className="w-32">Valor total</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input
                              value={item.descricao}
                              onChange={(e) => atualizarItem(idx, "descricao", e.target.value)}
                              placeholder="Descrição do item"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={String(item.quantidade)}
                              onChange={(e) => atualizarItem(idx, "quantidade", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={String(item.valorUnitario)}
                              onChange={(e) => atualizarItem(idx, "valorUnitario", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={String(item.valorTotal)}
                              onChange={(e) => atualizarItem(idx, "valorTotal", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removerItem(idx)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {itens.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                            Nenhum item adicionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="w-full sm:w-48">
                  <label className="block text-sm font-medium mb-1">Valor total da nota</label>
                  <Input
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    placeholder={totalCalculadoItens.toFixed(2).replace(".", ",")}
                  />
                </div>
                <Button onClick={handleSalvar} disabled={salvando} className="h-11 px-6">
                  {salvando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar despesa
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileImage className="h-5 w-5 text-primary" /> Despesas registradas
          </h2>

          {carregandoLista ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : despesas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">Nenhuma despesa registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nota</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesas.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.numeroNota || "-"}</TableCell>
                      <TableCell>{d.dataNota ? new Date(d.dataNota).toLocaleDateString("pt-BR") : "-"}</TableCell>
                      <TableCell>
                        {d.placa ? <Badge variant="outline">{d.placa}</Badge> : <span className="text-muted-foreground">Sem placa</span>}
                      </TableCell>
                      <TableCell>{d.fornecedor || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {d.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => verImagem(d.caminhoImagem)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExcluir(d.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
