import { supabase } from '@/lib/supabase'

export async function addManutencaoAntiga({
  veiculo_id,
  data_servico,
  titulo,
  pecas,
}: {
  veiculo_id: string
  data_servico: string
  titulo: string
  pecas: string
}) {
  const { data, error } = await supabase
    .from('manutencoes_antigas')
    .insert([{ veiculo_id, data_servico, titulo, pecas }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getManutencoesAntigas(veiculo_id: string) {
  const { data, error } = await supabase
    .from('manutencoes_antigas')
    .select('*')
    .eq('veiculo_id', veiculo_id)
    .order('data_servico', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateManutencaoAntiga(id: string, updates: {
  data_servico?: string
  titulo?: string
  pecas?: string
}) {
  const { data, error } = await supabase
    .from('manutencoes_antigas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteManutencaoAntiga(id: string) {
  const { error } = await supabase
    .from('manutencoes_antigas')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
} 