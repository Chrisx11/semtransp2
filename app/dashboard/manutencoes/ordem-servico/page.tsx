"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  PlusCircle,
  Eye,
  FileEdit,
  Wrench,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Package,
  ShoppingCart,
  CornerDownLeft,
  Settings,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  FileText,
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { OrdemServicoFormDialog } from "@/components/ordem-servico-form-dialog"
import {
  getOrdensServicoSupabase,
  updateOrdemServicoSupabase,
  deleteOrdemServicoSupabase,
  adicionarObservacaoSupabase,
  type OrdemServico,
} from "@/services/ordem-servico-service"
import { OrdemServicoVisualizacaoDialog } from "@/components/ordem-servico-visualizacao-dialog"
import { OrdemServicoEdicaoDialog } from "@/components/ordem-servico-edicao-dialog"
import { EnviarAlmoxarifadoDialog } from "@/components/enviar-almoxarifado-dialog"
import { EnviarComprasDialog } from "@/components/enviar-compras-dialog"
import { RetornarOficinaDialog } from "@/components/retornar-oficina-dialog"
import { RetornarAlmoxarifadoComprasDialog } from "@/components/retornar-almoxarifado-compras-dialog"
import { ReabrirOSDialog } from "@/components/reabrir-os-dialog"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { useAuth } from "@/lib/auth-context"
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody, TableCaption } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/components/ui/use-mobile";
import { OrdemServicoMobileView } from "@/components/ordem-servico-mobile-view";

// Tipo para a ordenação
type SortConfig = {
  key: keyof OrdemServico | null
  direction: "ascending" | "descending"
}

// Componente para exibir a prioridade com a cor apropriada
const PrioridadeBadge = ({ prioridade }: { prioridade: string }) => {
  let badgeClasses = ""
  switch (prioridade) {
    case "Baixa":
      badgeClasses = "bg-[#3B82F6] text-white hover:bg-[#2563EB]" // Azul
      break
    case "Média":
      badgeClasses = "bg-[#FACC15] text-black hover:bg-[#EAB308]" // Amarelo
      break
    case "Alta":
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#EA580C]" // Laranja
      break
    case "Urgente":
      badgeClasses = "bg-[#EF4444] text-white hover:bg-[#DC2626]" // Vermelho
      break
    default:
      badgeClasses = "bg-gray-500 text-white hover:bg-gray-500/80" // Cinza
  }
  return <Badge className={cn("font-medium text-xs px-1.5 py-0.5", badgeClasses)} variant="outline">{prioridade}</Badge>
}

// Componente para exibir o status com a cor apropriada
const StatusBadge = ({ status }: { status: string }) => {
  // Definir as classes de cores personalizadas para cada status
  let badgeClasses = ""

  switch (status) {
    case "Aguardando Mecânico":
      // Cinza (#6B7280)
      badgeClasses = "bg-[#6B7280] text-white hover:bg-[#6B7280]/80"
      break
    case "Em Análise":
      // Amarelo Escuro (#D97706)
      badgeClasses = "bg-[#D97706] text-white hover:bg-[#D97706]/80"
      break
    case "Aguardando aprovação":
      // Laranja (#F97316)
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#F97316]/80"
      break
    case "Aguardando OS":
      // Azul Claro (#3B82F6)
      badgeClasses = "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80"
      break
    case "Aguardando Fornecedor":
      // Roxo (#8B5CF6)
      badgeClasses = "bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/80"
      break
    case "Serviço Externo":
      // Verde Escuro (#047857)
      badgeClasses = "bg-[#047857] text-white hover:bg-[#047857]/80"
      break
    case "Comprar na Rua":
      // Vermelho Claro (#EF4444)
      badgeClasses = "bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
      break
    case "Fila de Serviço":
      // Ciano (#06B6D4)
      badgeClasses = "bg-[#06B6D4] text-white hover:bg-[#06B6D4]/80"
      break
    case "Em Serviço":
    case "Em andamento":
      // Verde Claro (#10B981)
      badgeClasses = "bg-[#10B981] text-white hover:bg-[#10B981]/80"
      break
    case "Finalizado":
      // Azul Escuro (#1D4ED8)
      badgeClasses = "bg-[#1D4ED8] text-white hover:bg-[#1D4ED8]/80"
      break
    case "Em Aprovação":
      // Laranja (#F97316) - mesmo do "Aguardando aprovação"
      badgeClasses = "bg-[#F97316] text-white hover:bg-[#F97316]/80"
      break
    default:
      // Cor padrão para status não especificados
      badgeClasses = "bg-gray-500 text-white hover:bg-gray-500/80"
  }

  return (
    <Badge className={cn("font-medium text-xs px-1.5 py-0.5", badgeClasses)} variant="outline">
      {status}
    </Badge>
  )
}

