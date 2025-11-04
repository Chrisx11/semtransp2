"use client"

import { supabase } from "@/lib/supabase"

export interface Lavador {
  id: string
  nome: string
  endereco: string
  telefone: string
  created_at?: string
  updated_at?: string
}

// Função para obter todos os lavadores
export async function getLavadores(): Promise<Lavador[]> {
  const { data, error } = await supabase
    .from("lavadores")
    .select("*")
    .order("nome")
  
  if (error) {
    console.error("Erro ao buscar lavadores:", error)
    throw new Error(`Erro ao buscar lavadores: ${error.message}`)
  }
  return data || []
}

// Função para obter um lavador por ID
export async function getLavadorById(id: string): Promise<Lavador | null> {
  const { data, error } = await supabase
    .from("lavadores")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error("Erro ao buscar lavador:", error)
    throw new Error(`Erro ao buscar lavador: ${error.message}`)
  }
  return data
}

// Função para criar um novo lavador
export async function createLavador(lavador: Omit<Lavador, "id" | "created_at" | "updated_at">): Promise<Lavador> {
  const { data, error } = await supabase
    .from("lavadores")
    .insert([lavador])
    .select()
    .single()
  
  if (error) {
    console.error("Erro ao criar lavador:", error)
    
    if (error.message && error.message.includes("row-level security policy")) {
      throw new Error(`Erro de segurança: As políticas de RLS estão bloqueando a operação. Execute o script 'db/lavadores.sql' no Supabase.`)
    }
    
    const errorMessage = error.message || error.details || "Erro desconhecido do Supabase"
    throw new Error(`Erro ao criar lavador: ${errorMessage}`)
  }
  
  return data
}

// Função para atualizar um lavador
export async function updateLavador(id: string, lavador: Partial<Omit<Lavador, "id" | "created_at" | "updated_at">>): Promise<Lavador> {
  const { data, error } = await supabase
    .from("lavadores")
    .update({ ...lavador, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Erro ao atualizar lavador:", error)
    throw new Error(`Erro ao atualizar lavador: ${error.message}`)
  }
  return data
}

// Função para excluir um lavador
export async function deleteLavador(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("lavadores")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Erro ao excluir lavador:", error)
    throw new Error(`Erro ao excluir lavador: ${error.message}`)
  }
  return true
}
