"use client"

import { supabase } from "@/lib/supabase"

// Definição do tipo de dados para Veículo
export interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  ano: number
  cor: string
  tipo: string
  chassi: string
  renavam: string
  combustivel: string
  medicao: "Horimetro" | "Hodometro"
  periodoTrocaOleo: number
  status: "Ativo" | "Inativo"
  secretaria: string
  createdAt: string
  updatedAt: string
  kmAtual: number
  kmProxTroca: number
}

// Definição do tipo de dados para Histórico de Troca de Óleo
export interface HistoricoTrocaOleo {
  id: string
  veiculoId: string
  data: string // ISO string
  tipo: string // "Troca de Óleo" ou "Atualização de Km"
  kmAnterior?: number
  kmAtual: number
  kmProxTroca?: number
  observacao?: string
  createdAt: string
  updatedAt: string
}

// Chave para armazenar os dados no localStorage
const STORAGE_KEY = "veiculos_data"

// Função para gerar um ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

// Função para obter todos os veículos
export const getVeiculos = (): Veiculo[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// Função para adicionar um novo veículo
export const addVeiculo = (veiculo: Omit<Veiculo, "id" | "createdAt" | "updatedAt">): Veiculo => {
  const veiculos = getVeiculos()

  const now = new Date().toISOString()
  const newVeiculo: Veiculo = {
    ...veiculo,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  veiculos.push(newVeiculo)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(veiculos))

  return newVeiculo
}

// Função para atualizar um veículo existente
export const updateVeiculo = (
  id: string,
  data: Partial<Omit<Veiculo, "id" | "createdAt" | "updatedAt">>,
): Veiculo | null => {
  const veiculos = getVeiculos()
  const index = veiculos.findIndex((v) => v.id === id)

  if (index === -1) return null

  const updatedVeiculo = {
    ...veiculos[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  veiculos[index] = updatedVeiculo
  localStorage.setItem(STORAGE_KEY, JSON.stringify(veiculos))

  return updatedVeiculo
}

// Função para excluir um veículo
export const deleteVeiculo = (id: string): boolean => {
  const veiculos = getVeiculos()
  const filteredVeiculos = veiculos.filter((v) => v.id !== id)

  if (filteredVeiculos.length === veiculos.length) {
    return false // Nenhum item foi removido
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredVeiculos))
  return true
}

// Função para obter um veículo pelo ID
export const getVeiculoById = (id: string): Veiculo | null => {
  const veiculos = getVeiculos()
  return veiculos.find((v) => v.id === id) || null
}

// Função para pesquisar veículos
export const searchVeiculos = (query: string): Veiculo[] => {
  if (!query) return getVeiculos()

  const veiculos = getVeiculos()
  const lowerQuery = query.toLowerCase()

  return veiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(lowerQuery) ||
      v.modelo.toLowerCase().includes(lowerQuery) ||
      v.marca.toLowerCase().includes(lowerQuery) ||
      v.tipo.toLowerCase().includes(lowerQuery) ||
      v.secretaria.toLowerCase().includes(lowerQuery) ||
      v.ano.toString().includes(lowerQuery),
  )
}

// Função para obter todos os veículos do Supabase
export async function getVeiculosSupabase(): Promise<Veiculo[]> {
  const { data, error } = await supabase.from("veiculos").select("*").order("placa")
  if (error) throw error
  return data || []
}

// Função para obter um veículo por ID do Supabase
export async function getVeiculoByIdSupabase(id: string): Promise<Veiculo | null> {
  const { data, error } = await supabase.from("veiculos").select("*").eq("id", id).single()
  if (error) return null
  return data
}

// Função para adicionar um novo veículo no Supabase
export async function addVeiculoSupabase(veiculo: Omit<Veiculo, "id" | "createdAt" | "updatedAt">): Promise<Veiculo> {
  const now = new Date().toISOString()
  const newVeiculo = {
    ...veiculo,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  const { data, error } = await supabase.from("veiculos").insert([newVeiculo]).select()
  if (error) throw error
  return data[0]
}

// Função para atualizar um veículo existente no Supabase
export async function updateVeiculoSupabase(id: string, dataUpdate: Partial<Omit<Veiculo, "id" | "createdAt" | "updatedAt">>): Promise<Veiculo | null> {
  const { data, error } = await supabase.from("veiculos").update({ ...dataUpdate, updatedAt: new Date().toISOString() }).eq("id", id).select()
  if (error) throw error
  return data[0]
}

// Função para excluir um veículo do Supabase
export async function deleteVeiculoSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("veiculos").delete().eq("id", id)
  if (error) throw error
  return true
}

// --- SUPABASE: Histórico de Troca de Óleo ---

// Buscar histórico de troca de óleo de um veículo
export async function getHistoricoTrocaOleoSupabase(veiculoId: string): Promise<HistoricoTrocaOleo[]> {
  const { data, error } = await supabase
    .from("historico_troca_oleo")
    .select("*")
    .eq("veiculoid", veiculoId)
    .order("data", { ascending: false })
  if (error) throw error
  
  console.log("Dados brutos do histórico:", data);
  
  // Mapear os campos do formato do banco para o formato da interface
  const mappedData = (data || []).map(item => ({
    id: item.id,
    veiculoId: item.veiculoid,
    data: item.data,
    tipo: item.tipo,
    kmAnterior: item.kmanterior,
    kmAtual: item.kmatual,
    kmProxTroca: item.kmproxtroca,
    observacao: item.observacao,
    createdAt: item.createdat,
    updatedAt: item.updatedat
  }));
  
  console.log("Dados mapeados do histórico:", mappedData);
  
  return mappedData;
}

// Adicionar novo registro de histórico
export async function addHistoricoTrocaOleoSupabase(item: any): Promise<any> {
  const now = new Date().toISOString();
  const newItem = {
    ...item,
    id: crypto.randomUUID(),
    createdat: now,
    updatedat: now,
  };
  const { data, error } = await supabase.from("historico_troca_oleo").insert([newItem]).select();
  if (error) throw error;
  return data[0];
}

// Atualizar registro de histórico
export async function updateHistoricoTrocaOleoSupabase(id: string, dataUpdate: Partial<Omit<HistoricoTrocaOleo, "id" | "createdAt" | "updatedAt">>): Promise<HistoricoTrocaOleo | null> {
  // Mapeamento camelCase -> snake_case para o Supabase
  const mapToSnakeCase = (data: any) => ({
    ...data,
    km_atual: data.kmAtual,
    km_anterior: data.kmAnterior,
    km_prox_troca: data.kmProxTroca,
    veiculoid: data.veiculoId,
    createdat: data.createdAt,
    updatedat: new Date().toISOString(),
  });
  const { data, error } = await supabase
    .from("historico_troca_oleo")
    .update(mapToSnakeCase(dataUpdate))
    .eq("id", id)
    .select()
  if (error) throw error
  return data[0]
}

// Excluir registro de histórico
export async function deleteHistoricoTrocaOleoSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("historico_troca_oleo").delete().eq("id", id)
  if (error) throw error
  return true
}
