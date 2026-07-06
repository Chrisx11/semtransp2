"use client"

import { supabase } from "@/lib/supabase"

export interface ItemCompraRealizada {
  codigo: string
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface CompraRealizada {
  id: string
  numeroOS: string
  placa: string | null
  veiculoId: string | null
  veiculoModelo: string | null
  data: string // ISO
  fornecedor: string | null
  itens: ItemCompraRealizada[]
  totalNota: number
  arquivoNome: string
  pdfPath: string | null
  createdAt: string
}

export type CompraRealizadaInput = Omit<CompraRealizada, "id" | "createdAt" | "pdfPath">

const BUCKET_NAME = "compras-realizadas-pdfs"

const mapRow = (row: any): CompraRealizada => ({
  id: row.id,
  numeroOS: row.numero_os,
  placa: row.placa ?? null,
  veiculoId: row.veiculo_id ?? null,
  veiculoModelo: row.veiculo_modelo ?? null,
  data: row.data,
  fornecedor: row.fornecedor ?? null,
  itens: Array.isArray(row.itens) ? row.itens : [],
  totalNota: Number(row.total_nota ?? 0),
  arquivoNome: row.arquivo_nome,
  pdfPath: row.pdf_path ?? null,
  createdAt: row.created_at,
})

export async function getComprasRealizadasSupabase(): Promise<CompraRealizada[]> {
  const { data, error } = await supabase
    .from("compras_realizadas")
    .select("*")
    .order("data", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function getCompraRealizadaPorNumeroOSSupabase(numeroOS: string): Promise<CompraRealizada | null> {
  const { data, error } = await supabase
    .from("compras_realizadas")
    .select("*")
    .eq("numero_os", numeroOS)
    .maybeSingle()
  if (error) throw error
  return data ? mapRow(data) : null
}

export async function addCompraRealizadaSupabase(input: CompraRealizadaInput): Promise<CompraRealizada> {
  const { data, error } = await supabase
    .from("compras_realizadas")
    .insert({
      numero_os: input.numeroOS,
      placa: input.placa,
      veiculo_id: input.veiculoId,
      veiculo_modelo: input.veiculoModelo,
      data: input.data,
      fornecedor: input.fornecedor,
      itens: input.itens,
      total_nota: input.totalNota,
      arquivo_nome: input.arquivoNome,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function updateCompraRealizadaSupabase(
  id: string,
  patch: Partial<CompraRealizadaInput>,
): Promise<CompraRealizada> {
  const dbPatch: Record<string, any> = {}
  if (patch.numeroOS !== undefined) dbPatch.numero_os = patch.numeroOS
  if (patch.placa !== undefined) dbPatch.placa = patch.placa
  if (patch.veiculoId !== undefined) dbPatch.veiculo_id = patch.veiculoId
  if (patch.veiculoModelo !== undefined) dbPatch.veiculo_modelo = patch.veiculoModelo
  if (patch.data !== undefined) dbPatch.data = patch.data
  if (patch.fornecedor !== undefined) dbPatch.fornecedor = patch.fornecedor
  if (patch.itens !== undefined) dbPatch.itens = patch.itens
  if (patch.totalNota !== undefined) dbPatch.total_nota = patch.totalNota
  if (patch.arquivoNome !== undefined) dbPatch.arquivo_nome = patch.arquivoNome

  const { data, error } = await supabase
    .from("compras_realizadas")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function deleteCompraRealizadaSupabase(id: string): Promise<void> {
  const compra = await getCompraRealizadaPorIdSupabase(id)
  if (compra?.pdfPath) {
    await supabase.storage.from(BUCKET_NAME).remove([compra.pdfPath])
  }
  const { error } = await supabase.from("compras_realizadas").delete().eq("id", id)
  if (error) throw error
}

async function getCompraRealizadaPorIdSupabase(id: string): Promise<CompraRealizada | null> {
  const { data, error } = await supabase.from("compras_realizadas").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return data ? mapRow(data) : null
}

// ─── Anexo do PDF original (Supabase Storage) ──────────────────────────────

export async function salvarPdfAnexoSupabase(compraId: string, file: Blob, nomeArquivo: string): Promise<void> {
  const caminho = `${compraId}/${Date.now()}_${nomeArquivo.replace(/[^a-zA-Z0-9.-]/g, "_")}`

  const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(caminho, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: "application/pdf",
  })
  if (uploadError) {
    if (uploadError.message?.includes("Bucket not found")) {
      throw new Error(
        `Bucket '${BUCKET_NAME}' não encontrado no Supabase Storage. Crie-o no Supabase Dashboard > Storage antes de importar.`,
      )
    }
    if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("policy")) {
      throw new Error(
        "Erro de permissão no Supabase Storage. Execute o arquivo 'db/create-compras-realizadas-storage-policies.sql' no SQL Editor.",
      )
    }
    throw uploadError
  }

  const { error: dbError } = await supabase
    .from("compras_realizadas")
    .update({ pdf_path: caminho })
    .eq("id", compraId)
  if (dbError) {
    await supabase.storage.from(BUCKET_NAME).remove([caminho])
    throw dbError
  }
}

export async function obterUrlPdfAnexoSupabase(pdfPath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(pdfPath, 3600)
  if (error) throw error
  return data.signedUrl
}
