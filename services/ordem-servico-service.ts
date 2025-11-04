"use client"

import { supabase, debugSupabase } from "@/lib/supabase"

// Definição do tipo para eventos do histórico
export interface EventoHistorico {
  id: string
  data: string // Data e hora do evento
  tipo: string // Tipo de evento (ex: "Criação", "Mudança de Status", "Envio para Almoxarifado", etc.)
  de: string // Setor de origem
  para: string // Setor de destino
  status: string // Status da OS no momento do evento
  observacao: string // Observação deixada
  usuarioId?: string // ID do usuário que realizou a ação (para implementação futura)
  usuarioNome?: string // Nome do usuário que realizou a ação (para implementação futura)
}

// Atualizar a interface OrdemServico para incluir o campo kmAtual
export interface OrdemServico {
  id: string
  numero: string
  data: string
  veiculoId: string
  veiculoInfo: string
  solicitanteId: string
  solicitanteInfo: string
  mecanicoId: string
  mecanicoInfo: string
  prioridade: string
  status: string
  kmAtual: string // Novo campo
  defeitosRelatados: string
  pecasServicos: string
  observacoesAlmoxarifado?: string
  observacoesCompras?: string
  observacoesRetorno?: string
  observacao2?: string // Nova coluna para múltiplas observações
  historico: EventoHistorico[] // Novo campo para armazenar o histórico
  ordem_execucao?: number // Campo para controlar a ordem de execução no planejamento
  createdAt: string
  updatedAt: string
}

// Chave para armazenar os dados no localStorage
const STORAGE_KEY = "ordens_servico_data"

// Função para gerar um ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

// Função para gerar um número de OS
const generateNumeroOS = (ordens: OrdemServico[]): string => {
  const year = new Date().getFullYear().toString().substring(2)
  const count = ordens.length + 1
  return `OS-${year}${count.toString().padStart(4, "0")}`
}

// Função para obter todas as ordens de serviço
export const getOrdensServico = (): OrdemServico[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEY)
  const ordens = data ? JSON.parse(data) : []

  // Garantir que todas as ordens tenham o campo historico
  return ordens.map((ordem: OrdemServico) => ({
    ...ordem,
    historico: ordem.historico || [],
  }))
}

// Função para adicionar uma nova ordem de serviço
export const addOrdemServico = (
  ordem: Omit<OrdemServico, "id" | "numero" | "createdAt" | "updatedAt" | "historico">,
): OrdemServico => {
  const ordens = getOrdensServico()

  const now = new Date().toISOString()
  const newOrdem: OrdemServico = {
    ...ordem,
    id: generateId(),
    numero: generateNumeroOS(ordens),
    historico: [
      {
        id: generateId(),
        data: now,
        tipo: "Criação",
        de: "Sistema",
        para: "Oficina",
        status: ordem.status,
        observacao: "Ordem de serviço criada",
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  ordens.push(newOrdem)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens))

  return newOrdem
}

// Função para atualizar uma ordem de serviço existente
export const updateOrdemServico = (
  id: string,
  data: Partial<Omit<OrdemServico, "id" | "numero" | "createdAt" | "updatedAt" | "historico">>,
  observacao?: string,
): OrdemServico | null => {
  const ordens = getOrdensServico()
  const index = ordens.findIndex((o) => o.id === id)

  if (index === -1) return null

  const updatedOrdem = {
    ...ordens[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // Adicionar evento ao histórico apenas se houver mudança de status
  if (data.status && data.status !== ordens[index].status) {
    const novoEvento: EventoHistorico = {
      id: generateId(),
      data: new Date().toISOString(),
      tipo: "Mudança de Status",
      de: ordens[index].status,
      para: data.status,
      status: data.status,
      observacao: observacao || `Status alterado de "${ordens[index].status}" para "${data.status}"`,
    }

    updatedOrdem.historico = [...(updatedOrdem.historico || []), novoEvento]
  }

  ordens[index] = updatedOrdem
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens))

  return updatedOrdem
}

// Função para adicionar um evento ao histórico de uma OS
export const adicionarEventoHistorico = (
  ordemId: string,
  evento: Omit<EventoHistorico, "id" | "data">,
): OrdemServico | null => {
  const ordens = getOrdensServico()
  const index = ordens.findIndex((o) => o.id === ordemId)

  if (index === -1) return null

  const now = new Date().toISOString()
  const novoEvento: EventoHistorico = {
    ...evento,
    id: generateId(),
    data: now,
  }

  const updatedOrdem = {
    ...ordens[index],
    historico: [...(ordens[index].historico || []), novoEvento],
    updatedAt: now,
  }

  ordens[index] = updatedOrdem
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens))

  return updatedOrdem
}

