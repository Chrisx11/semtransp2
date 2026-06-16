"use client"

import { supabase } from "@/lib/supabase"

export interface DespesaNotaItem {
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface DespesaNota {
  id: string
  numeroNota?: string
  dataNota?: string
  veiculoId?: string
  placa?: string
  fornecedor?: string
  itens: DespesaNotaItem[]
  valorTotal: number
  caminhoImagem: string
  textoExtraido?: string
  observacoes?: string
  createdAt: string
  updatedAt: string
}

export type DespesaNotaInput = {
  numeroNota?: string
  dataNota?: string
  veiculoId?: string
  placa?: string
  fornecedor?: string
  itens: DespesaNotaItem[]
  valorTotal: number
  caminhoImagem: string
  textoExtraido?: string
  observacoes?: string
}

const BUCKET_NAME = "despesas-notas"

const mapRow = (row: any): DespesaNota => ({
  id: row.id,
  numeroNota: row.numero_nota ?? undefined,
  dataNota: row.data_nota ?? undefined,
  veiculoId: row.veiculo_id ?? undefined,
  placa: row.placa ?? undefined,
  fornecedor: row.fornecedor ?? undefined,
  itens: Array.isArray(row.itens) ? row.itens : [],
  valorTotal: Number(row.valor_total) || 0,
  caminhoImagem: row.caminho_imagem,
  textoExtraido: row.texto_extraido ?? undefined,
  observacoes: row.observacoes ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function getDespesasNotasSupabase(): Promise<DespesaNota[]> {
  const { data, error } = await supabase
    .from("despesas_notas")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function uploadImagemNotaSupabase(file: File): Promise<string> {
  const timestamp = Date.now()
  const extensao = file.name.split(".").pop() || "jpg"
  const caminhoArquivo = `${timestamp}_${Math.random().toString(36).slice(2, 8)}.${extensao}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(caminhoArquivo, file, { cacheControl: "3600", upsert: false })

  if (uploadError) {
    if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
      throw new Error(
        "Bucket 'despesas-notas' não encontrado no Supabase Storage. " +
          "Crie o bucket 'despesas-notas' no Supabase Dashboard > Storage antes de enviar notas."
      )
    }
    if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("policy")) {
      throw new Error(
        "Erro de permissão no Supabase Storage. Execute 'db/create-despesas-notas-storage-policies.sql' no SQL Editor."
      )
    }
    throw uploadError
  }

  return caminhoArquivo
}

export function getImagemNotaUrl(caminhoArquivo: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(caminhoArquivo)
  return data.publicUrl
}

export async function getImagemNotaUrlAssinada(caminhoArquivo: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(caminhoArquivo, 3600)
  if (error) return getImagemNotaUrl(caminhoArquivo)
  return data.signedUrl
}

export async function addDespesaNotaSupabase(input: DespesaNotaInput): Promise<DespesaNota> {
  const { data, error } = await supabase
    .from("despesas_notas")
    .insert({
      numero_nota: input.numeroNota ?? null,
      data_nota: input.dataNota ?? null,
      veiculo_id: input.veiculoId ?? null,
      placa: input.placa ?? null,
      fornecedor: input.fornecedor ?? null,
      itens: input.itens,
      valor_total: input.valorTotal,
      caminho_imagem: input.caminhoImagem,
      texto_extraido: input.textoExtraido ?? null,
      observacoes: input.observacoes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function updateDespesaNotaSupabase(id: string, input: Partial<DespesaNotaInput>): Promise<DespesaNota> {
  const patch: any = {}
  if (input.numeroNota !== undefined) patch.numero_nota = input.numeroNota
  if (input.dataNota !== undefined) patch.data_nota = input.dataNota
  if (input.veiculoId !== undefined) patch.veiculo_id = input.veiculoId
  if (input.placa !== undefined) patch.placa = input.placa
  if (input.fornecedor !== undefined) patch.fornecedor = input.fornecedor
  if (input.itens !== undefined) patch.itens = input.itens
  if (input.valorTotal !== undefined) patch.valor_total = input.valorTotal
  if (input.observacoes !== undefined) patch.observacoes = input.observacoes
  patch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("despesas_notas")
    .update(patch)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function deleteDespesaNotaSupabase(id: string): Promise<void> {
  const { data: registro } = await supabase
    .from("despesas_notas")
    .select("caminho_imagem")
    .eq("id", id)
    .single()

  if (registro?.caminho_imagem) {
    await supabase.storage.from(BUCKET_NAME).remove([registro.caminho_imagem])
  }

  const { error } = await supabase.from("despesas_notas").delete().eq("id", id)
  if (error) throw error
}
