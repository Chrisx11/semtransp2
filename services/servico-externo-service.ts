"use client"

import { supabase } from "@/lib/supabase"

/** UUID sentinela usado quando o serviço é lançado sem Ordem de Serviço (compatível com coluna NOT NULL). */
export const SERVICO_EXTERNO_SEM_OS_ID = "00000000-0000-4000-a000-000000000001"

// Interface que corresponde ao formato do banco de dados (snake_case)
interface ServicoExternoDB {
  id: string
  ordem_servico_id: string | null
  ordem_servico_numero: string | null
  veiculo_id: string
  veiculo_placa: string
  veiculo_modelo: string
  veiculo_marca: string
  veiculo_secretaria: string
  fornecedor_id: string
  fornecedor_nome: string
  servico_solicitado: string
  valor: number
  data_autorizacao: string
  status: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado"
  observacoes?: string | null
  created_at: string
  updated_at: string
}

// Interface que corresponde ao formato usado na aplicação (camelCase)
export interface ServicoExterno {
  id: string
  ordemServicoId: string | null
  ordemServicoNumero: string | null
  veiculoId: string
  veiculoPlaca: string
  veiculoModelo: string
  veiculoMarca: string
  veiculoSecretaria: string
  fornecedorId: string
  fornecedorNome: string
  servicoSolicitado: string
  valor: number
  dataAutorizacao: string
  status: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado"
  observacoes?: string | null
  createdAt: string
  updatedAt: string
}

function isSemOsId(id: string | null | undefined): boolean {
  return !id || id === SERVICO_EXTERNO_SEM_OS_ID
}

function formatSupabaseError(error: any): string {
  if (!error) return "Erro desconhecido"
  const parts = [
    error.message,
    error.details,
    error.hint,
    error.code ? `código ${error.code}` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" — ") : JSON.stringify(error, Object.getOwnPropertyNames(error))
}

