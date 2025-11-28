"use client"

import { supabase } from "@/lib/supabase"

// Definição do tipo para o registro de troca de óleo
export interface TrocaOleo {
  id: string
  veiculo_id: string
  data_troca: string
  km_anterior: number
  km_atual: number
  km_proxima_troca: number
  tipo_servico: string
  observacao?: string
  user_id?: string | null
  created_at: string
  updated_at: string
}

// Interface para dados de criação de troca de óleo
export interface TrocaOleoCreate {
  veiculo_id: string
  data_troca?: string
  km_anterior: number
  km_atual: number
  km_proxima_troca: number
  tipo_servico: string
  observacao?: string
  user_id?: string | null
}

// Buscar todas as trocas de óleo de um veículo
export async function getTrocasOleo(veiculoId: string): Promise<TrocaOleo[]> {
  try {
    const { data, error } = await supabase
      .from("trocas_oleo")
      .select("*")
      .eq("veiculo_id", veiculoId)
      .order("data_troca", { ascending: false })
  
    if (error) {
      console.error("Erro ao buscar trocas de óleo:", error)
      throw error
    }
  
    return data || []
  } catch (err) {
    // Tratar especificamente erros de rede/fetch
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      console.warn(`⚠️ Erro de conexão ao buscar trocas de óleo para veículo ${veiculoId}. Verifique a conexão com o Supabase.`)
      // Retornar array vazio em caso de erro de rede para não quebrar a aplicação
      return []
    }
    // Re-lançar outros erros
    throw err
  }
}

// Buscar TODAS as trocas de óleo de TODOS os veículos de uma vez (otimizado)
export async function getAllTrocasOleo(): Promise<TrocaOleo[]> {
  try {
    // O Supabase por padrão retorna até 1000 registros
    // Precisamos buscar todos os registros usando paginação se necessário
    let allData: TrocaOleo[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data, error } = await supabase
        .from("trocas_oleo")
        .select("*")
        .range(from, from + pageSize - 1)
        .order("data_troca", { ascending: false })
    
      if (error) {
        console.error("Erro ao buscar todas as trocas de óleo:", error)
        throw error
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data]
        from += pageSize
        hasMore = data.length === pageSize
      } else {
        hasMore = false
      }
    }
  
    return allData
  } catch (err) {
    // Tratar especificamente erros de rede/fetch
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      console.warn(`⚠️ Erro de conexão ao buscar todas as trocas de óleo. Verifique a conexão com o Supabase.`)
      return []
    }
    throw err
  }
}

// Buscar última troca de óleo de um veículo
export async function getUltimaTrocaOleo(veiculoId: string): Promise<TrocaOleo | null> {
  try {
    // Buscar todos os registros do veículo e filtrar no código para evitar problemas de encoding
    const { data, error } = await supabase
      .from("trocas_oleo")
      .select("*")
      .eq("veiculo_id", veiculoId)
      .order("data_troca", { ascending: false })
    
    if (error) {
      console.error("Erro ao buscar trocas de óleo:", error)
      return null
    }
    
    if (!data || data.length === 0) {
      return null
    }
    
    // Filtrar no código para encontrar a última troca de óleo
    const trocasOleo = data.filter(registro => 
      registro.tipo_servico === "Troca de Óleo" || 
      registro.tipo_servico?.toLowerCase().includes("troca") && registro.tipo_servico?.toLowerCase().includes("óleo")
    )
    
    return trocasOleo.length > 0 ? trocasOleo[0] : null
  } catch (error) {
    console.error("Erro ao buscar última troca de óleo:", error)
    return null
  }
}

