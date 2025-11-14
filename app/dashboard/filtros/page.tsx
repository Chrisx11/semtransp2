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
import { FuelIcon as Oil, Car, BadgeCheck, Trash2, RotateCcw, Search, Calendar, Building, Filter, CheckCircle2, XCircle, Gauge } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getEstatisticasTrocasOleo } from "@/services/troca-oleo-service"
import { Progress } from "@/components/ui/progress"

const FILTER_HEADERS = [
  "Filtro de Óleo",
  "Filtro de Comb.",
  "Filtro de Ar",
  "Filtro de Cabine",
  "Filtro de Ar 1°",
  "Filtro de Ar 2°",
  "Filtro Separador",
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

export default function FiltrosPage() {
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
    const pronto = await verificarProntoParaTroca(registerVeiculo.id, todosProdutos)
    
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
         const pronto = await verificarProntoParaTroca(veiculoId, todosProdutos)
         
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

              {/* Botão atualizar */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 w-full md:w-auto"
              >
                <RotateCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Atualizando..." : "Atualizar"}
              </Button>
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
    </div>
  )
}