// Função para enviar uma OS para o Almoxarifado
export const enviarParaAlmoxarifado = (id: string, observacoes: string): OrdemServico | null => {
  const ordens = getOrdensServico()
  const index = ordens.findIndex((o) => o.id === id)

  if (index === -1) return null

  const statusAnterior = ordens[index].status
  const novoStatus = "Em Análise"

  const updatedOrdem = {
    ...ordens[index],
    status: novoStatus,
    observacoesAlmoxarifado: observacoes,
    updatedAt: new Date().toISOString(),
  }

  // Adicionar evento ao histórico
  const novoEvento: EventoHistorico = {
    id: generateId(),
    data: new Date().toISOString(),
    tipo: "Envio para Almoxarifado",
    de: "Oficina",
    para: "Almoxarifado",
    status: novoStatus,
    observacao: observacoes,
  }

  updatedOrdem.historico = [...(updatedOrdem.historico || []), novoEvento]

  ordens[index] = updatedOrdem
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens))

  return updatedOrdem
}

// Função para enviar uma OS para Compras
export const enviarParaCompras = (id: string, observacoes: string): OrdemServico | null => {
  const ordens = getOrdensServico()
  const index = ordens.findIndex((o) => o.id === id)

  if (index === -1) return null

  const statusAnterior = ordens[index].status
  const novoStatus = "Em Aprovação"

  const updatedOrdem = {
    ...ordens[index],
    status: novoStatus,
    observacoesCompras: observacoes,
    updatedAt: new Date().toISOString(),
  }

  // Adicionar evento ao histórico
  const novoEvento: EventoHistorico = {
    id: generateId(),
    data: new Date().toISOString(),
    tipo: "Envio para Compras",
    de: "Almoxarifado",
    para: "Compras",
    status: novoStatus,
    observacao: observacoes,
  }

  updatedOrdem.historico = [...(updatedOrdem.historico || []), novoEvento]

  ordens[index] = updatedOrdem
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens))

  return updatedOrdem
}

// Função para retornar uma OS para a Oficina
export const retornarParaOficina = (
  id: string,
  observacoes: string,
  origem: "Almoxarifado" | "Compras",
  statusDestino = "Fila de Serviço",
): OrdemServico | null => {
  const ordens = getOrdensServico()
  const index = ordens.findIndex((o) => o.id === id)

  if (index === -1) return null

  const updatedOrdem = {
    ...ordens[index],
    status: statusDestino,
    observacoesRetorno: observacoes,
    updatedAt: new Date().toISOString(),
  }

  // Adicionar evento ao histórico
  const novoEvento: EventoHistorico = {
    id: generateId(),
    data: new Date().toISOString(),
    tipo: "Retorno para Oficina",
    de: origem,
    para: "Oficina",
    status: statusDestino,
    observacao: observacoes,
  }

  updatedOrdem.historico = [...(updatedOrdem.historico || []), novoEvento]

  ordens[index] = updatedOrdem
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens))

  return updatedOrdem
}

// Função para retornar uma OS do Compras para Almoxarifado
export const retornarParaAlmoxarifado = (id: string, observacoes: string, novoStatus: string): OrdemServico | null => {
  const ordens = getOrdensServico()
  const index = ordens.findIndex((o) => o.id === id)

  if (index === -1) return null

  const updatedOrdem = {
    ...ordens[index],
    status: novoStatus,
    updatedAt: new Date().toISOString(),
  }

  // Adicionar evento ao histórico
  const novoEvento: EventoHistorico = {
    id: generateId(),
    data: new Date().toISOString(),
    tipo: "Retorno para Almoxarifado",
    de: "Compras",
    para: "Almoxarifado",
    status: novoStatus,
    observacao: observacoes,
  }

  updatedOrdem.historico = [...(updatedOrdem.historico || []), novoEvento]

  ordens[index] = updatedOrdem
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens))

  return updatedOrdem
}

