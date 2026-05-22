"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getOrdensAgrupadasPorMecanicoSupabase,
  type OrdemServico,
} from "@/services/ordem-servico-service"
import {
  isMecanicoVisivelNaTela,
  subscribeTelaMecanicosConfig,
} from "@/lib/tela-mecanicos-config"
import { cn } from "@/lib/utils"
import { Wrench, ChevronLeft, ChevronRight, User, Maximize2, Minimize2 } from "lucide-react"
import { setTelaFullscreenAtivo } from "@/lib/tela-fullscreen"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Button } from "@/components/ui/button"
import { MobileBackButton } from "@/components/mobile-back-button"

const STATUS_TELA = new Set(["Em Serviço", "Fila de Serviço", "Aguardando Mecânico"])

const prioridadeCor: Record<string, string> = {
  Urgente: "bg-red-500",
  Alta: "bg-orange-500",
  Média: "bg-yellow-400 text-black",
  Baixa: "bg-blue-500",
}

const statusCor: Record<string, string> = {
  "Em Serviço": "bg-emerald-500",
  "Fila de Serviço": "bg-cyan-500",
  "Aguardando Mecânico": "bg-slate-500",
}

function extrairNomeMecanico(info?: string) {
  if (!info) return "Sem mecânico"
  return info.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

function extrairPlaca(veiculoInfo?: string) {
  if (!veiculoInfo) return "—"
  return veiculoInfo.split(" - ")[0]?.trim() || veiculoInfo
}

function ordenarOrdens(ordens: OrdemServico[]) {
  return [...ordens]
    .filter((o) => STATUS_TELA.has(o.status))
    .sort((a, b) => {
      if (a.ordem_execucao != null && b.ordem_execucao != null) {
        return a.ordem_execucao - b.ordem_execucao
      }
      if (a.ordem_execucao != null) return -1
      if (b.ordem_execucao != null) return 1
      const numA = parseInt(a.numero.replace(/\D/g, ""), 10) || 0
      const numB = parseInt(b.numero.replace(/\D/g, ""), 10) || 0
      return numA - numB
    })
}

function OrdemTelaItem({ ordem }: { ordem: OrdemServico }) {
  const statusClass = statusCor[ordem.status] ?? "bg-muted"
  const prioridadeClass = prioridadeCor[ordem.prioridade] ?? "bg-muted"

  return (
    <div
      className={cn(
        "rounded-lg border bg-card/80 p-3 shadow-sm",
        ordem.status === "Em Serviço" && "ring-2 ring-emerald-500/40"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight truncate">{extrairPlaca(ordem.veiculoInfo)}</p>
          <p className="text-sm font-semibold text-muted-foreground">{ordem.numero}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {ordem.ordem_execucao != null && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {ordem.ordem_execucao}
            </span>
          )}
          <Badge className={cn("text-[10px] border-0", prioridadeClass)}>{ordem.prioridade}</Badge>
        </div>
      </div>
      <Badge className={cn("mb-2 text-xs border-0", statusClass)}>{ordem.status}</Badge>
      <p className="text-sm leading-snug line-clamp-3 text-foreground/90">
        {ordem.defeitosRelatados?.trim() || "Sem descrição informada"}
      </p>
    </div>
  )
}

function MecanicoTelaCard({
  nome,
  ordens,
}: {
  nome: string
  ordens: OrdemServico[]
}) {
  return (
    <Card className="flex flex-col h-full border-2 shadow-lg overflow-hidden bg-card">
      <CardHeader className="py-3 px-4 bg-primary text-primary-foreground flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
            <User className="h-5 w-5" />
          </div>
          <span className="truncate flex-1">{nome}</span>
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm">
            {ordens.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-muted/30">
        {ordens.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma OS na fila</p>
        ) : (
          ordens.map((ordem) => <OrdemTelaItem key={ordem.id} ordem={ordem} />)
        )}
      </CardContent>
    </Card>
  )
}

type MecanicoTela = { id: string; nome: string; ordens: OrdemServico[] }

export default function TelaManutencoesPage() {
  const isMobile = useIsMobile()
  const [mecanicos, setMecanicos] = useState<MecanicoTela[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [hora, setHora] = useState("")
  const [telaCheia, setTelaCheia] = useState(false)

  const mecanicosPorPagina = isMobile ? 1 : 4

  const carregar = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) setLoading(true)
      const dados = await getOrdensAgrupadasPorMecanicoSupabase()
      const lista: MecanicoTela[] = dados
        .filter((m) => m.id !== "sem-mecanico" && isMecanicoVisivelNaTela(m.id))
        .map((m) => ({
          id: m.id,
          nome: m.nome || extrairNomeMecanico(m.ordens[0]?.mecanicoInfo),
          ordens: ordenarOrdens(m.ordens),
        }))
        .filter((m) => m.ordens.length > 0)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

      setMecanicos(lista)
    } catch (error) {
      console.error("Erro ao carregar tela:", error)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
    const timerDados = setInterval(() => carregar({ silent: true }), 10000)
    return () => clearInterval(timerDados)
  }, [carregar])

  useEffect(() => {
    return subscribeTelaMecanicosConfig(() => carregar({ silent: true }))
  }, [carregar])

  useEffect(() => {
    const tick = () => {
      setHora(
        new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      )
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  const aplicarTelaCheia = useCallback(async (ativo: boolean) => {
    setTelaCheia(ativo)
    setTelaFullscreenAtivo(ativo)
    try {
      if (ativo) {
        await document.documentElement.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // Modo kiosk do app funciona mesmo se o navegador bloquear fullscreen nativo
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && telaCheia) {
        setTelaCheia(false)
        setTelaFullscreenAtivo(false)
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [telaCheia])

  useEffect(() => {
    return () => {
      setTelaFullscreenAtivo(false)
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  const totalPages = Math.max(1, Math.ceil(mecanicos.length / mecanicosPorPagina))
  const visibleMecanicos = useMemo(() => {
    const start = currentPage * mecanicosPorPagina
    return mecanicos.slice(start, start + mecanicosPorPagina)
  }, [mecanicos, currentPage, mecanicosPorPagina])

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(0, totalPages - 1))
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (isMobile || mecanicos.length <= mecanicosPorPagina) return
    const timer = setInterval(() => {
      setCurrentPage((p) => (p + 1) % totalPages)
    }, 12000)
    return () => clearInterval(timer)
  }, [isMobile, mecanicos.length, mecanicosPorPagina, totalPages])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Wrench className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Carregando fila da oficina...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        telaCheia
          ? "h-screen p-3 overflow-hidden"
          : isMobile
            ? "p-2 min-h-0"
            : "h-[calc(100vh-4rem)] p-3 overflow-hidden"
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        {isMobile && !telaCheia ? (
          <MobileBackButton />
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <Wrench className="h-6 w-6 text-primary flex-shrink-0" />
            <h1 className="text-xl font-bold truncate">Fila da Oficina</h1>
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {hora && <span className="font-mono tabular-nums">{hora}</span>}
            {totalPages > 1 && (
              <span>
                {currentPage + 1} / {totalPages}
              </span>
            )}
          </div>
          <Button
            variant={telaCheia ? "secondary" : "outline"}
            size="sm"
            onClick={() => aplicarTelaCheia(!telaCheia)}
            className="gap-1.5"
            title={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
          >
            {telaCheia ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tela cheia</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {mecanicos.length === 0 ? (
        <Card className="flex-1 flex items-center justify-center border-dashed">
          <CardContent className="text-center py-16">
            <Wrench className="h-14 w-14 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum mecânico na tela</h2>
            <p className="text-muted-foreground max-w-md text-sm">
              Ative os mecânicos no Planejamento (ícone de monitor no card) ou aguarde novas ordens na fila.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div
            className={cn(
              "flex-1 min-h-0 gap-3",
              isMobile
                ? "flex flex-col overflow-y-auto"
                : "grid",
              !isMobile &&
                `grid-cols-${Math.min(visibleMecanicos.length, 4)}`
            )}
            style={
              !isMobile
                ? {
                    gridTemplateColumns: `repeat(${Math.min(visibleMecanicos.length, 4)}, minmax(0, 1fr))`,
                  }
                : undefined
            }
          >
            {visibleMecanicos.map((mecanico) => (
              <MecanicoTelaCard key={mecanico.id} nome={mecanico.nome} ordens={mecanico.ordens} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
