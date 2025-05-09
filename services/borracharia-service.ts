import { v4 as uuidv4 } from "uuid"

export interface ServicoBorracharia {
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
const BORRACHARIA_STORAGE_KEY = "borracharia_data"

// Obter todos os serviços de borracharia
export async function getServicosBorracharia(): Promise<ServicoBorracharia[]> {
  return getServicosBorrachariaLocal()
}

// Função para obter serviços de borracharia do localStorage
function getServicosBorrachariaLocal(): ServicoBorracharia[] {
  if (typeof window === "undefined") return []
  
  const data = localStorage.getItem(BORRACHARIA_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// Obter um serviço de borracharia pelo ID
export async function getServicoBorrachariaById(id: string): Promise<ServicoBorracharia | null> {
  return getServicoBorrachariaByIdLocal(id)
}

// Função para obter um serviço de borracharia pelo ID do localStorage
function getServicoBorrachariaByIdLocal(id: string): ServicoBorracharia | null {
  const servicos = getServicosBorrachariaLocal()
  return servicos.find(s => s.id === id) || null
}

// Criar um novo serviço de borracharia
export async function createServicoBorracharia(
  data: Omit<ServicoBorracharia, "id" | "createdAt" | "updatedAt">
): Promise<ServicoBorracharia | null> {
  try {
    console.log("Criando serviço de borracharia:", data);
    return createServicoBorrachariaLocal(data)
  } catch (error) {
    console.error("Erro ao criar serviço de borracharia:", error);
    throw error;
  }
}

// Função para criar um serviço de borracharia no localStorage
function createServicoBorrachariaLocal(
  data: Omit<ServicoBorracharia, "id" | "createdAt" | "updatedAt">
): ServicoBorracharia {
  const servicos = getServicosBorrachariaLocal()
  const id = uuidv4()
  const now = new Date()
  
  const newServico = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  }
  
  servicos.push(newServico)
  localStorage.setItem(BORRACHARIA_STORAGE_KEY, JSON.stringify(servicos))
  
  return newServico
}

// Atualizar um serviço de borracharia
export async function updateServicoBorracharia(
  id: string,
  data: Partial<Omit<ServicoBorracharia, "id" | "createdAt" | "updatedAt">>
): Promise<ServicoBorracharia | null> {
  return updateServicoBorrachariaLocal(id, data)
}

// Função para atualizar um serviço de borracharia no localStorage
function updateServicoBorrachariaLocal(
  id: string,
  data: Partial<Omit<ServicoBorracharia, "id" | "createdAt" | "updatedAt">>
): ServicoBorracharia | null {
  const servicos = getServicosBorrachariaLocal()
  const index = servicos.findIndex(s => s.id === id)
  
  if (index === -1) return null
  
  const now = new Date()
  
  servicos[index] = {
    ...servicos[index],
    ...data,
    updatedAt: now
  }
  
  localStorage.setItem(BORRACHARIA_STORAGE_KEY, JSON.stringify(servicos))
  
  return servicos[index]
}

// Excluir um serviço de borracharia
export async function deleteServicoBorracharia(id: string): Promise<boolean> {
  return deleteServicoBorrachariaLocal(id)
}

// Função para excluir um serviço de borracharia do localStorage
function deleteServicoBorrachariaLocal(id: string): boolean {
  const servicos = getServicosBorrachariaLocal()
  const filteredServicos = servicos.filter(s => s.id !== id)
  
  if (filteredServicos.length === servicos.length) {
    return false // Nenhum item foi removido
  }
  
  localStorage.setItem(BORRACHARIA_STORAGE_KEY, JSON.stringify(filteredServicos))
  return true
} 