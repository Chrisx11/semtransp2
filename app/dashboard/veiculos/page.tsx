"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  ArrowUpDown,
  Car,
  Pencil,
  Trash2,
  Download,
  FileText,
  Filter,
  LayoutGrid,
  LayoutList,
  Eye,
  FileSpreadsheet,
  MoreVertical,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { VeiculoForm } from "@/components/veiculo-form"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { getVeiculosSupabase, deleteVeiculoSupabase, type Veiculo, addVeiculoSupabase, addVeiculo } from "@/services/veiculo-service"
import { exportToCSV, exportToPDF, exportToExcel } from "@/utils/export-veiculos-utils"
import { VeiculoCard } from "@/components/veiculo-card"
import { Badge } from "@/components/ui/badge"
import { TrocaOleoDialog } from "@/components/troca-oleo-dialog"
import { getSaidasSupabase, type Saida } from "@/services/saida-service"
import { startOfMonth, endOfMonth } from "date-fns"
import { RelatorioAvancadoVeiculosDialog } from "@/components/relatorio-avancado-veiculos-dialog"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"

type SortDirection = "asc" | "desc" | null
type SortField = "placa" | "modelo" | "marca" | "ano" | "cor" | "tipo" | "secretaria" | "status" | "despesaMensal" | null
type ViewMode = "table" | "cards"

// Lista de secretarias para o filtro
const secretarias = [
  "Semgov",
  "Semplad",
  "Semfaz",
  "Semeduc",
  "Semusa",
  "Semathrab",
  "Semosp",
  "Semalp",
  "Semaev",
  "Semci",
  "Semgap",
  "Semctel",
  "Semseg",
  "Semtransp",
  "Progem",
]

