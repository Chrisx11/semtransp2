"use client"

import { supabase } from "@/lib/supabase"

// Definição do tipo de dados para Veículo
export interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  ano: number
  cor: string
  tipo: string
  chassi: string
  renavam: string
  combustivel: string
  medicao: "Horimetro" | "Hodometro"
  periodoTrocaOleo: number
  status: "Ativo" | "Inativo"
  secretaria: string
  createdAt: string
  updatedAt: string
  kmAtual: number
  kmProxTroca: number
}

// Definição do tipo de dados para Histórico de Troca de Óleo
export interface HistoricoTrocaOleo {
  id: string
  veiculoId: string
  data: string // ISO string
  tipo: string // "Troca de Óleo" ou "Atualização de Km"
  kmAnterior?: number
  kmAtual: number
  kmProxTroca?: number
  observacao?: string
  createdAt: string
  updatedAt: string
}

// Chave para armazenar os dados no localStorage
const STORAGE_KEY = "veiculos_data"

// Função para gerar um ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

// Função para obter todos os veículos
export const getVeiculos = (): Veiculo[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// Função para adicionar um novo veículo
export const addVeiculo = (veiculo: Omit<Veiculo, "id" | "createdAt" | "updatedAt">): Veiculo => {
  const veiculos = getVeiculos()

  const now = new Date().toISOString()
  const newVeiculo: Veiculo = {
    ...veiculo,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  veiculos.push(newVeiculo)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(veiculos))

  return newVeiculo
}

// Função para atualizar um veículo existente
export const updateVeiculo = (
  id: string,
  data: Partial<Omit<Veiculo, "id" | "createdAt" | "updatedAt">>,
): Veiculo | null => {
  const veiculos = getVeiculos()
  const index = veiculos.findIndex((v) => v.id === id)

  if (index === -1) return null

  const updatedVeiculo = {
    ...veiculos[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  veiculos[index] = updatedVeiculo
  localStorage.setItem(STORAGE_KEY, JSON.stringify(veiculos))

  return updatedVeiculo
}

// Função para excluir um veículo
export const deleteVeiculo = (id: string): boolean => {
  const veiculos = getVeiculos()
  const filteredVeiculos = veiculos.filter((v) => v.id !== id)

  if (filteredVeiculos.length === veiculos.length) {
    return false // Nenhum item foi removido
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredVeiculos))
  return true
}

// Função para obter um veículo pelo ID
export const getVeiculoById = (id: string): Veiculo | null => {
  const veiculos = getVeiculos()
  return veiculos.find((v) => v.id === id) || null
}

// Função para pesquisar veículos
export const searchVeiculos = (query: string): Veiculo[] => {
  if (!query) return getVeiculos()

  const veiculos = getVeiculos()
  const lowerQuery = query.toLowerCase()

  return veiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(lowerQuery) ||
      v.modelo.toLowerCase().includes(lowerQuery) ||
      v.marca.toLowerCase().includes(lowerQuery) ||
      v.tipo.toLowerCase().includes(lowerQuery) ||
      v.secretaria.toLowerCase().includes(lowerQuery) ||
      v.ano.toString().includes(lowerQuery),
  )
}

// Função para obter todos os veículos do Supabase
export async function getVeiculosSupabase(): Promise<Veiculo[]> {
  const { data, error } = await supabase.from("veiculos").select("*").order("placa")
  if (error) throw error
  
  // Buscar o último registro de troca de óleo para cada veículo para obter o km_atual mais recente
  let kmAtualPorVeiculo: Record<string, number | null> = {}
  
  try {
    const { data: trocasOleoData, error: trocasOleoError } = await supabase
      .from("trocas_oleo")
      .select("veiculo_id, km_atual, data_troca")
      .order("data_troca", { ascending: false })
    
    if (!trocasOleoError && trocasOleoData) {
      // Agrupar por veiculo_id e pegar o primeiro (mais recente) de cada
      trocasOleoData.forEach((troca: any) => {
        const veiculoId = troca.veiculo_id
        if (!kmAtualPorVeiculo.hasOwnProperty(veiculoId)) {
          const kmAtual = troca.km_atual
          if (kmAtual !== null && kmAtual !== undefined) {
            const kmNum = typeof kmAtual === 'string' ? Number(kmAtual) : Number(kmAtual)
            kmAtualPorVeiculo[veiculoId] = isNaN(kmNum) ? null : kmNum
          } else {
            kmAtualPorVeiculo[veiculoId] = null
          }
        }
      })
    }
  } catch (trocasOleoError) {
    console.warn("Erro ao buscar trocas de óleo para KM atual:", trocasOleoError)
  }
  
  // Normalizar os dados para garantir que kmAtual seja sempre um número
  return (data || []).map((veiculo: any) => {
    const veiculoId = veiculo.id
    // Usar km_atual da tabela trocas_oleo (último registro) se disponível, senão usar da tabela veiculos
    const kmAtualFinal = kmAtualPorVeiculo[veiculoId] ?? veiculo.kmAtual ?? veiculo.km_atual ?? 0
    
    return {
      ...veiculo,
      // Usar o kmAtual mais recente da tabela trocas_oleo ou da tabela veiculos
      kmAtual: typeof kmAtualFinal === 'string' ? Number(kmAtualFinal) || 0 : (Number(kmAtualFinal) || 0),
      // Garantir que kmProxTroca seja um número
      kmProxTroca: typeof (veiculo.kmProxTroca ?? veiculo.km_prox_troca) === 'string' 
        ? Number(veiculo.kmProxTroca ?? veiculo.km_prox_troca) || 0 
        : (Number(veiculo.kmProxTroca ?? veiculo.km_prox_troca) || 0),
      // Garantir que periodoTrocaOleo seja um número
      periodoTrocaOleo: typeof (veiculo.periodoTrocaOleo ?? veiculo.periodo_troca_oleo ?? veiculo.periodotrocaoleo) === 'string'
        ? Number(veiculo.periodoTrocaOleo ?? veiculo.periodo_troca_oleo ?? veiculo.periodotrocaoleo) || 0
        : (Number(veiculo.periodoTrocaOleo ?? veiculo.periodo_troca_oleo ?? veiculo.periodotrocaoleo) || 0),
    }
  })
}

// Função para obter um veículo por ID do Supabase
export async function getVeiculoByIdSupabase(id: string): Promise<Veiculo | null> {
  const { data, error } = await supabase.from("veiculos").select("*").eq("id", id).single()
  if (error) return null
  if (!data) return null
  
  // Buscar o último registro de troca de óleo para obter o km_atual mais recente
  let kmAtualMaisRecente: number | null = null
  
  try {
    const { data: ultimoRegistro, error: trocasOleoError } = await supabase
      .from("trocas_oleo")
      .select("km_atual, data_troca")
      .eq("veiculo_id", id)
      .order("data_troca", { ascending: false })
      .limit(1)
      .single()
    
    if (!trocasOleoError && ultimoRegistro && ultimoRegistro.km_atual !== null && ultimoRegistro.km_atual !== undefined) {
      const kmNum = typeof ultimoRegistro.km_atual === 'string' ? Number(ultimoRegistro.km_atual) : Number(ultimoRegistro.km_atual)
      if (!isNaN(kmNum)) {
        kmAtualMaisRecente = kmNum
      }
    }
  } catch (trocasOleoError) {
    // Ignorar erro se não houver registros
    console.warn("Erro ao buscar último registro de troca de óleo:", trocasOleoError)
  }
  
  // Normalizar os dados para garantir que kmAtual seja sempre um número
  // Usar km_atual da tabela trocas_oleo (último registro) se disponível, senão usar da tabela veiculos
  const kmAtualFinal = kmAtualMaisRecente ?? data.kmAtual ?? data.km_atual ?? 0
  
  const veiculo: any = {
    ...data,
    // Usar o kmAtual mais recente da tabela trocas_oleo ou da tabela veiculos
    kmAtual: typeof kmAtualFinal === 'string' ? Number(kmAtualFinal) || 0 : (Number(kmAtualFinal) || 0),
    // Garantir que kmProxTroca seja um número
    kmProxTroca: typeof (data.kmProxTroca ?? data.km_prox_troca) === 'string'
      ? Number(data.kmProxTroca ?? data.km_prox_troca) || 0
      : (Number(data.kmProxTroca ?? data.km_prox_troca) || 0),
    // Garantir que periodoTrocaOleo seja um número
    periodoTrocaOleo: typeof (data.periodoTrocaOleo ?? data.periodo_troca_oleo ?? data.periodotrocaoleo) === 'string'
      ? Number(data.periodoTrocaOleo ?? data.periodo_troca_oleo ?? data.periodotrocaoleo) || 0
      : (Number(data.periodoTrocaOleo ?? data.periodo_troca_oleo ?? data.periodotrocaoleo) || 0),
  }
  
  return veiculo
}

// Função para adicionar um novo veículo no Supabase
export async function addVeiculoSupabase(veiculo: Omit<Veiculo, "id" | "createdAt" | "updatedAt">): Promise<Veiculo> {
  const now = new Date().toISOString()
  const newVeiculo = {
    ...veiculo,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  const { data, error } = await supabase.from("veiculos").insert([newVeiculo]).select()
  if (error) throw error
  return data[0]
}

// Função para atualizar um veículo existente no Supabase
export async function updateVeiculoSupabase(id: string, dataUpdate: Partial<Omit<Veiculo, "id" | "createdAt" | "updatedAt">>): Promise<Veiculo | null> {
  const { data, error } = await supabase.from("veiculos").update({ ...dataUpdate, updatedAt: new Date().toISOString() }).eq("id", id).select()
  if (error) throw error
  return data[0]
}

// Função auxiliar para excluir registros relacionados antes de remover o veículo
function isErroTabelaInexistente(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  const msg = (error.message || "").toLowerCase()
  return (
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  )
}

async function excluirRegistrosRelacionadosVeiculo(id: string): Promise<void> {
  const excluirPorColuna = async (tabela: string, coluna: string) => {
    const { error } = await supabase.from(tabela).delete().eq(coluna, id)
    if (error && !isErroTabelaInexistente(error)) {
      throw new Error(`Erro ao limpar ${tabela}: ${error.message}`)
    }
  }

  const anularColuna = async (tabela: string, coluna: string) => {
    const { error } = await supabase.from(tabela).update({ [coluna]: null }).eq(coluna, id)
    if (error && !isErroTabelaInexistente(error)) {
      throw new Error(`Erro ao atualizar ${tabela}: ${error.message}`)
    }
  }

  // Histórico das ordens de serviço vinculadas ao veículo
  const { data: ordens, error: ordensError } = await supabase
    .from("ordens_servico")
    .select("id")
    .eq("veiculoId", id)

  if (ordensError && !isErroTabelaInexistente(ordensError)) {
    throw new Error(`Erro ao buscar ordens de serviço: ${ordensError.message}`)
  }

  const ordemIds = (ordens || []).map((o) => o.id)
  if (ordemIds.length > 0) {
    const { error: historicoOsError } = await supabase
      .from("ordem_servico_historico")
      .delete()
      .in("ordem_id", ordemIds)

    if (historicoOsError && !isErroTabelaInexistente(historicoOsError)) {
      throw new Error(`Erro ao limpar histórico de OS: ${historicoOsError.message}`)
    }
  }

  // Registros vinculados diretamente ao veículo (ignora tabelas que não existem no banco)
  const tabelasParaExcluir = [
    { tabela: "servicos_externos", coluna: "veiculo_id" },
    { tabela: "ordens_servico", coluna: "veiculoId" },
    { tabela: "trocas_pneu", coluna: "veiculo_id" },
    { tabela: "trocas_oleo", coluna: "veiculo_id" },
    { tabela: "historico_troca_oleo", coluna: "veiculoid" },
    { tabela: "observacoes_veiculo", coluna: "veiculo_id" },
    { tabela: "manutencoes_antigas", coluna: "veiculo_id" },
    { tabela: "filtros_registrados", coluna: "veiculoid" },
    { tabela: "autorizacoes_borracharia", coluna: "veiculo_id" },
    { tabela: "autorizacoes_lavador", coluna: "veiculo_id" },
    { tabela: "vistorias_tacografo", coluna: "veiculo_id" },
    { tabela: "saidas", coluna: "veiculoId" },
    { tabela: "historicos", coluna: "veiculo_id" },
  ] as const

  for (const { tabela, coluna } of tabelasParaExcluir) {
    await excluirPorColuna(tabela, coluna)
  }

  // Manter notas e despesas, apenas desvinculando o veículo
  await anularColuna("notas", "veiculo_id")
  await anularColuna("despesas_notas", "veiculo_id")

  // Remover o veículo dos produtos compatíveis
  const { data: produtos, error: produtosError } = await supabase
    .from("produtos")
    .select("id, veiculosCompativeis")
    .contains("veiculosCompativeis", [id])

  if (produtosError && !isErroTabelaInexistente(produtosError)) {
    throw new Error(`Erro ao buscar produtos compatíveis: ${produtosError.message}`)
  }

  for (const produto of produtos || []) {
    const veiculosCompativeis = (produto.veiculosCompativeis || []).filter(
      (veiculoId: string) => veiculoId !== id
    )
    const { error } = await supabase
      .from("produtos")
      .update({ veiculosCompativeis })
      .eq("id", produto.id)

    if (error) throw new Error(`Erro ao atualizar produto ${produto.id}: ${error.message}`)
  }
}

// Função para excluir um veículo do Supabase
export async function deleteVeiculoSupabase(id: string): Promise<boolean> {
  await excluirRegistrosRelacionadosVeiculo(id)

  const { error } = await supabase.from("veiculos").delete().eq("id", id)
  if (error) throw error
  return true
}

// --- SUPABASE: Histórico de Troca de Óleo ---

// Buscar histórico de troca de óleo de um veículo
export async function getHistoricoTrocaOleoSupabase(veiculoId: string): Promise<HistoricoTrocaOleo[]> {
  const { data, error } = await supabase
    .from("historico_troca_oleo")
    .select("*")
    .eq("veiculoid", veiculoId)
    .order("data", { ascending: false })
  if (error) throw error
  
  console.log("Dados brutos do histórico:", data);
  
  // Mapear os campos do formato do banco para o formato da interface
  const mappedData = (data || []).map(item => ({
    id: item.id,
    veiculoId: item.veiculoid,
    data: item.data,
    tipo: item.tipo,
    kmAnterior: item.kmanterior,
    kmAtual: item.kmatual,
    kmProxTroca: item.kmproxtroca,
    observacao: item.observacao,
    createdAt: item.createdat,
    updatedAt: item.updatedat
  }));
  
  console.log("Dados mapeados do histórico:", mappedData);
  
  return mappedData;
}

// Adicionar novo registro de histórico
export async function addHistoricoTrocaOleoSupabase(item: any): Promise<any> {
  const now = new Date().toISOString();
  const newItem = {
    ...item,
    id: crypto.randomUUID(),
    createdat: now,
    updatedat: now,
  };
  const { data, error } = await supabase.from("historico_troca_oleo").insert([newItem]).select();
  if (error) throw error;
  return data[0];
}

// Atualizar registro de histórico
export async function updateHistoricoTrocaOleoSupabase(id: string, dataUpdate: Partial<Omit<HistoricoTrocaOleo, "id" | "createdAt" | "updatedAt">>): Promise<HistoricoTrocaOleo | null> {
  // Mapeamento camelCase -> snake_case para o Supabase
  const mapToSnakeCase = (data: any) => ({
    ...data,
    km_atual: data.kmAtual,
    km_anterior: data.kmAnterior,
    km_prox_troca: data.kmProxTroca,
    veiculoid: data.veiculoId,
    createdat: data.createdAt,
    updatedat: new Date().toISOString(),
  });
  const { data, error } = await supabase
    .from("historico_troca_oleo")
    .update(mapToSnakeCase(dataUpdate))
    .eq("id", id)
    .select()
  if (error) throw error
  return data[0]
}

// Excluir registro de histórico
export async function deleteHistoricoTrocaOleoSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("historico_troca_oleo").delete().eq("id", id)
  if (error) throw error
  return true
}
