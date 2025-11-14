"use client"

import { supabase } from "@/lib/supabase"

export interface Compromisso {
  id: string
  titulo: string
  descricao?: string | null
  data: string // formato: YYYY-MM-DD
  hora: string // formato: HH:MM:SS ou HH:MM
  duracao?: number | null
  cor?: string | null
  concluido?: boolean | null
  created_at?: string
  updated_at?: string
}

// Função para obter todos os compromissos
export async function getCompromissosSupabase(): Promise<Compromisso[]> {
  try {
    const { data, error } = await supabase
      .from("compromissos")
      .select("*")
      .order("data", { ascending: true })
      .order("hora", { ascending: true })

    if (error) {
      console.error("Erro ao buscar compromissos:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Erro ao carregar compromissos:", error)
    throw error
  }
}

// Função para obter compromissos por data
export async function getCompromissosPorDataSupabase(data: string): Promise<Compromisso[]> {
  try {
    const { data: compromissos, error } = await supabase
      .from("compromissos")
      .select("*")
      .eq("data", data)
      .order("hora", { ascending: true })

    if (error) {
      console.error("Erro ao buscar compromissos por data:", error)
      throw error
    }

    return compromissos || []
  } catch (error) {
    console.error("Erro ao carregar compromissos por data:", error)
    throw error
  }
}

// Função para obter compromissos por intervalo de datas
export async function getCompromissosPorIntervaloSupabase(
  dataInicio: string,
  dataFim: string
): Promise<Compromisso[]> {
  try {
    const { data, error } = await supabase
      .from("compromissos")
      .select("*")
      .gte("data", dataInicio)
      .lte("data", dataFim)
      .order("data", { ascending: true })
      .order("hora", { ascending: true })

    if (error) {
      console.error("Erro ao buscar compromissos por intervalo:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Erro ao carregar compromissos por intervalo:", error)
    throw error
  }
}

// Função para obter um compromisso por ID
export async function getCompromissoByIdSupabase(id: string): Promise<Compromisso | null> {
  try {
    const { data, error } = await supabase
      .from("compromissos")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Registro não encontrado
        return null
      }
      console.error("Erro ao buscar compromisso:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao carregar compromisso:", error)
    throw error
  }
}

// Função para adicionar um novo compromisso
export async function addCompromissoSupabase(
  compromisso: Omit<Compromisso, "id" | "created_at" | "updated_at">
): Promise<Compromisso> {
  try {
    // Formatar hora para HH:MM:SS se necessário
    let horaFormatada = compromisso.hora
    if (horaFormatada.length === 5) {
      // Se está no formato HH:MM, adicionar :00
      horaFormatada = `${horaFormatada}:00`
    }

    const novoCompromisso = {
      titulo: compromisso.titulo,
      descricao: compromisso.descricao || null,
      data: compromisso.data,
      hora: horaFormatada,
      duracao: compromisso.duracao || 60,
      cor: compromisso.cor || "bg-blue-500",
      concluido: compromisso.concluido || false,
    }

    const { data, error } = await supabase
      .from("compromissos")
      .insert([novoCompromisso])
      .select()
      .single()

    if (error) {
      console.error("Erro ao adicionar compromisso:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao criar compromisso:", error)
    throw error
  }
}

// Função para atualizar um compromisso existente
export async function updateCompromissoSupabase(
  id: string,
  compromisso: Partial<Omit<Compromisso, "id" | "created_at" | "updated_at">>
): Promise<Compromisso> {
  try {
    if (!id) {
      throw new Error("ID do compromisso é obrigatório")
    }

    console.log("🟡 Tentando atualizar compromisso com ID:", id, "Dados:", compromisso)

    // Formatar hora se fornecida
    const dadosAtualizacao: any = { ...compromisso }
    if (dadosAtualizacao.hora && dadosAtualizacao.hora.length === 5) {
      dadosAtualizacao.hora = `${dadosAtualizacao.hora}:00`
    }

    // Remover campos undefined/null desnecessários
    Object.keys(dadosAtualizacao).forEach(key => {
      if (dadosAtualizacao[key] === undefined) {
        delete dadosAtualizacao[key]
      }
    })

    const { data, error } = await supabase
      .from("compromissos")
      .update(dadosAtualizacao)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Erro ao atualizar compromisso:", error)
      console.error("   Código:", error.code)
      console.error("   Mensagem:", error.message)
      console.error("   Detalhes:", error.details)
      console.error("   Hint:", error.hint)
      
      // Se for erro de RLS (403), fornecer mensagem mais clara
      if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("policy")) {
        throw new Error(
          "Erro de permissão: As políticas RLS (Row Level Security) estão bloqueando a atualização. " +
          "Execute o script 'scripts/fix-compromissos-rls-public.sql' no Supabase SQL Editor."
        )
      }
      
      throw error
    }

    if (!data) {
      throw new Error("Compromisso não foi encontrado para atualização")
    }

    console.log("✅ Compromisso atualizado com sucesso:", data)
    return data
  } catch (error) {
    console.error("❌ Erro ao atualizar compromisso:", error)
    throw error
  }
}