// Função para excluir uma ordem de serviço
export const deleteOrdemServico = (id: string): boolean => {
  const ordens = getOrdensServico()
  const filteredOrdens = ordens.filter((o) => o.id !== id)

  if (filteredOrdens.length === ordens.length) {
    return false // Nenhum item foi removido
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredOrdens))
  return true
}

// Função para obter uma ordem de serviço pelo ID
export const getOrdemServicoById = (id: string): OrdemServico | null => {
  const ordens = getOrdensServico()
  return ordens.find((o) => o.id === id) || null
}

// Função para filtrar ordens de serviço por status
export const getOrdensByStatus = (status: string | string[]): OrdemServico[] => {
  const ordens = getOrdensServico()

  if (Array.isArray(status)) {
    return ordens.filter((o) => status.includes(o.status))
  }

  return ordens.filter((o) => o.status === status)
}

// Função para pesquisar ordens de serviço
export const searchOrdensServico = (query: string): OrdemServico[] => {
  if (!query) return getOrdensServico()

  const ordens = getOrdensServico()
  const lowerQuery = query.toLowerCase()

  return ordens.filter(
    (o) =>
      o.numero.toLowerCase().includes(lowerQuery) ||
      o.veiculoInfo.toLowerCase().includes(lowerQuery) ||
      o.solicitanteInfo.toLowerCase().includes(lowerQuery) ||
      o.mecanicoInfo.toLowerCase().includes(lowerQuery) ||
      o.status.toLowerCase().includes(lowerQuery),
  )
}

