"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Eye,
  FileCheck,
  Calendar,
  MoreVertical,
  FileText,
  Users,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { AutorizacaoLavadorDialog } from "@/components/autorizacao-lavador-dialog"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  getAutorizacoesLavador, 
  deleteAutorizacaoLavador,
  updateAutorizacaoLavador,
  type AutorizacaoLavador 
} from "@/services/autorizacao-lavador-service"
import { gerarCanhotoPDF } from "@/utils/canhoto-lavador-utils"
import { CadastroLavadorDialog } from "@/components/cadastro-lavador-dialog"
import { getLavadorById } from "@/services/cadastro-lavador-service"

type SortDirection = "asc" | "desc" | null
type SortField = "veiculoPlaca" | "solicitanteNome" | "dataAutorizacao" | "dataPrevista" | "status" | null

export default function LavadorPage() {
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")

  // Estado para ordenação
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para o modal de formulário
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)

  // Estado para o modal de confirmação de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Estado para filtro de status
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Estado para os dados
  const [autorizacoes, setAutorizacoes] = useState<AutorizacaoLavador[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estado para o diálogo de lavadores
  const [lavadoresDialogOpen, setLavadoresDialogOpen] = useState(false)

  const { toast } = useToast()

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getAutorizacoesLavador()
      setAutorizacoes(data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as autorizações.",
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

  // Função para abrir o formulário para nova autorização
  const handleNew = () => {
    setEditingId(null)
    setViewingId(null)
    setDialogOpen(true)
  }

  // Função para abrir o formulário para edição
  const handleEdit = (id: string) => {
    setEditingId(id)
    setViewingId(null)
    setDialogOpen(true)
  }

  // Função para visualizar
  const handleView = (id: string) => {
    setViewingId(id)
    setEditingId(null)
    setDialogOpen(true)
  }

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  // Função para excluir uma autorização
  const handleDelete = async () => {
    if (!deletingId) return

    try {
      await deleteAutorizacaoLavador(deletingId)
      
      toast({
        title: "Autorização excluída",
        description: "A autorização foi excluída com sucesso.",
      })
      loadData()
    } catch (error) {
      console.error("Erro ao excluir autorização:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a autorização.",
        variant: "destructive",
      })
    } finally {
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  // Função para atualizar o status da autorização
  const handleUpdateStatus = async (id: string, newStatus: "Pendente" | "Concluído") => {
    try {
      await updateAutorizacaoLavador(id, { status: newStatus })
      
      toast({
        title: "Status atualizado",
        description: `A autorização foi marcada como "${newStatus}".`,
      })
      loadData()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da autorização.",
        variant: "destructive",
      })
    }
  }

  // Função para gerar canhoto
  const handleGerarCanhoto = async (autorizacao: AutorizacaoLavador) => {
    try {
      let lavadorNome = undefined;
      let lavadorTelefone = undefined;
      if (autorizacao.lavadorId) {
        const lavador = await getLavadorById(autorizacao.lavadorId);
        if (lavador) {
          lavadorNome = lavador.nome;
          lavadorTelefone = lavador.telefone;
        }
      }
      await gerarCanhotoPDF({
        ...autorizacao,
        lavadorNome,
        lavadorTelefone,
      });
      toast({
        title: "Canhoto gerado",
        description: "O PDF do canhoto foi gerado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar canhoto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o canhoto.",
        variant: "destructive",
      });
    }
  }

  // Filtrar dados com base na pesquisa e nos filtros
  const filteredData = autorizacoes.filter((auth) => {
    // Filtro de pesquisa
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase()
      const matchesSearch =
        auth.veiculoPlaca.toLowerCase().includes(lowerQuery) ||
        auth.veiculoModelo.toLowerCase().includes(lowerQuery) ||
        auth.veiculoMarca.toLowerCase().includes(lowerQuery) ||
        auth.solicitanteNome.toLowerCase().includes(lowerQuery) ||
        auth.autorizadoPorNome.toLowerCase().includes(lowerQuery)
      
      if (!matchesSearch) return false
    }

    // Filtro de status
    if (statusFilter !== "all" && auth.status !== statusFilter) {
      return false
    }

    return true
  })

  // Aplicar ordenação aos dados filtrados
  const processedData = [...filteredData].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    let aValue: string | number = a[sortField] as string | number
    let bValue: string | number = b[sortField] as string | number

    if (sortField === "dataAutorizacao" || sortField === "dataPrevista") {
      aValue = new Date(aValue as string).getTime()
      bValue = new Date(bValue as string).getTime()
    } else {
      aValue = String(aValue).toLowerCase()
      bValue = String(bValue).toLowerCase()
    }

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0
    }
  })

  // Calcular dados paginados
  const totalPages = Math.max(1, Math.ceil(processedData.length / Number.parseInt(itemsPerPage)))
  const startIndex = (currentPage - 1) * Number.parseInt(itemsPerPage)
  const paginatedData = processedData.slice(startIndex, startIndex + Number.parseInt(itemsPerPage))

  // Função para obter cor do badge de status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Pendente":
        return "secondary"
      case "Autorizado":
        return "default"
      case "Em Andamento":
        return "default"
      case "Concluído":
        return "default"
      case "Cancelado":
        return "destructive"
      default:
        return "secondary"
    }
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
                  placeholder="Buscar por placa, modelo, solicitante..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por status */}
              <div className="w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Autorizado">Autorizado</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={() => setLavadoresDialogOpen(true)}>
                <Users className="mr-2 h-4 w-4" /> Lavadores
              </Button>
              <Button className="btn-gradient shadow-md-custom" onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" /> Nova Autorização
              </Button>
            </div>
          </div>

          {/* Tabela */}
          <div className="rounded-md border shadow-sm-custom overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort("veiculoPlaca")} className="cursor-pointer">
                    <div className="flex items-center">
                      Veículo {renderSortIcon("veiculoPlaca")}
                    </div>
                  </TableHead>
                  <TableHead>Secretaria</TableHead>
                  <TableHead onClick={() => toggleSort("solicitanteNome")} className="cursor-pointer">
                    <div className="flex items-center">
                      Solicitante {renderSortIcon("solicitanteNome")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("dataAutorizacao")} className="cursor-pointer">
                    <div className="flex items-center">
                      Data Autorização {renderSortIcon("dataAutorizacao")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("dataPrevista")} className="cursor-pointer">
                    <div className="flex items-center">
                      Data Prevista {renderSortIcon("dataPrevista")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("status")} className="cursor-pointer">
                    <div className="flex items-center">
                      Status {renderSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((autorizacao) => (
                    <TableRow key={autorizacao.id} className="hover:bg-blue-50/30">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-bold">{autorizacao.veiculoPlaca}</div>
                          <div className="text-xs text-muted-foreground">
                            {autorizacao.veiculoMarca} {autorizacao.veiculoModelo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{autorizacao.veiculoSecretaria}</TableCell>
                      <TableCell>{autorizacao.solicitanteNome}</TableCell>
                      <TableCell>
                        {new Date(autorizacao.dataAutorizacao).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {new Date(autorizacao.dataPrevista).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(autorizacao.status)}>
                          {autorizacao.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {autorizacao.preco !== undefined && autorizacao.preco !== null
                          ? `R$ ${autorizacao.preco.toFixed(2).replace(".", ",")}`
                          : "-"}
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
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(autorizacao.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(autorizacao.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(autorizacao.id, "Pendente")}
                              disabled={autorizacao.status === "Pendente"}
                            >
                              <FileCheck className="h-4 w-4 mr-2" />
                              Marcar como Pendente
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(autorizacao.id, "Concluído")}
                              disabled={autorizacao.status === "Concluído"}
                            >
                              <FileCheck className="h-4 w-4 mr-2" />
                              Marcar como Concluído
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGerarCanhoto(autorizacao)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Canhoto
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(autorizacao.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyState
                    colSpan={8}
                    title={searchTerm || statusFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhuma autorização cadastrada"}
                    description={
                      searchTerm || statusFilter !== "all"
                        ? "Tente usar termos diferentes na busca ou remover os filtros"
                        : "Adicione uma nova autorização para começar"
                    }
                    icon={<FileCheck className="h-10 w-10 text-muted-foreground/50" />}
                  />
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
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
                  Mostrando {Math.min(processedData.length, startIndex + 1)}-
                  {Math.min(processedData.length, startIndex + Number.parseInt(itemsPerPage))} de{" "}
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

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                        }}
                      >
                        {page}
                      </PaginationLink>
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

      {/* Diálogo de Autorização */}
      <AutorizacaoLavadorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
        viewingId={viewingId}
        onSuccess={loadData}
      />

      {/* Diálogo de confirmação de exclusão */}
      <DeleteConfirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Excluir autorização"
        description="Tem certeza que deseja excluir esta autorização? Esta ação não pode ser desfeita."
      />

      {/* Diálogo de cadastro de lavadores */}
      <CadastroLavadorDialog
        open={lavadoresDialogOpen}
        onOpenChange={setLavadoresDialogOpen}
      />

      <Toaster />
    </div>
  )
}
