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
import { getSaidasSupabase, deleteSaidaSupabase, type Saida } from "@/services/saida-service"
import { Search, Plus, Trash2, ArrowUpDown, Download, FileText, Filter, Pencil } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { getProdutosSupabase, type Produto } from "@/services/produto-service"

export default function SaidasPage() {
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")

  // Estado para ordenação
  const [sortField, setSortField] = useState<keyof Saida | null>("data")
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

  // Filtrar dados com base na pesquisa e no filtro de data
  const filteredData = useMemo(() => {
    let result = [...saidas]

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase()
      result = result.filter(
        (e) =>
          e.produtoNome.toLowerCase().includes(lowerQuery) ||
          e.responsavelNome.toLowerCase().includes(lowerQuery) ||
          (e.veiculoPlaca && e.veiculoPlaca.toLowerCase().includes(lowerQuery)) ||
          (e.veiculoModelo && e.veiculoModelo.toLowerCase().includes(lowerQuery))
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
  }, [saidas, searchTerm, dateFilter])

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
  const handleFormClose = (open: boolean) => {
    if (!open) {
      setEditingId(null)
    }
    setFormOpen(open)
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
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
                              onClick={() => handleEditClick(saida.id)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
                              onClick={() => handleDeleteClick(saida.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <EmptyState
                    colSpan={8}
                    title={
                      searchTerm || dateFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhuma saída cadastrada"
                    }
                    description={
                      searchTerm || dateFilter !== "all"
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
    </div>
  )
}
