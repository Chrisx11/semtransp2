"use client"

import { supabase } from "@/lib/supabase"

export interface Nota {
  id: string
  fornecedor_id: string
  numero?: string
  veiculo_id?: string
  veiculo_descricao: string
  data: string
  valor: number
  status: "Aberto" | "Pago"
  observacoes?: string
  created_at?: string
  updated_at?: string
}

export interface NotaComFornecedor extends Nota {
  fornecedor_nome: string
}

// Função para obter todas as notas com informações do fornecedor
export async function getNotasSupabase(): Promise<NotaComFornecedor[]> {
  const { data, error } = await supabase
    .from("notas")
    .select(`
      *,
      fornecedores!inner(nome)
    `)
    .order("data", { ascending: false })
  
  if (error) throw error
  
  return data?.map(nota => ({
    ...nota,
    fornecedor_nome: nota.fornecedores.nome
  })) || []
}

// Função para obter uma nota por ID
export async function getNotaByIdSupabase(id: string): Promise<NotaComFornecedor | null> {
  const { data, error } = await supabase
    .from("notas")
    .select(`
      *,
      fornecedores!inner(nome)
    `)
    .eq("id", id)
    .single()
  
  if (error) return null
  
  return {
    ...data,
    fornecedor_nome: data.fornecedores.nome
  }
}

// Função para adicionar uma nova nota
export async function addNotaSupabase(nota: Omit<Nota, "id" | "created_at" | "updated_at">): Promise<Nota> {
  const { data, error } = await supabase
    .from("notas")
    .insert([nota])
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Função para atualizar uma nota
export async function updateNotaSupabase(id: string, nota: Partial<Nota>): Promise<Nota> {
  const { data, error } = await supabase
    .from("notas")
    .update({ ...nota, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Função para excluir uma nota
export async function deleteNotaSupabase(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("notas")
    .delete()
    .eq("id", id)
  
  if (error) throw error
  return true
}

// Função para atualizar apenas o status de uma nota
export async function updateStatusNotaSupabase(id: string, status: "Aberto" | "Pago"): Promise<boolean> {
  const { error } = await supabase
    .from("notas")
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", id)
  
  if (error) throw error
  return true
}
