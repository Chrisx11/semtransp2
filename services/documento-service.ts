"use client"

import { supabase } from "@/lib/supabase"

export interface Documento {
  id: string
  nome: string
  nome_arquivo: string
  caminho_arquivo: string
  tamanho: number
  tipo_mime: string
  descricao?: string
  created_at: string
  updated_at: string
  created_by?: string
}

const BUCKET_NAME = "documentos"

// Função para formatar tamanho do arquivo
export function formatarTamanho(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
}

// Função para obter todos os documentos
export async function getDocumentosSupabase(): Promise<Documento[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar documentos:", error)
    throw error
  }

  return data || []
}

// Função para buscar documentos por termo
export async function buscarDocumentosSupabase(termo: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%,nome_arquivo.ilike.%${termo}%`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar documentos:", error)
    throw error
  }

  return data || []
}

// Função para fazer upload de um documento
export async function uploadDocumentoSupabase(
  file: File,
  nome?: string,
  descricao?: string
): Promise<Documento> {
  try {
    // Validar se é PDF
    if (file.type !== "application/pdf") {
      throw new Error("Apenas arquivos PDF são permitidos")
    }

    // Validar tamanho (máximo 50MB)
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      throw new Error("Arquivo muito grande. Tamanho máximo: 50MB")
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const nomeArquivo = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const caminhoArquivo = `${nomeArquivo}`

    // Fazer upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(caminhoArquivo, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Erro ao fazer upload do arquivo:", uploadError)
      
      // Mensagem mais clara para bucket não encontrado
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        throw new Error(
          "Bucket 'documentos' não encontrado no Supabase Storage. " +
          "Por favor, crie o bucket 'documentos' no Supabase Dashboard > Storage antes de fazer upload."
        )
      }
      
      // Mensagem mais clara para erro de RLS
      if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("RLS") || uploadError.message?.includes("policy")) {
        throw new Error(
          "Erro de permissão no Supabase Storage. " +
          "Por favor, execute o arquivo 'db/create-documentos-storage-policies.sql' no Supabase SQL Editor " +
          "para configurar as políticas de acesso ao bucket."
        )
      }
      
      throw uploadError
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(caminhoArquivo)

    // Salvar metadados na tabela documentos
    const documentoData = {
      nome: nome || file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
      nome_arquivo: file.name,
      caminho_arquivo: caminhoArquivo,
      tamanho: file.size,
      tipo_mime: file.type,
      descricao: descricao || null,
    }

    const { data: documento, error: dbError } = await supabase
      .from("documentos")
      .insert([documentoData])
      .select()
      .single()

    if (dbError) {
      // Se houver erro ao salvar no banco, tentar remover o arquivo do storage
      await supabase.storage.from(BUCKET_NAME).remove([caminhoArquivo])
      throw dbError
    }

    return documento
  } catch (error) {
    console.error("Erro ao fazer upload do documento:", error)
    throw error
  }
}

// Função para fazer upload de múltiplos documentos
export async function uploadMultiplosDocumentosSupabase(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<Documento[]> {
  const documentos: Documento[] = []
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    try {
      const documento = await uploadDocumentoSupabase(files[i])
      documentos.push(documento)
      
      if (onProgress) {
        onProgress(((i + 1) / total) * 100)
      }
    } catch (error) {
      console.error(`Erro ao fazer upload do arquivo ${files[i].name}:`, error)
      // Continuar com os outros arquivos mesmo se um falhar
    }
  }

  return documentos
}

// Função para obter URL de download do documento (pública)
export function getDocumentoUrl(caminhoArquivo: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(caminhoArquivo)
  
  return data.publicUrl
}

// Função para obter URL assinada (para buckets privados)
export async function getDocumentoUrlAssinada(caminhoArquivo: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(caminhoArquivo, 3600) // URL válida por 1 hora

  if (error) {
    console.error("Erro ao gerar URL assinada:", error)
    // Se falhar, tentar URL pública como fallback
    return getDocumentoUrl(caminhoArquivo)
  }

  return data.signedUrl
}

// Função helper para obter URL (tenta assinada primeiro, depois pública)
export async function getDocumentoUrlAssinadaParaView(caminhoArquivo: string): Promise<string> {
  try {
    return await getDocumentoUrlAssinada(caminhoArquivo)
  } catch (error) {
    // Fallback para URL pública
    return getDocumentoUrl(caminhoArquivo)
  }
}

// Função para deletar documento
export async function deleteDocumentoSupabase(id: string): Promise<void> {
  try {
    // Buscar o documento para obter o caminho do arquivo
    const { data: documento, error: fetchError } = await supabase
      .from("documentos")
      .select("caminho_arquivo")
      .eq("id", id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Deletar do storage
    if (documento?.caminho_arquivo) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([documento.caminho_arquivo])

      if (storageError) {
        console.error("Erro ao deletar arquivo do storage:", storageError)
        // Continuar mesmo se houver erro no storage
      }
    }

    // Deletar do banco de dados
    const { error: dbError } = await supabase
      .from("documentos")
      .delete()
      .eq("id", id)

    if (dbError) {
      throw dbError
    }
  } catch (error) {
    console.error("Erro ao deletar documento:", error)
    throw error
  }
}

// Função para atualizar documento (apenas metadados)
export async function updateDocumentoSupabase(
  id: string,
  updates: { nome?: string; descricao?: string }
): Promise<Documento> {
  const { data, error } = await supabase
    .from("documentos")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erro ao atualizar documento:", error)
    throw error
  }

  return data
}