// Componente para o diálogo de ações
interface AcoesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordemId: string | null
  activeTab: string
  onAction: (action: string, id: string) => void
}

const AcoesDialog = ({ open, onOpenChange, ordemId, activeTab, onAction }: AcoesDialogProps) => {
  const handleAction = (action: string) => {
    if (ordemId) {
      onAction(action, ordemId)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ações da Ordem de Serviço</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("visualizar")}>
            <Eye className="mr-2 h-4 w-4" />
            <span>Visualizar</span>
          </Button>

          <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("registrar_observacao")}>
            <FileEdit className="mr-2 h-4 w-4" />
            <span>Registrar Observação</span>
          </Button>

          {activeTab !== "finalizados" && (
            <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("editar")}>
              <FileEdit className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </Button>
          )}

          {activeTab === "oficina" && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAction("enviar_almoxarifado")}
            >
              <Package className="mr-2 h-4 w-4" />
              <span>Enviar P/ Almoxarifado</span>
            </Button>
          )}

          {activeTab === "almoxarifado" && (
            <>
              <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("enviar_compras")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span>Enviar P/ Compras</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAction("retornar_oficina")}
              >
                <CornerDownLeft className="mr-2 h-4 w-4" />
                <span>Retornar P/ Oficina</span>
              </Button>
            </>
          )}

          {activeTab === "compras" && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAction("retornar_almoxarifado_compras")}
            >
              <Package className="mr-2 h-4 w-4" />
              <span>Retornar P/ Almoxarifado</span>
            </Button>
          )}

          {activeTab === "finalizados" && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAction("reabrir_os")}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Reabrir OS</span>
            </Button>
          )}

          {activeTab === "oficina" && (
            <>
              <div className="mt-2 mb-1 text-sm font-semibold text-muted-foreground">Mudar Status</div>
              <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("aguardando_mecanico")}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Aguardando Mecânico</span>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("fila_servico")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Fila de Serviço</span>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("em_servico")}>
                <Wrench className="mr-2 h-4 w-4" />
                <span>Em Serviço</span>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => handleAction("finalizado")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Finalizado</span>
              </Button>

              <div className="mt-2 mb-1 text-sm font-semibold text-muted-foreground">Outras Ações</div>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => handleAction("excluir")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Excluir</span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente para o diálogo de registrar observação
interface RegistrarObservacaoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ordemId: string | null
  onSuccess: () => void
  activeTab: string
}

