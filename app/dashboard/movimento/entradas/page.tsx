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
import { getProdutosSupabase, type Produto } from "@/services/produto-service"
import { Search, Plus, Trash2, ArrowUpDown, Download, FileText, Filter, Pencil, Package } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"
import { Badge } from "@/components/ui/badge"

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
    <div className="w-full max-w-full overflow-x-hidden pl-3 pr-0 py-4 pb-6 flex flex-col items-start">
      <div className="w-[52%] mb-4 pl-0 pr-0">
        <MobileBackButton />
      </div>
      
      {/* Busca e Filtros */}
      <div className="flex flex-col gap-3 mb-4 w-[52%] pl-0 pr-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar entradas..."
            className="pl-10 h-11 text-base w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full h-11 text-base">
            <div className="flex items-center min-w-0">
              <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
              <SelectValue placeholder="Filtrar por data" className="truncate" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as datas</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
          </SelectContent>
        </Select>

        <Button className="w-full btn-gradient h-11 text-base font-medium shadow-md" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-5 w-5" /> Nova Entrada
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16 w-[52%] pl-0 pr-0">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">Carregando entradas...</p>
          </div>
        </div>
      ) : paginatedData.length > 0 ? (
        <div className="space-y-3 w-[52%] pl-0 pr-0">
          {paginatedData.map((entrada) => (
            <Card key={entrada.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow w-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    {/* Produto e Info Principal */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-lg text-primary truncate">{entrada.produtoDescricao}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {produtoCategoriaMap[entrada.produtoId] || "-"}
                        </div>
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs px-2 py-1 h-auto">
                          Qtd: {entrada.quantidade}
                        </Badge>
                        {entrada.valorUnitario !== undefined && (
                          <>
                            <Badge variant="outline" className="text-xs px-2 py-1 h-auto">
                              Unit: R$ {entrada.valorUnitario.toFixed(2)}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-1 h-auto font-semibold text-green-700 dark:text-green-400 border-green-300 dark:border-green-600">
                              Total: R$ {(entrada.valorUnitario * entrada.quantidade).toFixed(2)}
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <div>Responsável: {entrada.responsavelNome}</div>
                        <div>Data: {formatDate(entrada.data)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu de Ações */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => handleEditClick(entrada.id)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400"
                      onClick={() => handleDeleteClick(entrada.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground w-[52%] pl-0 pr-0">
          <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-base font-medium mb-1">
            {searchTerm || dateFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhuma entrada cadastrada"}
          </p>
          <p className="text-sm">
            {searchTerm || dateFilter !== "all"
              ? "Tente usar termos diferentes na busca ou remover os filtros"
              : "Adicione uma nova entrada para começar"}
          </p>
        </div>
      )}

      {/* Paginação */}
      {processedData.length > 0 && (
        <div className="flex flex-col gap-3 mt-6 w-[52%] pl-0 pr-0">
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
              Mostrando {Math.min(processedData.length, (currentPage - 1) * Number.parseInt(itemsPerPage) + 1)}-
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
                    colSpan={7}
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
    </div>
  )
}
