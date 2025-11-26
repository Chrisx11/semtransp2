"use client"

import { useEffect, useState } from "react"
import { getVeiculosSupabase, type Veiculo } from "@/services/veiculo-service"
import { getProdutosCompativeisComVeiculoSupabase, type Produto, getProdutosSupabase } from "@/services/produto-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { SelecionarProdutoDialog } from "@/components/selecionar-produto-dialog"
import { FuelIcon as Oil, Car, BadgeCheck, Trash2, RotateCcw, Search, Calendar, Building, Filter, CheckCircle2, XCircle, Gauge, FileText, Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getEstatisticasTrocasOleo } from "@/services/troca-oleo-service"
import { Progress } from "@/components/ui/progress"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"

const FILTER_HEADERS = [
  "Filtro de Óleo",
  "Filtro de Comb.",
  "Filtro de Ar",
  "Filtro de Cabine",
  "Filtro de Ar 1°",
  "Filtro de Ar 2°",
  "Filtro Separador",
  "Filtro Separador 2°",
  "Desumidificador",
  "Filtro de Transmissão"
]

interface FiltroRegistrado {
  veiculoId: string
  categoria: string
  produtoId: string
  produtoDescricao: string
}

// Funções para interagir com o Supabase
async function getFiltrosDoVeiculoSupabase(veiculoId: string): Promise<FiltroRegistrado[]> {
  try {
    // Normalizar o ID para garantir consistência (remover espaços e converter para string)
    const normalizedId = String(veiculoId).trim();
    
    const { data, error } = await supabase
      .from('filtros_registrados')
      .select('veiculoid, categoria, produtoid, produtodescricao')
      .eq('veiculoid', normalizedId);

    if (error) {
      console.error(`Erro ao buscar filtros do veículo ${normalizedId}:`, error.message, error);
      return [];
    }
    
    // Verificar se data é null ou undefined
    if (!data) {
      console.warn(`Nenhum dado retornado para veículo ${normalizedId}`);
      return [];
    }
    
    // Debug: log dos dados retornados
    if (data.length > 0) {
      console.log(`[getFiltrosDoVeiculoSupabase] Veículo ${normalizedId}: ${data.length} registros encontrados`, data);
    }
    
    // Mapear os dados para o formato esperado pela interface (camelCase)
    const filtros = data.map(item => ({
      veiculoId: String(item.veiculoid).trim(),
      categoria: item.categoria,
      produtoId: String(item.produtoid).trim(),
      produtoDescricao: item.produtodescricao,
    }));
    
    return filtros;
  } catch (err) {
    console.error(`Erro inesperado ao buscar filtros do veículo ${veiculoId}:`, err);
    return [];
  }
}

async function addFiltroRegistradoSupabase(filtro: FiltroRegistrado): Promise<void> {
  // Mapear os dados para o formato esperado pelo banco de dados (lowercase)
  const filtroDB = {
    veiculoid: filtro.veiculoId,
    categoria: filtro.categoria,
    produtoid: filtro.produtoId,
    produtodescricao: filtro.produtoDescricao,
  };
  const { error } = await supabase
    .from('filtros_registrados')
    .insert([filtroDB]);

  if (error) {
    console.error("Erro ao registrar filtro:", error.message, error);
    throw error; // Re-lança o erro para ser tratado por quem chamou
  }
}

async function removeFiltroRegistradoSupabase(veiculoId: string, categoria: string, produtoId: string): Promise<void> {
  const { error } = await supabase
    .from('filtros_registrados')
    .delete()
    .eq('veiculoid', veiculoId)
    .eq('categoria', categoria)
    .eq('produtoid', produtoId);

  if (error) {
    console.error("Erro ao remover filtro:", error.message, error);
    throw error; // Re-lança o erro para ser tratado por quem chamou
  }
}

