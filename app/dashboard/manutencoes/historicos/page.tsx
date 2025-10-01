"use client"

import { getVeiculosSupabase } from '@/services/veiculo-service'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Car, Calendar, Palette, Building, Search, Pencil, Trash, Plus, Disc } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getSaidasSupabase } from '@/services/saida-service'
import { getProdutosCompativeisComVeiculoSupabase, getLocalizacoesSupabase } from '@/services/produto-service'
import { getOrdensServicoSupabase } from '@/services/ordem-servico-service'
import { getTrocasOleo } from '@/services/troca-oleo-service'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog as UIDialog, DialogContent as UIDialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '@/components/ui/dialog'
import { addManutencaoAntiga } from '@/services/manutencao-antiga-service'
import { addObservacaoVeiculo } from '@/services/observacao-veiculo-service'
import { supabase } from '@/lib/supabase'

// Mapa de cores pastel para secretarias
const secretariaColors: Record<string, string> = {
  SEMGOV: '#ffe5ec',
  SEMPLAD: '#e0f7fa',
  SEMFAZ: '#fff9c4',
  SEMEDUC: '#e1bee7',
  SEMUSA: '#dcedc8',
  SEMATHRAB: '#ffe0b2',
  SEMOSP: '#b3e5fc',
  SEMALP: '#f8bbd0',
  SEMAEV: '#c8e6c9',
  SEMCI: '#d1c4e9',
  SEMGAP: '#f0f4c3',
  SEMCTEL: '#b2dfdb',
  SEMSEG: '#f3e5f5',
  SEMTRANSP: '#fce4ec',
  PROGEM: '#f5f5f5',
}

function getSecretariaColor(secretaria: string) {
  if (!secretaria) return '#f5f5f5'
  const key = secretaria.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return secretariaColors[key] || '#f5f5f5'
}

function groupBySecretaria(veiculos: any[]) {
  return veiculos.reduce((acc, veiculo) => {
    const key = veiculo.secretaria || 'Outros'
    if (!acc[key]) acc[key] = []
    acc[key].push(veiculo)
    return acc
  }, {} as Record<string, any[]>)
}

const slides = [
  { key: 'pecas-compativeis', label: 'Peças Compatíveis', content: <div className="py-4">Conteúdo de Peças Compatíveis</div> },
  { key: 'pecas-utilizadas', label: 'Peças Utilizadas', content: <div className="py-4">Conteúdo de Peças Utilizadas</div> },
  { key: 'ordens-servico', label: 'Ordens de Serviço', content: <div className="py-4">Conteúdo de Ordens de Serviço</div> },
  { key: 'troca-oleo', label: 'Troca de Óleo', content: <div className="py-4">Conteúdo de Troca de Óleo</div> },
  { key: 'troca-pneu', label: 'Troca de Pneu', content: <div className="py-4">Conteúdo de Troca de Pneu</div> },
  { key: 'atualizacao-km', label: 'Atualização de Km', content: <div className="py-4">Conteúdo de Atualização de Km</div> },
  { key: 'registros', label: 'Manutenções Antigas', content: <div className="py-4">Conteúdo de Manutenções Antigas</div> },
  { key: 'observacoes', label: 'Observações', content: <div className="py-4">Conteúdo de Observações</div> },
]

