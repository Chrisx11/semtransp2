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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { EmptyState } from "@/components/empty-state"
import { EntradaForm } from "@/components/entrada-form"
import { getEntradasSupabase, deleteEntradaSupabase, type Entrada } from "@/services/entrada-service"
import { getProdutosSupabase, type Produto, getProdutoByIdSupabase, updateProdutoSupabase } from "@/services/produto-service"
import { addSaidaSupabase } from "@/services/saida-service"
import { getColaboradorByIdSupabase } from "@/services/colaborador-service"
import { getVeiculoByIdSupabase, type Veiculo } from "@/services/veiculo-service"
import { SelecionarVeiculoDialog } from "@/components/selecionar-veiculo-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, Trash2, ArrowUpDown, Download, FileText, Filter, Pencil, Package, MoreVertical, CheckSquare, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Componente Mobile View
function EntradasMobileView({
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
  isLoading,
  produtoCategoriaMap,
  formatDate,
  handleEditClick,
  handleDeleteClick,
  setFormOpen,
}: {
  paginatedData: Entrada[]
  processedData: Entrada[]
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
  isLoading: boolean
  produtoCategoriaMap: Record<string, string>
  formatDate: (dateString: string) => string
  handleEditClick: (id: string) => void
  handleDeleteClick: (id: string) => void
  setFormOpen: (open: boolean) => void
}) {
  return (
    <div className="w-full min-w-0 px-2 py-3 space-y-3 overflow-x-hidden box-border">
      <div className="w-full min-w-0">
        <MobileBackButton />
      </div>

      <div className="relative w-full min-w-0">
        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar entradas..."
          className="pl-7 text-sm w-full min-w-0 box-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger className="w-full text-sm min-w-0 box-border">
          <div className="flex items-center min-w-0 w-full">
            <Filter className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <SelectValue placeholder="Filtrar por data" className="truncate min-w-0" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as datas</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="week">Esta semana</SelectItem>
          <SelectItem value="month">Este mês</SelectItem>
        </SelectContent>
      </Select>

      <Button className="w-full min-w-0 btn-gradient shadow-md text-sm h-9 box-border" onClick={() => setFormOpen(true)}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Nova Entrada
      </Button>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-xs text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
          Carregando entradas...
        </div>
      ) : paginatedData.length > 0 ? (
        <div className="space-y-2 w-full min-w-0">
          {paginatedData.map((entrada) => (
            <Card key={entrada.id} className="border border-primary/20 shadow-sm hover:shadow-md transition-all duration-200 w-full min-w-0 overflow-hidden box-border">
              <CardContent className="px-2 py-2 space-y-2 w-full min-w-0 box-border">
                <div className="flex items-start justify-between gap-1.5 w-full min-w-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-sm font-semibold truncate w-full">{entrada.produtoDescricao}</div>
                    <div className="text-[10px] text-muted-foreground truncate w-full">
                      {produtoCategoriaMap[entrada.produtoId] || "-"}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 flex-shrink-0"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32 text-sm">
                      <DropdownMenuItem
                        onClick={() => handleEditClick(entrada.id)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(entrada.id)}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1.5 w-full min-w-0">
                  <div className="flex items-center gap-1 flex-wrap w-full min-w-0">
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-auto whitespace-nowrap">
                      Qtd: {entrada.quantidade}
                    </Badge>
                    {entrada.valorUnitario !== undefined && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-auto whitespace-nowrap">
                        R$ {entrada.valorUnitario.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  {entrada.valorUnitario !== undefined && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-auto font-semibold text-green-700 dark:text-green-400 border-green-300 dark:border-green-600 w-fit max-w-full truncate whitespace-nowrap">
                      Total: R$ {(entrada.valorUnitario * entrada.quantidade).toFixed(2)}
                    </Badge>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground w-full min-w-0">
                  <div className="truncate w-full">Responsável: {entrada.responsavelNome}</div>
                  <div className="truncate w-full">Data: {formatDate(entrada.data)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">
            {searchTerm || dateFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhuma entrada cadastrada"}
          </p>
          <p className="text-xs">
            {searchTerm || dateFilter !== "all"
              ? "Tente usar termos diferentes na busca ou remover os filtros"
              : "Adicione uma nova entrada para começar"}
          </p>
        </div>
      )}

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

export default function EntradasPage() {
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")

  // Estado para ordenação
  const [sortField, setSortField] = useState<keyof Entrada | null>("data")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Estado para pesquisa e filtro
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("all")

  // Estado para o modal de formulário
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estado para o modal de confirmação de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Estado para os dados
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estado para saída rápida
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedEntradas, setSelectedEntradas] = useState<Set<string>>(new Set())
  const [veiculoDialogOpen, setVeiculoDialogOpen] = useState(false)

  const { toast } = useToast()

  // Carregar dados do Supabase (entradas e produtos)
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [entradasData, produtosData] = await Promise.all([
        getEntradasSupabase(),
        getProdutosSupabase()
      ])
      setEntradas(entradasData)
      setProdutos(produtosData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das entradas.",
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

  // Função para alternar a ordenação
  const toggleSort = (field: keyof Entrada) => {
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
  const renderSortIcon = (field: keyof Entrada) => {
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

  // Função para excluir uma entrada (Supabase)
  const handleDelete = async () => {
    if (!deletingId) return

    try {
      // Simular um pequeno atraso
      await new Promise((resolve) => setTimeout(resolve, 500))

      const entrada = entradas.find((e) => e.id === deletingId)
      const success = await deleteEntradaSupabase(deletingId)

      if (success && entrada) {
        toast({
          title: "Entrada excluída",
          description: `A entrada do produto ${entrada.produtoDescricao} foi excluída com sucesso.`,
        })
        loadData()
      } else {
        throw new Error("Falha ao excluir entrada")
      }
    } catch (error) {
      console.error("Erro ao excluir entrada:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a entrada.",
        variant: "destructive",
      })
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
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR })
    } catch (error) {
      return "Data inválida"
    }
  }

  // Filtrar dados com base na pesquisa e no filtro de data
  const filteredData = useMemo(() => {
    let result = [...entradas]

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase()
      result = result.filter(
        (e) =>
          e.produtoDescricao.toLowerCase().includes(lowerQuery) || e.responsavelNome.toLowerCase().includes(lowerQuery),
      )
    }

    // Aplicar filtro de data
    if (dateFilter && dateFilter !== "all") {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      if (dateFilter === "today") {
        result = result.filter((e) => new Date(e.data) >= startOfToday)
      } else if (dateFilter === "week") {
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        result = result.filter((e) => new Date(e.data) >= startOfWeek)
      } else if (dateFilter === "month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        result = result.filter((e) => new Date(e.data) >= startOfMonth)
      }
    }

    return result
  }, [entradas, searchTerm, dateFilter])

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
  }, [searchTerm, dateFilter])

  // Função para fechar o formulário e limpar o ID de edição
  const handleFormClose = () => {
    setFormOpen(false)
    setEditingId(null)
  }

  // Lookup de categoria por produtoId
  const produtoCategoriaMap = useMemo(() => {
    const map: Record<string, string> = {}
    produtos.forEach((p) => {
      map[p.id] = p.categoria
    })
    return map
  }, [produtos])

  // Funções para saída rápida
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedEntradas(new Set())
  }

  const handleToggleEntradaSelection = (entradaId: string) => {
    const newSelected = new Set(selectedEntradas)
    if (newSelected.has(entradaId)) {
      newSelected.delete(entradaId)
    } else {
      newSelected.add(entradaId)
    }
    setSelectedEntradas(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedEntradas.size === paginatedData.length) {
      setSelectedEntradas(new Set())
    } else {
      setSelectedEntradas(new Set(paginatedData.map(e => e.id)))
    }
  }

  const handleConfirmarSaidaRapida = () => {
    if (selectedEntradas.size === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos uma entrada para criar a saída rápida.",
        variant: "destructive",
      })
      return
    }
    setVeiculoDialogOpen(true)
  }

  const handleVeiculoSelect = async (veiculo: Veiculo) => {
    setVeiculoDialogOpen(false)
    setIsLoading(true)

    try {
      const entradasSelecionadas = entradas.filter(e => selectedEntradas.has(e.id))
      let sucesso = 0
      let erros = 0

      for (const entrada of entradasSelecionadas) {
        try {
          // Buscar dados necessários
          const produto = await getProdutoByIdSupabase(entrada.produtoId)
          if (!produto) {
            erros++
            continue
          }

          // Verificar estoque
          if (produto.estoque < entrada.quantidade) {
            toast({
              title: "Estoque insuficiente",
              description: `Produto ${entrada.produtoDescricao} não possui estoque suficiente. Disponível: ${produto.estoque}`,
              variant: "destructive",
            })
            erros++
            continue
          }

          const responsavel = await getColaboradorByIdSupabase(entrada.responsavelId)
          if (!responsavel) {
            erros++
            continue
          }

          // Criar saída
          await addSaidaSupabase({
            produtoId: entrada.produtoId,
            produtoNome: entrada.produtoDescricao,
            categoria: produto.categoria,
            quantidade: entrada.quantidade,
            valorUnitario: entrada.valorUnitario,
            data: new Date().toISOString(),
            responsavelId: entrada.responsavelId,
            responsavelNome: entrada.responsavelNome,
            veiculoId: veiculo.id,
            veiculoPlaca: veiculo.placa,
            veiculoModelo: veiculo.modelo,
            observacao: `Saída rápida criada a partir da entrada ${entrada.id}`,
          })

          // Atualizar estoque
          await updateProdutoSupabase(produto.id, {
            estoque: produto.estoque - entrada.quantidade,
          })

          sucesso++
        } catch (error) {
          console.error(`Erro ao criar saída para entrada ${entrada.id}:`, error)
          erros++
        }
      }

      if (sucesso > 0) {
        toast({
          title: "Saídas criadas com sucesso",
          description: `${sucesso} saída(s) criada(s) para o veículo ${veiculo.placa}.${erros > 0 ? ` ${erros} erro(s) ocorreram.` : ''}`,
        })
        // Limpar seleção e desativar modo de seleção
        setSelectedEntradas(new Set())
        setIsSelectionMode(false)
        // Recarregar dados
        loadData()
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar as saídas.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar saídas:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar as saídas.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <>
        <EntradasMobileView
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
          isLoading={isLoading}
          produtoCategoriaMap={produtoCategoriaMap}
          formatDate={formatDate}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          setFormOpen={setFormOpen}
        />
        
        {/* Modais compartilhados */}
        <Dialog open={formOpen} onOpenChange={handleFormClose}>
          <DialogContent className="max-w-[95vw] w-full mx-2">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Entrada" : "Nova Entrada"}</DialogTitle>
            </DialogHeader>
            <EntradaForm
              onSuccess={() => {
                handleFormClose()
                loadData()
              }}
              entradaId={editingId || undefined}
            />
          </DialogContent>
        </Dialog>

        <DeleteConfirmation
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          title="Excluir entrada"
          description="Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita e o estoque será atualizado."
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
                  placeholder="Buscar entradas..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por data */}
              <div className="w-full md:w-auto">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filtrar por data" />
                    </div>
                  </SelectTrigger>
                  <SelectContent position="popper" side="top">
                    <SelectItem value="all">Todas as datas</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {/* Botão saída rápida (apenas desktop) */}
              {!isMobile && (
                <>
                  {!isSelectionMode ? (
                    <Button 
                      variant="outline" 
                      className="w-full md:w-auto shadow-md-custom" 
                      onClick={handleToggleSelectionMode}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" /> Saída Rápida
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="shadow-md-custom" 
                        onClick={handleToggleSelectionMode}
                      >
                        <X className="mr-2 h-4 w-4" /> Cancelar
                      </Button>
                      <Button 
                        className="btn-gradient shadow-md-custom" 
                        onClick={handleConfirmarSaidaRapida}
                        disabled={selectedEntradas.size === 0}
                      >
                        Confirmar ({selectedEntradas.size})
                      </Button>
                    </div>
                  )}
                </>
              )}
              {/* Botão nova entrada */}
              <Button className="w-full md:w-auto btn-gradient shadow-md-custom" onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Entrada
              </Button>
            </div>
          </div>

          {/* Visualização em Tabela */}
          <div className="rounded-md border shadow-sm-custom overflow-hidden">
            <Table>
              <TableCaption>Lista de entradas de produtos no estoque.</TableCaption>
              <TableHeader>
                <TableRow>
                  {isSelectionMode && (
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedEntradas.size === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead onClick={() => toggleSort("produtoDescricao")} className="cursor-pointer">
                    <div className="flex items-center">Produto {renderSortIcon("produtoDescricao")}</div>
                  </TableHead>
                  <TableHead>
                    Categoria
                  </TableHead>
                  <TableHead onClick={() => toggleSort("responsavelNome")} className="cursor-pointer">
                    <div className="flex items-center">Responsável {renderSortIcon("responsavelNome")}</div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("quantidade")} className="cursor-pointer">
                    <div className="flex items-center">Entrada {renderSortIcon("quantidade")}</div>
                  </TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead onClick={() => toggleSort("data")} className="cursor-pointer">
                    <div className="flex items-center">Data {renderSortIcon("data")}</div>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((entrada) => (
                    <TableRow key={entrada.id}>
                      {isSelectionMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedEntradas.has(entrada.id)}
                            onCheckedChange={() => handleToggleEntradaSelection(entrada.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{entrada.produtoDescricao}</TableCell>
                      <TableCell>{produtoCategoriaMap[entrada.produtoId] || "-"}</TableCell>
                      <TableCell>{entrada.responsavelNome}</TableCell>
                      <TableCell>{entrada.quantidade}</TableCell>
                      <TableCell>{entrada.valorUnitario !== undefined ? `R$ ${entrada.valorUnitario.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>{entrada.valorUnitario !== undefined ? `R$ ${(entrada.valorUnitario * entrada.quantidade).toFixed(2)}` : '-'}</TableCell>
                      <TableCell>{formatDate(entrada.data)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
                            onClick={() => handleEditClick(entrada.id)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
                            onClick={() => handleDeleteClick(entrada.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyState
                    colSpan={isSelectionMode ? 8 : 7}
                    title={
                      searchTerm || dateFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhuma entrada cadastrada"
                    }
                    description={
                      searchTerm || dateFilter !== "all"
                        ? "Tente usar termos diferentes na busca ou remover os filtros"
                        : "Adicione uma nova entrada para começar"
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

      <Dialog open={formOpen} onOpenChange={handleFormClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Entrada" : "Nova Entrada"}</DialogTitle>
          </DialogHeader>
          <EntradaForm
            onSuccess={() => {
              handleFormClose()
              loadData()
            }}
            entradaId={editingId || undefined}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir entrada"
        description="Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita e o estoque será atualizado."
      />

      {/* Diálogo de seleção de veículo para saída rápida */}
      <SelecionarVeiculoDialog
        open={veiculoDialogOpen}
        onOpenChange={setVeiculoDialogOpen}
        onSelect={handleVeiculoSelect}
      />
    </div>
  )
}
