import { supabase } from "@/lib/supabase"

export interface CompraItem {
  id: string
  descricao: string
  quantidade: number
  valorUnitario?: number
}

export interface Compra {
  id: string
  numero: number
  status: "pedido" | "entregue" | "pago"
  fornecedor?: string
  notaFornecedor?: string
  observacoes?: string
  itens: CompraItem[]
  dataPedido: string
  dataEntrega?: string
  dataPagamento?: string
  createdAt: string
}

export type CompraInput = {
  status?: "pedido" | "entregue" | "pago"
  fornecedor?: string
  notaFornecedor?: string
  observacoes?: string
  itens: CompraItem[]
  dataPedido?: string
  dataEntrega?: string
  dataPagamento?: string
}

const mapRow = (row: any): Compra => ({
  id: row.id,
  numero: row.numero,
  status: row.status,
  fornecedor: row.fornecedor ?? undefined,
  notaFornecedor: row.nota_fornecedor ?? undefined,
  observacoes: row.observacoes ?? undefined,
  itens: Array.isArray(row.itens) ? row.itens : [],
  dataPedido: row.data_pedido,
  dataEntrega: row.data_entrega ?? undefined,
  dataPagamento: row.data_pagamento ?? undefined,
  createdAt: row.created_at,
})

export async function getComprasSupabase(): Promise<Compra[]> {
  const { data, error } = await supabase
    .from("compras")
    .select("*")
    .order("numero", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function addCompraSupabase(input: CompraInput): Promise<Compra> {
  const { data, error } = await supabase
    .from("compras")
    .insert({
      status: input.status ?? "pedido",
      fornecedor: input.fornecedor ?? null,
      nota_fornecedor: input.notaFornecedor ?? null,
      observacoes: input.observacoes ?? null,
      itens: input.itens,
      data_pedido: input.dataPedido ?? new Date().toISOString(),
      data_entrega: input.dataEntrega ?? null,
      data_pagamento: input.dataPagamento ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function updateCompraSupabase(id: string, input: Partial<CompraInput>): Promise<Compra> {
  const patch: any = {}
  if (input.status !== undefined) patch.status = input.status
  if (input.fornecedor !== undefined) patch.fornecedor = input.fornecedor
  if (input.notaFornecedor !== undefined) patch.nota_fornecedor = input.notaFornecedor
  if (input.observacoes !== undefined) patch.observacoes = input.observacoes
  if (input.itens !== undefined) patch.itens = input.itens
  if (input.dataPedido !== undefined) patch.data_pedido = input.dataPedido
  if (input.dataEntrega !== undefined) patch.data_entrega = input.dataEntrega
  if (input.dataPagamento !== undefined) patch.data_pagamento = input.dataPagamento
  patch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("compras")
    .update(patch)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return mapRow(data)
}

export async function deleteCompraSupabase(id: string): Promise<void> {
  const { error } = await supabase.from("compras").delete().eq("id", id)
  if (error) throw error
}
