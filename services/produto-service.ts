"use client"

import { supabase } from "@/lib/supabase"

// Definição dos tipos de dados
export interface Produto {
  id: string
  descricao: string
  categoria: string
  unidade: string
  localizacao: string
  estoque: number
  produtosSimilares: string[] // IDs dos produtos similares
  veiculosCompativeis: string[] // IDs dos veículos compatíveis
  createdAt: string
  updatedAt: string
}

export interface Categoria {
  id: string
  nome: string
}

export interface Unidade {
  id: string
  nome: string
  sigla: string
}

export interface Localizacao {
  id: string
  nome: string
  setor: string
}

// Chaves para armazenar os dados no localStorage
const PRODUTOS_STORAGE_KEY = "produtos_data"
const CATEGORIAS_STORAGE_KEY = "categorias_data"
const UNIDADES_STORAGE_KEY = "unidades_data"
const LOCALIZACOES_STORAGE_KEY = "localizacoes_data"

// Função para gerar UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Funções para gerenciar produtos
export const getProdutos = (): Produto[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(PRODUTOS_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// Atualizar a função addProduto para inicializar o estoque com zero e arrays vazios
export const addProduto = (
  produto: Omit<Produto, "id" | "createdAt" | "updatedAt" | "estoque" | "produtosSimilares" | "veiculosCompativeis"> & { estoque?: number },
): Produto => {
  const produtos = getProdutos()

  const now = new Date().toISOString()
  const newProduto: Produto = {
    ...produto,
    estoque: typeof produto.estoque === 'number' ? produto.estoque : 0, // Usa o estoque informado ou zero
    produtosSimilares: [],
    veiculosCompativeis: [],
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  }

  produtos.push(newProduto)
  localStorage.setItem(PRODUTOS_STORAGE_KEY, JSON.stringify(produtos))

  return newProduto
}

export const updateProduto = (
  id: string,
  data: Partial<Omit<Produto, "id" | "createdAt" | "updatedAt">>,
): Produto | null => {
  const produtos = getProdutos()
  const index = produtos.findIndex((p) => p.id === id)

  if (index === -1) return null

  const updatedProduto = {
    ...produtos[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  produtos[index] = updatedProduto
  localStorage.setItem(PRODUTOS_STORAGE_KEY, JSON.stringify(produtos))

  return updatedProduto
}

export const deleteProduto = (id: string): boolean => {
  const produtos = getProdutos()

  // Remover o produto dos produtos similares de outros produtos
  produtos.forEach((produto) => {
    if (produto.produtosSimilares && produto.produtosSimilares.includes(id)) {
      produto.produtosSimilares = produto.produtosSimilares.filter((similarId) => similarId !== id)
    }
  })

  const filteredProdutos = produtos.filter((p) => p.id !== id)

  if (filteredProdutos.length === produtos.length) {
    return false // Nenhum item foi removido
  }

  localStorage.setItem(PRODUTOS_STORAGE_KEY, JSON.stringify(filteredProdutos))
  return true
}

export const getProdutoById = (id: string): Produto | null => {
  const produtos = getProdutos()
  return produtos.find((p) => p.id === id) || null
}

export const searchProdutos = (query: string): Produto[] => {
  if (!query) return getProdutos()

  const produtos = getProdutos()
  const lowerQuery = query.toLowerCase()

  return produtos.filter(
    (p) =>
      p.descricao.toLowerCase().includes(lowerQuery) ||
      p.categoria.toLowerCase().includes(lowerQuery) ||
      p.unidade.toLowerCase().includes(lowerQuery) ||
      p.localizacao.toLowerCase().includes(lowerQuery),
  )
}

// Função para gerenciar produtos similares
export const atualizarProdutosSimilares = (produtoId: string, produtosSimilaresIds: string[]): boolean => {
  const produtos = getProdutos()
  const produtoIndex = produtos.findIndex((p) => p.id === produtoId)

  if (produtoIndex === -1) return false

  // Primeiro, remover este produto da lista de similares de todos os produtos
  produtos.forEach((produto, index) => {
    if (produto.id !== produtoId && produto.produtosSimilares) {
      produtos[index].produtosSimilares = produto.produtosSimilares.filter((id) => id !== produtoId)
    }
  })

  // Atualizar a lista de produtos similares deste produto
  produtos[produtoIndex].produtosSimilares = produtosSimilaresIds

  // Adicionar este produto como similar para todos os produtos na nova lista
  produtosSimilaresIds.forEach((similarId) => {
    const similarIndex = produtos.findIndex((p) => p.id === similarId)
    if (similarIndex !== -1) {
      // Verificar se o produto já está na lista de similares
      if (!produtos[similarIndex].produtosSimilares) {
        produtos[similarIndex].produtosSimilares = []
      }

      if (!produtos[similarIndex].produtosSimilares.includes(produtoId)) {
        produtos[similarIndex].produtosSimilares.push(produtoId)
      }

      // Adicionar todos os outros produtos similares a este produto
      produtosSimilaresIds.forEach((otherSimilarId) => {
        if (otherSimilarId !== similarId && !produtos[similarIndex].produtosSimilares.includes(otherSimilarId)) {
          produtos[similarIndex].produtosSimilares.push(otherSimilarId)
        }
      })
    }
  })

  // Salvar as alterações
  localStorage.setItem(PRODUTOS_STORAGE_KEY, JSON.stringify(produtos))
  return true
}

// Função para gerenciar veículos compatíveis
export const atualizarVeiculosCompativeis = (produtoId: string, veiculosIds: string[]): boolean => {
  const produtos = getProdutos()
  const produtoIndex = produtos.findIndex((p) => p.id === produtoId)

  if (produtoIndex === -1) return false

  // Obter o produto atual
  const produto = produtos[produtoIndex]

  // Atualizar a lista de veículos compatíveis deste produto
  produtos[produtoIndex].veiculosCompativeis = veiculosIds

  // Propagar as alterações para todos os produtos similares
  if (produto.produtosSimilares && produto.produtosSimilares.length > 0) {
    produto.produtosSimilares.forEach((similarId) => {
      const similarIndex = produtos.findIndex((p) => p.id === similarId)
      if (similarIndex !== -1) {
        produtos[similarIndex].veiculosCompativeis = [...veiculosIds]
      }
    })
  }

  // Salvar as alterações
  localStorage.setItem(PRODUTOS_STORAGE_KEY, JSON.stringify(produtos))
  return true
}

// Função para obter veículos compatíveis por ID de produto
export const getVeiculosCompativeisIds = (produtoId: string): string[] => {
  const produto = getProdutoById(produtoId)
  if (!produto) return []
  return produto.veiculosCompativeis || []
}

// Nova função para obter produtos compatíveis com um veículo específico
export const getProdutosCompativeisComVeiculo = (veiculoId: string): Produto[] => {
  const produtos = getProdutos()
  return produtos.filter((produto) => produto.veiculosCompativeis && produto.veiculosCompativeis.includes(veiculoId))
}

// Função para obter produtos da mesma categoria
export const getProdutosMesmaCategoria = (categoriaId: string, excluirProdutoId?: string): Produto[] => {
  const produtos = getProdutos()
  return produtos.filter((p) => p.categoria === categoriaId && p.id !== excluirProdutoId)
}

// Função para obter produtos similares
export const getProdutosSimilares = (produtoId: string): Produto[] => {
  const produtos = getProdutos()
  const produto = produtos.find((p) => p.id === produtoId)

  if (!produto || !produto.produtosSimilares || produto.produtosSimilares.length === 0) {
    return []
  }

  return produtos.filter((p) => produto.produtosSimilares.includes(p.id))
}

// Função para obter veículos compatíveis
export const getVeiculosCompativeis = (produtoId: string): string[] => {
  const produto = getProdutoById(produtoId)
  return produto?.veiculosCompativeis || []
}

// Funções para gerenciar categorias
export const getCategorias = (): Categoria[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(CATEGORIAS_STORAGE_KEY)
  const categorias = data ? JSON.parse(data) : []

  // Se não houver categorias, adicionar algumas padrão
  if (categorias.length === 0) {
    const defaultCategorias = [
      { id: generateUUID(), nome: "Peças Automotivas" },
      { id: generateUUID(), nome: "Material de Escritório" },
      { id: generateUUID(), nome: "Ferramentas" },
      { id: generateUUID(), nome: "Equipamentos de Proteção" },
      { id: generateUUID(), nome: "Produtos de Limpeza" },
    ]
    localStorage.setItem(CATEGORIAS_STORAGE_KEY, JSON.stringify(defaultCategorias))
    return defaultCategorias
  }

  return categorias
}

export const getCategoriaById = (id: string): Categoria | null => {
  const categorias = getCategorias()
  return categorias.find((c) => c.id === id) || null
}

export const addCategoria = (nome: string): Categoria => {
  const categorias = getCategorias()

  // Verificar se já existe uma categoria com este nome
  if (categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
    throw new Error("Já existe uma categoria com este nome")
  }

  const newCategoria: Categoria = {
    id: generateUUID(),
    nome,
  }

  categorias.push(newCategoria)
  localStorage.setItem(CATEGORIAS_STORAGE_KEY, JSON.stringify(categorias))

  return newCategoria
}

export const deleteCategoria = (id: string): boolean => {
  const categorias = getCategorias()
  const filteredCategorias = categorias.filter((c) => c.id !== id)

  if (filteredCategorias.length === categorias.length) {
    return false // Nenhum item foi removido
  }

  localStorage.setItem(CATEGORIAS_STORAGE_KEY, JSON.stringify(filteredCategorias))
  return true
}

// Funções para gerenciar unidades
export const getUnidades = (): Unidade[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(UNIDADES_STORAGE_KEY)
  const unidades = data ? JSON.parse(data) : []

  // Se não houver unidades, adicionar algumas padrão
  if (unidades.length === 0) {
    const defaultUnidades = [
      { id: generateUUID(), nome: "Unidade", sigla: "UN" },
      { id: generateUUID(), nome: "Caixa", sigla: "CX" },
      { id: generateUUID(), nome: "Pacote", sigla: "PCT" },
      { id: generateUUID(), nome: "Litro", sigla: "L" },
      { id: generateUUID(), nome: "Quilograma", sigla: "KG" },
      { id: generateUUID(), nome: "Metro", sigla: "M" },
      { id: generateUUID(), nome: "Par", sigla: "PAR" },
    ]
    localStorage.setItem(UNIDADES_STORAGE_KEY, JSON.stringify(defaultUnidades))
    return defaultUnidades
  }

  return unidades
}

export const getUnidadeById = (id: string): Unidade | null => {
  const unidades = getUnidades()
  return unidades.find((u) => u.id === id) || null
}

export const addUnidade = (nome: string, sigla: string): Unidade => {
  const unidades = getUnidades()

  // Verificar se já existe uma unidade com este nome ou sigla
  if (
    unidades.some((u) => u.nome.toLowerCase() === nome.toLowerCase() || u.sigla.toLowerCase() === sigla.toLowerCase())
  ) {
    throw new Error("Já existe uma unidade com este nome ou sigla")
  }

  const newUnidade: Unidade = {
    id: generateUUID(),
    nome,
    sigla,
  }

  unidades.push(newUnidade)
  localStorage.setItem(UNIDADES_STORAGE_KEY, JSON.stringify(unidades))

  return newUnidade
}

export const deleteUnidade = (id: string): boolean => {
  const unidades = getUnidades()
  const filteredUnidades = unidades.filter((u) => u.id !== id)

  if (filteredUnidades.length === unidades.length) {
    return false // Nenhum item foi removido
  }

  localStorage.setItem(UNIDADES_STORAGE_KEY, JSON.stringify(filteredUnidades))
  return true
}

// Funções para gerenciar localizações
export const getLocalizacoes = (): Localizacao[] => {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(LOCALIZACOES_STORAGE_KEY)
  const localizacoes = data ? JSON.parse(data) : []

  // Se não houver localizações, adicionar algumas padrão
  if (localizacoes.length === 0) {
    const defaultLocalizacoes = [
      { id: generateUUID(), nome: "Almoxarifado Central", setor: "Almoxarifado" },
      { id: generateUUID(), nome: "Depósito 1", setor: "Almoxarifado" },
      { id: generateUUID(), nome: "Depósito 2", setor: "Almoxarifado" },
      { id: generateUUID(), nome: "Garagem", setor: "Transporte" },
      { id: generateUUID(), nome: "Oficina", setor: "Manutenção" },
    ]
    localStorage.setItem(LOCALIZACOES_STORAGE_KEY, JSON.stringify(defaultLocalizacoes))
    return defaultLocalizacoes
  }

  return localizacoes
}

export const getLocalizacaoById = (id: string): Localizacao | null => {
  const localizacoes = getLocalizacoes()
  return localizacoes.find((l) => l.id === id) || null
}

export const addLocalizacao = (nome: string, setor: string): Localizacao => {
  const localizacoes = getLocalizacoes()

  // Verificar se já existe uma localização com este nome
  if (
    localizacoes.some(
      (l) => l.nome.toLowerCase() === nome.toLowerCase() && l.setor.toLowerCase() === setor.toLowerCase(),
    )
  ) {
    throw new Error("Já existe uma localização com este nome neste setor")
  }

  const newLocalizacao: Localizacao = {
    id: generateUUID(),
    nome,
    setor,
  }

  localizacoes.push(newLocalizacao)
  localStorage.setItem(LOCALIZACOES_STORAGE_KEY, JSON.stringify(localizacoes))

  return newLocalizacao
}

export const deleteLocalizacao = (id: string): boolean => {
  const localizacoes = getLocalizacoes()
  const filteredLocalizacoes = localizacoes.filter((l) => l.id !== id)

  if (filteredLocalizacoes.length === localizacoes.length) {
    return false // Nenhum item foi removido
  }

  localStorage.setItem(LOCALIZACOES_STORAGE_KEY, JSON.stringify(filteredLocalizacoes))
  return true
}

export const updateProdutoEstoque = (produtoId: string, quantidade: number): boolean => {
  const produtos = getProdutos()
  const index = produtos.findIndex((p) => p.id === produtoId)

  if (index === -1) return false

  const updatedProduto = {
    ...produtos[index],
    estoque: produtos[index].estoque + quantidade,
    updatedAt: new Date().toISOString(),
  }

  produtos[index] = updatedProduto
  localStorage.setItem(PRODUTOS_STORAGE_KEY, JSON.stringify(produtos))

  return true
}

// Funções assíncronas para Supabase
export async function getProdutosSupabase(): Promise<Produto[]> {
  try {
    let allProducts: Produto[] = []
    let from = 0
    const batchSize = 1000
    
    while (true) {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("descricao")
        .range(from, from + batchSize - 1)
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        break
      }
      
      allProducts = allProducts.concat(data)
      
      // Se retornou menos que o batch size, chegamos ao final
      if (data.length < batchSize) {
        break
      }
      
      from += batchSize
    }
    
    return allProducts
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    throw error
  }
}

export async function getProdutoByIdSupabase(id: string): Promise<Produto | null> {
  const { data, error } = await supabase.from("produtos").select("*").eq("id", id).single()
  if (error) throw error
  return data
}

export async function addProdutoSupabase(produto: Omit<Produto, "id" | "createdAt" | "updatedAt" | "estoque"> & { produtosSimilares?: string[]; veiculosCompativeis?: string[] }): Promise<Produto> {
  const now = new Date().toISOString()
  const newProduto = {
    ...produto,
    id: crypto.randomUUID(),
    estoque: 0,
    produtosSimilares: produto.produtosSimilares || [],
    veiculosCompativeis: produto.veiculosCompativeis || [],
    createdAt: now,
    updatedAt: now,
  }
  const { data, error } = await supabase.from("produtos").insert([newProduto]).select()
  if (error) throw error
  return data[0]
}

export async function updateProdutoSupabase(id: string, dataUpdate: Partial<Omit<Produto, "id" | "createdAt" | "updatedAt">>): Promise<Produto | null> {
  const { data, error } = await supabase.from("produtos").update({ ...dataUpdate, updatedAt: new Date().toISOString() }).eq("id", id).select()
  if (error) throw error
  return data[0]
}

export async function deleteProdutoSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("produtos").delete().eq("id", id)
  if (error) throw error
  return true
}

// Funções auxiliares para categorias, unidades e localizações no Supabase

// Categorias
export async function getCategoriasSupabase(): Promise<Categoria[]> {
  const { data, error } = await supabase.from("categorias").select("*").order("nome")
  if (error) throw error
  return data || []
}

export async function addCategoriaSupabase(nome: string): Promise<Categoria> {
  const { data, error } = await supabase.from("categorias").insert([{ nome }]).select()
  if (error) throw error
  return data[0]
}

export async function updateCategoriaSupabase(id: string, nome: string): Promise<Categoria | null> {
  // Primeiro, obter o nome atual da categoria
  const { data: categoriaAtual, error: errorCategoria } = await supabase
    .from("categorias")
    .select("nome")
    .eq("id", id)
    .single();
  
  if (errorCategoria) throw errorCategoria;
  
  // Atualizar a categoria
  const { data, error } = await supabase.from("categorias").update({ nome }).eq("id", id).select();
  if (error) throw error;
  
  // Atualizar todos os produtos que usam esta categoria
  if (categoriaAtual && categoriaAtual.nome !== nome) {
    const { error: errorProdutos } = await supabase
      .from("produtos")
      .update({ categoria: nome, updatedAt: new Date().toISOString() })
      .eq("categoria", categoriaAtual.nome);
    
    if (errorProdutos) {
      console.error("Erro ao atualizar produtos com a categoria:", errorProdutos);
      // Não lançamos o erro aqui para não interromper o fluxo principal
    }
  }
  
  return data[0];
}

export async function deleteCategoriaSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("categorias").delete().eq("id", id)
  if (error) throw error
  return true
}

// Unidades
export async function getUnidadesSupabase(): Promise<Unidade[]> {
  const { data, error } = await supabase.from("unidades").select("*").order("nome")
  if (error) throw error
  return data || []
}

export async function addUnidadeSupabase(nome: string, sigla: string): Promise<Unidade> {
  const { data, error } = await supabase.from("unidades").insert([{ nome, sigla }]).select()
  if (error) throw error
  return data[0]
}

export async function updateUnidadeSupabase(id: string, nome: string, sigla: string): Promise<Unidade | null> {
  // Primeiro, obter o nome atual da unidade
  const { data: unidadeAtual, error: errorUnidade } = await supabase
    .from("unidades")
    .select("nome")
    .eq("id", id)
    .single();
  
  if (errorUnidade) throw errorUnidade;
  
  // Atualizar a unidade
  const { data, error } = await supabase.from("unidades").update({ nome, sigla }).eq("id", id).select();
  if (error) throw error;
  
  // Atualizar todos os produtos que usam esta unidade
  if (unidadeAtual && unidadeAtual.nome !== nome) {
    const { error: errorProdutos } = await supabase
      .from("produtos")
      .update({ unidade: nome, updatedAt: new Date().toISOString() })
      .eq("unidade", unidadeAtual.nome);
    
    if (errorProdutos) {
      console.error("Erro ao atualizar produtos com a unidade:", errorProdutos);
      // Não lançamos o erro aqui para não interromper o fluxo principal
    }
  }
  
  return data[0];
}

export async function deleteUnidadeSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("unidades").delete().eq("id", id)
  if (error) throw error
  return true
}

