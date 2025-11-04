"use client"

import { supabase } from "@/lib/supabase"

// Interface que corresponde ao formato do banco de dados (snake_case)
interface AutorizacaoBorrachariaDB {
  id: string
  veiculo_id: string
  veiculo_placa: string
  veiculo_modelo: string
  veiculo_marca: string
  veiculo_secretaria: string
  autorizado_por: string
  autorizado_por_nome: string
  solicitante_id: string
  solicitante_nome: string
  data_autorizacao: string
  data_prevista: string
  preco?: number | null
  status: "Pendente" | "Autorizado" | "Em Andamento" | "Concluído" | "Cancelado"
  observacoes?: string | null
  created_at: string
  updated_at: string
}

// Interface que corresponde ao formato usado na aplicação (camelCase)
export interface AutorizacaoBorracharia {
  id: string
  veiculoId: string
  veiculoPlaca: string
  veiculoModelo: string
  veiculoMarca: string
  veiculoSecretaria: string
  autorizadoPor: string
  autorizadoPorNome: string
  solicitanteId: string
  solicitanteNome: string
  dataAutorizacao: string
  dataPrevista: string
  preco?: number
  status: "Pendente" | "Autorizado" | "Em Andamento" | "Concluído" | "Cancelado"
  observacoes?: string
  createdAt: string
  updatedAt: string
}

// Função auxiliar para converter DB -> App
function dbToApp(db: AutorizacaoBorrachariaDB): AutorizacaoBorracharia {
  return {
    id: db.id,
    veiculoId: db.veiculo_id,
    veiculoPlaca: db.veiculo_placa,
    veiculoModelo: db.veiculo_modelo,
    veiculoMarca: db.veiculo_marca,
    veiculoSecretaria: db.veiculo_secretaria,
    autorizadoPor: db.autorizado_por,
    autorizadoPorNome: db.autorizado_por_nome,
    solicitanteId: db.solicitante_id,
    solicitanteNome: db.solicitante_nome,
    dataAutorizacao: db.data_autorizacao,
    dataPrevista: db.data_prevista,
    preco: db.preco ?? undefined,
    status: db.status,
    observacoes: db.observacoes ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

// Função auxiliar para converter App -> DB
function appToDB(app: Partial<AutorizacaoBorracharia>): Partial<AutorizacaoBorrachariaDB> {
  const db: Partial<AutorizacaoBorrachariaDB> = {}
  
  if (app.veiculoId !== undefined) db.veiculo_id = app.veiculoId
  if (app.veiculoPlaca !== undefined) db.veiculo_placa = app.veiculoPlaca
  if (app.veiculoModelo !== undefined) db.veiculo_modelo = app.veiculoModelo
  if (app.veiculoMarca !== undefined) db.veiculo_marca = app.veiculoMarca
  if (app.veiculoSecretaria !== undefined) db.veiculo_secretaria = app.veiculoSecretaria
  if (app.autorizadoPor !== undefined) db.autorizado_por = app.autorizadoPor
  if (app.autorizadoPorNome !== undefined) db.autorizado_por_nome = app.autorizadoPorNome
  if (app.solicitanteId !== undefined) db.solicitante_id = app.solicitanteId
  if (app.solicitanteNome !== undefined) db.solicitante_nome = app.solicitanteNome
  if (app.dataAutorizacao !== undefined) db.data_autorizacao = app.dataAutorizacao
  if (app.dataPrevista !== undefined) db.data_prevista = app.dataPrevista
  if (app.preco !== undefined) db.preco = app.preco ?? null
  if (app.status !== undefined) db.status = app.status
  if (app.observacoes !== undefined) db.observacoes = app.observacoes ?? null
  
  return db
}

// Função para obter todas as autorizações
export async function getAutorizacoesBorracharia(): Promise<AutorizacaoBorracharia[]> {
  try {
    const { data, error } = await supabase
      .from("autorizacoes_borracharia")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (error) {
      console.error("Erro ao buscar autorizações:", error)
      throw new Error(`Erro ao buscar autorizações: ${error.message}`)
    }
    
    return (data || []).map(dbToApp)
  } catch (error) {
    console.error("Exceção ao buscar autorizações:", error)
    throw error
  }
}

// Função para obter uma autorização por ID
export async function getAutorizacaoBorrachariaById(id: string): Promise<AutorizacaoBorracharia | null> {
  try {
    const { data, error } = await supabase
      .from("autorizacoes_borracharia")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Registro não encontrado
        return null
      }
      console.error("Erro ao buscar autorização:", error)
      throw new Error(`Erro ao buscar autorização: ${error.message}`)
    }
    
    return data ? dbToApp(data) : null
  } catch (error) {
    console.error("Exceção ao buscar autorização:", error)
    throw error
  }
}

