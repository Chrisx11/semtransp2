"use client"

import { useState, useEffect } from "react"
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
  Plus,
  Search,
  ArrowUpDown,
  Users,
  Pencil,
  Trash2,
  Download,
  FileText,
  Filter,
  LayoutGrid,
  LayoutList,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { ColaboradorForm } from "@/components/colaborador-form"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { getColaboradores, deleteColaborador, type Colaborador } from "@/services/colaborador-service"
import { exportToCSV, exportToPDF, formatPhoneForDisplay } from "@/utils/export-utils"
import { ColaboradorCard } from "@/components/colaborador-card"

type SortDirection = "asc" | "desc" | null
type SortField = "nome" | "funcao" | "telefone" | "secretaria" | null
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

export default function ColaboradoresPage() {
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

  // Estado para o modal de confirmação de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Estado para os dados
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getColaboradores()
      setColaboradores(data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos colaboradores.",
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
    setFormOpen(true)
  }

  // Função para abrir o formulário para novo colaborador
  const handleNew = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  // Função para excluir um colaborador
  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const colaborador = colaboradores.find((c) => c.id === deletingId)
      const success = await deleteColaborador(deletingId)

      if (success && colaborador) {
        toast({
          title: "Colaborador excluído",
          description: `${colaborador.nome} foi excluído com sucesso.`,
        })
        loadData()
      } else {
        throw new Error("Falha ao excluir colaborador")
      }
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o colaborador.",
        variant: "destructive",
      })
    }
  }

  // Função para exportar dados
  const handleExport = (format: "csv" | "pdf") => {
    try {
      console.log(`Iniciando exportação para ${format}...`)
      console.log(`Dados a serem exportados:`, filteredData.length)

      // Usar os dados filtrados para exportação
      if (format === "csv") {
        const result = exportToCSV(filteredData, "colaboradores")
        console.log("Resultado da exportação CSV:", result)
        toast({
          title: "Exportação concluída",
          description: "Os dados foram exportados para CSV com sucesso.",
        })
      } else {
        const result = exportToPDF(filteredData, "colaboradores")
        console.log("Resultado da exportação PDF:", result)
        toast({
          title: "Exportação concluída",
          description: "Os dados foram exportados para PDF com sucesso.",
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

  // Filtrar dados com base na pesquisa e no filtro de secretaria
  const filteredData = colaboradores.filter((colaborador) => {
    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase()
      const matchesSearch =
        colaborador.nome.toLowerCase().includes(lowerQuery) ||
        colaborador.funcao.toLowerCase().includes(lowerQuery) ||
        colaborador.telefone.includes(lowerQuery) ||
        colaborador.secretaria.toLowerCase().includes(lowerQuery)

      if (!matchesSearch) return false
    }

    // Aplicar filtro de secretaria
    if (secretariaFilter && secretariaFilter !== "all") {
      return colaborador.secretaria === secretariaFilter
    }

    return true
  })

  // Aplicar ordenação aos dados filtrados
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue)
    } else {
      return bValue.localeCompare(aValue)
    }
  })

  // Calcular dados paginados
  const startIndex = (currentPage - 1) * Number(itemsPerPage)
  const paginatedData = sortedData.slice(startIndex, startIndex + Number(itemsPerPage))

  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(sortedData.length / Number(itemsPerPage)))

  // Gerar array de páginas para paginação
  const pageNumbers = (() => {
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
  })()

  // Resetar para a primeira página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, secretariaFilter])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg shadow-md-custom">
        <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
        <p className="text-muted-foreground">Gerenciamento de colaboradores</p>
      </div>

      <Card className="shadow-md-custom">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
              {/* Barra de pesquisa */}
              <div className="relative w-full md:w-auto flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar colaboradores..."
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
              {/* Botão novo colaborador */}
              <Button className="w-full md:w-auto btn-gradient shadow-md-custom" onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" /> Novo Colaborador
              </Button>
            </div>
          </div>

          {/* Visualização em Tabela */}
          {viewMode === "table" && (
            <div className="rounded-md border shadow-sm-custom overflow-hidden">
              <Table>
                <TableCaption>Lista de colaboradores cadastrados no sistema.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => toggleSort("nome")} className="cursor-pointer">
                      <div className="flex items-center">Nome {renderSortIcon("nome")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("funcao")} className="cursor-pointer">
                      <div className="flex items-center">Função {renderSortIcon("funcao")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("telefone")} className="cursor-pointer">
                      <div className="flex items-center">Telefone {renderSortIcon("telefone")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("secretaria")} className="cursor-pointer">
                      <div className="flex items-center">Secretaria {renderSortIcon("secretaria")}</div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Carregando colaboradores...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((colaborador) => (
                      <TableRow key={colaborador.id}>
                        <TableCell className="font-medium">{colaborador.nome}</TableCell>
                        <TableCell>{colaborador.funcao}</TableCell>
                        <TableCell>{formatPhoneForDisplay(colaborador.telefone)}</TableCell>
                        <TableCell>{colaborador.secretaria}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
                              onClick={() => handleEdit(colaborador.id)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
                              onClick={() => handleDeleteClick(colaborador.id)}
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
                      colSpan={5}
                      title={
                        searchTerm || secretariaFilter ? "Nenhum resultado encontrado" : "Nenhum colaborador cadastrado"
                      }
                      description={
                        searchTerm || secretariaFilter
                          ? "Tente usar termos diferentes na busca ou remover os filtros"
                          : "Adicione um novo colaborador para começar"
                      }
                      icon={<Users className="h-10 w-10 text-muted-foreground/50" />}
                    />
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Visualização em Cards */}
          {viewMode === "cards" && (
            <div>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Carregando colaboradores...</p>
                  </div>
                </div>
              ) : paginatedData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedData.map((colaborador) => (
                    <ColaboradorCard
                      key={colaborador.id}
                      colaborador={colaborador}
                      onEdit={() => handleEdit(colaborador.id)}
                      onDelete={() => handleDeleteClick(colaborador.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-10 w-10 text-muted-foreground/50 mb-4" />
                    <p className="mb-2">
                      {searchTerm || secretariaFilter ? "Nenhum resultado encontrado" : "Nenhum colaborador cadastrado"}
                    </p>
                    <p className="text-sm">
                      {searchTerm || secretariaFilter
                        ? "Tente usar termos diferentes na busca ou remover os filtros"
                        : "Adicione um novo colaborador para começar"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {sortedData.length > 0 && (
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
                  Mostrando {Math.min(sortedData.length, (currentPage - 1) * Number(itemsPerPage) + 1)}-
                  {Math.min(sortedData.length, currentPage * Number(itemsPerPage))} de {sortedData.length}
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

      <ColaboradorForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={loadData}
        colaborador={editingId ? colaboradores.find((c) => c.id === editingId) || null : null}
      />

      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir colaborador"
        description="Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita."
      />

      <Toaster />
    </div>
  )
}
