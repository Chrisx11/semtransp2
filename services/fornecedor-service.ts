"use client"

import { supabase } from "@/lib/supabase"

export interface Fornecedor {
  id: string
  nome: string
  created_at?: string
  updated_at?: string
}

// Função para testar conexão com Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("fornecedores")
      .select("count")
      .limit(1)
    
    if (error) {
      console.error("Erro de conexão com Supabase:", error)
      return false
    }
    return true
  } catch (err) {
    console.error("Erro ao testar conexão:", err)
    return false
  }
}

// Função para testar se a tabela existe
export async function testTableExists(): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("fornecedores")
      .select("*")
      .limit(1)
    
    if (error) {
      console.error("Erro ao verificar tabela:", error)
      return { exists: false, error: error.message || "Tabela não encontrada" }
    }
    
    return { exists: true }
  } catch (err) {
    console.error("Erro ao verificar tabela:", err)
    return { 
      exists: false, 
      error: err instanceof Error ? err.message : "Erro desconhecido" 
    }
  }
}

// Função de teste mais simples - apenas verificar se conseguimos acessar a tabela
export async function testBasicAccess(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Testando acesso básico à tabela fornecedores...")
    
    // Tentar apenas fazer um select simples
    const result = await supabase
      .from("fornecedores")
      .select("id")
      .limit(1)
    
    console.log("Resultado do teste básico:", result)
    
    if (result.error) {
      console.error("Erro no teste básico:", result.error)
      return { 
        success: false, 
        error: result.error.message || "Erro ao acessar tabela" 
      }
    }
    
    return { success: true }
  } catch (err) {
    console.error("Erro no teste básico:", err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Erro desconhecido no teste básico" 
    }
  }
}

// Função para testar inserção de dados
export async function testInsertFornecedor(): Promise<{ success: boolean; error?: string }> {
  try {
    const testData = { nome: "Teste " + Date.now() }
    console.log("Testando inserção com dados:", testData)
    
    // Usar try-catch para capturar qualquer erro
    let insertResult
    try {
      insertResult = await supabase
        .from("fornecedores")
        .insert([testData])
    } catch (insertError) {
      console.error("Erro capturado no try-catch:", insertError)
      return { 
        success: false, 
        error: insertError instanceof Error ? insertError.message : "Erro de inserção capturado" 
      }
    }
    
    const { data, error } = insertResult
    
    if (error) {
      console.error("Erro detalhado ao testar inserção:", {
        error: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stringified: JSON.stringify(error, null, 2),
        type: typeof error,
        constructor: error.constructor?.name
      })
      
      // Tentar extrair a mensagem de erro de diferentes formas
      let errorMessage = "Erro desconhecido do Supabase"
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.details) {
        errorMessage = error.details
      } else if (error.hint) {
        errorMessage = error.hint
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        // Se o erro for um objeto vazio, tentar stringify
        try {
          const errorStr = JSON.stringify(error)
          if (errorStr !== '{}') {
            errorMessage = errorStr
          }
        } catch (e) {
          errorMessage = "Erro não serializável"
        }
      }
      
      return { success: false, error: errorMessage }
    }
    
    console.log("Inserção de teste bem-sucedida, dados retornados:", data)
    
    // Se chegou até aqui, a inserção funcionou
    // Tentar buscar o registro inserido para limpar
    try {
      const { data: insertedData } = await supabase
        .from("fornecedores")
        .select("id")
        .eq("nome", testData.nome)
        .limit(1)
      
      if (insertedData && insertedData.length > 0) {
        console.log("Limpando registro de teste:", insertedData[0].id)
        await supabase.from("fornecedores").delete().eq("id", insertedData[0].id)
      }
    } catch (cleanupError) {
      console.warn("Erro ao limpar registro de teste:", cleanupError)
    }
    
    return { success: true }
  } catch (err) {
    console.error("Erro ao testar inserção:", {
      error: err,
      message: err instanceof Error ? err.message : "Erro desconhecido",
      stack: err instanceof Error ? err.stack : undefined
    })
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Erro desconhecido no teste de inserção" 
    }
  }
}

// Função para obter todos os fornecedores
export async function getFornecedoresSupabase(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .neq("nome", "Teste de Segurança")
    .order("nome")
  
  if (error) {
    console.error("Erro ao buscar fornecedores:", error)
    throw new Error(`Erro ao buscar fornecedores: ${error.message}`)
  }
  return data || []
}

// Função para obter um fornecedor por ID
export async function getFornecedorByIdSupabase(id: string): Promise<Fornecedor | null> {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) return null
  return data
}

// Função para adicionar um novo fornecedor
export async function addFornecedorSupabase(fornecedor: Omit<Fornecedor, "id" | "created_at" | "updated_at">): Promise<Fornecedor> {
  console.log("Tentando adicionar fornecedor:", fornecedor)
  
  const { data, error } = await supabase
    .from("fornecedores")
    .insert([fornecedor])
    .select()
    .single()
  
  if (error) {
    console.error("Erro detalhado do Supabase:", {
      error: error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      stringified: JSON.stringify(error, null, 2)
    })
    
    // Verificar se é erro de RLS
    if (error.message && error.message.includes("row-level security policy")) {
      throw new Error(`Erro de segurança: As políticas de RLS estão bloqueando a operação. Execute o script 'fix-rls-policies.sql' no Supabase.`)
    }
    
    // Se não há mensagem específica, usar uma mensagem genérica
    const errorMessage = error.message || error.details || "Erro desconhecido do Supabase"
    throw new Error(`Erro ao adicionar fornecedor: ${errorMessage}`)
  }
  
  console.log("Fornecedor adicionado com sucesso:", data)
  return data
}

// Função para atualizar um fornecedor
export async function updateFornecedorSupabase(id: string, fornecedor: Partial<Fornecedor>): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from("fornecedores")
    .update({ ...fornecedor, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Função para excluir um fornecedor
export async function deleteFornecedorSupabase(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("fornecedores")
    .delete()
    .eq("id", id)
  
  if (error) throw error
  return true
}