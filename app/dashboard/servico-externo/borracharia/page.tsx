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
  Car,
  Pencil,
  Trash2,
  LayoutGrid,
  LayoutList,
  Calendar as CalendarIcon,
  FileText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { BorrachariaForm } from "@/components/borracharia-form"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { getServicosBorracharia, deleteServicoBorracharia, type ServicoBorracharia } from "@/services/borracharia-service"
import { getFornecedores, type Fornecedor } from "@/services/fornecedor-service"
import { BorrachariaCard } from "@/components/borracharia-card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DevelopmentNotice } from "@/components/development-notice"

type SortDirection = "asc" | "desc" | null
type SortField = "placa" | "marca" | "modelo" | "servico" | "quantidade" | "createdAt" | null
type ViewMode = "table" | "cards"

export default function BorrachariaPage() {
  // Estado para modo de visualização
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")

  // Estado para ordenação
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para o modal de formulário
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estado para o modal de confirmação de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Estado para os dados
  const [servicos, setServicos] = useState<ServicoBorracharia[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Adicionar estados para filtro de período
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const { toast } = useToast()

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true)
    try {
      const servicosData = await getServicosBorracharia()
      const fornecedoresData = await getFornecedores()
      
      setServicos(servicosData)
      setFornecedores(fornecedoresData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos serviços de borracharia.",
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

  // Função para obter o nome do fornecedor pelo ID
  const getFornecedorNome = (id: string): string => {
    const fornecedor = fornecedores.find(f => f.id === id)
    return fornecedor ? fornecedor.nome : "Fornecedor não encontrado"
  }

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

  // Função para abrir o formulário para novo serviço
  const handleNew = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  // Função para excluir um serviço
  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const servico = servicos.find((s) => s.id === deletingId)
      const success = await deleteServicoBorracharia(deletingId)

      if (success && servico) {
        toast({
          title: "Serviço excluído",
          description: `Serviço para o veículo ${servico.veiculo.placa} foi excluído com sucesso.`,
        })
        loadData()
      } else {
        throw new Error("Falha ao excluir serviço")
      }
    } catch (error) {
      console.error("Erro ao excluir serviço:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço.",
        variant: "destructive",
      })
    }
  }

  // Filtrar dados com base na pesquisa
  const filteredData = servicos.filter((servico) => {
    // Filtro de texto
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase()
      const matchesSearch =
        servico.veiculo.placa.toLowerCase().includes(lowerQuery) ||
        servico.veiculo.modelo.toLowerCase().includes(lowerQuery) ||
        servico.veiculo.marca.toLowerCase().includes(lowerQuery) ||
        servico.veiculo.secretaria.toLowerCase().includes(lowerQuery) ||
        servico.servico.toLowerCase().includes(lowerQuery) ||
        getFornecedorNome(servico.fornecedorId).toLowerCase().includes(lowerQuery) ||
        servico.solicitanteId.toLowerCase().includes(lowerQuery)

      if (!matchesSearch) return false
    }

    // Filtro de período
    if (startDate || endDate) {
      const servicoDate = new Date(servico.createdAt)
      
      if (startDate && servicoDate < startDate) {
        return false
      }
      
      if (endDate) {
        // Ajustar a data final para o final do dia
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        
        if (servicoDate > endOfDay) {
          return false
        }
      }
    }

    return true
  })

  // Aplicar ordenação aos dados filtrados
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    let aValue: string | number
    let bValue: string | number

    // Determinar os valores a serem comparados com base no campo de ordenação
    switch (sortField) {
      case "placa":
        aValue = a.veiculo.placa
        bValue = b.veiculo.placa
        break
      case "marca":
        aValue = a.veiculo.marca
        bValue = b.veiculo.marca
        break
      case "modelo":
        aValue = a.veiculo.modelo
        bValue = b.veiculo.modelo
        break
      case "servico":
        aValue = a.servico
        bValue = b.servico
        break
      case "quantidade":
        aValue = a.quantidade
        bValue = b.quantidade
        // Para números, usamos comparação numérica em vez de string
        if (sortDirection === "asc") {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      case "createdAt":
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }

    // Para strings, usamos localeCompare
    if (sortDirection === "asc") {
      return aValue.toString().localeCompare(bValue.toString())
    } else {
      return bValue.toString().localeCompare(aValue.toString())
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
  }, [searchTerm])

  // Função para limpar os filtros de data
  const clearDateFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
  }

  // Adicionar função para gerar relatório
  const generateReport = () => {
    // Filtrar os dados com base no período selecionado
    const dataToExport = filteredData.map(servico => ({
      Placa: servico.veiculo.placa,
      Modelo: servico.veiculo.modelo,
      Marca: servico.veiculo.marca,
      Secretaria: servico.veiculo.secretaria,
      Fornecedor: getFornecedorNome(servico.fornecedorId),
      Solicitante: servico.solicitanteId,
      Serviço: servico.servico,
      Quantidade: servico.quantidade,
      Data: new Date(servico.createdAt).toLocaleDateString('pt-BR')
    }));

    // Criar cabeçalho do CSV
    const headers = Object.keys(dataToExport[0] || {});
    
    // Converter dados para formato CSV
    const csvRows = [];
    
    // Adicionar cabeçalho
    csvRows.push(headers.join(','));
    
    // Adicionar dados
    for (const row of dataToExport) {
      const values = headers.map(header => {
        const value = row[header as keyof typeof row];
        // Escapar aspas e adicionar aspas ao redor de valores com vírgulas
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Combinar em uma única string CSV
    const csvString = csvRows.join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Configurar link para download
    link.setAttribute('href', url);
    
    // Nome do arquivo com data atual e período selecionado
    const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const periodText = startDate || endDate ? 
      `_${startDate ? format(startDate, 'dd-MM-yyyy', { locale: ptBR }) : 'inicio'}` +
      `_a_${endDate ? format(endDate, 'dd-MM-yyyy', { locale: ptBR }) : 'fim'}` : '';
    
    link.setAttribute('download', `relatorio_borracharia${periodText}_${today}.csv`);
    
    // Adicionar link ao documento, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Notificar o usuário
    toast({
      title: "Relatório gerado",
      description: `Relatório com ${dataToExport.length} serviços exportado com sucesso.`,
    });
  };

  return (
    <div className="space-y-6">
      <DevelopmentNotice pageName="Borracharia" />
      
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-lg shadow-md-custom">
        <h1 className="text-3xl font-bold tracking-tight">Borracharia</h1>
        <p className="text-muted-foreground">Gerenciamento de serviços de borracharia</p>
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
                  placeholder="Buscar serviços..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
              {/* Botão novo serviço */}
              <Button className="w-full md:w-auto btn-gradient shadow-md-custom" onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" /> Novo Serviço
              </Button>
              
              {/* Botão gerar relatório */}
              <Button 
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md-custom" 
                onClick={generateReport}
                disabled={filteredData.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" /> Gerar Relatório
              </Button>
            </div>
          </div>

          {/* Filtro de período */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-[240px] justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Data Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-[240px] justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" onClick={clearDateFilters} className="h-10">
              Limpar Filtros
            </Button>

            {(startDate || endDate) && (
              <div className="text-sm text-muted-foreground">
                Mostrando serviços {startDate ? `a partir de ${format(startDate, "dd/MM/yyyy", { locale: ptBR })}` : ""} 
                {startDate && endDate ? " até " : ""} 
                {endDate ? `${format(endDate, "dd/MM/yyyy", { locale: ptBR })}` : ""}
              </div>
            )}
          </div>

          {/* Visualização em Tabela */}
          {viewMode === "table" && (
            <div className="rounded-md border shadow-sm-custom overflow-hidden">
              <Table>
                <TableCaption>Lista de serviços de borracharia cadastrados no sistema.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => toggleSort("createdAt")} className="cursor-pointer">
                      <div className="flex items-center">Data {renderSortIcon("createdAt")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("placa")} className="cursor-pointer">
                      <div className="flex items-center">Placa {renderSortIcon("placa")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("modelo")} className="cursor-pointer">
                      <div className="flex items-center">Modelo {renderSortIcon("modelo")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("marca")} className="cursor-pointer">
                      <div className="flex items-center">Marca {renderSortIcon("marca")}</div>
                    </TableHead>
                    <TableHead>Secretaria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead onClick={() => toggleSort("servico")} className="cursor-pointer">
                      <div className="flex items-center">Serviço {renderSortIcon("servico")}</div>
                    </TableHead>
                    <TableHead onClick={() => toggleSort("quantidade")} className="cursor-pointer">
                      <div className="flex items-center">Qtd {renderSortIcon("quantidade")}</div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Carregando serviços...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((servico) => (
                      <TableRow key={servico.id}>
                        <TableCell>{format(new Date(servico.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell className="font-medium">{servico.veiculo.placa}</TableCell>
                        <TableCell>{servico.veiculo.modelo}</TableCell>
                        <TableCell>{servico.veiculo.marca}</TableCell>
                        <TableCell>{servico.veiculo.secretaria}</TableCell>
                        <TableCell>{getFornecedorNome(servico.fornecedorId)}</TableCell>
                        <TableCell>{servico.solicitanteId}</TableCell>
                        <TableCell>{servico.servico}</TableCell>
                        <TableCell>{servico.quantidade}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors"
                              onClick={() => handleEdit(servico.id)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
                              onClick={() => handleDeleteClick(servico.id)}
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
                      colSpan={10}
                      title={searchTerm ? "Nenhum resultado encontrado" : "Nenhum serviço cadastrado"}
                      description={
                        searchTerm
                          ? "Tente usar termos diferentes na busca"
                          : "Adicione um novo serviço para começar"
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
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Carregando serviços...</p>
                  </div>
                </div>
              ) : paginatedData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedData.map((servico) => (
                    <BorrachariaCard
                      key={servico.id}
                      servicoBorracharia={servico}
                      fornecedorNome={getFornecedorNome(servico.fornecedorId)}
                      onEdit={() => handleEdit(servico.id)}
                      onDelete={() => handleDeleteClick(servico.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Car className="h-10 w-10 text-muted-foreground/50 mb-4" />
                    <p className="mb-2">
                      {searchTerm ? "Nenhum resultado encontrado" : "Nenhum serviço cadastrado"}
                    </p>
                    <p className="text-sm">
                      {searchTerm
                        ? "Tente usar termos diferentes na busca"
                        : "Adicione um novo serviço para começar"}
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

      <BorrachariaForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={loadData}
        servicoBorracharia={editingId ? servicos.find((s) => s.id === editingId) || null : null}
      />

      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir serviço"
        description="Tem certeza que deseja excluir este serviço de borracharia? Esta ação não pode ser desfeita."
      />

      <Toaster />
    </div>
  )
} 