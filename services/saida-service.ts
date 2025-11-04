"use client"

import { v4 as uuidv4 } from "uuid"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { getProdutoById, updateProdutoEstoque } from "./produto-service"
import { getColaboradorById } from "./colaborador-service"
import { getVeiculoById } from "./veiculo-service"
import { supabase } from "@/lib/supabase"

// Tipo para Saída
export interface Saida {
  id: string
  produtoId: string
  produtoNome: string
  categoria: string
  quantidade: number
  valorUnitario?: number
  data: string
  responsavelId: string
  responsavelNome: string
  veiculoId: string
  veiculoPlaca: string
  veiculoModelo: string
  observacao?: string
  historicoId?: string
  createdAt: string
  updatedAt: string
}

// Tipo para dados de entrada do formulário
export interface SaidaFormData {
  produtoId: string
  quantidade: number
  data: string
  responsavelId: string
  veiculoId: string
  observacao?: string
  historicoId?: string
}

// Armazenamento local
const STORAGE_KEY = "saidas_data"

// Função para obter todas as saídas
export const getSaidas = (): Saida[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    // Dados de exemplo
    const exampleData: Saida[] = [
      {
        id: uuidv4(),
        produtoId: "1",
        produtoNome: "Óleo de Motor 5W30",
        categoria: "Manutenção",
        quantidade: 5,
        data: new Date().toISOString(),
        responsavelId: "1",
        responsavelNome: "João Silva",
        veiculoId: "1",
        veiculoPlaca: "ABC-1234",
        veiculoModelo: "Gol",
        observacao: "Saída para manutenção preventiva",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        produtoId: "2",
        produtoNome: "Filtro de Ar",
        categoria: "Troca",
        quantidade: 2,
        data: new Date(Date.now() - 86400000).toISOString(), // Ontem
        responsavelId: "2",
        responsavelNome: "Maria Oliveira",
        veiculoId: "2",
        veiculoPlaca: "DEF-5678",
        veiculoModelo: "Palio",
        observacao: "Troca de filtros",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exampleData))
    return exampleData
  }

  return JSON.parse(data)
}

// Obter saída por ID
export const getSaidaById = (id: string): Saida | undefined => {
  const saidas = getSaidas()
  return saidas.find((saida) => saida.id === id)
}