// Função para converter do formato do banco (snake_case) para o formato da aplicação (camelCase)
function dbToApp(data: ServicoExternoDB): ServicoExterno {
  const ordemId = data.ordem_servico_id
  const semOs = isSemOsId(ordemId)
  return {
    id: data.id,
    ordemServicoId: semOs ? null : ordemId,
    ordemServicoNumero: semOs ? (data.ordem_servico_numero || "Sem OS") : (data.ordem_servico_numero ?? null),
    veiculoId: data.veiculo_id,
    veiculoPlaca: data.veiculo_placa,
    veiculoModelo: data.veiculo_modelo,
    veiculoMarca: data.veiculo_marca,
    veiculoSecretaria: data.veiculo_secretaria,
    fornecedorId: data.fornecedor_id,
    fornecedorNome: data.fornecedor_nome,
    servicoSolicitado: data.servico_solicitado,
    valor: data.valor || 0,
    dataAutorizacao: data.data_autorizacao,
    status: data.status,
    observacoes: data.observacoes ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Função para converter do formato da aplicação (camelCase) para o formato do banco (snake_case)
function appToDB(data: Partial<ServicoExterno>): Partial<ServicoExternoDB> {
  const result: any = {}
  
  if (data.ordemServicoId !== undefined) result.ordem_servico_id = data.ordemServicoId
  if (data.ordemServicoNumero !== undefined) result.ordem_servico_numero = data.ordemServicoNumero
  if (data.veiculoId !== undefined) result.veiculo_id = data.veiculoId
  if (data.veiculoPlaca !== undefined) result.veiculo_placa = data.veiculoPlaca
  if (data.veiculoModelo !== undefined) result.veiculo_modelo = data.veiculoModelo
  if (data.veiculoMarca !== undefined) result.veiculo_marca = data.veiculoMarca
  if (data.veiculoSecretaria !== undefined) result.veiculo_secretaria = data.veiculoSecretaria
  if (data.fornecedorId !== undefined) result.fornecedor_id = data.fornecedorId
  if (data.fornecedorNome !== undefined) result.fornecedor_nome = data.fornecedorNome
  if (data.servicoSolicitado !== undefined) result.servico_solicitado = data.servicoSolicitado
  if (data.valor !== undefined) result.valor = data.valor
  if (data.dataAutorizacao !== undefined) result.data_autorizacao = data.dataAutorizacao
  if (data.status !== undefined) result.status = data.status
  if (data.observacoes !== undefined) result.observacoes = data.observacoes
  
  return result
}

// Função para obter todas as autorizações de serviço externo
export async function getServicosExternos(): Promise<ServicoExterno[]> {
  try {
    const { data, error } = await supabase
      .from("servicos_externos")
      .select("*")
      .order("data_autorizacao", { ascending: false })
    
    if (error) {
      console.error("Erro ao buscar serviços externos:", error)
      throw new Error(`Erro ao buscar serviços externos: ${error.message}`)
    }
    
    return (data || []).map(dbToApp)
  } catch (error) {
    console.error("Exceção ao buscar serviços externos:", error)
    throw error
  }
}

// Função para criar um novo serviço externo
export async function createServicoExterno(
  servico: Omit<ServicoExterno, "id" | "createdAt" | "updatedAt" | "status">
): Promise<ServicoExterno> {
  try {
    // Validar campos obrigatórios (OS é opcional — permite lançamento direto)
    if (!servico.veiculoId) {
      throw new Error("veiculoId é obrigatório")
    }
    if (!servico.fornecedorId) {
      throw new Error("fornecedorId é obrigatório")
    }
    if (!servico.dataAutorizacao) {
      throw new Error("dataAutorizacao é obrigatória")
    }
    if (!servico.servicoSolicitado?.trim()) {
      throw new Error("servicoSolicitado é obrigatório")
    }
    
    // Converter data se for objeto Date
    const dataAutorizacaoStr = servico.dataAutorizacao instanceof Date
      ? servico.dataAutorizacao.toISOString().split('T')[0]
      : servico.dataAutorizacao
    
    // Criar objeto de inserção
    // Sem OS: usa UUID sentinela para compatibilidade com coluna NOT NULL (antes da migration)
    const semOs = !servico.ordemServicoId
    const dataToInsert: Record<string, unknown> = {
      ordem_servico_id: semOs ? SERVICO_EXTERNO_SEM_OS_ID : servico.ordemServicoId,
      ordem_servico_numero: semOs
        ? (servico.ordemServicoNumero || "Sem OS")
        : (servico.ordemServicoNumero || ""),
      veiculo_id: servico.veiculoId,
      veiculo_placa: servico.veiculoPlaca || "",
      veiculo_modelo: servico.veiculoModelo || "",
      veiculo_marca: servico.veiculoMarca || "",
      veiculo_secretaria: servico.veiculoSecretaria || "",
      fornecedor_id: servico.fornecedorId,
      fornecedor_nome: servico.fornecedorNome || "",
      servico_solicitado: servico.servicoSolicitado || "",
      valor: servico.valor || 0,
      data_autorizacao: dataAutorizacaoStr,
      status: "Pendente",
      observacoes: servico.observacoes ?? null,
    }
    
    const { data, error } = await supabase
      .from("servicos_externos")
      .insert([dataToInsert])
      .select()
      .single()
    
    if (error) {
      console.error("Erro ao criar serviço externo:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload: dataToInsert,
      })
      throw new Error(`Erro ao criar serviço externo: ${formatSupabaseError(error)}`)
    }
    
    return dbToApp(data)
  } catch (error) {
    console.error("Exceção ao criar serviço externo:", error)
    throw error
  }
}

// Função para atualizar um serviço externo
export async function updateServicoExterno(
  id: string,
  servico: Partial<Omit<ServicoExterno, "id" | "createdAt" | "updatedAt">>
): Promise<ServicoExterno> {
  try {
    const updateData: any = appToDB(servico)
    
    // Processar dataAutorizacao se fornecida
    if (servico.dataAutorizacao !== undefined) {
      updateData.data_autorizacao = servico.dataAutorizacao instanceof Date
        ? servico.dataAutorizacao.toISOString().split('T')[0]
        : servico.dataAutorizacao
    }
    
    const { data, error } = await supabase
      .from("servicos_externos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("Erro ao atualizar serviço externo:", error)
      throw new Error(`Erro ao atualizar serviço externo: ${error.message}`)
    }
    
    return dbToApp(data)
  } catch (error) {
    console.error("Exceção ao atualizar serviço externo:", error)
    throw error
  }
}

// Função para obter um serviço externo por ID
export async function getServicoExternoById(id: string): Promise<ServicoExterno | null> {
  try {
    const { data, error } = await supabase
      .from("servicos_externos")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Registro não encontrado
        return null
      }
      console.error("Erro ao buscar serviço externo:", error)
      throw new Error(`Erro ao buscar serviço externo: ${error.message}`)
    }
    
    return data ? dbToApp(data) : null
  } catch (error) {
    console.error("Exceção ao buscar serviço externo:", error)
    throw error
  }
}

// Função para excluir um serviço externo
export async function deleteServicoExterno(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("servicos_externos")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Erro ao excluir serviço externo:", error)
      throw new Error(`Erro ao excluir serviço externo: ${error.message}`)
    }
    
    return true
  } catch (error) {
    console.error("Exceção ao excluir serviço externo:", error)
    throw error
  }
}

