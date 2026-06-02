"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { MobileBackButton } from "@/components/mobile-back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { getOrdensServicoSupabase, STATUS_ORDEM_ENCERRADA, type OrdemServico } from "@/services/ordem-servico-service"
import { getProdutosSupabase, type Produto } from "@/services/produto-service"
import { getVeiculosSupabase, type Veiculo } from "@/services/veiculo-service"
import { exportToCSV as exportResumoCSV } from "@/utils/export-utils"
import {
  exportToCSV as exportProdutosCSV,
  exportToPDF as exportProdutosPDF,
  exportToXLSX as exportProdutosXLSX,
} from "@/utils/export-produtos-utils"
import {
  exportToCSV as exportVeiculosCSV,
  exportToExcel as exportVeiculosExcel,
  exportToPDF as exportVeiculosPDF,
} from "@/utils/export-veiculos-utils"
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarRange,
  Car,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Loader2,
  Package,
  Wrench,
} from "lucide-react"

type TipoRelatorio = "todos" | "frota" | "manutencao" | "estoque" | "gestao"

const TIPOS_RELATORIO: { value: TipoRelatorio; label: string }[] = [
  { value: "todos", label: "Todos os relatórios" },
  { value: "frota", label: "Frota" },
  { value: "manutencao", label: "Manutenção" },
  { value: "estoque", label: "Estoque" },
  { value: "gestao", label: "Gestão" },
]

const STATUS_ENCERRADOS = new Set<string>(STATUS_ORDEM_ENCERRADA)

const formatarNumero = (valor: number) => new Intl.NumberFormat("pt-BR").format(valor)