// Funções assíncronas para Supabase
export async function getOrdensServicoSupabase(): Promise<OrdemServico[]> {
  const { data, error } = await supabase.from("ordens_servico").select("*").order("createdAt", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getOrdemServicoByIdSupabase(id: string): Promise<OrdemServico | null> {
  const { data, error } = await supabase.from("ordens_servico").select("*").eq("id", id).single()
  if (error) return null
  return data
}

export async function addOrdemServicoSupabase(ordem: Omit<OrdemServico, "id" | "numero" | "createdAt" | "updatedAt" | "historico">): Promise<OrdemServico> {
  const now = new Date().toISOString()
  // Buscar todas as ordens para gerar o número sequencial
  const todasOrdens = await getOrdensServicoSupabase()
  const numero = generateNumeroOS(todasOrdens)
  const id = crypto.randomUUID()
  const newOrdem: OrdemServico = {
    ...ordem,
    id,
    numero,
    historico: [
      {
        id: crypto.randomUUID(),
        data: now,
        tipo: "Criação",
        de: "Sistema",
        para: "Oficina",
        status: ordem.status,
        observacao: "Ordem de serviço criada",
      },
    ],
    data: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
    createdAt: now,
    updatedAt: now,
  }
  console.log("Objeto final enviado ao Supabase:", newOrdem)
  const { data, error } = await supabase.from("ordens_servico").insert([newOrdem]).select()
  if (error) {
    console.error("Erro detalhado do Supabase:", error)
    throw new Error(error.message || JSON.stringify(error))
  }
  
  return data[0]
}

export async function updateOrdemServicoSupabase(id: string, dataUpdate: Partial<Omit<OrdemServico, "id" | "numero" | "createdAt" | "updatedAt" | "historico">>, observacao?: string): Promise<OrdemServico | null> {
  // Buscar ordem atual
  const ordemAtual = await getOrdemServicoByIdSupabase(id)
  if (!ordemAtual) return null
  const now = new Date().toISOString()
  let historico = ordemAtual.historico || []
  // Se mudou o status, adiciona evento ao histórico
  if (dataUpdate.status && dataUpdate.status !== ordemAtual.status) {
    historico = [
      ...historico,
      {
        id: crypto.randomUUID(),
        data: now,
        tipo: "Mudança de Status",
        de: ordemAtual.status,
        para: dataUpdate.status,
        status: dataUpdate.status,
        observacao: observacao || `Status alterado de "${ordemAtual.status}" para "${dataUpdate.status}"`,
      },
    ]
  }
  
  try {
    const { data, error } = await supabase
      .from("ordens_servico")
      .update({ ...dataUpdate, historico, updatedAt: now })
      .eq("id", id)
      .select()
    
    if (error) {
      console.error("Erro ao atualizar ordem de serviço:", error)
      throw new Error(error.message || "Erro ao atualizar ordem de serviço")
    }
    
    if (!data || data.length === 0) {
      console.error("Nenhum dado retornado após atualização")
      // Buscar a ordem atualizada manualmente caso o Supabase não retorne
      return await getOrdemServicoByIdSupabase(id)
    }
    
    return data[0]
  } catch (error) {
    console.error("Exceção ao atualizar ordem de serviço:", error)
    throw error
  }
}

export async function deleteOrdemServicoSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("ordens_servico").delete().eq("id", id)
  if (error) throw error
  return true
}

// Funções assíncronas para envio e retorno de ordens usando Supabase

export async function enviarParaAlmoxarifadoSupabase(id: string, observacoes: string): Promise<OrdemServico | null> {
  const ordemAtual = await getOrdemServicoByIdSupabase(id)
  if (!ordemAtual) return null
  const now = new Date().toISOString()
  const novoStatus = "Em Análise"
  const novoEvento: EventoHistorico = {
    id: crypto.randomUUID(),
    data: now,
    tipo: "Envio para Almoxarifado",
    de: "Oficina",
    para: "Almoxarifado",
    status: novoStatus,
    observacao: observacoes,
  }
  const historico = [...(ordemAtual.historico || []), novoEvento]
  const { data, error } = await supabase
    .from("ordens_servico")
    .update({
      status: novoStatus,
      observacoesAlmoxarifado: observacoes,
      historico,
      updatedAt: now,
    })
    .eq("id", id)
    .select()
  if (error) throw error
  return data[0]
}

export async function enviarParaComprasSupabase(id: string, observacoes: string): Promise<OrdemServico | null> {
  const ordemAtual = await getOrdemServicoByIdSupabase(id)
  if (!ordemAtual) return null
  const now = new Date().toISOString()
  const novoStatus = "Em Aprovação"
  const novoEvento: EventoHistorico = {
    id: crypto.randomUUID(),
    data: now,
    tipo: "Envio para Compras",
    de: "Almoxarifado",
    para: "Compras",
    status: novoStatus,
    observacao: observacoes,
  }
  const historico = [...(ordemAtual.historico || []), novoEvento]
  const { data, error } = await supabase
    .from("ordens_servico")
    .update({
      status: novoStatus,
      observacoesCompras: observacoes,
      historico,
      updatedAt: now,
    })
    .eq("id", id)
    .select()
  if (error) throw error
  return data[0]
}

export async function retornarParaOficinaSupabase(
  id: string,
  observacoes: string,
  origem: "Almoxarifado" | "Compras",
  statusDestino = "Fila de Serviço"
): Promise<OrdemServico | null> {
  const ordemAtual = await getOrdemServicoByIdSupabase(id)
  if (!ordemAtual) return null
  const now = new Date().toISOString()
  const novoEvento: EventoHistorico = {
    id: crypto.randomUUID(),
    data: now,
    tipo: "Retorno para Oficina",
    de: origem,
    para: "Oficina",
    status: statusDestino,
    observacao: observacoes,
  }
  const historico = [...(ordemAtual.historico || []), novoEvento]
  const { data, error } = await supabase
    .from("ordens_servico")
    .update({
      status: statusDestino,
      observacoesRetorno: observacoes,
      historico,
      updatedAt: now,
    })
    .eq("id", id)
    .select()
  if (error) throw error
  return data[0]
}

export async function retornarParaAlmoxarifadoSupabase(
  id: string,
  observacoes: string,
  novoStatus: string
): Promise<OrdemServico | null> {
  const ordemAtual = await getOrdemServicoByIdSupabase(id)
  if (!ordemAtual) return null
  const now = new Date().toISOString()
  const novoEvento: EventoHistorico = {
    id: crypto.randomUUID(),
    data: now,
    tipo: "Retorno para Almoxarifado",
    de: "Compras",
    para: "Almoxarifado",
    status: novoStatus,
    observacao: observacoes,
  }
  const historico = [...(ordemAtual.historico || []), novoEvento]
  const { data, error } = await supabase
    .from("ordens_servico")
    .update({
      status: novoStatus,
      historico,
      updatedAt: now,
    })
    .eq("id", id)
    .select()
  if (error) throw error
  return data[0]
}

// Função para atualizar a ordem de execução de uma ordem de serviço
export async function atualizarOrdemExecucaoSupabase(ordemId: string, novaOrdem: number): Promise<boolean> {
  try {
    console.log(`Tentando atualizar ordem_execucao para ${ordemId} com valor: ${novaOrdem}`);
    
    // Verificar se a ordem existe antes de atualizar
    const { data: checkData, error: checkError } = await supabase
      .from('ordens_servico')
      .select('id')
      .eq('id', ordemId)
      .single();
      
    if (checkError) {
      console.error('Erro ao verificar existência da ordem:', checkError);
      return false;
    }
    
    if (!checkData) {
      console.error('Ordem não encontrada:', ordemId);
      return false;
    }
    
    // Usar a nova função de debug para atualizar
    const { data, error } = await debugSupabase.update(
      'ordens_servico', 
      { 
        ordem_execucao: novaOrdem,
        updatedAt: new Date().toISOString()
      }, 
      { id: ordemId }
    );

    if (error) {
      console.error('Erro ao atualizar ordem de execução:', error);
      console.error('Detalhes completos:', JSON.stringify(error));
      return false;
    }

    console.log(`Ordem de execução atualizada com sucesso para ${ordemId}: ${novaOrdem}`);
    return true;
  } catch (error) {
    console.error('Exceção ao atualizar ordem de execução:', error);
    return false;
  }
}

// Função para obter ordens de serviço agrupadas por mecânico
export async function getOrdensAgrupadasPorMecanicoSupabase(): Promise<{id: string, nome: string, ordens: OrdemServico[]}[]> {
  try {
    // Verificar se conseguimos conectar ao Supabase
    const { data: tableInfo, error: tableError } = await supabase
      .from('ordens_servico')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Erro ao verificar tabela de ordens de serviço:', tableError);
      return [];
    }
    
    // Buscar todas as ordens de serviço sem filtrar por status
    let ordens: any[] = [];
    
    try {
      // Buscar todos os registros, sem filtrar por status
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .order('ordem_execucao', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar ordens de serviço:', error);
        return [];
      }
      
      if (!data || !Array.isArray(data)) {
        console.warn('Dados de ordens inválidos ou vazios:', data);
        return [];
      }
      
      // Usar todas as ordens, sem filtrar por status
      ordens = data;
      console.log('Ordens encontradas (todas):', ordens.length);
    } catch (queryError) {
      console.error('Erro na consulta de ordens:', queryError);
      return [];
    }

    // Agrupamos por mecânico
    const mecanicosMap = new Map<string, {id: string, nome: string, ordens: OrdemServico[]}>();
    
    ordens.forEach((ordem: any) => {
      try {
        // Verificar se ordem tem os campos necessários
        if (!ordem.mecanicoId || !ordem.mecanicoInfo) {
          console.warn('Ordem sem mecânico associado:', ordem.id);
          return; // Pular esta ordem
        }

        const mecanicoId = ordem.mecanicoId;
        let mecanicoNome = 'Mecânico';
        
        // Extrair o nome do mecânico da string mecanicoInfo com tratamento de erros
        try {
          if (ordem.mecanicoInfo && typeof ordem.mecanicoInfo === 'string') {
            // Tenta extrair o nome do formato "Nome (ID)"
            const match = ordem.mecanicoInfo.match(/(.*?)\s*\([^)]*\)*/);
            mecanicoNome = match ? match[1].trim() : ordem.mecanicoInfo;
          }
        } catch (e) {
          console.warn('Erro ao extrair nome do mecânico:', e);
        }
        
        if (!mecanicosMap.has(mecanicoId)) {
          mecanicosMap.set(mecanicoId, {
            id: mecanicoId,
            nome: mecanicoNome,
            ordens: []
          });
        }
        
        mecanicosMap.get(mecanicoId)?.ordens.push(ordem);
      } catch (ordenError) {
        console.error('Erro ao processar ordem:', ordenError, ordem);
      }
    });
    
    // Se não tiver nenhum mecânico com ordens, adicionar pelo menos um placeholder
    if (mecanicosMap.size === 0) {
      mecanicosMap.set('sem-mecanico', {
        id: 'sem-mecanico',
        nome: 'Sem Mecânico',
        ordens: []
      });
    }
    
    // Convertemos o Map para um array e ordenamos os mecânicos por nome
    return Array.from(mecanicosMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Exceção ao buscar ordens agrupadas por mecânico:', errorMessage);
    // Retornar um array vazio em caso de erro para evitar quebra da interface
    return [];
  }
}

