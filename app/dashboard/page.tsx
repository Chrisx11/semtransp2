"use client"
import { useEffect, useState } from "react"
import { getVeiculosSupabase } from "@/services/veiculo-service"
import { getTrocasOleo, getUltimaTrocaOleo, getEstatisticasTrocasOleo } from "@/services/troca-oleo-service"
import { getProdutosSupabase } from "@/services/produto-service"
import { getSaidasSupabase } from "@/services/saida-service"
import { getEntradasSupabase } from "@/services/entrada-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Car, Clock, BarChart3, Package, Droplets, ArrowRight, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Activity, ChevronLeft, ChevronRight } from "lucide-react"

// Interfaces para os dados
interface VeiculoBase {
  id: string
  placa: string
  marca: string
  modelo: string
  kmAtual: number
  kmProxTroca: number
  status: string
}

interface VeiculoCalculado extends VeiculoBase {
  diff: number
}

interface Historico {
  id: string
  data: string
  tipo: string
  kmAtual?: number
  kmAnterior?: number
  kmProxTroca?: number
  observacao?: string
  veiculoId: string
}

interface ProdutoStatus {
  id: string
  nome: string
  quantidade: number
  unidade: string
  estoqueMinimo: number
}

interface TrocaPorMes {
  mes: string
  quantidade: number
  nomeMes?: string
}

interface Saida {
  id: string
  produtoId: string
  produtoNome: string
  categoria: string
  quantidade: number
  data: string
  responsavelId: string
  responsavelNome: string
  veiculoId: string
  veiculoPlaca: string
  veiculoModelo: string
  observacao?: string
  historicoId?: string
  createdAt: string
  updatedAt: string
}

interface Entrada {
  id: string
  produtoId: string
  produtoDescricao: string
  responsavelId: string
  responsavelNome: string
  quantidade: number
  data: string
  createdAt: string
}

