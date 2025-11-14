"use client"

import { supabase } from "@/lib/supabase"

// Interface que corresponde ao formato do banco de dados (snake_case)
interface AutorizacaoLavadorDB {
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
  lavador_id?: string | null
  data_autorizacao: string
  data_prevista: string
  preco?: number | null
  status: "Pendente" | "Autorizado" | "Em Andamento" | "Concluído" | "Cancelado"
  observacoes?: string | null
  created_at: string
  updated_at: string
}

// Interface que corresponde ao formato usado na aplicação (camelCase)
export interface AutorizacaoLavador {
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
  lavadorId?: string
  dataAutorizacao: string
  dataPrevista: string
  preco?: number
  status: "Pendente" | "Autorizado" | "Em Andamento" | "Concluído" | "Cancelado"
  observacoes?: string
  createdAt: string
  updatedAt: string
}

// Função auxiliar para converter DB -> App
function dbToApp(db: AutorizacaoLavadorDB): AutorizacaoLavador {
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
    lavadorId: db.lavador_id ?? undefined,
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
function appToDB(app: Partial<AutorizacaoLavador>): Partial<AutorizacaoLavadorDB> {
  const db: Partial<AutorizacaoLavadorDB> = {}
  
  if (app.veiculoId !== undefined) db.veiculo_id = app.veiculoId
  if (app.veiculoPlaca !== undefined) db.veiculo_placa = app.veiculoPlaca
  if (app.veiculoModelo !== undefined) db.veiculo_modelo = app.veiculoModelo
  if (app.veiculoMarca !== undefined) db.veiculo_marca = app.veiculoMarca
  if (app.veiculoSecretaria !== undefined) db.veiculo_secretaria = app.veiculoSecretaria
  if (app.autorizadoPor !== undefined) db.autorizado_por = app.autorizadoPor
  if (app.autorizadoPorNome !== undefined) db.autorizado_por_nome = app.autorizadoPorNome
  if (app.solicitanteId !== undefined) db.solicitante_id = app.solicitanteId
  if (app.solicitanteNome !== undefined) db.solicitante_nome = app.solicitanteNome
  // Tratar lavadorId: se for string vazia, converter para null (UUID não aceita string vazia)
  if (app.lavadorId !== undefined) {
    db.lavador_id = (app.lavadorId && app.lavadorId.trim() !== '') ? app.lavadorId : null
  }
  if (app.dataAutorizacao !== undefined) db.data_autorizacao = app.dataAutorizacao
  if (app.dataPrevista !== undefined) db.data_prevista = app.dataPrevista
  if (app.preco !== undefined) db.preco = app.preco ?? null
  if (app.status !== undefined) db.status = app.status
  if (app.observacoes !== undefined) db.observacoes = app.observacoes ?? null
  
  return db
}

// Função para obter todas as autorizações
export async function getAutorizacoesLavador(): Promise<AutorizacaoLavador[]> {
  try {
    const { data, error } = await supabase
      .from("autorizacoes_lavador")
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
export async function getAutorizacaoLavadorById(id: string): Promise<AutorizacaoLavador | null> {
  try {
    const { data, error } = await supabase
      .from("autorizacoes_lavador")
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
  if (!date) return new Date();
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

// Função para criar uma nova autorização
export async function createAutorizacaoLavador(
  autorizacao: Omit<AutorizacaoLavador, "id" | "createdAt" | "updatedAt" | "status">
): Promise<AutorizacaoLavador> {
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
    // === Ajuste aqui ===
    const corrDataAut = addOneDay(autorizacao.dataAutorizacao);
    const corrDataPrev = addOneDay(autorizacao.dataPrevista);
    // ===================
    // Converter data se for objeto Date
    const dataAutorizacaoStr = corrDataAut instanceof Date
      ? corrDataAut.toISOString().split('T')[0]
      : corrDataAut;
    const dataPrevistaStr = corrDataPrev instanceof Date
      ? corrDataPrev.toISOString().split('T')[0]
      : corrDataPrev;
    
    // Criar objeto de inserção manualmente para garantir que todos os campos estejam presentes
    const dataToInsert: AutorizacaoLavadorDB = {
      veiculo_id: autorizacao.veiculoId,
      veiculo_placa: autorizacao.veiculoPlaca || "",
      veiculo_modelo: autorizacao.veiculoModelo || "",
      veiculo_marca: autorizacao.veiculoMarca || "",
      veiculo_secretaria: autorizacao.veiculoSecretaria || "",
      autorizado_por: autorizacao.autorizadoPor,
      autorizado_por_nome: autorizacao.autorizadoPorNome || "",
      solicitante_id: autorizacao.solicitanteId,
      solicitante_nome: autorizacao.solicitanteNome || "",
      lavador_id: autorizacao.lavadorId ?? null,
      data_autorizacao: dataAutorizacaoStr,
      data_prevista: dataPrevistaStr,
      preco: autorizacao.preco ?? null,
      status: "Pendente",
      observacoes: autorizacao.observacoes ?? null,
    }
    
    const result = await supabase
      .from("autorizacoes_lavador")
      .insert([dataToInsert])
      .select()
      .single()
    
    if (result.error) {
      const error = result.error
      let errorMessage = "Erro ao criar autorização"
      
      if (error?.message) {
        errorMessage = `Erro ao criar autorização: ${error.message}`
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          errorMessage += "\n\nDICA: Parece ser um problema de políticas RLS. Execute o script 'db/autorizacoes-lavador.sql' no Supabase SQL Editor."
        }
      } else if (error?.details) {
        errorMessage = `Erro ao criar autorização: ${error.details}`
      } else if (error?.hint) {
        errorMessage = `Erro ao criar autorização: ${error.hint}`
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
export async function updateAutorizacaoLavador(
  id: string,
  autorizacao: Partial<Omit<AutorizacaoLavador, "id" | "createdAt" | "updatedAt">>
): Promise<AutorizacaoLavador> {
  try {
    // Criar cópia do objeto sem as datas para evitar incluir Date objects no appToDB
    const autorizacaoSemDatas = { ...autorizacao }
    const dataAutorizacao = autorizacaoSemDatas.dataAutorizacao
    const dataPrevista = autorizacaoSemDatas.dataPrevista
    delete autorizacaoSemDatas.dataAutorizacao
    delete autorizacaoSemDatas.dataPrevista
    
    // Converter campos (sem datas) para formato DB
    const updateData: any = appToDB(autorizacaoSemDatas)
    
    // Processar dataAutorizacao se fornecida
    if (dataAutorizacao !== undefined) {
      // Aplicar o mesmo ajuste de +1 dia usado na criação
      const corrDataAut = addOneDay(dataAutorizacao)
      // addOneDay sempre retorna Date, então sempre converter para string
      updateData.data_autorizacao = corrDataAut.toISOString().split('T')[0]
    }
    
    // Processar dataPrevista se fornecida
    if (dataPrevista !== undefined) {
      // Aplicar o mesmo ajuste de +1 dia usado na criação
      const corrDataPrev = addOneDay(dataPrevista)
      // addOneDay sempre retorna Date, então sempre converter para string
      updateData.data_prevista = corrDataPrev.toISOString().split('T')[0]
    }
    
    // Log para debug
    console.log("=== DEBUG UPDATE AUTORIZAÇÃO LAVADOR ===")
    console.log("ID:", id)
    console.log("Dados recebidos:", autorizacao)
    console.log("Dados para atualização:", updateData)
    console.log("Dados serializados:", JSON.stringify(updateData, null, 2))
    
    // Verificar se updateData está vazio
    if (Object.keys(updateData).length === 0) {
      throw new Error("Nenhum dado fornecido para atualização")
    }
    
    const result = await supabase
      .from("autorizacoes_lavador")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    
    console.log("Resultado completo do Supabase:", {
      hasError: !!result.error,
      hasData: !!result.data,
      error: result.error,
      data: result.data,
      status: (result as any).status,
      statusText: (result as any).statusText
    })
    
    if (result.error) {
      const error = result.error
      
      // Tentar múltiplas formas de extrair informações do erro
      const errorInfo: any = {
        type: typeof error,
        constructor: error?.constructor?.name,
        stringValue: String(error),
      }
      
      // Tentar extrair propriedades enumeráveis
      try {
        Object.keys(error).forEach(key => {
          try {
            errorInfo[key] = (error as any)[key]
          } catch (e) {
            errorInfo[key] = '[não serializável]'
          }
        })
      } catch (e) {
        console.warn("Erro ao extrair keys:", e)
      }
      
      // Tentar extrair propriedades próprias
      try {
        Object.getOwnPropertyNames(error).forEach(prop => {
          try {
            errorInfo[prop] = (error as any)[prop]
          } catch (e) {
            errorInfo[prop] = '[não serializável]'
          }
        })
      } catch (e) {
        console.warn("Erro ao extrair property names:", e)
      }
      
      // Tentar acessar propriedades conhecidas do Supabase
      const knownProps = ['message', 'details', 'hint', 'code', 'statusCode', 'status']
      knownProps.forEach(prop => {
        try {
          if ((error as any)[prop] !== undefined) {
            errorInfo[prop] = (error as any)[prop]
          }
        } catch (e) {
          // Ignorar
        }
      })
      
      // Usar console.log em vez de console.error para evitar que seja tratado como erro não tratado
      console.log("=== ERRO DETALHADO ===")
      console.log("Erro objeto:", error)
      console.log("ErrorInfo:", errorInfo)
      console.log("ErrorInfo stringified:", JSON.stringify(errorInfo, null, 2))
      console.log("Dados enviados:", JSON.stringify(updateData, null, 2))
      
      // Construir mensagem de erro mais detalhada
      let errorMessage = "Erro ao atualizar autorização"
      
      if (error?.message) {
        errorMessage = `Erro ao atualizar autorização: ${error.message}`
        // Verificar se é erro de RLS
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          errorMessage += "\n\nDICA: Parece ser um problema de políticas RLS. Execute o script 'db/autorizacoes-lavador.sql' no Supabase SQL Editor."
        }
      } else if (error?.details) {
        errorMessage = `Erro ao atualizar autorização: ${error.details}`
      } else if (error?.hint) {
        errorMessage = `Erro ao atualizar autorização: ${error.hint}`
      } else if (errorInfo.message) {
        errorMessage = `Erro ao atualizar autorização: ${errorInfo.message}`
      } else if (errorInfo.stringValue && errorInfo.stringValue !== '[object Object]') {
        errorMessage = `Erro ao atualizar autorização: ${errorInfo.stringValue}`
      } else {
        errorMessage = `Erro ao atualizar autorização. Verifique o console para mais detalhes. ErrorInfo: ${JSON.stringify(errorInfo)}`
      }
      
      throw new Error(errorMessage)
    }
    
    if (!result.data) {
      throw new Error("Nenhum dado retornado após atualização")
    }
    
    return dbToApp(result.data)
  } catch (error) {
    // Usar console.log para logs de debug, não console.error para evitar erros não tratados
    console.log("Exceção ao atualizar autorização:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Erro desconhecido ao atualizar autorização: ${JSON.stringify(error)}`)
  }
}

// Função para excluir uma autorização
export async function deleteAutorizacaoLavador(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("autorizacoes_lavador")
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