// Função para atualizar o mecânico de uma ordem de serviço
export async function alterarMecanicoOrdemSupabase(
  ordemId: string, 
  novoMecanicoId: string, 
  novoMecanicoInfo: string
): Promise<boolean> {
  try {
    console.log(`Tentando alterar mecânico da ordem ${ordemId} para: ${novoMecanicoId} (${novoMecanicoInfo})`);
    
    // Verificar se a ordem existe antes de atualizar
    const { data: checkData, error: checkError } = await supabase
      .from('ordens_servico')
      .select('id')
      .eq('id', ordemId)
      .single();
      
    if (checkError) {
      console.error('Erro ao verificar existência da ordem:', checkError);
      return false;
    }
    
    if (!checkData) {
      console.error('Ordem não encontrada:', ordemId);
      return false;
    }
    
    // Atualiza o mecânico da ordem usando debugSupabase
    const { data, error } = await debugSupabase.update(
      'ordens_servico',
      { 
        mecanicoId: novoMecanicoId,
        mecanicoInfo: novoMecanicoInfo,
        updatedAt: new Date().toISOString()
      },
      { id: ordemId }
    );

    if (error) {
      console.error('Erro ao alterar mecânico da ordem:', error);
      console.error('Detalhes completos:', JSON.stringify(error));
      return false;
    }

    // Adiciona um evento ao histórico
    try {
      const now = new Date().toISOString();
      const { data: historico, error: historicoError } = await supabase
        .from('ordem_servico_historico')
        .insert({
          ordem_id: ordemId,
          data: now,
          tipo: 'Alteração de Mecânico',
          de: '',
          para: '',
          status: '',
          observacao: `Mecânico alterado para ${novoMecanicoInfo}`,
        });

      if (historicoError) {
        console.error('Erro ao registrar histórico de alteração de mecânico:', historicoError);
        // Não falha a operação principal se o histórico falhar
      }
    } catch (historicoExcecao) {
      console.error('Exceção ao registrar histórico:', historicoExcecao);
      // Não falha a operação principal se o histórico falhar
    }

    console.log(`Mecânico da ordem ${ordemId} alterado com sucesso para ${novoMecanicoId}`);
    return true;
  } catch (error) {
    console.error('Exceção ao alterar mecânico da ordem:', error);
    return false;
  }
}

