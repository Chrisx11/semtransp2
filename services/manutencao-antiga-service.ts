import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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