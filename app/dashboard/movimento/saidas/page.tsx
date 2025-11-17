"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { EmptyState } from "@/components/empty-state"
import { SaidaFormDialog } from "@/components/saida-form-dialog"
import { getSaidasSupabase, deleteSaidaSupabase, updateSaidaSupabase, type Saida } from "@/services/saida-service"
import { Search, Plus, Trash2, ArrowUpDown, Download, FileText, Filter, Pencil, Package, Car, MoreVertical, Calendar as CalendarIcon, DollarSign } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { getProdutosSupabase, type Produto } from "@/services/produto-service"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"
import { Badge } from "@/components/ui/badge"

// Componente Mobile View
function SaidasMobileView({
  paginatedData,
  processedData,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalPages,
  pageNumbers,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  placaFilter,
  setPlacaFilter,
  isLoading,
  produtos,
  formatDate,
  handleEditClick,
  handleDeleteClick,
  handleEditDataClick,
  handleEditValorClick,
  setFormOpen,
}: {
  paginatedData: Saida[]
  processedData: Saida[]
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: string
  setItemsPerPage: (value: string) => void
  totalPages: number
  pageNumbers: number[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  dateFilter: string
  setDateFilter: (value: string) => void
  placaFilter: string
  setPlacaFilter: (value: string) => void
  isLoading: boolean
  produtos: Produto[]
  formatDate: (dateString: string) => string
  handleEditClick: (id: string) => void
  handleDeleteClick: (id: string) => void
  handleEditDataClick: (saida: Saida) => void
  handleEditValorClick: (saida: Saida) => void
  setFormOpen: (open: boolean) => void
}) {
  return (
    <div className="w-full min-w-0 px-2 py-3 space-y-3 overflow-x-hidden box-border">
      <div className="w-full min-w-0">
        <MobileBackButton />
      </div>
      
      {/* Busca e Filtros */}
      <div className="flex flex-col gap-3 w-full min-w-0">
        <div className="relative w-full min-w-0">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar saídas..."
            className="pl-7 text-sm w-full min-w-0 box-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full text-sm min-w-0 box-border justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
              {dateFilter ? (
                format(dateFilter, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                <span className="text-muted-foreground">Filtrar por data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              locale={ptBR}
              initialFocus
            />
            <div className="p-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setDateFilter(undefined)}
              >
                Limpar filtro
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="relative w-full min-w-0">
          <Car className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filtrar por placa..."
            className="pl-7 text-sm w-full min-w-0 box-border"
            value={placaFilter}
            onChange={(e) => setPlacaFilter(e.target.value)}
          />
        </div>

        <Button className="w-full min-w-0 btn-gradient shadow-md text-sm h-9 box-border" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Nova Saída
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12 w-full min-w-0">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-2"></div>
            <p className="text-xs text-muted-foreground">Carregando saídas...</p>
          </div>
        </div>
      ) : paginatedData.length > 0 ? (
        <div className="space-y-2 w-full min-w-0">
          {paginatedData.map((saida) => {
            // Buscar o produto correspondente
            const produto = produtos.find((p) => p.id === saida.produtoId)
            // Buscar similares desse produto
            const similares = produto && produto.produtosSimilares && produto.produtosSimilares.length > 0
              ? produtos.filter((p) => produto.produtosSimilares.includes(p.id))
              : []
            
            return (
              <Card key={saida.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden box-border">
                <CardContent className="px-2 py-2 space-y-2 w-full min-w-0 box-border">
                  <div className="flex items-start justify-between gap-1.5 w-full min-w-0">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {/* Produto e Info Principal */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
                          <Package className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="font-semibold text-sm text-primary truncate w-full">{saida.produtoNome}</div>
                          <div className="text-[10px] text-muted-foreground truncate w-full">
                            {saida.categoria || "-"}
                          </div>
                          {similares.length > 0 && (
                            <div className="text-[9px] text-blue-600 dark:text-blue-300 mt-0.5 truncate w-full">
                              Similares: {similares.map((s) => s.descricao).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="flex flex-col gap-1.5 mt-2 w-full min-w-0">
                        <div className="flex items-center gap-1 flex-wrap w-full min-w-0">
                          <Badge variant="outline" className="text-[8px] px-1 py-0 h-auto whitespace-nowrap">
                            Qtd: {saida.quantidade}
                          </Badge>
                          {saida.valorUnitario !== undefined && (
                            <>
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-auto whitespace-nowrap">
                                Unit: R$ {saida.valorUnitario.toFixed(2)}
                              </Badge>
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-auto font-semibold text-red-700 dark:text-red-400 border-red-300 dark:border-red-600 whitespace-nowrap">
                                Total: R$ {(saida.valorUnitario * saida.quantidade).toFixed(2)}
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 w-full min-w-0">
                          <div className="truncate w-full">Responsável: {saida.responsavelNome}</div>
                          <div className="truncate w-full">Data: {formatDate(saida.data)}</div>
                          {saida.veiculoPlaca && saida.veiculoModelo && (
                            <div className="flex items-center gap-1 mt-0.5 truncate w-full">
                              <Car className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{saida.veiculoPlaca} - {saida.veiculoModelo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu de Ações */}
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem onClick={() => handleEditClick(saida.id)}>
                            <Pencil className="mr-1.5 h-3 w-3" />
                            Editar Completo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDataClick(saida)}>
                            <Calendar className="mr-1.5 h-3 w-3" />
                            Editar Data
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditValorClick(saida)}>
                            <DollarSign className="mr-1.5 h-3 w-3" />
                            Editar Valor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(saida.id)}
                            className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <Trash2 className="mr-1.5 h-3 w-3" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground w-full min-w-0">
          <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">
            {searchTerm || dateFilter || placaFilter ? "Nenhum resultado encontrado" : "Nenhuma saída cadastrada"}
          </p>
          <p className="text-xs">
            {searchTerm || dateFilter || placaFilter
              ? "Tente usar termos diferentes na busca ou remover os filtros"
              : "Adicione uma nova saída para começar"}
          </p>
        </div>
      )}

      {/* Paginação */}
      {processedData.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-4 w-full min-w-0 overflow-x-hidden box-border">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground w-full min-w-0 flex-wrap">
            <Select
              value={itemsPerPage}
              onValueChange={(value) => {
                setItemsPerPage(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[60px] h-8 text-xs box-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs whitespace-nowrap min-w-0">
              {Math.min(processedData.length, (currentPage - 1) * Number.parseInt(itemsPerPage) + 1)}-
              {Math.min(processedData.length, currentPage * Number.parseInt(itemsPerPage))} de {processedData.length}
            </span>
          </div>

          <Pagination className="w-full min-w-0 overflow-x-hidden box-border">
            <PaginationContent className="flex-wrap gap-1 w-full min-w-0">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={`text-xs h-8 ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`}
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
                      className="min-w-[28px] h-8 text-xs"
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
                  className={`text-xs h-8 ${currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

export default function SaidasPage() {
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")

  // Estado para ordenação
  const [sortField, setSortField] = useState<keyof Saida | null>("data")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Estado para pesquisa e filtro
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [placaFilter, setPlacaFilter] = useState<string>("")
  
  // Estados para diálogos de edição rápida
  const [editDataDialogOpen, setEditDataDialogOpen] = useState(false)
  const [editValorDialogOpen, setEditValorDialogOpen] = useState(false)
  const [saidaParaEditar, setSaidaParaEditar] = useState<Saida | null>(null)
  const [novaData, setNovaData] = useState("")
  const [novoValor, setNovoValor] = useState("")

  // Estado para o modal de formulário
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estado para o modal de confirmação de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Estado para os dados
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estado para todos os produtos (para buscar similares)
  const [produtos, setProdutos] = useState<Produto[]>([])

  const { toast } = useToast()

  // Carregar dados do Supabase
  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getSaidasSupabase()
      setSaidas(data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das saídas.",
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

  // Carregar todos os produtos para exibir similares
  useEffect(() => {
    getProdutosSupabase().then(setProdutos)
  }, [])

  // Função para alternar a ordenação
  const toggleSort = (field: keyof Saida) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection("asc")
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Função para renderizar o ícone de ordenação
  const renderSortIcon = (field: keyof Saida) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }

    if (sortDirection === "asc") {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-primary" />
    }

    return <ArrowUpDown className="ml-2 h-4 w-4 text-primary rotate-180" />
  }

  // Função para abrir o formulário de edição
  const handleEditClick = (id: string) => {
    setEditingId(id)
    setFormOpen(true)
  }

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  // Função para excluir uma saída (Supabase)
  const handleDelete = async () => {
    if (!deletingId) return

    try {
      // Simular um pequeno atraso
      await new Promise((resolve) => setTimeout(resolve, 500))

      const saida = saidas.find((e) => e.id === deletingId)
      await deleteSaidaSupabase(deletingId)

      if (saida) {
        toast({
          title: "Saída excluída",
          description: `A saída do produto ${saida.produtoNome} foi excluída com sucesso.`,
        })
        loadData()
      } else {
        throw new Error("Falha ao excluir saída")
      }
    } catch (error) {
      console.error("Erro ao excluir saída:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a saída.",
        variant: "destructive",
      })
    } finally {
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  // Função para exportar dados
  const handleExport = (format: "csv" | "pdf") => {
    try {
      toast({
        title: "Exportação iniciada",
        description: `Exportando para ${format.toUpperCase()}...`,
      })

      // Simulação de exportação bem-sucedida
      setTimeout(() => {
        toast({
          title: "Exportação concluída",
          description: `Os dados foram exportados para ${format.toUpperCase()} com sucesso.`,
        })
      }, 1500)
    } catch (error) {
      console.error(`Erro ao exportar para ${format}:`, error)
      toast({
        title: "Erro na exportação",
        description: `Não foi possível exportar os dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    }
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return "Data inválida"
    }
  }

  // Filtrar dados com base na pesquisa e nos filtros
  const filteredData = useMemo(() => {
    let result = [...saidas]

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase()
      result = result.filter(
        (e) =>
          e.produtoNome.toLowerCase().includes(lowerQuery) ||
          e.responsavelNome.toLowerCase().includes(lowerQuery) ||
          (e.veiculoModelo && e.veiculoModelo.toLowerCase().includes(lowerQuery))
      )
    }

    // Aplicar filtro de placa
    if (placaFilter) {
      const lowerPlaca = placaFilter.toLowerCase()
      result = result.filter(
        (e) => e.veiculoPlaca && e.veiculoPlaca.toLowerCase().includes(lowerPlaca)
      )
    }

    // Aplicar filtro de data
    if (dateFilter) {
      const selectedDate = new Date(dateFilter)
      selectedDate.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      result = result.filter((e) => {
        const saidaDate = new Date(e.data)
        return saidaDate >= selectedDate && saidaDate <= endOfDay
      })
    }

    return result
  }, [saidas, searchTerm, dateFilter, placaFilter])

  // Aplicar ordenação aos dados filtrados
  const processedData = useMemo(() => {
    const result = [...filteredData]

    // Aplicar ordenação
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        if (sortField === "data") {
          const dateA = new Date(a[sortField]).getTime()
          const dateB = new Date(b[sortField]).getTime()
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA
        }

        if (sortField === "quantidade") {
          return sortDirection === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
        }

        // Para campos de texto
        const valueA = String(a[sortField]).toLowerCase()
        const valueB = String(b[sortField]).toLowerCase()
        return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
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
  }, [searchTerm, dateFilter, placaFilter])

  // Funções para edição rápida
  const handleEditDataClick = (saida: Saida) => {
    setSaidaParaEditar(saida)
    // Converter data ISO para formato YYYY-MM-DD
    const dataObj = new Date(saida.data)
    const year = dataObj.getFullYear()
    const month = String(dataObj.getMonth() + 1).padStart(2, '0')
    const day = String(dataObj.getDate()).padStart(2, '0')
    setNovaData(`${year}-${month}-${day}`)
    setEditDataDialogOpen(true)
  }

  const handleEditValorClick = (saida: Saida) => {
    setSaidaParaEditar(saida)
    setNovoValor(saida.valorUnitario?.toString() || "")
    setEditValorDialogOpen(true)
  }

  const handleSaveData = async () => {
    if (!saidaParaEditar || !novaData) return

    try {
      // Converter data para formato ISO
      const dataISO = new Date(novaData + 'T00:00:00').toISOString()
      await updateSaidaSupabase(saidaParaEditar.id, { data: dataISO })
      
      toast({
        title: "Data atualizada",
        description: "A data da saída foi atualizada com sucesso.",
      })
      
      loadData()
      setEditDataDialogOpen(false)
      setSaidaParaEditar(null)
      setNovaData("")
    } catch (error) {
      console.error("Erro ao atualizar data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a data.",
        variant: "destructive",
      })
    }
  }

  const handleSaveValor = async () => {
    if (!saidaParaEditar) return

    try {
      const valor = parseFloat(novoValor)
      if (isNaN(valor) || valor < 0) {
        toast({
          title: "Erro",
          description: "Por favor, insira um valor válido.",
          variant: "destructive",
        })
        return
      }

      await updateSaidaSupabase(saidaParaEditar.id, { valorUnitario: valor })
      
      toast({
        title: "Valor atualizado",
        description: "O valor unitário da saída foi atualizado com sucesso.",
      })
      
      loadData()
      setEditValorDialogOpen(false)
      setSaidaParaEditar(null)
      setNovoValor("")
    } catch (error) {
      console.error("Erro ao atualizar valor:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor.",
        variant: "destructive",
      })
    }
  }

  // Função para fechar o formulário e limpar o ID de edição
  const handleFormClose = (open: boolean) => {
    if (!open) {
      setEditingId(null)
    }
    setFormOpen(open)
  }

  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <>
        <SaidasMobileView
          paginatedData={paginatedData}
          processedData={processedData}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          placaFilter={placaFilter}
          setPlacaFilter={setPlacaFilter}
          isLoading={isLoading}
          produtos={produtos}
          formatDate={formatDate}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          handleEditDataClick={handleEditDataClick}
          handleEditValorClick={handleEditValorClick}
          setFormOpen={setFormOpen}
        />
        
        {/* Modais compartilhados */}
        <SaidaFormDialog
          open={formOpen}
          onOpenChange={handleFormClose}
          onSuccess={loadData}
          saidaToEdit={editingId ? saidas.find((s) => s.id === editingId) || null : null}
        />

        <DeleteConfirmation
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          title="Excluir saída"
          description="Tem certeza que deseja excluir esta saída? Esta ação não pode ser desfeita e o estoque será atualizado."
        />
      </>
    )
  }

  return (
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
                  placeholder="Buscar saídas..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por data */}
              <div className="w-full md:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full md:w-[180px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? (
                        format(dateFilter, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span className="text-muted-foreground">Filtrar por data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      locale={ptBR}
                      initialFocus
                    />
                    <div className="p-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setDateFilter(undefined)}
                      >
                        Limpar filtro
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Filtro de placa */}
              <div className="w-full md:w-auto">
                <div className="relative">
                  <Car className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Filtrar por placa..."
                    className="pl-8 w-full md:w-[200px]"
                    value={placaFilter}
                    onChange={(e) => setPlacaFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {/* Botão nova saída */}
              <Button className="w-full md:w-auto btn-gradient shadow-md-custom" onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Saída
              </Button>
            </div>
          </div>

          {/* Visualização em Tabela */}
          <div className="rounded-md border shadow-sm-custom overflow-hidden">
            <Table>
              <TableCaption>Lista de saídas de produtos do estoque.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort("produtoNome")} className="cursor-pointer">
                    <div className="flex items-center">Produto {renderSortIcon("produtoNome")}</div>
                  </TableHead>
                  <TableHead>
                    Categoria
                  </TableHead>
                  <TableHead onClick={() => toggleSort("responsavelNome")} className="cursor-pointer">
                    <div className="flex items-center">Responsável {renderSortIcon("responsavelNome")}</div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("quantidade")} className="cursor-pointer">
                    <div className="flex items-center">Quantidade {renderSortIcon("quantidade")}</div>
                  </TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead onClick={() => toggleSort("data")} className="cursor-pointer">
                    <div className="flex items-center">Data {renderSortIcon("data")}</div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("veiculoPlaca")} className="cursor-pointer">
                    <div className="flex items-center">Veículo {renderSortIcon("veiculoPlaca")}</div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((saida) => {
                    // Buscar o produto correspondente
                    const produto = produtos.find((p) => p.id === saida.produtoId)
                    // Buscar similares desse produto
                    const similares = produto && produto.produtosSimilares && produto.produtosSimilares.length > 0
                      ? produtos.filter((p) => produto.produtosSimilares.includes(p.id))
                      : []
                    return (
                      <TableRow key={saida.id}>
                        <TableCell className="font-medium">
                          {saida.produtoNome}
                          {similares.length > 0 && (
                            <div className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                              Similares: {similares.map((s) => s.descricao).join(", ")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{saida.categoria || "-"}</TableCell>
                        <TableCell>{saida.responsavelNome}</TableCell>
                        <TableCell>{saida.quantidade}</TableCell>
                        <TableCell>{saida.valorUnitario !== undefined ? `R$ ${saida.valorUnitario.toFixed(2)}` : '-'}</TableCell>
                        <TableCell>{saida.valorUnitario !== undefined ? `R$ ${(saida.valorUnitario * saida.quantidade).toFixed(2)}` : '-'}</TableCell>
                        <TableCell>{formatDate(saida.data)}</TableCell>
                        <TableCell>
                          {saida.veiculoPlaca && saida.veiculoModelo
                            ? `${saida.veiculoPlaca} - ${saida.veiculoModelo}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
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
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEditClick(saida.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Completo
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditDataClick(saida)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Editar Data
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditValorClick(saida)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Editar Valor
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(saida.id)}
                                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <EmptyState
                    colSpan={8}
                    title={
                      searchTerm || dateFilter || placaFilter ? "Nenhum resultado encontrado" : "Nenhuma saída cadastrada"
                    }
                    description={
                      searchTerm || dateFilter || placaFilter
                        ? "Tente usar termos diferentes na busca ou remover os filtros"
                        : "Adicione uma nova saída para começar"
                    }
                    icon={<Plus className="h-10 w-10 text-muted-foreground/50" />}
                  />
                )}
              </TableBody>
            </Table>
          </div>

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
                  <SelectContent>
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

      {/* Formulário de saída em diálogo */}
      <SaidaFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={loadData}
        saidaToEdit={editingId ? saidas.find((s) => s.id === editingId) || null : null}
      />

      {/* Diálogo de confirmação de exclusão */}
      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir saída"
        description="Tem certeza que deseja excluir esta saída? Esta ação não pode ser desfeita e o estoque será atualizado."
      />

      {/* Diálogo para editar data */}
      <Dialog open={editDataDialogOpen} onOpenChange={setEditDataDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Data</DialogTitle>
            <DialogDescription>
              Altere a data da saída do produto {saidaParaEditar?.produtoNome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data">Nova Data</Label>
              <Input
                id="data"
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDataDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveData}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar valor */}
      <Dialog open={editValorDialogOpen} onOpenChange={setEditValorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Valor Unitário</DialogTitle>
            <DialogDescription>
              Altere o valor unitário da saída do produto {saidaParaEditar?.produtoNome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Novo Valor Unitário (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
              />
            </div>
            {saidaParaEditar && (
              <div className="text-sm text-muted-foreground">
                Quantidade: {saidaParaEditar.quantidade} | 
                Valor Total: R$ {novoValor && !isNaN(parseFloat(novoValor)) 
                  ? (parseFloat(novoValor) * saidaParaEditar.quantidade).toFixed(2)
                  : '0.00'}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditValorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveValor}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