// Buscar último registro (troca ou atualização) de um veículo
export async function getUltimoRegistro(veiculoId: string): Promise<TrocaOleo | null> {
  const { data, error } = await supabase
    .from("trocas_oleo")
    .select("*")
    .eq("veiculo_id", veiculoId)
    .order("data_troca", { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    if (error.code === "PGRST116" || (error as any).status === 406) { // No rows returned
      return null
    }
    console.error("Erro ao buscar último registro:", error)
    throw error
  }
  
  return data
}

// Registrar nova troca de óleo
export async function registrarTrocaOleo(trocaOleo: TrocaOleoCreate): Promise<TrocaOleo> {
  try {
    console.log("Dados a serem inseridos:", trocaOleo)
    
    // Garantir que os campos obrigatórios estejam presentes
    if (!trocaOleo.veiculo_id) {
      throw new Error("veiculo_id é obrigatório")
    }
    
    // Verificar se os campos numéricos são realmente números
    if (isNaN(Number(trocaOleo.km_anterior))) {
      throw new Error("km_anterior deve ser um número válido")
    }
    
    if (isNaN(Number(trocaOleo.km_atual))) {
      throw new Error("km_atual deve ser um número válido")
    }
    
    if (isNaN(Number(trocaOleo.km_proxima_troca))) {
      throw new Error("km_proxima_troca deve ser um número válido")
    }
    
    // Formatar os dados para inserção
    const dataInsert = {
      veiculo_id: trocaOleo.veiculo_id,
      data_troca: trocaOleo.data_troca || new Date().toISOString(),
      km_anterior: Number(trocaOleo.km_anterior),
      km_atual: Number(trocaOleo.km_atual),
      km_proxima_troca: Number(trocaOleo.km_proxima_troca),
      tipo_servico: trocaOleo.tipo_servico || "Troca de Óleo",
      observacao: trocaOleo.observacao || null,
    }
    
    // Inserir na tabela
    const { data, error } = await supabase
      .from("trocas_oleo")
      .insert([dataInsert])
      .select()
    
    if (error) {
      console.error("Erro ao registrar troca de óleo:", error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error("Nenhum dado retornado após inserção")
    }
    
    return data[0]
  } catch (error) {
    console.error("Erro ao registrar troca de óleo:", error)
    throw error
  }
}

// Atualizar km do veículo
export async function atualizarKmVeiculo(veiculoId: string, kmAtual: number, kmProxTroca?: number, observacao?: string): Promise<TrocaOleo> {
  try {
    // Buscar último registro para obter o km anterior
    const ultimoRegistro = await getUltimoRegistro(veiculoId)
    
    // Criar registro de atualização de km
    const dataInsert = {
      veiculo_id: veiculoId,
      data_troca: new Date().toISOString(),
      km_anterior: ultimoRegistro?.km_atual || 0,
      km_atual: Number(kmAtual),
      km_proxima_troca: kmProxTroca ? Number(kmProxTroca) : (ultimoRegistro?.km_proxima_troca || 0),
      tipo_servico: "Atualização de Km",
      observacao: observacao || "Atualização de quilometragem",
    }
    
    console.log("Dados para atualização:", dataInsert)
    
    const { data, error } = await supabase
      .from("trocas_oleo")
      .insert([dataInsert])
      .select()
    
    if (error) {
      console.error("Erro ao atualizar km:", error)
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error("Nenhum dado retornado após inserção")
    }
    
    return data[0]
  } catch (error) {
    console.error("Erro ao atualizar km:", error)
    throw error
  }
}

// Buscar estatísticas de trocas de óleo
export async function getEstatisticasTrocasOleo(veiculoId: string) {
  try {
    const ultimaTroca = await getUltimaTrocaOleo(veiculoId)
    const ultimoRegistro = await getUltimoRegistro(veiculoId)
    
    // Se não tem nenhum registro (nem troca nem atualização)
    if (!ultimoRegistro) {
      return {
        ultimaTroca: null,
        kmAtual: 0,
        kmProxTroca: 0,
        progresso: 0,
      }
    }
    
    // Se tem algum registro de atualização, mas não tem troca de óleo
    if (!ultimaTroca) {
      return {
        ultimaTroca: null,
        kmAtual: ultimoRegistro.km_atual, // Usar km atual do último registro
        kmProxTroca: ultimoRegistro.km_proxima_troca,
        progresso: 0, // Sem troca de óleo, o progresso é 0
      }
    }
    
    // Cálculo do progresso quando tem troca de óleo
    const kmInicial = ultimaTroca.km_atual
    const kmFinal = ultimaTroca.km_proxima_troca
    const kmAtual = ultimoRegistro.km_atual
    
    const totalKm = kmFinal - kmInicial
    const kmPercorrido = kmAtual - kmInicial
    
    const progresso = totalKm <= 0 ? 0 : 
                     Math.max(0, Math.min(100, Math.round((kmPercorrido / totalKm) * 100)))
    
    return {
      ultimaTroca,
      kmAtual,
      kmProxTroca: kmFinal,
      progresso,
    }
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error)
    return {
      ultimaTroca: null,
      kmAtual: 0,
      kmProxTroca: 0,
      progresso: 0,
    }
  }
} 