import { supabase } from './supabase'

// Wrapper para operações de banco de dados usando Supabase
export const db = {
  query: async (text: string, params?: any[]) => {
    try {
      // Para consultas SELECT
      if (text.trim().toLowerCase().startsWith('select')) {
        const { data, error } = await supabase.from(extractTableName(text)).select('*')
        
        if (error) throw error
        return { rows: data || [] }
      }
      
      // Para INSERT com RETURNING
      if (text.trim().toLowerCase().includes('insert') && text.trim().toLowerCase().includes('returning')) {
        const tableName = extractTableName(text)
        const { data, error } = await supabase.from(tableName).insert(params?.[0] || {}).select()
        
        if (error) throw error
        return { rows: data || [] }
      }
      
      // Para UPDATE com RETURNING
      if (text.trim().toLowerCase().includes('update') && text.trim().toLowerCase().includes('returning')) {
        const tableName = extractTableName(text)
        const { data, error } = await supabase.from(tableName).update(params?.[0] || {}).eq('id', params?.[1]).select()
        
        if (error) throw error
        return { rows: data || [] }
      }
      
      // Para DELETE
      if (text.trim().toLowerCase().includes('delete')) {
        const tableName = extractTableName(text)
        const { error } = await supabase.from(tableName).delete().eq('id', params?.[0])
        
        if (error) throw error
        return { rowCount: 1 }
      }
      
      // Fallback para outras operações
      console.warn('Operação não implementada no wrapper de banco de dados:', text)
      return { rows: [] }
    } catch (error) {
      console.error('Erro na operação de banco de dados:', error)
      throw error
    }
  }
}

// Função auxiliar para extrair o nome da tabela de uma consulta SQL
function extractTableName(query: string): string {
  // Simplificação para demonstração
  // Em um ambiente de produção, isso precisaria ser mais robusto
  const fromMatch = query.match(/from\s+([^\s,;()]+)/i)
  const insertMatch = query.match(/insert\s+into\s+([^\s,;()]+)/i)
  const updateMatch = query.match(/update\s+([^\s,;()]+)/i)
  const deleteMatch = query.match(/delete\s+from\s+([^\s,;()]+)/i)
  
  return (fromMatch?.[1] || insertMatch?.[1] || updateMatch?.[1] || deleteMatch?.[1] || '').trim()
} 