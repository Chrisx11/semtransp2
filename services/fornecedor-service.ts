import { v4 as uuidv4 } from "uuid"

export interface Fornecedor {
  id: string
  nome: string
  endereco: string
  telefone: string
  createdAt: Date
  updatedAt: Date
}

// Chave para armazenar os dados no localStorage
const FORNECEDORES_STORAGE_KEY = "fornecedores_data"

// Obter todos os fornecedores
export async function getFornecedores(): Promise<Fornecedor[]> {
  return getFornecedoresLocal()
}

// Função para obter fornecedores do localStorage
function getFornecedoresLocal(): Fornecedor[] {
  if (typeof window === "undefined") return []
  
  const data = localStorage.getItem(FORNECEDORES_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// Obter um fornecedor pelo ID
export async function getFornecedorById(id: string): Promise<Fornecedor | null> {
  return getFornecedorByIdLocal(id)
}

// Função para obter um fornecedor pelo ID do localStorage
function getFornecedorByIdLocal(id: string): Fornecedor | null {
  const fornecedores = getFornecedoresLocal()
  return fornecedores.find(f => f.id === id) || null
}

// Criar um novo fornecedor
export async function createFornecedor(data: Omit<Fornecedor, "id" | "createdAt" | "updatedAt">): Promise<Fornecedor | null> {
  try {
    console.log("Criando fornecedor:", data);
    return createFornecedorLocal(data)
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    throw error;
  }
}

// Função para criar um fornecedor no localStorage
function createFornecedorLocal(data: Omit<Fornecedor, "id" | "createdAt" | "updatedAt">): Fornecedor {
  const fornecedores = getFornecedoresLocal()
  const id = uuidv4()
  const now = new Date()
  
  const newFornecedor = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  }
  
  fornecedores.push(newFornecedor)
  localStorage.setItem(FORNECEDORES_STORAGE_KEY, JSON.stringify(fornecedores))
  
  return newFornecedor
}

// Atualizar um fornecedor
export async function updateFornecedor(
  id: string,
  data: Partial<Omit<Fornecedor, "id" | "createdAt" | "updatedAt">>
): Promise<Fornecedor | null> {
  return updateFornecedorLocal(id, data)
}

// Função para atualizar um fornecedor no localStorage
function updateFornecedorLocal(
  id: string,
  data: Partial<Omit<Fornecedor, "id" | "createdAt" | "updatedAt">>
): Fornecedor | null {
  const fornecedores = getFornecedoresLocal()
  const index = fornecedores.findIndex(f => f.id === id)
  
  if (index === -1) return null
  
  const now = new Date()
  
  fornecedores[index] = {
    ...fornecedores[index],
    ...data,
    updatedAt: now
  }
  
  localStorage.setItem(FORNECEDORES_STORAGE_KEY, JSON.stringify(fornecedores))
  
  return fornecedores[index]
}

// Excluir um fornecedor
export async function deleteFornecedor(id: string): Promise<boolean> {
  return deleteFornecedorLocal(id)
}

// Função para excluir um fornecedor do localStorage
function deleteFornecedorLocal(id: string): boolean {
  const fornecedores = getFornecedoresLocal()
  const filteredFornecedores = fornecedores.filter(f => f.id !== id)
  
  if (filteredFornecedores.length === fornecedores.length) {
    return false // Nenhum item foi removido
  }
  
  localStorage.setItem(FORNECEDORES_STORAGE_KEY, JSON.stringify(filteredFornecedores))
  return true
}