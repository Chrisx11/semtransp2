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
}

// Buscar todas as trocas de óleo de um veículo
export async function getTrocasOleo(veiculoId: string): Promise<TrocaOleo[]> {
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
}

// Buscar última troca de óleo de um veículo
export async function getUltimaTrocaOleo(veiculoId: string): Promise<TrocaOleo | null> {
  const { data, error } = await supabase
    .from("trocas_oleo")
    .select("*")
    .eq("veiculo_id", veiculoId)
    .eq("tipo_servico", "Troca de Óleo")
    .order("data_troca", { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    if (error.code === "PGRST116" || (error as any).status === 406) { // No rows returned
      return null
    }
    console.error("Erro ao buscar última troca de óleo:", error)
    throw error
  }
  
  return data
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