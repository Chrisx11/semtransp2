"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Search, ExternalLink, Loader2 } from "lucide-react"
import { MobileBackButton } from "@/components/mobile-back-button"

interface EquivalenteFiltro {
  marca: string
  codigo: string
}

interface ResultadoFiltro {
  nome: string
  codigoPesquisado: string
  produtoEncontrado: string
  url: string
  imagem: string | null
  equivalentes: EquivalenteFiltro[]
}

interface ImagemModalState {
  open: boolean
  loading: boolean
  erro: string | null
  marca: string
  codigo: string
  nome: string | null
  imagem: string | null
  url: string | null
}

export default function BuscarFiltrosPage() {
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoFiltro | null>(null)
  const [modal, setModal] = useState<ImagemModalState>({
    open: false,
    loading: false,
    erro: null,
    marca: "",
    codigo: "",
    nome: null,
    imagem: null,
    url: null,
  })

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault()
    const termo = codigo.trim()
    if (!termo) return

    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const resp = await fetch(`/api/buscar-filtros?codigo=${encodeURIComponent(termo)}`)
      const data = await resp.json()
      if (!resp.ok) {
        setErro(data.erro || "Erro ao buscar filtro.")
        return
      }
      setResultado(data)
    } catch {
      setErro("Erro ao consultar o site da Showlub. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = async (eq: EquivalenteFiltro) => {
    setModal({
      open: true,
      loading: true,
      erro: null,
      marca: eq.marca,
      codigo: eq.codigo,
      nome: null,
      imagem: null,
      url: null,
    })

    try {
      const resp = await fetch(`/api/buscar-filtros/imagem?codigo=${encodeURIComponent(eq.codigo)}`)
      const data = await resp.json()
      if (!resp.ok) {
        setModal((prev) => ({ ...prev, loading: false, erro: data.erro || "Imagem não encontrada." }))
        return
      }
      setModal((prev) => ({
        ...prev,
        loading: false,
        nome: data.nome,
        imagem: data.imagem,
        url: data.url,
      }))
    } catch {
      setModal((prev) => ({ ...prev, loading: false, erro: "Erro ao carregar imagem." }))
    }
  }

  const fecharModal = () => setModal((prev) => ({ ...prev, open: false }))

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <MobileBackButton />
      <form onSubmit={handleBuscar} className="flex gap-2">
        <Input
          type="text"
          placeholder="Digite o código do filtro (ex: PH8A)"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          autoFocus
          className="h-11"
        />
        <Button type="submit" disabled={loading} className="h-11 px-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          {loading ? "" : "Buscar"}
        </Button>
      </form>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {resultado && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{resultado.nome}</h2>
              {resultado.produtoEncontrado !== resultado.nome && (
                <p className="text-xs text-muted-foreground">Fonte: {resultado.produtoEncontrado}</p>
              )}
              <a
                href={resultado.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary inline-flex items-center gap-1 mt-1 hover:underline"
              >
                Ver produto na Showlub <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {resultado.equivalentes.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {resultado.equivalentes.length} códigos equivalentes encontrados
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                  {resultado.equivalentes.map((eq, idx) => (
                    <button
                      key={`${eq.marca}-${eq.codigo}-${idx}`}
                      type="button"
                      onClick={() => abrirModal(eq)}
                      className="text-left rounded-lg border bg-background hover:bg-accent transition-colors px-3 py-2"
                    >
                      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                        {eq.marca}
                      </span>
                      <span className="block font-semibold">{eq.codigo}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum código equivalente encontrado para este produto.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={modal.open} onOpenChange={(open) => !open && fecharModal()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {modal.marca} {modal.codigo}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center text-center gap-3 py-2">
            {modal.loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando imagem...
              </div>
            )}
            {!modal.loading && modal.erro && (
              <p className="text-sm text-muted-foreground py-8">{modal.erro}</p>
            )}
            {!modal.loading && !modal.erro && modal.imagem && (
              <>
                <img
                  src={modal.imagem}
                  alt={modal.nome || ""}
                  className="max-h-72 max-w-full rounded-md object-contain"
                />
                {modal.url && (
                  <a
                    href={modal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    Ver na Showlub <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
