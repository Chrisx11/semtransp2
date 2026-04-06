"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { EmptyState } from "@/components/empty-state"
import { SaidaFormDialog } from "@/components/saida-form-dialog"
import { getSaidasSupabase, deleteSaidaSupabase, type Saida } from "@/services/saida-service"
import type { Produto } from "@/services/produto-service"
import { getProdutosSupabase } from "@/services/produto-service"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Trash2, Pencil, Package, Users, Calendar as CalendarIcon } from "lucide-react"

function normalizeCategoria(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

const CATEGORIA_CONSUMIVEIS = "Consumíveis"

export default function SaidasConsumiveisPage() {
  const { toast } = useToast()

  const [saidas, setSaidas] = useState<Saida[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Útil para exibir "similares" e para título/UX (opcional)
  const [produtos, setProdutos] = useState<Produto[]>([])

  const [searchTerm, setSearchTerm] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getSaidasSupabase()
      const consumiveis = data.filter((s) => normalizeCategoria(s.categoria ?? "") === normalizeCategoria(CATEGORIA_CONSUMIVEIS))
      setSaidas(consumiveis)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das saídas consumíveis.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    getProdutosSupabase().then(setProdutos).catch((e) => console.error("Erro ao carregar produtos:", e))
  }, [])

  const filteredSaidas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return saidas

    return saidas.filter((s) => {
      const produtoNome = (s.produtoNome ?? "").toLowerCase()
      const responsavelNome = (s.responsavelNome ?? "").toLowerCase()
      const veiculoPlaca = (s.veiculoPlaca ?? "").toLowerCase()
      const veiculoModelo = (s.veiculoModelo ?? "").toLowerCase()
      return (
        produtoNome.includes(term) ||
        responsavelNome.includes(term) ||
        veiculoPlaca.includes(term) ||
        veiculoModelo.includes(term)
      )
    })
  }, [saidas, searchTerm])

  const handleEditClick = (id: string) => {
    setEditingId(id)
    setFormOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await new Promise((resolve) => setTimeout(resolve, 250))
      const saida = saidas.find((e) => e.id === deletingId)
      await deleteSaidaSupabase(deletingId)
      if (saida) {
        toast({
          title: "Saída excluída",
          description: `A saída do produto ${saida.produtoNome} foi excluída com sucesso.`,
        })
      }
      await loadData()
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

  return (
    <div className="space-y-6">
      <Card className="shadow-md-custom">
        <CardContent className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold">Saídas Consumíveis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registre saídas apenas de produtos da categoria “Consumíveis” (para colaboradores).
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-auto flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar saídas consumíveis..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full md:w-auto btn-gradient shadow-md-custom" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Saída (Consumíveis)
            </Button>
          </div>

          <div className="rounded-md border shadow-sm-custom overflow-hidden">
            <Table>
              <TableCaption>Lista de saídas de produtos do estoque (categoria Consumíveis).</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="flex justify-center items-center py-8 text-muted-foreground">
                        Carregando saídas consumíveis...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSaidas.length > 0 ? (
                  filteredSaidas.map((saida) => {
                    // (Opcional) resolve similares pela lista de produtos carregada
                    const produto = produtos.find((p) => p.id === saida.produtoId)
                    const similares =
                      produto && produto.produtosSimilares && produto.produtosSimilares.length > 0
                        ? produtos.filter((p) => produto.produtosSimilares.includes(p.id))
                        : []

                    return (
                      <TableRow key={saida.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-primary mt-0.5" />
                            <div className="min-w-0">
                              <div className="truncate">{saida.produtoNome}</div>
                              {similares.length > 0 && (
                                <div className="mt-1 text-xs text-blue-600 dark:text-blue-300 truncate">
                                  Similares: {similares.map((s) => s.descricao).join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{saida.categoria || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{saida.responsavelNome}</span>
                          </div>
                        </TableCell>
                        <TableCell>{saida.quantidade}</TableCell>
                        <TableCell>{saida.valorUnitario !== undefined ? `R$ ${saida.valorUnitario.toFixed(2)}` : "-"}</TableCell>
                        <TableCell>
                          {saida.valorUnitario !== undefined
                            ? `R$ ${(saida.valorUnitario * saida.quantidade).toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            {saida.data ? format(new Date(saida.data), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                          </div>
                        </TableCell>
                        <TableCell>{saida.veiculoPlaca && saida.veiculoModelo ? `${saida.veiculoPlaca} - ${saida.veiculoModelo}` : "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(saida.id)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(saida.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <EmptyState
                    colSpan={9}
                    title="Nenhuma saída consumível cadastrada"
                    description={searchTerm ? "Tente remover o filtro de busca." : "Cadastre uma nova saída para começar."}
                    icon={<Plus className="h-10 w-10 text-muted-foreground/50" />}
                  />
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SaidaFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingId(null)
        }}
        onSuccess={loadData}
        saidaToEdit={editingId ? saidas.find((s) => s.id === editingId) || null : null}
        produtoCategoriaFiltro={CATEGORIA_CONSUMIVEIS}
        repeticaoMinDias={3}
        repeticaoSenha="AP2026"
      />

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