// Função para adicionar um evento ao histórico de uma ordem de serviço no Supabase
export async function adicionarEventoHistoricoSupabase(
  ordemId: string,
  evento: Omit<EventoHistorico, "id" | "data">
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Inserir o evento na tabela de histórico
    const { error } = await supabase
      .from('ordem_servico_historico')
      .insert({
        ordem_id: ordemId,
        data: now,
        tipo: evento.tipo,
        de: evento.de,
        para: evento.para,
        status: evento.status,
        observacao: evento.observacao,
      });

    if (error) {
      console.error('Erro ao adicionar evento ao histórico:', JSON.stringify(error));
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Exceção ao adicionar evento ao histórico:', errorMessage);
    return false;
  }
}

// Função para adicionar uma observação a uma ordem de serviço
export async function adicionarObservacaoSupabase(ordemId: string, observacao: string, setor: string): Promise<boolean> {
  try {
    console.log(`Adicionando observação à ordem ${ordemId}`);
    
    // Buscar a ordem atual para obter observações anteriores
    const ordemAtual = await getOrdemServicoByIdSupabase(ordemId);
    if (!ordemAtual) {
      console.error('Ordem não encontrada:', ordemId);
      return false;
    }

    const now = new Date().toISOString();
    const dataFormatada = new Date().toLocaleString('pt-BR'); // Formato legível para exibição
    
    // Preparar a nova observação com data e hora
    const novaObservacao = `[${dataFormatada} - ${setor}] ${observacao}`;
    
    // Adicionar à observação existente ou criar nova
    const observacaoAtualizada = ordemAtual.observacao2 
      ? `${ordemAtual.observacao2}\n\n${novaObservacao}`
      : novaObservacao;
    
    // Atualizar a ordem com a nova observação - SEM tentar adicionar ao histórico
    const { error } = await supabase
      .from('ordens_servico')
      .update({ 
        observacao2: observacaoAtualizada,
        updatedAt: now
      })
      .eq('id', ordemId);

    if (error) {
      console.error('Erro ao adicionar observação:', JSON.stringify(error));
      return false;
    }
    
    // A observação foi adicionada com sucesso
    console.log('Observação adicionada com sucesso');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Erro ao adicionar observação:', errorMessage);
    return false;
  }
}