const parseDate = (valor?: string) => {
  if (!valor) return null

  const iso = new Date(valor)
  if (!Number.isNaN(iso.getTime())) return iso

  const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, dia, mes, ano] = match
  const parsed = new Date(`${ano}-${mes}-${dia}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatarData = (valor?: string) => {
  const data = parseDate(valor)
  return data ? data.toLocaleDateString("pt-BR") : "—"
}

const dentroDoPeriodo = (data: Date | null, inicio: string, fim: string) => {
  if (!data) return true

  if (inicio) {
    const inicioDate = new Date(`${inicio}T00:00:00`)
    if (data < inicioDate) return false
  }

  if (fim) {
    const fimDate = new Date(`${fim}T23:59:59`)
    if (data > fimDate) return false
  }

  return true
}

const obterSetorOS = (ordem: OrdemServico) => {
  if (
    ordem.status === "Em Análise" ||
    ordem.status === "Aguardando OS" ||
    ordem.status === "Aguardando Fornecedor" ||
    ordem.status === "Comprar na Rua"
  ) {
    return "Almoxarifado"
  }

  if (ordem.status === "Em Aprovação" || ordem.status === "Aguardando aprovação") {
    return "Compras"
  }

  return "Oficina"
}

export default function CentralRelatoriosPage() {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [periodoInicio, setPeriodoInicio] = useState("")
  const [periodoFim, setPeriodoFim] = useState("")
  const [veiculoFiltro, setVeiculoFiltro] = useState("all")
  const [secretariaFiltro, setSecretariaFiltro] = useState("all")
  const [tipoFiltro, setTipoFiltro] = useState<TipoRelatorio>("todos")
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true)
        const [veiculosData, produtosData, ordensData] = await Promise.all([
          getVeiculosSupabase(),
          getProdutosSupabase(),
          getOrdensServicoSupabase(),
        ])

        setVeiculos(veiculosData)
        setProdutos(produtosData)
        setOrdens(ordensData)
        setUltimaAtualizacao(new Date())
      } catch (error) {
        console.error("Erro ao carregar central de relatórios:", error)
        toast({
          title: "Erro ao carregar relatórios",
          description: "Não foi possível carregar os dados desta central.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [toast])

  const secretarias = useMemo(
    () =>
      Array.from(new Set(veiculos.map((veiculo) => veiculo.secretaria).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [veiculos],
  )

  const veiculosPorId = useMemo(() => new Map(veiculos.map((veiculo) => [veiculo.id, veiculo])), [veiculos])

  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter((veiculo) => {
      if (veiculoFiltro !== "all" && veiculo.id !== veiculoFiltro) return false
      if (secretariaFiltro !== "all" && veiculo.secretaria !== secretariaFiltro) return false
      return true
    })
  }, [veiculos, veiculoFiltro, secretariaFiltro])

  const ordensFiltradas = useMemo(() => {
    return ordens.filter((ordem) => {
      if (veiculoFiltro !== "all" && ordem.veiculoId !== veiculoFiltro) return false

      const secretariaOrdem = veiculosPorId.get(ordem.veiculoId)?.secretaria || ""
      if (secretariaFiltro !== "all" && secretariaOrdem !== secretariaFiltro) return false

      const dataBase = parseDate(ordem.createdAt || ordem.data)
      if (!dentroDoPeriodo(dataBase, periodoInicio, periodoFim)) return false

      return true
    })
  }, [ordens, veiculoFiltro, secretariaFiltro, periodoInicio, periodoFim, veiculosPorId])

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      if (veiculoFiltro === "all") return true

      const compativeis = Array.isArray(produto.veiculosCompativeis) ? produto.veiculosCompativeis : []
      return compativeis.length === 0 || compativeis.includes(veiculoFiltro)
    })
  }, [produtos, veiculoFiltro])

  const ordensAbertas = useMemo(
    () => ordensFiltradas.filter((ordem) => !STATUS_ENCERRADOS.has(ordem.status)),
    [ordensFiltradas],
  )

  const veiculosAtivos = useMemo(
    () => veiculosFiltrados.filter((veiculo) => veiculo.status?.toLowerCase() === "ativo"),
    [veiculosFiltrados],
  )

  const produtosCriticos = useMemo(
    () => produtosFiltrados.filter((produto) => Number(produto.estoque || 0) <= 5),
    [produtosFiltrados],
  )

  const secretariasAtivas = useMemo(
    () => new Set(veiculosFiltrados.map((veiculo) => veiculo.secretaria).filter(Boolean)).size,
    [veiculosFiltrados],
  )

  const cardsRapidos = useMemo(
    () =>
      [
        {
          tipo: "frota" as TipoRelatorio,
          titulo: "Veículos ativos",
          valor: formatarNumero(veiculosAtivos.length),
          descricao: "Frota disponível dentro dos filtros selecionados.",
          href: "/dashboard/veiculos",
          icon: Car,
        },
        {
          tipo: "manutencao" as TipoRelatorio,
          titulo: "OS em aberto",
          valor: formatarNumero(ordensAbertas.length),
          descricao: "Ordens de serviço ainda em andamento no período.",
          href: "/dashboard/manutencoes/ordem-servico",
          icon: Wrench,
        },
        {
          tipo: "estoque" as TipoRelatorio,
          titulo: "Produtos críticos",
          valor: formatarNumero(produtosCriticos.length),
          descricao: "Itens com estoque igual ou menor que 5 unidades.",
          href: "/dashboard/produtos",
          icon: Package,
        },
        {
          tipo: "gestao" as TipoRelatorio,
          titulo: "Secretarias cobertas",
          valor: formatarNumero(secretariasAtivas),
          descricao: "Quantidade de secretarias presentes no recorte atual.",
          href: "/dashboard",
          icon: Building2,
        },
      ].filter((card) => tipoFiltro === "todos" || card.tipo === tipoFiltro),
    [ordensAbertas.length, produtosCriticos.length, secretariasAtivas, tipoFiltro, veiculosAtivos.length],
  )

  const osPrioritarias = useMemo(
    () =>
      ordensAbertas
        .slice()
        .sort((a, b) => {
          const prioridadePeso: Record<string, number> = { Urgente: 0, Alta: 1, Média: 2, Baixa: 3 }
          const pesoA = prioridadePeso[a.prioridade] ?? 99
          const pesoB = prioridadePeso[b.prioridade] ?? 99
          if (pesoA !== pesoB) return pesoA - pesoB
          return (a.ordem_execucao ?? 999) - (b.ordem_execucao ?? 999)
        })
        .slice(0, 5),
    [ordensAbertas],
  )

  const produtosEmFoco = useMemo(
    () => produtosCriticos.slice().sort((a, b) => Number(a.estoque || 0) - Number(b.estoque || 0)).slice(0, 5),
    [produtosCriticos],
  )

  const exportarVeiculos = async (formato: "csv" | "pdf" | "excel") => {
    if (veiculosFiltrados.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Nenhum veículo atende aos filtros atuais.",
        variant: "destructive",
      })
      return
    }

    try {
      if (formato === "csv") {
        exportVeiculosCSV(veiculosFiltrados, "central_relatorios_veiculos")
      } else if (formato === "pdf") {
        exportVeiculosPDF(veiculosFiltrados, "central_relatorios_veiculos")
      } else {
        await exportVeiculosExcel(veiculosFiltrados, "central_relatorios_veiculos")
      }

      toast({
        title: "Exportação concluída",
        description: "Relatório de veículos exportado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar veículos:", error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório de veículos.",
        variant: "destructive",
      })
    }
  }

  const exportarProdutos = async (formato: "csv" | "pdf" | "xlsx") => {
    if (produtosFiltrados.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Nenhum produto atende aos filtros atuais.",
        variant: "destructive",
      })
      return
    }

    try {
      if (formato === "csv") {
        exportProdutosCSV(produtosFiltrados, "central_relatorios_produtos")
      } else if (formato === "pdf") {
        exportProdutosPDF(produtosFiltrados, "central_relatorios_produtos")
      } else {
        await exportProdutosXLSX(produtosFiltrados, "central_relatorios_produtos")
      }

      toast({
        title: "Exportação concluída",
        description: "Relatório de produtos exportado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar produtos:", error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório de produtos.",
        variant: "destructive",
      })
    }
  }

  const exportarOrdensCSV = () => {
    if (ordensFiltradas.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Nenhuma ordem de serviço atende aos filtros atuais.",
        variant: "destructive",
      })
      return
    }

    const rows = ordensFiltradas.map((ordem) => ({
      numero: ordem.numero,
      data: formatarData(ordem.createdAt || ordem.data),
      veiculo: ordem.veiculoInfo,
      setor: obterSetorOS(ordem),
      status: ordem.status,
      prioridade: ordem.prioridade,
      mecanico: ordem.mecanicoInfo,
    }))

    exportResumoCSV(rows, "central_relatorios_ordens_servico")
    toast({
      title: "Exportação concluída",
      description: "Relatório de ordens de serviço exportado em CSV.",
    })
  }

  const exportarResumo = () => {
    const rows = [
      { indicador: "Veículos ativos", valor: veiculosAtivos.length },
      { indicador: "OS em aberto", valor: ordensAbertas.length },
      { indicador: "Produtos críticos", valor: produtosCriticos.length },
      { indicador: "Secretarias cobertas", valor: secretariasAtivas },
    ]

    exportResumoCSV(rows, "central_relatorios_resumo_gerencial")
    toast({
      title: "Resumo exportado",
      description: "Resumo consolidado exportado em CSV.",
    })
  }

  const limparFiltros = () => {
    setPeriodoInicio("")
    setPeriodoFim("")
    setVeiculoFiltro("all")
    setSecretariaFiltro("all")
    setTipoFiltro("todos")
  }

  return (
    <div className="space-y-6">
      {isMobile && <MobileBackButton />}

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Central de Relatórios
            </Badge>
            {ultimaAtualizacao && (
              <Badge variant="outline">Atualizado às {ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Central de Relatórios</h1>
            <p className="text-muted-foreground">
              Hub inicial para consultas rápidas, exportações e atalhos analíticos de frota,
              manutenção e estoque.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Filtros globais
          </CardTitle>
          <CardDescription>
            Use estes filtros para ajustar os números, listas e exportações desta central.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <LabelTexto>Período inicial</LabelTexto>
              <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <LabelTexto>Período final</LabelTexto>
              <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
            </div>
            <div className="space-y-2">
              <LabelTexto>Veículo</LabelTexto>
              <Select value={veiculoFiltro} onValueChange={setVeiculoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {veiculos.map((veiculo) => (
                    <SelectItem key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa} - {veiculo.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <LabelTexto>Secretaria</LabelTexto>
              <Select value={secretariaFiltro} onValueChange={setSecretariaFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as secretarias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as secretarias</SelectItem>
                  {secretarias.map((secretaria) => (
                    <SelectItem key={secretaria} value={secretaria}>
                      {secretaria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <LabelTexto>Tipo</LabelTexto>
              <Select value={tipoFiltro} onValueChange={(value) => setTipoFiltro(value as TipoRelatorio)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os relatórios" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_RELATORIO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Badge variant="outline">{formatarNumero(veiculosFiltrados.length)} veículos no recorte</Badge>
            <Badge variant="outline">{formatarNumero(ordensFiltradas.length)} OS no recorte</Badge>
            <Badge variant="outline">{formatarNumero(produtosFiltrados.length)} produtos no recorte</Badge>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex min-h-[240px] items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando dados da central...
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Relatórios rápidos</h2>
              <p className="text-sm text-muted-foreground">
                Indicadores prontos para consulta por gestores e operadores.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {cardsRapidos.map((card) => (
                <Card key={card.titulo} className="border-l-4 border-l-primary">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <card.icon className="h-5 w-5 text-primary" />
                      <Badge variant="secondary">{TIPOS_RELATORIO.find((tipo) => tipo.value === card.tipo)?.label}</Badge>
                    </div>
                    <CardTitle className="text-base">{card.titulo}</CardTitle>
                    <CardDescription>{card.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold tracking-tight">{card.valor}</div>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link href={card.href}>
                        Abrir origem
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  OS prioritárias
                </CardTitle>
                <CardDescription>Ordens abertas com maior urgência dentro do recorte atual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {osPrioritarias.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma OS prioritária encontrada.</p>
                ) : (
                  osPrioritarias.map((ordem) => (
                    <div key={ordem.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{ordem.numero}</p>
                          <p className="text-sm text-muted-foreground">{ordem.veiculoInfo}</p>
                        </div>
                        <Badge variant="outline">{ordem.prioridade}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Status: {ordem.status}</span>
                        <span>Setor: {obterSetorOS(ordem)}</span>
                        <span>Data: {formatarData(ordem.createdAt || ordem.data)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-rose-500" />
                  Estoque em foco
                </CardTitle>
                <CardDescription>Itens com maior necessidade de atenção no estoque.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {produtosEmFoco.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum produto crítico encontrado.</p>
                ) : (
                  produtosEmFoco.map((produto) => (
                    <div key={produto.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{produto.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            {produto.categoria} • {produto.localizacao}
                          </p>
                        </div>
                        <Badge variant={Number(produto.estoque || 0) === 0 ? "destructive" : "secondary"}>
                          Estoque: {produto.estoque}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Exportações</h2>
              <p className="text-sm text-muted-foreground">
                Reaproveita as rotinas já existentes do sistema para gerar arquivos a partir dos filtros atuais.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
              {(tipoFiltro === "todos" || tipoFiltro === "frota") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      Relatório de Veículos
                    </CardTitle>
                    <CardDescription>{veiculosFiltrados.length} veículos no recorte atual.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-between" onClick={() => exportarVeiculos("csv")}>
                      CSV
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between" onClick={() => exportarVeiculos("pdf")}>
                      PDF
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between" onClick={() => exportarVeiculos("excel")}>
                      Excel
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {(tipoFiltro === "todos" || tipoFiltro === "estoque") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Relatório de Produtos
                    </CardTitle>
                    <CardDescription>{produtosFiltrados.length} produtos no recorte atual.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-between" onClick={() => exportarProdutos("csv")}>
                      CSV
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between" onClick={() => exportarProdutos("pdf")}>
                      PDF
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between" onClick={() => exportarProdutos("xlsx")}>
                      Excel
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {(tipoFiltro === "todos" || tipoFiltro === "manutencao") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-primary" />
                      OS filtradas
                    </CardTitle>
                    <CardDescription>{ordensFiltradas.length} ordens dentro do período/filtro atual.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-between" onClick={exportarOrdensCSV}>
                      Exportar CSV
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link href="/dashboard/manutencoes/ordem-servico">
                        Abrir módulo de OS
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {(tipoFiltro === "todos" || tipoFiltro === "gestao") && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Resumo gerencial
                    </CardTitle>
                    <CardDescription>Indicadores consolidados desta central em formato simples.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-between" onClick={exportarResumo}>
                      Exportar CSV
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link href="/dashboard/custo-veiculo">
                        Custos por veículo
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link href="/dashboard/filtros">
                        Filtros e Word
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function LabelTexto({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground">{children}</p>
}
