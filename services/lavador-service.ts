import { v4 as uuidv4 } from "uuid"

export interface ServicoLavador {
  id: string
  veiculo: {
    placa: string
    modelo: string
    marca: string
    secretaria: string
  }
  fornecedorId: string
  solicitanteId: string
  servico: string
  quantidade: number
  createdAt: Date
  updatedAt: Date
}

// Chave para armazenar os dados no localStorage
const LAVADOR_STORAGE_KEY = "lavador_data"

// Obter todos os serviços de lavador
export async function getServicosLavador(): Promise<ServicoLavador[]> {
  return getServicosLavadorLocal()
}

// Função para obter serviços de lavador do localStorage
function getServicosLavadorLocal(): ServicoLavador[] {
  if (typeof window === "undefined") return []
  
  const data = localStorage.getItem(LAVADOR_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// Obter um serviço de lavador pelo ID
export async function getServicoLavadorById(id: string): Promise<ServicoLavador | null> {
  return getServicoLavadorByIdLocal(id)
}

// Função para obter um serviço de lavador pelo ID do localStorage
function getServicoLavadorByIdLocal(id: string): ServicoLavador | null {
  const servicos = getServicosLavadorLocal()
  return servicos.find(s => s.id === id) || null
}

// Criar um novo serviço de lavador
export async function createServicoLavador(
  data: Omit<ServicoLavador, "id" | "createdAt" | "updatedAt">
): Promise<ServicoLavador | null> {
  try {
    console.log("Criando serviço de lavador:", data);
    return createServicoLavadorLocal(data)
  } catch (error) {
    console.error("Erro ao criar serviço de lavador:", error);
    throw error;
  }
}

// Função para criar um serviço de lavador no localStorage
function createServicoLavadorLocal(
  data: Omit<ServicoLavador, "id" | "createdAt" | "updatedAt">
): ServicoLavador {
  const servicos = getServicosLavadorLocal()
  const id = uuidv4()
  const now = new Date()
  
  const newServico = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  }
  
  servicos.push(newServico)
  localStorage.setItem(LAVADOR_STORAGE_KEY, JSON.stringify(servicos))
  
  return newServico
}

// Atualizar um serviço de lavador
export async function updateServicoLavador(
  id: string,
  data: Partial<Omit<ServicoLavador, "id" | "createdAt" | "updatedAt">>
): Promise<ServicoLavador | null> {
  return updateServicoLavadorLocal(id, data)
}

// Função para atualizar um serviço de lavador no localStorage
function updateServicoLavadorLocal(
  id: string,
  data: Partial<Omit<ServicoLavador, "id" | "createdAt" | "updatedAt">>
): ServicoLavador | null {
  const servicos = getServicosLavadorLocal()
  const index = servicos.findIndex(s => s.id === id)
  
  if (index === -1) return null
  
  const now = new Date()
  
  servicos[index] = {
    ...servicos[index],
    ...data,
    updatedAt: now
  }
  
  localStorage.setItem(LAVADOR_STORAGE_KEY, JSON.stringify(servicos))
  
  return servicos[index]
}

// Excluir um serviço de lavador
export async function deleteServicoLavador(id: string): Promise<boolean> {
  return deleteServicoLavadorLocal(id)
}

// Função para excluir um serviço de lavador do localStorage
function deleteServicoLavadorLocal(id: string): boolean {
  const servicos = getServicosLavadorLocal()
  const filteredServicos = servicos.filter(s => s.id !== id)
  
  if (filteredServicos.length === servicos.length) {
    return false // Nenhum item foi removido
  }
  
  localStorage.setItem(LAVADOR_STORAGE_KEY, JSON.stringify(filteredServicos))
  return true
} 