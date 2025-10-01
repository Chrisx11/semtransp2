"use client"

import { getProdutoById, updateProduto } from "./produto-service"
import { getColaboradorById } from "./colaborador-service"
import { supabase } from "@/lib/supabase"

// Definição do tipo de dados para Entrada
export interface Entrada {
  id: string
  produtoId: string
  produtoDescricao: string
  responsavelId: string
  responsavelNome: string
  quantidade: number
  data: string
  createdAt: string
}

// Chave para armazenar os dados no localStorage
const STORAGE_KEY = "entradas_data"

// Função para gerar um ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

// Função para obter todas as entradas
export const getEntradas = (): Entrada[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// Função para adicionar uma nova entrada
export const addEntrada = async (
  produtoId: string,
  responsavelId: string,
  quantidade: number,
): Promise<Entrada | null> => {
  // Verificar se o produto existe
  const produto = getProdutoById(produtoId)
  if (!produto) return null

  // Verificar se o responsável existe
  const responsavel = getColaboradorById(responsavelId)
  if (!responsavel) return null

  // Verificar se a quantidade é válida
  if (quantidade <= 0) return null

  const entradas = getEntradas()

  const now = new Date()
  const newEntrada: Entrada = {
    id: generateId(),
    produtoId,
    produtoDescricao: produto.descricao,
    responsavelId,
    responsavelNome: responsavel.nome,
    quantidade,
    data: now.toISOString(),
    createdAt: now.toISOString(),
  }

  entradas.push(newEntrada)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entradas))

  // Atualizar o estoque do produto
  const novoEstoque = produto.estoque + quantidade
  updateProduto(produtoId, { estoque: novoEstoque })

  return newEntrada
}

// Função para atualizar uma entrada existente
export const updateEntrada = async (
  id: string,
  produtoId: string,
  responsavelId: string,
  novaQuantidade: number,
): Promise<Entrada | null> => {
  // Verificar se a entrada existe
  const entradas = getEntradas()
  const entradaIndex = entradas.findIndex((e) => e.id === id)

  if (entradaIndex === -1) return null

  const entradaAntiga = entradas[entradaIndex]

  // Verificar se o produto existe
  const produto = getProdutoById(produtoId)
  if (!produto) return null

  // Verificar se o responsável existe
  const responsavel = getColaboradorById(responsavelId)
  if (!responsavel) return null

  // Verificar se a quantidade é válida
  if (novaQuantidade <= 0) return null

  // Atualizar o estoque do produto
  // 1. Reverter a entrada antiga
  const estoqueAposReverter = produto.estoque - entradaAntiga.quantidade

  // 2. Aplicar a nova quantidade
  const novoEstoque = estoqueAposReverter + novaQuantidade

  // 3. Atualizar o estoque do produto
  updateProduto(produtoId, { estoque: novoEstoque })

  // Atualizar a entrada
  const entradaAtualizada: Entrada = {
    ...entradaAntiga,
    produtoId,
    produtoDescricao: produto.descricao,
    responsavelId,
    responsavelNome: responsavel.nome,
    quantidade: novaQuantidade,
    // Manter a data original
  }

  entradas[entradaIndex] = entradaAtualizada
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entradas))

  return entradaAtualizada
}

// Função para excluir uma entrada
export const deleteEntrada = (id: string): boolean => {
  const entradas = getEntradas()
  const entrada = entradas.find((e) => e.id === id)

  if (!entrada) return false

  // Verificar se o produto existe
  const produto = getProdutoById(entrada.produtoId)
  if (!produto) return false

  // Atualizar o estoque do produto (remover a quantidade da entrada)
  const novoEstoque = Math.max(0, produto.estoque - entrada.quantidade)
  updateProduto(entrada.produtoId, { estoque: novoEstoque })

  const filteredEntradas = entradas.filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntradas))

  return true
}

// Função para obter uma entrada pelo ID
export const getEntradaById = (id: string): Entrada | null => {
  const entradas = getEntradas()
  return entradas.find((e) => e.id === id) || null
}

// Função para pesquisar entradas
export const searchEntradas = (query: string): Entrada[] => {
  if (!query) return getEntradas()

  const entradas = getEntradas()
  const lowerQuery = query.toLowerCase()

  return entradas.filter(
    (e) =>
      e.produtoDescricao.toLowerCase().includes(lowerQuery) || e.responsavelNome.toLowerCase().includes(lowerQuery),
  )
}

// Funções assíncronas para Supabase
export async function getEntradasSupabase(): Promise<Entrada[]> {
  const { data, error } = await supabase.from("entradas").select("*").order("data", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getEntradaByIdSupabase(id: string): Promise<Entrada | null> {
  const { data, error } = await supabase.from("entradas").select("*").eq("id", id).single()
  if (error) throw error
  return data
}

export async function addEntradaSupabase(entrada: Omit<Entrada, "id" | "createdAt">): Promise<Entrada> {
  const now = new Date().toISOString()
  const newEntrada = {
    ...entrada,
    id: crypto.randomUUID(),
    createdAt: now,
  }
  const { data, error } = await supabase.from("entradas").insert([newEntrada]).select()
  if (error) throw error
  return data[0]
}

export async function updateEntradaSupabase(id: string, dataUpdate: Partial<Omit<Entrada, "id" | "createdAt">>): Promise<Entrada | null> {
  const { data, error } = await supabase.from("entradas").update({ ...dataUpdate }).eq("id", id).select()
  if (error) throw error
  return data[0]
}

export async function deleteEntradaSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("entradas").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function getEntradasByProdutoIdSupabase(produtoId: string): Promise<Entrada[]> {
  const { data, error } = await supabase.from("entradas").select("*").eq("produtoId", produtoId).order("data", { ascending: false })
  if (error) throw error
  return data || []
}
