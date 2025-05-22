import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL não está definido. Verifique seu arquivo .env.local")
}

if (!supabaseKey) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY não está definido. Verifique seu arquivo .env.local")
}

if (supabaseUrl && supabaseKey) {
  console.log("Configuração do Supabase:", 
    `URL: ${supabaseUrl.substring(0, 10)}...`, 
    `ANON KEY: ${supabaseKey.substring(0, 5)}...`
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // Adicionando interceptador para logar todas as requisições
    fetch: (url, options) => {
      console.log(`Supabase Request: ${options?.method || 'GET'} ${url.toString()}`);
      return fetch(url, options).then(response => {
        console.log(`Supabase Response: ${response.status} ${response.statusText}`);
        return response;
      }).catch(error => {
        console.error('Erro na requisição Supabase:', error);
        throw error;
      });
    },
  },
})

// Adicionar wrapper para facilitar debug
export const debugSupabase = {
  async update(table: string, data: any, condition: Record<string, any>) {
    console.log(`Supabase DEBUG: Atualizando ${table}`, data, 'com condição', condition);
    try {
      let query = supabase.from(table).update(data);
      
      // Adicionar todas as condições
      Object.entries(condition).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const result = await query;
      console.log(`Supabase DEBUG: Resultado da atualização de ${table}:`, result);
      return result;
    } catch (error) {
      console.error(`Supabase DEBUG: Erro ao atualizar ${table}:`, error);
      throw error;
    }
  }
};

// Função para verificar a conexão com o Supabase
export async function checkSupabaseConnection() {
  try {
    // Tenta fazer uma requisição simples para verificar a conexão
    const { data, error } = await supabase.from("colaboradores").select("id").limit(1)
    
    if (error) {
      console.error("Erro na conexão com Supabase:", error)
      return { 
        connected: false, 
        message: "Falha na conexão com Supabase", 
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details
        }
      }
    }
    
    return { 
      connected: true, 
      message: "Conexão com Supabase estabelecida com sucesso",
      tables: ["colaboradores"]
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error("Exceção ao conectar com Supabase:", errorMessage)
    return { 
      connected: false, 
      message: "Exceção ao conectar com Supabase", 
      error: errorMessage 
    }
  }
}

// Verificar tabelas do banco de dados
export async function listSupabaseTables() {
  try {
    const tables = [
      "colaboradores",
      "veiculos",
      "ordens_servico",
      "produtos",
      "entradas",
      "saidas",
      "fornecedores"
    ]
    
    const results = await Promise.all(
      tables.map(async (table) => {
        try {
          const { data, error } = await supabase.from(table).select("id").limit(1)
          return { 
            table, 
            exists: !error, 
            error: error ? error.message : null 
          }
        } catch (e) {
          return { 
            table, 
            exists: false, 
            error: e instanceof Error ? e.message : "Erro desconhecido" 
          }
        }
      })
    )
    
    return results
  } catch (error) {
    console.error("Erro ao listar tabelas:", error)
    return []
  }
}
