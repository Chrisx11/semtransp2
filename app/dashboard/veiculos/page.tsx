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
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { VeiculoForm } from "@/components/veiculo-form"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { getVeiculosSupabase, deleteVeiculoSupabase, type Veiculo, addVeiculoSupabase, addVeiculo } from "@/services/veiculo-service"
import { exportToCSV, exportToPDF } from "@/utils/export-veiculos-utils"
import { VeiculoCard } from "@/components/veiculo-card"
import { Badge } from "@/components/ui/badge"
import { TrocaOleoDialog } from "@/components/troca-oleo-dialog"

type SortDirection = "asc" | "desc" | null
type SortField = "placa" | "modelo" | "marca" | "ano" | "cor" | "tipo" | "secretaria" | "status" | null
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

export default function VeiculosPage() {
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

  // Estado para os dados
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
  const handleExport = (format: "csv" | "pdf") => {
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
      } else {
        const result = exportToPDF(filteredData, "veiculos")
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg shadow-md-custom">
        <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
        <p className="text-muted-foreground">Gerenciamento de veículos</p>
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
                    <TableHead onClick={() => toggleSort("cor")} className="cursor-pointer">
                      <div className="flex items-center">Cor {renderSortIcon("cor")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("tipo")} className="cursor-pointer">
                      <div className="flex items-center">Tipo {renderSortIcon("tipo")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("secretaria")} className="cursor-pointer">
                      <div className="flex items-center">Secretaria {renderSortIcon("secretaria")}</div>
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
                        <TableCell>{veiculo.cor}</TableCell>
                        <TableCell>{veiculo.tipo}</TableCell>
                        <TableCell>{veiculo.secretaria}</TableCell>
                        <TableCell>
                          <Badge variant={veiculo.status === "Ativo" ? "default" : "destructive"} className="text-xs">
                            {veiculo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
                              onClick={() => handleView(veiculo.id)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Visualizar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
                              onClick={() => handleEdit(veiculo.id)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
                              onClick={() => handleDeleteClick(veiculo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900 dark:hover:text-yellow-400 transition-colors"
                              title="Registrar Troca de Óleo"
                              onClick={() => {
                                setVeiculoTrocaOleo(veiculo)
                                setTrocaOleoOpen(true)
                              }}
                            >
                              <span role="img" aria-label="Óleo">🛢️</span>
                            </Button>
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

      <Toaster />
    </div>
  )
}
