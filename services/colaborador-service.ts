"use client"

import { supabase, checkSupabaseConnection } from "@/lib/supabase"

export interface Colaborador {
  id: string
  nome: string
  funcao: string
  telefone: string
  secretaria: string
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

// Chave para armazenamento local (fallback)
const STORAGE_KEY = "colaboradores"

// Função para obter todos os colaboradores
export async function getColaboradores(): Promise<Colaborador[]> {
  const { data, error } = await supabase.from("colaboradores").select("*").order("nome")
  if (error) throw error
  return data || []
}

// Função para obter um colaborador por ID
export async function getColaboradorById(id: string): Promise<Colaborador | null> {
  const { data, error } = await supabase.from("colaboradores").select("*").eq("id", id).single()
  if (error) throw error
  return data
}

// Função para obter um colaborador por ID no Supabase
export async function getColaboradorByIdSupabase(id: string): Promise<Colaborador | null> {
  const { data, error } = await supabase.from("colaboradores").select("*").eq("id", id).single()
  if (error) return null
  return data
}

// Função para adicionar um novo colaborador
export async function addColaborador(colaborador: Omit<Colaborador, "id">): Promise<Colaborador> {
  const newColaborador = {
    ...colaborador,
    id: crypto.randomUUID(),
  }
  const { data, error } = await supabase.from("colaboradores").insert([newColaborador]).select()
  if (error) throw error
  return data[0]
}

// Função para atualizar um colaborador existente
export async function updateColaborador(id: string, colaborador: Partial<Colaborador>): Promise<Colaborador | null> {
  const { data, error } = await supabase.from("colaboradores").update(colaborador).eq("id", id).select()
  if (error) throw error
  return data[0]
}

// Função para excluir um colaborador
export async function deleteColaborador(id: string): Promise<boolean> {
  const { error } = await supabase.from("colaboradores").delete().eq("id", id)
  if (error) throw error
  return true
}

// Função para verificar se o Supabase está disponível
export async function isSupabaseAvailable(): Promise<boolean> {
  const { connected } = await checkSupabaseConnection()
  return connected
}

// Função para migrar dados do localStorage para o Supabase
export async function migrateLocalStorageToSupabase(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return true

    const storedData = localStorage.getItem(STORAGE_KEY)
    if (!storedData) return true

    const colaboradores = JSON.parse(storedData)
    if (colaboradores.length === 0) return true

    const { error } = await supabase.from("colaboradores").insert(colaboradores)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Erro ao migrar dados para o Supabase:", error)
    return false
  }
}
