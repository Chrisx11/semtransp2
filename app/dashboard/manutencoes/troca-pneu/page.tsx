"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SelecionarProdutoDialog } from "@/components/selecionar-produto-dialog"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { type Produto } from "@/services/produto-service"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { supabase } from "@/lib/supabase"
import { Search, Plus, Disc, Car, Save, RefreshCw, Loader2, FileDown, AlertCircle, CheckCircle2, MoreVertical, Eye, ChevronDown, ChevronUp, Gauge, Wrench, Info, Sparkles, X, Pencil, Trash2, History, Calendar } from "lucide-react"
import { useIsMobile } from "@/components/ui/use-mobile"
import { cn } from "@/lib/utils"

// Importar jspdf e autotable
import jsPDF from 'jspdf'
// @ts-ignore
import autoTable from 'jspdf-autotable'

// Tipos para o Chart.js
type ChartType = any;

interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  kmAtual?: number
}

interface TrocaPneu {
  id: string
  veiculo_id: string
  data_troca: string
  km: number
  tipo_pneu_id: string
  tipo_pneu?: {
    id: string
    marca: string
    modelo: string
    medida: string
    ativo: boolean
  }
  posicoes: string[]
  observacao?: string
  rodizio?: boolean
  alinhamento?: boolean
  balanceamento?: boolean
  // Novos campos para controle de períodos
  periodo_rodizio?: number // Período em km para rodízio
  periodo_alinhamento?: number // Período em km para alinhamento
  periodo_balanceamento?: number // Período em km para balanceamento
}

// Interface para informações de progresso de manutenção
interface ProgressoManutencao {
  rodizio: {
    progresso: number // 0-100
    kmRestante: number
    kmTotal: number
    ultimaManutencao?: TrocaPneu
    proximaManutencao: number
  }
  alinhamento: {
    progresso: number
    kmRestante: number
    kmTotal: number
    ultimaManutencao?: TrocaPneu
    proximaManutencao: number
  }
  balanceamento: {
    progresso: number
    kmRestante: number
    kmTotal: number
    ultimaManutencao?: TrocaPneu
    proximaManutencao: number
  }
}

interface TipoPneu {
  id: string
  marca: string
  modelo: string
  medida: string
  ativo: boolean
}