// Helper functions
function getMonthYear(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`
}

function formatarData(data: string) {
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR')
}

// Adicionar uma função auxiliar para verificar se um registro é uma troca de óleo
function isTrocaOleo(tipoServico: string) {
  if (!tipoServico) return false
  
  const tipoLower = tipoServico.toLowerCase().trim()
  return tipoLower.includes('óleo') || 
         tipoLower.includes('oleo') || 
         tipoLower.includes('troca') || 
         tipoLower === 'óleo' || 
         tipoLower === 'oleo'
}

export default function DashboardPage() {
  const [veiculos, setVeiculos] = useState<VeiculoBase[]>([])
  const [proximasTrocas, setProximasTrocas] = useState<VeiculoCalculado[]>([])
  const [emAtraso, setEmAtraso] = useState<VeiculoCalculado[]>([])
  const [trocasPorMes, setTrocasPorMes] = useState<TrocaPorMes[]>([])
  const [ultimasTrocas, setUltimasTrocas] = useState<Historico[]>([])
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<ProdutoStatus[]>([])
  const [produtosMaisUsados, setProdutosMaisUsados] = useState<ProdutoStatus[]>([])
  const [ultimasSaidas, setUltimasSaidas] = useState<Saida[]>([])
  const [ultimasEntradas, setUltimasEntradas] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)
  const [veiculosEmDia, setVeiculosEmDia] = useState<any[]>([])
  const [veiculosComDados, setVeiculosComDados] = useState<any[]>([])
  const [abaTrocaOleo, setAbaTrocaOleo] = useState("em-dia")
  const [verMais, setVerMais] = useState({
    'em-dia': false,
    'proximo': false,
    'vencido': false,
    'nunca': false
  })
  const [trocasAtrasoDialogOpen, setTrocasAtrasoDialogOpen] = useState(false)
  const [mesOffset, setMesOffset] = useState(0) // Offset em meses para navegação no gráfico
  const [todasTrocas, setTodasTrocas] = useState<Historico[]>([]) // Armazenar todas as trocas para navegação

  // Função para atualizar todos os dados
  const atualizarDashboard = async () => {
    setLoading(true)
    try {
      // Carregar dados de veículos
      const veiculosData = await getVeiculosSupabase()
      setVeiculos(veiculosData)
      
      // Próximas trocas
      const veiculosAtivos = veiculosData.filter(v => v.status === "Ativo" && v.kmAtual !== undefined)
      
      const proximasTrocasData = [...veiculosAtivos]
        .map(v => ({
          ...v,
          diff: v.kmProxTroca - v.kmAtual
        }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 5)
        
      setProximasTrocas(proximasTrocasData)
      
      // Históricos - carregar em paralelo para melhor performance
      const historicosPromises = veiculosAtivos.map(async (v) => {
        try {
          // Usar o serviço da nova tabela trocas_oleo
          const trocasData = await getTrocasOleo(v.id)
          
          // Mapear para o formato esperado pelo componente
          return trocasData.map(item => {
            const dataProcessada = item.data_troca ? new Date(item.data_troca) : new Date()
            
            return {
              id: item.id,
              data: dataProcessada.toISOString(), // Garantir que seja uma string ISO válida
              tipo: item.tipo_servico || "Troca de Óleo", // Valor padrão se não estiver definido
              kmAtual: item.km_atual,
              kmAnterior: item.km_anterior,
              kmProxTroca: item.km_proxima_troca,
              observacao: item.observacao,
              veiculoId: item.veiculo_id
            }
          })
        } catch (err) {
          console.error(`Erro ao buscar histórico do veículo ${v.id}:`, err)
          return []
        }
      })
      
      // Aguardar todas as chamadas em paralelo
      const historicosArrays = await Promise.all(historicosPromises)
      const historicos = historicosArrays.flat()
      
      // Veículos em atraso - MOVIDO PARA DEPOIS DA INICIALIZAÇÃO DE HISTORICOS
      const atrasados = veiculosAtivos
        .filter(v => {
          // Verificar se o veículo tem registros de troca de óleo
          const temTrocaRegistrada = historicos.some(h => 
            h.veiculoId === v.id && isTrocaOleo(h.tipo)
          );
          
          // Só considerar em atraso se tiver pelo menos uma troca registrada
          // e se a quilometragem atual ultrapassou a próxima troca
          return temTrocaRegistrada && ((v.kmProxTroca - v.kmAtual) <= 0);
        })
        .map(v => ({
          ...v,
          diff: v.kmProxTroca - v.kmAtual
        }))
        .sort((a, b) => (a.kmAtual - a.kmProxTroca) - (b.kmAtual - b.kmProxTroca))
      
      setEmAtraso(atrasados)
      
      // Últimas trocas
      const ultimasTrocasData = historicos
        .filter(h => isTrocaOleo(h.tipo))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5)
      
      setUltimasTrocas(ultimasTrocasData)
      
      // Trocas por mês - últimos 6 meses, incluindo meses sem trocas
      const trocas = historicos.filter(h => isTrocaOleo(h.tipo))
      
      // Armazenar todas as trocas para navegação
      setTodasTrocas(trocas)
      
      // Calcular trocas por mês inicial (sem offset)
      const trocasPorMesData = calcularTrocasPorMes(trocas, 0)
      setTrocasPorMes(trocasPorMesData)
      
      // Carregar produtos, saídas e entradas em paralelo
      const [produtosData, saidasData, entradasData] = await Promise.all([
        getProdutosSupabase(),
        getSaidasSupabase().catch(() => []),
        getEntradasSupabase().catch(() => [])
      ])
      
      // Produtos com baixo estoque
      const baixoEstoque = produtosData
        .filter(p => p.estoque <= 5) // Consideramos produtos com estoque <=5 como baixo estoque
        .map(p => ({
          id: p.id,
          nome: p.descricao,
          quantidade: p.estoque,
          unidade: p.unidade,
          estoqueMinimo: 10 // Estoque mínimo padrão, pode ser ajustado conforme necessário
        }))
        .slice(0, 5) // Limitamos a 5 produtos com estoque baixo
      
      setProdutosBaixoEstoque(baixoEstoque)
      
      // Produtos mais usados - usar dados reais das saídas
      try {
        // Criar mapa de produtos para acesso rápido
        const produtosMap = new Map(produtosData.map(p => [p.id, p]))
        
        // Agrupar saídas por produto e calcular quantidade total
        const produtosUsados: Record<string, { id: string, nome: string, quantidade: number, unidade: string }> = {}
        
        saidasData.forEach(saida => {
          // Verificar se já temos este produto no mapa
          if (produtosUsados[saida.produtoId]) {
            // Somar a quantidade
            produtosUsados[saida.produtoId].quantidade += saida.quantidade
          } else {
            // Adicionar novo produto
            const produto = produtosMap.get(saida.produtoId)
            produtosUsados[saida.produtoId] = {
              id: saida.produtoId,
              nome: saida.produtoNome,
              quantidade: saida.quantidade,
              unidade: produto?.unidade || 'un'
            }
          }
        })
        
        // Transformar o mapa em array e ordenar por quantidade (do maior para o menor)
        const produtosMaisUsadosData = Object.values(produtosUsados)
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5) // Pegar os 5 mais usados
          .map(p => ({
            id: p.id,
            nome: p.nome,
            quantidade: p.quantidade,
            unidade: p.unidade,
            estoqueMinimo: 10 // Valor fixo para estoque mínimo
          }))
        
        setProdutosMaisUsados(produtosMaisUsadosData)
      } catch (err) {
        console.error("Erro ao carregar produtos mais usados:", err)
        
        // Fallback para dados simulados em caso de erro
        const maisUsados = [...produtosData]
          .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            nome: p.descricao,
            quantidade: Math.floor(Math.random() * 20) + 5, // Quantidade usada simulada
            unidade: p.unidade,
            estoqueMinimo: 10 // Valor fixo para estoque mínimo
          }))
        
        setProdutosMaisUsados(maisUsados)
      }
      
      // Últimas saídas e entradas
      const ultimasSaidasData = saidasData
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5) // Pegar as 5 mais recentes
      
      setUltimasSaidas(ultimasSaidasData)
      
      const ultimasEntradasData = entradasData
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5) // Pegar as 5 mais recentes
      
      setUltimasEntradas(ultimasEntradasData)
      
      // Buscar veículos em dia com base na última troca de óleo
      const veiculosEmDiaList = veiculosData
        .filter(v => v.status === "Ativo" && v.kmAtual !== 0 && (v.kmProxTroca - v.kmAtual) > 500)
        .map(v => ({
          id: v.id,
          placa: v.placa,
          modelo: v.modelo,
          marca: v.marca,
          kmAtual: v.kmAtual,
          kmProxTroca: v.kmProxTroca
        }))
      setVeiculosEmDia(veiculosEmDiaList)
      
      // Após carregar veiculosData:
      const veiculosPromises = veiculosData.map(async (veiculo) => {
        const estatisticas = await getEstatisticasTrocasOleo(veiculo.id)
        return {
          ...veiculo,
          ultimaTroca: estatisticas.ultimaTroca,
          kmAtual: estatisticas.kmAtual || veiculo.kmAtual || 0,
          kmProxTroca: estatisticas.kmProxTroca || 0,
          progresso: estatisticas.progresso
        }
      })
      const veiculosComDadosList = await Promise.all(veiculosPromises)
      setVeiculosComDados(veiculosComDadosList)
      
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }

  // Função para calcular trocas por mês com offset
  const calcularTrocasPorMes = (trocas: Historico[], offset: number): TrocaPorMes[] => {
    // Obter os 6 meses baseado no offset (offset de 0 = últimos 6 meses, offset de 6 = 7-12 meses atrás)
    const meses: string[] = []
    const dataAtual = new Date()
    
    // Começar a partir do offset
    const mesInicial = 5 + offset
    const mesFinal = offset
    
    for (let i = mesInicial; i >= mesFinal; i--) {
      const data = new Date(dataAtual)
      data.setMonth(dataAtual.getMonth() - i)
      meses.push(getMonthYear(data.toISOString()))
    }
    
    // Contar trocas por mês
    const counts: Record<string, number> = {}
    trocas.forEach(t => {
      try {
        const mes = getMonthYear(t.data)
        counts[mes] = (counts[mes] || 0) + 1
      } catch (err) {
        console.error(`Erro ao processar troca:`, err, "Data:", t.data)
      }
    })
    
    // Criar array com os meses, preenchendo zeros quando não houver trocas
    return meses.map(mes => {
      const quantidade = counts[mes] || 0
      const [ano, mesNum] = mes.split('-')
      return {
        mes,
        quantidade,
        nomeMes: new Date(parseInt(ano), parseInt(mesNum) - 1)
          .toLocaleDateString('pt-BR', { month: 'short' })
          .toUpperCase()
      }
    })
  }

  // Efeito para recalcular trocasPorMes quando o offset mudar
  useEffect(() => {
    if (todasTrocas.length > 0) {
      const novasTrocasPorMes = calcularTrocasPorMes(todasTrocas, mesOffset)
      setTrocasPorMes(novasTrocasPorMes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesOffset])

  useEffect(() => {
    atualizarDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-950 p-8 rounded-xl shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
            </div>
            <p className="text-blue-100 text-base ml-14">Sistema Integrado de Gestão de Frotas</p>
          </div>
        </div>
      </div>

      <div className="w-full">
          {/* Cards de resumo para visão geral rápida */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Total de Veículos</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">{veiculos.length}</div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Total</p>
                  </div>
                  <div className="flex-1 text-center border-l border-r border-border">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {veiculos.filter(v => v.status === "Ativo").length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Ativos</p>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {veiculos.filter(v => v.status === "Inativo").length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">Inativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="group relative overflow-hidden border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={() => setTrocasAtrasoDialogOpen(true)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Trocas em Atraso</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                    {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length > 0 ? "Requer atenção urgente" : "Tudo em dia ✓"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-green-200 dark:hover:border-green-800 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Trocas este Mês</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {trocasPorMes.length > 0 
                      ? trocasPorMes[trocasPorMes.length - 1].quantidade 
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium capitalize">
                    {new Date().toLocaleDateString('pt-BR', {month: 'long'})}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Produtos em Alerta</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                    {produtosBaixoEstoque.length}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Abaixo do estoque mínimo
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
      
          {/* Seção de indicadores-chave */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Trocas Realizadas</CardTitle>
                      <CardDescription className="text-sm">Histórico mensal de trocas de óleo</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMesOffset(mesOffset + 6)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[80px] text-center">
                      {mesOffset === 0 ? 'Últimos 6 meses' : `${mesOffset}-${mesOffset + 5} meses atrás`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMesOffset(Math.max(0, mesOffset - 6))}
                      disabled={mesOffset === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-32 flex items-center justify-center">Carregando...</div>
                ) : trocasPorMes.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                ) : (
                  <div className="h-64 w-full relative p-4">
                    {/* Grade de fundo */}
                    <div className="absolute inset-0 grid grid-cols-1 grid-rows-4 w-full h-full pointer-events-none">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="w-full border-t border-gray-200 dark:border-gray-800" />
                      ))}
                    </div>
                    {/* Escala Y no lado esquerdo */}
                    <div className="absolute left-2 inset-y-0 flex flex-col justify-between text-xs text-muted-foreground pointer-events-none">
                      {[...Array(5)].map((_, i) => {
                        const maxQtd = Math.max(...trocasPorMes.map(item => item.quantidade), 1)
                        const max = maxQtd <= 2 ? 4 : maxQtd
                        const value = Math.round((max / 4) * (4 - i))
                        return (
                          <div key={i} className="h-6 flex items-center">
                            {value}
                          </div>
                        )
                      })}
                    </div>
                    {/* Gráfico de barras */}
                    <div className="absolute inset-0 pl-8 pr-4 pt-4 pb-8 flex items-end">
                      {(() => {
                        const maxQtd = Math.max(...trocasPorMes.map(item => item.quantidade), 1)
                        const max = maxQtd <= 2 ? 4 : maxQtd
                        const barWidth = `calc(100% / ${trocasPorMes.length} - 12px)`
                        const barColors = [
                          'bg-blue-500 dark:bg-blue-400',
                          'bg-green-500 dark:bg-green-400',
                          'bg-yellow-400 dark:bg-yellow-300',
                          'bg-red-500 dark:bg-red-400',
                          'bg-purple-500 dark:bg-purple-400',
                          'bg-gray-400 dark:bg-gray-500',
                        ];
                        const maxBarHeight = 180; // px
                        return trocasPorMes.map((item, index) => {
                          const alturaPx = item.quantidade > 0 ? (item.quantidade / max) * maxBarHeight : 8;
                          const color = barColors[index % barColors.length];
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center justify-end" style={{ minWidth: 0 }}>
                              <div className="mb-2 text-sm font-bold text-blue-600 dark:text-blue-400" style={{ minHeight: 24 }}>
                                {item.quantidade > 0 ? item.quantidade : ''}
                              </div>
                              <div
                                className={`rounded-t transition-all ${color}`}
                                style={{ height: `${alturaPx}px`, width: barWidth, minWidth: 24, maxWidth: 60 }}
                              />
                            </div>
                          )
                        })
                      })()}
                    </div>
                    {/* Rótulos do eixo X (meses) */}
                    <div className="absolute inset-x-8 bottom-0 flex justify-between text-xs font-medium pointer-events-none">
                      {trocasPorMes.map((item, index) => (
                        <div key={index} className="flex-1 text-center">
                          {item.nomeMes}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Alertas e próximas trocas */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                      <Droplets className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Troca de Óleo</CardTitle>
                      <CardDescription className="text-sm">Status das trocas de óleo da frota</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="em-dia" value={abaTrocaOleo} onValueChange={setAbaTrocaOleo} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="em-dia" className="text-green-600 data-[state=active]:font-bold">Em Dia</TabsTrigger>
                    <TabsTrigger value="proximo" className="text-yellow-600 data-[state=active]:font-bold">Próximo do Prazo</TabsTrigger>
                    <TabsTrigger value="vencido" className="text-red-600 data-[state=active]:font-bold">Vencido</TabsTrigger>
                    <TabsTrigger value="nunca" className="text-gray-500 data-[state=active]:font-bold">Nunca Registrado</TabsTrigger>
                  </TabsList>

                  <TabsContent value="em-dia" className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">Placa</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Km Atual</th>
                            <th className="px-4 py-2 text-left">Km Próx. Troca</th>
                            <th className="px-4 py-2 text-left">Faltam (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca)
                            .slice(0, verMais['em-dia'] ? undefined : 10)
                            .map(v => (
                              <tr key={v.id} className="border-b">
                                <td className="px-4 py-2">{v.placa}</td>
                                <td className="px-4 py-2">{v.modelo}</td>
                                <td className="px-4 py-2">{v.marca}</td>
                                <td className="px-4 py-2">{v.kmAtual.toLocaleString()}</td>
                                <td className="px-4 py-2">{v.kmProxTroca.toLocaleString()}</td>
                                <td className="px-4 py-2">{(v.kmProxTroca - v.kmAtual).toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            onClick={() => setVerMais(prev => ({ ...prev, 'em-dia': !prev['em-dia'] }))}
                          >
                            {verMais['em-dia'] ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length === 0 && (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          Nenhum veículo em dia
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="proximo" className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">Placa</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Km Atual</th>
                            <th className="px-4 py-2 text-left">Km Próx. Troca</th>
                            <th className="px-4 py-2 text-left">Faltam (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca)
                            .slice(0, verMais['proximo'] ? undefined : 10)
                            .map(v => (
                              <tr key={v.id} className="border-b">
                                <td className="px-4 py-2">{v.placa}</td>
                                <td className="px-4 py-2">{v.modelo}</td>
                                <td className="px-4 py-2">{v.marca}</td>
                                <td className="px-4 py-2">{v.kmAtual.toLocaleString()}</td>
                                <td className="px-4 py-2">{v.kmProxTroca.toLocaleString()}</td>
                                <td className="px-4 py-2">{(v.kmProxTroca - v.kmAtual).toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            onClick={() => setVerMais(prev => ({ ...prev, 'proximo': !prev['proximo'] }))}
                          >
                            {verMais['proximo'] ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length === 0 && (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          Nenhum veículo próximo do prazo
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="vencido" className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">Placa</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Km Atual</th>
                            <th className="px-4 py-2 text-left">Km Próx. Troca</th>
                            <th className="px-4 py-2 text-left">Faltam (km)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca)
                            .slice(0, verMais['vencido'] ? undefined : 10)
                            .map(v => (
                              <tr key={v.id} className="border-b">
                                <td className="px-4 py-2">{v.placa}</td>
                                <td className="px-4 py-2">{v.modelo}</td>
                                <td className="px-4 py-2">{v.marca}</td>
                                <td className="px-4 py-2">{v.kmAtual.toLocaleString()}</td>
                                <td className="px-4 py-2">{v.kmProxTroca.toLocaleString()}</td>
                                <td className="px-4 py-2">{(v.kmProxTroca - v.kmAtual).toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            onClick={() => setVerMais(prev => ({ ...prev, 'vencido': !prev['vencido'] }))}
                          >
                            {verMais['vencido'] ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length === 0 && (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          Nenhum veículo vencido
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="nunca" className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">Placa</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Km Atual</th>
                            <th className="px-4 py-2 text-left">Km Próx. Troca</th>
                          </tr>
                        </thead>
                        <tbody>
                          {veiculosComDados.filter(v => !v.ultimaTroca)
                            .slice(0, verMais['nunca'] ? undefined : 10)
                            .map(v => (
                              <tr key={v.id} className="border-b">
                                <td className="px-4 py-2">{v.placa}</td>
                                <td className="px-4 py-2">{v.modelo}</td>
                                <td className="px-4 py-2">{v.marca}</td>
                                <td className="px-4 py-2">{v.kmAtual.toLocaleString()}</td>
                                <td className="px-4 py-2">{v.kmProxTroca.toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {veiculosComDados.filter(v => !v.ultimaTroca).length > 10 && (
                        <div className="flex justify-center mt-4">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                            onClick={() => setVerMais(prev => ({ ...prev, 'nunca': !prev['nunca'] }))}
                          >
                            {verMais['nunca'] ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                      {veiculosComDados.filter(v => !v.ultimaTroca).length === 0 && (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          Nenhum veículo sem registro
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Gráfico de status da troca de óleo */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Distribuição dos Status da Troca de Óleo</CardTitle>
                    <CardDescription className="text-sm">Quantidade de veículos em cada status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const emDia = veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length
                  const proximo = veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length
                  const vencido = veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length
                  const nunca = veiculosComDados.filter(v => !v.ultimaTroca).length
                  const total = emDia + proximo + vencido + nunca || 1
                  const data = [
                    { label: 'Em Dia', value: emDia, color: 'bg-green-500' },
                    { label: 'Próximo', value: proximo, color: 'bg-yellow-400' },
                    { label: 'Vencido', value: vencido, color: 'bg-red-500' },
                    { label: 'Nunca', value: nunca, color: 'bg-gray-400' },
                  ]
                  return (
                    <div className="w-full flex flex-col items-center">
                      <div className="flex w-full max-w-xl h-40 items-end gap-4">
                        {data.map((d, i) => (
                          <div key={d.label} className="flex-1 flex flex-col items-center">
                            <div className={`w-10 ${d.color} rounded-t transition-all`} style={{ height: `${Math.round((d.value / total) * 120)}px` }} />
                            <span className={
                              d.label === 'Em Dia' ? 'mt-2 font-medium text-sm text-green-600 text-center' :
                              d.label === 'Próximo' ? 'mt-2 font-medium text-sm text-yellow-500 text-center' :
                              d.label === 'Vencido' ? 'mt-2 font-medium text-sm text-red-600 text-center' :
                              d.label === 'Nunca' ? 'mt-2 font-medium text-sm text-gray-500 text-center' :
                              'mt-2 font-medium text-sm text-center'
                            }>{d.value}</span>
                            <span className="text-xs text-muted-foreground text-center">{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
      </div>

      {/* Diálogo de Trocas em Atraso */}
      <Dialog open={trocasAtrasoDialogOpen} onOpenChange={setTrocasAtrasoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trocas de Óleo em Atraso</DialogTitle>
            <DialogDescription>
              Lista de veículos que estão com a troca de óleo em atraso
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">Nenhum veículo com troca em atraso!</p>
                <p className="text-sm">Todos os veículos estão em dia com suas trocas de óleo.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-right">Km Atual</TableHead>
                    <TableHead className="text-right">Km Próx. Troca</TableHead>
                    <TableHead className="text-right">Atraso (km)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {veiculosComDados
                    .filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca)
                    .sort((a, b) => (a.kmAtual - a.kmProxTroca) - (b.kmAtual - b.kmProxTroca))
                    .map((veiculo) => {
                      const atraso = veiculo.kmAtual - veiculo.kmProxTroca
                      return (
                        <TableRow key={veiculo.id} className="hover:bg-red-50 dark:hover:bg-red-900/10">
                          <TableCell className="font-medium">{veiculo.placa}</TableCell>
                          <TableCell>{veiculo.modelo}</TableCell>
                          <TableCell>{veiculo.marca}</TableCell>
                          <TableCell className="text-right">{veiculo.kmAtual.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{veiculo.kmProxTroca.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                            {atraso.toLocaleString()} km
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
