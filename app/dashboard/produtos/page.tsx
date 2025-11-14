"use client"

import { useState, useEffect, useMemo } from "react"
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
  Package,
  Pencil,
  Trash2,
  Download,
  FileText,
  Filter,
  LayoutGrid,
  LayoutList,
  Eye,
  MoreVertical,
  PackageCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { ProdutoForm } from "@/components/produto-form"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { getProdutosSupabase, deleteProdutoSupabase, updateProdutoSupabase, type Produto, getCategorias } from "@/services/produto-service"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { exportToCSV, exportToPDF, exportToXLSX } from "@/utils/export-produtos-utils"
import { ProdutoCard } from "@/components/produto-card"
import { ProdutoVisualizacao } from "@/components/produto-visualizacao"

type SortDirection = "asc" | "desc" | null
type SortField = "descricao" | "categoria" | "unidade" | "localizacao" | "estoque" | null
type ViewMode = "table" | "cards"

export default function ProdutosPage() {
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
  const [categoriaFilter, setCategoriaFilter] = useState<string>("")

  // Estado para o modal de formulário
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estado para o modal de visualização
  const [viewOpen, setViewOpen] = useState(false)
  const [viewingProduto, setViewingProduto] = useState<Produto | null>(null)

  // Estado para o modal de confirmação de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Estado para o modal de ajuste de estoque
  const [ajustarEstoqueOpen, setAjustarEstoqueOpen] = useState(false)
  const [produtoAjustando, setProdutoAjustando] = useState<Produto | null>(null)
  const [novoEstoque, setNovoEstoque] = useState<string>("")
  const [isAdjusting, setIsAdjusting] = useState(false)

  // Estado para os dados
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getProdutosSupabase()
      setProdutos(data)

      // Carregar categorias para o filtro
      const categoriasData = getCategorias()
      setCategorias(categoriasData.map((c) => c.nome))
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos produtos.",
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

  // Função para abrir o formulário para novo produto
  const handleNew = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  // Função para visualizar detalhes do produto
  const handleView = (produto: Produto) => {
    setViewingProduto(produto)
    setViewOpen(true)
  }

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  // Função para abrir o diálogo de ajuste de estoque
  const handleAjustarEstoque = (produto: Produto) => {
    setProdutoAjustando(produto)
    setNovoEstoque(produto.estoque.toString())
    setAjustarEstoqueOpen(true)
  }

  // Função para ajustar o estoque
  const handleAjustarEstoqueSubmit = async () => {
    if (!produtoAjustando) return

    const estoqueNumero = Number.parseInt(novoEstoque)
    if (isNaN(estoqueNumero) || estoqueNumero < 0) {
      toast({
        title: "Erro",
        description: "O estoque deve ser um número válido maior ou igual a zero.",
        variant: "destructive",
      })
      return
    }

    setIsAdjusting(true)
    try {
      await updateProdutoSupabase(produtoAjustando.id, { estoque: estoqueNumero })
      toast({
        title: "Estoque ajustado",
        description: `O estoque de ${produtoAjustando.descricao} foi atualizado para ${estoqueNumero.toLocaleString('pt-BR')}.`,
      })
      setAjustarEstoqueOpen(false)
      setProdutoAjustando(null)
      setNovoEstoque("")
      loadData()
    } catch (error) {
      console.error("Erro ao ajustar estoque:", error)
      toast({
        title: "Erro ao ajustar estoque",
        description: error instanceof Error ? error.message : "Erro desconhecido.",
        variant: "destructive",
      })
    } finally {
      setIsAdjusting(false)
    }
  }

  // Função para excluir um produto
  const handleDelete = async () => {
    if (!deletingId) return

    try {
      // Simular um pequeno atraso
      await new Promise((resolve) => setTimeout(resolve, 500))

      const produto = produtos.find((p) => p.id === deletingId)
      try {
        const success = await deleteProdutoSupabase(deletingId)
        if (success && produto) {
          toast({
            title: "Produto excluído",
            description: `${produto.descricao} foi excluído com sucesso.`,
          })
          loadData()
        } else {
          throw new Error("Falha ao excluir produto")
        }
      } catch (error: any) {
        // Checa se é erro de integridade referencial (chave estrangeira)
        const msg = error?.message?.toLowerCase() || ''
        if (error?.code === '23503' || msg.includes('foreign key') || msg.includes('violates foreign key')) {
          toast({
            title: "Exclusão bloqueada",
            description: "Não é possível excluir este produto pois existem registros de entrada ou saída vinculados a ele.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Erro ao excluir produto",
            description: error?.message || "Erro desconhecido.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto.",
        variant: "destructive",
      })
    }
  }

  // Função para exportar dados
  const handleExport = async (format: "csv" | "pdf" | "xlsx") => {
    try {
      console.log(`Iniciando exportação para ${format}...`)
      console.log(`Dados a serem exportados:`, filteredData.length)

      // Usar os dados filtrados para exportação
      if (format === "csv") {
        const result = exportToCSV(filteredData, "produtos")
        console.log("Resultado da exportação CSV:", result)
        toast({
          title: "Exportação concluída",
          description: "Os dados foram exportados para CSV com sucesso.",
        })
      } else if (format === "pdf") {
        const result = exportToPDF(filteredData, "produtos")
        console.log("Resultado da exportação PDF:", result)
        toast({
          title: "Exportação concluída",
          description: "Os dados foram exportados para PDF com sucesso.",
        })
      } else if (format === "xlsx") {
        const result = await exportToXLSX(filteredData, "produtos")
        console.log("Resultado da exportação XLSX:", result)
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


  // Função para calcular similaridade entre strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '')
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    if (s1 === s2) return 1
    if (s1.length === 0 || s2.length === 0) return 0
    
    // Algoritmo de Levenshtein simplificado
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null))
    
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,      // deletion
          matrix[j - 1][i] + 1,      // insertion
          matrix[j - 1][i - 1] + cost // substitution
        )
      }
    }
    
    const distance = matrix[s2.length][s1.length]
    return 1 - distance / Math.max(s1.length, s2.length)
  }

  // Filtrar dados com base na pesquisa e no filtro de categoria
  const filteredData = useMemo(() => {
    let result = [...produtos]

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase()
      
      // Busca exata primeiro
      const exactMatches = result.filter(
        (p) =>
          p.descricao.toLowerCase().includes(lowerQuery) ||
          p.categoria.toLowerCase().includes(lowerQuery) ||
          p.unidade.toLowerCase().includes(lowerQuery) ||
          p.localizacao.toLowerCase().includes(lowerQuery),
      )
      
      if (exactMatches.length > 0) {
        result = exactMatches
      } else {
        // Se não há correspondências exatas, fazer busca fuzzy
        const fuzzyMatches = result
          .map(p => ({
            produto: p,
            similarity: Math.max(
              calculateSimilarity(p.descricao, searchTerm),
              calculateSimilarity(p.categoria, searchTerm),
              calculateSimilarity(p.unidade, searchTerm),
              calculateSimilarity(p.localizacao, searchTerm)
            )
          }))
          .filter(item => item.similarity > 0.3) // Threshold de similaridade
          .sort((a, b) => b.similarity - a.similarity)
          .map(item => item.produto)
        
        result = fuzzyMatches
      }
    }

    // Aplicar filtro de categoria
    if (categoriaFilter && categoriaFilter !== "all") {
      result = result.filter((p) => p.categoria === categoriaFilter)
    }

    return result
  }, [produtos, searchTerm, categoriaFilter])

  // Aplicar ordenação aos dados filtrados
  const processedData = useMemo(() => {
    const result = [...filteredData]

    // Aplicar ordenação
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aValue: string | number = a[sortField] as string | number
        const bValue: string | number = b[sortField] as string | number

        // Converter para número para comparação se for estoque
        if (sortField === "estoque") {
          return sortDirection === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
        }

        // Comparação de string para outros campos
        if (sortDirection === "asc") {
          return String(aValue).localeCompare(String(bValue))
        } else {
          return String(bValue).localeCompare(String(aValue))
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
  }, [searchTerm, categoriaFilter])

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
                  placeholder="Buscar produtos..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por categoria */}
              <div className="w-full md:w-auto">
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filtrar categoria" />
                    </div>
                  </SelectTrigger>
                  <SelectContent position="popper" side="top">
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
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
              {/* Botão novo produto */}
              <Button className="w-full md:w-auto btn-gradient shadow-md-custom" onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
              {/* Botão Relatório (Excel) */}
              <Button
                variant="outline"
                className="w-full md:w-auto"
                onClick={() => handleExport("xlsx")}
                title="Baixar relatório em Excel"
              >
                <FileText className="mr-2 h-4 w-4" /> Relatório
              </Button>
            </div>
          </div>

          {/* Visualização em Tabela */}
          {viewMode === "table" && (
            <div className="rounded-md border shadow-sm-custom overflow-hidden">
              <Table>
                <TableCaption>Lista de produtos cadastrados no sistema.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => toggleSort("descricao")} className="cursor-pointer">
                      <div className="flex items-center">Descrição {renderSortIcon("descricao")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("categoria")} className="cursor-pointer">
                      <div className="flex items-center">Categoria {renderSortIcon("categoria")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("unidade")} className="cursor-pointer">
                      <div className="flex items-center">Unidade {renderSortIcon("unidade")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("localizacao")} className="cursor-pointer">
                      <div className="flex items-center">Localização {renderSortIcon("localizacao")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("estoque")} className="cursor-pointer">
                      <div className="flex items-center">Estoque {renderSortIcon("estoque")}</div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-medium">{produto.descricao}</TableCell>
                        <TableCell>{produto.categoria}</TableCell>
                        <TableCell>{produto.unidade}</TableCell>
                        <TableCell>{produto.localizacao}</TableCell>
                        <TableCell>{produto.estoque}</TableCell>
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
                                  onClick={() => handleView(produto)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEdit(produto.id)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAjustarEstoque(produto)}
                                >
                                  <PackageCheck className="mr-2 h-4 w-4" />
                                  Ajustar Estoque
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(produto.id)}
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
                      colSpan={6}
                      title={
                        searchTerm || categoriaFilter ? "Nenhum resultado encontrado" : "Nenhum produto cadastrado"
                      }
                      description={
                        searchTerm || categoriaFilter
                          ? `Nenhum produto encontrado para "${searchTerm}". Dica: Verifique se o código está correto (ex: "Wega FAP 2827" em vez de "Wega FAP-2829") ou tente buscar por partes do nome.`
                          : "Adicione um novo produto para começar"
                      }
                      icon={<Package className="h-10 w-10 text-muted-foreground/50" />}
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
                  {paginatedData.map((produto) => (
                    <ProdutoCard
                      key={produto.id}
                      produto={produto}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onView={() => handleView(produto)}
                      onAjustarEstoque={handleAjustarEstoque}
                    />
                  ))}
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="h-10 w-10 text-muted-foreground/50 mb-4" />
                    <p className="mb-2">
                      {searchTerm || categoriaFilter ? "Nenhum resultado encontrado" : "Nenhum produto cadastrado"}
                    </p>
                    <p className="text-sm">
                      {searchTerm || categoriaFilter
                        ? `Nenhum produto encontrado para "${searchTerm}". Dica: Verifique se o código está correto (ex: "Wega FAP 2827" em vez de "Wega FAP-2829") ou tente buscar por partes do nome.`
                        : "Adicione um novo produto para começar"}
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

      <ProdutoForm open={formOpen} onOpenChange={setFormOpen} editingId={editingId} onSuccess={loadData} />

      <ProdutoVisualizacao open={viewOpen} onOpenChange={setViewOpen} produto={viewingProduto} onSuccess={loadData} />

      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir produto"
        description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
      />

      {/* Dialog de Ajuste de Estoque */}
      <Dialog open={ajustarEstoqueOpen} onOpenChange={setAjustarEstoqueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Ajuste o estoque do produto {produtoAjustando?.descricao}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="estoque-atual">Estoque Atual</Label>
              <Input
                id="estoque-atual"
                type="number"
                value={produtoAjustando?.estoque || 0}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo-estoque">Novo Estoque</Label>
              <Input
                id="novo-estoque"
                type="number"
                min="0"
                value={novoEstoque}
                onChange={(e) => setNovoEstoque(e.target.value)}
                placeholder="Digite o novo estoque"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAjustarEstoqueOpen(false)
                setProdutoAjustando(null)
                setNovoEstoque("")
              }}
              disabled={isAdjusting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAjustarEstoqueSubmit}
              disabled={isAdjusting}
            >
              {isAdjusting ? "Ajustando..." : "Ajustar Estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