export default function TrocaPneuPage() {
  // Estados para veículos e pneus
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [veiculosFiltrados, setVeiculosFiltrados] = useState<Veiculo[]>([])
  const [tiposPneu, setTiposPneu] = useState<TipoPneu[]>([])
  const [trocasPneu, setTrocasPneu] = useState<TrocaPneu[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estado para loading
  const [loading, setLoading] = useState(true)
  const [geradorPdfLoading, setGeradorPdfLoading] = useState(false)
  
  // Estados para gerenciar modais
  const [dialogTrocaPneuOpen, setDialogTrocaPneuOpen] = useState(false)
  const [dialogTipoPneuOpen, setDialogTipoPneuOpen] = useState(false)
  const [dialogHistoricoOpen, setDialogHistoricoOpen] = useState(false)
  const [dialogComparacaoOpen, setDialogComparacaoOpen] = useState(false)
  const [dialogVisualizarOpen, setDialogVisualizarOpen] = useState(false)
  
  // Estado para troca sendo editada
  const [trocaEditando, setTrocaEditando] = useState<TrocaPneu | null>(null)
  
  // Estado para exclusão de troca
  const [trocaExcluindo, setTrocaExcluindo] = useState<TrocaPneu | null>(null)
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false)
  
  // Estado para veículo selecionado para troca
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null)
  
  // Referência para o elemento do gráfico
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)
  
  // Estado para formulário de troca de pneu
  const [formTrocaPneu, setFormTrocaPneu] = useState({
    tipo_pneu_id: "",
    tipo_pneu_nome: "", // Nome do produto selecionado do estoque
    km: "",
    observacao: "",
    posicoes: [] as string[],
    rodizio: false,
    alinhamento: false,
    balanceamento: false,
    // Campos para períodos (valores padrão em km)
    periodo_rodizio: "10000", // 10.000 km padrão para rodízio
    periodo_alinhamento: "10000", // 10.000 km padrão para alinhamento
    periodo_balanceamento: "10000" // 10.000 km padrão para balanceamento
  })
  
  // Estado para controlar diálogo de seleção de produto
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false)
  
  // Estado para armazenar progresso de manutenção por veículo
  const [progressoPorVeiculo, setProgressoPorVeiculo] = useState<Record<string, ProgressoManutencao>>({})
  
  // Estado para formulário de tipo de pneu
  const [formTipoPneu, setFormTipoPneu] = useState({
    id: "",
    marca: "",
    modelo: "",
    medida: "",
    ativo: true
  })
  
  // Estado para histórico do veículo
  const [historicoVeiculo, setHistoricoVeiculo] = useState<TrocaPneu[]>([])
  
  // Estado para observações do veículo
  const [observacoesVeiculo, setObservacoesVeiculo] = useState<Array<{
    id: string
    veiculo_id: string
    data_observacao: string
    observacao: string
  }>>([])
  
  // Estado para veículo selecionado para visualização
  const [veiculoVisualizacao, setVeiculoVisualizacao] = useState<Veiculo | null>(null)
  
  // Estado para controlar qual card está expandido
  const [veiculoExpandido, setVeiculoExpandido] = useState<string | null>(null)
  
  // Adicionar estado para o modal de comparação
  const [veiculosComparacao, setVeiculosComparacao] = useState<{
    veiculo1: string;
    veiculo2: string;
  }>({
    veiculo1: "",
    veiculo2: ""
  })
  const [resultadoComparacao, setResultadoComparacao] = useState<{
    veiculo1: {
      placa: string;
      modelo: string;
      kmMediaPorTroca: number;
      totalTrocas: number;
      kmPercorrido: number;
      comServicos: boolean;
    } | null;
    veiculo2: {
      placa: string;
      modelo: string;
      kmMediaPorTroca: number;
      totalTrocas: number;
      kmPercorrido: number;
      comServicos: boolean;
    } | null;
    diferencaPercentual: number;
    veiculoMelhor: string | null;
  } | null>(null)
  const [carregandoComparacao, setCarregandoComparacao] = useState(false)
  
  const { toast } = useToast()
  
  // Add an additional dialog state for the vehicle selection modal
  const [dialogVeiculoOpen, setDialogVeiculoOpen] = useState(false)
  const [veiculoSelectionTarget, setVeiculoSelectionTarget] = useState<'veiculo1' | 'veiculo2' | null>(null)
  const [veiculoSearchTerm, setVeiculoSearchTerm] = useState("")
  const [veiculosFiltradosSelecao, setVeiculosFiltradosSelecao] = useState<Veiculo[]>([])
  
  // Função para carregar todas as trocas de pneu
  async function carregarTrocasPneu() {
    try {
      const { data, error } = await supabase
        .from("trocas_pneu")
        .select(`
          *,
          tipo_pneu:tipos_pneu(*)
        `)
        .order("data_troca", { ascending: false })
      
      if (error) {
        // Se a tabela não existir, não é erro crítico
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setTrocasPneu([])
          return
        }
        throw error
      }
      
      // Garantir que os períodos sejam números (não strings) e normalizar campos booleanos
      if (data) {
        data.forEach((troca: any) => {
          // Normalizar períodos para números
          if (troca.periodo_rodizio !== null && troca.periodo_rodizio !== undefined) {
            troca.periodo_rodizio = Number(troca.periodo_rodizio)
          }
          if (troca.periodo_alinhamento !== null && troca.periodo_alinhamento !== undefined) {
            troca.periodo_alinhamento = Number(troca.periodo_alinhamento)
          }
          if (troca.periodo_balanceamento !== null && troca.periodo_balanceamento !== undefined) {
            troca.periodo_balanceamento = Number(troca.periodo_balanceamento)
          }
          
          // Normalizar campos booleanos (garantir que sejam booleanos, não strings)
          if (troca.alinhamento !== null && troca.alinhamento !== undefined) {
            troca.alinhamento = typeof troca.alinhamento === 'boolean' 
              ? troca.alinhamento 
              : troca.alinhamento === true || troca.alinhamento === 'true' || troca.alinhamento === 'TRUE' || troca.alinhamento === 1
          } else {
            troca.alinhamento = false
          }
          
          if (troca.balanceamento !== null && troca.balanceamento !== undefined) {
            troca.balanceamento = typeof troca.balanceamento === 'boolean' 
              ? troca.balanceamento 
              : troca.balanceamento === true || troca.balanceamento === 'true' || troca.balanceamento === 'TRUE' || troca.balanceamento === 1
          } else {
            troca.balanceamento = false
          }
          
          // Normalizar km para número
          if (troca.km !== null && troca.km !== undefined) {
            troca.km = typeof troca.km === 'string' ? Number(troca.km) : Number(troca.km)
            if (isNaN(troca.km)) {
              console.warn(`KM inválido na troca ${troca.id}:`, troca.km)
              troca.km = 0
            }
          } else {
            troca.km = 0
          }
          
          // Normalizar posicoes (garantir que seja array)
          if (!Array.isArray(troca.posicoes)) {
            troca.posicoes = troca.posicoes ? [troca.posicoes] : []
          }
        })
      }
      
      setTrocasPneu(data || [])
      // Calcular progresso após carregar trocas
      calcularProgressoTodosVeiculos(data || [])
    } catch (error) {
      console.error("Erro ao carregar trocas de pneu:", error)
      setTrocasPneu([])
    }
  }
  
  // Função para calcular progresso de manutenção de um veículo
  function calcularProgresso(veiculo: Veiculo, trocas: TrocaPneu[]): ProgressoManutencao {
    // Usar kmAtual do veículo, mas garantir que seja um número válido
    const kmAtual = (veiculo.kmAtual !== null && veiculo.kmAtual !== undefined) 
      ? Number(veiculo.kmAtual) 
      : 0
    const trocasDoVeiculo = trocas
      .filter(t => t.veiculo_id === veiculo.id)
      .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())
    
    // Buscar última troca com rodízio (quando há troca de posição)
    const ultimaTrocaRodizio = trocasDoVeiculo.find(t => t.posicoes && t.posicoes.length > 0)
    if (!ultimaTrocaRodizio) {
      // Sem histórico de rodízio
      return {
        rodizio: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 },
        alinhamento: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 },
        balanceamento: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 }
      }
    }
    
    const periodoRodizio = ultimaTrocaRodizio.periodo_rodizio || 10000
    const kmRodizio = ultimaTrocaRodizio.km || 0
    const kmPercorridoRodizio = Math.max(0, kmAtual - kmRodizio)
    const kmRestanteRodizio = Math.max(0, periodoRodizio - kmPercorridoRodizio)
    const progressoRodizio = periodoRodizio > 0 ? Math.min(100, Math.max(0, (kmPercorridoRodizio / periodoRodizio) * 100)) : 0
    
    // Buscar última manutenção com alinhamento
    const ultimaAlinhamento = trocasDoVeiculo.find(t => t.alinhamento)
    const periodoAlinhamento = ultimaAlinhamento?.periodo_alinhamento || 10000
    const kmAlinhamento = ultimaAlinhamento?.km || 0
    const kmPercorridoAlinhamento = Math.max(0, kmAtual - kmAlinhamento)
    const kmRestanteAlinhamento = ultimaAlinhamento ? Math.max(0, periodoAlinhamento - kmPercorridoAlinhamento) : 0
    const progressoAlinhamento = ultimaAlinhamento && periodoAlinhamento > 0 ? Math.min(100, Math.max(0, (kmPercorridoAlinhamento / periodoAlinhamento) * 100)) : 0
    
    // Buscar última manutenção com balanceamento
    const ultimaBalanceamento = trocasDoVeiculo.find(t => t.balanceamento)
    const periodoBalanceamento = ultimaBalanceamento?.periodo_balanceamento || 10000
    const kmBalanceamento = ultimaBalanceamento?.km || 0
    const kmPercorridoBalanceamento = Math.max(0, kmAtual - kmBalanceamento)
    const kmRestanteBalanceamento = ultimaBalanceamento ? Math.max(0, periodoBalanceamento - kmPercorridoBalanceamento) : 0
    const progressoBalanceamento = ultimaBalanceamento && periodoBalanceamento > 0 ? Math.min(100, Math.max(0, (kmPercorridoBalanceamento / periodoBalanceamento) * 100)) : 0
    
    return {
      rodizio: {
        progresso: progressoRodizio,
        kmRestante: kmRestanteRodizio,
        kmTotal: periodoRodizio,
        ultimaManutencao: ultimaTrocaRodizio,
        proximaManutencao: kmRodizio + periodoRodizio
      },
      alinhamento: {
        progresso: progressoAlinhamento,
        kmRestante: kmRestanteAlinhamento,
        kmTotal: periodoAlinhamento,
        ultimaManutencao: ultimaAlinhamento,
        proximaManutencao: ultimaAlinhamento ? kmAlinhamento + periodoAlinhamento : 0
      },
      balanceamento: {
        progresso: progressoBalanceamento,
        kmRestante: kmRestanteBalanceamento,
        kmTotal: periodoBalanceamento,
        ultimaManutencao: ultimaBalanceamento,
        proximaManutencao: ultimaBalanceamento ? kmBalanceamento + periodoBalanceamento : 0
      }
    }
  }
  
  // Função para calcular progresso de todos os veículos
  function calcularProgressoTodosVeiculos(trocas: TrocaPneu[]) {
    // Usar o estado atual de veículos para garantir que temos os dados mais recentes
    setVeiculos(veiculosAtual => {
      const progresso: Record<string, ProgressoManutencao> = {}
      veiculosAtual.forEach(veiculo => {
        progresso[veiculo.id] = calcularProgresso(veiculo, trocas)
      })
      setProgressoPorVeiculo(progresso)
      return veiculosAtual // Retornar o mesmo estado para não alterar
    })
  }
  
  // Versão alternativa que usa o estado atual diretamente
  function calcularProgressoTodosVeiculosAtualizado(trocas?: TrocaPneu[], veiculosAtual?: Veiculo[]) {
    // Usar estados atuais se não forem fornecidos como parâmetros
    const trocasParaCalcular = trocas || trocasPneu
    const veiculosParaCalcular = veiculosAtual || veiculos
    
    // Verificar se temos dados válidos
    if (!veiculosParaCalcular || veiculosParaCalcular.length === 0) {
      console.warn("calcularProgressoTodosVeiculosAtualizado: Nenhum veículo disponível")
      return
    }
    
    if (!trocasParaCalcular || !Array.isArray(trocasParaCalcular)) {
      console.warn("calcularProgressoTodosVeiculosAtualizado: Trocas inválidas")
      return
    }
    
    const progresso: Record<string, ProgressoManutencao> = {}
    veiculosParaCalcular.forEach(veiculo => {
      const progressoCalculado = calcularProgresso(veiculo, trocasParaCalcular)
      progresso[veiculo.id] = progressoCalculado
      
      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development' && veiculo.placa === 'TESTE001') {
        console.log("📊 Progresso calculado para TESTE001:", {
          placa: veiculo.placa,
          kmAtual: veiculo.kmAtual,
          progressoRodizio: progressoCalculado.rodizio.progresso,
          kmPercorrido: progressoCalculado.rodizio.ultimaManutencao 
            ? (veiculo.kmAtual || 0) - (progressoCalculado.rodizio.ultimaManutencao.km || 0)
            : 0,
          kmRestante: progressoCalculado.rodizio.kmRestante,
        })
      }
    })
    setProgressoPorVeiculo(progresso)
  }
  
  // Carregar dados iniciais
  useEffect(() => {
    carregarVeiculos()
    carregarTiposPneu()
    carregarTrocasPneu()
    verificarEstruturaBancoDados()
  }, [])
  
  // Recarregar veículos quando a página ganha foco (para atualizar KM após troca de óleo)
  useEffect(() => {
    const handleFocus = () => {
      carregarVeiculos(true) // Atualização silenciosa
    }
    
    window.addEventListener('focus', handleFocus)
    
    // Recarregar também quando a janela fica visível (útil para abas)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        carregarVeiculos(true) // Atualização silenciosa
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Listener para eventos customizados de atualização de veículo
    const handleVeiculoAtualizado = (event?: CustomEvent) => {
      console.log("🚗 Evento veiculo-atualizado recebido:", event?.detail)
      // Forçar recarregamento imediato (não silencioso para garantir atualização)
      carregarVeiculos(false)
    }
    
    window.addEventListener('veiculo-atualizado', handleVeiculoAtualizado as EventListener)
    
    // Listener para eventos de storage (quando outras abas atualizam dados)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'veiculo-km-atualizado' || e.key === 'troca-oleo-registrada') {
        console.log("💾 Evento storage recebido:", e.key)
        carregarVeiculos(false) // Não silencioso para garantir atualização
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Listener customizado para mudanças no localStorage (mesma aba)
    // Isso funciona porque setItem/removeItem dispara eventos mesmo na mesma aba
    const handleLocalStorageChange = () => {
      // Verificar se houve mudança recente no localStorage
      const lastUpdate = localStorage.getItem('last-veiculo-update')
      if (lastUpdate) {
        const updateTime = parseInt(lastUpdate)
        const now = Date.now()
        // Se foi atualizado nos últimos 5 segundos, recarregar
        if (now - updateTime < 5000) {
          console.log("🔄 Detecção de atualização recente, recarregando veículos...")
          carregarVeiculos(false)
        }
      }
    }
    
    // Verificar localStorage a cada segundo
    const localStorageCheckInterval = setInterval(() => {
      handleLocalStorageChange()
    }, 1000)
    
    // Recarregar a cada 30 segundos para manter os dados atualizados
    const interval = setInterval(() => {
      carregarVeiculos(true) // Atualização silenciosa
    }, 30000)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('veiculo-atualizado', handleVeiculoAtualizado as EventListener)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
      clearInterval(localStorageCheckInterval)
    }
  }, [trocasPneu]) // Adicionar trocasPneu como dependência
  
  // Recalcular progresso quando veículos ou trocas mudarem
  useEffect(() => {
    if (veiculos.length > 0) {
      // Sempre recalcular quando veículos mudarem (incluindo quando kmAtual for atualizado)
      calcularProgressoTodosVeiculosAtualizado(trocasPneu, veiculos)
    }
  }, [veiculos, trocasPneu])
  
  // Recalcular progresso quando apenas o kmAtual de algum veículo mudar
  // Usar useMemo para criar uma string de hash dos kms
  const kmHash = useMemo(() => {
    return veiculos.map(v => `${v.id}:${v.kmAtual ?? 0}`).join(',')
  }, [veiculos])
  
  useEffect(() => {
    if (veiculos.length > 0 && kmHash) {
      // Recalcular progresso quando o hash dos kms mudar
      calcularProgressoTodosVeiculosAtualizado(trocasPneu, veiculos)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kmHash, trocasPneu.length])
  
  // Filtrar veículos quando o termo de busca mudar
  // Função para ordenar veículos: primeiro os que têm registros de troca de pneu
  const ordenarVeiculosComRegistros = (veiculosParaOrdenar: Veiculo[], trocas: TrocaPneu[] = trocasPneu) => {
    return [...veiculosParaOrdenar].sort((a, b) => {
      // Verificar se cada veículo tem registros de troca de pneu
      const aTemRegistros = trocas.some(t => t.veiculo_id === a.id)
      const bTemRegistros = trocas.some(t => t.veiculo_id === b.id)
      
      // Primeiro: ordenar por ter registros (true vem antes de false)
      if (aTemRegistros && !bTemRegistros) return -1
      if (!aTemRegistros && bTemRegistros) return 1
      
      // Se ambos têm ou não têm registros, ordenar alfabeticamente por placa
      return a.placa.localeCompare(b.placa)
    })
  }

  useEffect(() => {
    let resultados: Veiculo[]
    
    if (!searchTerm.trim()) {
      resultados = veiculos
    } else {
      const termoBusca = searchTerm.toLowerCase().trim()
      resultados = veiculos.filter(veiculo => 
        veiculo.placa.toLowerCase().includes(termoBusca) ||
        veiculo.modelo.toLowerCase().includes(termoBusca) ||
        veiculo.marca.toLowerCase().includes(termoBusca)
      )
    }
    
    // Ordenar: primeiro os que têm registros, depois os que não têm
    const veiculosOrdenados = ordenarVeiculosComRegistros(resultados)
    setVeiculosFiltrados(veiculosOrdenados)
  }, [searchTerm, veiculos, trocasPneu])
  
  // Função para carregar veículos do Supabase
  async function carregarVeiculos(silent = false) {
    // Não mostrar loading se for atualização silenciosa em background
    if (!silent) {
      setLoading(true)
    }
    
    try {
      // Buscar veículos diretamente do Supabase
      let rawData: any[] | null = null
      let error: any = null
      
      try {
        // Buscar todos os campos da tabela veiculos
        const result = await supabase
          .from("veiculos")
          .select("*")
          .order("placa")
        
        rawData = result.data
        error = result.error
      } catch (fetchError: any) {
        // Capturar erros de rede (Failed to fetch)
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          console.warn("Erro de conexão detectado, tentando novamente...")
          
          // Tentar novamente após 2 segundos
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          try {
            const retry = await supabase
              .from("veiculos")
              .select("*")
              .order("placa")
            
            if (retry.error) {
              error = retry.error
            } else {
              rawData = retry.data
              error = null
            }
          } catch (retryError) {
            error = retryError
          }
        } else {
          error = fetchError
        }
      }
      
      if (error) {
        // Se ainda houver erro após retry, lançar
        throw error
      }
      
      // Buscar o último registro de troca de óleo para cada veículo
      // Para obter o km_atual mais recente de cada veículo
      let kmAtualPorVeiculo: Record<string, number | null> = {}
      
      try {
        // Buscar todos os registros de trocas_oleo, ordenados por data
        const { data: trocasOleoData, error: trocasOleoError } = await supabase
          .from("trocas_oleo")
          .select("veiculo_id, km_atual, data_troca")
          .order("data_troca", { ascending: false })
        
        if (!trocasOleoError && trocasOleoData) {
          // Agrupar por veiculo_id e pegar o primeiro (mais recente) de cada
          trocasOleoData.forEach((troca: any) => {
            const veiculoId = troca.veiculo_id
            // Se ainda não temos um registro para este veículo, ou se este é mais recente
            if (!kmAtualPorVeiculo.hasOwnProperty(veiculoId)) {
              const kmAtual = troca.km_atual
              // Converter para número se necessário
              if (kmAtual !== null && kmAtual !== undefined) {
                const kmNum = typeof kmAtual === 'string' ? Number(kmAtual) : Number(kmAtual)
                kmAtualPorVeiculo[veiculoId] = isNaN(kmNum) ? null : kmNum
              } else {
                kmAtualPorVeiculo[veiculoId] = null
              }
            }
          })
        } else if (trocasOleoError) {
          console.warn("Erro ao buscar trocas de óleo para KM atual:", trocasOleoError)
        }
      } catch (trocasOleoError) {
        console.warn("Erro ao buscar trocas de óleo para KM atual:", trocasOleoError)
      }
      
      // Mapear os dados para garantir que kmAtual está no formato correto
      // Usar o km_atual da tabela trocas_oleo (último registro) em vez do campo da tabela veiculos
      const data = (rawData || []).map((veiculo: any) => {
        const veiculoId = veiculo.id
        
        // Buscar o km_atual da tabela trocas_oleo (último registro)
        const kmAtualFinal = kmAtualPorVeiculo[veiculoId] ?? null
        
        const kmProxTrocaValue = veiculo.kmProxTroca ?? veiculo.km_prox_troca ?? veiculo["kmProxTroca"] ?? veiculo["km_prox_troca"]
        const periodoTrocaOleoValue = veiculo.periodoTrocaOleo ?? veiculo.periodo_troca_oleo ?? veiculo["periodoTrocaOleo"] ?? veiculo["periodo_troca_oleo"]
        
        return {
          ...veiculo,
          // Usar km_atual da tabela trocas_oleo (último registro)
          kmAtual: kmAtualFinal,
          kmProxTroca: kmProxTrocaValue !== null && kmProxTrocaValue !== undefined 
            ? (typeof kmProxTrocaValue === 'string' ? Number(kmProxTrocaValue) : Number(kmProxTrocaValue))
            : null,
          periodoTrocaOleo: periodoTrocaOleoValue !== null && periodoTrocaOleoValue !== undefined 
            ? (typeof periodoTrocaOleoValue === 'string' ? Number(periodoTrocaOleoValue) : Number(periodoTrocaOleoValue))
            : null,
        }
      })
      
      // Log dos dados para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development' && data && data.length > 0) {
        console.log("🔍 KM atual carregado da tabela trocas_oleo para", Object.keys(kmAtualPorVeiculo).length, "veículos")
        
        // Log de todos os veículos com kmAtual null ou 0 para debug
        const veiculosSemKm = data.filter((v: any) => v.kmAtual === null || v.kmAtual === 0 || v.kmAtual === undefined)
        if (veiculosSemKm.length > 0) {
          console.log("🔍 Veículos sem KM atual (sem registro em trocas_oleo):", veiculosSemKm.map((v: any) => ({
            placa: v.placa,
            id: v.id,
            kmAtual: v.kmAtual,
          })))
        }
        
        const veiculoTeste = data.find((v: any) => v.placa === 'TESTE001')
        if (veiculoTeste) {
          console.log("🔍 Veículo TESTE001 encontrado:", {
            placa: veiculoTeste.placa,
            kmAtualDaTabelaTrocasOleo: veiculoTeste.kmAtual,
            kmAtualNoMapa: kmAtualPorVeiculo[veiculoTeste.id],
          })
        }
      }
      
      // Criar novos objetos para garantir que o React detecte as mudanças
      const novosVeiculos = data.map(v => ({ ...v }))
      
      // Ordenar veículos: primeiro os que têm registros de troca de pneu
      // Usar o estado atual de trocasPneu para ordenação
      const veiculosOrdenados = ordenarVeiculosComRegistros(novosVeiculos, trocasPneu)
      
      setVeiculos(veiculosOrdenados)
      setVeiculosFiltrados(veiculosOrdenados)
      
      // Recalcular progresso após carregar veículos usando os dados recém-carregados
      // Usar setTimeout para garantir que o estado foi atualizado antes de recalcular
      if (novosVeiculos && novosVeiculos.length > 0) {
        // Forçar recálculo imediato com os novos dados
        setTimeout(() => {
          calcularProgressoTodosVeiculosAtualizado(trocasPneu, novosVeiculos)
        }, 50)
      }
    } catch (error) {
      console.error("Erro ao carregar veículos:", error)
      
      // Se já temos veículos carregados, manter os dados existentes
      if (veiculos.length > 0 && silent) {
        console.warn("Mantendo dados existentes devido a erro de conexão")
        return
      }
      
      // Não mostrar toast se for apenas atualização automática em background
      if (!silent) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')
        
        toast({
          variant: "destructive",
          title: "Erro ao carregar veículos",
          description: isNetworkError 
            ? "Erro de conexão com o servidor. Verifique sua conexão com a internet e tente novamente."
            : "Não foi possível carregar a lista de veículos."
        })
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }
  
  // Função para carregar tipos de pneu do Supabase
  async function carregarTiposPneu() {
    try {
      // Tentar buscar diretamente da tabela
      const { data, error } = await supabase
        .from("tipos_pneu")
        .select("*")
        .order("marca")
      
      // Se houver erro de tabela não encontrada, tentar criar
      if (error) {
        // Verificar se é erro de tabela não encontrada (código 42P01 ou similar)
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('não existe')) {
          console.log("Tabela tipos_pneu não existe, tentando criar...")
          // Não podemos criar a tabela via API, então apenas mostramos um aviso
          console.warn("A tabela 'tipos_pneu' não existe no banco de dados. Crie-a manualmente no Supabase.")
          setTiposPneu([])
          return
        }
        throw error
      }
      
      setTiposPneu(data || [])
    } catch (error) {
      console.error("Erro ao carregar tipos de pneu:", error)
      // Se não for erro de tabela não encontrada, mostrar toast
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      if (!errorMessage.includes('does not exist') && !errorMessage.includes('não existe')) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar tipos de pneu",
          description: "Não foi possível carregar os tipos de pneu."
        })
      }
      setTiposPneu([])
    }
  }
  
  // Função para criar tabela de tipos de pneu se não existir
  async function criarTabelaTiposPneu() {
    try {
      await supabase.rpc('create_tipos_pneu_table')
    } catch (error) {
      console.error("Erro ao criar tabela tipos_pneu:", error)
      
      // Tentar criar manualmente
      const query = `
        CREATE TABLE IF NOT EXISTS tipos_pneu (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          marca TEXT NOT NULL,
          modelo TEXT NOT NULL,
          medida TEXT NOT NULL,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabase.rpc('exec_sql', { sql: query })
    }
  }
  
  // Função para verificar a estrutura do banco de dados
  async function verificarEstruturaBancoDados() {
    try {
      console.log("Verificando estrutura do banco de dados...")
      
      // Verificar se tabela tipos_pneu existe tentando fazer uma consulta simples
      const { data: tiposPneuAlt, error: tiposPneuErrorAlt } = await supabase
        .from('tipos_pneu')
        .select('id')
        .limit(1)
      
      if (tiposPneuErrorAlt) {
        const errorCode = tiposPneuErrorAlt.code
        const errorMessage = tiposPneuErrorAlt.message || ''
        
        // Verificar se é erro de tabela não encontrada
        if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('não existe')) {
          console.warn("Tabela tipos_pneu não existe no banco de dados.")
          console.warn("Para criar a tabela, execute o seguinte SQL no Supabase SQL Editor:")
          console.warn(`
            CREATE TABLE IF NOT EXISTS tipos_pneu (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              marca TEXT NOT NULL,
              modelo TEXT NOT NULL,
              medida TEXT NOT NULL,
              ativo BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
          `)
        } else {
          console.error("Erro ao verificar tabela tipos_pneu:", tiposPneuErrorAlt)
        }
      } else {
        console.log("Tabela tipos_pneu existe e está acessível")
      }
      
      // Verificar se tabela trocas_pneu existe
      const { data: trocasPneuAlt, error: trocasPneuErrorAlt } = await supabase
        .from('trocas_pneu')
        .select('id')
        .limit(1)
      
      if (trocasPneuErrorAlt) {
        const errorCode = trocasPneuErrorAlt.code
        const errorMessage = trocasPneuErrorAlt.message || ''
        
        // Verificar se é erro de tabela não encontrada
        if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('não existe')) {
          console.warn("Tabela trocas_pneu não existe no banco de dados.")
          console.warn("Para criar a tabela, execute o seguinte SQL no Supabase SQL Editor:")
          console.warn(`
            CREATE TABLE IF NOT EXISTS trocas_pneu (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              veiculo_id UUID NOT NULL REFERENCES veiculos(id),
              tipo_pneu_id UUID REFERENCES tipos_pneu(id),
              km INTEGER NOT NULL,
              data_troca TIMESTAMPTZ DEFAULT NOW(),
              posicoes TEXT[],
              alinhamento BOOLEAN DEFAULT FALSE,
              balanceamento BOOLEAN DEFAULT FALSE,
              observacao TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
          `)
        } else {
          console.error("Erro ao verificar tabela trocas_pneu:", trocasPneuErrorAlt)
        }
      } else {
        console.log("Tabela trocas_pneu existe e está acessível")
      }
    } catch (error) {
      console.error("Erro ao verificar estrutura do banco de dados:", error)
    }
  }
  
  // Função para corrigir referências entre tabelas
  async function corrigirReferenciasTiposPneu() {
    try {
      console.log("Tentando corrigir referências entre tabelas...")
      
      // Verificar se há trocas com referências inválidas
      const { data: trocasSemTipo, error: trocasError } = await supabase
        .from('trocas_pneu')
        .select(`
          id,
          tipo_pneu_id
        `)
        .limit(10)
      
      if (trocasError) {
        console.error("Erro ao buscar trocas para verificação:", trocasError)
        return
      }
      
      console.log("Trocas para verificação:", trocasSemTipo)
      
      // Para cada troca, verificar se o tipo_pneu_id existe
      for (const troca of trocasSemTipo) {
        const { data: tipoPneu, error: tipoError } = await supabase
          .from('tipos_pneu')
          .select('id')
          .eq('id', troca.tipo_pneu_id)
          .single()
        
        if (tipoError || !tipoPneu) {
          console.log(`Troca ${troca.id} tem referência inválida para tipo_pneu_id: ${troca.tipo_pneu_id}`)
          
          // Buscar um tipo de pneu válido para atualizar a referência
          const { data: tipoValido, error: tipoValidoError } = await supabase
            .from('tipos_pneu')
            .select('id')
            .eq('ativo', true)
            .limit(1)
            .single()
          
          if (tipoValidoError || !tipoValido) {
            console.error("Não foi possível encontrar um tipo de pneu válido para correção")
            continue
          }
          
          // Atualizar a referência
          const { error: updateError } = await supabase
            .from('trocas_pneu')
            .update({ tipo_pneu_id: tipoValido.id })
            .eq('id', troca.id)
          
          if (updateError) {
            console.error(`Erro ao atualizar referência da troca ${troca.id}:`, updateError)
          } else {
            console.log(`Referência da troca ${troca.id} atualizada para tipo ${tipoValido.id}`)
          }
        } else {
          console.log(`Troca ${troca.id} tem referência válida para tipo_pneu_id: ${troca.tipo_pneu_id}`)
        }
      }
      
    } catch (error) {
      console.error("Erro ao corrigir referências:", error)
    }
  }
  
  // Função para abrir modal de troca de pneu
  function abrirModalTrocaPneu(veiculo: Veiculo) {
    setVeiculoSelecionado(veiculo)
    setFormTrocaPneu({
      tipo_pneu_id: "",
      tipo_pneu_nome: "",
      km: veiculo.kmAtual?.toString() || "",
      observacao: "",
      posicoes: [],
      rodizio: false,
      alinhamento: false,
      balanceamento: false,
      periodo_rodizio: "10000",
      periodo_alinhamento: "10000",
      periodo_balanceamento: "10000"
    })
    setTrocaEditando(null) // Limpar troca em edição
    setDialogTrocaPneuOpen(true)
  }
  
  // Função para carregar dados de uma troca para edição
  function carregarTrocaParaEdicao(troca: TrocaPneu) {
    // Buscar o veículo correspondente
    const veiculo = veiculos.find(v => v.id === troca.veiculo_id)
    if (!veiculo) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Veículo não encontrado para esta troca."
      })
      return
    }
    
    setVeiculoSelecionado(veiculo)
    setTrocaEditando(troca) // Guardar a troca sendo editada
    
    // Determinar o tipo de pneu
    let tipoPneuId = ""
    let tipoPneuNome = ""
    let observacao = troca.observacao || ""
    
    if (troca.tipo_pneu_id && troca.tipo_pneu) {
      // Tipo de pneu cadastrado
      tipoPneuId = troca.tipo_pneu_id
      // Observação permanece como está (sem "Produto:")
    } else if (troca.observacao) {
      // Verificar se é produto do estoque ou texto manual
      if (troca.observacao.includes('Produto:')) {
        // É um produto do estoque
        const partes = troca.observacao.split(' - ')
        tipoPneuNome = partes[0].replace('Produto:', '').trim()
        
        // Extrair observação (remover "Produto: nome" e manter o resto)
        if (partes.length > 1) {
          observacao = partes.slice(1).join(' - ').trim()
        } else {
          observacao = ""
        }
      } else {
        // Texto escrito manualmente - manter tudo na observação
        // Não definir tipoPneuNome para manter o texto na observação
        tipoPneuNome = ""
        observacao = troca.observacao // Manter o texto completo
      }
    }
    
    // Carregar dados no formulário
    setFormTrocaPneu({
      tipo_pneu_id: tipoPneuId,
      tipo_pneu_nome: tipoPneuNome,
      km: troca.km.toString(),
      observacao: observacao,
      posicoes: Array.isArray(troca.posicoes) ? troca.posicoes : [],
      rodizio: troca.rodizio || false,
      alinhamento: troca.alinhamento || false,
      balanceamento: troca.balanceamento || false,
      periodo_rodizio: troca.periodo_rodizio?.toString() || "10000",
      periodo_alinhamento: troca.periodo_alinhamento?.toString() || "10000",
      periodo_balanceamento: troca.periodo_balanceamento?.toString() || "10000"
    })
    
    setDialogTrocaPneuOpen(true)
  }
  
  // Função para abrir modal de tipo de pneu
  function abrirModalTipoPneu(tipoPneu?: TipoPneu) {
    if (tipoPneu) {
      setFormTipoPneu({
        id: tipoPneu.id,
        marca: tipoPneu.marca,
        modelo: tipoPneu.modelo,
        medida: tipoPneu.medida,
        ativo: tipoPneu.ativo
      })
    } else {
      setFormTipoPneu({
        id: "",
        marca: "",
        modelo: "",
        medida: "",
        ativo: true
      })
    }
    setDialogTipoPneuOpen(true)
  }
  
  // Função para mostrar histórico de trocas
  // Função para abrir diálogo de visualização
  async function abrirVisualizacao(veiculo: Veiculo) {
    setVeiculoVisualizacao(veiculo)
    setDialogVisualizarOpen(true)
    
    // Buscar observações do veículo
    try {
      const { data, error } = await supabase
        .from('observacoes_veiculo')
        .select('*')
        .eq('veiculo_id', veiculo.id)
        .order('data_observacao', { ascending: false })
      
      if (error) {
        console.warn('Erro ao buscar observações:', error)
        setObservacoesVeiculo([])
      } else {
        setObservacoesVeiculo(data || [])
      }
    } catch (error) {
      console.warn('Erro ao buscar observações:', error)
      setObservacoesVeiculo([])
    }
  }
  
  async function abrirHistorico(veiculo: Veiculo) {
    setVeiculoSelecionado(veiculo)
    setLoading(true)
    
    try {
      // Tentar buscar diretamente da tabela
      const { data, error } = await supabase
        .from("trocas_pneu")
        .select(`
          *,
          tipo_pneu:tipos_pneu(*)
        `)
        .eq("veiculo_id", veiculo.id)
        .order("data_troca", { ascending: false })
        
      // Garantir que os períodos sejam números (não strings) e normalizar campos booleanos
      if (data) {
        data.forEach((troca: any) => {
          // Normalizar períodos para números
          if (troca.periodo_rodizio !== null && troca.periodo_rodizio !== undefined) {
            troca.periodo_rodizio = Number(troca.periodo_rodizio)
          }
          if (troca.periodo_alinhamento !== null && troca.periodo_alinhamento !== undefined) {
            troca.periodo_alinhamento = Number(troca.periodo_alinhamento)
          }
          if (troca.periodo_balanceamento !== null && troca.periodo_balanceamento !== undefined) {
            troca.periodo_balanceamento = Number(troca.periodo_balanceamento)
          }
          
          // Normalizar campos booleanos (garantir que sejam booleanos, não strings)
          if (troca.alinhamento !== null && troca.alinhamento !== undefined) {
            troca.alinhamento = typeof troca.alinhamento === 'boolean' 
              ? troca.alinhamento 
              : troca.alinhamento === true || troca.alinhamento === 'true' || troca.alinhamento === 'TRUE' || troca.alinhamento === 1
          } else {
            troca.alinhamento = false
          }
          
          if (troca.balanceamento !== null && troca.balanceamento !== undefined) {
            troca.balanceamento = typeof troca.balanceamento === 'boolean' 
              ? troca.balanceamento 
              : troca.balanceamento === true || troca.balanceamento === 'true' || troca.balanceamento === 'TRUE' || troca.balanceamento === 1
          } else {
            troca.balanceamento = false
          }
          
          // Normalizar km para número
          if (troca.km !== null && troca.km !== undefined) {
            troca.km = typeof troca.km === 'string' ? Number(troca.km) : Number(troca.km)
            if (isNaN(troca.km)) {
              console.warn(`KM inválido na troca ${troca.id}:`, troca.km)
              troca.km = 0
            }
          } else {
            troca.km = 0
          }
          
          // Normalizar posicoes (garantir que seja array)
          if (!Array.isArray(troca.posicoes)) {
            troca.posicoes = troca.posicoes ? [troca.posicoes] : []
          }
        })
      }
      
      if (error) {
        const errorCode = error.code
        const errorMessage = error.message || ''
        
        // Verificar se é erro de tabela não encontrada
        if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('não existe')) {
          console.warn("Tabela trocas_pneu não existe no banco de dados.")
          console.warn("Para criar a tabela, execute o SQL fornecido no console ao verificar a estrutura do banco.")
          setHistoricoVeiculo([])
        } else {
          console.error("Erro detalhado ao buscar histórico:", error)
          throw error
        }
      } else {
        console.log("Histórico obtido:", data)
        setHistoricoVeiculo(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      // Só mostrar toast se não for erro de tabela não encontrada
      if (!errorMessage.includes('does not exist') && !errorMessage.includes('não existe') && !errorMessage.includes('relation')) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar histórico",
          description: "Não foi possível carregar o histórico de trocas de pneu."
        })
      }
      setHistoricoVeiculo([])
    } finally {
      setLoading(false)
      setDialogHistoricoOpen(true)
    }
  }
  
  // Função para atualizar a estrutura da tabela trocas_pneu
  async function atualizarTabelaTrocasPneu() {
    try {
      // Adicionar coluna updated_at se não existir
      const query = `
        ALTER TABLE trocas_pneu 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Adicionar colunas para alinhamento e balanceamento
        ALTER TABLE trocas_pneu
        ADD COLUMN IF NOT EXISTS alinhamento BOOLEAN DEFAULT FALSE;
        
        ALTER TABLE trocas_pneu
        ADD COLUMN IF NOT EXISTS balanceamento BOOLEAN DEFAULT FALSE;
        
        -- Criar ou atualizar o trigger
        CREATE OR REPLACE FUNCTION trigger_set_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Aplicar o trigger
        DROP TRIGGER IF EXISTS set_timestamp ON trocas_pneu;
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON trocas_pneu
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
      `
      
      await supabase.rpc('exec_sql', { sql: query })
      console.log("Tabela trocas_pneu atualizada com sucesso")
      
    } catch (error) {
      console.error("Erro ao atualizar tabela trocas_pneu:", error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar banco de dados",
        description: "Não foi possível atualizar a estrutura da tabela de trocas de pneu."
      })
    }
  }
  
  // Função para criar tabela de trocas de pneu se não existir
  async function criarTabelaTrocasPneu() {
    try {
      await supabase.rpc('create_trocas_pneu_table')
    } catch (error) {
      console.error("Erro ao criar tabela trocas_pneu:", error)
      
      // Tentar criar manualmente
      const query = `
        CREATE TABLE IF NOT EXISTS trocas_pneu (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
          tipo_pneu_id UUID NOT NULL REFERENCES tipos_pneu(id),
          data_troca TIMESTAMPTZ DEFAULT NOW(),
          km INTEGER NOT NULL,
          posicoes TEXT[] NOT NULL,
          observacao TEXT,
          alinhamento BOOLEAN DEFAULT FALSE,
          balanceamento BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabase.rpc('exec_sql', { sql: query })
    }
  }
  
  // Função para salvar tipo de pneu
  async function salvarTipoPneu() {
    // Validações
    if (!formTipoPneu.marca || !formTipoPneu.modelo || !formTipoPneu.medida) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios."
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Usar API padrão do Supabase para inserir/atualizar
      if (formTipoPneu.id) {
        // Atualizar tipo existente
        const { error } = await supabase
          .from("tipos_pneu")
          .update({
            marca: formTipoPneu.marca,
            modelo: formTipoPneu.modelo,
            medida: formTipoPneu.medida,
            ativo: formTipoPneu.ativo
          })
          .eq("id", formTipoPneu.id);
        
        if (error) {
          console.error("Erro ao atualizar tipo de pneu:", error);
          throw new Error(`Erro ao atualizar: ${error.message || "Erro desconhecido"}`);
        }
        
        toast({
          title: "Tipo de pneu atualizado",
          description: "O tipo de pneu foi atualizado com sucesso."
        });
      } else {
        // Adicionar novo tipo
        const { error } = await supabase
          .from("tipos_pneu")
          .insert({
            marca: formTipoPneu.marca,
            modelo: formTipoPneu.modelo,
            medida: formTipoPneu.medida,
            ativo: formTipoPneu.ativo
          });
        
        if (error) {
          console.error("Erro ao inserir tipo de pneu:", error);
          throw new Error(`Erro ao inserir: ${error.message || "Erro desconhecido"}`);
        }
        
        toast({
          title: "Tipo de pneu adicionado",
          description: "O novo tipo de pneu foi adicionado com sucesso."
        });
      }
      
      // Recarregar lista e fechar modal
      await carregarTiposPneu();
      setDialogTipoPneuOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao salvar tipo de pneu:", errorMessage);
      toast({
        variant: "destructive",
        title: "Erro ao salvar tipo de pneu",
        description: `Ocorreu um erro ao salvar: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  }
  
  // Função para registrar uma nova troca de pneu ou atualizar uma existente
  async function registrarTrocaPneu() {
    setLoading(true);
    
    try {
      // Validar campos obrigatórios
      // Permitir salvar se tiver tipo_pneu_id, tipo_pneu_nome OU observação (texto manual)
      const temTipoPneu = formTrocaPneu.tipo_pneu_id || formTrocaPneu.tipo_pneu_nome
      const temObservacao = formTrocaPneu.observacao && formTrocaPneu.observacao.trim().length > 0
      
      if (!veiculoSelecionado || (!temTipoPneu && !temObservacao) || !formTrocaPneu.km || formTrocaPneu.posicoes.length === 0) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios. Selecione um produto do estoque ou informe uma observação."
        });
        return;
      }
      
      // Se estiver editando uma troca existente
      if (trocaEditando) {
        await atualizarTrocaPneu()
        return
      }
      
      // Se foi selecionado um produto do estoque mas não há tipo_pneu_id, usar o nome do produto
      let tipoPneuIdFinal = formTrocaPneu.tipo_pneu_id
      let observacaoFinal = formTrocaPneu.observacao || ""
      
      if (!tipoPneuIdFinal && formTrocaPneu.tipo_pneu_nome) {
        // Se não há tipo de pneu cadastrado mas foi selecionado um produto, usar o nome do produto
        observacaoFinal = `Produto: ${formTrocaPneu.tipo_pneu_nome}${observacaoFinal ? ` - ${observacaoFinal}` : ''}`
      }
      // Se não tem tipo_pneu_id nem tipo_pneu_nome, mas tem observação, é texto manual - usar como está
      
      // Verificar se tipo de pneu existe antes de registrar (apenas se foi selecionado um tipo cadastrado)
      if (tipoPneuIdFinal) {
        const { data: tipoPneuExiste, error: tipoPneuError } = await supabase
          .from("tipos_pneu")
          .select("id")
          .eq("id", tipoPneuIdFinal)
          .single();
        
        if (tipoPneuError || !tipoPneuExiste) {
          console.error("Tipo de pneu não encontrado:", tipoPneuError);
          toast({
            variant: "destructive",
            title: "Tipo de pneu inválido",
            description: "O tipo de pneu selecionado não foi encontrado. Por favor, selecione outro."
          });
          return;
        }
      }
      
      // Preparar dados para inserção
      const dadosInsercao: any = {
        veiculo_id: veiculoSelecionado.id,
        tipo_pneu_id: tipoPneuIdFinal || null,
        km: Number(formTrocaPneu.km),
        posicoes: formTrocaPneu.posicoes,
        observacao: observacaoFinal || null,
        rodizio: formTrocaPneu.rodizio || false,
        alinhamento: formTrocaPneu.alinhamento || false,
        balanceamento: formTrocaPneu.balanceamento || false,
        data_troca: new Date().toISOString() // Adicionar data da troca
      }
      
      // Incluir períodos apenas se houver rodízio, alinhamento ou balanceamento
      // Se as colunas não existirem no banco, não enviar esses campos para evitar erro
      if (formTrocaPneu.rodizio && formTrocaPneu.periodo_rodizio) {
        const periodoRodizio = Number(formTrocaPneu.periodo_rodizio)
        if (!isNaN(periodoRodizio) && periodoRodizio > 0) {
          dadosInsercao.periodo_rodizio = periodoRodizio
        }
      }
      if (formTrocaPneu.alinhamento && formTrocaPneu.periodo_alinhamento) {
        const periodoAlinhamento = Number(formTrocaPneu.periodo_alinhamento)
        if (!isNaN(periodoAlinhamento) && periodoAlinhamento > 0) {
          dadosInsercao.periodo_alinhamento = periodoAlinhamento
        }
      }
      if (formTrocaPneu.balanceamento && formTrocaPneu.periodo_balanceamento) {
        const periodoBalanceamento = Number(formTrocaPneu.periodo_balanceamento)
        if (!isNaN(periodoBalanceamento) && periodoBalanceamento > 0) {
          dadosInsercao.periodo_balanceamento = periodoBalanceamento
        }
      }
      
      console.log("Dados para inserção:", JSON.stringify(dadosInsercao, null, 2))
      
      // Validar dados antes de inserir
      if (!dadosInsercao.veiculo_id) {
        throw new Error("ID do veículo é obrigatório")
      }
      if (!dadosInsercao.km || isNaN(dadosInsercao.km) || dadosInsercao.km <= 0) {
        throw new Error("KM deve ser um número válido maior que zero")
      }
      if (!Array.isArray(dadosInsercao.posicoes) || dadosInsercao.posicoes.length === 0) {
        throw new Error("Pelo menos uma posição deve ser selecionada")
      }
      
      // Usar API padrão do Supabase para inserir
      let { data: insertedData, error } = await supabase
        .from("trocas_pneu")
        .insert(dadosInsercao)
        .select();
      
      // Se houver erro de coluna inexistente, tentar inserir sem os campos de período ou rodizio
      if (error) {
        // Log imediato do erro antes de qualquer processamento
        console.error("❌ Erro capturado do Supabase:", error)
        console.error("❌ Tipo do erro:", typeof error)
        console.error("❌ É instância de Error?", error instanceof Error)
        
        // Tentar diferentes formas de acessar o erro
        const errorAny = error as any
        
        // Tentar acessar propriedades diretamente
        const directMessage = errorAny?.message
        const directDetails = errorAny?.details
        const directHint = errorAny?.hint
        const directCode = errorAny?.code
        const directStatus = errorAny?.status
        
        console.error("❌ Acesso direto - message:", directMessage)
        console.error("❌ Acesso direto - details:", directDetails)
        console.error("❌ Acesso direto - hint:", directHint)
        console.error("❌ Acesso direto - code:", directCode)
        console.error("❌ Acesso direto - status:", directStatus)
        
        // Tentar acessar via toString
        console.error("❌ Erro toString():", error.toString())
        console.error("❌ Erro String():", String(error))
        
        // Tentar extrair todas as propriedades do erro
        const errorProps = Object.getOwnPropertyNames(error)
        const errorKeys = Object.keys(error)
        console.error("❌ Propriedades (getOwnPropertyNames):", errorProps)
        console.error("❌ Chaves (Object.keys):", errorKeys)
        
        // Tentar acessar propriedades comuns
        if (errorProps.length > 0) {
          errorProps.forEach(prop => {
            try {
              const value = (error as any)[prop]
              console.error(`❌ ${prop}:`, value, typeof value)
            } catch (e) {
              // Ignorar erros ao acessar propriedades
            }
          })
        }
        
        const errorMessage = directMessage || error.message || ''
        const errorDetails = directDetails || error.details || ''
        const isColumnError = errorMessage.includes('column') || 
                             errorMessage.includes('does not exist') ||
                             errorMessage.includes('não existe') ||
                             errorDetails.includes('periodo_rodizio') ||
                             errorDetails.includes('periodo_alinhamento') ||
                             errorDetails.includes('periodo_balanceamento') ||
                             errorDetails.includes('rodizio')
        
        if (isColumnError) {
          console.warn("Colunas não existem, tentando inserir sem campos opcionais...")
          
          // Remover campos que podem não existir e tentar novamente
          const dadosSemCamposOpcionais = { ...dadosInsercao }
          delete dadosSemCamposOpcionais.periodo_rodizio
          delete dadosSemCamposOpcionais.periodo_alinhamento
          delete dadosSemCamposOpcionais.periodo_balanceamento
          delete dadosSemCamposOpcionais.rodizio
          
          const retryResult = await supabase
            .from("trocas_pneu")
            .insert(dadosSemCamposOpcionais)
            .select();
          
          if (retryResult.error) {
            // Se ainda houver erro, usar o erro original
            error = retryResult.error
            insertedData = retryResult.data
          } else {
            // Sucesso ao inserir sem campos opcionais
            insertedData = retryResult.data
            error = null
            // Não mostrar toast aqui, será mostrado depois com mensagem específica
          }
        }
        
        if (error) {
          // Capturar resposta completa do erro para debug
          let errorResponse: any = {}
          let errorMessage = ''
          let errorDetails = ''
          let errorHint = ''
          let errorCode = ''
          let errorStatus: any = null
          
          try {
            const errorAny = error as any
            
            // Tentar acessar propriedades diretas
            errorMessage = errorAny?.message || errorAny?.Message || ''
            errorDetails = errorAny?.details || errorAny?.Details || ''
            errorHint = errorAny?.hint || errorAny?.Hint || ''
            errorCode = errorAny?.code || errorAny?.Code || ''
            errorStatus = errorAny?.status || errorAny?.Status || errorAny?.statusCode || errorAny?.StatusCode || null
            
            // Tentar acessar propriedades aninhadas
            if (!errorMessage && errorAny?.error) {
              errorMessage = errorAny.error.message || errorAny.error.Message || ''
            }
            if (!errorDetails && errorAny?.error) {
              errorDetails = errorAny.error.details || errorAny.error.Details || ''
            }
            
            // Tentar extrair do body
            if (errorAny?.body) {
              if (typeof errorAny.body === 'string') {
                try {
                  const bodyParsed = JSON.parse(errorAny.body)
                  errorMessage = errorMessage || bodyParsed.message || bodyParsed.Message || ''
                  errorDetails = errorDetails || bodyParsed.details || bodyParsed.Details || ''
                  errorHint = errorHint || bodyParsed.hint || bodyParsed.Hint || ''
                  errorCode = errorCode || bodyParsed.code || bodyParsed.Code || ''
                } catch (e) {
                  // Ignorar erro de parsing
                }
              } else if (typeof errorAny.body === 'object') {
                errorMessage = errorMessage || errorAny.body.message || errorAny.body.Message || ''
                errorDetails = errorDetails || errorAny.body.details || errorAny.body.Details || ''
                errorHint = errorHint || errorAny.body.hint || errorAny.body.Hint || ''
                errorCode = errorCode || errorAny.body.code || errorAny.body.Code || ''
              }
            }
            
            // Construir objeto de resposta
            errorResponse = {
              message: errorMessage,
              details: errorDetails,
              hint: errorHint,
              code: errorCode,
              status: errorStatus,
              originalError: error
            }
          } catch (e) {
            console.error("❌ Erro ao processar objeto de erro:", e)
            errorResponse = { originalError: error, processingError: e }
          }
          
          // Log completo do erro
          console.error("❌ Erro detalhado ao registrar troca de pneu:", {
            error: errorResponse,
            errorOriginal: error,
            dadosEnviados: dadosInsercao,
            stringifiedError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
          });
          
          // Construir mensagem de erro mais detalhada
          let finalErrorMessage = "Erro ao registrar troca de pneu"
          let errorDetailsText = ""
          
          // Usar as informações extraídas (já declaradas acima)
          const errorMsg = errorMessage || ''
          const errorDet = errorDetails || ''
          const errorHintValue = errorHint || ''
          const errorCodeValue = errorCode || ''
          const errorStatusValue = errorStatus || ''
          
          // Montar mensagem detalhada
          if (errorDet) {
            errorDetailsText += `Detalhes: ${errorDet}. `
          }
          if (errorMsg) {
            errorDetailsText += `Mensagem: ${errorMsg}. `
          }
          if (errorHintValue) {
            errorDetailsText += `Dica: ${errorHintValue}. `
          }
          if (errorCodeValue) {
            errorDetailsText += `Código: ${errorCodeValue}. `
          }
          if (errorStatusValue) {
            errorDetailsText += `Status: ${errorStatusValue}. `
          }
          
          // Verificar se é erro 400 (Bad Request)
          if (errorCodeValue === 'PGRST116' || errorMsg?.includes('400') || errorMsg?.includes('Bad Request') || 
              errorStatusValue === 400 || errorStatusValue === '400') {
            
            if (errorDet?.includes('null value') || errorDet?.includes('not-null')) {
              finalErrorMessage = `Erro de validação: Campo obrigatório não preenchido. ${errorDetailsText}`
            } else if (errorDet?.includes('invalid input') || errorDet?.includes('formato')) {
              finalErrorMessage = `Erro de formato: Dados inválidos. ${errorDetailsText}`
            } else if (errorDet?.includes('foreign key') || errorDet?.includes('constraint')) {
              finalErrorMessage = `Erro de referência: ID de veículo ou tipo de pneu inválido. ${errorDetailsText}`
            } else if (errorDet?.includes('array') || errorDet?.includes('json')) {
              finalErrorMessage = `Erro de formato: Problema com array/JSON. ${errorDetailsText}`
            } else {
              finalErrorMessage = `Erro de validação (400): ${errorDetailsText || 'Verifique os dados enviados'}`
            }
          } else if (errorCodeValue === 'PGRST301' || errorMsg?.includes('401') || errorMsg?.includes('Unauthorized') || errorMsg?.includes('permission denied')) {
            finalErrorMessage = "Erro de autorização: As políticas de segurança (RLS) estão bloqueando a operação. Execute o script 'scripts/setup-rls-trocas-pneu-public.sql' no Supabase SQL Editor."
          } else if (errorMsg) {
            finalErrorMessage = `Erro ao registrar troca de pneu: ${errorMsg}${errorDet ? `. ${errorDet}` : ''}`
          } else if (errorDet) {
            finalErrorMessage = `Erro ao registrar troca de pneu: ${errorDet}`
          } else if (errorHintValue) {
            finalErrorMessage = `Erro ao registrar troca de pneu: ${errorHintValue}`
          } else if (errorCodeValue) {
            finalErrorMessage = `Erro ao registrar troca de pneu (código: ${errorCodeValue})`
          } else {
            finalErrorMessage = `Erro ao registrar troca de pneu. Verifique o console para mais detalhes. Dados enviados: ${JSON.stringify(dadosInsercao, null, 2)}`
          }
          
          throw new Error(finalErrorMessage)
        }
      }
      
      console.log("Troca de pneu registrada:", insertedData);
      
      // Verificar se os períodos foram incluídos ou não
      const temPeriodos = dadosInsercao.periodo_rodizio || dadosInsercao.periodo_alinhamento || dadosInsercao.periodo_balanceamento
      
      toast({
        title: "Troca de pneu registrada",
        description: temPeriodos 
          ? "A troca de pneu foi registrada com sucesso."
          : "A troca foi registrada, mas as colunas de período ainda não existem no banco. Execute o script SQL para adicionar essas colunas."
      });
      
      // Recarregar lista de trocas e recalcular progresso
      await carregarTrocasPneu()
      
      // Recarregar lista de trocas para mostrar o histórico atualizado
      if (veiculoSelecionado) {
        setTimeout(async () => {
          await abrirHistorico(veiculoSelecionado);
        }, 500);
      }
      
      // Limpar formulário
      setFormTrocaPneu({
        tipo_pneu_id: "",
        tipo_pneu_nome: "",
        km: "",
        observacao: "",
        posicoes: [],
        rodizio: false,
        alinhamento: false,
        balanceamento: false,
        periodo_rodizio: "10000",
        periodo_alinhamento: "10000",
        periodo_balanceamento: "10000"
      })
      
      setTrocaEditando(null)
      setDialogTrocaPneuOpen(false)
      
    } catch (error) {
      console.error("Exceção ao registrar troca de pneu:", error);
      
      let errorMessage = "Não foi possível registrar a troca de pneu."
      if (error instanceof Error && error.message) {
        errorMessage = error.message
        // Verificar se é erro de RLS/401
        if (error.message.includes('autorização') || error.message.includes('RLS') || error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage += "\n\nExecute o script 'scripts/setup-rls-trocas-pneu-public.sql' no Supabase SQL Editor."
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        // Tentar extrair informações do objeto de erro
        const errorObj = error as any
        if (errorObj.message) {
          errorMessage = errorObj.message
        } else if (errorObj.details) {
          errorMessage = errorObj.details
        } else if (errorObj.hint) {
          errorMessage = errorObj.hint
        } else {
          errorMessage = `Erro desconhecido: ${JSON.stringify(error)}`
        }
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao registrar troca de pneu",
        description: errorMessage,
        duration: 10000 // 10 segundos para dar tempo de ler a mensagem
      });
    } finally {
      setLoading(false);
      // Não fechar o dialog automaticamente em caso de erro para o usuário poder corrigir
    }
  }
  
  // Função para atualizar uma troca de pneu existente
  async function atualizarTrocaPneu() {
    if (!trocaEditando || !veiculoSelecionado) return
    
    try {
      // Se foi selecionado um produto do estoque mas não há tipo_pneu_id, usar o nome do produto
      let tipoPneuIdFinal = formTrocaPneu.tipo_pneu_id
      let observacaoComProduto = formTrocaPneu.observacao || ""
      
      if (!tipoPneuIdFinal && formTrocaPneu.tipo_pneu_nome) {
        // Se não há tipo de pneu cadastrado mas foi selecionado um produto, usar o nome do produto
        observacaoComProduto = `Produto: ${formTrocaPneu.tipo_pneu_nome}${observacaoComProduto ? ` - ${observacaoComProduto}` : ''}`
      }
      // Se não tem tipo_pneu_id nem tipo_pneu_nome, mas tem observação, é texto manual - usar como está
      let observacaoFinal = observacaoComProduto || formTrocaPneu.observacao || null
      
      // Preparar dados para atualização
      const dadosAtualizacao: any = {
        km: Number(formTrocaPneu.km),
        posicoes: formTrocaPneu.posicoes,
        observacao: observacaoFinal,
        rodizio: formTrocaPneu.rodizio || false,
        alinhamento: formTrocaPneu.alinhamento || false,
        balanceamento: formTrocaPneu.balanceamento || false
      }
      
      // Incluir tipo_pneu_id apenas se houver
      if (tipoPneuIdFinal) {
        dadosAtualizacao.tipo_pneu_id = tipoPneuIdFinal
      } else {
        dadosAtualizacao.tipo_pneu_id = null
      }
      
      // Incluir períodos se houver
      if (formTrocaPneu.rodizio && formTrocaPneu.periodo_rodizio) {
        const periodoRodizio = Number(formTrocaPneu.periodo_rodizio)
        if (!isNaN(periodoRodizio) && periodoRodizio > 0) {
          dadosAtualizacao.periodo_rodizio = periodoRodizio
        }
      }
      if (formTrocaPneu.alinhamento && formTrocaPneu.periodo_alinhamento) {
        const periodoAlinhamento = Number(formTrocaPneu.periodo_alinhamento)
        if (!isNaN(periodoAlinhamento) && periodoAlinhamento > 0) {
          dadosAtualizacao.periodo_alinhamento = periodoAlinhamento
        }
      }
      if (formTrocaPneu.balanceamento && formTrocaPneu.periodo_balanceamento) {
        const periodoBalanceamento = Number(formTrocaPneu.periodo_balanceamento)
        if (!isNaN(periodoBalanceamento) && periodoBalanceamento > 0) {
          dadosAtualizacao.periodo_balanceamento = periodoBalanceamento
        }
      }
      
      console.log("Dados para atualização:", JSON.stringify(dadosAtualizacao, null, 2))
      
      // Atualizar no banco
      const { data: updatedData, error } = await supabase
        .from("trocas_pneu")
        .update(dadosAtualizacao)
        .eq("id", trocaEditando.id)
        .select()
      
      if (error) {
        console.error("Erro ao atualizar troca:", error)
        throw new Error(error.message || "Erro ao atualizar troca de pneu")
      }
      
      toast({
        title: "Troca atualizada",
        description: "A troca de pneu foi atualizada com sucesso."
      })
      
      // Recarregar dados e recalcular progresso
      await carregarTrocasPneu()
      // Aguardar um pouco para garantir que os estados foram atualizados
      setTimeout(() => {
        // Usar os estados atualizados após carregarTrocasPneu
        calcularProgressoTodosVeiculosAtualizado()
      }, 200)
      
      if (veiculoSelecionado) {
        await abrirHistorico(veiculoSelecionado)
      }
      
      // Limpar formulário
      setFormTrocaPneu({
        tipo_pneu_id: "",
        tipo_pneu_nome: "",
        km: "",
        observacao: "",
        posicoes: [],
        rodizio: false,
        alinhamento: false,
        balanceamento: false,
        periodo_rodizio: "10000",
        periodo_alinhamento: "10000",
        periodo_balanceamento: "10000"
      })
      
      setTrocaEditando(null)
      setDialogTrocaPneuOpen(false)
    } catch (error) {
      console.error("Erro ao atualizar troca:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      toast({
        variant: "destructive",
        title: "Erro ao atualizar troca de pneu",
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Função para excluir uma troca de pneu
  async function excluirTrocaPneu(troca: TrocaPneu) {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("trocas_pneu")
        .delete()
        .eq("id", troca.id)
      
      if (error) {
        console.error("Erro ao excluir troca:", error)
        throw new Error(error.message || "Erro ao excluir troca de pneu")
      }
      
      toast({
        title: "Troca excluída",
        description: "A troca de pneu foi excluída com sucesso."
      })
      
      // Recarregar dados
      if (veiculoSelecionado) {
        await abrirHistorico(veiculoSelecionado)
        await carregarTrocasPneu()
        setTimeout(() => {
          calcularProgressoTodosVeiculosAtualizado()
        }, 200)
      }
    } catch (error) {
      console.error("Erro ao excluir troca:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      toast({
        variant: "destructive",
        title: "Erro ao excluir troca de pneu",
        description: errorMessage
      })
    } finally {
      setLoading(false)
      setTrocaExcluindo(null)
      setDialogExcluirOpen(false)
    }
  }
  
  // Função para criar RPC para verificar se uma tabela existe
  async function criarFuncoesUtilitarias() {
    try {
      // Criar função para verificar se uma tabela existe
      const query = `
        CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            exists BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT FROM pg_tables
                WHERE tablename = table_name
            ) INTO exists;
            
            RETURN exists;
        END;
        $$;
      `
      await supabase.rpc('exec_sql', { sql: query })
      
      // Criar função para verificar se uma coluna existe em uma tabela
      const queryColuna = `
        CREATE OR REPLACE FUNCTION column_exists(table_name TEXT, column_name TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            exists BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = column_exists.table_name
                AND column_name = column_exists.column_name
            ) INTO exists;
            
            RETURN exists;
        END;
        $$;
      `
      await supabase.rpc('exec_sql', { sql: queryColuna })
      
      console.log("Funções utilitárias criadas com sucesso")
    } catch (error) {
      console.error("Erro ao criar funções utilitárias:", error)
    }
  }
  
  // Função para realizar a comparação entre veículos
  async function compararVeiculos() {
    if (!veiculosComparacao.veiculo1 || !veiculosComparacao.veiculo2) {
      toast({
        variant: "destructive",
        title: "Selecione dois veículos",
        description: "Você precisa selecionar dois veículos diferentes para comparação."
      });
      return;
    }

    setCarregandoComparacao(true);
    
    try {
      // Buscar dados do veículo 1
      const { data: dadosVeiculo1, error: erroVeiculo1 } = await supabase
        .from("veiculos")
        .select("id, placa, modelo, marca")
        .eq("id", veiculosComparacao.veiculo1)
        .single();
        
      if (erroVeiculo1) throw erroVeiculo1;
      
      // Buscar dados do veículo 2
      const { data: dadosVeiculo2, error: erroVeiculo2 } = await supabase
        .from("veiculos")
        .select("id, placa, modelo, marca")
        .eq("id", veiculosComparacao.veiculo2)
        .single();
        
      if (erroVeiculo2) throw erroVeiculo2;
      
      // Buscar trocas do veículo 1
      const { data: trocasVeiculo1, error: erroTrocas1 } = await supabase
        .from("trocas_pneu")
        .select("*")
        .eq("veiculo_id", veiculosComparacao.veiculo1)
        .order("data_troca", { ascending: true });
        
      if (erroTrocas1) throw erroTrocas1;
      
      // Buscar trocas do veículo 2
      const { data: trocasVeiculo2, error: erroTrocas2 } = await supabase
        .from("trocas_pneu")
        .select("*")
        .eq("veiculo_id", veiculosComparacao.veiculo2)
        .order("data_troca", { ascending: true });
        
      if (erroTrocas2) throw erroTrocas2;
      
      // Analisar dados do veículo 1
      const comServicosVeiculo1 = trocasVeiculo1.some(t => t.alinhamento || t.balanceamento);
      const analiseTrocasVeiculo1 = analisarTrocas(trocasVeiculo1);
      
      // Analisar dados do veículo 2
      const comServicosVeiculo2 = trocasVeiculo2.some(t => t.alinhamento || t.balanceamento);
      const analiseTrocasVeiculo2 = analisarTrocas(trocasVeiculo2);
      
      // Calcular qual teve melhor rendimento
      let diferencaPercentual = 0;
      let veiculoMelhor = null;
      
      if (analiseTrocasVeiculo1.kmMediaPorTroca > 0 && analiseTrocasVeiculo2.kmMediaPorTroca > 0) {
        if (analiseTrocasVeiculo1.kmMediaPorTroca > analiseTrocasVeiculo2.kmMediaPorTroca) {
          diferencaPercentual = ((analiseTrocasVeiculo1.kmMediaPorTroca / analiseTrocasVeiculo2.kmMediaPorTroca) - 1) * 100;
          veiculoMelhor = dadosVeiculo1.placa;
        } else {
          diferencaPercentual = ((analiseTrocasVeiculo2.kmMediaPorTroca / analiseTrocasVeiculo1.kmMediaPorTroca) - 1) * 100;
          veiculoMelhor = dadosVeiculo2.placa;
        }
      }
      
      // Definir resultado da comparação
      setResultadoComparacao({
        veiculo1: {
          placa: dadosVeiculo1.placa,
          modelo: `${dadosVeiculo1.marca} ${dadosVeiculo1.modelo}`,
          kmMediaPorTroca: analiseTrocasVeiculo1.kmMediaPorTroca,
          totalTrocas: analiseTrocasVeiculo1.totalTrocas,
          kmPercorrido: analiseTrocasVeiculo1.kmPercorrido,
          comServicos: comServicosVeiculo1
        },
        veiculo2: {
          placa: dadosVeiculo2.placa,
          modelo: `${dadosVeiculo2.marca} ${dadosVeiculo2.modelo}`,
          kmMediaPorTroca: analiseTrocasVeiculo2.kmMediaPorTroca,
          totalTrocas: analiseTrocasVeiculo2.totalTrocas,
          kmPercorrido: analiseTrocasVeiculo2.kmPercorrido,
          comServicos: comServicosVeiculo2
        },
        diferencaPercentual,
        veiculoMelhor
      });
    } catch (error) {
      console.error("Erro ao comparar veículos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao comparar veículos",
        description: "Não foi possível realizar a comparação entre os veículos selecionados."
      });
    } finally {
      setCarregandoComparacao(false);
    }
  }
  
  // Função para analisar as trocas de pneu de um veículo
  function analisarTrocas(trocas: TrocaPneu[]) {
    if (trocas.length < 2) {
      return { kmMediaPorTroca: 0, totalTrocas: trocas.length, kmPercorrido: 0 };
    }
    
    // Ordenar trocas por data
    const trocasOrdenadas = [...trocas].sort((a, b) => 
      new Date(a.data_troca).getTime() - new Date(b.data_troca).getTime()
    );
    
    // Calcular duração média dos pneus (km)
    let kmTotal = 0;
    let contadorTrocas = 0;
    
    for (let i = 1; i < trocasOrdenadas.length; i++) {
      const kmAnterior = trocasOrdenadas[i-1].km;
      const kmAtual = trocasOrdenadas[i].km;
      
      if (kmAtual > kmAnterior) {
        kmTotal += (kmAtual - kmAnterior);
        contadorTrocas++;
      }
    }
    
    const kmMediaPorTroca = contadorTrocas > 0 ? Math.round(kmTotal / contadorTrocas) : 0;
    
    return { 
      kmMediaPorTroca, 
      totalTrocas: trocas.length,
      kmPercorrido: kmTotal
    };
  }
  
  // Função para gerar PDF com gráfico de comparação
  async function gerarPDFComparacao() {
    if (!resultadoComparacao || !resultadoComparacao.veiculo1 || !resultadoComparacao.veiculo2) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Não há dados de comparação disponíveis."
      });
      return;
    }

    setGeradorPdfLoading(true);

    try {
      // Criar instância de jsPDF
      const pdf = new jsPDF();
      
      // Adicionar título
      pdf.setFontSize(18);
      pdf.text("Relatório de Comparação de Rendimento de Pneus", 20, 20);
      
      // Adicionar data do relatório
      pdf.setFontSize(10);
      pdf.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
      
      // Adicionar informações dos veículos
      pdf.setFontSize(14);
      pdf.text("Dados dos Veículos", 20, 40);
      
      // Tabela com dados dos veículos
      const dadosVeiculos = [
        ['', `Veículo 1: ${resultadoComparacao.veiculo1.placa}`, `Veículo 2: ${resultadoComparacao.veiculo2.placa}`],
        ['Modelo', resultadoComparacao.veiculo1.modelo, resultadoComparacao.veiculo2.modelo],
        ['Serviços', resultadoComparacao.veiculo1.comServicos ? "Com alinhamento/balanceamento" : "Sem alinhamento/balanceamento", 
                  resultadoComparacao.veiculo2.comServicos ? "Com alinhamento/balanceamento" : "Sem alinhamento/balanceamento"],
        ['Total de trocas', resultadoComparacao.veiculo1.totalTrocas.toString(), resultadoComparacao.veiculo2.totalTrocas.toString()],
        ['Km percorrido', `${resultadoComparacao.veiculo1.kmPercorrido.toLocaleString('pt-BR')} km`, 
                         `${resultadoComparacao.veiculo2.kmPercorrido.toLocaleString('pt-BR')} km`],
        ['Média km/troca', `${resultadoComparacao.veiculo1.kmMediaPorTroca.toLocaleString('pt-BR')} km`, 
                          `${resultadoComparacao.veiculo2.kmMediaPorTroca.toLocaleString('pt-BR')} km`]
      ];
      
      // Usar autoTable como função direta
      autoTable(pdf, {
        startY: 45,
        head: [],
        body: dadosVeiculos,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 60] },
        styles: { fontSize: 10 }
      });
      
      // Pegar a posição final da tabela para a próxima seção
      const finalY = (pdf as any).lastAutoTable.finalY || 45;
      
      // Adicionar conclusão
      pdf.setFontSize(14);
      pdf.text("Conclusão", 20, finalY + 10);
      
      pdf.setFontSize(10);
      const conclusao1 = `O veículo ${resultadoComparacao.veiculoMelhor} teve um rendimento aproximadamente ${resultadoComparacao.diferencaPercentual.toFixed(2)}% melhor.`;
      
      const conclusao2 = (resultadoComparacao.veiculo1.comServicos && resultadoComparacao.veiculoMelhor === resultadoComparacao.veiculo1.placa) || 
                        (resultadoComparacao.veiculo2.comServicos && resultadoComparacao.veiculoMelhor === resultadoComparacao.veiculo2.placa) 
                        ? "Isto sugere que realizar alinhamento e balanceamento contribui para um maior rendimento dos pneus." 
                        : "Não foi possível confirmar neste caso que o alinhamento e balanceamento contribuem para um maior rendimento dos pneus.";
      
      pdf.text(conclusao1, 20, finalY + 15);
      pdf.text(conclusao2, 20, finalY + 20);
      
      // Adicionar gráfico (convertemos o canvas para imagem)
      if (chartRef.current && chartInstance.current) {
        const chartImg = chartRef.current.toDataURL('image/png');
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text("Comparação Gráfica de Rendimento", 20, 20);
        pdf.addImage(chartImg, 'PNG', 20, 30, 170, 100);
      }
      
      // Salvar PDF
      pdf.save(`comparacao_pneus_${resultadoComparacao.veiculo1.placa}_${resultadoComparacao.veiculo2.placa}.pdf`);
      
      toast({
        title: "PDF gerado com sucesso",
        description: "O relatório de comparação foi gerado e baixado."
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório PDF."
      });
    } finally {
      setGeradorPdfLoading(false);
    }
  }

  // Atualizar gráfico quando resultado de comparação mudar
  useEffect(() => {
    if (resultadoComparacao && resultadoComparacao.veiculo1 && resultadoComparacao.veiculo2 && chartRef.current) {
      // Use dynamic import to load Chart.js only on client-side
      const loadChart = async () => {
        try {
          // Destruir gráfico anterior se existir
          if (chartInstance.current) {
            chartInstance.current.destroy();
          }
          
          const ChartModule = await import('chart.js/auto');
          const ctx = chartRef.current?.getContext('2d');
          
          if (ctx && resultadoComparacao?.veiculo1 && resultadoComparacao?.veiculo2) {
            chartInstance.current = new ChartModule.Chart(ctx, {
              type: 'bar',
              data: {
                labels: [
                  `${resultadoComparacao.veiculo1.placa} - ${resultadoComparacao.veiculo1.comServicos ? 'Com' : 'Sem'} serviços`, 
                  `${resultadoComparacao.veiculo2.placa} - ${resultadoComparacao.veiculo2.comServicos ? 'Com' : 'Sem'} serviços`
                ],
                datasets: [
                  {
                    label: 'Média de KM por troca de pneu',
                    data: [
                      resultadoComparacao.veiculo1.kmMediaPorTroca,
                      resultadoComparacao.veiculo2.kmMediaPorTroca
                    ],
                    backgroundColor: [
                      'rgba(54, 162, 235, 0.5)',
                      'rgba(255, 99, 132, 0.5)'
                    ],
                    borderColor: [
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Quilômetros'
                    }
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error("Erro ao carregar gráfico:", error);
        }
      };
      
      loadChart();
    }
  }, [resultadoComparacao]);

  // Função para abrir o modal de seleção de veículo
  function abrirModalSelecaoVeiculo(target: 'veiculo1' | 'veiculo2') {
    setVeiculoSelectionTarget(target)
    setVeiculoSearchTerm("")
    setVeiculosFiltradosSelecao(veiculos)
    setDialogVeiculoOpen(true)
  }

  // Função para selecionar um veículo no modal
  function selecionarVeiculo(veiculo: Veiculo) {
    if (veiculoSelectionTarget) {
      setVeiculosComparacao({
        ...veiculosComparacao,
        [veiculoSelectionTarget]: veiculo.id
      })
    }
    setDialogVeiculoOpen(false)
  }

  // Efeito para filtrar veículos no modal de seleção
  useEffect(() => {
    if (!veiculoSearchTerm.trim()) {
      setVeiculosFiltradosSelecao(veiculos)
      return
    }
    
    const termoBusca = veiculoSearchTerm.toLowerCase().trim()
    const filtrados = veiculos.filter(veiculo => 
      veiculo.placa.toLowerCase().includes(termoBusca) ||
      veiculo.modelo.toLowerCase().includes(termoBusca) ||
      veiculo.marca.toLowerCase().includes(termoBusca)
    )
    
    setVeiculosFiltradosSelecao(filtrados)
  }, [veiculoSearchTerm, veiculos])

  // Função para obter o texto do veículo selecionado
  function getVeiculoSelecionadoTexto(veiculoId: string) {
    const veiculo = veiculos.find(v => v.id === veiculoId)
    return veiculo ? `${veiculo.placa} - ${veiculo.modelo} ${veiculo.marca}` : "Selecione um veículo"
  }

  const isMobile = useIsMobile()

  // Componente Mobile View
  function TrocaPneuMobileView() {
    const getProgressColor = (progresso: number) => {
      if (progresso >= 85) return "bg-red-500"
      if (progresso >= 51) return "bg-yellow-500"
      return "bg-green-500"
    }
    
    const getStatusIcon = (progresso: number) => {
      if (progresso >= 85) return <AlertCircle className="h-3 w-3 text-red-500" />
      if (progresso >= 51) return <AlertCircle className="h-3 w-3 text-yellow-500" />
      return <CheckCircle2 className="h-3 w-3 text-green-500" />
    }

    return (
      <div className="p-2 space-y-3 max-w-full overflow-x-hidden">
        <div className="space-y-1 px-1">
          <h1 className="text-xl font-bold text-primary">Troca de Pneu</h1>
          <p className="text-xs text-muted-foreground">Acompanhamento de manutenções</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa, modelo ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : veiculosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum veículo encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {veiculosFiltrados.map((veiculo) => {
              const progresso = progressoPorVeiculo[veiculo.id] || {
                rodizio: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 },
                alinhamento: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 },
                balanceamento: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 }
              }

              return (
                <Card key={veiculo.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{veiculo.placa}</CardTitle>
                        <CardDescription className="text-xs">
                          {veiculo.marca} {veiculo.modelo}
                        </CardDescription>
                        <CardDescription className="text-xs font-medium">
                          KM: {
                            veiculo.kmAtual !== null && veiculo.kmAtual !== undefined && veiculo.kmAtual !== 0
                              ? veiculo.kmAtual.toLocaleString('pt-BR') 
                              : veiculo.kmAtual === 0
                                ? "0"
                                : "N/A"
                          }
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => abrirVisualizacao(veiculo)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            const trocasVeiculo = trocasPneu
                              .filter(t => t.veiculo_id === veiculo.id)
                              .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())
                            
                            if (trocasVeiculo.length > 0) {
                              carregarTrocaParaEdicao(trocasVeiculo[0])
                            } else {
                              toast({
                                variant: "destructive",
                                title: "Nenhuma troca encontrada",
                                description: "Este veículo ainda não possui trocas de pneu registradas."
                              })
                            }
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Última Troca
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => abrirHistorico(veiculo)}>
                            <History className="mr-2 h-4 w-4" />
                            Histórico
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="text-xs px-3 py-1.5 h-8 w-full mt-2"
                      onClick={() => abrirModalTrocaPneu(veiculo)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Nova Troca
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {/* Rodízio de Pneus */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Disc className="h-3 w-3 text-muted-foreground" />
                          <Label className="text-xs font-medium">Rodízio</Label>
                          {getStatusIcon(progresso.rodizio.progresso)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progresso.rodizio.progresso >= 100 ? (
                            <span className="text-red-500 font-semibold">Vencido!</span>
                          ) : progresso.rodizio.progresso >= 85 ? (
                            <span className="text-red-500 font-semibold">Atenção!</span>
                          ) : progresso.rodizio.kmRestante > 0 ? (
                            `${progresso.rodizio.kmRestante.toLocaleString('pt-BR')} km`
                          ) : (
                            "Sem histórico"
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, progresso.rodizio.progresso)} 
                        className="h-2"
                        indicatorClassName={getProgressColor(progresso.rodizio.progresso)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {progresso.rodizio.ultimaManutencao ? (
                          <>
                            Último: {progresso.rodizio.ultimaManutencao.data_troca 
                              ? new Date(progresso.rodizio.ultimaManutencao.data_troca).toLocaleDateString('pt-BR') 
                              : ''} • {progresso.rodizio.ultimaManutencao.km.toLocaleString('pt-BR')} km
                          </>
                        ) : (
                          "Sem histórico"
                        )}
                      </div>
                    </div>
                    
                    {/* Alinhamento */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Car className="h-3 w-3 text-muted-foreground" />
                          <Label className="text-xs font-medium">Alinhamento</Label>
                          {getStatusIcon(progresso.alinhamento.progresso)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progresso.alinhamento.progresso >= 100 ? (
                            <span className="text-red-500 font-semibold">Vencido!</span>
                          ) : progresso.alinhamento.progresso >= 85 ? (
                            <span className="text-red-500 font-semibold">Atenção!</span>
                          ) : progresso.alinhamento.kmRestante > 0 ? (
                            `${progresso.alinhamento.kmRestante.toLocaleString('pt-BR')} km`
                          ) : (
                            "Sem histórico"
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, progresso.alinhamento.progresso)} 
                        className="h-2"
                        indicatorClassName={getProgressColor(progresso.alinhamento.progresso)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {progresso.alinhamento.ultimaManutencao ? (
                          <>
                            Último: {progresso.alinhamento.ultimaManutencao.data_troca 
                              ? new Date(progresso.alinhamento.ultimaManutencao.data_troca).toLocaleDateString('pt-BR') 
                              : ''} • {progresso.alinhamento.ultimaManutencao.km.toLocaleString('pt-BR')} km
                          </>
                        ) : (
                          "Sem histórico"
                        )}
                      </div>
                    </div>
                    
                    {/* Balanceamento */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Disc className="h-3 w-3 text-muted-foreground" />
                          <Label className="text-xs font-medium">Balanceamento</Label>
                          {getStatusIcon(progresso.balanceamento.progresso)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progresso.balanceamento.progresso >= 100 ? (
                            <span className="text-red-500 font-semibold">Vencido!</span>
                          ) : progresso.balanceamento.progresso >= 85 ? (
                            <span className="text-red-500 font-semibold">Atenção!</span>
                          ) : progresso.balanceamento.kmRestante > 0 ? (
                            `${progresso.balanceamento.kmRestante.toLocaleString('pt-BR')} km`
                          ) : (
                            "Sem histórico"
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, progresso.balanceamento.progresso)} 
                        className="h-2"
                        indicatorClassName={getProgressColor(progresso.balanceamento.progresso)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {progresso.balanceamento.ultimaManutencao ? (
                          <>
                            Último: {progresso.balanceamento.ultimaManutencao.data_troca 
                              ? new Date(progresso.balanceamento.ultimaManutencao.data_troca).toLocaleDateString('pt-BR') 
                              : ''} • {progresso.balanceamento.ultimaManutencao.km.toLocaleString('pt-BR')} km
                          </>
                        ) : (
                          "Sem histórico"
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Retornar a interface da página
  return (
    <>
      <Toaster />
      {isMobile ? (
        <TrocaPneuMobileView />
      ) : (
      <div className="space-y-6">
        <Card className="shadow-md-custom">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa, modelo ou marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {veiculosFiltrados.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Nenhum veículo encontrado
                  </div>
                ) : (
                veiculosFiltrados.map((veiculo) => {
                  const progresso = progressoPorVeiculo[veiculo.id] || {
                    rodizio: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 },
                    alinhamento: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 },
                    balanceamento: { progresso: 0, kmRestante: 0, kmTotal: 0, proximaManutencao: 0 }
                  }
                  
                  const getProgressColor = (progresso: number) => {
                    if (progresso >= 85) return "bg-red-500"
                    if (progresso >= 51) return "bg-yellow-500"
                    return "bg-green-500"
                  }
                  
                  const getStatusIcon = (progresso: number) => {
                    if (progresso >= 85) return <AlertCircle className="h-3 w-3 text-red-500" />
                    if (progresso >= 51) return <AlertCircle className="h-3 w-3 text-yellow-500" />
                    return <CheckCircle2 className="h-3 w-3 text-green-500" />
                  }
                  
                  const isExpandido = veiculoExpandido === veiculo.id
                  
                  return (
                    <div 
                      key={veiculo.id}
                      className={isExpandido ? 'col-span-full' : ''}
                    >
                      <Card 
                        className={`border-l-4 border-l-primary flex flex-col ${isExpandido ? '' : 'h-full'} relative transition-all duration-300 cursor-pointer`}
                      onClick={(e) => {
                        // Não expandir se clicar no menu ou botões
                        const target = e.target as HTMLElement
                        if (target.closest('button') || target.closest('[role="menu"]')) {
                          return
                        }
                        setVeiculoExpandido(isExpandido ? null : veiculo.id)
                      }}
                    >
                      <CardHeader className="pb-2 flex-shrink-0">
                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => abrirVisualizacao(veiculo)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                // Buscar a última troca do veículo e abrir diretamente para edição
                                const trocasVeiculo = trocasPneu
                                  .filter(t => t.veiculo_id === veiculo.id)
                                  .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())
                                
                                if (trocasVeiculo.length > 0) {
                                  // Carregar a última troca para edição
                                  carregarTrocaParaEdicao(trocasVeiculo[0])
                                } else {
                                  toast({
                                    variant: "destructive",
                                    title: "Nenhuma troca encontrada",
                                    description: "Este veículo ainda não possui trocas de pneu registradas."
                                  })
                                }
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Última Troca
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => abrirHistorico(veiculo)}>
                                <History className="mr-2 h-4 w-4" />
                                Histórico
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <CardTitle className="text-base">{veiculo.placa}</CardTitle>
                            <CardDescription className="text-xs">
                              {veiculo.marca} {veiculo.modelo}
                            </CardDescription>
                            <CardDescription className="text-xs font-medium">
                              KM: {
                                veiculo.kmAtual !== null && veiculo.kmAtual !== undefined && veiculo.kmAtual !== 0
                                  ? veiculo.kmAtual.toLocaleString('pt-BR') 
                                  : veiculo.kmAtual === 0
                                    ? "0"
                                    : "N/A"
                              }
                            </CardDescription>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            <Button 
                              variant="default" 
                              size="sm"
                              className="text-xs px-2 py-1 h-7"
                              onClick={() => abrirModalTrocaPneu(veiculo)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Nova Troca
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-grow">
                        {/* Rodízio de Pneus */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Disc className="h-3 w-3 text-muted-foreground" />
                              <Label className="text-xs font-medium">Rodízio</Label>
                              {getStatusIcon(progresso.rodizio.progresso)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {progresso.rodizio.progresso >= 100 ? (
                                <span className="text-red-500 font-semibold">Vencido!</span>
                              ) : progresso.rodizio.progresso >= 85 ? (
                                <span className="text-red-500 font-semibold">Atenção!</span>
                              ) : progresso.rodizio.kmRestante > 0 ? (
                                `${progresso.rodizio.kmRestante.toLocaleString('pt-BR')} km`
                              ) : (
                                "Sem histórico"
                              )}
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(100, progresso.rodizio.progresso)} 
                            className="h-2"
                            indicatorClassName={getProgressColor(progresso.rodizio.progresso)}
                          />
                          <div className="text-xs text-muted-foreground">
                            {progresso.rodizio.ultimaManutencao ? (
                              <>
                                Último: {progresso.rodizio.ultimaManutencao.data_troca 
                                  ? new Date(progresso.rodizio.ultimaManutencao.data_troca).toLocaleDateString('pt-BR') 
                                  : ''} • {progresso.rodizio.ultimaManutencao.km.toLocaleString('pt-BR')} km
                              </>
                            ) : (
                              "Sem histórico"
                            )}
                          </div>
                        </div>
                        
                        {/* Alinhamento */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Car className="h-3 w-3 text-muted-foreground" />
                              <Label className="text-xs font-medium">Alinhamento</Label>
                              {getStatusIcon(progresso.alinhamento.progresso)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {progresso.alinhamento.progresso >= 100 ? (
                                <span className="text-red-500 font-semibold">Vencido!</span>
                              ) : progresso.alinhamento.progresso >= 85 ? (
                                <span className="text-red-500 font-semibold">Atenção!</span>
                              ) : progresso.alinhamento.kmRestante > 0 ? (
                                `${progresso.alinhamento.kmRestante.toLocaleString('pt-BR')} km`
                              ) : (
                                "Sem histórico"
                              )}
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(100, progresso.alinhamento.progresso)} 
                            className="h-2"
                            indicatorClassName={getProgressColor(progresso.alinhamento.progresso)}
                          />
                          <div className="text-xs text-muted-foreground">
                            {progresso.alinhamento.ultimaManutencao ? (
                              <>
                                Último: {progresso.alinhamento.ultimaManutencao.data_troca 
                                  ? new Date(progresso.alinhamento.ultimaManutencao.data_troca).toLocaleDateString('pt-BR') 
                                  : ''} • {progresso.alinhamento.ultimaManutencao.km.toLocaleString('pt-BR')} km
                              </>
                            ) : (
                              "Sem histórico"
                            )}
                          </div>
                        </div>
                        
                        {/* Balanceamento */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Disc className="h-3 w-3 text-muted-foreground" />
                              <Label className="text-xs font-medium">Balanceamento</Label>
                              {getStatusIcon(progresso.balanceamento.progresso)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {progresso.balanceamento.progresso >= 100 ? (
                                <span className="text-red-500 font-semibold">Vencido!</span>
                              ) : progresso.balanceamento.progresso >= 85 ? (
                                <span className="text-red-500 font-semibold">Atenção!</span>
                              ) : progresso.balanceamento.kmRestante > 0 ? (
                                `${progresso.balanceamento.kmRestante.toLocaleString('pt-BR')} km`
                              ) : (
                                "Sem histórico"
                              )}
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(100, progresso.balanceamento.progresso)} 
                            className="h-2"
                            indicatorClassName={getProgressColor(progresso.balanceamento.progresso)}
                          />
                          <div className="text-xs text-muted-foreground">
                            {progresso.balanceamento.ultimaManutencao ? (
                              <>
                                Último: {progresso.balanceamento.ultimaManutencao.data_troca 
                                  ? new Date(progresso.balanceamento.ultimaManutencao.data_troca).toLocaleDateString('pt-BR') 
                                  : ''} • {progresso.balanceamento.ultimaManutencao.km.toLocaleString('pt-BR')} km
                              </>
                            ) : (
                              "Sem histórico"
                            )}
                          </div>
                        </div>
                      </CardContent>
                      
                      {/* Conteúdo expandido */}
                      {isExpandido && (
                        <CardContent className="pt-0 border-t mt-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Resumo Rodízio */}
                              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Disc className="h-4 w-4 text-muted-foreground" />
                                  <Label className="font-semibold">Rodízio de Pneus</Label>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Progresso:</span>
                                    <span className="font-medium">{progresso.rodizio.progresso.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">KM Restante:</span>
                                    <span className="font-medium">{progresso.rodizio.kmRestante.toLocaleString('pt-BR')} km</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Próxima Manutenção:</span>
                                    <span className="font-medium">{progresso.rodizio.proximaManutencao.toLocaleString('pt-BR')} km</span>
                                  </div>
                                  {progresso.rodizio.ultimaManutencao && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Última Manutenção:</span>
                                      <span className="font-medium">
                                        {progresso.rodizio.ultimaManutencao.km.toLocaleString('pt-BR')} km
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Resumo Alinhamento */}
                              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-muted-foreground" />
                                  <Label className="font-semibold">Alinhamento</Label>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Progresso:</span>
                                    <span className="font-medium">{progresso.alinhamento.progresso.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">KM Restante:</span>
                                    <span className="font-medium">{progresso.alinhamento.kmRestante.toLocaleString('pt-BR')} km</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Próxima Manutenção:</span>
                                    <span className="font-medium">{progresso.alinhamento.proximaManutencao.toLocaleString('pt-BR')} km</span>
                                  </div>
                                  {progresso.alinhamento.ultimaManutencao && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Última Manutenção:</span>
                                      <span className="font-medium">
                                        {progresso.alinhamento.ultimaManutencao.km.toLocaleString('pt-BR')} km
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Resumo Balanceamento */}
                              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Disc className="h-4 w-4 text-muted-foreground" />
                                  <Label className="font-semibold">Balanceamento</Label>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Progresso:</span>
                                    <span className="font-medium">{progresso.balanceamento.progresso.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">KM Restante:</span>
                                    <span className="font-medium">{progresso.balanceamento.kmRestante.toLocaleString('pt-BR')} km</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Próxima Manutenção:</span>
                                    <span className="font-medium">{progresso.balanceamento.proximaManutencao.toLocaleString('pt-BR')} km</span>
                                  </div>
                                  {progresso.balanceamento.ultimaManutencao && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Última Manutenção:</span>
                                      <span className="font-medium">
                                        {progresso.balanceamento.ultimaManutencao.km.toLocaleString('pt-BR')} km
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Últimas trocas de pneu */}
                            <div className="space-y-2">
                              <Label className="text-base font-semibold">Últimas Trocas de Pneu</Label>
                              {(() => {
                                const trocasVeiculo = trocasPneu
                                  .filter(t => t.veiculo_id === veiculo.id)
                                  .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())
                                  .slice(0, 5)
                                
                                if (trocasVeiculo.length === 0) {
                                  return (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      Nenhuma troca de pneu registrada
                                    </p>
                                  )
                                }
                                
                                return (
                                  <div className="space-y-2">
                                    {trocasVeiculo.map((troca) => (
                                      <div key={troca.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                        <div className="flex items-center gap-3">
                                          <div className="text-muted-foreground">
                                            {troca.data_troca ? new Date(troca.data_troca).toLocaleDateString('pt-BR') : 'Data não disponível'}
                                          </div>
                                          <div className="font-medium">
                                            {troca.km.toLocaleString('pt-BR')} km
                                          </div>
                                          {troca.tipo_pneu && (
                                            <div className="text-muted-foreground">
                                              {troca.tipo_pneu.marca} {troca.tipo_pneu.modelo}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex gap-1">
                                          {troca.alinhamento && (
                                            <Badge variant="outline" className="text-xs">Alinhamento</Badge>
                                          )}
                                          {troca.balanceamento && (
                                            <Badge variant="outline" className="text-xs">Balanceamento</Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </CardContent>
                      )}
                      
                      {/* Ícone de expandir/colapsar */}
                      <div className="absolute bottom-2 right-2">
                        {isExpandido ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </Card>
                    </div>
                  )
                })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
      
      {/* Dialog de Nova Troca de Pneu */}
      <Dialog open={dialogTrocaPneuOpen} onOpenChange={setDialogTrocaPneuOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Disc className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {trocaEditando ? "Editar Troca de Pneu" : "Nova Troca de Pneu"}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {veiculoSelecionado 
                    ? `${veiculoSelecionado.placa} • ${veiculoSelecionado.marca} ${veiculoSelecionado.modelo}`
                    : trocaEditando ? 'Edite os dados da troca de pneu' : 'Registre uma nova troca de pneu'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Informações do Veículo */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">KM Atual</Label>
                  <p className="text-sm font-semibold">
                    {veiculoSelecionado?.kmAtual ? veiculoSelecionado.kmAtual.toLocaleString('pt-BR') : 'N/A'} km
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">Última Troca</Label>
                  <p className="text-sm font-semibold">
                    {(() => {
                      const ultimaTroca = trocasPneu
                        .filter(t => t.veiculo_id === veiculoSelecionado?.id)
                        .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())[0]
                      return ultimaTroca ? `${ultimaTroca.km.toLocaleString('pt-BR')} km` : 'Nenhuma'
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quilometragem */}
            <div className="space-y-2">
              <Label htmlFor="km" className="text-sm font-semibold flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Quilometragem da Troca
              </Label>
              <Input 
                id="km" 
                type="number" 
                value={formTrocaPneu.km} 
                onChange={(e) => setFormTrocaPneu({...formTrocaPneu, km: e.target.value})} 
                placeholder={veiculoSelecionado?.kmAtual ? veiculoSelecionado.kmAtual.toLocaleString('pt-BR') : "Ex: 35000"}
                className="text-lg font-medium"
              />
              {veiculoSelecionado?.kmAtual && formTrocaPneu.km && Number(formTrocaPneu.km) > veiculoSelecionado.kmAtual && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  KM maior que o atual ({veiculoSelecionado.kmAtual.toLocaleString('pt-BR')} km)
                </p>
              )}
            </div>
            
            {/* Tipo de Pneu */}
            <div className="space-y-2">
              <Label htmlFor="tipo_pneu" className="text-sm font-semibold flex items-center gap-2">
                <Disc className="h-4 w-4" />
                Tipo de Pneu
              </Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 justify-start"
                  onClick={() => setDialogProdutoOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {formTrocaPneu.tipo_pneu_nome || "Selecionar produto do estoque"}
                </Button>
                {formTrocaPneu.tipo_pneu_nome && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{formTrocaPneu.tipo_pneu_nome}</p>
                      <p className="text-xs text-muted-foreground">Produto selecionado do estoque</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setFormTrocaPneu({...formTrocaPneu, tipo_pneu_nome: "", tipo_pneu_id: ""})}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Posições */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Posições dos Pneus Trocados</Label>
              <div className="grid grid-cols-2 gap-3">
                <label 
                  htmlFor="posicao-dianteira-esquerda"
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formTrocaPneu.posicoes.includes("dianteira-esquerda") 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox 
                    id="posicao-dianteira-esquerda"
                    checked={formTrocaPneu.posicoes.includes("dianteira-esquerda")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "dianteira-esquerda"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "dianteira-esquerda")
                        });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor="posicao-dianteira-esquerda" className="cursor-pointer font-medium">Dianteira Esquerda</Label>
                  </div>
                </label>
                <label 
                  htmlFor="posicao-dianteira-direita"
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formTrocaPneu.posicoes.includes("dianteira-direita") 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox 
                    id="posicao-dianteira-direita"
                    checked={formTrocaPneu.posicoes.includes("dianteira-direita")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "dianteira-direita"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "dianteira-direita")
                        });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor="posicao-dianteira-direita" className="cursor-pointer font-medium">Dianteira Direita</Label>
                  </div>
                </label>
                <label 
                  htmlFor="posicao-traseira-esquerda"
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formTrocaPneu.posicoes.includes("traseira-esquerda") 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox 
                    id="posicao-traseira-esquerda"
                    checked={formTrocaPneu.posicoes.includes("traseira-esquerda")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "traseira-esquerda"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "traseira-esquerda")
                        });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor="posicao-traseira-esquerda" className="cursor-pointer font-medium">Traseira Esquerda</Label>
                  </div>
                </label>
                <label 
                  htmlFor="posicao-traseira-direita"
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formTrocaPneu.posicoes.includes("traseira-direita") 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox 
                    id="posicao-traseira-direita"
                    checked={formTrocaPneu.posicoes.includes("traseira-direita")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "traseira-direita"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "traseira-direita")
                        });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor="posicao-traseira-direita" className="cursor-pointer font-medium">Traseira Direita</Label>
                  </div>
                </label>
                <label 
                  htmlFor="posicao-estepe"
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all col-span-2 ${
                    formTrocaPneu.posicoes.includes("estepe") 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox 
                    id="posicao-estepe"
                    checked={formTrocaPneu.posicoes.includes("estepe")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: [...formTrocaPneu.posicoes, "estepe"]
                        });
                      } else {
                        setFormTrocaPneu({
                          ...formTrocaPneu,
                          posicoes: formTrocaPneu.posicoes.filter(p => p !== "estepe")
                        });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor="posicao-estepe" className="cursor-pointer font-medium">Estepe</Label>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Serviços Adicionais */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Serviços Adicionais
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <label 
                  htmlFor="rodizio"
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    formTrocaPneu.rodizio 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox 
                    id="rodizio"
                    checked={formTrocaPneu.rodizio}
                    onCheckedChange={(checked) => 
                      setFormTrocaPneu({...formTrocaPneu, rodizio: checked as boolean})
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="rodizio" className="cursor-pointer font-medium">Rodízio</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Troca de posição</p>
                  </div>
                </label>
                <label 
                  htmlFor="alinhamento"
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    formTrocaPneu.alinhamento 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox 
                    id="alinhamento"
                    checked={formTrocaPneu.alinhamento}
                    onCheckedChange={(checked) => 
                      setFormTrocaPneu({...formTrocaPneu, alinhamento: checked as boolean})
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="alinhamento" className="cursor-pointer font-medium">Alinhamento</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Ajuste de geometria</p>
                  </div>
                </label>
                <label 
                  htmlFor="balanceamento"
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    formTrocaPneu.balanceamento 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox 
                    id="balanceamento"
                    checked={formTrocaPneu.balanceamento}
                    onCheckedChange={(checked) => 
                      setFormTrocaPneu({...formTrocaPneu, balanceamento: checked as boolean})
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="balanceamento" className="cursor-pointer font-medium">Balanceamento</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Equilíbrio dos pneus</p>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="observacao" className="text-sm font-semibold">Observações</Label>
              <Textarea 
                id="observacao" 
                value={formTrocaPneu.observacao} 
                onChange={(e) => setFormTrocaPneu({...formTrocaPneu, observacao: e.target.value})} 
                placeholder="Adicione observações sobre a troca (opcional)"
                className="min-h-[80px] resize-none"
              />
            </div>
            
            {/* Campos de período - aparecem condicionalmente */}
            {(formTrocaPneu.rodizio || formTrocaPneu.alinhamento || formTrocaPneu.balanceamento) && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Períodos de Manutenção (em km)</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Configure quando será a próxima manutenção de cada serviço
                </p>
              
              {formTrocaPneu.rodizio && (
                <div className="space-y-2">
                  <Label htmlFor="periodo_rodizio" className="text-sm">
                    Período para próximo rodízio
                  </Label>
                  <Input 
                    id="periodo_rodizio" 
                    type="number" 
                    value={formTrocaPneu.periodo_rodizio} 
                    onChange={(e) => setFormTrocaPneu({...formTrocaPneu, periodo_rodizio: e.target.value})} 
                    placeholder="10000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Próxima troca de posição será em {Number(formTrocaPneu.periodo_rodizio || 0).toLocaleString('pt-BR')} km
                  </p>
                </div>
              )}
              
              {formTrocaPneu.alinhamento && (
                <div className="space-y-2">
                  <Label htmlFor="periodo_alinhamento" className="text-sm">
                    Período para próximo alinhamento
                  </Label>
                  <Input 
                    id="periodo_alinhamento" 
                    type="number" 
                    value={formTrocaPneu.periodo_alinhamento} 
                    onChange={(e) => setFormTrocaPneu({...formTrocaPneu, periodo_alinhamento: e.target.value})} 
                    placeholder="10000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Próximo alinhamento será em {Number(formTrocaPneu.periodo_alinhamento || 0).toLocaleString('pt-BR')} km
                  </p>
                </div>
              )}
              
              {formTrocaPneu.balanceamento && (
                <div className="space-y-2">
                  <Label htmlFor="periodo_balanceamento" className="text-sm">
                    Período para próximo balanceamento
                  </Label>
                  <Input 
                    id="periodo_balanceamento" 
                    type="number" 
                    value={formTrocaPneu.periodo_balanceamento} 
                    onChange={(e) => setFormTrocaPneu({...formTrocaPneu, periodo_balanceamento: e.target.value})} 
                    placeholder="10000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Próximo balanceamento será em {Number(formTrocaPneu.periodo_balanceamento || 0).toLocaleString('pt-BR')} km
                  </p>
                </div>
              )}
              </div>
            )}
            
            {/* Validação visual */}
            <div className="space-y-2">
              {formTrocaPneu.posicoes.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Selecione pelo menos uma posição de pneu</span>
                  </div>
                </div>
              )}
              {!formTrocaPneu.tipo_pneu_id && !formTrocaPneu.tipo_pneu_nome && !formTrocaPneu.observacao?.trim() && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Selecione um produto do estoque ou informe uma observação</span>
                  </div>
                </div>
              )}
              {!formTrocaPneu.km && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Informe a quilometragem da troca</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogTrocaPneuOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={registrarTrocaPneu} 
              disabled={loading || formTrocaPneu.posicoes.length === 0 || (!formTrocaPneu.tipo_pneu_id && !formTrocaPneu.tipo_pneu_nome && !formTrocaPneu.observacao?.trim()) || !formTrocaPneu.km}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {trocaEditando ? 'Atualizando...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {trocaEditando ? 'Atualizar Troca' : 'Salvar Troca'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Seleção de Produto do Estoque */}
      <SelecionarProdutoDialog
        open={dialogProdutoOpen}
        onOpenChange={setDialogProdutoOpen}
        onSelect={(produto: Produto) => {
          // Capturar apenas o nome do produto
          setFormTrocaPneu({
            ...formTrocaPneu,
            tipo_pneu_nome: produto.descricao,
            tipo_pneu_id: "" // Limpar tipo de pneu cadastrado se houver
          })
        }}
      />
      
      <Dialog open={dialogTipoPneuOpen} onOpenChange={setDialogTipoPneuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Tipo de Pneu</DialogTitle>
            <DialogDescription>
              {formTipoPneu.id ? "Edite os dados do tipo de pneu" : "Adicione um novo tipo de pneu ao sistema"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input 
                  id="marca" 
                  value={formTipoPneu.marca} 
                  onChange={(e) => setFormTipoPneu({...formTipoPneu, marca: e.target.value})} 
                  placeholder="Ex: Pirelli"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input 
                  id="modelo" 
                  value={formTipoPneu.modelo} 
                  onChange={(e) => setFormTipoPneu({...formTipoPneu, modelo: e.target.value})} 
                  placeholder="Ex: Scorpion"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medida">Medida</Label>
              <Input 
                id="medida" 
                value={formTipoPneu.medida} 
                onChange={(e) => setFormTipoPneu({...formTipoPneu, medida: e.target.value})} 
                placeholder="Ex: 215/65 R16"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ativo"
                checked={formTipoPneu.ativo}
                onCheckedChange={(checked) => setFormTipoPneu({...formTipoPneu, ativo: checked as boolean})}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTipoPneuOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarTipoPneu} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogHistoricoOpen} onOpenChange={setDialogHistoricoOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Histórico de Troca de Pneus</DialogTitle>
                <DialogDescription className="text-base">
                  {veiculoSelecionado?.placa} • {veiculoSelecionado?.marca} {veiculoSelecionado?.modelo}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : historicoVeiculo.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Disc className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum registro encontrado</p>
                <p className="text-sm">Este veículo ainda não possui trocas de pneu registradas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicoVeiculo.map((troca) => (
                  <Card key={troca.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {troca.data_troca ? new Date(troca.data_troca).toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                }) : 'Data não disponível'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Gauge className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{troca.km.toLocaleString('pt-BR')} km</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">Tipo de Pneu</Label>
                              <p className="text-sm">
                                {troca.tipo_pneu ? 
                                  `${troca.tipo_pneu.marca} ${troca.tipo_pneu.modelo} - ${troca.tipo_pneu.medida}` : 
                                  troca.observacao?.includes('Produto:') 
                                    ? troca.observacao.split(' - ')[0].replace('Produto:', '').trim()
                                    : "Não especificado"}
                              </p>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">Posições Trocadas</Label>
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(troca.posicoes) && troca.posicoes.length > 0 ? troca.posicoes.map((posicao) => (
                                  <Badge key={posicao} variant="outline" className="text-xs">
                                    {posicao
                                      .replace("dianteira-esquerda", "Diant. Esq.")
                                      .replace("dianteira-direita", "Diant. Dir.")
                                      .replace("traseira-esquerda", "Tras. Esq.")
                                      .replace("traseira-direita", "Tras. Dir.")
                                      .replace("estepe", "Estepe")
                                    }
                                  </Badge>
                                )) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </div>
                            </div>
                            
                            {(troca.rodizio || troca.alinhamento || troca.balanceamento) && (
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Serviços Adicionais</Label>
                                <div className="flex flex-wrap gap-1">
                                  {troca.rodizio && <Badge variant="secondary" className="text-xs">Rodízio</Badge>}
                                  {troca.alinhamento && <Badge variant="secondary" className="text-xs">Alinhamento</Badge>}
                                  {troca.balanceamento && <Badge variant="secondary" className="text-xs">Balanceamento</Badge>}
                                </div>
                              </div>
                            )}
                            
                            {troca.observacao && !troca.observacao.includes('Produto:') && (
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Observação</Label>
                                <p className="text-sm text-muted-foreground">{troca.observacao}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDialogHistoricoOpen(false)
                              carregarTrocaParaEdicao(troca)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTrocaExcluindo(troca)
                              setDialogExcluirOpen(true)
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogHistoricoOpen(false)}>
              Fechar
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                if (veiculoSelecionado) {
                  await abrirHistorico(veiculoSelecionado)
                }
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmation
        open={dialogExcluirOpen}
        onOpenChange={setDialogExcluirOpen}
        onConfirm={() => {
          if (trocaExcluindo) {
            excluirTrocaPneu(trocaExcluindo)
          }
        }}
        title="Excluir Troca de Pneu"
        description={`Tem certeza que deseja excluir a troca de pneu registrada em ${trocaExcluindo?.data_troca ? new Date(trocaExcluindo.data_troca).toLocaleDateString('pt-BR') : 'data desconhecida'}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
      
      {/* Modal de comparação de veículos */}
      <Dialog open={dialogComparacaoOpen} onOpenChange={setDialogComparacaoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparar Rendimento entre Veículos</DialogTitle>
            <DialogDescription>
              Compare dois veículos para analisar o rendimento dos pneus com e sem serviços de alinhamento e balanceamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="veiculo1">Veículo 1</Label>
                <Button 
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => abrirModalSelecaoVeiculo('veiculo1')}
                >
                  {veiculosComparacao.veiculo1 
                    ? getVeiculoSelecionadoTexto(veiculosComparacao.veiculo1) 
                    : "Selecione um veículo"}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="veiculo2">Veículo 2</Label>
                <Button 
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => abrirModalSelecaoVeiculo('veiculo2')}
                >
                  {veiculosComparacao.veiculo2 
                    ? getVeiculoSelecionadoTexto(veiculosComparacao.veiculo2) 
                    : "Selecione um veículo"}
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={compararVeiculos}
                disabled={carregandoComparacao || !veiculosComparacao.veiculo1 || !veiculosComparacao.veiculo2 || veiculosComparacao.veiculo1 === veiculosComparacao.veiculo2}
              >
                {carregandoComparacao ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Comparando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Comparar
                  </>
                )}
              </Button>
            </div>
            
            {resultadoComparacao && resultadoComparacao.veiculo1 && resultadoComparacao.veiculo2 && (
              <>
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Resultado da Comparação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-2">
                          {resultadoComparacao.veiculo1.placa} - {resultadoComparacao.veiculo1.modelo}
                        </h3>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Serviços:</span> {resultadoComparacao.veiculo1.comServicos ? "Com alinhamento/balanceamento" : "Sem alinhamento/balanceamento"}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Total de trocas:</span> {resultadoComparacao.veiculo1.totalTrocas}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Km percorrido:</span> {resultadoComparacao.veiculo1.kmPercorrido.toLocaleString('pt-BR')} km
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Média de km por troca:</span> {resultadoComparacao.veiculo1.kmMediaPorTroca.toLocaleString('pt-BR')} km
                        </p>
                      </div>
                      
                      <div className="border p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-2">
                          {resultadoComparacao.veiculo2.placa} - {resultadoComparacao.veiculo2.modelo}
                        </h3>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Serviços:</span> {resultadoComparacao.veiculo2.comServicos ? "Com alinhamento/balanceamento" : "Sem alinhamento/balanceamento"}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Total de trocas:</span> {resultadoComparacao.veiculo2.totalTrocas}
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Km percorrido:</span> {resultadoComparacao.veiculo2.kmPercorrido.toLocaleString('pt-BR')} km
                        </p>
                        <p className="text-sm mb-1">
                          <span className="font-medium">Média de km por troca:</span> {resultadoComparacao.veiculo2.kmMediaPorTroca.toLocaleString('pt-BR')} km
                        </p>
                      </div>
                    </div>
                    
                    {resultadoComparacao.veiculoMelhor && (
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-lg font-semibold mb-2">Conclusão</h3>
                        <p>
                          O veículo <span className="font-bold">{resultadoComparacao.veiculoMelhor}</span> teve um rendimento aproximadamente{' '}
                          <span className="font-bold">{resultadoComparacao.diferencaPercentual.toFixed(2)}%</span> melhor.
                        </p>
                        <p className="mt-2">
                          {(resultadoComparacao.veiculo1.comServicos && resultadoComparacao.veiculoMelhor === resultadoComparacao.veiculo1.placa) || 
                           (resultadoComparacao.veiculo2.comServicos && resultadoComparacao.veiculoMelhor === resultadoComparacao.veiculo2.placa) 
                            ? "Isto sugere que realizar alinhamento e balanceamento contribui para um maior rendimento dos pneus." 
                            : "Não foi possível confirmar neste caso que o alinhamento e balanceamento contribuem para um maior rendimento dos pneus."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Adicionar visualização gráfica */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Comparação Gráfica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-64">
                      <canvas ref={chartRef}></canvas>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        onClick={gerarPDFComparacao}
                        disabled={geradorPdfLoading}
                      >
                        {geradorPdfLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando PDF...
                          </>
                        ) : (
                          <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar para PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogComparacaoOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de seleção de veículo */}
      <Dialog open={dialogVeiculoOpen} onOpenChange={setDialogVeiculoOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Veículo</DialogTitle>
            <DialogDescription>
              Selecione um veículo para {veiculoSelectionTarget === 'veiculo1' ? 'o primeiro' : 'o segundo'} item da comparação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="relative">
                <Input 
                  id="veiculoSearch" 
                  value={veiculoSearchTerm} 
                  onChange={(e) => setVeiculoSearchTerm(e.target.value)} 
                  placeholder="Buscar por placa, modelo ou marca..."
                  className="pr-10"
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              {veiculosFiltradosSelecao.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum veículo encontrado
                </div>
              ) : (
                <div className="divide-y">
                  {veiculosFiltradosSelecao.map((veiculo) => (
                    <div 
                      key={veiculo.id}
                      className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center"
                      onClick={() => selecionarVeiculo(veiculo)}
                    >
                      <div>
                        <div className="font-medium">{veiculo.placa}</div>
                        <div className="text-sm text-muted-foreground">{veiculo.modelo} {veiculo.marca}</div>
                      </div>
                      {((veiculoSelectionTarget === 'veiculo1' && veiculosComparacao.veiculo1 === veiculo.id) || 
                        (veiculoSelectionTarget === 'veiculo2' && veiculosComparacao.veiculo2 === veiculo.id)) && (
                        <Badge className="ml-2">Selecionado</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVeiculoOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Visualização */}
      <Dialog open={dialogVisualizarOpen} onOpenChange={setDialogVisualizarOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Visualização - {veiculoVisualizacao?.placa} {veiculoVisualizacao?.marca} {veiculoVisualizacao?.modelo}
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre lançamentos, observações e pneus utilizados
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="lancamentos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
              <TabsTrigger value="pneus">Pneus Usados</TabsTrigger>
            </TabsList>
            
            {/* Aba de Lançamentos */}
            <TabsContent value="lancamentos" className="space-y-4 mt-4">
              <div className="space-y-2">
                {veiculoVisualizacao ? (
                  (() => {
                    const lancamentos = trocasPneu.filter(t => t.veiculo_id === veiculoVisualizacao.id)
                    return lancamentos.length > 0 ? (
                      <div className="space-y-3">
                        {lancamentos
                          .sort((a, b) => new Date(b.data_troca).getTime() - new Date(a.data_troca).getTime())
                          .map((troca) => (
                            <Card key={troca.id}>
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <CardTitle className="text-sm">
                                      {troca.data_troca ? new Date(troca.data_troca).toLocaleDateString('pt-BR') : 'Data não disponível'}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                      KM: {troca.km.toLocaleString('pt-BR')}
                                    </CardDescription>
                                  </div>
                                  <div className="flex gap-1 flex-wrap">
                                    {troca.alinhamento && (
                                      <Badge variant="outline" className="text-xs">Alinhamento</Badge>
                                    )}
                                    {troca.balanceamento && (
                                      <Badge variant="outline" className="text-xs">Balanceamento</Badge>
                                    )}
                                    {troca.posicoes && troca.posicoes.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {troca.posicoes.length} posição(ões)
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                {troca.tipo_pneu && (
                                  <div className="text-xs text-muted-foreground mb-2">
                                    <strong>Pneu:</strong> {troca.tipo_pneu.marca} {troca.tipo_pneu.modelo} - {troca.tipo_pneu.medida}
                                  </div>
                                )}
                                {troca.observacao && (
                                  <div className="text-xs text-muted-foreground">
                                    <strong>Observação:</strong> {troca.observacao}
                                  </div>
                                )}
                                {troca.posicoes && troca.posicoes.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    <strong>Posições:</strong> {troca.posicoes.join(', ')}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum lançamento encontrado
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecione um veículo para visualizar
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Aba de Observações */}
            <TabsContent value="observacoes" className="space-y-4 mt-4">
              <div className="space-y-2">
                {observacoesVeiculo.length > 0 ? (
                  <div className="space-y-3">
                    {observacoesVeiculo.map((obs) => (
                      <Card key={obs.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">
                            {obs.data_observacao ? new Date(obs.data_observacao).toLocaleDateString('pt-BR') : 'Data não disponível'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {obs.observacao}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma observação encontrada
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Aba de Pneus Usados */}
            <TabsContent value="pneus" className="space-y-4 mt-4">
              <div className="space-y-2">
                {veiculoVisualizacao ? (
                  (() => {
                    const lancamentos = trocasPneu.filter(t => t.veiculo_id === veiculoVisualizacao.id)
                    const pneusUsados = new Map<string, {
                      tipo: TrocaPneu['tipo_pneu']
                      quantidade: number
                      ultimaTroca: string
                      kmUltimaTroca: number
                    }>()
                    
                    lancamentos.forEach(troca => {
                      if (troca.tipo_pneu) {
                        const key = troca.tipo_pneu.id
                        const existente = pneusUsados.get(key)
                        const novaQuantidade = (existente?.quantidade || 0) + 1
                        const dataMaisRecente = !existente || new Date(troca.data_troca) > new Date(existente.ultimaTroca)
                          ? troca.data_troca
                          : existente.ultimaTroca
                        const kmMaisRecente = !existente || new Date(troca.data_troca) > new Date(existente.ultimaTroca)
                          ? troca.km
                          : existente.kmUltimaTroca
                        
                        pneusUsados.set(key, {
                          tipo: troca.tipo_pneu,
                          quantidade: novaQuantidade,
                          ultimaTroca: dataMaisRecente,
                          kmUltimaTroca: kmMaisRecente
                        })
                      }
                    })
                    
                    const pneusArray = Array.from(pneusUsados.values())
                    
                    return pneusArray.length > 0 ? (
                      <div className="space-y-3">
                        {pneusArray.map((pneu, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">
                                {pneu.tipo.marca} {pneu.tipo.modelo}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Medida: {pneu.tipo.medida}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div>
                                  <strong>Quantidade de trocas:</strong> {pneu.quantidade}
                                </div>
                                <div>
                                  <strong>Última troca:</strong> {new Date(pneu.ultimaTroca).toLocaleDateString('pt-BR')}
                                </div>
                                <div>
                                  <strong>KM da última troca:</strong> {pneu.kmUltimaTroca.toLocaleString('pt-BR')} km
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum pneu registrado
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecione um veículo para visualizar
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVisualizarOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}