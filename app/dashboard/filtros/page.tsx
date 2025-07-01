"use client"

import { useEffect, useState } from "react"
import { getVeiculosSupabase, type Veiculo } from "@/services/veiculo-service"
import { getProdutosCompativeisComVeiculoSupabase, type Produto, getProdutosSupabase } from "@/services/produto-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { SelecionarProdutoDialog } from "@/components/selecionar-produto-dialog"
import { FuelIcon as Oil, Car, BadgeCheck, Trash2, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"

const FILTER_HEADERS = [
  "Filtro de Óleo",
  "Filtro de Comb.",
  "Filtro de Ar",
  "Filtro de Cabine",
  "Filtro de Ar 1°",
  "Filtro de Ar 2°",
  "Filtro Separador",
  "Desumidificador",
  "Filtro de Transmissão"
]

interface FiltroRegistrado {
  veiculoId: string
  categoria: string
  produtoId: string
  produtoDescricao: string
}

// Funções para interagir com o Supabase
async function getFiltrosDoVeiculoSupabase(veiculoId: string): Promise<FiltroRegistrado[]> {
  const { data, error } = await supabase
    .from('filtros_registrados')
    .select('veiculoid, categoria, produtoid, produtodescricao')
    .eq('veiculoid', veiculoId);

  if (error) {
    console.error("Erro ao buscar filtros do veículo:", error.message, error);
    return [];
  }
  
  // Mapear os dados para o formato esperado pela interface (camelCase)
  return data.map(item => ({
    veiculoId: item.veiculoid,
    categoria: item.categoria,
    produtoId: item.produtoid,
    produtoDescricao: item.produtodescricao,
  }));
}

async function addFiltroRegistradoSupabase(filtro: FiltroRegistrado): Promise<void> {
  // Mapear os dados para o formato esperado pelo banco de dados (lowercase)
  const filtroDB = {
    veiculoid: filtro.veiculoId,
    categoria: filtro.categoria,
    produtoid: filtro.produtoId,
    produtodescricao: filtro.produtoDescricao,
  };
  const { error } = await supabase
    .from('filtros_registrados')
    .insert([filtroDB]);

  if (error) {
    console.error("Erro ao registrar filtro:", error.message, error);
    throw error; // Re-lança o erro para ser tratado por quem chamou
  }
}

async function removeFiltroRegistradoSupabase(veiculoId: string, categoria: string, produtoId: string): Promise<void> {
  const { error } = await supabase
    .from('filtros_registrados')
    .delete()
    .eq('veiculoid', veiculoId)
    .eq('categoria', categoria)
    .eq('produtoid', produtoId);

  if (error) {
    console.error("Erro ao remover filtro:", error.message, error);
    throw error; // Re-lança o erro para ser tratado por quem chamou
  }
}

export default function FiltrosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [produtosCompativeis, setProdutosCompativeis] = useState<Produto[]>([])
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [registerVeiculo, setRegisterVeiculo] = useState<Veiculo | null>(null)
  const [selectedCategoria, setSelectedCategoria] = useState<string>("")
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [produtoDialogOpen, setProdutoDialogOpen] = useState(false)
  const { toast } = useToast()
  const [filtrosRegistrados, setFiltrosRegistrados] = useState<FiltroRegistrado[]>([])
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    getVeiculosSupabase().then(setVeiculos)
    getProdutosSupabase().then(setTodosProdutos)
  }, [])

  const handleOpenModal = async (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo)
    setModalOpen(true)
    const produtos = await getProdutosCompativeisComVeiculoSupabase(veiculo.id)
    setProdutosCompativeis(produtos)
    setFiltrosRegistrados(await getFiltrosDoVeiculoSupabase(veiculo.id))
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedVeiculo(null)
  }

  const handleOpenRegisterModal = (veiculo: Veiculo) => {
    setRegisterVeiculo(veiculo)
    setRegisterModalOpen(true)
    setSelectedCategoria("")
    setSelectedProduto(null)
  }

  const handleCloseRegisterModal = () => {
    setRegisterModalOpen(false)
    setRegisterVeiculo(null)
    setSelectedCategoria("")
    setSelectedProduto(null)
  }

  const handleRegister = async () => {
    if (!registerVeiculo || !selectedCategoria || !selectedProduto) return

    // Buscar todos os produtos para encontrar os similares
    const todosProdutos = await getProdutosSupabase()
    // Encontrar o produto selecionado
    const produtoPrincipal = todosProdutos.find(p => p.id === selectedProduto.id)
    // Encontrar os similares
    const similares = produtoPrincipal && produtoPrincipal.produtosSimilares && produtoPrincipal.produtosSimilares.length > 0
      ? todosProdutos.filter(p => produtoPrincipal.produtosSimilares.includes(p.id))
      : []

    // Registrar o filtro para o produto principal
    const novoFiltro = {
      veiculoId: registerVeiculo.id,
      categoria: selectedCategoria,
      produtoId: selectedProduto.id,
      produtoDescricao: selectedProduto.descricao
    }
    await addFiltroRegistradoSupabase(novoFiltro)

    // Registrar o filtro para cada similar (se ainda não registrado para esse veículo/categoria)
    for (const similar of similares) {
      const filtrosExistentes = await getFiltrosDoVeiculoSupabase(registerVeiculo.id);
      const jaRegistrado = filtrosExistentes.some(f =>
        f.veiculoId === registerVeiculo.id &&
        f.categoria === selectedCategoria &&
        f.produtoId === similar.id
      );
      if (!jaRegistrado) {
        await addFiltroRegistradoSupabase({
          veiculoId: registerVeiculo.id,
          categoria: selectedCategoria,
          produtoId: similar.id,
          produtoDescricao: similar.descricao
        });
      }
    }

    toast({
      title: "Filtro registrado!",
      description: `O filtro '${selectedCategoria}' foi registrado para o veículo ${registerVeiculo.placa} (${selectedProduto.descricao}${similares.length > 0 ? ` e similares: ${similares.map(s => s.descricao).join(", ")}` : ""})`,
      variant: "default"
    })
    handleCloseRegisterModal()
    if (selectedVeiculo && selectedVeiculo.id === registerVeiculo.id) {
      setFiltrosRegistrados(await getFiltrosDoVeiculoSupabase(registerVeiculo.id))
    }
  }

  async function removeFiltroRegistrado(veiculoId: string, categoria: string, produtoId: string, updateState?: (filtros: FiltroRegistrado[]) => void) {
    try {
      await removeFiltroRegistradoSupabase(veiculoId, categoria, produtoId);
      // Após remover do Supabase, atualizar o estado local buscando novamente
      if (updateState && veiculoId) {
         const updatedFiltros = await getFiltrosDoVeiculoSupabase(veiculoId);
         updateState(updatedFiltros);
      }
      toast({
        title: "Filtro removido!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao remover filtro",
        description: "Ocorreu um erro ao tentar remover o filtro.",
        variant: "destructive"
      });
    }
  }

  const getCellContent = (header: string) => {
    const filtros = filtrosRegistrados.filter(f => f.categoria === header)
    if (filtros.length === 0) return <span className="text-xs text-muted-foreground">Nenhum</span>
    return (
      <div className="flex flex-col gap-1">
        {filtros.map(filtro => {
          const produto = todosProdutos.find(p => p.id === filtro.produtoId)
          const emEstoque = produto && produto.estoque > 0
          return (
            <span
              key={filtro.produtoId + filtro.categoria}
              className={emEstoque ? "bg-green-100 text-green-800 font-semibold rounded px-2 py-0.5 flex items-center gap-2" : "bg-red-100 text-red-800 font-semibold rounded px-2 py-0.5 flex items-center gap-2"}
            >
              {filtro.produtoDescricao}
              {editMode && (
                <button
                  type="button"
                  className="ml-1 text-red-500 hover:text-red-700"
                  onClick={() => removeFiltroRegistrado(selectedVeiculo?.id || '', header, filtro.produtoId, setFiltrosRegistrados)}
                  title="Remover filtro"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </span>
          )
        })}
      </div>
    )
  }

  const veiculosFiltrados = veiculos.filter(v => {
    const q = searchTerm.toLowerCase()
    return (
      v.placa.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q)
    )
  })

  // Função para atualizar os dados
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const [veiculos, produtos] = await Promise.all([
        getVeiculosSupabase(),
        getProdutosSupabase()
      ])
      setVeiculos(veiculos)
      setTodosProdutos(produtos)
      toast({ title: "Dados atualizados!", variant: "default" })
    } catch (e) {
      toast({ title: "Erro ao atualizar dados", variant: "destructive" })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Filtros dos Veículos</h1>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RotateCcw className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>
      <div className="max-w-md mb-4">
        <input
          type="text"
          placeholder="Buscar veículo por placa, modelo ou marca..."
          className="w-full border rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {veiculosFiltrados.map((veiculo) => (
          <div
            key={veiculo.id}
            className="relative border rounded-xl p-5 shadow-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Oil className="h-7 w-7 text-primary drop-shadow" />
              <span className="bg-primary/10 border border-primary/20 text-primary font-bold px-3 py-1 rounded-lg text-base tracking-widest shadow-sm">
                {veiculo.placa}
              </span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${veiculo.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {veiculo.status}
              </span>
            </div>
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{veiculo.modelo}</span>
              <span className="text-sm text-muted-foreground">{veiculo.marca} | {veiculo.ano}</span>
              <span className="text-xs text-muted-foreground">{veiculo.secretaria}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1 flex gap-2 items-center" onClick={() => handleOpenModal(veiculo)}>
                <BadgeCheck className="h-4 w-4" /> Ver Filtros
              </Button>
              <Button variant="default" className="flex-1 flex gap-2 items-center" onClick={() => handleOpenRegisterModal(veiculo)}>
                <Oil className="h-4 w-4" /> Registrar Filtro
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle>Filtros do Veículo</DialogTitle>
            <div className="text-muted-foreground text-sm mt-1">
              {selectedVeiculo && `${selectedVeiculo.placa} - ${selectedVeiculo.modelo} (${selectedVeiculo.marca})`}
            </div>
          </DialogHeader>
          <div className="overflow-x-auto mt-4">
            <div className="flex justify-end mb-2">
              <Button variant={editMode ? "secondary" : "outline"} size="sm" onClick={() => setEditMode(e => !e)}>
                {editMode ? "Concluir Edição" : "Editar Lista"}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {FILTER_HEADERS.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {FILTER_HEADERS.map((header) => (
                    <TableCell key={header}>
                      {getCellContent(header)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogClose asChild>
            <Button variant="secondary" className="mt-4">Fechar</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Modal de registro de filtro */}
      <Dialog open={registerModalOpen} onOpenChange={handleCloseRegisterModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Filtro</DialogTitle>
            <div className="text-muted-foreground text-sm mt-1">
              {registerVeiculo && `${registerVeiculo.placa} - ${registerVeiculo.modelo} (${registerVeiculo.marca})`}
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria do Filtro</label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_HEADERS.map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Produto</label>
              <Button variant="outline" className="w-full" onClick={() => setProdutoDialogOpen(true)}>
                {selectedProduto ? selectedProduto.descricao : "Selecionar Produto"}
              </Button>
            </div>
            <Button onClick={handleRegister} disabled={!selectedCategoria || !selectedProduto} className="w-full">
              Registrar Filtro
            </Button>
          </div>
          <SelecionarProdutoDialog
            open={produtoDialogOpen}
            onOpenChange={setProdutoDialogOpen}
            onSelect={setSelectedProduto}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}