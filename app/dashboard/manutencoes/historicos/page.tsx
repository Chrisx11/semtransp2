"use client"

import { getVeiculosSupabase } from '@/services/veiculo-service'
import { Button } from '@/components/ui/button'
import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Car, Calendar, Palette, Building, Search, Pencil, Trash, Plus, Disc, History, Wrench, Package, FileText, Droplet, Gauge, AlertCircle, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { useIsMobile } from '@/components/ui/use-mobile'
import { cn } from '@/lib/utils'
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
import { addManutencaoAntiga, getManutencoesAntigas, updateManutencaoAntiga, deleteManutencaoAntiga } from '@/services/manutencao-antiga-service'
import { addObservacaoVeiculo, getObservacoesVeiculo, updateObservacaoVeiculo, deleteObservacaoVeiculo } from '@/services/observacao-veiculo-service'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MobileBackButton } from '@/components/mobile-back-button'

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
  LEONARDO: '#e8f5e9',
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
  { key: 'pecas-compativeis', label: 'Peças Compatíveis', icon: Package },
  { key: 'pecas-utilizadas', label: 'Peças Utilizadas', icon: Package },
  { key: 'ordens-servico', label: 'Ordens de Serviço', icon: FileText },
  { key: 'troca-oleo', label: 'Troca de Óleo', icon: Droplet },
  { key: 'troca-pneu', label: 'Troca de Pneu', icon: Disc },
  { key: 'atualizacao-km', label: 'Atualização de Km', icon: Gauge },
  { key: 'registros', label: 'Manutenções Antigas', icon: Wrench },
  { key: 'observacoes', label: 'Observações', icon: AlertCircle },
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
  const [manutAntigas, setManutAntigas] = useState<{id: string, data: string, data_servico?: string, titulo: string, pecas: string}[]>([])
  const [modalManutAntigaOpen, setModalManutAntigaOpen] = useState(false)
  const [editManutAntiga, setEditManutAntiga] = useState<{id: string, data: string, data_servico?: string, titulo: string, pecas: string} | null>(null)
  const [formManutAntiga, setFormManutAntiga] = useState<{data: string, titulo: string, pecas: string}>({data: '', titulo: '', pecas: ''})
  const [observacoes, setObservacoes] = useState<any[]>([])
  const [modalObsOpen, setModalObsOpen] = useState(false)
  const [editObs, setEditObs] = useState<any | null>(null)
  const [formObs, setFormObs] = useState<{data_observacao: string, observacao: string}>({data_observacao: '', observacao: ''})
  const [isLoadingData, setIsLoadingData] = useState(false)
  const { toast } = useToast()

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

  // Buscar manutenções antigas
  const fetchManutencoesAntigas = useCallback(async (veiculoId: string) => {
    if (!veiculoId) return;
    try {
      const manutencoes = await getManutencoesAntigas(veiculoId);
      setManutAntigas(manutencoes);
    } catch (error) {
      console.error("Erro ao buscar manutenções antigas:", error);
      setManutAntigas([]);
    }
  }, []);

  // Buscar observações
  const fetchObservacoes = useCallback(async (veiculoId: string) => {
    if (!veiculoId) return;
    try {
      const obs = await getObservacoesVeiculo(veiculoId);
      setObservacoes(obs);
    } catch (error) {
      console.error("Erro ao buscar observações:", error);
      setObservacoes([]);
    }
  }, []);

  useEffect(() => {
    if (modalOpen && selectedVeiculo?.id) {
      setIsLoadingData(true);
      Promise.all([
        fetchPecasUtilizadas(selectedVeiculo.id),
        fetchPecasCompativeis(selectedVeiculo.id),
        fetchOrdensServico(selectedVeiculo.id),
        fetchHistoricoTrocaOleo(selectedVeiculo.id),
        fetchHistoricoTrocaPneu(selectedVeiculo.id),
        fetchManutencoesAntigas(selectedVeiculo.id),
        fetchObservacoes(selectedVeiculo.id),
      ]).finally(() => {
        setIsLoadingData(false);
      });
    }
  }, [modalOpen, selectedVeiculo, fetchPecasUtilizadas, fetchPecasCompativeis, fetchOrdensServico, fetchHistoricoTrocaOleo, fetchHistoricoTrocaPneu, fetchManutencoesAntigas, fetchObservacoes]);

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
  function handleOpenEditManutAntiga(m: {id: string, data: string, data_servico?: string, titulo: string, pecas: string}) {
    setEditManutAntiga(m)
    setFormManutAntiga({data: m.data, titulo: m.titulo, pecas: m.pecas})
    setModalManutAntigaOpen(true)
  }
  async function handleSaveManutAntiga() {
    if (!formManutAntiga.data || !formManutAntiga.titulo || !formManutAntiga.pecas) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedVeiculo?.id) {
      toast({
        title: "Erro",
        description: "Selecione um veículo para registrar a manutenção antiga.",
        variant: "destructive",
      });
      return;
    }
    try {
      if (editManutAntiga) {
        await updateManutencaoAntiga(editManutAntiga.id, {
          data_servico: formManutAntiga.data,
          titulo: formManutAntiga.titulo,
          pecas: formManutAntiga.pecas,
        });
        await fetchManutencoesAntigas(selectedVeiculo.id);
        toast({
          title: "Manutenção atualizada",
          description: "A manutenção antiga foi atualizada com sucesso.",
        });
      } else {
        await addManutencaoAntiga({
          veiculo_id: selectedVeiculo.id,
          data_servico: formManutAntiga.data,
          titulo: formManutAntiga.titulo,
          pecas: formManutAntiga.pecas,
        });
        await fetchManutencoesAntigas(selectedVeiculo.id);
        toast({
          title: "Manutenção adicionada",
          description: "A manutenção antiga foi adicionada com sucesso.",
        });
      }
      setModalManutAntigaOpen(false)
      setFormManutAntiga({data: '', titulo: '', pecas: ''})
      setEditManutAntiga(null)
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Ocorreu um erro ao salvar a manutenção.",
        variant: "destructive",
      });
    }
  }
  async function handleDeleteManutAntiga(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta manutenção?')) return;
    try {
      await deleteManutencaoAntiga(id);
      await fetchManutencoesAntigas(selectedVeiculo!.id);
      toast({
        title: "Manutenção excluída",
        description: "A manutenção antiga foi excluída com sucesso.",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err.message || "Ocorreu um erro ao excluir a manutenção.",
        variant: "destructive",
      });
    }
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
    if (!formObs.data_observacao || !formObs.observacao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedVeiculo?.id) {
      toast({
        title: "Erro",
        description: "Selecione um veículo para registrar a observação.",
        variant: "destructive",
      });
      return;
    }
    try {
      if (editObs) {
        await updateObservacaoVeiculo(editObs.id, {
          data_observacao: formObs.data_observacao,
          observacao: formObs.observacao,
        });
        await fetchObservacoes(selectedVeiculo.id);
        toast({
          title: "Observação atualizada",
          description: "A observação foi atualizada com sucesso.",
        });
      } else {
        await addObservacaoVeiculo({
          veiculo_id: selectedVeiculo.id,
          data_observacao: formObs.data_observacao,
          observacao: formObs.observacao,
        });
        await fetchObservacoes(selectedVeiculo.id);
        toast({
          title: "Observação adicionada",
          description: "A observação foi adicionada com sucesso.",
        });
      }
      setModalObsOpen(false)
      setFormObs({data_observacao: '', observacao: ''})
      setEditObs(null)
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Ocorreu um erro ao salvar a observação.",
        variant: "destructive",
      });
    }
  }
  async function handleDeleteObs(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta observação?')) return;
    try {
      await deleteObservacaoVeiculo(id);
      await fetchObservacoes(selectedVeiculo!.id);
      toast({
        title: "Observação excluída",
        description: "A observação foi excluída com sucesso.",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err.message || "Ocorreu um erro ao excluir a observação.",
        variant: "destructive",
      });
    }
  }

  const isMobile = useIsMobile()

  // Função auxiliar para renderizar conteúdo dos slides
  function renderSlideContent(slideIndex: number) {
    if (slideIndex === 0) {
      return (
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
                className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>
          {pecasCompativeisFiltradas.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">Nenhuma peça compatível encontrada para este veículo.</div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {categorias.map((cat) => (
                <AccordionItem key={cat} value={cat}>
                  <AccordionTrigger className="text-sm">{cat}</AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border rounded-md overflow-hidden">
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )
    } else if (slideIndex === 1) {
      return (
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
                className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>
          {pecasUtilizadas.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">Nenhuma peça utilizada encontrada para este veículo.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border rounded-md overflow-hidden">
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
            </div>
          )}
        </div>
      )
    } else if (slideIndex === 2) {
      return (
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
                className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>
          {ordensServico.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">Nenhuma ordem de serviço encontrada para este veículo.</div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {ordensServicoFiltradas.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>
                    <div className="flex flex-col items-start gap-1 w-full text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">OS {item.numero}</span>
                        <Badge variant={item.status === "Ativo" ? "default" : "destructive"} className="text-xs">{item.status}</Badge>
                        <span className="text-xs">{item.prioridade}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.mecanicoInfo}</span>
                        <span>{item.data ? new Date(item.data).toLocaleDateString() : '-'}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <Tabs defaultValue="status" className="w-full">
                        <TabsList className="w-full mb-2">
                          <TabsTrigger value="status" className="flex-1 text-xs">Status</TabsTrigger>
                          <TabsTrigger value="detalhes" className="flex-1 text-xs">Detalhes</TabsTrigger>
                          <TabsTrigger value="historico" className="flex-1 text-xs">Histórico</TabsTrigger>
                        </TabsList>
                        <TabsContent value="status">
                          <div className="space-y-2 text-sm">
                            <div><b>Status:</b> {item.status}</div>
                            <div><b>Prioridade:</b> {item.prioridade}</div>
                            <div><b>Mecânico:</b> {item.mecanicoInfo}</div>
                            <div><b>Data:</b> {item.data ? new Date(item.data).toLocaleDateString() : '-'}</div>
                            <div><b>Veículo:</b> {item.veiculoInfo || '-'}</div>
                            <div><b>Solicitante:</b> {item.solicitanteInfo || '-'}</div>
                            <div><b>Km Atual:</b> {item.kmAtual ?? '-'}</div>
                            {item.observacoesAlmoxarifado && <div><b>Obs. Almoxarifado:</b> <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-xs mt-1">{item.observacoesAlmoxarifado}</div></div>}
                            {item.observacoesCompras && <div><b>Obs. Compras:</b> <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-xs mt-1">{item.observacoesCompras}</div></div>}
                            {item.observacoesRetorno && <div><b>Obs. Retorno:</b> <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-xs mt-1">{item.observacoesRetorno}</div></div>}
                          </div>
                        </TabsContent>
                        <TabsContent value="detalhes">
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1 text-sm"><b>Defeitos relatados:</b></div>
                              <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-xs">{item.defeitosRelatados || '-'}</div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1 text-sm"><b>Peças/Serviços:</b></div>
                              <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-xs">{item.pecasServicos || '-'}</div>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="historico">
                          {item.historico && item.historico.length > 0 ? (
                            <div className="space-y-2">
                              {item.historico.map((h: any, idx: number) => (
                                <div key={idx} className="bg-muted rounded p-2 text-xs">
                                  <div><b>Data:</b> {h.data ? new Date(h.data).toLocaleDateString() : '-'}</div>
                                  <div><b>De:</b> {h.de || '-'}</div>
                                  <div><b>Para:</b> {h.para || '-'}</div>
                                  <div><b>Observação:</b> {h.observacao || '-'}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-center py-4 text-sm">Nenhum histórico disponível para esta ordem.</div>
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
      )
    } else if (slideIndex === 3) {
      return (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 mb-4">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={searchTrocaOleo}
                onChange={e => setSearchTrocaOleo(e.target.value)}
                placeholder="Pesquisar..."
                className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={periodoTrocaOleo.inicio}
                onChange={e => setPeriodoTrocaOleo(p => ({...p, inicio: e.target.value}))}
                className="border rounded px-2 py-2 text-xs flex-1"
                title="Data inicial"
              />
              <span className="text-muted-foreground text-xs">até</span>
              <input
                type="date"
                value={periodoTrocaOleo.fim}
                onChange={e => setPeriodoTrocaOleo(p => ({...p, fim: e.target.value}))}
                className="border rounded px-2 py-2 text-xs flex-1"
                title="Data final"
              />
            </div>
          </div>
          {historicoTrocaOleo.filter((h) => h.tipo === 'Troca de Óleo').length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">Nenhum registro de troca de óleo encontrado para este veículo.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border rounded-md overflow-hidden">
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
            </div>
          )}
        </div>
      )
    } else if (slideIndex === 4) {
      return (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 mb-4">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={searchTrocaPneu}
                onChange={e => setSearchTrocaPneu(e.target.value)}
                placeholder="Pesquisar..."
                className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={periodoTrocaPneu.inicio}
                onChange={e => setPeriodoTrocaPneu(p => ({...p, inicio: e.target.value}))}
                className="border rounded px-2 py-2 text-xs flex-1"
                title="Data inicial"
              />
              <span className="text-muted-foreground text-xs">até</span>
              <input
                type="date"
                value={periodoTrocaPneu.fim}
                onChange={e => setPeriodoTrocaPneu(p => ({...p, fim: e.target.value}))}
                className="border rounded px-2 py-2 text-xs flex-1"
                title="Data final"
              />
            </div>
          </div>
          {historicoTrocaPneu.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">Nenhum registro de troca de pneu encontrado para este veículo.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border rounded-md overflow-hidden">
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
            </div>
          )}
        </div>
      )
    } else if (slideIndex === 5) {
      return (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 mb-4">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={searchAtualizacaoKm}
                onChange={e => setSearchAtualizacaoKm(e.target.value)}
                placeholder="Pesquisar..."
                className="pl-10 pr-3 py-2 rounded-md border border-input bg-background w-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={periodoAtualizacaoKm.inicio}
                onChange={e => setPeriodoAtualizacaoKm(p => ({...p, inicio: e.target.value}))}
                className="border rounded px-2 py-2 text-xs flex-1"
                title="Data inicial"
              />
              <span className="text-muted-foreground text-xs">até</span>
              <input
                type="date"
                value={periodoAtualizacaoKm.fim}
                onChange={e => setPeriodoAtualizacaoKm(p => ({...p, fim: e.target.value}))}
                className="border rounded px-2 py-2 text-xs flex-1"
                title="Data final"
              />
            </div>
          </div>
          {historicoTrocaOleo.filter((h: any) => h.tipo === 'Atualização de Km').length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">Nenhum registro de atualização de km encontrado para este veículo.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border rounded-md overflow-hidden">
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
            </div>
          )}
        </div>
      )
    } else if (slideIndex === 6) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className={cn("font-bold flex items-center gap-2", isMobile ? "text-base" : "text-xl")}>
                <Wrench className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
                Manutenções Antigas
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {manutAntigas.length} {manutAntigas.length === 1 ? 'manutenção cadastrada' : 'manutenções cadastradas'}
              </p>
            </div>
            <Button onClick={handleOpenAddManutAntiga} size={isMobile ? "sm" : "default"} className="flex items-center gap-2">
              <Plus className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} /> {isMobile ? "" : "Adicionar"}
            </Button>
          </div>
          {manutAntigas.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">Nenhuma manutenção antiga cadastrada.</div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {manutAntigas.map(m => (
                <AccordionItem key={m.id} value={m.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold", isMobile ? "text-sm" : "text-base")}>{m.titulo}{(m.data_servico || m.data) ? ` - ${new Date(m.data_servico || m.data).toLocaleDateString()}` : ''}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex justify-end gap-2 mb-2">
                      <button onClick={() => handleOpenEditManutAntiga(m)} className="p-1 rounded hover:bg-muted" title="Editar"><Pencil className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} /></button>
                      <button onClick={() => handleDeleteManutAntiga(m.id)} className="p-1 rounded hover:bg-muted text-destructive" title="Excluir"><Trash className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} /></button>
                    </div>
                    <Tabs defaultValue="info" className="w-full">
                      <TabsList className="w-full mb-2">
                        <TabsTrigger value="info" className="flex-1 text-xs">Informações</TabsTrigger>
                        <TabsTrigger value="pecas" className="flex-1 text-xs">Peças</TabsTrigger>
                      </TabsList>
                      <TabsContent value="info">
                        <div className="space-y-2 text-sm">
                          <div><b>Data do Serviço:</b> {(m.data_servico || m.data) ? new Date(m.data_servico || m.data).toLocaleDateString() : '-'}</div>
                          <div><b>Título:</b> {m.titulo}</div>
                          <div><b>Veículo:</b> {selectedVeiculo ? `${selectedVeiculo.placa || ''} ${selectedVeiculo.modelo || ''}` : '-'}</div>
                        </div>
                      </TabsContent>
                      <TabsContent value="pecas">
                        <div className="space-y-2">
                          <div className="text-sm"><b>Peças/Serviços:</b></div>
                          <div className="bg-muted rounded p-2 whitespace-pre-line break-words text-xs">{m.pecas}</div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )
    } else if (slideIndex === 7) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className={cn("font-bold flex items-center gap-2", isMobile ? "text-base" : "text-xl")}>
                <AlertCircle className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
                Observações
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {observacoes.length} {observacoes.length === 1 ? 'observação cadastrada' : 'observações cadastradas'}
              </p>
            </div>
            <Button onClick={handleOpenAddObs} size={isMobile ? "sm" : "default"} className="flex items-center gap-2">
              <Plus className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} /> {isMobile ? "" : "Adicionar"}
            </Button>
          </div>
          {observacoes.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 text-sm">Nenhuma observação cadastrada.</div>
          ) : (
            <div className="space-y-3">
              {observacoes.map(obs => (
                <Card key={obs.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-muted-foreground">
                        {obs.data_observacao ? new Date(obs.data_observacao).toLocaleDateString() : '-'}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenEditObs(obs)} className="p-1 rounded hover:bg-muted" title="Editar"><Pencil className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} /></button>
                        <button onClick={() => handleDeleteObs(obs.id)} className="p-1 rounded hover:bg-muted text-destructive" title="Excluir"><Trash className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} /></button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-line break-words">{obs.observacao}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Componente Mobile View
  function HistoricosMobileView() {
    return (
      <div className="p-2 space-y-3 max-w-full overflow-x-hidden">
        <div className="w-[96%] pl-3 pr-0 mb-2">
          <MobileBackButton />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar veículo, placa, secretaria..."
            className="pl-10"
          />
        </div>

        {filteredVeiculos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p>
              {search ? `Nenhum veículo encontrado para "${search}"` : "Nenhum veículo encontrado"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVeiculos.map((veiculo: any) => (
              <Card 
                key={veiculo.id} 
                className="border-l-4"
                style={{ borderLeftColor: getSecretariaColor(veiculo.secretaria) }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base">{veiculo.placa}</div>
                      <div className="text-xs text-muted-foreground">
                        {veiculo.marca} {veiculo.modelo}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {veiculo.ano && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {veiculo.ano}
                          </Badge>
                        )}
                        {veiculo.cor && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {veiculo.cor}
                          </Badge>
                        )}
                        {veiculo.secretaria && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {veiculo.secretaria}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge variant={veiculo.status === "Ativo" ? "default" : "destructive"} className="text-xs">
                        {veiculo.status}
                      </Badge>
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs px-3 py-1.5 h-8"
                        onClick={() => {
                          setSelectedVeiculo(veiculo)
                          setActiveSlide(0)
                          setModalOpen(true)
                        }}
                      >
                        <History className="h-3.5 w-3.5 mr-1.5" />
                        Histórico
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <React.Fragment>
      {isMobile ? (
        <HistoricosMobileView />
      ) : (
      <div className="space-y-6">
        <Card className="shadow-md-custom">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar veículo, placa, secretaria, cor, ano..."
                  className="pl-8 w-full"
                />
              </div>
            </div>
            
            <div className="rounded-md border shadow-sm-custom overflow-hidden">
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
                  {filteredVeiculos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground">
                            {search ? `Nenhum veículo encontrado para "${search}"` : "Nenhum veículo encontrado"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVeiculos.map((veiculo: any) => (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
      
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className={cn(
          "w-full max-h-[90vh] flex flex-col p-0 gap-0",
          isMobile ? "max-w-full h-[90vh]" : "max-w-6xl"
        )}>
          <DialogHeader className={cn(
            "border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
            isMobile ? "px-3 py-3" : "px-6 py-4"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={cn("bg-primary/10 rounded-lg flex-shrink-0", isMobile ? "p-1.5" : "p-2")}>
                  <History className={cn("text-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className={cn("font-bold", isMobile ? "text-base" : "text-xl")}>
                    Histórico do Veículo
                  </DialogTitle>
                  <p className={cn("text-muted-foreground mt-0.5 truncate", isMobile ? "text-xs" : "text-sm")}>
                    {selectedVeiculo?.placa} • {selectedVeiculo?.marca} {selectedVeiculo?.modelo}
                    {selectedVeiculo?.ano && ` • ${selectedVeiculo.ano}`}
                  </p>
                </div>
              </div>
              {isLoadingData && (
                <div className={cn("flex items-center gap-2 text-muted-foreground flex-shrink-0", isMobile ? "text-xs" : "text-sm")}>
                  <Loader2 className={cn("animate-spin", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                  {!isMobile && <span>Carregando...</span>}
                </div>
              )}
            </div>
          </DialogHeader>
          {isMobile ? (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <Tabs value={activeSlide.toString()} onValueChange={(v) => setActiveSlide(parseInt(v))} className="flex-1 flex flex-col min-h-0">
                <div className="border-b px-2 overflow-x-auto">
                  <TabsList className="w-full justify-start h-auto p-1">
                    {slides.map((slide, idx) => {
                      const Icon = slide.icon;
                      let count = 0;
                      if (idx === 0) count = pecasCompativeis.length;
                      else if (idx === 1) count = pecasUtilizadas.length;
                      else if (idx === 2) count = ordensServico.length;
                      else if (idx === 3) count = historicoTrocaOleo.filter(h => h.tipo === 'Troca de Óleo').length;
                      else if (idx === 4) count = historicoTrocaPneu.length;
                      else if (idx === 5) count = historicoTrocaOleo.filter((h: any) => h.tipo === 'Atualização de Km').length;
                      else if (idx === 6) count = manutAntigas.length;
                      else if (idx === 7) count = observacoes.length;
                      
                      return (
                        <TabsTrigger 
                          key={slide.key} 
                          value={idx.toString()}
                          className="text-xs px-2 py-1.5 flex items-center gap-1"
                        >
                          <Icon className="h-3 w-3" />
                          <span className="hidden sm:inline">{slide.label}</span>
                          {count > 0 && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                              {count}
                            </Badge>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {isLoadingData ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground text-sm">Carregando dados...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      {slides.map((slide, idx) => (
                        <TabsContent key={slide.key} value={idx.toString()} className="mt-0">
                          {renderSlideContent(idx)}
                        </TabsContent>
                      ))}
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          ) : (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col gap-2 overflow-y-auto">
              {slides.map((slide, idx) => {
                const Icon = slide.icon;
                let count = 0;
                if (idx === 0) count = pecasCompativeis.length;
                else if (idx === 1) count = pecasUtilizadas.length;
                else if (idx === 2) count = ordensServico.length;
                else if (idx === 3) count = historicoTrocaOleo.filter(h => h.tipo === 'Troca de Óleo').length;
                else if (idx === 4) count = historicoTrocaPneu.length;
                else if (idx === 5) count = historicoTrocaOleo.filter((h: any) => h.tipo === 'Atualização de Km').length;
                else if (idx === 6) count = manutAntigas.length;
                else if (idx === 7) count = observacoes.length;
                
                return (
                  <button
                    key={slide.key}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-150 flex items-center justify-between group ${
                      activeSlide === idx 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-background text-foreground hover:bg-primary/10 border border-transparent hover:border-primary/20'
                    }`}
                    onClick={() => setActiveSlide(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${activeSlide === idx ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                      <span>{slide.label}</span>
                    </div>
                    {count > 0 && (
                      <Badge variant={activeSlide === idx ? "secondary" : "outline"} className="ml-2">
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </aside>
            <section className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingData ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Carregando dados...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    {renderSlideContent(activeSlide)}
                  </div>
                )}
              </div>
            </section>
          </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogos de Manutenções Antigas e Observações - compartilhados entre mobile e desktop */}
      <UIDialog open={modalManutAntigaOpen} onOpenChange={setModalManutAntigaOpen}>
        <UIDialogContent className="max-w-md w-full">
          <UIDialogHeader>
            <UIDialogTitle>{editManutAntiga ? 'Editar' : 'Adicionar'} Manutenção Antiga</UIDialogTitle>
          </UIDialogHeader>
          <form onSubmit={e => {e.preventDefault(); handleSaveManutAntiga();}} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-servico">Data do Serviço</Label>
              <Input 
                id="data-servico"
                type="date" 
                value={formManutAntiga.data} 
                onChange={e => setFormManutAntiga(f => ({...f, data: e.target.value}))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input 
                id="titulo"
                type="text" 
                value={formManutAntiga.titulo} 
                onChange={e => setFormManutAntiga(f => ({...f, titulo: e.target.value}))} 
                required 
                placeholder="Ex: Troca de embreagem, revisão geral..." 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pecas">Peças/Serviços</Label>
              <Textarea 
                id="pecas"
                value={formManutAntiga.pecas} 
                onChange={e => setFormManutAntiga(f => ({...f, pecas: e.target.value}))} 
                required 
                placeholder="Descreva as peças e serviços realizados..." 
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalManutAntigaOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </UIDialogContent>
      </UIDialog>
      
      <UIDialog open={modalObsOpen} onOpenChange={setModalObsOpen}>
        <UIDialogContent className="max-w-md w-full">
          <UIDialogHeader>
            <UIDialogTitle>{editObs ? 'Editar' : 'Adicionar'} Observação</UIDialogTitle>
          </UIDialogHeader>
          <form onSubmit={e => {e.preventDefault(); handleSaveObs();}} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-obs">Data</Label>
              <Input 
                id="data-obs"
                type="date" 
                value={formObs.data_observacao} 
                onChange={e => setFormObs(f => ({...f, data_observacao: e.target.value}))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea 
                id="observacao"
                value={formObs.observacao} 
                onChange={e => setFormObs(f => ({...f, observacao: e.target.value}))} 
                required 
                placeholder="Descreva a observação..." 
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalObsOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </UIDialogContent>
      </UIDialog>
    </React.Fragment>
  )
}
