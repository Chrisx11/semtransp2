import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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