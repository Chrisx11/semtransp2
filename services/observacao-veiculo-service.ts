import { supabase } from '@/lib/supabase'

export async function addObservacaoVeiculo({
  veiculo_id,
  data_observacao,
  observacao,
}: {
  veiculo_id: string
  data_observacao: string
  observacao: string
}) {
  const { data, error } = await supabase
    .from('observacoes_veiculo')
    .insert([{ veiculo_id, data_observacao, observacao }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getObservacoesVeiculo(veiculo_id: string) {
  const { data, error } = await supabase
    .from('observacoes_veiculo')
    .select('*')
    .eq('veiculo_id', veiculo_id)
    .order('data_observacao', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateObservacaoVeiculo(id: string, updates: {
  data_observacao?: string
  observacao?: string
}) {
  const { data, error } = await supabase
    .from('observacoes_veiculo')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteObservacaoVeiculo(id: string) {
  const { error } = await supabase
    .from('observacoes_veiculo')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
} 