// Localizações
export async function getLocalizacoesSupabase(): Promise<Localizacao[]> {
  const { data, error } = await supabase.from("localizacoes").select("*").order("nome")
  if (error) throw error
  return data || []
}

export async function addLocalizacaoSupabase(nome: string, setor: string): Promise<Localizacao> {
  const { data, error } = await supabase.from("localizacoes").insert([{ nome, setor }]).select()
  if (error) throw error
  return data[0]
}

export async function updateLocalizacaoSupabase(id: string, nome: string, setor: string): Promise<Localizacao | null> {
  // Primeiro, obter o nome atual da localização
  const { data: localizacaoAtual, error: errorLocalizacao } = await supabase
    .from("localizacoes")
    .select("nome")
    .eq("id", id)
    .single();
  
  if (errorLocalizacao) throw errorLocalizacao;
  
  // Atualizar a localização
  const { data, error } = await supabase.from("localizacoes").update({ nome, setor }).eq("id", id).select();
  if (error) throw error;
  
  // Atualizar todos os produtos que usam esta localização
  if (localizacaoAtual && localizacaoAtual.nome !== nome) {
    const { error: errorProdutos } = await supabase
      .from("produtos")
      .update({ localizacao: nome, updatedAt: new Date().toISOString() })
      .eq("localizacao", localizacaoAtual.nome);
    
    if (errorProdutos) {
      console.error("Erro ao atualizar produtos com a localização:", errorProdutos);
      // Não lançamos o erro aqui para não interromper o fluxo principal
    }
  }
  
  return data[0];
}

export async function deleteLocalizacaoSupabase(id: string): Promise<boolean> {
  const { error } = await supabase.from("localizacoes").delete().eq("id", id)
  if (error) throw error
  return true
}

// Função para obter produtos compatíveis com um veículo específico no Supabase
export async function getProdutosCompativeisComVeiculoSupabase(veiculoId: string): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .contains("veiculosCompativeis", [veiculoId])
    .order("descricao")
  if (error) throw error
  return data || []
}