export default function HistoricosPage() {
  const [veiculos, setVeiculos] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedVeiculo, setSelectedVeiculo] = useState<any | null>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [pecasUtilizadas, setPecasUtilizadas] = useState<any[]>([])
  const [pecasCompativeis, setPecasCompativeis] = useState<any[]>([])
  const [ordensServico, setOrdensServico] = useState<any[]>([])
  const [historicoTrocaOleo, setHistoricoTrocaOleo] = useState<any[]>([])
  const [historicoTrocaPneu, setHistoricoTrocaPneu] = useState<any[]>([])
  const [searchPeca, setSearchPeca] = useState("")
  const [searchPecaUtilizada, setSearchPecaUtilizada] = useState("")
  const [searchOrdemServico, setSearchOrdemServico] = useState("")
  const [searchTrocaOleo, setSearchTrocaOleo] = useState("")
  const [searchAtualizacaoKm, setSearchAtualizacaoKm] = useState("")
  const [searchTrocaPneu, setSearchTrocaPneu] = useState("")
  const [localizacoes, setLocalizacoes] = useState<any[]>([])
  const [periodoTrocaOleo, setPeriodoTrocaOleo] = useState<{inicio: string, fim: string}>({inicio: '', fim: ''})
  const [periodoAtualizacaoKm, setPeriodoAtualizacaoKm] = useState<{inicio: string, fim: string}>({inicio: '', fim: ''})
  const [periodoTrocaPneu, setPeriodoTrocaPneu] = useState<{inicio: string, fim: string}>({inicio: '', fim: ''})
  const [manutAntigas, setManutAntigas] = useState<{id: string, data: string, titulo: string, pecas: string}[]>([])
  const [modalManutAntigaOpen, setModalManutAntigaOpen] = useState(false)
  const [editManutAntiga, setEditManutAntiga] = useState<{id: string, data: string, titulo: string, pecas: string} | null>(null)
  const [formManutAntiga, setFormManutAntiga] = useState<{data: string, titulo: string, pecas: string}>({data: '', titulo: '', pecas: ''})
  const [observacoes, setObservacoes] = useState<any[]>([])
  const [modalObsOpen, setModalObsOpen] = useState(false)
  const [editObs, setEditObs] = useState<any | null>(null)
  const [formObs, setFormObs] = useState<{data_observacao: string, observacao: string}>({data_observacao: '', observacao: ''})

  // Buscar peças utilizadas ao abrir o modal ou trocar de veículo
  const fetchPecasUtilizadas = useCallback(async (veiculoId: string) => {
    if (!veiculoId) return;
    const saidas = await getSaidasSupabase();
    setPecasUtilizadas(saidas.filter((s) => s.veiculoId === veiculoId));
  }, []);

  // Buscar peças compatíveis ao abrir o modal ou trocar de veículo
  const fetchPecasCompativeis = useCallback(async (veiculoId: string) => {
    if (!veiculoId) return;
    const produtos = await getProdutosCompativeisComVeiculoSupabase(veiculoId);
    setPecasCompativeis(produtos);
  }, []);

  // Buscar ordens de serviço ao abrir o modal ou trocar de veículo
  const fetchOrdensServico = useCallback(async (veiculoId: string) => {
    if (!veiculoId) return;
    const ordens = await getOrdensServicoSupabase();
    setOrdensServico(ordens.filter((o) => o.veiculoId === veiculoId));
  }, []);

  // Buscar histórico de troca de óleo ao abrir o modal ou trocar de veículo
  const fetchHistoricoTrocaOleo = useCallback(async (veiculoId: string) => {
    if (!veiculoId) return;
    
    try {
      // Usar o serviço da nova tabela trocas_oleo
      const historico = await getTrocasOleo(veiculoId);
      
      // Mapear para o formato esperado pelo componente
      const historicoFormatado = historico.map(item => ({
        id: item.id,
        data: item.data_troca,
        tipo: item.tipo_servico === "Troca de Óleo" ? "Troca de Óleo" : "Atualização de Km",
        kmAnterior: item.km_anterior,
        kmAtual: item.km_atual,
        kmProxTroca: item.km_proxima_troca,
        observacao: item.observacao
      }));
      
      setHistoricoTrocaOleo(historicoFormatado);
    } catch (error) {
      console.error("Erro ao buscar histórico de trocas:", error);
      setHistoricoTrocaOleo([]);
    }
  }, []);

  // Buscar histórico de troca de pneu ao abrir o modal ou trocar de veículo
  const fetchHistoricoTrocaPneu = useCallback(async (veiculoId: string) => {
    if (!veiculoId) return;
    
    try {
      // Buscar dados de troca de pneu do Supabase
      const { data: trocasPneu, error } = await supabase
        .from("trocas_pneu")
        .select(`
          *,
          tipo_pneu:tipo_pneu_id (
            marca,
            modelo,
            medida
          )
        `)
        .eq("veiculo_id", veiculoId)
        .order("data_troca", { ascending: false });
        
      if (error) throw error;
      
      // Formatar os dados de trocas de pneu
      const historicoFormatado = (trocasPneu || []).map(item => ({
        id: item.id,
        data: item.data_troca,
        tipo: "Troca de Pneu",
        kmAtual: item.km,
        tipoPneu: item.tipo_pneu ? `${item.tipo_pneu.marca} ${item.tipo_pneu.modelo} (${item.tipo_pneu.medida})` : "Não especificado",
        posicoes: item.posicoes || [],
        alinhamento: item.alinhamento || false,
        balanceamento: item.balanceamento || false,
        observacao: item.observacao
      }));
      
      setHistoricoTrocaPneu(historicoFormatado);
    } catch (error) {
      console.error("Erro ao buscar histórico de trocas de pneu:", error);
      setHistoricoTrocaPneu([]);
    }
  }, []);

  useEffect(() => {
    if (modalOpen && selectedVeiculo?.id) {
      fetchPecasUtilizadas(selectedVeiculo.id);
      fetchPecasCompativeis(selectedVeiculo.id);
      fetchOrdensServico(selectedVeiculo.id);
      fetchHistoricoTrocaOleo(selectedVeiculo.id);
      fetchHistoricoTrocaPneu(selectedVeiculo.id);
    }
  }, [modalOpen, selectedVeiculo, fetchPecasUtilizadas, fetchPecasCompativeis, fetchOrdensServico, fetchHistoricoTrocaOleo, fetchHistoricoTrocaPneu]);

  useEffect(() => {
    getVeiculosSupabase().then(setVeiculos)
    getLocalizacoesSupabase().then(setLocalizacoes)
  }, [])

  // Filtro de pesquisa
  const filteredVeiculos = veiculos.filter((v) => {
    const q = search.toLowerCase()
    return (
      v.placa?.toLowerCase().includes(q) ||
      v.modelo?.toLowerCase().includes(q) ||
      v.marca?.toLowerCase().includes(q) ||
      v.secretaria?.toLowerCase().includes(q) ||
      v.cor?.toLowerCase().includes(q) ||
      (v.ano && v.ano.toString().includes(q))
    )
  })

  const veiculosPorSecretaria = groupBySecretaria(filteredVeiculos)
  const secretarias = Object.keys(veiculosPorSecretaria).sort()

  // Agrupar peças compatíveis por categoria e aplicar filtro de pesquisa
  const pecasCompativeisFiltradas = pecasCompativeis.filter((item) => {
    const q = searchPeca.toLowerCase();
    return (
      item.descricao?.toLowerCase().includes(q) ||
      item.categoria?.toLowerCase().includes(q) ||
      item.unidade?.toLowerCase().includes(q) ||
      item.localizacao?.toLowerCase().includes(q)
    );
  });
  const pecasPorCategoria = pecasCompativeisFiltradas.reduce((acc: Record<string, any[]>, item) => {
    const cat = item.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const categorias = Object.keys(pecasPorCategoria).sort();

  // Mapeia nome da localização para setor
  const localizacaoNomeParaSetor: Record<string, string> = localizacoes.reduce((acc, loc) => {
    acc[loc.nome] = loc.setor
    return acc
  }, {} as Record<string, string>);

  // Função utilitária para buscar unidade do produto pelo id
  function getUnidadeProduto(produtoId: string) {
    const produto = pecasCompativeis.find((p) => p.id === produtoId)
    return produto?.unidade || '-'
  }

  // Filtro para peças utilizadas
  const pecasUtilizadasFiltradas = pecasUtilizadas.filter((item) => {
    const q = searchPecaUtilizada.toLowerCase();
    const produto = pecasCompativeis.find((p) => p.id === item.produtoId);
    return (
      (item.produtoNome?.toLowerCase().includes(q)) ||
      (item.categoria?.toLowerCase().includes(q)) ||
      (produto?.unidade?.toLowerCase().includes(q)) ||
      (item.quantidade && item.quantidade.toString().includes(q)) ||
      (item.data && new Date(item.data).toLocaleDateString().includes(q))
    );
  });

  // Filtro para ordens de serviço
  const ordensServicoFiltradas = ordensServico.filter((item) => {
    const q = searchOrdemServico.toLowerCase();
    return (
      (item.numero?.toString().toLowerCase().includes(q)) ||
      (item.data && new Date(item.data).toLocaleDateString().includes(q)) ||
      (item.status?.toLowerCase().includes(q)) ||
      (item.prioridade?.toLowerCase().includes(q)) ||
      (item.defeitosRelatados?.toLowerCase().includes(q)) ||
      (item.mecanicoInfo?.toLowerCase().includes(q))
    );
  });

  // Função utilitária para comparar datas (YYYY-MM-DD)
  function isInPeriod(dateStr: string | undefined, inicio: string, fim: string) {
    if (!dateStr) return false;
    const date = new Date(dateStr)
    if (inicio && new Date(inicio) > date) return false;
    if (fim && new Date(fim) < date) return false;
    return true;
  }

  // Filtro para troca de óleo
  const trocaOleoFiltrada = historicoTrocaOleo.filter((h) => {
    if (h.tipo !== 'Troca de Óleo') return false;
    const q = searchTrocaOleo.toLowerCase();
    const dataOk = !periodoTrocaOleo.inicio && !periodoTrocaOleo.fim ? true : isInPeriod(h.data, periodoTrocaOleo.inicio, periodoTrocaOleo.fim);
    return dataOk && (
      (h.data && new Date(h.data).toLocaleDateString().includes(q)) ||
      (h.kmAnterior && h.kmAnterior.toString().includes(q)) ||
      (h.kmAtual && h.kmAtual.toString().includes(q)) ||
      (h.kmProxTroca && h.kmProxTroca.toString().includes(q))
    );
  });

  // Filtro para atualização de km
  const atualizacaoKmFiltrada = historicoTrocaOleo.filter((h: any) => {
    if (h.tipo !== 'Atualização de Km') return false;
    const q = searchAtualizacaoKm.toLowerCase();
    const dataOk = !periodoAtualizacaoKm.inicio && !periodoAtualizacaoKm.fim ? true : isInPeriod(h.data, periodoAtualizacaoKm.inicio, periodoAtualizacaoKm.fim);
    return dataOk && (
      (h.data && new Date(h.data).toLocaleDateString().includes(q)) ||
      (h.kmAnterior && h.kmAnterior.toString().includes(q)) ||
      (h.kmAtual && h.kmAtual.toString().includes(q))
    );
  });

  // Filtro para troca de pneu (similar ao filtro de troca de óleo)
  const trocaPneuFiltrada = historicoTrocaPneu.filter((h) => {
    const q = searchTrocaPneu.toLowerCase();
    const dataOk = !periodoTrocaPneu.inicio && !periodoTrocaPneu.fim ? true : isInPeriod(h.data, periodoTrocaPneu.inicio, periodoTrocaPneu.fim);
    return dataOk && (
      (h.data && new Date(h.data).toLocaleDateString().includes(q)) ||
      (h.kmAtual && h.kmAtual.toString().includes(q)) ||
      (h.tipoPneu && h.tipoPneu.toLowerCase().includes(q)) ||
      (h.observacao && h.observacao.toLowerCase().includes(q))
    );
  });

  function handleOpenAddManutAntiga() {
    setEditManutAntiga(null)
    setFormManutAntiga({data: '', titulo: '', pecas: ''})
    setModalManutAntigaOpen(true)
  }
  function handleOpenEditManutAntiga(m: {id: string, data: string, titulo: string, pecas: string}) {
    setEditManutAntiga(m)
    setFormManutAntiga({data: m.data, titulo: m.titulo, pecas: m.pecas})
    setModalManutAntigaOpen(true)
  }
  async function handleSaveManutAntiga() {
    if (!formManutAntiga.data || !formManutAntiga.titulo || !formManutAntiga.pecas) return;
    if (!selectedVeiculo?.id) {
      alert('Selecione um veículo para registrar a manutenção antiga.');
      return;
    }
    try {
      let novaManutencao;
      if (editManutAntiga) {
        // Aqui você pode implementar a edição no banco, se desejar
        setManutAntigas(arr => arr.map(m => m.id === editManutAntiga.id ? {...m, ...formManutAntiga} : m))
        setModalManutAntigaOpen(false)
        return;
      } else {
        novaManutencao = await addManutencaoAntiga({
          veiculo_id: selectedVeiculo.id,
          data_servico: formManutAntiga.data,
          titulo: formManutAntiga.titulo,
          pecas: formManutAntiga.pecas,
        });
        setManutAntigas(arr => [...arr, novaManutencao])
      }
      setModalManutAntigaOpen(false)
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.message || err))
    }
  }
  function handleDeleteManutAntiga(id: string) {
    setManutAntigas(arr => arr.filter(m => m.id !== id))
  }

  function handleOpenAddObs() {
    setEditObs(null)
    setFormObs({data_observacao: '', observacao: ''})
    setModalObsOpen(true)
  }
  function handleOpenEditObs(o: any) {
    setEditObs(o)
    setFormObs({data_observacao: o.data_observacao || '', observacao: o.observacao || ''})
    setModalObsOpen(true)
  }
  async function handleSaveObs() {
    if (!formObs.data_observacao || !formObs.observacao) return;
    if (!selectedVeiculo?.id) {
      alert('Selecione um veículo para registrar a observação.');
      return;
    }
    try {
      let novaObs;
      if (editObs) {
        // Aqui você pode implementar a edição no banco, se desejar
        setObservacoes(arr => arr.map(o => o.id === editObs.id ? {...o, ...formObs} : o))
        setModalObsOpen(false)
        return;
      } else {
        novaObs = await addObservacaoVeiculo({
          veiculo_id: selectedVeiculo.id,
          data_observacao: formObs.data_observacao,
          observacao: formObs.observacao,
        });
        setObservacoes(arr => [...arr, novaObs])
      }
      setModalObsOpen(false)
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.message || err))
    }
  }
  function handleDeleteObs(id: string) {
    setObservacoes(arr => arr.filter(o => o.id !== id))
  }

  return (
    <div className="space-y-10">
      <div className="bg-card rounded-lg p-6 shadow mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Históricos de Manutenção</h1>
        <p className="text-muted-foreground">Consulta de históricos de manutenção</p>
      </div>
      <div className="flex items-center gap-2 max-w-md mb-2">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar veículo, placa, secretaria, cor, ano..."
            className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div className="bg-card rounded-lg shadow p-2 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Secretaria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVeiculos.map((veiculo: any) => (
              <TableRow key={veiculo.id}>
                <TableCell className="font-medium">{veiculo.placa}</TableCell>
                <TableCell>{veiculo.modelo}</TableCell>
                <TableCell>{veiculo.marca}</TableCell>
                <TableCell>{veiculo.ano}</TableCell>
                <TableCell>{veiculo.cor}</TableCell>
                <TableCell>{veiculo.secretaria}</TableCell>
                <TableCell>
                  <Badge variant={veiculo.status === "Ativo" ? "default" : "destructive"} className="text-xs">
                    {veiculo.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedVeiculo(veiculo)
                      setActiveSlide(0)
                      setModalOpen(true)
                    }}
                  >
                    Histórico
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl w-full overflow-visible max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Histórico do Veículo
              {selectedVeiculo?.placa ? ` - ${selectedVeiculo.placa}` : ""}
              {selectedVeiculo?.modelo ? ` - ${selectedVeiculo.modelo}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex min-h-[350px] mt-4">
            <aside className="w-56 border-r pr-4 flex flex-col gap-2">
              {slides.map((slide, idx) => (
                <button
                  key={slide.key}
                  className={`w-full text-left px-4 py-2 rounded-md font-medium transition-colors duration-150 ${activeSlide === idx ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-primary/10'}`}
                  onClick={() => setActiveSlide(idx)}
                >
                  {slide.label}
                </button>
              ))}
            </aside>
            <section className="flex-1 pl-6 flex flex-col">
              <div className="w-full">
                {activeSlide === 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4 w-full">
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Search className="h-5 w-5" />
                        </span>
                        <input
                          type="text"
                          value={searchPeca}
                          onChange={e => setSearchPeca(e.target.value)}
                          placeholder="Pesquisar peça, categoria, unidade, localização..."
                          className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    {pecasCompativeisFiltradas.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">Nenhuma peça compatível encontrada para este veículo.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {categorias.map((cat) => (
                          <AccordionItem key={cat} value={cat}>
                            <AccordionTrigger>{cat}</AccordionTrigger>
                            <AccordionContent>
                              <table className="w-full text-sm border rounded-md overflow-hidden">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="p-2 text-left">Descrição</th>
                                    <th className="p-2 text-left">Unidade</th>
                                    <th className="p-2 text-left">Estoque</th>
                                    <th className="p-2 text-left">Localização</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pecasPorCategoria[cat].map((item) => (
                                    <tr key={item.id} className="border-b last:border-0">
                                      <td className="p-2">{item.descricao}</td>
                                      <td className="p-2">{item.unidade}</td>
                                      <td className="p-2">{item.estoque}</td>
                                      <td className="p-2">{localizacaoNomeParaSetor[item.localizacao] || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                ) : activeSlide === 1 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4 w-full">
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Search className="h-5 w-5" />
                        </span>
                        <input
                          type="text"
                          value={searchPecaUtilizada}
                          onChange={e => setSearchPecaUtilizada(e.target.value)}
                          placeholder="Pesquisar produto, categoria, unidade, quantidade, data..."
                          className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    {pecasUtilizadas.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">Nenhuma peça utilizada encontrada para este veículo.</div>
                    ) : (
                      <table className="w-full text-sm border rounded-md overflow-hidden">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left">Produto</th>
                            <th className="p-2 text-left">Categoria</th>
                            <th className="p-2 text-left">Unidade</th>
                            <th className="p-2 text-left">Quantidade</th>
                            <th className="p-2 text-left">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pecasUtilizadasFiltradas.map((item) => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="p-2">{item.produtoNome || '-'}</td>
                              <td className="p-2">{item.categoria || '-'}</td>
                              <td className="p-2">{getUnidadeProduto(item.produtoId)}</td>
                              <td className="p-2">{item.quantidade ?? '-'}</td>
                              <td className="p-2">{item.data ? new Date(item.data).toLocaleDateString() : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : activeSlide === 2 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4 w-full">
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Search className="h-5 w-5" />
                        </span>
                        <input
                          type="text"
                          value={searchOrdemServico}
                          onChange={e => setSearchOrdemServico(e.target.value)}
                          placeholder="Pesquisar número, data, status, prioridade, defeitos, mecânico..."
                          className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    {ordensServico.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">Nenhuma ordem de serviço encontrada para este veículo.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {ordensServicoFiltradas.map((item) => (
                          <AccordionItem key={item.id} value={item.id}>
                            <AccordionTrigger>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-base">OS {item.numero}</span>
                                  <span className="ml-2"><Badge variant={item.status === "Ativo" ? "default" : "destructive"} className="text-xs">{item.status}</Badge></span>
                                  <span className="ml-2">{item.prioridade}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-medium">{item.mecanicoInfo}</span>
                                  <span className="font-medium">{item.data ? new Date(item.data).toLocaleDateString() : '-'}</span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 p-2">
                                <Tabs defaultValue="status" className="w-full">
                                  <TabsList className="w-full mb-2">
                                    <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
                                    <TabsTrigger value="detalhes" className="flex-1">Detalhes</TabsTrigger>
                                    <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="status">
                                    <div className="flex flex-col md:flex-row md:gap-8">
                                      <div className="flex-1 space-y-2">
                                        <div><b>Status:</b> {item.status}</div>
                                        <div><b>Prioridade:</b> {item.prioridade}</div>
                                        <div><b>Mecânico:</b> {item.mecanicoInfo}</div>
                                        <div><b>Data:</b> {item.data ? new Date(item.data).toLocaleDateString() : '-'}</div>
                                        <div><b>Veículo:</b> {item.veiculoInfo || '-'}</div>
                                        <div><b>Solicitante:</b> {item.solicitanteInfo || '-'}</div>
                                        <div><b>Km Atual:</b> {item.kmAtual ?? '-'}</div>
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        {item.observacoesAlmoxarifado && <div><b>Obs. Almoxarifado:</b> <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{item.observacoesAlmoxarifado}</div></div>}
                                        {item.observacoesCompras && <div><b>Obs. Compras:</b> <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{item.observacoesCompras}</div></div>}
                                        {item.observacoesRetorno && <div><b>Obs. Retorno:</b> <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{item.observacoesRetorno}</div></div>}
                                      </div>
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="detalhes">
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1"><b>Defeitos relatados:</b></div>
                                        <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{item.defeitosRelatados || '-'}</div>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 mb-1"><b>Peças/Serviços:</b></div>
                                        <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{item.pecasServicos || '-'}</div>
                                      </div>
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="historico">
                                    {item.historico && item.historico.length > 0 ? (
                                      <div className="space-y-2">
                                        {item.historico.map((h: any, idx: number) => (
                                          <div key={idx} className="bg-muted rounded p-2 text-sm">
                                            <div><b>Data:</b> {h.data ? new Date(h.data).toLocaleDateString() : '-'}</div>
                                            <div><b>De:</b> {h.de || '-'}</div>
                                            <div><b>Para:</b> {h.para || '-'}</div>
                                            <div><b>Observação:</b> {h.observacao || '-'}</div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground text-center py-4">Nenhum histórico disponível para esta ordem.</div>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                ) : activeSlide === 3 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="relative w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Search className="h-5 w-5" />
                        </span>
                        <input
                          type="text"
                          value={searchTrocaOleo}
                          onChange={e => setSearchTrocaOleo(e.target.value)}
                          placeholder="Pesquisar..."
                          className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <input
                        type="date"
                        value={periodoTrocaOleo.inicio}
                        onChange={e => setPeriodoTrocaOleo(p => ({...p, inicio: e.target.value}))}
                        className="border rounded px-2 py-2 text-sm"
                        title="Data inicial"
                      />
                      <span className="text-muted-foreground">até</span>
                      <input
                        type="date"
                        value={periodoTrocaOleo.fim}
                        onChange={e => setPeriodoTrocaOleo(p => ({...p, fim: e.target.value}))}
                        className="border rounded px-2 py-2 text-sm"
                        title="Data final"
                      />
                    </div>
                    {historicoTrocaOleo.filter((h) => h.tipo === 'Troca de Óleo').length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">Nenhum registro de troca de óleo encontrado para este veículo.</div>
                    ) : (
                      <table className="w-full text-sm border rounded-md overflow-hidden">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left">Data</th>
                            <th className="p-2 text-left">Km Anterior</th>
                            <th className="p-2 text-left">Km Atual</th>
                            <th className="p-2 text-left">Km Próx. Troca</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trocaOleoFiltrada.map((item) => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="p-2">{item.data ? new Date(item.data).toLocaleDateString() : '-'}</td>
                              <td className="p-2">{item.kmAnterior ?? '-'}</td>
                              <td className="p-2">{item.kmAtual ?? '-'}</td>
                              <td className="p-2">{item.kmProxTroca ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : activeSlide === 4 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="relative w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Search className="h-5 w-5" />
                        </span>
                        <input
                          type="text"
                          value={searchTrocaPneu}
                          onChange={e => setSearchTrocaPneu(e.target.value)}
                          placeholder="Pesquisar..."
                          className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <input
                        type="date"
                        value={periodoTrocaPneu.inicio}
                        onChange={e => setPeriodoTrocaPneu(p => ({...p, inicio: e.target.value}))}
                        className="border rounded px-2 py-2 text-sm"
                        title="Data inicial"
                      />
                      <span className="text-muted-foreground">até</span>
                      <input
                        type="date"
                        value={periodoTrocaPneu.fim}
                        onChange={e => setPeriodoTrocaPneu(p => ({...p, fim: e.target.value}))}
                        className="border rounded px-2 py-2 text-sm"
                        title="Data final"
                      />
                    </div>
                    {historicoTrocaPneu.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">Nenhum registro de troca de pneu encontrado para este veículo.</div>
                    ) : (
                      <table className="w-full text-sm border rounded-md overflow-hidden">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left">Data</th>
                            <th className="p-2 text-left">Km</th>
                            <th className="p-2 text-left">Tipo de Pneu</th>
                            <th className="p-2 text-left">Posições</th>
                            <th className="p-2 text-left">Serviços</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trocaPneuFiltrada.map((item) => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="p-2">{item.data ? new Date(item.data).toLocaleDateString() : '-'}</td>
                              <td className="p-2">{item.kmAtual ?? '-'}</td>
                              <td className="p-2">{item.tipoPneu ?? '-'}</td>
                              <td className="p-2">{item.posicoes && item.posicoes.length > 0 
                                ? item.posicoes.join(', ') 
                                : "Todas"}
                              </td>
                              <td className="p-2">
                                {[
                                  item.alinhamento ? 'Alinhamento' : null,
                                  item.balanceamento ? 'Balanceamento' : null
                                ].filter(Boolean).join(', ') || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : activeSlide === 5 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="relative w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Search className="h-5 w-5" />
                        </span>
                        <input
                          type="text"
                          value={searchAtualizacaoKm}
                          onChange={e => setSearchAtualizacaoKm(e.target.value)}
                          placeholder="Pesquisar..."
                          className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <input
                        type="date"
                        value={periodoAtualizacaoKm.inicio}
                        onChange={e => setPeriodoAtualizacaoKm(p => ({...p, inicio: e.target.value}))}
                        className="border rounded px-2 py-2 text-sm"
                        title="Data inicial"
                      />
                      <span className="text-muted-foreground">até</span>
                      <input
                        type="date"
                        value={periodoAtualizacaoKm.fim}
                        onChange={e => setPeriodoAtualizacaoKm(p => ({...p, fim: e.target.value}))}
                        className="border rounded px-2 py-2 text-sm"
                        title="Data final"
                      />
                    </div>
                    {historicoTrocaOleo.filter((h: any) => h.tipo === 'Atualização de Km').length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">Nenhum registro de atualização de km encontrado para este veículo.</div>
                    ) : (
                      <table className="w-full text-sm border rounded-md overflow-hidden">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left">Data</th>
                            <th className="p-2 text-left">Km Anterior</th>
                            <th className="p-2 text-left">Km Atual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {atualizacaoKmFiltrada.map((item: any) => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="p-2">{item.data ? new Date(item.data).toLocaleDateString() : '-'}</td>
                              <td className="p-2">{item.kmAnterior ?? '-'}</td>
                              <td className="p-2">{item.kmAtual ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : activeSlide === 6 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">Manutenções Antigas</h2>
                      <button onClick={handleOpenAddManutAntiga} className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">
                        <Plus className="w-4 h-4" /> Adicionar Manutenção Antiga
                      </button>
                    </div>
                    {manutAntigas.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">Nenhuma manutenção antiga cadastrada.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {manutAntigas.map(m => (
                          <AccordionItem key={m.id} value={m.id}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-base">{m.titulo}{(m.data_servico || m.data) ? ` - ${new Date(m.data_servico || m.data).toLocaleDateString()}` : ''}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="flex justify-end gap-2 mb-2">
                                <button onClick={() => handleOpenEditManutAntiga(m)} className="p-1 rounded hover:bg-muted" title="Editar"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteManutAntiga(m.id)} className="p-1 rounded hover:bg-muted text-destructive" title="Excluir"><Trash className="w-4 h-4" /></button>
                              </div>
                              <Tabs defaultValue="info" className="w-full">
                                <TabsList className="w-full mb-2">
                                  <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
                                  <TabsTrigger value="pecas" className="flex-1">Peças</TabsTrigger>
                                </TabsList>
                                <TabsContent value="info">
                                  <div className="space-y-2">
                                    <div><b>Data do Serviço:</b> {(m.data_servico || m.data) ? new Date(m.data_servico || m.data).toLocaleDateString() : '-'}</div>
                                    <div><b>Título:</b> {m.titulo}</div>
                                    <div><b>Veículo:</b> {selectedVeiculo ? `${selectedVeiculo.placa || ''} ${selectedVeiculo.modelo || ''}` : '-'}</div>
                                  </div>
                                </TabsContent>
                                <TabsContent value="pecas">
                                  <div className="space-y-2">
                                    <div><b>Peças/Serviços:</b></div>
                                    <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{m.pecas}</div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                    <UIDialog open={modalManutAntigaOpen} onOpenChange={setModalManutAntigaOpen}>
                      <UIDialogContent className="max-w-md w-full">
                        <UIDialogHeader>
                          <UIDialogTitle>{editManutAntiga ? 'Editar' : 'Adicionar'} Manutenção Antiga</UIDialogTitle>
                        </UIDialogHeader>
                        <form onSubmit={e => {e.preventDefault(); handleSaveManutAntiga();}} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Data do Serviço</label>
                            <input type="date" className="border rounded px-3 py-2 w-full" value={formManutAntiga.data} onChange={e => setFormManutAntiga(f => ({...f, data: e.target.value}))} required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Título</label>
                            <input type="text" className="border rounded px-3 py-2 w-full" value={formManutAntiga.titulo} onChange={e => setFormManutAntiga(f => ({...f, titulo: e.target.value}))} required placeholder="Ex: Troca de embreagem, revisão geral..." />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Peças</label>
                            <textarea className="border rounded px-3 py-2 w-full min-h-[80px]" value={formManutAntiga.pecas} onChange={e => setFormManutAntiga(f => ({...f, pecas: e.target.value}))} required placeholder="Descreva as peças e serviços realizados..." />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setModalManutAntigaOpen(false)} className="px-4 py-2 rounded bg-muted text-foreground">Cancelar</button>
                            <button type="submit" className="px-4 py-2 rounded bg-primary text-white">Salvar</button>
                          </div>
                        </form>
                      </UIDialogContent>
                    </UIDialog>
                  </div>
                ) : activeSlide === 7 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">Observações</h2>
                      <button onClick={handleOpenAddObs} className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">
                        <Plus className="w-4 h-4" /> Adicionar Observação
                      </button>
                    </div>
                    {observacoes.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">Nenhuma observação cadastrada.</div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {observacoes.map(o => (
                          <AccordionItem key={o.id} value={o.id}>
                            <AccordionTrigger>
                              <span className="font-semibold text-base">{o.observacao.slice(0, 32)}{o.observacao.length > 32 ? '...' : ''}{o.data_observacao ? ` - ${new Date(o.data_observacao).toLocaleDateString()}` : ''}</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="flex justify-end gap-2 mb-2">
                                <button onClick={() => handleOpenEditObs(o)} className="p-1 rounded hover:bg-muted" title="Editar"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteObs(o.id)} className="p-1 rounded hover:bg-muted text-destructive" title="Excluir"><Trash className="w-4 h-4" /></button>
                              </div>
                              <Tabs defaultValue="info" className="w-full">
                                <TabsList className="w-full mb-2">
                                  <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
                                </TabsList>
                                <TabsContent value="info">
                                  <div className="space-y-2">
                                    <div><b>Data:</b> {o.data_observacao ? new Date(o.data_observacao).toLocaleDateString() : '-'}</div>
                                    <div><b>Observação:</b></div>
                                    <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-sm">{o.observacao}</div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                    <UIDialog open={modalObsOpen} onOpenChange={setModalObsOpen}>
                      <UIDialogContent className="max-w-md w-full">
                        <UIDialogHeader>
                          <UIDialogTitle>{editObs ? 'Editar' : 'Adicionar'} Observação</UIDialogTitle>
                        </UIDialogHeader>
                        <form onSubmit={e => {e.preventDefault(); handleSaveObs();}} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Data</label>
                            <input type="date" className="border rounded px-3 py-2 w-full" value={formObs.data_observacao} onChange={e => setFormObs(f => ({...f, data_observacao: e.target.value}))} required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Observação</label>
                            <textarea className="border rounded px-3 py-2 w-full min-h-[80px]" value={formObs.observacao} onChange={e => setFormObs(f => ({...f, observacao: e.target.value}))} required placeholder="Descreva a observação..." />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setModalObsOpen(false)} className="px-4 py-2 rounded bg-muted text-foreground">Cancelar</button>
                            <button type="submit" className="px-4 py-2 rounded bg-primary text-white">Salvar</button>
                          </div>
                        </form>
                      </UIDialogContent>
                    </UIDialog>
                  </div>
                ) : (
                  slides[activeSlide].content
                )}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