// Ajuste para sempre salvar a data correta (+1 dia para absorver timezone)
function addOneDay(date: Date | string): Date {
  if (!date) return new Date(); // Handle null/undefined input
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

// Função para criar uma nova autorização
export async function createAutorizacaoBorracharia(
  autorizacao: Omit<AutorizacaoBorracharia, "id" | "createdAt" | "updatedAt" | "status">
): Promise<AutorizacaoBorracharia> {
  try {
    // Validar campos obrigatórios
    if (!autorizacao.veiculoId) {
      throw new Error("veiculoId é obrigatório")
    }
    if (!autorizacao.autorizadoPor) {
      throw new Error("autorizadoPor é obrigatório")
    }
    if (!autorizacao.solicitanteId) {
      throw new Error("solicitanteId é obrigatório")
    }
    if (!autorizacao.dataAutorizacao) {
      throw new Error("dataAutorizacao é obrigatória")
    }
    if (!autorizacao.dataPrevista) {
      throw new Error("dataPrevista é obrigatória")
    }
    
    // === Ajuste datas ===
    const corrDataAut = addOneDay(autorizacao.dataAutorizacao);
    const corrDataPrev = addOneDay(autorizacao.dataPrevista);

    // Converter data se for objeto Date
    const dataAutorizacaoStr = corrDataAut instanceof Date
      ? corrDataAut.toISOString().split('T')[0]
      : corrDataAut;
    const dataPrevistaStr = corrDataPrev instanceof Date
      ? corrDataPrev.toISOString().split('T')[0]
      : corrDataPrev;
    
    // Criar objeto de inserção manualmente para garantir que todos os campos estejam presentes
    const dataToInsert: AutorizacaoBorrachariaDB = {
      veiculo_id: autorizacao.veiculoId,
      veiculo_placa: autorizacao.veiculoPlaca || "",
      veiculo_modelo: autorizacao.veiculoModelo || "",
      veiculo_marca: autorizacao.veiculoMarca || "",
      veiculo_secretaria: autorizacao.veiculoSecretaria || "",
      autorizado_por: autorizacao.autorizadoPor,
      autorizado_por_nome: autorizacao.autorizadoPorNome || "",
      solicitante_id: autorizacao.solicitanteId,
      solicitante_nome: autorizacao.solicitanteNome || "",
      data_autorizacao: dataAutorizacaoStr,
      data_prevista: dataPrevistaStr,
      preco: autorizacao.preco ?? null,
      status: "Pendente",
      observacoes: autorizacao.observacoes ?? null,
    }
    
    // Log para debug
    console.log("Dados recebidos:", autorizacao)
    console.log("Dados convertidos para DB:", dataToInsert)
    
    console.log("Tentando inserir no Supabase...")
    console.log("Dados completos a inserir:", JSON.stringify(dataToInsert, null, 2))
    
    const result = await supabase
      .from("autorizacoes_borracharia")
      .insert([dataToInsert])
      .select()
      .single()
    
    console.log("Resultado completo do Supabase:", JSON.stringify({
      data: result.data,
      error: result.error,
      status: result.status,
      statusText: result.statusText,
    }, null, 2))
    
    if (result.error) {
      const error = result.error
      
      // Tentar extrair todas as propriedades do erro
      const errorInfo: any = {}
      try {
        Object.getOwnPropertyNames(error).forEach(prop => {
          try {
            errorInfo[prop] = (error as any)[prop]
          } catch (e) {
            errorInfo[prop] = '[não serializável]'
          }
        })
      } catch (e) {
        errorInfo.raw = String(error)
      }
      
      console.error("Erro completo ao criar autorização:", {
        errorObject: error,
        errorInfo,
        errorStringified: JSON.stringify(errorInfo, null, 2),
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      })
      
      // Construir mensagem de erro mais detalhada
      let errorMessage = "Erro ao criar autorização"
      
      if (error?.message) {
        errorMessage = `Erro ao criar autorização: ${error.message}`
        // Verificar se é erro de RLS
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          errorMessage += "\n\nDICA: Parece ser um problema de políticas RLS. Execute o script 'scripts/fix-autorizacoes-borracharia-rls-simple.sql' no Supabase SQL Editor."
        }
      } else if (error?.details) {
        errorMessage = `Erro ao criar autorização: ${error.details}`
      } else if (error?.hint) {
        errorMessage = `Erro ao criar autorização: ${error.hint}`
      } else if (errorInfo.message) {
        errorMessage = `Erro ao criar autorização: ${errorInfo.message}`
      } else {
        errorMessage = `Erro ao criar autorização: ${JSON.stringify(errorInfo)}`
      }
      
      throw new Error(errorMessage)
    }
    
    if (!result.data) {
      throw new Error("Nenhum dado retornado após inserção")
    }
    
    return dbToApp(result.data)
  } catch (error) {
    console.error("Exceção ao criar autorização:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Erro desconhecido ao criar autorização: ${JSON.stringify(error)}`)
  }
}

// Função para atualizar uma autorização
export async function updateAutorizacaoBorracharia(
  id: string,
  autorizacao: Partial<Omit<AutorizacaoBorracharia, "id" | "createdAt" | "updatedAt">>
): Promise<AutorizacaoBorracharia> {
  try {
    // Converter datas se necessário
    const updateData: any = appToDB(autorizacao)
    
    if (autorizacao.dataAutorizacao instanceof Date) {
      updateData.data_autorizacao = autorizacao.dataAutorizacao.toISOString().split('T')[0]
    }
    if (autorizacao.dataPrevista instanceof Date) {
      updateData.data_prevista = autorizacao.dataPrevista.toISOString().split('T')[0]
    }
    
    const { data, error } = await supabase
      .from("autorizacoes_borracharia")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("Erro ao atualizar autorização:", error)
      throw new Error(`Erro ao atualizar autorização: ${error.message}`)
    }
    
    return dbToApp(data)
  } catch (error) {
    console.error("Exceção ao atualizar autorização:", error)
    throw error
  }
}

// Função para excluir uma autorização
export async function deleteAutorizacaoBorracharia(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("autorizacoes_borracharia")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Erro ao excluir autorização:", error)
      throw new Error(`Erro ao excluir autorização: ${error.message}`)
    }
    
    return true
  } catch (error) {
    console.error("Exceção ao excluir autorização:", error)
    throw error
  }
}