// Função para excluir um compromisso
export async function deleteCompromissoSupabase(id: string): Promise<boolean> {
  try {
    if (!id) {
      throw new Error("ID do compromisso é obrigatório")
    }

    console.log("🔴 Tentando excluir compromisso com ID:", id)

    const { data, error } = await supabase
      .from("compromissos")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error("❌ Erro ao excluir compromisso:", error)
      console.error("   Código:", error.code)
      console.error("   Mensagem:", error.message)
      console.error("   Detalhes:", error.details)
      console.error("   Hint:", error.hint)
      
      // Se for erro de RLS (403), fornecer mensagem mais clara
      if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("policy")) {
        throw new Error(
          "Erro de permissão: As políticas RLS (Row Level Security) estão bloqueando a exclusão. " +
          "Execute o script 'scripts/fix-compromissos-rls-public.sql' no Supabase SQL Editor."
        )
      }
      
      throw error
    }

    // Verificar se realmente deletou
    if (data && data.length > 0) {
      console.log("✅ Compromisso excluído com sucesso:", data)
      return true
    } else if (data && data.length === 0) {
      console.warn(`⚠️ Compromisso com ID ${id} não foi encontrado para exclusão`)
      // Não lançar erro, apenas avisar - pode já ter sido deletado
      return true
    }

    console.log("✅ Exclusão concluída (sem dados retornados)")
    return true
  } catch (error) {
    console.error("❌ Erro ao excluir compromisso:", error)
    throw error
  }
}

// Função para marcar compromisso como concluído ou não concluído
export async function toggleConcluidoCompromissoSupabase(
  id: string,
  concluido: boolean
): Promise<Compromisso> {
  try {
    if (!id) {
      throw new Error("ID do compromisso é obrigatório")
    }

    console.log(`🔄 Marcando compromisso ${id} como ${concluido ? "concluído" : "não concluído"}`)

    const { data, error } = await supabase
      .from("compromissos")
      .update({ concluido })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Erro ao atualizar status do compromisso:", error)
      throw error
    }

    if (!data) {
      throw new Error("Compromisso não foi encontrado")
    }

    console.log("✅ Status do compromisso atualizado com sucesso:", data)
    return data
  } catch (error) {
    console.error("❌ Erro ao atualizar status do compromisso:", error)
    throw error
  }
}

// Função para migrar dados do localStorage para o Supabase
export async function migrateLocalStorageToSupabase(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return true

    const stored = localStorage.getItem("planner_compromissos")
    if (!stored) return true

    const compromissos = JSON.parse(stored)
    if (!Array.isArray(compromissos) || compromissos.length === 0) {
      // Limpar localStorage após migração bem-sucedida
      localStorage.removeItem("planner_compromissos")
      return true
    }

    // Converter compromissos do formato antigo para o novo
    const compromissosParaMigrar = compromissos.map((c: any) => {
      // Converter data de ISO string para formato DATE
      let dataFormatada = c.data
      if (dataFormatada.includes("T")) {
        dataFormatada = dataFormatada.split("T")[0]
      }

      // Converter hora para formato TIME
      let horaFormatada = c.hora
      if (horaFormatada && horaFormatada.length === 5) {
        horaFormatada = `${horaFormatada}:00`
      }

      return {
        titulo: c.titulo,
        descricao: c.descricao || null,
        data: dataFormatada,
        hora: horaFormatada,
        duracao: c.duracao || 60,
        cor: c.cor || "bg-blue-500",
        concluido: c.concluido || false,
      }
    })

    // Inserir no Supabase
    const { error } = await supabase.from("compromissos").insert(compromissosParaMigrar)

    if (error) {
      console.error("Erro ao migrar compromissos:", error)
      return false
    }

    // Limpar localStorage após migração bem-sucedida
    localStorage.removeItem("planner_compromissos")
    return true
  } catch (error) {
    console.error("Erro ao migrar dados para o Supabase:", error)
    return false
  }
}