// Adicionar nova saída
export const addSaida = async (data: SaidaFormData): Promise<Saida> => {
  const saidas = getSaidas()

  // Verificar se o produto existe
  const produto = getProdutoById(data.produtoId)
  if (!produto) {
    throw new Error("Produto não encontrado")
  }

  // Verificar se há estoque suficiente
  if (produto.estoque < data.quantidade) {
    throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque}`)
  }

  // Obter dados do responsável
  const responsavel = await getColaboradorById(data.responsavelId)
  if (!responsavel) {
    throw new Error("Responsável não encontrado")
  }

  // Obter dados do veículo
  const veiculo = getVeiculoById(data.veiculoId)
  if (!veiculo) {
    throw new Error("Veículo não encontrado")
  }

  // Atualizar estoque do produto
  updateProdutoEstoque(data.produtoId, -data.quantidade)

  // Criar nova saída
  const newSaida: Saida = {
    id: uuidv4(),
    produtoId: data.produtoId,
    produtoNome: produto.descricao, // Alterado de produto.nome para produto.descricao
    categoria: produto.categoria,
    quantidade: data.quantidade,
    data: data.data,
    responsavelId: data.responsavelId,
    responsavelNome: responsavel.nome,
    veiculoId: data.veiculoId,
    veiculoPlaca: veiculo.placa,
    veiculoModelo: veiculo.modelo,
    observacao: data.observacao,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  saidas.push(newSaida)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saidas))

  return newSaida
}

// Atualizar saída existente
export const updateSaida = async (id: string, data: SaidaFormData): Promise<Saida> => {
  const saidas = getSaidas()
  const index = saidas.findIndex((saida) => saida.id === id)

  if (index === -1) {
    throw new Error("Saída não encontrada")
  }

  const oldSaida = saidas[index]

  // Verificar se o produto existe
  const produto = getProdutoById(data.produtoId)
  if (!produto) {
    throw new Error("Produto não encontrado")
  }

  // Calcular diferença de quantidade para atualizar o estoque
  const quantityDiff = data.quantidade - oldSaida.quantidade

  // Se o produto for o mesmo, verificar se há estoque suficiente para a diferença
  if (data.produtoId === oldSaida.produtoId && quantityDiff > 0) {
    if (produto.estoque < quantityDiff) {
      throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque}`)
    }
    // Atualizar estoque do produto
    updateProdutoEstoque(data.produtoId, -quantityDiff)
  } else if (data.produtoId !== oldSaida.produtoId) {
    // Se o produto for diferente, devolver o estoque do produto antigo
    updateProdutoEstoque(oldSaida.produtoId, oldSaida.quantidade)

    // E verificar se há estoque suficiente do novo produto
    if (produto.estoque < data.quantidade) {
      throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque}`)
    }
    // Atualizar estoque do novo produto
    updateProdutoEstoque(data.produtoId, -data.quantidade)
  }

  // Obter dados do responsável
  const responsavel = await getColaboradorById(data.responsavelId)
  if (!responsavel) {
    throw new Error("Responsável não encontrado")
  }

  // Obter dados do veículo
  const veiculo = getVeiculoById(data.veiculoId)
  if (!veiculo) {
    throw new Error("Veículo não encontrado")
  }

  // Atualizar saída
  const updatedSaida: Saida = {
    ...oldSaida,
    produtoId: data.produtoId,
    produtoNome: produto.descricao, // Alterado de produto.nome para produto.descricao
    categoria: produto.categoria,
    quantidade: data.quantidade,
    data: data.data,
    responsavelId: data.responsavelId,
    responsavelNome: responsavel.nome,
    veiculoId: data.veiculoId,
    veiculoPlaca: veiculo.placa,
    veiculoModelo: veiculo.modelo,
    observacao: data.observacao,
    updatedAt: new Date().toISOString(),
  }

  saidas[index] = updatedSaida
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saidas))

  return updatedSaida
}

// Excluir saída
export const deleteSaida = async (id: string): Promise<void> => {
  const saidas = getSaidas()
  const index = saidas.findIndex((saida) => saida.id === id)

  if (index === -1) {
    throw new Error("Saída não encontrada")
  }

  const saida = saidas[index]

  // Devolver a quantidade ao estoque
  updateProdutoEstoque(saida.produtoId, saida.quantidade)

  // Remover saída
  saidas.splice(index, 1)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saidas))
}

// Pesquisar saídas
export const searchSaidas = (query: string): Saida[] => {
  const saidas = getSaidas()

  if (!query.trim()) return saidas

  const searchTerm = query.toLowerCase()
  return saidas.filter(
    (saida) =>
      saida.produtoNome.toLowerCase().includes(searchTerm) ||
      saida.responsavelNome.toLowerCase().includes(searchTerm) ||
      saida.veiculoPlaca.toLowerCase().includes(searchTerm) ||
      saida.veiculoModelo.toLowerCase().includes(searchTerm) ||
      (saida.observacao && saida.observacao.toLowerCase().includes(searchTerm)),
  )
}

// Filtrar saídas por data
export const filterSaidasByDate = (filter: "today" | "week" | "month"): Saida[] => {
  const saidas = getSaidas()
  const now = new Date()

  let start: Date
  let end: Date

  switch (filter) {
    case "today":
      start = startOfDay(now)
      end = endOfDay(now)
      break
    case "week":
      start = startOfWeek(now, { weekStartsOn: 0 }) // 0 = domingo
      end = endOfWeek(now, { weekStartsOn: 0 })
      break
    case "month":
      start = startOfMonth(now)
      end = endOfMonth(now)
      break
    default:
      return saidas
  }

  return saidas.filter((saida) => {
    const saidaDate = new Date(saida.data)
    return isWithinInterval(saidaDate, { start, end })
  })
}

// Funções assíncronas para Supabase
export async function getSaidasSupabase(): Promise<Saida[]> {
  const { data, error } = await supabase.from("saidas").select("*").order("data", { ascending: false })
  if (error) throw error
  const rows = data || []
  return rows.map((row: any) => ({
    id: row.id,
    produtoId: row.produtoId,
    produtoNome: row.produtoNome,
    categoria: row.categoria,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario ?? undefined,
    data: row.data,
    responsavelId: row.responsavelId,
    responsavelNome: row.responsavelNome,
    veiculoId: row.veiculoId,
    veiculoPlaca: row.veiculoPlaca,
    veiculoModelo: row.veiculoModelo,
    observacao: row.observacao ?? undefined,
    historicoId: row.historicoId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))
}

export async function getSaidaByIdSupabase(id: string): Promise<Saida | null> {
  const { data, error } = await supabase.from("saidas").select("*").eq("id", id).single()
  if (error) throw error
  const row: any = data
  return {
    id: row.id,
    produtoId: row.produtoId,
    produtoNome: row.produtoNome,
    categoria: row.categoria,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario ?? undefined,
    data: row.data,
    responsavelId: row.responsavelId,
    responsavelNome: row.responsavelNome,
    veiculoId: row.veiculoId,
    veiculoPlaca: row.veiculoPlaca,
    veiculoModelo: row.veiculoModelo,
    observacao: row.observacao ?? undefined,
    historicoId: row.historicoId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function addSaidaSupabase(saida: Omit<Saida, "id" | "createdAt" | "updatedAt">): Promise<Saida> {
  const now = new Date().toISOString()
  const newSaida = {
    id: crypto.randomUUID(),
    produtoId: saida.produtoId,
    produtoNome: saida.produtoNome,
    categoria: saida.categoria,
    quantidade: saida.quantidade,
    valor_unitario: saida.valorUnitario ?? null,
    data: saida.data,
    responsavelId: saida.responsavelId,
    responsavelNome: saida.responsavelNome,
    veiculoId: saida.veiculoId,
    veiculoPlaca: saida.veiculoPlaca,
    veiculoModelo: saida.veiculoModelo,
    observacao: saida.observacao ?? null,
    historicoId: saida.historicoId ?? null,
    createdAt: now,
    updatedAt: now,
  }
  const { data, error } = await supabase.from("saidas").insert([newSaida]).select("*")
  if (error) throw error
  const row: any = data[0]
  return {
    id: row.id,
    produtoId: row.produtoId,
    produtoNome: row.produtoNome,
    categoria: row.categoria,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario ?? undefined,
    data: row.data,
    responsavelId: row.responsavelId,
    responsavelNome: row.responsavelNome,
    veiculoId: row.veiculoId,
    veiculoPlaca: row.veiculoPlaca,
    veiculoModelo: row.veiculoModelo,
    observacao: row.observacao ?? undefined,
    historicoId: row.historicoId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function updateSaidaSupabase(id: string, dataUpdate: Partial<Omit<Saida, "id" | "createdAt" | "updatedAt">>): Promise<Saida | null> {
  const dbUpdate: any = { ...dataUpdate, updatedAt: new Date().toISOString() }
  if ("valorUnitario" in dbUpdate) {
    dbUpdate.valor_unitario = dbUpdate.valorUnitario ?? null
    delete dbUpdate.valorUnitario
  }
  const { data, error } = await supabase.from("saidas").update(dbUpdate).eq("id", id).select("*")
  if (error) throw error
  const row: any = data[0]
  if (!row) return null
  return {
    id: row.id,
    produtoId: row.produtoId,
    produtoNome: row.produtoNome,
    categoria: row.categoria,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario ?? undefined,
    data: row.data,
    responsavelId: row.responsavelId,
    responsavelNome: row.responsavelNome,
    veiculoId: row.veiculoId,
    veiculoPlaca: row.veiculoPlaca,
    veiculoModelo: row.veiculoModelo,
    observacao: row.observacao ?? undefined,
    historicoId: row.historicoId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function deleteSaidaSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("saidas").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function getSaidasByProdutoIdSupabase(produtoId: string): Promise<Saida[]> {
  const { data, error } = await supabase.from("saidas").select("*").eq("produtoId", produtoId).order("data", { ascending: false })
  if (error) throw error
  const rows = data || []
  return rows.map((row: any) => ({
    id: row.id,
    produtoId: row.produtoId,
    produtoNome: row.produtoNome,
    categoria: row.categoria,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario ?? undefined,
    data: row.data,
    responsavelId: row.responsavelId,
    responsavelNome: row.responsavelNome,
    veiculoId: row.veiculoId,
    veiculoPlaca: row.veiculoPlaca,
    veiculoModelo: row.veiculoModelo,
    observacao: row.observacao ?? undefined,
    historicoId: row.historicoId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))
}

export async function getSaidasByVeiculoAndDataSupabase(veiculoId: string, data: string): Promise<Saida[]> {
  // data deve estar no formato YYYY-MM-DD
  const { data: saidas, error } = await supabase
    .from("saidas")
    .select("*")
    .eq("veiculoId", veiculoId)
    .like("data", `${data}%`)
    .order("data", { ascending: false })
  if (error) throw error
  return saidas || []
}

export async function getSaidasByHistoricoIdSupabase(historicoId: string): Promise<Saida[]> {
  const { data, error } = await supabase.from("saidas").select("*").eq("historicoId", historicoId).order("data", { ascending: false })
  if (error) throw error
  return data || []
}
