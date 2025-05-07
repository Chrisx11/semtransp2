"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Package, Car, Tag, Ruler, MapPin, BarChart2, AlertCircle, Layers, Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SelecionarProdutosSimilares } from "@/components/selecionar-produtos-similares"
import { SelecionarVeiculosCompativeis } from "@/components/selecionar-veiculos-compativeis"
import {
  getProdutoByIdSupabase,
  getProdutosSupabase,
  updateProdutoSupabase,
  type Produto,
} from "@/services/produto-service"
import { getVeiculoByIdSupabase, type Veiculo } from "@/services/veiculo-service"
import { getSaidasByProdutoIdSupabase, type Saida } from "@/services/saida-service"
import { getEntradasByProdutoIdSupabase, type Entrada } from "@/services/entrada-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { getProdutoById } from "@/services/produto-service" // Removed duplicate import

interface ProdutoVisualizacaoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
  onSuccess?: () => void
}

type Movimentacao = (Saida & { tipo: "saida" }) | (Entrada & { tipo: "entrada" })

export function ProdutoVisualizacao({ open, onOpenChange, produto, onSuccess }: ProdutoVisualizacaoProps) {
  const [activeTab, setActiveTab] = useState("detalhes")
  const [produtoVisualizado, setProdutoVisualizado] = useState<Produto | null>(produto)
  const [produtosSimilares, setProdutosSimilares] = useState<Produto[]>([])
  const [veiculosCompativeis, setVeiculosCompativeis] = useState<Veiculo[]>([])
  const [selecionarSimilaresOpen, setSelecionarSimilaresOpen] = useState(false)
  const [selecionarVeiculosOpen, setSelecionarVeiculosOpen] = useState(false)
  const [movimentacoesOpen, setMovimentacoesOpen] = useState(false)
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [movimentacoesLoading, setMovimentacoesLoading] = useState(false)

  // Sempre que abrir o modal ou mudar o produto, busque o produto atualizado
  useEffect(() => {
    if (open && produto) {
      (async () => {
        const atualizado = await getProdutoByIdSupabase(produto.id)
        setProdutoVisualizado(atualizado)
      })()
    }
  }, [open, produto])

  // Carregar produtos similares e veículos compatíveis do Supabase
  useEffect(() => {
    if (produtoVisualizado && activeTab === "similares") {
      carregarProdutosSimilares()
    }
  }, [produtoVisualizado, activeTab])

  useEffect(() => {
    if (produtoVisualizado && activeTab === "veiculos") {
      carregarVeiculosCompativeis()
    }
  }, [produtoVisualizado, activeTab])

  // Função para carregar produtos similares do Supabase
  const carregarProdutosSimilares = async () => {
    if (produtoVisualizado && produtoVisualizado.produtosSimilares && produtoVisualizado.produtosSimilares.length > 0) {
      try {
        const todosProdutos = await getProdutosSupabase()
        setProdutosSimilares(
          todosProdutos.filter((p) => produtoVisualizado.produtosSimilares.includes(p.id))
        )
      } catch {
        setProdutosSimilares([])
      }
    } else {
      setProdutosSimilares([])
    }
  }

  // Função para carregar veículos compatíveis do Supabase
  const carregarVeiculosCompativeis = async () => {
    if (produtoVisualizado && produtoVisualizado.veiculosCompativeis && produtoVisualizado.veiculosCompativeis.length > 0) {
      // Buscar todos os veículos compatíveis do Supabase
      const promises = produtoVisualizado.veiculosCompativeis.map((id) => getVeiculoByIdSupabase(id))
      const veiculos = (await Promise.all(promises)).filter((v): v is Veiculo => v !== null)
      setVeiculosCompativeis(veiculos)
    } else {
      setVeiculosCompativeis([])
    }
  }

  // Função chamada após atualizar produtos similares
  const handleSimilaresAtualizados = async () => {
    if (produto) {
      const atualizado = await getProdutoByIdSupabase(produto.id)
      setProdutoVisualizado(atualizado)
      await carregarProdutosSimilares()
      if (onSuccess) onSuccess()
    }
  }

  // Função chamada após atualizar veículos compatíveis
  const handleVeiculosAtualizados = async () => {
    if (produto) {
      const atualizado = await getProdutoByIdSupabase(produto.id)
      setProdutoVisualizado(atualizado)
      if (onSuccess) onSuccess()
    }
  }

  // Função para carregar movimentações do produto
  const carregarMovimentacoes = async () => {
    if (!produtoVisualizado) return
    setMovimentacoesLoading(true)
    try {
      const [entradas, saidas] = await Promise.all([
        getEntradasByProdutoIdSupabase(produtoVisualizado.id),
        getSaidasByProdutoIdSupabase(produtoVisualizado.id),
      ])
      // Adiciona o campo tipo para diferenciar
      const entradasMov = entradas.map((e) => ({ ...e, tipo: "entrada" as const }))
      const saidasMov = saidas.map((s) => ({ ...s, tipo: "saida" as const }))
      // Junta e ordena por data decrescente
      const todas = [...entradasMov, ...saidasMov].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      setMovimentacoes(todas)
    } catch {
      setMovimentacoes([])
    } finally {
      setMovimentacoesLoading(false)
    }
  }

  if (!produtoVisualizado) {
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px]" style={{ maxHeight: 500, overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes do Produto
            </DialogTitle>
            <DialogDescription>Informações detalhadas sobre o produto selecionado.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="detalhes" className="flex-1">
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="veiculos" className="flex-1">
                Veículos Compatíveis
              </TabsTrigger>
              <TabsTrigger value="similares" className="flex-1">
                Produtos Similares
              </TabsTrigger>
            </TabsList>

            {/* Aba de Detalhes */}
            <TabsContent value="detalhes" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{produtoVisualizado.descricao}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{produtoVisualizado.categoria}</span>
                  </div>
                </div>
                <Badge variant={produtoVisualizado.estoque > 0 ? "default" : "destructive"}>
                  {produtoVisualizado.estoque > 0 ? "Em estoque" : "Sem estoque"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4 bg-muted/30">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Estoque:</span>
                    <span className="text-sm">{produtoVisualizado.estoque} unidades</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Unidade:</span>
                    <span className="text-sm">{produtoVisualizado.unidade}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Localização:</span>
                    <span className="text-sm">{produtoVisualizado.localizacao}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Cadastrado em:</span>
                    <span className="text-sm">{new Date(produtoVisualizado.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                  Histórico de Movimentações
                  <Button size="sm" variant="outline" onClick={() => { setMovimentacoesOpen(true); carregarMovimentacoes(); }}>
                    Visualizar registros
                  </Button>
                </h4>
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhuma movimentação registrada para este produto.</p>
                </div>
              </div>
            </TabsContent>

            {/* Aba de Veículos Compatíveis */}
            <TabsContent value="veiculos" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Veículos Compatíveis</h3>
                <Button size="sm" onClick={() => setSelecionarVeiculosOpen(true)} className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Selecionar
                </Button>
              </div>

              {veiculosCompativeis.length > 0 ? (
                <div className="border rounded-md" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <div className="p-4 space-y-3">
                    {veiculosCompativeis.map((v) => (
                      <div key={v.id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50">
                        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                          <Car className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{v.placa}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {v.marca} {v.modelo} - {v.ano}
                            </span>
                          </div>
                        </div>
                        <Badge variant={v.status === "Ativo" ? "default" : "destructive"} className="ml-auto">
                          {v.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center">
                  <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum veículo compatível cadastrado.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Selecionar" para adicionar veículos compatíveis.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Aba de Produtos Similares */}
            <TabsContent value="similares" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Produtos Similares</h3>
                <Button size="sm" onClick={() => setSelecionarSimilaresOpen(true)} className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Selecionar
                </Button>
              </div>

              {produtosSimilares.length > 0 ? (
                <div className="border rounded-md" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <div className="p-4 space-y-3">
                    {produtosSimilares.map((p) => (
                      <div key={p.id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50">
                        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{p.descricao}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Estoque: {p.estoque}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{p.unidade}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum produto similar cadastrado.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Selecionar" para adicionar produtos similares.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para selecionar produtos similares */}
      <SelecionarProdutosSimilares
        open={selecionarSimilaresOpen}
        onOpenChange={setSelecionarSimilaresOpen}
        produto={produtoVisualizado}
        onSuccess={handleSimilaresAtualizados}
      />

      {/* Diálogo para selecionar veículos compatíveis */}
      <SelecionarVeiculosCompativeis
        open={selecionarVeiculosOpen}
        onOpenChange={setSelecionarVeiculosOpen}
        produto={produtoVisualizado}
        onSuccess={handleVeiculosAtualizados}
      />

      {/* Modal de movimentações detalhadas */}
      <Dialog open={movimentacoesOpen} onOpenChange={setMovimentacoesOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Registros de Movimentações</DialogTitle>
          </DialogHeader>
          {movimentacoesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando registros...</div>
          ) : movimentacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum registro encontrado para este produto.</div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>
                        {mov.tipo === "entrada" ? (
                          <ArrowDownCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(mov.data).toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{mov.quantidade}</TableCell>
                      <TableCell>{mov.responsavelNome}</TableCell>
                      <TableCell>{"veiculoPlaca" in mov ? `${mov.veiculoPlaca} - ${mov.veiculoModelo}` : "-"}</TableCell>
                      <TableCell>{"categoria" in mov ? mov.categoria : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