const RegistrarObservacaoDialog = ({ open, onOpenChange, ordemId, onSuccess, activeTab }: RegistrarObservacaoDialogProps) => {
  const [observacao, setObservacao] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Mapear a aba ativa para o nome do setor
  const tabMapping = {
    "oficina": "Oficina",
    "almoxarifado": "Almoxarifado",
    "compras": "Compras",
    "finalizados": "Finalizados"
  }
  const setor = tabMapping[activeTab as keyof typeof tabMapping] || "Sistema"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ordemId) {
      toast({
        title: "Erro",
        description: "ID da ordem não encontrado.",
        variant: "destructive",
      })
      return
    }

    if (!observacao.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe uma observação.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await adicionarObservacaoSupabase(ordemId, observacao, setor)
      
      if (result) {
        toast({
          title: "Observação registrada",
          description: `A observação foi registrada com sucesso pelo setor: ${setor}`,
        })
        setObservacao("")
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível registrar a observação no histórico.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao registrar observação no histórico:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a observação.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Observação</DialogTitle>
          <DialogDescription>
            Adicione uma observação a esta ordem de serviço. Será registrada como observação do setor: {setor}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Digite sua observação aqui..."
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar Observação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function OrdemServicoPage() {
  const isMobile = useIsMobile();
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState("oficina")
  const { user } = useAuth()

  // Verificar quais abas o usuário tem permissão para acessar
  const [abasPermitidas, setAbasPermitidas] = useState<string[]>([])

  // Estado para controlar a ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "ascending",
  })

  // Estado para controlar a paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Estado para controlar o diálogo de nova ordem de serviço
  const [isNovaOSDialogOpen, setIsNovaOSDialogOpen] = useState(false)
  // Adicionar os estados para controlar o diálogo de visualização
  const [isVisualizacaoDialogOpen, setIsVisualizacaoDialogOpen] = useState(false)
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null)
  // Adicionar os estados para controlar o diálogo de edição
  const [isEdicaoDialogOpen, setIsEdicaoDialogOpen] = useState(false)
  // Adicionar os estados para controlar o diálogo de envio para almoxarifado
  const [isEnviarAlmoxarifadoDialogOpen, setIsEnviarAlmoxarifadoDialogOpen] = useState(false)
  // Adicionar o estado para controlar o diálogo de envio para compras
  const [isEnviarComprasDialogOpen, setIsEnviarComprasDialogOpen] = useState(false)
  // Adicionar o estado para controlar o diálogo de retorno para oficina
  const [isRetornarOficinaDialogOpen, setIsRetornarOficinaDialogOpen] = useState(false)
  // Adicionar o estado para controlar o diálogo de retorno para almoxarifado a partir de compras
  const [isRetornarAlmoxarifadoComprasDialogOpen, setIsRetornarAlmoxarifadoComprasDialogOpen] = useState(false)
  // Adicionar o estado para controlar o diálogo de reabertura de OS
  const [isReabrirOSDialogOpen, setIsReabrirOSDialogOpen] = useState(false)
  // Estado para controlar o diálogo de ações
  const [isAcoesDialogOpen, setIsAcoesDialogOpen] = useState(false)
  // Estado para controlar o diálogo de confirmação de exclusão
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  // Adicionar o estado para controlar a visibilidade do diálogo de observação
  const [isRegistrarObservacaoDialogOpen, setIsRegistrarObservacaoDialogOpen] = useState(false)

  // Estado para os termos de pesquisa em cada aba
  const [searchTermOficina, setSearchTermOficina] = useState("")
  const [searchTermAlmoxarifado, setSearchTermAlmoxarifado] = useState("")
  const [searchTermCompras, setSearchTermCompras] = useState("")
  const [searchTermFinalizados, setSearchTermFinalizados] = useState("")

  // Estado para armazenar as ordens de serviço
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [todasOrdensServico, setTodasOrdensServico] = useState<OrdemServico[]>([])
  const [isCarregandoOrdens, setIsCarregandoOrdens] = useState(false)

  // Toast
  const { toast } = useToast()

  // Função para formatar a data de yyyy-mm-dd para dd/mm/yyyy
  const formatarData = (dataString: string) => {
    if (!dataString) return "—";
    
    try {
      const [ano, mes, dia] = dataString.split('-');
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
      return dataString;
    } catch (error) {
      return dataString;
    }
  };

  // Determinar as abas que o usuário tem permissão para acessar com base nas permissões
  useEffect(() => {
    if (!user) return

    const abasPermitidas: string[] = []

    // Verificar permissões para abas baseado no perfil do usuário ou permissões customizadas
    const permissoes = user.permissoes_customizadas || {}
    const perfil = user.perfil

    // Administrador tem acesso a todas as abas
    if (perfil === "admin" || perfil === "gestor") {
      abasPermitidas.push("oficina", "almoxarifado", "compras", "finalizados")
    } else {
      // Para outros perfis, verificar as permissões dos submódulos
      const submodulos = permissoes.ordemServico?.submodulos || 
        (perfil === "oficina" ? ["oficina"] : 
        (perfil === "almoxarifado" ? ["almoxarifado"] : 
        (perfil === "customizado" ? [] : ["compras"])));

      // Se tem permissão para "todos", adiciona todas as abas
      if (submodulos.includes("todos")) {
        abasPermitidas.push("oficina", "almoxarifado", "compras")
      } else {
        // Adicionar abas específicas com base nas permissões
        if (submodulos.includes("oficina")) {
          abasPermitidas.push("oficina")
        }
        if (submodulos.includes("almoxarifado")) {
          abasPermitidas.push("almoxarifado")
        }
        if (submodulos.includes("compras")) {
          abasPermitidas.push("compras")
        }
      }
      
      // Finalizados é comum a todos os perfis com acesso a ordens de serviço
      abasPermitidas.push("finalizados")
    }

    setAbasPermitidas(abasPermitidas)

    // Se a aba ativa não estiver nas permitidas e houver alguma aba permitida, 
    // definir a primeira aba permitida como ativa
    if (abasPermitidas.length > 0 && !abasPermitidas.includes(activeTab)) {
      setActiveTab(abasPermitidas[0])
    }
  }, [user, activeTab])

  // Função auxiliar para determinar o setor atual baseado no histórico
  const getSetorAtualDoHistorico = (historico: any[]): string | null => {
    if (!historico || historico.length === 0) {
      return "Oficina" // Setor padrão
    }

    // Lista de setores válidos
    const setoresValidos = ["Oficina", "Almoxarifado", "Compras"]
    
    // Percorrer o histórico de trás para frente para encontrar o último setor válido
    for (let i = historico.length - 1; i >= 0; i--) {
      const evento = historico[i]
      // Verificar se o campo "para" é um setor válido (não um status)
      if (evento.para && setoresValidos.includes(evento.para)) {
        return evento.para
      }
      // Se o campo "de" for um setor válido e não encontrarmos "para", usar "de"
      if (evento.de && setoresValidos.includes(evento.de)) {
        return evento.de
      }
    }

    // Se não encontrou nenhum setor válido, retornar "Oficina" como padrão
    return "Oficina"
  }

  // Função para carregar as ordens de serviço com base na aba ativa
  const carregarOrdensServico = async () => {
    setIsCarregandoOrdens(true)
    try {
      let statusFiltro: string[] = []

      switch (activeTab) {
        case "oficina":
          statusFiltro = ["Aguardando Mecânico", "Em Serviço", "Aguardando aprovação", "Fila de Serviço"]
          break
        case "almoxarifado":
          statusFiltro = ["Em Análise", "Aguardando OS", "Aguardando Fornecedor", "Comprar na Rua"]
          break
        case "compras":
          statusFiltro = ["Em Aprovação"]
          break
        case "finalizados":
          statusFiltro = ["Finalizado"]
          break
        default:
          statusFiltro = ["Aguardando Mecânico", "Em Serviço"]
      }

      const todasOrdens = await getOrdensServicoSupabase()
      setTodasOrdensServico(todasOrdens)

      let ordens = todasOrdens.filter((os) => statusFiltro.includes(os.status))

      if (activeTab === "oficina" || activeTab === "almoxarifado") {
        const ordensServicoExterno = todasOrdens.filter((os) => os.status === "Serviço Externo")
        const ordensServicoExternoSetor = ordensServicoExterno.filter((os) => {
          const setorAtual = getSetorAtualDoHistorico(os.historico || [])
          if (activeTab === "oficina") {
            return setorAtual === "Oficina"
          } else if (activeTab === "almoxarifado") {
            return setorAtual === "Almoxarifado"
          }
          return false
        })
        ordens = ordens.concat(ordensServicoExternoSetor)
      }

      setOrdensServico(ordens)
      setCurrentPage(1)
    } catch (error) {
      console.error("Erro ao carregar ordens de serviço:", error)
    } finally {
      setIsCarregandoOrdens(false)
    }
  }

  // Carregar ordens de serviço com base na aba ativa
  useEffect(() => {
    carregarOrdensServico()
  }, [activeTab])

  // Função para ordenar e filtrar os dados
  const sortedData = (data: OrdemServico[]) => {
    // Aplicar filtro de pesquisa com base na aba ativa
    let searchTerm = ""
    switch (activeTab) {
      case "oficina":
        searchTerm = searchTermOficina
        break
      case "almoxarifado":
        searchTerm = searchTermAlmoxarifado
        break
      case "compras":
        searchTerm = searchTermCompras
        break
      case "finalizados":
        searchTerm = searchTermFinalizados
        break
    }

    // Filtrar os dados se houver um termo de pesquisa
    let filteredData = data
    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filteredData = data.filter(
        (ordem) =>
          ordem.numero.toLowerCase().includes(lowerSearchTerm) ||
          ordem.veiculoInfo.toLowerCase().includes(lowerSearchTerm) ||
          ordem.solicitanteInfo.toLowerCase().includes(lowerSearchTerm) ||
          ordem.mecanicoInfo.toLowerCase().includes(lowerSearchTerm) ||
          ordem.status.toLowerCase().includes(lowerSearchTerm),
      )
    }

    // Aplicar ordenação
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      if (!a || !b || !sortConfig.key) return 0
      const aValue = a?.[sortConfig.key]
      const bValue = b?.[sortConfig.key]
      if (aValue === undefined || bValue === undefined) return 0
      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })
  }

  // Função para solicitar ordenação
  const requestSort = (key: keyof OrdemServico) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Função para obter o ícone de ordenação
  const getSortIcon = (key: keyof OrdemServico) => {
    if (sortConfig.key !== key) {
      return null
    }

    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    )
  }

  // Dados ordenados
  const sortedOrdensServico = sortedData(ordensServico)

  // Dados paginados
  const paginatedData = sortedOrdensServico.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Total de páginas
  const totalPages = Math.ceil(sortedOrdensServico.length / itemsPerPage)

  // Função para abrir o diálogo de ações
  const openAcoesDialog = (id: string) => {
    setSelectedOrdemId(id)
    setIsAcoesDialogOpen(true)
  }

  // Função para excluir uma ordem de serviço
  const handleExcluirOrdem = async () => {
    console.log('[EXCLUIR] handleExcluirOrdem chamado')
    if (selectedOrdemId) {
      try {
        console.log('[EXCLUIR] Tentando excluir ordem com ID:', selectedOrdemId)
        const success = await deleteOrdemServicoSupabase(selectedOrdemId)
        console.log('[EXCLUIR] Resultado da exclusão:', success)
        if (success) {
          toast({
            title: "Ordem de serviço excluída",
            description: `A ordem de serviço ${selectedOrdemId} foi excluída com sucesso.`,
            variant: "default",
          })
          carregarOrdensServico()
        } else {
          toast({
            title: "Erro ao excluir",
            description: `Não foi possível excluir a ordem de serviço (ID: ${selectedOrdemId}).`,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('[EXCLUIR] Erro ao excluir ordem:', error)
        toast({
          title: "Erro ao excluir",
          description: error instanceof Error ? error.message : JSON.stringify(error),
          variant: "destructive",
        })
      }
    } else {
      console.warn('[EXCLUIR] Nenhum ID selecionado para exclusão.')
    }
  }

  // Função para lidar com as ações do menu
  const handleAction = async (action: string, id: string) => {
    console.log('[EDITAR/EXCLUIR] handleAction chamada:', { action, id })
    switch (action) {
      case "visualizar":
        setSelectedOrdemId(id)
        setIsVisualizacaoDialogOpen(true)
        break
      case "registrar_observacao":
        setSelectedOrdemId(id)
        setIsRegistrarObservacaoDialogOpen(true)
        break
      case "editar":
        setSelectedOrdemId(id)
        setIsEdicaoDialogOpen(true)
        break
      case "enviar_almoxarifado":
        setSelectedOrdemId(id)
        setIsEnviarAlmoxarifadoDialogOpen(true)
        break
      case "enviar_compras":
        setSelectedOrdemId(id)
        setIsEnviarComprasDialogOpen(true)
        break
      case "retornar_oficina":
        setSelectedOrdemId(id)
        setIsRetornarOficinaDialogOpen(true)
        break
      case "retornar_almoxarifado_compras":
        setSelectedOrdemId(id)
        setIsRetornarAlmoxarifadoComprasDialogOpen(true)
        break
      case "aguardando_mecanico":
        try {
          console.log('[EDITAR] Atualizando status para Aguardando Mecânico, ID:', id)
          const result = await updateOrdemServicoSupabase(
            id, 
            { status: "Aguardando Mecânico" },
            undefined,
            user?.id,
            user?.nome || user?.login || "Sistema"
          )
          console.log('[EDITAR] Resultado updateOrdemServicoSupabase:', result)
          carregarOrdensServico()
        } catch (error) {
          console.error('[EDITAR] Erro ao atualizar para Aguardando Mecânico:', error)
          toast({
            title: "Erro ao atualizar status",
            description: error instanceof Error ? error.message : JSON.stringify(error),
            variant: "destructive",
          })
        }
        break
      case "fila_servico":
        try {
          console.log('[EDITAR] Atualizando status para Fila de Serviço, ID:', id)
          const result = await updateOrdemServicoSupabase(
            id, 
            { status: "Fila de Serviço" },
            undefined,
            user?.id,
            user?.nome || user?.login || "Sistema"
          )
          console.log('[EDITAR] Resultado updateOrdemServicoSupabase:', result)
          carregarOrdensServico()
        } catch (error) {
          console.error('[EDITAR] Erro ao atualizar para Fila de Serviço:', error)
          toast({
            title: "Erro ao atualizar status",
            description: error instanceof Error ? error.message : JSON.stringify(error),
            variant: "destructive",
          })
        }
        break
      case "em_servico":
        try {
          console.log('[EDITAR] Atualizando status para Em Serviço, ID:', id)
          const result = await updateOrdemServicoSupabase(
            id, 
            { status: "Em Serviço" },
            undefined,
            user?.id,
            user?.nome || user?.login || "Sistema"
          )
          console.log('[EDITAR] Resultado updateOrdemServicoSupabase:', result)
          carregarOrdensServico()
        } catch (error) {
          console.error('[EDITAR] Erro ao atualizar para Em Serviço:', error)
          toast({
            title: "Erro ao atualizar status",
            description: error instanceof Error ? error.message : JSON.stringify(error),
            variant: "destructive",
          })
        }
        break
      case "finalizado":
        try {
          console.log('[EDITAR] Atualizando status para Finalizado, ID:', id)
          const result = await updateOrdemServicoSupabase(
            id, 
            { status: "Finalizado" },
            undefined,
            user?.id,
            user?.nome || user?.login || "Sistema"
          )
          console.log('[EDITAR] Resultado updateOrdemServicoSupabase:', result)
          carregarOrdensServico()
        } catch (error) {
          console.error('[EDITAR] Erro ao atualizar para Finalizado:', error)
          toast({
            title: "Erro ao atualizar status",
            description: error instanceof Error ? error.message : JSON.stringify(error),
            variant: "destructive",
          })
        }
        break
      case "reabrir_os":
        setSelectedOrdemId(id)
        setIsReabrirOSDialogOpen(true)
        break
      case "excluir":
        setSelectedOrdemId(id)
        setIsDeleteConfirmationOpen(true)
        break
      default:
        console.log(`[Ação desconhecida]: ${action}`)
    }
  }

  // Função para gerar os links de paginação
  const generatePaginationLinks = () => {
    const links = []

    // Adicionar primeira página
    links.push(
      <PaginationItem key="first">
        <PaginationLink onClick={() => setCurrentPage(1)} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Adicionar elipses se necessário
    if (currentPage > 3) {
      links.push(
        <PaginationItem key="ellipsis-1">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>,
      )
    }

    // Adicionar páginas ao redor da página atual
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue // Pular primeira e última página

      links.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => setCurrentPage(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Adicionar elipses se necessário
    if (currentPage < totalPages - 2) {
      links.push(
        <PaginationItem key="ellipsis-2">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>,
      )
    }

    // Adicionar última página se houver mais de uma página
    if (totalPages > 1) {
      links.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => setCurrentPage(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return links
  }

  // Função para lidar com a mudança de itens por página
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Resetar para a primeira página ao mudar a quantidade de itens
  }

  // Função para lidar com o sucesso na criação ou edição de uma OS
  const handleOSSuccess = () => {
    // Recarregar as ordens de serviço após criar ou editar
    carregarOrdensServico()
  }

  // Resetar para a primeira página quando o termo de pesquisa mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTermOficina, searchTermAlmoxarifado, searchTermCompras, searchTermFinalizados])

  const desktopContent = (
    <div className="space-y-6">
      <Card className="shadow-md border-none">
        <CardContent className="p-6">
          {/* Tabs Navigation */}
          <div className="flex space-x-1 rounded-lg bg-muted p-1 mb-8">
            {abasPermitidas.includes("oficina") && (
              <button
                className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === "oficina"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("oficina")}
              >
                Oficina
              </button>
            )}
            {abasPermitidas.includes("almoxarifado") && (
              <button
                className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === "almoxarifado"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("almoxarifado")}
              >
                Almoxarifado
              </button>
            )}
            {abasPermitidas.includes("compras") && (
              <button
                className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === "compras"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("compras")}
              >
                Compras
              </button>
            )}
            {abasPermitidas.includes("finalizados") && (
              <button
                className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === "finalizados"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50"
                }`}
                onClick={() => setActiveTab("finalizados")}
              >
                Finalizados
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-4 border rounded-md">
            {/* Oficina Tab */}
            {activeTab === "oficina" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative ml-4">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar ordens..."
                        className="pl-8 w-[250px]"
                        value={searchTermOficina}
                        onChange={(e) => setSearchTermOficina(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button className="btn-gradient shadow-md-custom" onClick={() => setIsNovaOSDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Ordem de Serviço
                  </Button>
                </div>

                {/* PADRÃO DE TABELA IGUAL OUTRAS PÁGINAS */}
                <div className="rounded-md border shadow-sm-custom overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("data")}>Data {getSortIcon("data")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("numero")}>Número da OS {getSortIcon("numero")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("veiculoInfo")}>Veículo {getSortIcon("veiculoInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("kmAtual")}>Km Atual {getSortIcon("kmAtual")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("solicitanteInfo")}>Solicitante {getSortIcon("solicitanteInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("mecanicoInfo")}>Mecânico {getSortIcon("mecanicoInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("prioridade")}>Prioridade {getSortIcon("prioridade")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("status")}>Status {getSortIcon("status")}</TableHead>
                        <TableHead className="h-9 px-3 text-right align-middle font-medium text-xs">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isCarregandoOrdens ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Carregando ordens...
                          </TableCell>
                        </TableRow>
                      ) : paginatedData.length > 0 ? (
                        paginatedData.map((ordem, index) => (
                          <TableRow key={ordem.id} className={`border-b hover:bg-muted/50 ${index % 2 === 1 ? "bg-muted/30" : ""}`}>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{formatarData(ordem.data)}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.numero}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.veiculoInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.kmAtual || "—"}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.solicitanteInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.mecanicoInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs"><PrioridadeBadge prioridade={ordem.prioridade} /></TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs"><StatusBadge status={ordem.status} /></TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-right">
                              <Button variant="outline" size="sm" onClick={() => openAcoesDialog(ordem.id)}>
                                <Settings className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs">Ações</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                            Nenhuma ordem de serviço encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {paginatedData.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Itens por página</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {generatePaginationLinks()}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}

            {/* Almoxarifado Tab */}
            {activeTab === "almoxarifado" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative ml-4">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar ordens..."
                        className="pl-8 w-[250px]"
                        value={searchTermAlmoxarifado}
                        onChange={(e) => setSearchTermAlmoxarifado(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-md border shadow-sm-custom overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("data")}>Data {getSortIcon("data")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("numero")}>Número da OS {getSortIcon("numero")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("veiculoInfo")}>Veículo {getSortIcon("veiculoInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("kmAtual")}>Km Atual {getSortIcon("kmAtual")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("solicitanteInfo")}>Solicitante {getSortIcon("solicitanteInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("mecanicoInfo")}>Mecânico {getSortIcon("mecanicoInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("prioridade")}>Prioridade {getSortIcon("prioridade")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("status")}>Status {getSortIcon("status")}</TableHead>
                        <TableHead className="h-9 px-3 text-right align-middle font-medium text-xs">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isCarregandoOrdens ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Carregando ordens...
                          </TableCell>
                        </TableRow>
                      ) : paginatedData.length > 0 ? (
                        paginatedData.map((ordem, index) => (
                          <TableRow key={ordem.id} className={`border-b hover:bg-muted/50 ${index % 2 === 1 ? "bg-muted/30" : ""}`}>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{formatarData(ordem.data)}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.numero}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.veiculoInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.kmAtual || "—"}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.solicitanteInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.mecanicoInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs"><PrioridadeBadge prioridade={ordem.prioridade} /></TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs"><StatusBadge status={ordem.status} /></TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-right">
                              <Button variant="outline" size="sm" onClick={() => openAcoesDialog(ordem.id)}>
                                <Settings className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs">Ações</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                            Nenhuma ordem de serviço aguardando peças no momento.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação para Almoxarifado */}
                {paginatedData.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Itens por página</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {generatePaginationLinks()}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}

            {/* Compras Tab */}
            {activeTab === "compras" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative ml-4">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar ordens..."
                        className="pl-8 w-[250px]"
                        value={searchTermCompras}
                        onChange={(e) => setSearchTermCompras(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-md border shadow-sm-custom overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("data")}>Data {getSortIcon("data")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("numero")}>Número da OS {getSortIcon("numero")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("veiculoInfo")}>Veículo {getSortIcon("veiculoInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("kmAtual")}>Km Atual {getSortIcon("kmAtual")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("solicitanteInfo")}>Solicitante {getSortIcon("solicitanteInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("mecanicoInfo")}>Mecânico {getSortIcon("mecanicoInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("prioridade")}>Prioridade {getSortIcon("prioridade")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("status")}>Status {getSortIcon("status")}</TableHead>
                        <TableHead className="h-9 px-3 text-right align-middle font-medium text-xs">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isCarregandoOrdens ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Carregando ordens...
                          </TableCell>
                        </TableRow>
                      ) : paginatedData.length > 0 ? (
                        paginatedData.map((ordem, index) => (
                          <TableRow key={ordem.id} className={`border-b hover:bg-muted/50 ${index % 2 === 1 ? "bg-muted/30" : ""}`}>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{formatarData(ordem.data)}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.numero}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.veiculoInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.kmAtual || "—"}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.solicitanteInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.mecanicoInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs"><PrioridadeBadge prioridade={ordem.prioridade} /></TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs"><StatusBadge status={ordem.status} /></TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-right">
                              <Button variant="outline" size="sm" onClick={() => openAcoesDialog(ordem.id)}>
                                <Settings className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs">Ações</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                            Nenhuma ordem de serviço aguardando compras no momento.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação para Compras */}
                {paginatedData.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Itens por página</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {generatePaginationLinks()}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}

            {/* Finalizados Tab */}
            {activeTab === "finalizados" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative ml-4">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar ordens..."
                        className="pl-8 w-[250px]"
                        value={searchTermFinalizados}
                        onChange={(e) => setSearchTermFinalizados(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-md border shadow-sm-custom overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("data")}>Data {getSortIcon("data")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("numero")}>Número da OS {getSortIcon("numero")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("veiculoInfo")}>Veículo {getSortIcon("veiculoInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("kmAtual")}>Km Atual {getSortIcon("kmAtual")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("solicitanteInfo")}>Solicitante {getSortIcon("solicitanteInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("mecanicoInfo")}>Mecânico {getSortIcon("mecanicoInfo")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("prioridade")}>Prioridade {getSortIcon("prioridade")}</TableHead>
                        <TableHead className="h-9 px-3 text-left align-middle font-medium text-xs cursor-pointer hover:text-foreground" onClick={() => requestSort("status")}>Status {getSortIcon("status")}</TableHead>
                        <TableHead className="h-9 px-3 text-right align-middle font-medium text-xs">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isCarregandoOrdens ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Carregando ordens...
                          </TableCell>
                        </TableRow>
                      ) : paginatedData.length > 0 ? (
                        paginatedData.map((ordem, index) => (
                          <TableRow key={ordem.id} className={`border-b hover:bg-muted/50 ${index % 2 === 1 ? "bg-muted/30" : ""}`}>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{formatarData(ordem.data)}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.numero}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.veiculoInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.kmAtual || "—"}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.solicitanteInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs">{ordem.mecanicoInfo}</TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs"><PrioridadeBadge prioridade={ordem.prioridade} /></TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-xs"><StatusBadge status={ordem.status} /></TableCell>
                            <TableCell className="py-1.5 px-3 align-middle text-right">
                              <Button variant="outline" size="sm" onClick={() => openAcoesDialog(ordem.id)}>
                                <Settings className="h-3.5 w-3.5 mr-1" />
                                <span className="text-xs">Ações</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                            Nenhuma ordem de serviço finalizada no momento.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação para Finalizados */}
                {paginatedData.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Itens por página</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={itemsPerPage.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {generatePaginationLinks()}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const content = isMobile ? (
    <OrdemServicoMobileView
      ordens={todasOrdensServico}
      loading={isCarregandoOrdens}
      onNovaOS={() => setIsNovaOSDialogOpen(true)}
      onAction={(action, id) => handleAction(action, id)}
    />
  ) : (
    desktopContent
  )

  return (
    <>
      {content}

      {/* Diálogo de Ações */}
      <AcoesDialog
        open={isAcoesDialogOpen}
        onOpenChange={setIsAcoesDialogOpen}
        ordemId={selectedOrdemId}
        activeTab={activeTab}
        onAction={handleAction}
      />

      {/* Diálogo de Nova Ordem de Serviço */}
      <OrdemServicoFormDialog
        open={isNovaOSDialogOpen}
        onOpenChange={setIsNovaOSDialogOpen}
        onSuccess={handleOSSuccess}
      />

      {/* Diálogo de Visualização de Ordem de Serviço */}
      <OrdemServicoVisualizacaoDialog
        open={isVisualizacaoDialogOpen}
        onOpenChange={setIsVisualizacaoDialogOpen}
        ordemId={selectedOrdemId}
        onEdit={() => {
          setIsVisualizacaoDialogOpen(false)
          setIsEdicaoDialogOpen(true)
        }}
      />

      {/* Diálogo de Edição de Ordem de Serviço */}
      <OrdemServicoEdicaoDialog
        open={isEdicaoDialogOpen}
        onOpenChange={setIsEdicaoDialogOpen}
        ordemId={selectedOrdemId}
        onSuccess={handleOSSuccess}
      />

      {/* Diálogo de Envio para Almoxarifado */}
      <EnviarAlmoxarifadoDialog
        open={isEnviarAlmoxarifadoDialogOpen}
        onOpenChange={setIsEnviarAlmoxarifadoDialogOpen}
        ordemId={selectedOrdemId ?? ""}
        onSuccess={handleOSSuccess}
      />

      {/* Diálogo de Envio para Compras */}
      <EnviarComprasDialog
        open={isEnviarComprasDialogOpen}
        onOpenChange={setIsEnviarComprasDialogOpen}
        ordemId={selectedOrdemId ?? ""}
        onSuccess={handleOSSuccess}
      />

      {/* Diálogo de Retorno para Oficina */}
      <RetornarOficinaDialog
        open={isRetornarOficinaDialogOpen}
        onOpenChange={setIsRetornarOficinaDialogOpen}
        ordemId={selectedOrdemId}
        origem="Almoxarifado"
        onSuccess={handleOSSuccess}
      />

      {/* Diálogo de Retorno para Almoxarifado a partir de Compras */}
      <RetornarAlmoxarifadoComprasDialog
        open={isRetornarAlmoxarifadoComprasDialogOpen}
        onOpenChange={setIsRetornarAlmoxarifadoComprasDialogOpen}
        ordemId={selectedOrdemId}
        onSuccess={handleOSSuccess}
      />

      {/* Diálogo de Reabertura de OS */}
      <ReabrirOSDialog
        open={isReabrirOSDialogOpen}
        onOpenChange={setIsReabrirOSDialogOpen}
        ordemId={selectedOrdemId}
        onSuccess={handleOSSuccess}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <DeleteConfirmation
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
        onConfirm={handleExcluirOrdem}
        title="Excluir Ordem de Serviço"
        description="Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita."
      />

      {/* Diálogo de Registrar Observação */}
      <RegistrarObservacaoDialog
        open={isRegistrarObservacaoDialogOpen}
        onOpenChange={setIsRegistrarObservacaoDialogOpen}
        ordemId={selectedOrdemId}
        onSuccess={handleOSSuccess}
        activeTab={activeTab}
      />
    </>
  )
}

