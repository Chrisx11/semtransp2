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
import { CalendarIcon, Car, Clock, BarChart3, Package, Droplets, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react"

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
  const [activeTab, setActiveTab] = useState("resumo")
  const [veiculosEmDia, setVeiculosEmDia] = useState<any[]>([])
  const [veiculosComDados, setVeiculosComDados] = useState<any[]>([])
  const [abaTrocaOleo, setAbaTrocaOleo] = useState("em-dia")
  const [verMais, setVerMais] = useState({
    'em-dia': false,
    'proximo': false,
    'vencido': false,
    'nunca': false
  })

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
      
      // Históricos
      let historicos: Historico[] = []
      for (const v of veiculosAtivos) {
        try {
          // Usar o serviço da nova tabela trocas_oleo
          const trocasData = await getTrocasOleo(v.id)
          console.log(`Trocas encontradas para veículo ${v.placa}:`, trocasData)
          
          // Mapear para o formato esperado pelo componente
          const historicoFormatado = trocasData.map(item => {
            const dataProcessada = item.data_troca ? new Date(item.data_troca) : new Date()
            console.log(`Processando troca de ID ${item.id}, data original: ${item.data_troca}, data processada: ${dataProcessada.toISOString()}`)
            
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
          
          console.log(`Histórico formatado para veículo ${v.placa}:`, historicoFormatado)
          historicos = historicos.concat(historicoFormatado)
        } catch (err) {
          console.error(`Erro ao buscar histórico do veículo ${v.id}:`, err)
        }
      }
      
      // Após o processamento de todos os veículos, vamos verificar o total
      console.log(`Total de registros históricos: ${historicos.length}`)
      
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
      
      console.log("Últimas trocas filtradas:", ultimasTrocasData)
      
      setUltimasTrocas(ultimasTrocasData)
      
      // Trocas por mês - últimos 6 meses, incluindo meses sem trocas
      const trocas = historicos.filter(h => isTrocaOleo(h.tipo))
      
      console.log("Todos os históricos:", historicos)
      console.log("Trocas de óleo filtradas:", trocas)
      
      // Obter os últimos 6 meses (incluindo o mês atual)
      const ultimosMeses: string[] = []
      const dataAtual = new Date()
      
      for (let i = 5; i >= 0; i--) {
        const data = new Date(dataAtual)
        data.setMonth(dataAtual.getMonth() - i)
        ultimosMeses.push(getMonthYear(data.toISOString()))
      }
      
      console.log("Últimos 6 meses:", ultimosMeses)
      
      // Contar trocas por mês
      const counts: Record<string, number> = {}
      trocas.forEach(t => {
        try {
          const mes = getMonthYear(t.data)
          console.log(`Processando troca: ${t.id}, data: ${t.data}, mês calculado: ${mes}`)
          counts[mes] = (counts[mes] || 0) + 1
        } catch (err) {
          console.error(`Erro ao processar troca ${t.id}:`, err, "Data:", t.data)
        }
      })
      
      console.log("Contagem por mês:", counts)
      
      // Criar array com todos os últimos 6 meses, preenchendo zeros quando não houver trocas
      const trocasPorMesData = ultimosMeses.map(mes => {
        const quantidade = counts[mes] || 0
        console.log(`Mês ${mes}: ${quantidade} trocas`)
        return {
          mes,
          quantidade,
          nomeMes: new Date(parseInt(mes.split('-')[0]), parseInt(mes.split('-')[1]) - 1)
            .toLocaleDateString('pt-BR', { month: 'short' })
            .toUpperCase()
        }
      })
      
      setTrocasPorMes(trocasPorMesData)
      
      // Simulação de produtos com baixo estoque
      const produtosData = await getProdutosSupabase()
      
      // Agora usamos dados reais do Supabase
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
        const saidasData = await getSaidasSupabase()
        
        // Agrupar saídas por produto e calcular quantidade total
        const produtosUsados: Record<string, { id: string, nome: string, quantidade: number, unidade: string }> = {}
        
        saidasData.forEach(saida => {
          // Verificar se já temos este produto no mapa
          if (produtosUsados[saida.produtoId]) {
            // Somar a quantidade
            produtosUsados[saida.produtoId].quantidade += saida.quantidade
          } else {
            // Adicionar novo produto
            produtosUsados[saida.produtoId] = {
              id: saida.produtoId,
              nome: saida.produtoNome,
              quantidade: saida.quantidade,
              unidade: produtosData.find(p => p.id === saida.produtoId)?.unidade || 'un'
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
      
      // Carregar dados de saídas e entradas
      try {
        // Buscar últimas saídas
        const saidasData = await getSaidasSupabase()
        const ultimasSaidasData = saidasData
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
          .slice(0, 5) // Pegar as 5 mais recentes
        
        setUltimasSaidas(ultimasSaidasData)
        
        // Buscar últimas entradas
        const entradasData = await getEntradasSupabase()
        const ultimasEntradasData = entradasData
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
          .slice(0, 5) // Pegar as 5 mais recentes
        
        setUltimasEntradas(ultimasEntradasData)
      } catch (err) {
        console.error("Erro ao carregar movimentações de produtos:", err)
        // Definir arrays vazios em caso de erro
        setUltimasSaidas([])
        setUltimasEntradas([])
      }
      
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

  useEffect(() => {
    atualizarDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Sistema Integrado de Gestão de Frotas</p>
        </div>
        <Button 
          onClick={atualizarDashboard}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Atualizando..." : "Atualizar Dados"}
        </Button>
      </div>

      <Tabs defaultValue="resumo" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full justify-center gap-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="veiculos">Veículos</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-6">
          {/* Cards de resumo para visão geral rápida */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_24px_4px_rgba(59,130,246,0.25)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{veiculos.length}</div>
                <p className="text-xs text-muted-foreground">
                  {veiculos.filter(v => v.status === "Ativo").length} ativos
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_24px_4px_rgba(59,130,246,0.25)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trocas em Atraso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length}</div>
                <p className="text-xs text-muted-foreground">
                  {veiculosComDados.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length > 0 ? "Requer atenção" : "Tudo em dia"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_24px_4px_rgba(59,130,246,0.25)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Trocas este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trocasPorMes.length > 0 
                    ? trocasPorMes[trocasPorMes.length - 1].quantidade 
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR', {month: 'long'})}
                </p>
              </CardContent>
            </Card>
            
            <Card className="transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_24px_4px_rgba(59,130,246,0.25)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Produtos em Alerta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">{produtosBaixoEstoque.length}</div>
                <p className="text-xs text-muted-foreground">
                  Abaixo do estoque mínimo
                </p>
              </CardContent>
            </Card>
          </div>
      
          {/* Seção de indicadores-chave */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Trocas Realizadas</CardTitle>
                <CardDescription>Histórico mensal de trocas de óleo</CardDescription>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Troca de Óleo</CardTitle>
                    <CardDescription>Status das trocas de óleo da frota</CardDescription>
                  </div>
                  <Droplets className="h-6 w-6 text-muted-foreground" />
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
            <Card>
              <CardHeader>
                <CardTitle>Distribuição dos Status da Troca de Óleo</CardTitle>
                <CardDescription>Quantidade de veículos em cada status</CardDescription>
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
        </TabsContent>
        
        <TabsContent value="veiculos" className="mt-6">
          <Card className="transition-transform duration-200 hover:shadow-[0_0_24px_4px_rgba(59,130,246,0.25)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Status dos Veículos</CardTitle>
                  <CardDescription>Próximas trocas e situação atual</CardDescription>
                </div>
                <Car className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 flex items-center justify-center">Carregando...</div>
              ) : proximasTrocas.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  Nenhum veículo disponível
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 text-left font-medium">Placa</th>
                        <th className="pb-3 text-left font-medium">Modelo</th>
                        <th className="pb-3 text-right font-medium">Km Atual</th>
                        <th className="pb-3 text-right font-medium">Próx. Troca</th>
                        <th className="pb-3 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {proximasTrocas.map((veiculo) => {
                        const diff = veiculo.kmProxTroca - veiculo.kmAtual
                        let status: "default" | "destructive" | "outline" | "secondary" = "default"
                        let statusText = `Faltam ${diff.toLocaleString()} km`
                        
                        // Verificar se o veículo tem trocas de óleo registradas
                        const temTrocaRegistrada = ultimasTrocas.some(troca => troca.veiculoId === veiculo.id)
                        
                        if (!temTrocaRegistrada) {
                          status = "outline"
                          statusText = "Sem registros"
                        } else if (diff <= 0) {
                          status = "destructive"
                          statusText = "Atrasado"
                        } else if (diff < 500) {
                          status = "secondary"
                          statusText = "Próximo"
                        }
                        
                        return (
                          <tr key={veiculo.id} className="py-3">
                            <td className="py-3 font-medium">{veiculo.placa}</td>
                            <td className="py-3">{veiculo.marca} {veiculo.modelo}</td>
                            <td className="py-3 text-right">{veiculo.kmAtual.toLocaleString()}</td>
                            <td className="py-3 text-right">{veiculo.kmProxTroca.toLocaleString()}</td>
                            <td className="py-3 text-right">
                              <Badge variant={status}>
                                {statusText}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/dashboard/veiculos">
                  Gerenciar Veículos <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="produtos" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="transition-transform duration-200 hover:shadow-[0_0_24px_4px_rgba(59,130,246,0.25)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Produtos em Baixo Estoque</CardTitle>
                    <CardDescription>Itens abaixo do estoque mínimo</CardDescription>
                  </div>
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">Carregando...</div>
                ) : produtosBaixoEstoque.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                    <p>Todos os produtos com estoque adequado!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {produtosBaixoEstoque.map((produto) => {
                      const percent = (produto.quantidade / produto.estoqueMinimo) * 100
                      return (
                        <div key={produto.id} className="space-y-2">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{produto.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                Estoque mínimo: {produto.estoqueMinimo} {produto.unidade}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{produto.quantidade} {produto.unidade}</div>
                              <div className="text-sm text-red-500">
                                {Math.max(0, produto.estoqueMinimo - produto.quantidade)} abaixo do mínimo
                              </div>
                            </div>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/dashboard/produtos">
                    Gerenciar Produtos <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="transition-transform duration-200 hover:shadow-[0_0_24px_4px_rgba(59,130,246,0.25)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Movimentação de Produtos</CardTitle>
                    <CardDescription>Entradas e saídas recentes</CardDescription>
                  </div>
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">Carregando...</div>
                ) : (
                  <div className="h-64 overflow-y-auto space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Últimas Saídas</h3>
                      {ultimasSaidas && ultimasSaidas.length > 0 ? (
                        <div className="space-y-2">
                          {ultimasSaidas.map((saida) => (
                            <div key={saida.id} className="border-l-4 border-blue-500 pl-3 py-1">
                              <div className="flex justify-between">
                                <span className="font-medium">{saida.produtoNome}</span>
                                <span className="text-sm text-red-500">-{saida.quantidade}</span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{saida.veiculoPlaca}</span>
                                <span>{formatarData(saida.data)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Nenhuma saída registrada recentemente</div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Últimas Entradas</h3>
                      {ultimasEntradas && ultimasEntradas.length > 0 ? (
                        <div className="space-y-2">
                          {ultimasEntradas.map((entrada) => (
                            <div key={entrada.id} className="border-l-4 border-green-500 pl-3 py-1">
                              <div className="flex justify-between">
                                <span className="font-medium">{entrada.produtoDescricao}</span>
                                <span className="text-sm text-green-500">+{entrada.quantidade}</span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{entrada.responsavelNome}</span>
                                <span>{formatarData(entrada.data)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Nenhuma entrada registrada recentemente</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/dashboard/movimento/saidas">
                    Ver Movimentações <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