// Componente Mobile View
function FiltrosMobileView({
  veiculosFiltrados,
  filtrosPorVeiculo,
  veiculosProntosParaTroca,
  estatisticasTrocaOleo,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  progressoFilter,
  setProgressoFilter,
  contadores,
  contadoresProgresso,
  isRefreshing,
  handleRefresh,
  handleOpenModal,
  handleOpenRegisterModal,
  getCorProgresso,
}: {
  veiculosFiltrados: Veiculo[]
  filtrosPorVeiculo: Record<string, number>
  veiculosProntosParaTroca: Record<string, boolean>
  estatisticasTrocaOleo: Record<string, { kmAtual: number; kmProxTroca: number; progresso: number }>
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: 'all' | 'pronto' | 'nao-pronto' | 'sem-cadastro'
  setStatusFilter: (value: 'all' | 'pronto' | 'nao-pronto' | 'sem-cadastro') => void
  progressoFilter: 'all' | 'verde' | 'amarelo' | 'vermelho' | 'sem-registro'
  setProgressoFilter: (value: 'all' | 'verde' | 'amarelo' | 'vermelho' | 'sem-registro') => void
  contadores: { pronto: number; naoPronto: number; semCadastro: number }
  contadoresProgresso: { verde: number; amarelo: number; vermelho: number; semRegistro: number }
  isRefreshing: boolean
  handleRefresh: () => void
  handleOpenModal: (veiculo: Veiculo) => void
  handleOpenRegisterModal: (veiculo: Veiculo) => void
  getCorProgresso: (progresso: number) => string
}) {
  return (
    <div className="w-full max-w-full overflow-x-hidden pl-3 pr-0 py-4 pb-6 flex flex-col items-start">
      <div className="w-[96%] mb-4 pl-0 pr-0">
        <MobileBackButton />
      </div>
      
      {/* Busca e Atualizar */}
      <div className="flex flex-col gap-3 mb-4 w-[96%] pl-0 pr-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar veículo por placa, modelo..."
            className="pl-10 h-11 text-base w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full h-11 text-base"
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {/* Filtros de Status */}
      <div className="w-[96%] mb-4 pl-0 pr-0">
        <Card className="p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Status dos Filtros</span>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-full h-12 text-base">
                <div className="flex items-center gap-2 min-w-0">
                  {statusFilter === 'all' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                      <span className="truncate">Todos ({veiculosFiltrados.length})</span>
                    </>
                  )}
                  {statusFilter === 'pronto' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                      <span className="truncate">Prontos ({contadores.pronto})</span>
                    </>
                  )}
                  {statusFilter === 'nao-pronto' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                      <span className="truncate">Não Prontos ({contadores.naoPronto})</span>
                    </>
                  )}
                  {statusFilter === 'sem-cadastro' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
                      <span className="truncate">Sem Cadastro ({contadores.semCadastro})</span>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span>Todos ({veiculosFiltrados.length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="pronto">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Prontos ({contadores.pronto})</span>
                  </div>
                </SelectItem>
                <SelectItem value="nao-pronto">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Não Prontos ({contadores.naoPronto})</span>
                  </div>
                </SelectItem>
                <SelectItem value="sem-cadastro">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Sem Cadastro ({contadores.semCadastro})</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Filtros de Progresso */}
      <div className="w-[96%] mb-4 pl-0 pr-0">
        <Card className="p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Progresso de Troca de Óleo</span>
            </div>
            <Select value={progressoFilter} onValueChange={(value) => setProgressoFilter(value as typeof progressoFilter)}>
              <SelectTrigger className="w-full h-12 text-base">
                <div className="flex items-center gap-2 min-w-0">
                  {progressoFilter === 'all' && <span className="truncate">Todos</span>}
                  {progressoFilter === 'verde' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                      <span className="truncate">Verde ({contadoresProgresso.verde})</span>
                    </>
                  )}
                  {progressoFilter === 'amarelo' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
                      <span className="truncate">Amarelo ({contadoresProgresso.amarelo})</span>
                    </>
                  )}
                  {progressoFilter === 'vermelho' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                      <span className="truncate">Vermelho ({contadoresProgresso.vermelho})</span>
                    </>
                  )}
                  {progressoFilter === 'sem-registro' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-gray-500 flex-shrink-0"></div>
                      <span className="truncate">Sem Registro ({contadoresProgresso.semRegistro})</span>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span>Todos</span>
                </SelectItem>
                <SelectItem value="verde">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Verde ({contadoresProgresso.verde})</span>
                  </div>
                </SelectItem>
                <SelectItem value="amarelo">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Amarelo ({contadoresProgresso.amarelo})</span>
                  </div>
                </SelectItem>
                <SelectItem value="vermelho">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Vermelho ({contadoresProgresso.vermelho})</span>
                  </div>
                </SelectItem>
                <SelectItem value="sem-registro">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span>Sem Registro ({contadoresProgresso.semRegistro})</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Lista de Veículos */}
      {veiculosFiltrados.length > 0 ? (
        <div className="space-y-3 w-[96%] pl-0 pr-0">
          {veiculosFiltrados.map((veiculo) => {
            const totalFiltros = filtrosPorVeiculo[veiculo.id] || 0
            const prontoParaTroca = veiculosProntosParaTroca[veiculo.id] || false
            
            return (
              <Card
                key={veiculo.id}
                className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow w-full"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {/* Header com placa e status */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-primary/10 p-2.5 rounded-lg flex-shrink-0">
                          <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="outline" className="font-bold text-base border-primary/30 bg-primary/10 px-2.5 py-1">
                              {veiculo.placa}
                            </Badge>
                            <Badge 
                              variant={veiculo.status === "Ativo" ? "default" : "destructive"}
                              className="text-xs px-2 py-0.5"
                            >
                              {veiculo.status}
                            </Badge>
                            {totalFiltros === 0 ? (
                              <div className="bg-yellow-500 rounded-full p-1.5 shadow-sm" title="Nenhum filtro registrado">
                                <Oil className="h-3.5 w-3.5 text-white" />
                              </div>
                            ) : prontoParaTroca ? (
                              <div className="bg-green-500 rounded-full p-1.5 shadow-sm" title="Pronto para troca">
                                <Oil className="h-3.5 w-3.5 text-white" />
                              </div>
                            ) : (
                              <div className="bg-red-500 rounded-full p-1.5 shadow-sm" title="Não está pronto">
                                <Oil className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-medium text-foreground mb-1">
                            {veiculo.modelo} • {veiculo.marca}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {veiculo.ano} • {veiculo.secretaria}
                          </div>
                        </div>
                      </div>

                      {/* Informações de filtros */}
                      {totalFiltros > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                          <Filter className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            {totalFiltros} {totalFiltros === 1 ? 'filtro registrado' : 'filtros registrados'}
                          </span>
                        </div>
                      )}

                      {/* Informações de Troca de Óleo */}
                      {estatisticasTrocaOleo[veiculo.id] && (estatisticasTrocaOleo[veiculo.id].kmAtual > 0 || estatisticasTrocaOleo[veiculo.id].kmProxTroca > 0) && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2.5">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Gauge className="h-4 w-4 text-primary" />
                            <span>Troca de Óleo</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs">Km Atual:</span>
                              <div className="font-semibold text-foreground mt-0.5">
                                {estatisticasTrocaOleo[veiculo.id].kmAtual > 0 
                                  ? estatisticasTrocaOleo[veiculo.id].kmAtual.toLocaleString('pt-BR') 
                                  : '-'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Próx. Troca:</span>
                              <div className="font-semibold text-foreground mt-0.5">
                                {estatisticasTrocaOleo[veiculo.id].kmProxTroca > 0 
                                  ? estatisticasTrocaOleo[veiculo.id].kmProxTroca.toLocaleString('pt-BR') 
                                  : '-'}
                              </div>
                            </div>
                          </div>
                          {estatisticasTrocaOleo[veiculo.id].kmAtual > 0 && estatisticasTrocaOleo[veiculo.id].kmProxTroca > 0 && (
                            <div className="space-y-1.5 mt-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Progresso</span>
                                <span className="font-bold text-foreground">{estatisticasTrocaOleo[veiculo.id].progresso}%</span>
                              </div>
                              <Progress 
                                value={estatisticasTrocaOleo[veiculo.id].progresso} 
                                className="h-2.5"
                                indicatorClassName={estatisticasTrocaOleo[veiculo.id].progresso > 0 ? getCorProgresso(estatisticasTrocaOleo[veiculo.id].progresso) : "bg-green-500"}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex gap-2 pt-0 pb-4 px-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 flex gap-2 items-center text-sm h-10 font-medium" 
                    onClick={() => handleOpenModal(veiculo)}
                  >
                    <BadgeCheck className="h-4 w-4" /> 
                    Ver Filtros
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1 flex gap-2 items-center text-sm h-10 font-medium shadow-sm" 
                    onClick={() => handleOpenRegisterModal(veiculo)}
                  >
                    <Oil className="h-4 w-4" /> 
                    Registrar
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground w-[96%] pl-0 pr-0">
          <Car className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-base font-medium mb-1">Nenhum veículo encontrado</p>
          <p className="text-sm">Tente usar termos diferentes na busca ou remover os filtros</p>
        </div>
      )}
    </div>
  )
}

export default function FiltrosPage() {
  const isMobile = useIsMobile()
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [produtosCompativeis, setProdutosCompativeis] = useState<Produto[]>([])
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [registerVeiculo, setRegisterVeiculo] = useState<Veiculo | null>(null)
  const [selectedCategoria, setSelectedCategoria] = useState<string>("")
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [produtoDialogOpen, setProdutoDialogOpen] = useState(false)
  const { toast } = useToast()
  const [filtrosRegistrados, setFiltrosRegistrados] = useState<FiltroRegistrado[]>([])
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filtrosPorVeiculo, setFiltrosPorVeiculo] = useState<Record<string, number>>({})
  const [veiculosProntosParaTroca, setVeiculosProntosParaTroca] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<'all' | 'pronto' | 'nao-pronto' | 'sem-cadastro'>('all')
  const [progressoFilter, setProgressoFilter] = useState<'all' | 'verde' | 'amarelo' | 'vermelho' | 'sem-registro'>('all')
  const [estatisticasTrocaOleo, setEstatisticasTrocaOleo] = useState<Record<string, { kmAtual: number; kmProxTroca: number; progresso: number }>>({})
  const [relatorioDialogOpen, setRelatorioDialogOpen] = useState(false)
  const [margemDialogOpen, setMargemDialogOpen] = useState(false)
  const [margemPorcentagem, setMargemPorcentagem] = useState<string>("")
  const [relatorioData, setRelatorioData] = useState<Array<{
    veiculo: Veiculo
    progresso: number
    filtrosTem: Array<{ categoria: string; descricao: string; estoque: number }>
    filtrosNaoTem: Array<{ categoria: string; descricao: string }>
  }>>([])

  // Função para obter cor do progresso (mesma lógica da página de troca de óleo)
  function getCorProgresso(progresso: number) {
    if (progresso < 50) return "bg-green-500"
    if (progresso < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Função para verificar se um veículo está pronto para troca de óleo
  // Recebe os filtros já carregados para evitar chamadas duplicadas ao banco
  const verificarProntoParaTroca = (filtros: FiltroRegistrado[], todosProdutos: Produto[]): boolean => {
    // Se não tem nenhum filtro registrado, não está pronto
    if (filtros.length === 0) {
      return false
    }
    
    // Agrupar filtros por categoria
    const categoriasComFiltros = new Set(filtros.map(f => f.categoria))
    
    // Criar um mapa de produtos para acesso O(1) em vez de O(n)
    const produtosMap = new Map(todosProdutos.map(p => [p.id, p]))
    
    // Verificar se todas as categorias que têm filtros registrados têm pelo menos um com estoque
    for (const categoria of categoriasComFiltros) {
      const filtrosCategoria = filtros.filter(f => f.categoria === categoria)
      
      // Verificar se pelo menos um filtro desta categoria tem estoque
      const temEstoque = filtrosCategoria.some(filtro => {
        const produto = produtosMap.get(filtro.produtoId)
        if (!produto) {
          return false
        }
        // Verificar estoque - pode ser número ou string
        const estoque = typeof produto.estoque === 'string' ? parseInt(produto.estoque) : produto.estoque
        return estoque > 0
      })
      
      if (!temEstoque) {
        return false // Nenhum filtro desta categoria tem estoque
      }
    }
    
    return true // Todas as categorias que têm filtros registrados têm pelo menos um com estoque
  }

  useEffect(() => {
    const loadData = async () => {
      const [veiculosData, produtosData] = await Promise.all([
        getVeiculosSupabase(),
        getProdutosSupabase()
      ])
      setVeiculos(veiculosData)
      setTodosProdutos(produtosData)
      
      // Carregar contagem de filtros e verificar prontidão para cada veículo (em paralelo)
      const contagens: Record<string, number> = {}
      const prontos: Record<string, boolean> = {}
      const estatisticas: Record<string, { kmAtual: number; kmProxTroca: number; progresso: number }> = {}
      
      // Executar todas as chamadas em paralelo para melhor performance
      const promises = veiculosData.map(async (veiculo) => {
        // Carregar filtros e estatísticas em paralelo
        const [filtros, stats] = await Promise.all([
          getFiltrosDoVeiculoSupabase(veiculo.id),
          getEstatisticasTrocasOleo(veiculo.id).catch(() => ({
            kmAtual: 0,
            kmProxTroca: 0,
            progresso: 0
          }))
        ])
        
        // Debug: verificar se filtros foram carregados corretamente
        if (filtros.length > 0) {
          console.log(`Veículo ${veiculo.placa} (${veiculo.id}): ${filtros.length} filtros encontrados`)
        }
        
        contagens[veiculo.id] = filtros.length
        
        // Verificar prontidão usando os filtros já carregados (sem chamada adicional ao banco)
        prontos[veiculo.id] = verificarProntoParaTroca(filtros, produtosData)
        
        // Armazenar estatísticas
        estatisticas[veiculo.id] = {
          kmAtual: stats.kmAtual || 0,
          kmProxTroca: stats.kmProxTroca || 0,
          progresso: stats.progresso || 0
        }
      })
      
      // Aguardar todas as promessas em paralelo
      await Promise.all(promises)
      
      // Debug: verificar contagens antes de atualizar o estado
      console.log('[loadData] Contagens finais:', contagens)
      console.log('[loadData] Total de veículos processados:', Object.keys(contagens).length)
      
      setFiltrosPorVeiculo(contagens)
      setVeiculosProntosParaTroca(prontos)
      setEstatisticasTrocaOleo(estatisticas)
    }
    loadData()
  }, [])

  const handleOpenModal = async (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo)
    setModalOpen(true)
    const produtos = await getProdutosCompativeisComVeiculoSupabase(veiculo.id)
    setProdutosCompativeis(produtos)
    setFiltrosRegistrados(await getFiltrosDoVeiculoSupabase(veiculo.id))
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedVeiculo(null)
  }

  const handleOpenRegisterModal = (veiculo: Veiculo) => {
    setRegisterVeiculo(veiculo)
    setRegisterModalOpen(true)
    setSelectedCategoria("")
    setSelectedProduto(null)
  }

  const handleCloseRegisterModal = () => {
    setRegisterModalOpen(false)
    setRegisterVeiculo(null)
    setSelectedCategoria("")
    setSelectedProduto(null)
  }

  const handleRegister = async () => {
    if (!registerVeiculo || !selectedCategoria || !selectedProduto) return

    // Buscar todos os produtos para encontrar os similares
    const todosProdutos = await getProdutosSupabase()
    // Encontrar o produto selecionado
    const produtoPrincipal = todosProdutos.find(p => p.id === selectedProduto.id)
    // Encontrar os similares
    const similares = produtoPrincipal && produtoPrincipal.produtosSimilares && produtoPrincipal.produtosSimilares.length > 0
      ? todosProdutos.filter(p => produtoPrincipal.produtosSimilares.includes(p.id))
      : []

    // Registrar o filtro para o produto principal
    const novoFiltro = {
      veiculoId: registerVeiculo.id,
      categoria: selectedCategoria,
      produtoId: selectedProduto.id,
      produtoDescricao: selectedProduto.descricao
    }
    await addFiltroRegistradoSupabase(novoFiltro)

    // Registrar o filtro para cada similar (se ainda não registrado para esse veículo/categoria)
    for (const similar of similares) {
      const filtrosExistentes = await getFiltrosDoVeiculoSupabase(registerVeiculo.id);
      const jaRegistrado = filtrosExistentes.some(f =>
        f.veiculoId === registerVeiculo.id &&
        f.categoria === selectedCategoria &&
        f.produtoId === similar.id
      );
      if (!jaRegistrado) {
        await addFiltroRegistradoSupabase({
          veiculoId: registerVeiculo.id,
          categoria: selectedCategoria,
          produtoId: similar.id,
          produtoDescricao: similar.descricao
        });
      }
    }

    toast({
      title: "Filtro registrado!",
      description: `O filtro '${selectedCategoria}' foi registrado para o veículo ${registerVeiculo.placa} (${selectedProduto.descricao}${similares.length > 0 ? ` e similares: ${similares.map(s => s.descricao).join(", ")}` : ""})`,
      variant: "default"
    })
    
    // Atualizar contagem de filtros e verificar prontidão
    const filtrosAtualizados = await getFiltrosDoVeiculoSupabase(registerVeiculo.id)
    const pronto = verificarProntoParaTroca(filtrosAtualizados, todosProdutos)
    
    setFiltrosPorVeiculo(prev => ({
      ...prev,
      [registerVeiculo.id]: filtrosAtualizados.length
    }))
    
    setVeiculosProntosParaTroca(prev => ({
      ...prev,
      [registerVeiculo.id]: pronto
    }))
    
    handleCloseRegisterModal()
    if (selectedVeiculo && selectedVeiculo.id === registerVeiculo.id) {
      setFiltrosRegistrados(filtrosAtualizados)
    }
  }

  async function removeFiltroRegistrado(veiculoId: string, categoria: string, produtoId: string, updateState?: (filtros: FiltroRegistrado[]) => void) {
    try {
      await removeFiltroRegistradoSupabase(veiculoId, categoria, produtoId);
      // Após remover do Supabase, atualizar o estado local buscando novamente
      if (updateState && veiculoId) {
         const updatedFiltros = await getFiltrosDoVeiculoSupabase(veiculoId);
         updateState(updatedFiltros);
         // Atualizar contagem de filtros e verificar prontidão
         const pronto = verificarProntoParaTroca(updatedFiltros, todosProdutos)
         
         setFiltrosPorVeiculo(prev => ({
           ...prev,
           [veiculoId]: updatedFiltros.length
         }))
         
         setVeiculosProntosParaTroca(prev => ({
           ...prev,
           [veiculoId]: pronto
         }))
      }
      toast({
        title: "Filtro removido!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao remover filtro",
        description: "Ocorreu um erro ao tentar remover o filtro.",
        variant: "destructive"
      });
    }
  }


  const veiculosFiltrados = veiculos.filter(v => {
    const q = searchTerm.toLowerCase()
    const matchSearch = (
      v.placa.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q)
    )
    
    if (!matchSearch) return false
    
    // Aplicar filtro de status de filtros
    if (statusFilter !== 'all') {
      const totalFiltros = filtrosPorVeiculo[v.id] || 0
      const prontoParaTroca = veiculosProntosParaTroca[v.id] || false
      
      if (statusFilter === 'sem-cadastro') {
        if (totalFiltros !== 0) return false
      } else if (statusFilter === 'pronto') {
        if (!(totalFiltros > 0 && prontoParaTroca)) return false
      } else if (statusFilter === 'nao-pronto') {
        if (!(totalFiltros > 0 && !prontoParaTroca)) return false
      }
    }
    
    // Aplicar filtro de progresso de troca de óleo
    if (progressoFilter !== 'all') {
      const stats = estatisticasTrocaOleo[v.id]
      
      if (progressoFilter === 'sem-registro') {
        // Sem registro: progresso = 0 e kmAtual = 0
        if (!stats || (stats.progresso === 0 && stats.kmAtual === 0)) {
          return true
        }
        return false
      }
      
      // Para os outros filtros, precisa ter progresso > 0
      if (!stats || stats.progresso === 0) {
        return false
      }
      
      if (progressoFilter === 'verde') {
        if (stats.progresso >= 50) return false
      } else if (progressoFilter === 'amarelo') {
        if (stats.progresso < 50 || stats.progresso >= 80) return false
      } else if (progressoFilter === 'vermelho') {
        if (stats.progresso < 80) return false
      }
    }
    
    return true
  })
  
  // Contar veículos por status
  const contarVeiculosPorStatus = () => {
    let pronto = 0
    let naoPronto = 0
    let semCadastro = 0
    
    veiculos.forEach(v => {
      const totalFiltros = filtrosPorVeiculo[v.id] || 0
      const prontoParaTroca = veiculosProntosParaTroca[v.id] || false
      
      if (totalFiltros === 0) {
        semCadastro++
      } else if (prontoParaTroca) {
        pronto++
      } else {
        naoPronto++
      }
    })
    
    return { pronto, naoPronto, semCadastro }
  }
  
  // Contar veículos por progresso de troca de óleo
  const contarVeiculosPorProgresso = () => {
    let verde = 0
    let amarelo = 0
    let vermelho = 0
    let semRegistro = 0
    
    veiculos.forEach(v => {
      const stats = estatisticasTrocaOleo[v.id]
      if (!stats || (stats.progresso === 0 && stats.kmAtual === 0)) {
        semRegistro++
      } else if (stats.progresso > 0) {
        if (stats.progresso < 50) {
          verde++
        } else if (stats.progresso < 80) {
          amarelo++
        } else {
          vermelho++
        }
      }
    })
    
    return { verde, amarelo, vermelho, semRegistro }
  }
  
  const contadores = contarVeiculosPorStatus()
  const contadoresProgresso = contarVeiculosPorProgresso()

  // Função para gerar relatório
  const gerarRelatorio = async () => {
    const margem = parseFloat(margemPorcentagem)
    if (isNaN(margem) || margem < 0 || margem > 100) {
      toast({
        title: "Margem inválida",
        description: "Por favor, informe uma porcentagem entre 0 e 100.",
        variant: "destructive"
      })
      return
    }

    // Filtrar veículos com progresso >= margem e ordenar do maior para o menor
    const veiculosFiltrados = veiculos
      .filter(v => {
        const stats = estatisticasTrocaOleo[v.id]
        return stats && stats.progresso >= margem
      })
      .sort((a, b) => {
        const statsA = estatisticasTrocaOleo[a.id]?.progresso || 0
        const statsB = estatisticasTrocaOleo[b.id]?.progresso || 0
        return statsB - statsA // Ordenar do maior para o menor
      })

    // Criar mapa de produtos para acesso rápido
    const produtosMap = new Map(todosProdutos.map(p => [p.id, p]))

    // Para cada veículo, verificar filtros em estoque e faltando
    const relatorio: Array<{
      veiculo: Veiculo
      progresso: number
      filtrosTem: Array<{ categoria: string; descricao: string; estoque: number }>
      filtrosNaoTem: Array<{ categoria: string; descricao: string }>
    }> = []

    for (const veiculo of veiculosFiltrados) {
      const filtros = await getFiltrosDoVeiculoSupabase(veiculo.id)
      const filtrosEmEstoque: Array<{ categoria: string; descricao: string; estoque: number }> = []
      const filtrosFaltando: Array<{ categoria: string; descricao: string }> = []

      // Agrupar filtros por categoria
      const filtrosPorCategoria = new Map<string, FiltroRegistrado[]>()
      for (const filtro of filtros) {
        if (!filtrosPorCategoria.has(filtro.categoria)) {
          filtrosPorCategoria.set(filtro.categoria, [])
        }
        filtrosPorCategoria.get(filtro.categoria)!.push(filtro)
      }

      // Para cada categoria que tem filtros registrados
      for (const [categoria, filtrosCategoria] of filtrosPorCategoria.entries()) {
        // Encontrar o primeiro produto com estoque
        let produtoComEstoque: { categoria: string; descricao: string; estoque: number } | null = null
        
        for (const filtro of filtrosCategoria) {
          const produto = produtosMap.get(filtro.produtoId)
          if (!produto) continue
          
          const estoque = typeof produto.estoque === 'string' ? parseInt(produto.estoque) : produto.estoque
          
          if (estoque > 0) {
            produtoComEstoque = {
              categoria,
              descricao: filtro.produtoDescricao,
              estoque
            }
            break // Encontrou um com estoque, para de procurar
          }
        }

        if (produtoComEstoque) {
          // Se tem algum com estoque, adiciona apenas esse (não mostra os que estão faltando)
          filtrosEmEstoque.push(produtoComEstoque)
        } else {
          // Se não tem nenhum com estoque, mostra apenas o primeiro da lista
          if (filtrosCategoria.length > 0) {
            filtrosFaltando.push({
              categoria,
              descricao: filtrosCategoria[0].produtoDescricao
            })
          }
        }
      }

      const stats = estatisticasTrocaOleo[veiculo.id]

      relatorio.push({
        veiculo,
        progresso: stats?.progresso || 0,
        filtrosTem: filtrosEmEstoque,
        filtrosNaoTem: filtrosFaltando
      })
    }

    setRelatorioData(relatorio)
    setMargemDialogOpen(false)
    setRelatorioDialogOpen(true)
  }

  // Função para exportar relatório para Word
  const exportarParaWord = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Título
              new Paragraph({
                text: "Relatório de Filtros - Veículos com Progresso ≥ " + margemPorcentagem + "%",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              // Data de geração
              new Paragraph({
                text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              // Informações gerais
              new Paragraph({
                text: `Total de veículos encontrados: ${relatorioData.length}`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: "",
                spacing: { after: 200 },
              }),
              // Conteúdo do relatório
              ...relatorioData.flatMap((item, index) => [
                new Paragraph({
                  text: `${index + 1}. ${item.veiculo.placa} - ${item.veiculo.modelo} ${item.veiculo.marca} (${item.veiculo.ano})`,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Status: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: item.veiculo.status,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Secretaria: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: item.veiculo.secretaria,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Progresso de Troca de Óleo: ",
                      bold: true,
                    }),
                    new TextRun({
                      text: `${item.progresso}%`,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
                // Filtros em Estoque
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Filtros em Estoque",
                      bold: true,
                      color: "008000",
                    }),
                    new TextRun({
                      text: ` (${item.filtrosTem.length})`,
                      bold: true,
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                }),
                ...(item.filtrosTem.length > 0
                  ? item.filtrosTem.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria}) - Estoque: ${filtro.estoque.toLocaleString('pt-BR')}`,
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    )
                  : [
                      new Paragraph({
                        text: "Nenhum filtro em estoque",
                        spacing: { after: 100 },
                      }),
                    ]),
                // Filtros Faltando
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Filtros Faltando",
                      bold: true,
                      color: "FF0000",
                    }),
                    new TextRun({
                      text: ` (${item.filtrosNaoTem.length})`,
                      bold: true,
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                }),
                ...(item.filtrosNaoTem.length > 0
                  ? item.filtrosNaoTem.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria})`,
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    )
                  : [
                      new Paragraph({
                        text: "Todos os filtros estão em estoque!",
                        spacing: { after: 100 },
                      }),
                    ]),
                // Espaçamento entre veículos
                new Paragraph({
                  text: "",
                  spacing: { after: 400 },
                }),
              ]),
              // Lista consolidada de filtros faltando
              ...((): Paragraph[] => {
                // Consolidar todos os filtros faltando contando a quantidade
                const filtrosFaltandoConsolidados = new Map<string, { categoria: string; descricao: string; quantidade: number }>()
                
                relatorioData.forEach(item => {
                  item.filtrosNaoTem.forEach(filtro => {
                    const key = `${filtro.categoria}-${filtro.descricao}`
                    if (filtrosFaltandoConsolidados.has(key)) {
                      filtrosFaltandoConsolidados.get(key)!.quantidade++
                    } else {
                      filtrosFaltandoConsolidados.set(key, { ...filtro, quantidade: 1 })
                    }
                  })
                })

                const listaConsolidada = Array.from(filtrosFaltandoConsolidados.values())
                
                if (listaConsolidada.length > 0) {
                  return [
                    new Paragraph({
                      text: "",
                      spacing: { before: 600, after: 200 },
                    }),
                    new Paragraph({
                      text: "LISTA DE FILTROS PARA COMPRA",
                      heading: HeadingLevel.HEADING_1,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 200 },
                    }),
                    new Paragraph({
                      text: `Filtros faltando consolidados de todos os veículos do relatório (${listaConsolidada.length} ${listaConsolidada.length === 1 ? 'item' : 'itens'})`,
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 400 },
                    }),
                    ...listaConsolidada.map(
                      (filtro) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "• ",
                            }),
                            new TextRun({
                              text: filtro.descricao,
                              bold: true,
                            }),
                            new TextRun({
                              text: ` (${filtro.categoria}) - `,
                            }),
                            new TextRun({
                              text: `Quantidade: ${filtro.quantidade}`,
                              bold: true,
                              color: "FF0000",
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    ),
                  ]
                }
                return []
              })(),
            ],
          },
        ],
      })

      // Gerar o arquivo e fazer download
      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const today = new Date().toISOString().split("T")[0]
      link.download = `relatorio_filtros_${margemPorcentagem}%_${today}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Relatório exportado!",
        description: "O arquivo Word foi gerado com sucesso.",
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao exportar para Word:", error)
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao gerar o arquivo Word.",
        variant: "destructive",
      })
    }
  }

  // Função para atualizar os dados
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const [veiculos, produtos] = await Promise.all([
        getVeiculosSupabase(),
        getProdutosSupabase()
      ])
      setVeiculos(veiculos)
      setTodosProdutos(produtos)
      
      // Atualizar contagem de filtros e verificar prontidão (em paralelo)
      const contagens: Record<string, number> = {}
      const prontos: Record<string, boolean> = {}
      const estatisticas: Record<string, { kmAtual: number; kmProxTroca: number; progresso: number }> = {}
      
      // Executar todas as chamadas em paralelo
      const promises = veiculos.map(async (veiculo) => {
        const [filtros, stats] = await Promise.all([
          getFiltrosDoVeiculoSupabase(veiculo.id),
          getEstatisticasTrocasOleo(veiculo.id).catch(() => ({
            kmAtual: 0,
            kmProxTroca: 0,
            progresso: 0
          }))
        ])
        
        // Debug: verificar se filtros foram carregados corretamente
        if (filtros.length > 0) {
          console.log(`[Atualizar] Veículo ${veiculo.placa} (${veiculo.id}): ${filtros.length} filtros encontrados`)
        } else {
          console.log(`[Atualizar] Veículo ${veiculo.placa} (${veiculo.id}): Nenhum filtro encontrado`)
        }
        
        contagens[veiculo.id] = filtros.length
        prontos[veiculo.id] = verificarProntoParaTroca(filtros, produtos)
        estatisticas[veiculo.id] = {
          kmAtual: stats.kmAtual || 0,
          kmProxTroca: stats.kmProxTroca || 0,
          progresso: stats.progresso || 0
        }
      })
      
      await Promise.all(promises)
      
      console.log('[Atualizar] Contagens finais:', contagens)
      
      setFiltrosPorVeiculo(contagens)
      setVeiculosProntosParaTroca(prontos)
      setEstatisticasTrocaOleo(estatisticas)
      
      toast({ title: "Dados atualizados!", variant: "default" })
    } catch (e) {
      toast({ title: "Erro ao atualizar dados", variant: "destructive" })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isMobile) {
    return (
      <>
        <FiltrosMobileView
          veiculosFiltrados={veiculosFiltrados}
          filtrosPorVeiculo={filtrosPorVeiculo}
          veiculosProntosParaTroca={veiculosProntosParaTroca}
          estatisticasTrocaOleo={estatisticasTrocaOleo}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          progressoFilter={progressoFilter}
          setProgressoFilter={setProgressoFilter}
          contadores={contadores}
          contadoresProgresso={contadoresProgresso}
          isRefreshing={isRefreshing}
          handleRefresh={handleRefresh}
          handleOpenModal={handleOpenModal}
          handleOpenRegisterModal={handleOpenRegisterModal}
          getCorProgresso={getCorProgresso}
        />
        
        {/* Modais - compartilhados entre mobile e desktop */}
        <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filtros do Veículo
              </DialogTitle>
              {selectedVeiculo && (
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="font-medium text-sm tracking-wide border-primary/20 bg-primary/5 text-foreground/90">
                    {selectedVeiculo.placa}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {selectedVeiculo.modelo} • {selectedVeiculo.marca} • {selectedVeiculo.ano}
                  </span>
                </div>
              )}
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {filtrosRegistrados.length > 0 
                    ? `${filtrosRegistrados.length} ${filtrosRegistrados.length === 1 ? 'filtro registrado' : 'filtros registrados'}`
                    : 'Nenhum filtro registrado ainda'}
                </p>
                <Button 
                  variant={editMode ? "secondary" : "outline"} 
                  size="sm" 
                  onClick={() => setEditMode(e => !e)}
                  className="flex items-center gap-2"
                >
                  {editMode ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Concluir Edição
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Editar Lista
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FILTER_HEADERS.map((header) => {
                  const filtros = filtrosRegistrados.filter(f => f.categoria === header)
                  const temFiltros = filtros.length > 0
                  
                  return (
                    <Card key={header} className={`border ${temFiltros ? 'border-primary/20 bg-primary/5' : 'border-border/50 bg-muted/30'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm text-foreground/90">{header}</h3>
                          {temFiltros && (
                            <Badge variant="secondary" className="text-xs font-normal bg-primary/10 text-primary/80 border-0">
                              {filtros.length} {filtros.length === 1 ? 'item' : 'itens'}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!temFiltros ? (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <XCircle className="h-6 w-6 text-muted-foreground/40 mb-2" />
                            <span className="text-xs text-muted-foreground/70">Nenhum filtro registrado</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filtros.map(filtro => {
                              const produto = todosProdutos.find(p => p.id === filtro.produtoId)
                              const estoque = produto ? (typeof produto.estoque === 'string' ? parseInt(produto.estoque) : produto.estoque) : 0
                              const emEstoque = estoque > 0
                              return (
                                <div
                                  key={filtro.produtoId + filtro.categoria}
                                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                                    emEstoque 
                                      ? "bg-green-50/80 dark:bg-green-950/10 text-green-700/90 dark:text-green-400/90 border border-green-200/50 dark:border-green-800/30" 
                                      : "bg-red-50/80 dark:bg-red-950/10 text-red-700/90 dark:text-red-400/90 border border-red-200/50 dark:border-red-800/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {emEstoque ? (
                                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium truncate block" title={filtro.produtoDescricao}>
                                        {filtro.produtoDescricao}
                                      </span>
                                      <span className={`text-xs mt-0.5 font-normal ${emEstoque ? 'text-green-600/80 dark:text-green-500/80' : 'text-red-600/80 dark:text-red-500/80'}`}>
                                        Estoque: {estoque.toLocaleString('pt-BR')} {produto?.unidade || 'un'}
                                      </span>
                                    </div>
                                  </div>
                                  {editMode && (
                                    <button
                                      type="button"
                                      className="ml-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors flex-shrink-0"
                                      onClick={() => removeFiltroRegistrado(selectedVeiculo?.id || '', header, filtro.produtoId, setFiltrosRegistrados)}
                                      title="Remover filtro"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <DialogClose asChild>
                <Button variant="secondary">Fechar</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de registro de filtro */}
        <Dialog open={registerModalOpen} onOpenChange={handleCloseRegisterModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Filtro</DialogTitle>
              <div className="text-muted-foreground text-sm mt-1">
                {registerVeiculo && `${registerVeiculo.placa} - ${registerVeiculo.modelo} (${registerVeiculo.marca})`}
              </div>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Categoria do Filtro</label>
                <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_HEADERS.map((header) => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Produto</label>
                <Button variant="outline" className="w-full" onClick={() => setProdutoDialogOpen(true)}>
                  {selectedProduto ? selectedProduto.descricao : "Selecionar Produto"}
                </Button>
              </div>
              <Button onClick={handleRegister} disabled={!selectedCategoria || !selectedProduto} className="w-full">
                Registrar Filtro
              </Button>
            </div>
            <SelecionarProdutoDialog
              open={produtoDialogOpen}
              onOpenChange={setProdutoDialogOpen}
              onSelect={setSelectedProduto}
            />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md-custom">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 mb-6">
            {/* Barra de busca e botão atualizar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Barra de busca */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar veículo por placa, modelo ou marca..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <RotateCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Atualizando..." : "Atualizar"}
                </Button>
                <Button
                  variant="default"
                  onClick={() => setMargemDialogOpen(true)}
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <FileText className="h-4 w-4" />
                  Relatório
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Filtros de status de filtros */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground/90">Status dos Filtros</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="flex items-center gap-1.5 h-8 px-3"
                  >
                    Todos ({veiculos.length})
                  </Button>
                  <Button
                    variant={statusFilter === 'pronto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pronto')}
                    className={`flex items-center gap-1.5 h-8 px-3 ${
                      statusFilter === 'pronto' 
                        ? 'bg-green-500 hover:bg-green-600 text-white border-green-500 shadow-sm' 
                        : 'border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'pronto' ? 'bg-white' : 'bg-green-500'}`}></div>
                    Prontos ({contadores.pronto})
                  </Button>
                  <Button
                    variant={statusFilter === 'nao-pronto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('nao-pronto')}
                    className={`flex items-center gap-1.5 h-8 px-3 ${
                      statusFilter === 'nao-pronto' 
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm' 
                        : 'border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'nao-pronto' ? 'bg-white' : 'bg-red-500'}`}></div>
                    Não Prontos ({contadores.naoPronto})
                  </Button>
                  <Button
                    variant={statusFilter === 'sem-cadastro' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('sem-cadastro')}
                    className={`flex items-center gap-1.5 h-8 px-3 ${
                      statusFilter === 'sem-cadastro' 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 shadow-sm' 
                        : 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-500'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'sem-cadastro' ? 'bg-white' : 'bg-yellow-500'}`}></div>
                    Sem Cadastro ({contadores.semCadastro})
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Filtros de progresso de troca de óleo */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground/90">Progresso de Troca de Óleo</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={progressoFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProgressoFilter('all')}
                    className="flex items-center gap-1.5 h-8 px-3"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={progressoFilter === 'verde' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProgressoFilter('verde')}
                    className={`flex items-center gap-1.5 h-8 px-3 ${
                      progressoFilter === 'verde' 
                        ? 'bg-green-500 hover:bg-green-600 text-white border-green-500 shadow-sm' 
                        : 'border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${progressoFilter === 'verde' ? 'bg-white' : 'bg-green-500'}`}></div>
                    Verde ({contadoresProgresso.verde})
                  </Button>
                  <Button
                    variant={progressoFilter === 'amarelo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProgressoFilter('amarelo')}
                    className={`flex items-center gap-1.5 h-8 px-3 ${
                      progressoFilter === 'amarelo' 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 shadow-sm' 
                        : 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-500'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${progressoFilter === 'amarelo' ? 'bg-white' : 'bg-yellow-500'}`}></div>
                    Amarelo ({contadoresProgresso.amarelo})
                  </Button>
                  <Button
                    variant={progressoFilter === 'vermelho' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProgressoFilter('vermelho')}
                    className={`flex items-center gap-1.5 h-8 px-3 ${
                      progressoFilter === 'vermelho' 
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm' 
                        : 'border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${progressoFilter === 'vermelho' ? 'bg-white' : 'bg-red-500'}`}></div>
                    Vermelho ({contadoresProgresso.vermelho})
                  </Button>
                  <Button
                    variant={progressoFilter === 'sem-registro' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProgressoFilter('sem-registro')}
                    className={`flex items-center gap-1.5 h-8 px-3 ${
                      progressoFilter === 'sem-registro' 
                        ? 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500 shadow-sm' 
                        : 'border-gray-500/50 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-950/20 hover:border-gray-500'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${progressoFilter === 'sem-registro' ? 'bg-white' : 'bg-gray-500'}`}></div>
                    Sem Registro ({contadoresProgresso.semRegistro})
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {veiculosFiltrados.map((veiculo) => {
          const totalFiltros = filtrosPorVeiculo[veiculo.id] || 0
          const prontoParaTroca = veiculosProntosParaTroca[veiculo.id] || false
          
          return (
            <Card
            key={veiculo.id}
              className="hover:shadow-md transition-all duration-300 border hover:border-primary/30 overflow-hidden group relative bg-card/50 backdrop-blur-sm"
            >
              <div className="absolute top-3 right-3 z-10">
                {totalFiltros === 0 ? (
                  <div className="bg-yellow-400/90 rounded-full p-1.5 shadow-sm hover:bg-yellow-500/90 transition-all duration-200 backdrop-blur-sm" title="Nenhum filtro registrado ainda">
                    <Oil className="h-4 w-4 text-white" />
                  </div>
                ) : prontoParaTroca ? (
                  <div className="bg-green-400/90 rounded-full p-1.5 shadow-sm hover:bg-green-500/90 transition-all duration-200 backdrop-blur-sm" title="Pronto para troca de óleo - Todos os filtros com estoque">
                    <Oil className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="bg-red-400/90 rounded-full p-1.5 shadow-sm hover:bg-red-500/90 transition-all duration-200 backdrop-blur-sm" title="Não está pronto - Algum filtro está sem estoque">
                    <Oil className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary/10 transition-colors duration-200">
                      <Car className="h-4 w-4 text-primary/80" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-medium text-sm tracking-wide border-primary/20 bg-primary/5 text-foreground/90">
                {veiculo.placa}
                        </Badge>
                        <Badge 
                          variant={veiculo.status === "Ativo" ? "default" : "destructive"}
                          className="text-xs font-normal"
                        >
                {veiculo.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-medium text-base text-foreground/90 line-clamp-1 mb-1.5">
                    {veiculo.modelo}
                  </h3>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 opacity-60" />
                      <span>{veiculo.marca} • {veiculo.ano}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 opacity-60" />
                      <span className="line-clamp-1">{veiculo.secretaria}</span>
                    </div>
                    {totalFiltros > 0 && (
                      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/50">
                        <Filter className="h-3.5 w-3.5 text-primary/70" />
                        <span className="font-normal text-primary/80">
                          {totalFiltros} {totalFiltros === 1 ? 'filtro registrado' : 'filtros registrados'}
              </span>
            </div>
                    )}
                  </div>
                </div>
                
                {/* Informações de Troca de Óleo */}
                {estatisticasTrocaOleo[veiculo.id] && (estatisticasTrocaOleo[veiculo.id].kmAtual > 0 || estatisticasTrocaOleo[veiculo.id].kmProxTroca > 0) && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                      <Gauge className="h-3.5 w-3.5 opacity-60" />
                      <span className="font-normal">Troca de Óleo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Km Atual:</span>
                        <span className="ml-1 font-medium">
                          {estatisticasTrocaOleo[veiculo.id].kmAtual > 0 
                            ? estatisticasTrocaOleo[veiculo.id].kmAtual.toLocaleString('pt-BR') 
                            : '-'}
                        </span>
            </div>
                      <div>
                        <span className="text-muted-foreground">Próx. Troca:</span>
                        <span className="ml-1 font-medium">
                          {estatisticasTrocaOleo[veiculo.id].kmProxTroca > 0 
                            ? estatisticasTrocaOleo[veiculo.id].kmProxTroca.toLocaleString('pt-BR') 
                            : '-'}
                        </span>
            </div>
          </div>
                    {estatisticasTrocaOleo[veiculo.id].kmAtual > 0 && estatisticasTrocaOleo[veiculo.id].kmProxTroca > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{estatisticasTrocaOleo[veiculo.id].progresso}%</span>
                        </div>
                        <Progress 
                          value={estatisticasTrocaOleo[veiculo.id].progresso} 
                          className="h-2"
                          indicatorClassName={estatisticasTrocaOleo[veiculo.id].progresso > 0 ? getCorProgresso(estatisticasTrocaOleo[veiculo.id].progresso) : "bg-green-500"}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 flex gap-2 items-center hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 border-border/50" 
                  onClick={() => handleOpenModal(veiculo)}
                >
                  <BadgeCheck className="h-4 w-4" /> 
                  Ver Filtros
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1 flex gap-2 items-center shadow-sm hover:shadow transition-all duration-200" 
                  onClick={() => handleOpenRegisterModal(veiculo)}
                >
                  <Oil className="h-4 w-4" /> 
                  Registrar
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtros do Veículo
            </DialogTitle>
            {selectedVeiculo && (
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="font-medium text-sm tracking-wide border-primary/20 bg-primary/5 text-foreground/90">
                  {selectedVeiculo.placa}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {selectedVeiculo.modelo} • {selectedVeiculo.marca} • {selectedVeiculo.ano}
                </span>
            </div>
            )}
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {filtrosRegistrados.length > 0 
                  ? `${filtrosRegistrados.length} ${filtrosRegistrados.length === 1 ? 'filtro registrado' : 'filtros registrados'}`
                  : 'Nenhum filtro registrado ainda'}
              </p>
              <Button 
                variant={editMode ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => setEditMode(e => !e)}
                className="flex items-center gap-2"
              >
                {editMode ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir Edição
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Editar Lista
                  </>
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FILTER_HEADERS.map((header) => {
                const filtros = filtrosRegistrados.filter(f => f.categoria === header)
                const temFiltros = filtros.length > 0
                
                return (
                  <Card key={header} className={`border ${temFiltros ? 'border-primary/20 bg-primary/5' : 'border-border/50 bg-muted/30'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm text-foreground/90">{header}</h3>
                        {temFiltros && (
                          <Badge variant="secondary" className="text-xs font-normal bg-primary/10 text-primary/80 border-0">
                            {filtros.length} {filtros.length === 1 ? 'item' : 'itens'}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!temFiltros ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <XCircle className="h-6 w-6 text-muted-foreground/40 mb-2" />
                          <span className="text-xs text-muted-foreground/70">Nenhum filtro registrado</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filtros.map(filtro => {
                            const produto = todosProdutos.find(p => p.id === filtro.produtoId)
                            const estoque = produto ? (typeof produto.estoque === 'string' ? parseInt(produto.estoque) : produto.estoque) : 0
                            const emEstoque = estoque > 0
                            return (
                              <div
                                key={filtro.produtoId + filtro.categoria}
                                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                                  emEstoque 
                                    ? "bg-green-50/80 dark:bg-green-950/10 text-green-700/90 dark:text-green-400/90 border border-green-200/50 dark:border-green-800/30" 
                                    : "bg-red-50/80 dark:bg-red-950/10 text-red-700/90 dark:text-red-400/90 border border-red-200/50 dark:border-red-800/30"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {emEstoque ? (
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium truncate block" title={filtro.produtoDescricao}>
                                      {filtro.produtoDescricao}
                                    </span>
                                    <span className={`text-xs mt-0.5 font-normal ${emEstoque ? 'text-green-600/80 dark:text-green-500/80' : 'text-red-600/80 dark:text-red-500/80'}`}>
                                      Estoque: {estoque.toLocaleString('pt-BR')} {produto?.unidade || 'un'}
                                    </span>
                                  </div>
                                </div>
                                {editMode && (
                                  <button
                                    type="button"
                                    className="ml-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors flex-shrink-0"
                                    onClick={() => removeFiltroRegistrado(selectedVeiculo?.id || '', header, filtro.produtoId, setFiltrosRegistrados)}
                                    title="Remover filtro"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
          <DialogClose asChild>
              <Button variant="secondary">Fechar</Button>
          </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de registro de filtro */}
      <Dialog open={registerModalOpen} onOpenChange={handleCloseRegisterModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Filtro</DialogTitle>
            <div className="text-muted-foreground text-sm mt-1">
              {registerVeiculo && `${registerVeiculo.placa} - ${registerVeiculo.modelo} (${registerVeiculo.marca})`}
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria do Filtro</label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_HEADERS.map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Produto</label>
              <Button variant="outline" className="w-full" onClick={() => setProdutoDialogOpen(true)}>
                {selectedProduto ? selectedProduto.descricao : "Selecionar Produto"}
              </Button>
            </div>
            <Button onClick={handleRegister} disabled={!selectedCategoria || !selectedProduto} className="w-full">
              Registrar Filtro
            </Button>
          </div>
          <SelecionarProdutoDialog
            open={produtoDialogOpen}
            onOpenChange={setProdutoDialogOpen}
            onSelect={setSelectedProduto}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para solicitar margem de porcentagem */}
      <Dialog open={margemDialogOpen} onOpenChange={setMargemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Gerar Relatório
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Margem de Porcentagem (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 60"
                value={margemPorcentagem}
                onChange={(e) => setMargemPorcentagem(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Informe a porcentagem mínima de progresso da troca de óleo (0-100)
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMargemDialogOpen(false)
                  setMargemPorcentagem("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={gerarRelatorio} disabled={!margemPorcentagem}>
                Gerar Relatório
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de exibição do relatório */}
      <Dialog open={relatorioDialogOpen} onOpenChange={setRelatorioDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Relatório de Veículos - Progresso ≥ {margemPorcentagem}%
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {relatorioData.length} {relatorioData.length === 1 ? 'veículo encontrado' : 'veículos encontrados'}
                </p>
              </div>
              {relatorioData.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarParaWord}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar Word
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {relatorioData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p>Nenhum veículo encontrado com progresso ≥ {margemPorcentagem}%</p>
              </div>
            ) : (
              relatorioData.map((item) => (
                <Card key={item.veiculo.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-medium text-sm">
                            {item.veiculo.placa}
                          </Badge>
                          <Badge 
                            variant={item.veiculo.status === "Ativo" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {item.veiculo.status}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-base">
                          {item.veiculo.modelo} • {item.veiculo.marca} • {item.veiculo.ano}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.veiculo.secretaria}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Progresso</div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={item.progresso} 
                            className="h-2 w-24"
                            indicatorClassName={getCorProgresso(item.progresso)}
                          />
                          <span className="font-medium text-sm">{item.progresso}%</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filtros em estoque */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <h4 className="font-medium text-sm">Filtros em Estoque ({item.filtrosTem.length})</h4>
                      </div>
                      {item.filtrosTem.length > 0 ? (
                        <div className="space-y-2">
                          {item.filtrosTem.map((filtro, index) => (
                            <div
                              key={`${filtro.categoria}-${filtro.descricao}-${index}`}
                              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-green-700 dark:text-green-400">
                                  {filtro.descricao}
                                </div>
                                <div className="text-xs text-green-600/80 dark:text-green-500/80 mt-0.5">
                                  {filtro.categoria} • Estoque: {filtro.estoque.toLocaleString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum filtro em estoque</p>
                      )}
                    </div>

                    {/* Filtros faltando */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <h4 className="font-medium text-sm">Filtros Faltando ({item.filtrosNaoTem.length})</h4>
                      </div>
                      {item.filtrosNaoTem.length > 0 ? (
                        <div className="space-y-2">
                          {item.filtrosNaoTem.map((filtro, index) => (
                            <div
                              key={`${filtro.categoria}-${filtro.descricao}-${index}`}
                              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-red-700 dark:text-red-400">
                                  {filtro.descricao}
                                </div>
                                <div className="text-xs text-red-600/80 dark:text-red-500/80 mt-0.5">
                                  {filtro.categoria}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-600 dark:text-green-400">Todos os filtros estão em estoque!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Lista consolidada de filtros faltando */}
            {relatorioData.length > 0 && (() => {
              // Consolidar todos os filtros faltando contando a quantidade
              const filtrosFaltandoConsolidados = new Map<string, { categoria: string; descricao: string; quantidade: number }>()
              
              relatorioData.forEach(item => {
                item.filtrosNaoTem.forEach(filtro => {
                  const key = `${filtro.categoria}-${filtro.descricao}`
                  if (filtrosFaltandoConsolidados.has(key)) {
                    filtrosFaltandoConsolidados.get(key)!.quantidade++
                  } else {
                    filtrosFaltandoConsolidados.set(key, { ...filtro, quantidade: 1 })
                  }
                })
              })

              const listaConsolidada = Array.from(filtrosFaltandoConsolidados.values())
              
              if (listaConsolidada.length > 0) {
                return (
                  <Card className="border-l-4 border-l-red-500 mt-6">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-lg">Lista de Filtros para Compra</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Filtros faltando consolidados de todos os veículos do relatório ({listaConsolidada.length} {listaConsolidada.length === 1 ? 'item' : 'itens'})
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {listaConsolidada.map((filtro, index) => (
                          <div
                            key={`consolidado-${filtro.categoria}-${filtro.descricao}-${index}`}
                            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-red-700 dark:text-red-400">
                                {filtro.descricao}
                              </div>
                              <div className="text-xs text-red-600/80 dark:text-red-500/80 mt-0.5">
                                {filtro.categoria}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700">
                                Qtd: {filtro.quantidade}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              }
              return null
            })()}
          </div>

          <div className="flex justify-end mt-6">
            <DialogClose asChild>
              <Button variant="secondary">Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}