// Componente Mobile View
function VeiculosMobileView({
  veiculos,
  isLoading,
  isSaidasLoading,
  searchTerm,
  setSearchTerm,
  secretariaFilter,
  setSecretariaFilter,
  filteredData,
  processedData,
  paginatedData,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalPages,
  pageNumbers,
  handleNew,
  handleEdit,
  handleView,
  handleDeleteClick,
  secretarias,
  getDespesaMensal,
  setVeiculoTrocaOleo,
  setTrocaOleoOpen,
}: {
  veiculos: Veiculo[]
  isLoading: boolean
  isSaidasLoading: boolean
  searchTerm: string
  setSearchTerm: (value: string) => void
  secretariaFilter: string
  setSecretariaFilter: (value: string) => void
  filteredData: Veiculo[]
  processedData: Veiculo[]
  paginatedData: Veiculo[]
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: string
  setItemsPerPage: (value: string) => void
  totalPages: number
  pageNumbers: number[]
  handleNew: () => void
  handleEdit: (id: string) => void
  handleView: (id: string) => void
  handleDeleteClick: (id: string) => void
  secretarias: string[]
  getDespesaMensal: (id: string) => number
  setVeiculoTrocaOleo: (veiculo: any) => void
  setTrocaOleoOpen: (open: boolean) => void
}) {
  return (
    <div className="w-full max-w-full overflow-x-hidden pl-2 pr-0 py-4 pb-6 flex flex-col items-start">
      <MobileBackButton />
      {/* Filtros e Busca */}
      <div className="flex flex-col gap-3 mb-4 w-[90%]">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por placa, modelo, marca..."
            className="pl-10 h-11 text-base w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={secretariaFilter} onValueChange={setSecretariaFilter}>
          <SelectTrigger className="w-full h-11 text-base">
            <div className="flex items-center min-w-0">
              <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
              <SelectValue placeholder="Filtrar por secretaria" className="truncate" />
            </div>
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

        <Button className="w-full btn-gradient h-11 text-base font-medium shadow-md" onClick={handleNew}>
          <Plus className="mr-2 h-5 w-5" /> Novo Veículo
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16 w-[90%]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">Carregando veículos...</p>
          </div>
        </div>
      ) : paginatedData.length > 0 ? (
        <div className="space-y-3 w-[90%]">
          {paginatedData.map((veiculo) => (
            <Card 
              key={veiculo.id} 
              className="border-l-4 border-l-primary shadow-sm hover:shadow-md hover:bg-accent/50 transition-all duration-200 w-full cursor-pointer active:scale-[0.98]" 
              onClick={() => handleView(veiculo.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {/* Placa e Info Principal */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Car className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-lg text-primary truncate">{veiculo.placa}</div>
                          <Eye className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {veiculo.marca} {veiculo.modelo}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Ano {veiculo.ano} • {veiculo.tipo}
                        </div>
                      </div>
                    </div>

                    {/* Badges e Informações */}
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs px-2 py-1 h-auto">
                          {veiculo.secretaria}
                        </Badge>
                        <Badge 
                          variant={veiculo.status === "Ativo" ? "default" : "destructive"} 
                          className="text-xs px-2 py-1 h-auto"
                        >
                          {veiculo.status}
                        </Badge>
                        {!isSaidasLoading && (
                          <Badge variant="outline" className="text-xs px-2 py-1 h-auto font-semibold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600">
                            R$ {getDespesaMensal(veiculo.id).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu de Ações */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 p-0 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleView(veiculo.id)
                        }}
                        className="text-blue-600 dark:text-blue-400 focus:text-blue-600 dark:focus:text-blue-400 cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(veiculo.id)
                        }} 
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setVeiculoTrocaOleo(veiculo)
                          setTrocaOleoOpen(true)
                        }}
                        className="cursor-pointer"
                      >
                        <span className="mr-2">🛢️</span>
                        Registrar Troca de Óleo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(veiculo.id)
                        }}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground w-[90%]">
          <Car className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-base font-medium mb-1">
            {searchTerm || secretariaFilter ? "Nenhum resultado encontrado" : "Nenhum veículo cadastrado"}
          </p>
          <p className="text-sm">
            {searchTerm || secretariaFilter 
              ? "Tente usar termos diferentes na busca ou remover os filtros" 
              : "Adicione um novo veículo para começar"}
          </p>
        </div>
      )}

      {/* Paginação */}
      {processedData.length > 0 && (
        <div className="flex flex-col gap-3 mt-6 w-[90%]">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Select
              value={itemsPerPage}
              onValueChange={(value) => {
                setItemsPerPage(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[70px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">
              {Math.min(processedData.length, (currentPage - 1) * Number.parseInt(itemsPerPage) + 1)}-
              {Math.min(processedData.length, currentPage * Number.parseInt(itemsPerPage))} de {processedData.length}
            </span>
          </div>

          <Pagination>
            <PaginationContent className="flex-wrap">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {pageNumbers.map((pageNumber, index) => (
                <PaginationItem key={index}>
                  {pageNumber < 0 ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={currentPage === pageNumber}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(pageNumber)
                      }}
                      className="min-w-[40px]"
                    >
                      {pageNumber}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

export default function VeiculosPage() {
  const isMobile = useIsMobile()
  // Estado para modo de visualização
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")

  // Estado para ordenação
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Estado para pesquisa e filtro
  const [searchTerm, setSearchTerm] = useState("")
  const [secretariaFilter, setSecretariaFilter] = useState<string>("")

  // Estado para o modal de formulário
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [isViewing, setIsViewing] = useState(false)

  // Estado para o modal de confirmação de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Estado para o diálogo de troca de óleo
  const [trocaOleoOpen, setTrocaOleoOpen] = useState(false)
  const [veiculoTrocaOleo, setVeiculoTrocaOleo] = useState<any | null>(null)

  // Estado para o diálogo de relatório avançado
  const [relatorioAvancadoOpen, setRelatorioAvancadoOpen] = useState(false)

  // Estado para os dados
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [isSaidasLoading, setIsSaidasLoading] = useState(true)

  // Novo estado para input de arquivo JSON
  const jsonInputRef = useRef<HTMLInputElement | null>(null)

  const { toast } = useToast()

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getVeiculosSupabase()
      console.log('[VeiculosPage] Dados retornados do Supabase:', data.map(v => ({ id: v.id, kmAtual: v.kmAtual, kmProxTroca: v.kmProxTroca })))
      setVeiculos(data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos veículos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function fetchSaidas() {
      setIsSaidasLoading(true)
      try {
        const saidasData = await getSaidasSupabase()
        setSaidas(saidasData)
      } catch (e) {
        toast({ title: "Erro ao carregar saídas", variant: "destructive" })
      } finally {
        setIsSaidasLoading(false)
      }
    }
    fetchSaidas()
  }, [])

  // Função para alternar a ordenação
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Função para renderizar o ícone de ordenação
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }

    if (sortDirection === "asc") {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-primary" />
    }

    return <ArrowUpDown className="ml-2 h-4 w-4 text-primary rotate-180" />
  }

  // Função para abrir o formulário para edição
  const handleEdit = (id: string) => {
    setEditingId(id)
    setIsViewing(false)
    setFormOpen(true)
  }

  // Função para abrir o formulário para visualização
  const handleView = (id: string) => {
    setViewingId(id)
    setIsViewing(true)
    setFormOpen(true)
  }

  // Função para abrir o formulário para novo veículo
  const handleNew = () => {
    setEditingId(null)
    setViewingId(null)
    setIsViewing(false)
    setFormOpen(true)
  }

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  // Função para excluir um veículo
  const handleDelete = async () => {
    if (!deletingId) return

    try {
      // Simular um pequeno atraso
      await new Promise((resolve) => setTimeout(resolve, 500))

      const veiculo = veiculos.find((v) => v.id === deletingId)
      const success = await deleteVeiculoSupabase(deletingId)

      if (success && veiculo) {
        toast({
          title: "Veículo excluído",
          description: `${veiculo.placa} foi excluído com sucesso.`,
        })
        loadData()
      } else {
        throw new Error("Falha ao excluir veículo")
      }
    } catch (error) {
      console.error("Erro ao excluir veículo:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o veículo.",
        variant: "destructive",
      })
    } finally {
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  // Função para exportar dados
  const handleExport = async (format: "csv" | "pdf" | "excel") => {
    try {
      console.log(`Iniciando exportação para ${format}...`)
      console.log(`Dados a serem exportados:`, filteredData.length)

      // Usar os dados filtrados para exportação
      if (format === "csv") {
        const result = exportToCSV(filteredData, "veiculos")
        console.log("Resultado da exportação CSV:", result)
        toast({
          title: "Exportação concluída",
          description: "Os dados foram exportados para CSV com sucesso.",
        })
      } else if (format === "pdf") {
        const result = exportToPDF(filteredData, "veiculos")
        console.log("Resultado da exportação PDF:", result)
        toast({
          title: "Exportação concluída",
          description: "Os dados foram exportados para PDF com sucesso.",
        })
      } else if (format === "excel") {
        const result = await exportToExcel(filteredData, "veiculos")
        console.log("Resultado da exportação Excel:", result)
        toast({
          title: "Exportação concluída",
          description: "Os dados foram exportados para Excel com sucesso.",
        })
      }
    } catch (error) {
      console.error(`Erro ao exportar para ${format}:`, error)
      toast({
        title: "Erro na exportação",
        description: `Não foi possível exportar os dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    }
  }

  // Filtrar dados com base na pesquisa e nos filtros
  const filteredData = useMemo(() => {
    let result = [...veiculos]

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase()
      result = result.filter(
        (v) =>
          v.placa.toLowerCase().includes(lowerQuery) ||
          v.modelo.toLowerCase().includes(lowerQuery) ||
          v.marca.toLowerCase().includes(lowerQuery) ||
          v.tipo.toLowerCase().includes(lowerQuery) ||
          v.secretaria.toLowerCase().includes(lowerQuery) ||
          v.ano.toString().includes(lowerQuery),
      )
    }

    // Aplicar filtro de secretaria (case-insensitive, ignora espaços)
    if (secretariaFilter && secretariaFilter !== "all") {
      const filterNorm = secretariaFilter.trim().toUpperCase()
      result = result.filter((v) => (v.secretaria || '').trim().toUpperCase() === filterNorm)
    }

    return result
  }, [veiculos, searchTerm, secretariaFilter])

  // Aplicar ordenação aos dados filtrados
  const processedData = useMemo(() => {
    const result = [...filteredData]

    // Aplicar ordenação
    if (sortField && sortDirection) {
      // Ordenação especial para coluna calculada "Despesa Mensal"
      if (sortField === "despesaMensal") {
        result.sort((a, b) => {
          const aValue = getDespesaMensal(a.id)
          const bValue = getDespesaMensal(b.id)
          if (sortDirection === "asc") {
            return aValue - bValue
          }
          return bValue - aValue
        })
        return result
      }

      result.sort((a, b) => {
        let aValue: string | number = a[sortField] as string | number
        let bValue: string | number = b[sortField] as string | number

        // Converter para string para comparação se não for número
        if (sortField !== "ano") {
          aValue = String(aValue).toLowerCase()
          bValue = String(bValue).toLowerCase()
        }

        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return bValue < aValue ? -1 : bValue > aValue ? 1 : 0
        }
      })
    }

    return result
  }, [filteredData, sortField, sortDirection])

  // Calcular dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * Number.parseInt(itemsPerPage)
    return processedData.slice(startIndex, startIndex + Number.parseInt(itemsPerPage))
  }, [processedData, currentPage, itemsPerPage])

  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(processedData.length / Number.parseInt(itemsPerPage)))

  // Gerar array de páginas para paginação
  const pageNumbers = useMemo(() => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Mostrar todas as páginas se houver menos que o máximo visível
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Sempre mostrar a primeira página
      pages.push(1)

      // Calcular páginas do meio
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Ajustar se estiver no início ou fim
      if (currentPage <= 2) {
        endPage = 4
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3
      }

      // Adicionar elipse antes das páginas do meio se necessário
      if (startPage > 2) {
        pages.push(-1) // -1 representa elipse
      }

      // Adicionar páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Adicionar elipse depois das páginas do meio se necessário
      if (endPage < totalPages - 1) {
        pages.push(-2) // -2 representa elipse
      }

      // Sempre mostrar a última página
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  // Resetar para a primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, secretariaFilter])

  // Função para importar veículos do JSON
  const handleImportJSON = async (file?: File) => {
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data)) {
        toast({ title: "Erro ao importar JSON", description: "Formato inválido.", variant: "destructive" })
        return
      }
      let count = 0
      let erros = 0
      for (const row of data) {
        try {
          // Mapeamento básico (ajuste conforme necessário)
          let medicao: "Horimetro" | "Hodometro" = "Hodometro"
          if (row.tipo_medicao && row.tipo_medicao.toString().toLowerCase().includes("horimetro")) {
            medicao = "Horimetro"
          }
          const status: "Ativo" | "Inativo" = (row.status || "").trim().toLowerCase() === "inativo" ? "Inativo" : "Ativo"
          let ano = 0
          if (row.ano) {
            const anoStr = row.ano.toString().split("/")[0].replace(/\D/g, "")
            ano = parseInt(anoStr) || 0
          }
          if (!ano) continue // ano obrigatório e não pode ser 0
          const veiculo = {
            placa: String(row.placa || "").trim(),
            modelo: String(row.modelo || "").trim(),
            marca: String(row.marca || "").trim(),
            ano,
            cor: String(row.cor || "").trim(),
            tipo: String(row.tipo || "").trim(),
            chassi: String(row.chassi || "").trim(),
            renavam: String(row.renavam || "").trim(),
            combustivel: String(row.tipo_combustivel || row.combustivel || "").trim(),
            medicao,
            periodotrocaoleo: parseInt(row.valor_troca) || 0, // usar nome correto do banco
            status,
            secretaria: String(row.secretaria || "").trim(),
            kmAtual: 0,
            kmProxTroca: 0,
          }
          if (!veiculo.placa || !veiculo.modelo) continue
          await addVeiculoSupabase(veiculo)
          count++
        } catch (err) {
          erros++
          console.error("Erro ao importar veículo do JSON:", err, row)
        }
      }
      let msg = `${count} veículos importados do JSON com sucesso.`
      if (erros > 0) msg += ` ${erros} erro(s) ao importar.`
      toast({ title: "Importação concluída", description: msg })
      loadData()
    } catch (err) {
      toast({ title: "Erro ao importar JSON", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    }
  }

  // Função para calcular despesa mensal do veículo
  function getDespesaMensal(id: string) {
    if (!saidas.length) return 0
    const now = new Date()
    const inicioMes = startOfMonth(now)
    const fimMes = endOfMonth(now)
    return saidas
      .filter(s => s.veiculoId === id && s.data && new Date(s.data) >= inicioMes && new Date(s.data) <= fimMes)
      .reduce((acc, s) => acc + ((s.valorUnitario ?? 0) * s.quantidade), 0)
  }

  return (
    <>
      <Toaster />
      {isMobile ? (
        <>
          <VeiculosMobileView
            veiculos={veiculos}
            isLoading={isLoading}
            isSaidasLoading={isSaidasLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            secretariaFilter={secretariaFilter}
            setSecretariaFilter={setSecretariaFilter}
            filteredData={filteredData}
            processedData={processedData}
            paginatedData={paginatedData}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalPages={totalPages}
            pageNumbers={pageNumbers}
            handleNew={handleNew}
            handleEdit={handleEdit}
            handleView={handleView}
            handleDeleteClick={handleDeleteClick}
            secretarias={secretarias}
            getDespesaMensal={getDespesaMensal}
            setVeiculoTrocaOleo={setVeiculoTrocaOleo}
            setTrocaOleoOpen={setTrocaOleoOpen}
          />
          <VeiculoForm
            open={formOpen}
            onOpenChange={setFormOpen}
            editingId={isViewing ? viewingId : editingId}
            onSuccess={loadData}
            isViewing={isViewing}
          />
          <DeleteConfirmation
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={handleDelete}
            title="Excluir veículo"
            description="Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita."
          />
          {veiculoTrocaOleo && (
            <TrocaOleoDialog
              isOpen={trocaOleoOpen}
              onClose={() => setTrocaOleoOpen(false)}
              veiculo={veiculoTrocaOleo}
              onSuccess={() => {
                setTrocaOleoOpen(false)
                setVeiculoTrocaOleo(null)
                loadData()
              }}
            />
          )}
          <RelatorioAvancadoVeiculosDialog
            open={relatorioAvancadoOpen}
            onOpenChange={setRelatorioAvancadoOpen}
            veiculos={veiculos}
            onExport={() => {
              toast({
                title: "Exportação concluída",
                description: "O relatório avançado foi gerado com sucesso.",
              })
            }}
          />
        </>
      ) : (
    <div className="space-y-6">
      <Card className="shadow-md-custom">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
              {/* Barra de pesquisa */}
              <div className="relative w-full md:w-auto flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar veículos..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por secretaria */}
              <div className="w-full md:w-auto">
                <Select value={secretariaFilter} onValueChange={setSecretariaFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filtrar secretaria" />
                    </div>
                  </SelectTrigger>
                  <SelectContent position="popper" side="top">
                    <SelectItem value="all">Todas as secretarias</SelectItem>
                    {secretarias.map((secretaria) => (
                      <SelectItem key={secretaria} value={secretaria}>
                        {secretaria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botões de alternância de visualização */}
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none px-3 ${viewMode === "table" ? "bg-muted" : ""}`}
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="h-4 w-4 mr-1" />
                  <span className="sr-only md:not-sr-only md:inline-block">Tabela</span>
                </Button>
                <div className="w-px h-8 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none px-3 ${viewMode === "cards" ? "bg-muted" : ""}`}
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  <span className="sr-only md:not-sr-only md:inline-block">Cards</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {/* Botão novo veículo */}
              <Button className="w-full md:w-auto btn-gradient shadow-md-custom" onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" /> Novo Veículo
              </Button>
              {/* Botão relatório PDF */}
              <Button
                className="w-full md:w-auto shadow-md-custom"
                variant="outline"
                onClick={() => handleExport("pdf")}
                title="Exportar relatório em PDF com todos os dados dos veículos"
              >
                <FileText className="mr-2 h-4 w-4" /> Relatório PDF
              </Button>
              {/* Botão relatório Excel */}
              <Button
                className="w-full md:w-auto shadow-md-custom"
                variant="outline"
                onClick={() => handleExport("excel")}
                title="Exportar relatório em Excel com todos os dados dos veículos"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Relatório Excel
              </Button>
              {/* Botão relatório avançado */}
              <Button
                className="w-full md:w-auto shadow-md-custom"
                variant="outline"
                onClick={() => setRelatorioAvancadoOpen(true)}
                title="Gerar relatório personalizado com filtros e ordenação avançados"
              >
                <Download className="mr-2 h-4 w-4" /> Relatório Avançado
              </Button>
            </div>
          </div>

          {/* Visualização em Tabela */}
          {viewMode === "table" && (
            <div className="rounded-md border shadow-sm-custom overflow-x-auto">
              <Table>
                <TableCaption>Lista de veículos cadastrados no sistema.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => toggleSort("placa")} className="cursor-pointer">
                      <div className="flex items-center">Placa {renderSortIcon("placa")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("modelo")} className="cursor-pointer">
                      <div className="flex items-center">Modelo {renderSortIcon("modelo")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("marca")} className="cursor-pointer">
                      <div className="flex items-center">Marca {renderSortIcon("marca")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("ano")} className="cursor-pointer">
                      <div className="flex items-center">Ano {renderSortIcon("ano")}</div>
                    </TableHead>
                    {/* <TableHead onClick={() => toggleSort("cor")} className="cursor-pointer">
                      <div className="flex items-center">Cor {renderSortIcon("cor")}</div>
                    </TableHead> */}
                    <TableHead onClick={() => toggleSort("tipo")} className="cursor-pointer">
                      <div className="flex items-center">Tipo {renderSortIcon("tipo")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("secretaria")} className="cursor-pointer">
                      <div className="flex items-center">Secretaria {renderSortIcon("secretaria")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("despesaMensal")} className="cursor-pointer">
                      <div className="flex items-center">Despesa Mensal {renderSortIcon("despesaMensal")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("status")} className="cursor-pointer">
                      <div className="flex items-center">Status {renderSortIcon("status")}</div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((veiculo) => (
                      <TableRow key={veiculo.id}>
                        <TableCell className="font-medium">{veiculo.placa}</TableCell>
                        <TableCell>{veiculo.modelo}</TableCell>
                        <TableCell>{veiculo.marca}</TableCell>
                        <TableCell>{veiculo.ano}</TableCell>
                        {/* <TableCell>{veiculo.cor}</TableCell> */}
                        <TableCell>{veiculo.tipo}</TableCell>
                        <TableCell>{veiculo.secretaria}</TableCell>
                        <TableCell className="font-bold text-blue-900">{isSaidasLoading ? '...' : `R$ ${getDespesaMensal(veiculo.id).toFixed(2)}`}</TableCell>
                        <TableCell>
                          <Badge variant={veiculo.status === "Ativo" ? "default" : "destructive"} className="text-xs">
                            {veiculo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Abrir menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleView(veiculo.id)}
                                  className="text-blue-600 dark:text-blue-400 focus:text-blue-600 dark:focus:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-950 cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span className="font-medium">Visualizar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(veiculo.id)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setVeiculoTrocaOleo(veiculo)
                                    setTrocaOleoOpen(true)
                                  }}
                                >
                                  <span className="mr-2">🛢️</span>
                                  Registrar Troca de Óleo
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(veiculo.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyState
                      colSpan={9}
                      title={
                        searchTerm || secretariaFilter ? "Nenhum resultado encontrado" : "Nenhum veículo cadastrado"
                      }
                      description={
                        searchTerm || secretariaFilter
                          ? "Tente usar termos diferentes na busca ou remover os filtros"
                          : "Adicione um novo veículo para começar"
                      }
                      icon={<Car className="h-10 w-10 text-muted-foreground/50" />}
                    />
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Visualização em Cards */}
          {viewMode === "cards" && (
            <div>
              {paginatedData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedData.map((veiculo) => (
                    <VeiculoCard
                      key={veiculo.id}
                      veiculo={veiculo}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onView={handleView}
                    />
                  ))}
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Car className="h-10 w-10 text-muted-foreground/50 mb-4" />
                    <p className="mb-2">
                      {searchTerm || secretariaFilter ? "Nenhum resultado encontrado" : "Nenhum veículo cadastrado"}
                    </p>
                    <p className="text-sm">
                      {searchTerm || secretariaFilter
                        ? "Tente usar termos diferentes na busca ou remover os filtros"
                        : "Adicione um novo veículo para começar"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {processedData.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">Itens por página</p>
                <Select
                  value={itemsPerPage}
                  onValueChange={(value) => {
                    setItemsPerPage(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Mostrando {Math.min(processedData.length, (currentPage - 1) * Number.parseInt(itemsPerPage) + 1)}-
                  {Math.min(processedData.length, currentPage * Number.parseInt(itemsPerPage))} de{" "}
                  {processedData.length}
                </p>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) setCurrentPage(currentPage - 1)
                      }}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {pageNumbers.map((pageNumber, index) => (
                    <PaginationItem key={index}>
                      {pageNumber < 0 ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={currentPage === pageNumber}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(pageNumber)
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                      }}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <VeiculoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingId={isViewing ? viewingId : editingId}
        onSuccess={loadData}
        isViewing={isViewing}
      />

      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir veículo"
        description="Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita."
      />

      {veiculoTrocaOleo && (
        <TrocaOleoDialog
          isOpen={trocaOleoOpen}
          onClose={() => setTrocaOleoOpen(false)}
          veiculo={veiculoTrocaOleo}
          onSuccess={() => {
            setTrocaOleoOpen(false)
            setVeiculoTrocaOleo(null)
            loadData()
          }}
        />
      )}

      <RelatorioAvancadoVeiculosDialog
        open={relatorioAvancadoOpen}
        onOpenChange={setRelatorioAvancadoOpen}
        veiculos={veiculos}
        onExport={() => {
          toast({
            title: "Exportação concluída",
            description: "O relatório avançado foi gerado com sucesso.",
          })
        }}
      />

      </div>
      )}
    </>
  )
}