// Função para assinar em tempo real as atualizações e inserções na tabela ordens_servico
export function subscribeToOrdensServico(
  onInsert: (ordem: OrdemServico) => void,
  onUpdate: (ordem: OrdemServico) => void
) {
  console.log('Iniciando subscrição em tempo real da tabela ordens_servico')
  
  // Variáveis para controle de reconexão
  let tentativasReconexao = 0;
  const maxTentativas = 15; // Aumentado de 5 para 15
  let intervalReconexao: any = null;
  let canalAtivo: any = null;
  let conectado = false;
  
  // Função para criar e configurar o canal
  const configurarCanal = () => {
    try {
      // Limpar canal anterior se existir
      if (canalAtivo) {
        try {
          supabase.removeChannel(canalAtivo);
          canalAtivo = null;
        } catch (e) {
          console.log('Erro ao remover canal anterior:', e);
        }
      }
      
      // Gerar um ID único para este canal
      const canalId = 'ordens_servico_changes_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 9);
      console.log(`Criando novo canal com ID: ${canalId}`);
      
      // Criar um novo canal
      const channel = supabase
        .channel(canalId)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ordens_servico' },
          (payload) => {
            try {
              console.log('EVENTO REALTIME: Nova ordem de serviço criada:', payload.new);
              
              // Processar ordem para garantir que todos os campos estejam presentes
              const ordem = payload.new as OrdemServico;
              // Se a ordem não tiver histórico, adicionar um array vazio
              if (!ordem.historico) ordem.historico = [];
              
              onInsert(ordem);
            } catch (error) {
              // Tratar erro silenciosamente para não quebrar a aplicação
              console.log('Erro ao processar nova ordem:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'ordens_servico' },
          (payload) => {
            try {
              console.log('EVENTO REALTIME: Ordem de serviço atualizada:', payload.new);
              
              // Processar ordem para garantir que todos os campos estejam presentes
              const ordem = payload.new as OrdemServico;
              // Se a ordem não tiver histórico, adicionar um array vazio
              if (!ordem.historico) ordem.historico = [];
              
              onUpdate(ordem);
            } catch (error) {
              // Tratar erro silenciosamente para não quebrar a aplicação
              console.log('Erro ao processar ordem atualizada:', error);
            }
          }
        );

      // Iniciar a subscrição com tratamento de status
      const subscription = channel.subscribe((status) => {
        try {
          console.log(`Supabase realtime status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log('Subscrição à tabela ordens_servico ativa!');
            // Resetar contadores de reconexão em caso de sucesso
            tentativasReconexao = 0;
            conectado = true;
            
            // Limpar intervalo de reconexão se existir
            if (intervalReconexao) {
              clearInterval(intervalReconexao);
              intervalReconexao = null;
            }
            
            // Armazenar referência ao canal ativo
            canalAtivo = channel;
            
            // Notificar que a conexão foi restaurada (se anteriormente tinha falhado)
            try {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('realtime-connection-restored'));
              }
            } catch (e) {
              // Silenciosamente ignorar erros de eventos
              console.log('Erro ao disparar evento de restauração de conexão:', e);
            }
          } 
          else if (status === 'CHANNEL_ERROR') {
            console.warn('Erro na subscrição realtime do Supabase - tentando reconectar');
            conectado = false;
            tentarReconectar();
          }
          else if (status === 'CLOSED') {
            console.log('Conexão realtime fechada - tentando reconectar');
            conectado = false;
            tentarReconectar();
          }
          else if (status === 'TIMED_OUT') {
            console.log('Conexão realtime expirou - tentando reconectar');
            conectado = false;
            tentarReconectar();
          }
          else if (status === 'CHANNEL_TIMEOUT') {
            console.log('Timeout no canal realtime - tentando reconectar');
            conectado = false;
            tentarReconectar();
          }
        } catch (error) {
          // Tratar qualquer erro no callback para evitar erros não tratados
          console.log('Erro no callback de subscrição realtime:', error);
          conectado = false;
          tentarReconectar();
        }
      });
      
      return channel;
    } catch (error) {
      // Log sem gerar erro não tratado
      console.warn('Exceção ao configurar subscrição realtime:', error);
      conectado = false;
      tentarReconectar();
      return null;
    }
  };
  
  // Função centralizada para tentar reconexão com backoff exponencial
  const tentarReconectar = () => {
    // Evitar múltiplas tentativas simultâneas
    if (intervalReconexao) {
      return;
    }
    
    // Tentar reconectar se ainda não atingiu o limite de tentativas
    if (tentativasReconexao < maxTentativas) {
      tentativasReconexao++;
      console.log(`Tentando reconectar (${tentativasReconexao}/${maxTentativas})...`);
      
      // Programar tentativa de reconexão após um intervalo (com backoff exponencial)
      const tempoEspera = Math.min(60000, 1000 * Math.pow(1.5, tentativasReconexao));
      console.log(`Próxima tentativa em ${Math.round(tempoEspera/1000)} segundos`);
      
      // Mostrar mensagem para o usuário
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('realtime-reconnecting', { 
            detail: { 
              tentativa: tentativasReconexao, 
              maximo: maxTentativas,
              tempoEspera: Math.round(tempoEspera/1000)
            } 
          }));
        }
      } catch (e) {
          console.log('Erro ao disparar evento de reconexão:', e);
      }
      
      setTimeout(() => {
        console.log('Executando reconexão agendada...');
        try {
          // Remover canal com erro
          if (canalAtivo) {
            try {
              supabase.removeChannel(canalAtivo);
              canalAtivo = null;
            } catch (e) {
              console.log('Erro ao remover canal com erro:', e);
            }
          }
          
          // Criar novo canal
          canalAtivo = configurarCanal();
          
          // Limpar o intervalo de reconexão
          if (intervalReconexao) {
            clearTimeout(intervalReconexao);
            intervalReconexao = null;
          }
        } catch (e) {
          console.warn('Erro na tentativa de reconexão:', e);
          // Se falhar, limpar o intervalo para permitir novas tentativas
          intervalReconexao = null;
        }
      }, tempoEspera);
      
      // Salvar referência para poder cancelar
      intervalReconexao = setTimeout(() => {}, tempoEspera);
    }
    else if (tentativasReconexao >= maxTentativas) {
      console.warn(`Máximo de ${maxTentativas} tentativas de reconexão atingido. Desistindo.`);
      // Notificar o usuário que o sistema pode não estar recebendo atualizações em tempo real
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('realtime-connection-failed'));
        }
      } catch (e) {
        console.log('Erro ao disparar evento de falha de conexão:', e);
      }
      
      // Limpar intervalo e definir conectado como false
      if (intervalReconexao) {
        clearTimeout(intervalReconexao);
        intervalReconexao = null;
      }
      conectado = false;
    }
  };
  
  // Iniciar o canal
  canalAtivo = configurarCanal();
  
  // Configurar verificação periódica de conexão
  const intervalVerificacao = setInterval(() => {
    if (!canalAtivo && !intervalReconexao) {
      console.log('Canal não encontrado. Tentando criar novo canal...');
      tentativasReconexao = 0; // Resetar tentativas para uma verificação programada
      canalAtivo = configurarCanal();
    }
  }, 60000); // Verificar a cada minuto
  
  // Ouvir evento de offline/online para reagir a mudanças de conectividade
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('Aplicação voltou a ficar online. Tentando reconectar Supabase realtime...');
      if (!conectado && !intervalReconexao) {
        tentativasReconexao = 0; // Resetar contadores na mudança de conectividade
        tentarReconectar();
      }
    });
  }
  
  // Retornar uma função para cancelar a assinatura
  return () => {
    console.log('Cancelando subscrição em tempo real');
    
    // Limpar intervalos
    if (intervalReconexao) {
      clearTimeout(intervalReconexao);
      intervalReconexao = null;
    }
    
    if (intervalVerificacao) {
      clearInterval(intervalVerificacao);
    }
    
    // Remover canal
    if (canalAtivo) {
      try {
        supabase.removeChannel(canalAtivo);
        canalAtivo = null;
      } catch (e) {
        console.log('Erro ao remover canal na limpeza:', e);
      }
    }
    
    // Remover listeners de eventos
    if (typeof window !== 'undefined') {
      try {
        window.removeEventListener('online', () => {});
      } catch (e) {
        // Ignorar erros ao remover listeners
      }
    }
  };
}
