"use client"

import { useState, useEffect, type Dispatch, type SetStateAction } from "react"
import { getVeiculosSupabase, updateVeiculoSupabase } from "@/services/veiculo-service"
import { 
  getTrocasOleo, 
  registrarTrocaOleo, 
  atualizarKmVeiculo, 
  getEstatisticasTrocasOleo,
  TrocaOleo 
} from "@/services/troca-oleo-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Trash2, CheckCircle, AlertCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, History, Gauge, Calendar, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useAuth } from "@/lib/auth-context"

interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  kmAtual?: number
  periodoTrocaOleo?: number
  periodotrocaoleo?: number
}

interface VeiculoComDados extends Veiculo {
  ultimaTroca: TrocaOleo | null
  kmAtual: number
  kmProxTroca: number
  progresso: number
}

// Definir tipos para ordenação
type SortColumn = 'veiculo' | 'kmAtual' | 'kmProxTroca' | 'progresso'
type SortDirection = 'asc' | 'desc' | null

export default function TrocaOleoPage() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [veiculosComDados, setVeiculosComDados] = useState<VeiculoComDados[]>([])
  const [veiculosFiltrados, setVeiculosFiltrados] = useState<VeiculoComDados[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [atualizarKmDialogOpen, setAtualizarKmDialogOpen] = useState(false)
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoComDados | null>(null)
  const [kmAtual, setKmAtual] = useState("")
  const [kmProxTroca, setKmProxTroca] = useState("")
  const [observacao, setObservacao] = useState("")
  const [dataInput, setDataInput] = useState("")
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false)
  const [historicoVeiculo, setHistoricoVeiculo] = useState<TrocaOleo[]>([])
  const [usuariosMap, setUsuariosMap] = useState<Map<string, string>>(new Map())
  const [confirmacaoExclusaoAberta, setConfirmacaoExclusaoAberta] = useState(false)
  const [registroParaExcluir, setRegistroParaExcluir] = useState<TrocaOleo | null>(null)
  // Estados para ordenação
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  // Estados para verificação de senha de administrador
  const [senhaDialogOpen, setSenhaDialogOpen] = useState(false)
  const [senhaInput, setSenhaInput] = useState("")
  const [senhaErro, setSenhaErro] = useState(false)
  const [veiculoAguardandoSenha, setVeiculoAguardandoSenha] = useState<VeiculoComDados | null>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    carregarVeiculos()
  }, [])

  // Listener para atualizar histórico quando houver atualizações
  useEffect(() => {
    const recarregarHistorico = async () => {
      if (historicoDialogOpen && veiculoSelecionado) {
        try {
          const historico = await getTrocasOleo(veiculoSelecionado.id)
          setHistoricoVeiculo(historico)
          await carregarNomesUsuarios(historico)
        } catch (error) {
          console.error("Erro ao recarregar histórico:", error)
        }
      }
    }

    const handleVeiculoAtualizado = async (event?: CustomEvent) => {
      await recarregarHistorico()
    }

    // Listener para eventos customizados
    window.addEventListener('veiculo-atualizado', handleVeiculoAtualizado as EventListener)
    
    // Listener para mudanças no localStorage (atualizações em outras abas)
    const handleStorageChange = async (e: StorageEvent) => {
      if ((e.key === 'troca-oleo-registrada' || e.key === 'veiculo-km-atualizado') && historicoDialogOpen && veiculoSelecionado) {
        await recarregarHistorico()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Polling para verificar mudanças no localStorage (mesma aba)
    const interval = setInterval(async () => {
      if (historicoDialogOpen && veiculoSelecionado) {
        const lastUpdate = localStorage.getItem('last-veiculo-update')
        if (lastUpdate) {
          const lastUpdateTime = parseInt(lastUpdate)
          const now = Date.now()
          // Se a atualização foi há menos de 5 segundos, atualizar
          if (now - lastUpdateTime < 5000) {
            await recarregarHistorico()
          }
        }
      }
    }, 2000) // Verificar a cada 2 segundos

    return () => {
      window.removeEventListener('veiculo-atualizado', handleVeiculoAtualizado as EventListener)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historicoDialogOpen, veiculoSelecionado])
  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setVeiculosFiltrados(ordenarVeiculos(veiculosComDados))
      return
    }
    
    const termoBusca = searchTerm.toLowerCase().trim()
    const resultados = veiculosComDados.filter(veiculo => 
      veiculo.placa.toLowerCase().includes(termoBusca) ||
      veiculo.modelo.toLowerCase().includes(termoBusca) ||
      veiculo.marca.toLowerCase().includes(termoBusca)
    )
    
    setVeiculosFiltrados(ordenarVeiculos(resultados))
  }, [searchTerm, veiculosComDados, sortColumn, sortDirection])
  
  useEffect(() => {
    const hoje = new Date()
    const dia = hoje.getDate().toString().padStart(2, "0")
    const mes = (hoje.getMonth() + 1).toString().padStart(2, "0")
    const ano = hoje.getFullYear()
    setDataInput(`${dia}/${mes}/${ano}`)
  }, [])

  // Função para ordenar veículos com base na coluna e direção selecionadas
  const ordenarVeiculos = (veiculos: VeiculoComDados[]): VeiculoComDados[] => {
    if (!sortColumn || !sortDirection) {
      return veiculos
    }

    return [...veiculos].sort((a, b) => {
      let comparacao = 0
      
      switch (sortColumn) {
        case 'veiculo':
          comparacao = a.placa.localeCompare(b.placa)
          break
        case 'kmAtual':
          comparacao = a.kmAtual - b.kmAtual
          break
        case 'kmProxTroca':
          comparacao = a.kmProxTroca - b.kmProxTroca
          break
        case 'progresso':
          comparacao = a.progresso - b.progresso
          break
      }
      
      return sortDirection === 'asc' ? comparacao : -comparacao
    })
  }

  // Função para alternar a ordenação quando um cabeçalho é clicado
  const alternarOrdenacao = (coluna: SortColumn) => {
    if (sortColumn === coluna) {
      // Se a mesma coluna for clicada, alterne a direção ou redefina
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      // Se uma nova coluna for clicada, defina-a como ascendente
      setSortColumn(coluna)
      setSortDirection('asc')
    }
  }

  // Função para renderizar o ícone de ordenação
  const renderSortIcon = (coluna: SortColumn) => {
    if (sortColumn !== coluna) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    
    return <ArrowDown className="ml-2 h-4 w-4" />
  }
  
  async function carregarVeiculos() {
    setLoading(true)
    try {
      // Buscar todos os veículos diretamente do banco para obter o periodotrocaoleo
      const { data: veiculosData, error } = await supabase
        .from("veiculos")
        .select("*")
        .order("placa")
      
      if (error) throw error
      
      setVeiculos(veiculosData || [])
      
      // Buscar dados de troca de óleo para cada veículo
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
      
      const veiculosProcessados = await Promise.all(veiculosPromises)
      setVeiculosComDados(veiculosProcessados)
      setVeiculosFiltrados(ordenarVeiculos(veiculosProcessados))
    } catch (error) {
      console.error("Erro ao carregar veículos:", error)
    } finally {
      setLoading(false)
    }
  }
  
  async function registrarTrocaOleoAction() {
    if (!veiculoSelecionado || !kmAtual || !kmProxTroca) return
    
    // Senha já foi verificada antes de abrir o diálogo, então pode executar diretamente
    await executarRegistroTrocaOleo()
  }

  async function executarRegistroTrocaOleo() {
    if (!veiculoSelecionado || !kmAtual || !kmProxTroca) return
    
    if (!validarData(dataInput)) {
      toast({
        title: "Data inválida",
        description: "Por favor, insira uma data válida no formato DD/MM/AAAA",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      const dataISO = toISODate(dataInput)
      
      const dadosTroca = {
        veiculo_id: veiculoSelecionado.id,
        data_troca: dataISO,
        km_anterior: veiculoSelecionado.kmAtual,
        km_atual: Number(kmAtual),
        km_proxima_troca: Number(kmProxTroca),
        tipo_servico: "Troca de Óleo",
        observacao: observacao || undefined
      }
      
      console.log("Tentando registrar troca de óleo:", dadosTroca)
      
      const { data, error } = await supabase
        .from("trocas_oleo")
        .insert([{
          veiculo_id: veiculoSelecionado.id,
          data_troca: dataISO,
          km_anterior: Number(veiculoSelecionado.kmAtual),
          km_atual: Number(kmAtual),
          km_proxima_troca: Number(kmProxTroca),
          tipo_servico: "Troca de Óleo",
          observacao: observacao || null,
          user_id: user?.id || null
        }])
        .select()
      
      if (error) {
        console.error("Erro SQL ao registrar troca:", error)
        toast({
          variant: "destructive",
          title: "Erro ao registrar troca",
          description: error.message,
          duration: 5000,
        })
        throw error
      }
      
      console.log("Troca registrada com sucesso:", data)
      
      toast({
        title: "Troca de óleo registrada",
        description: "Registro efetuado com sucesso",
        duration: 3000,
        className: "bg-green-50 border-green-200 text-green-900",
      })
      
      setKmAtual("")
      setKmProxTroca("")
      setObservacao("")
      setDialogOpen(false)
      
      // Disparar eventos para notificar outras páginas da atualização
      window.dispatchEvent(new CustomEvent('veiculo-atualizado', { 
        detail: { veiculoId: veiculoSelecionado.id } 
      }))
      
      // Usar localStorage para notificar outras abas
      localStorage.setItem('troca-oleo-registrada', JSON.stringify({
        veiculoId: veiculoSelecionado.id,
        timestamp: Date.now()
      }))
      localStorage.removeItem('troca-oleo-registrada') // Remove imediatamente para disparar o evento storage
      
      await carregarVeiculos()
    } catch (error) {
      console.error("Erro ao registrar troca de óleo:", error)
      toast({
        variant: "destructive",
        title: "Erro ao registrar troca",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function atualizarKmAction() {
    if (!veiculoSelecionado || !kmAtual) return
    
    try {
      setLoading(true)
      
      const kmAtualNum = Number(kmAtual)
      
      // Primeiro, atualizar o campo kmAtual na tabela veiculos
      const { error: errorVeiculo } = await supabase
        .from("veiculos")
        .update({ 
          kmAtual: kmAtualNum 
        })
        .eq("id", veiculoSelecionado.id)
      
      if (errorVeiculo) {
        console.error("Erro ao atualizar kmAtual no veículo:", errorVeiculo)
        toast({
          variant: "destructive",
          title: "Erro ao atualizar quilometragem do veículo",
          description: errorVeiculo.message,
          duration: 5000,
        })
        throw errorVeiculo
      }
      
      // Depois, inserir registro na tabela trocas_oleo
      const { data, error } = await supabase
        .from("trocas_oleo")
        .insert([{
          veiculo_id: veiculoSelecionado.id,
          data_troca: new Date().toISOString(),
          km_anterior: Number(veiculoSelecionado.kmAtual),
          km_atual: kmAtualNum,
          km_proxima_troca: Number(veiculoSelecionado.kmProxTroca),
          tipo_servico: "Atualização de Km",
          observacao: observacao || "Atualização de quilometragem",
          user_id: user?.id || null
        }])
        .select()
      
      if (error) {
        console.error("Erro SQL ao atualizar km:", error)
        toast({
          variant: "destructive",
          title: "Erro ao registrar atualização de km",
          description: error.message,
          duration: 5000,
        })
        throw error
      }
      
      console.log("Km atualizado com sucesso:", data)
      
      toast({
        title: "Quilometragem atualizada",
        description: "Atualização efetuada com sucesso",
        duration: 3000,
        className: "bg-green-50 border-green-200 text-green-900",
      })
      
      setKmAtual("")
      setObservacao("")
      setAtualizarKmDialogOpen(false)
      
      // Disparar eventos para notificar outras páginas da atualização
      window.dispatchEvent(new CustomEvent('veiculo-atualizado', { 
        detail: { veiculoId: veiculoSelecionado.id, kmAtual: Number(kmAtual) } 
      }))
      
      // Usar localStorage para notificar outras abas E mesma aba
      const updateData = {
        veiculoId: veiculoSelecionado.id,
        kmAtual: Number(kmAtual),
        timestamp: Date.now()
      }
      
      localStorage.setItem('veiculo-km-atualizado', JSON.stringify(updateData))
      localStorage.setItem('last-veiculo-update', Date.now().toString())
      
      // Remover após um delay para disparar evento storage em outras abas
      setTimeout(() => {
        localStorage.removeItem('veiculo-km-atualizado')
      }, 100)
      
      await carregarVeiculos()
    } catch (error) {
      console.error("Erro ao atualizar km:", error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar quilometragem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }
  
  function calcularProximaTroca(kmAtualValue: string, veiculo: VeiculoComDados): string {
    if (!kmAtualValue) return ""
    
    const periodoTroca = veiculo.periodotrocaoleo || veiculo.periodoTrocaOleo || 5000
    
    return (Number(kmAtualValue) + periodoTroca).toString()
  }

  function abrirDialogTrocaOleo(veiculo: VeiculoComDados) {
    // Pedir senha antes de abrir o diálogo
    setVeiculoAguardandoSenha(veiculo)
    setSenhaDialogOpen(true)
  }
  
  function abrirDialogTrocaOleoAposSenha(veiculo: VeiculoComDados) {
    setVeiculoSelecionado(veiculo)
    
    const kmAtualInicial = veiculo.kmAtual.toString()
    setKmAtual(kmAtualInicial)
    
    setKmProxTroca(calcularProximaTroca(kmAtualInicial, veiculo))
    
    setDialogOpen(true)
  }

  function abrirDialogAtualizarKm(veiculo: VeiculoComDados) {
    setVeiculoSelecionado(veiculo)
    setKmAtual(veiculo.kmAtual.toString())
    setAtualizarKmDialogOpen(true)
  }

  // Função auxiliar para carregar nomes dos usuários
  async function carregarNomesUsuarios(historico: TrocaOleo[]) {
    const userIds = historico
      .map(h => h.user_id)
      .filter((id): id is string => id !== null && id !== undefined)
    
    // Debug: verificar se há user_ids
    console.log("Histórico recebido:", historico.map(h => ({ id: h.id, user_id: h.user_id })))
    console.log("User IDs extraídos:", userIds)
    
    if (userIds.length > 0) {
      try {
        const { data: usuarios, error: errorUsuarios } = await supabase
          .from("users")
          .select("id, name")
          .in("id", userIds)
        
        console.log("Usuários encontrados:", usuarios)
        
        if (!errorUsuarios && usuarios) {
          const map = new Map<string, string>()
          usuarios.forEach(u => {
            map.set(u.id, u.name)
          })
          setUsuariosMap(map)
          console.log("Mapa de usuários atualizado:", map)
        } else if (errorUsuarios) {
          console.error("Erro ao buscar usuários:", errorUsuarios)
        }
      } catch (error) {
        console.error("Erro ao buscar usuários:", error)
      }
    } else {
      console.log("Nenhum user_id encontrado no histórico")
      setUsuariosMap(new Map())
    }
  }

  async function abrirHistorico(veiculo: VeiculoComDados) {
    setVeiculoSelecionado(veiculo)
    try {
      const historico = await getTrocasOleo(veiculo.id)
      setHistoricoVeiculo(historico)
      
      // Buscar nomes dos usuários para exibir no histórico
      await carregarNomesUsuarios(historico)
      
      setHistoricoDialogOpen(true)
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    }
  }

  function getCorProgresso(progresso: number) {
    if (progresso < 50) return "bg-green-500"
    if (progresso < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  async function excluirRegistro(registro: TrocaOleo) {
    setRegistroParaExcluir(registro)
    setConfirmacaoExclusaoAberta(true)
  }

  async function confirmarExclusao() {
    if (!registroParaExcluir) return
    
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from("trocas_oleo")
        .delete()
        .eq("id", registroParaExcluir.id)
      
      if (error) {
        console.error("Erro ao excluir registro:", error)
        toast({
          variant: "destructive",
          title: "Erro ao excluir registro",
          description: error.message,
          duration: 5000,
        })
        throw error
      }
      
      setConfirmacaoExclusaoAberta(false)
      setRegistroParaExcluir(null)
      
      if (veiculoSelecionado && historicoDialogOpen) {
        const historico = await getTrocasOleo(veiculoSelecionado.id)
        setHistoricoVeiculo(historico)
        await carregarNomesUsuarios(historico)
      }
      
      await carregarVeiculos()
      
      toast({
        title: "Registro excluído",
        description: "O registro foi removido com sucesso",
        duration: 3000,
        className: "bg-green-50 border-green-200 text-green-900",
      })
    } catch (error) {
      console.error("Erro ao excluir registro:", error)
      toast({
        variant: "destructive",
        title: "Erro ao excluir registro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    const limitedValue = numericValue.slice(0, 8)

    let formattedDate = ""

    if (limitedValue.length <= 2) {
      formattedDate = limitedValue
    } else if (limitedValue.length <= 4) {
      formattedDate = `${limitedValue.slice(0, 2)}/${limitedValue.slice(2)}`
    } else {
      formattedDate = `${limitedValue.slice(0, 2)}/${limitedValue.slice(2, 4)}/${limitedValue.slice(4)}`
    }

    return formattedDate
  }

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedValue = formatarData(value)
    setDataInput(formattedValue)
  }

  const validarData = (dataStr: string): boolean => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dataStr.match(regex)

    if (!match) return false

    const dia = Number.parseInt(match[1], 10)
    const mes = Number.parseInt(match[2], 10) - 1
    const ano = Number.parseInt(match[3], 10)

    if (dia < 1 || dia > 31) return false
    if (mes < 0 || mes > 11) return false
    if (ano < 1900 || ano > 2100) return false

    const data = new Date(ano, mes, dia)
    return (
      data.getDate() === dia &&
      data.getMonth() === mes &&
      data.getFullYear() === ano
    )
  }

  const toISODate = (dateStr: string): string => {
    if (!validarData(dateStr)) return ""
    const [dia, mes, ano] = dateStr.split('/')
    // Criar a data com o fuso horário de Brasília (UTC-3)
    return `${ano}-${mes}-${dia}T00:00:00-03:00`
  }

  const handleVerificarSenha = () => {
    const SENHA_ADMIN = "009977"
    
    if (senhaInput === SENHA_ADMIN) {
      setSenhaErro(false)
      setSenhaDialogOpen(false)
      setSenhaInput("")
      
      // Se há um veículo aguardando senha, abrir o diálogo de troca de óleo
      if (veiculoAguardandoSenha) {
        abrirDialogTrocaOleoAposSenha(veiculoAguardandoSenha)
        setVeiculoAguardandoSenha(null)
      }
    } else {
      setSenhaErro(true)
      toast({
        title: "Senha incorreta",
        description: "A senha de administrador está incorreta.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Toaster />
      {isMobile ? (
        <TrocaOleoMobileView
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          veiculos={veiculosFiltrados}
          veiculosResumo={veiculosComDados}
          onRegistrar={abrirDialogTrocaOleo}
          onAtualizar={abrirDialogAtualizarKm}
          onHistorico={abrirHistorico}
          getCorProgresso={getCorProgresso}
        />
      ) : (
      <div className="space-y-6">
        <Card className="shadow-md-custom">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por placa, marca ou modelo..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
            
            {loading && veiculos.length === 0 ? (
              <div className="rounded-md border shadow-sm-custom overflow-hidden">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Carregando veículos...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : veiculosComDados.length === 0 ? (
              <div className="rounded-md border shadow-sm-custom overflow-hidden">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <p className="text-muted-foreground">Nenhum veículo encontrado no sistema</p>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : veiculosFiltrados.length === 0 ? (
              <div className="rounded-md border shadow-sm-custom overflow-hidden">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <p className="text-muted-foreground">
                          Nenhum veículo encontrado para a busca "{searchTerm}"
                        </p>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border shadow-sm-custom overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => alternarOrdenacao('veiculo')}
                      >
                        <div className="flex items-center">
                          Veículo
                          {renderSortIcon('veiculo')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => alternarOrdenacao('kmAtual')}
                      >
                        <div className="flex items-center">
                          Km Atual
                          {renderSortIcon('kmAtual')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => alternarOrdenacao('kmProxTroca')}
                      >
                        <div className="flex items-center">
                          Próxima Troca
                          {renderSortIcon('kmProxTroca')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => alternarOrdenacao('progresso')}
                      >
                        <div className="flex items-center">
                          Progresso
                          {renderSortIcon('progresso')}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {veiculosFiltrados.map((veiculo) => {
                      const progressoClass = getCorProgresso(veiculo.progresso)
                      
                      return (
                        <TableRow key={veiculo.id}>
                          <TableCell>
                            <div className="font-medium">{veiculo.placa}</div>
                            <div className="text-sm text-muted-foreground">
                              {veiculo.modelo} {veiculo.marca} 
                              {veiculo.periodotrocaoleo && 
                                <span className="ml-2">(Troca: {veiculo.periodotrocaoleo.toLocaleString()} km)</span>}
                            </div>
                          </TableCell>
                          <TableCell>{veiculo.kmAtual.toLocaleString()} km</TableCell>
                          <TableCell>{veiculo.kmProxTroca.toLocaleString()} km</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={veiculo.progresso} className="h-2 w-full" indicatorClassName={progressoClass} />
                              <span className="text-sm w-10">{veiculo.progresso}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => abrirDialogTrocaOleo(veiculo)}
                              >
                                Troca de Óleo
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => abrirDialogAtualizarKm(veiculo)}
                              >
                                Atualizar Km
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => abrirHistorico(veiculo)}
                              >
                                Histórico
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Troca de Óleo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <p className="mb-2 text-sm font-medium">
                Veículo: {veiculoSelecionado?.placa} ({veiculoSelecionado?.modelo})
              </p>
              {veiculoSelecionado?.periodotrocaoleo && (
                <p className="text-xs text-muted-foreground">
                  Período de troca: {veiculoSelecionado.periodotrocaoleo.toLocaleString()} km
                </p>
              )}
            </div>
            <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
              <label className="text-sm font-medium">Data da Troca</label>
              <Input
                value={dataInput}
                onChange={handleDataChange}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">Digite a data no formato DD/MM/AAAA</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Km Atual</label>
                <Input 
                  type="number" 
                  value={kmAtual} 
                  onChange={(e) => {
                    const valor = e.target.value
                    setKmAtual(valor)
                    if (veiculoSelecionado) {
                      setKmProxTroca(calcularProximaTroca(valor, veiculoSelecionado))
                    }
                  }} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Km Próx. Troca</label>
                <Input 
                  type="number" 
                  value={kmProxTroca} 
                  onChange={(e) => setKmProxTroca(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observação</label>
              <Input 
                value={observacao} 
                onChange={(e) => setObservacao(e.target.value)} 
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={registrarTrocaOleoAction}
              disabled={loading || !kmAtual || !kmProxTroca}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={atualizarKmDialogOpen} onOpenChange={setAtualizarKmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Km</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <p className="mb-2 text-sm font-medium">
                Veículo: {veiculoSelecionado?.placa} ({veiculoSelecionado?.modelo})
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Km Atual</label>
              <Input 
                type="number" 
                value={kmAtual} 
                onChange={(e) => setKmAtual(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observação</label>
              <Input 
                value={observacao} 
                onChange={(e) => setObservacao(e.target.value)} 
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAtualizarKmDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={atualizarKmAction}
              disabled={loading || !kmAtual}
            >
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Histórico de Registros
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {veiculoSelecionado?.placa} • {veiculoSelecionado?.marca} {veiculoSelecionado?.modelo}
                  </DialogDescription>
                </div>
              </div>
              {historicoVeiculo.length > 0 && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {historicoVeiculo.length} {historicoVeiculo.length === 1 ? 'registro' : 'registros'}
                </Badge>
              )}
            </div>
            {veiculoSelecionado && (
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="h-4 w-4" />
                  <span>Km Atual: <span className="font-semibold text-foreground">{veiculoSelecionado.kmAtual.toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Próxima Troca: <span className="font-semibold text-foreground">{veiculoSelecionado.kmProxTroca.toLocaleString()} km</span></span>
                </div>
              </div>
            )}
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-6">
            <div className="py-4">
              {historicoVeiculo.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <History className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-2">Nenhum registro encontrado</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Não há registros de atualização de KM ou troca de óleo para este veículo.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historicoVeiculo.map((registro, index) => (
                    <div 
                      key={registro.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-card animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground mb-1">Data</span>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-sm">
                                {new Date(registro.data_troca).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground mb-1">Tipo de Serviço</span>
                            <Badge 
                              variant={registro.tipo_servico === 'Troca de Óleo' ? 'info' : 'secondary'}
                              className="w-fit"
                            >
                              {registro.tipo_servico}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground mb-1">Km Anterior</span>
                            <span className="font-semibold text-sm">{registro.km_anterior.toLocaleString()} km</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground mb-1">Km Atual</span>
                            <span className="font-semibold text-sm text-primary">{registro.km_atual.toLocaleString()} km</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground mb-1">Km Próxima Troca</span>
                            <span className="font-semibold text-sm text-green-600 dark:text-green-400">
                              {registro.km_proxima_troca.toLocaleString()} km
                            </span>
                          </div>
                          
                          {registro.observacao && (
                            <div className="flex flex-col md:col-span-2 lg:col-span-3">
                              <span className="text-xs font-medium text-muted-foreground mb-1">Observação</span>
                              <p className="text-sm text-foreground bg-muted/50 p-2 rounded-md border">
                                {registro.observacao}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground mb-1">Registrado por</span>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-sm">
                                {registro.user_id 
                                  ? (usuariosMap.get(registro.user_id) || "Usuário não encontrado")
                                  : "Sistema"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => excluirRegistro(registro)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button 
              onClick={() => setHistoricoDialogOpen(false)}
              className="min-w-[100px]"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={confirmacaoExclusaoAberta} onOpenChange={setConfirmacaoExclusaoAberta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {registroParaExcluir && (
            <div className="py-4">
              <p className="text-sm"><strong>Data:</strong> {new Date(registroParaExcluir.data_troca).toLocaleDateString('pt-BR')}</p>
              <p className="text-sm"><strong>Tipo:</strong> {registroParaExcluir.tipo_servico}</p>
              <p className="text-sm"><strong>Km Atual:</strong> {registroParaExcluir.km_atual.toLocaleString()}</p>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmacaoExclusaoAberta(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={loading}
            >
              {loading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de verificação de senha de administrador */}
      <Dialog open={senhaDialogOpen} onOpenChange={(open) => {
        setSenhaDialogOpen(open)
        if (!open) {
          setSenhaInput("")
          setSenhaErro(false)
          setVeiculoAguardandoSenha(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Senha de Administrador</DialogTitle>
            <DialogDescription>
              Por favor, insira a senha de administrador para registrar a troca de óleo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={senhaInput}
                onChange={(e) => {
                  setSenhaInput(e.target.value)
                  setSenhaErro(false)
                }}
                placeholder="Digite a senha"
                className={senhaErro ? "border-destructive" : ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerificarSenha()
                  }
                }}
              />
              {senhaErro && (
                <p className="text-sm text-destructive">Senha incorreta. Tente novamente.</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSenhaDialogOpen(false)
                setSenhaInput("")
                setSenhaErro(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerificarSenha}
              disabled={!senhaInput}
            >
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TrocaOleoMobileView({
  loading,
  searchTerm,
  onSearchChange,
  veiculos,
  veiculosResumo,
  onRegistrar,
  onAtualizar,
  onHistorico,
  getCorProgresso,
}: {
  loading: boolean
  searchTerm: string
  onSearchChange: Dispatch<SetStateAction<string>>
  veiculos: VeiculoComDados[]
  veiculosResumo: VeiculoComDados[]
  onRegistrar: (veiculo: VeiculoComDados) => void
  onAtualizar: (veiculo: VeiculoComDados) => void
  onHistorico: (veiculo: VeiculoComDados) => void
  getCorProgresso: (progresso: number) => string
}) {
  const emDia = veiculosResumo.filter(v => (v.kmProxTroca - v.kmAtual) > 500 && v.ultimaTroca).length
  const proximo = veiculosResumo.filter(v => (v.kmProxTroca - v.kmAtual) <= 500 && (v.kmProxTroca - v.kmAtual) > 0 && v.ultimaTroca).length
  const vencido = veiculosResumo.filter(v => (v.kmProxTroca - v.kmAtual) <= 0 && v.ultimaTroca).length
  const nunca = veiculosResumo.filter(v => !v.ultimaTroca).length

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-primary">Troca de Óleo</h1>
        <p className="text-sm text-muted-foreground">Visão rápida para dispositivos móveis</p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center text-sm font-medium">
            <div>
              <p className="text-muted-foreground">Em dia</p>
              <p className="text-lg font-semibold text-green-600">{emDia}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Próximo</p>
              <p className="text-lg font-semibold text-yellow-500">{proximo}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vencido</p>
              <p className="text-lg font-semibold text-red-500">{vencido}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sem registro</p>
              <p className="text-lg font-semibold text-muted-foreground">{nunca}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por placa, modelo ou marca"
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
          Carregando veículos...
        </div>
      ) : veiculos.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">Nenhum veículo encontrado</div>
      ) : (
        <div className="space-y-3">
          {veiculos.map((veiculo) => {
            const indicadorClasse = getCorProgresso(veiculo.progresso)
            return (
              <Card key={veiculo.id} className="border border-primary/20 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{veiculo.placa}</div>
                      <div className="text-xs text-muted-foreground">
                        {veiculo.modelo} • {veiculo.marca}
                      </div>
                    </div>
                    {veiculo.periodotrocaoleo && (
                      <Badge variant="outline" className="text-[10px]">
                        Troca: {veiculo.periodotrocaoleo.toLocaleString()} km
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Km atual</p>
                      <p className="font-semibold">{veiculo.kmAtual.toLocaleString()} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Km próx. troca</p>
                      <p className="font-semibold">{veiculo.kmProxTroca.toLocaleString()} km</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{veiculo.progresso}%</span>
                    </div>
                    <Progress value={veiculo.progresso} className="h-2" indicatorClassName={indicadorClasse} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button size="sm" onClick={() => onRegistrar(veiculo)}>
                      Registrar troca
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onAtualizar(veiculo)}>
                      Atualizar km
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onHistorico(veiculo)}>
                      Histórico
                    </Button>
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
