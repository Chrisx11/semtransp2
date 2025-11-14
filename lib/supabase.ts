import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Valores padrão para desenvolvimento (usar se variáveis não estiverem carregadas)
const DEFAULT_URL = 'https://wlyuyobnueudhftifrgi.supabase.co'
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseXV5b2JudWV1ZGhmdGlmcmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDA1NzUsImV4cCI6MjA2MTI3NjU3NX0.4oXVscNd7-nyWFKipW_4b12rtaaWjq6C33Sz7yvjPxk'

// Usar valores das variáveis de ambiente ou valores padrão
const finalUrl = supabaseUrl || DEFAULT_URL
const finalKey = supabaseKey || DEFAULT_KEY

// Verificar se as variáveis de ambiente foram carregadas (apenas em desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const usingDefaults = !supabaseUrl || !supabaseKey
  
  if (usingDefaults) {
    // Usar console.warn em vez de console.error para não ser tratado como erro crítico
    console.warn("⚠️ Variáveis de ambiente do Supabase não carregadas. Usando valores padrão.")
    console.warn("💡 Certifique-se de que o arquivo .env.local existe e reinicie o servidor Next.js.")
  } else {
    console.log("✅ Configuração do Supabase carregada:", 
      `URL: ${supabaseUrl.substring(0, 30)}...`, 
      `ANON KEY: ${supabaseKey.substring(0, 20)}...`
    )
  }
  
  // Validar URL do Supabase
  const isValidUrl = finalUrl && finalUrl.startsWith('http') && finalUrl.includes('supabase.co')
  if (!isValidUrl) {
    console.warn("⚠️ URL do Supabase inválida:", finalUrl)
  }
}

export const supabase = createClient(finalUrl, finalKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      // Interceptador para logar requisições e melhorar tratamento de erros
      fetch: async (url, options) => {
        try {
          const urlString = url.toString()
          
          // Log apenas em desenvolvimento (modo debug)
          const isDebugMode = process.env.NODE_ENV === 'development'
          if (isDebugMode) {
            console.log(`🔵 Supabase Request: ${options?.method || 'GET'} ${urlString}`);
          }
          
          const response = await fetch(url, options)
          
          // 406 (Not Acceptable) é retornado pelo Supabase quando .single() não encontra resultados
          // Isso é um comportamento esperado e não deve ser logado como erro crítico
          const isSingleQueryNotFound = response.status === 406
          
          if (isDebugMode && !isSingleQueryNotFound) {
            console.log(`🟢 Supabase Response: ${response.status} ${response.statusText}`);
          }
          
          // Logar apenas erros que não são 406 (resultado esperado de .single() sem resultados)
          // 406 é retornado quando .single() não encontra resultados - isso é tratado pelo código
          if (!response.ok && !isSingleQueryNotFound) {
            const status = response.status
            const statusText = response.statusText
            
            // Para erros 400, tentar ler o body para obter mais detalhes
            if (status === 400) {
              try {
                // Clonar a response para poder ler o body sem consumi-lo
                const clonedResponse = response.clone()
                clonedResponse.json().then((errorBody: any) => {
                  console.error(`❌ Supabase Error Response: 400 (Bad Request)`);
                  console.error(`⚠️ Erro de validação - verifique os dados enviados`);
                  console.error(`📋 Detalhes do erro:`, errorBody);
                  if (errorBody.message) {
                    console.error(`   Mensagem: ${errorBody.message}`);
                  }
                  if (errorBody.details) {
                    console.error(`   Detalhes: ${errorBody.details}`);
                  }
                  if (errorBody.hint) {
                    console.error(`   Dica: ${errorBody.hint}`);
                  }
                  if (errorBody.code) {
                    console.error(`   Código: ${errorBody.code}`);
                  }
                }).catch(() => {
                  // Se não conseguir ler como JSON, tentar como text
                  response.clone().text().then((errorText: string) => {
                    console.error(`❌ Supabase Error Response: 400 (Bad Request)`);
                    console.error(`⚠️ Erro de validação - verifique os dados enviados`);
                    console.error(`📋 Resposta do servidor:`, errorText);
                  }).catch(() => {
                    console.error(`❌ Supabase Error Response: 400 (Bad Request)`);
                    console.error(`⚠️ Erro de validação - verifique os dados enviados`);
                  });
                });
              } catch (e) {
                console.error(`❌ Supabase Error Response: 400 (Bad Request)`);
                console.error(`⚠️ Erro de validação - verifique os dados enviados`);
              }
            } else {
              // Mensagens específicas para outros tipos de erro
              if (status === 401) {
                console.error(`❌ Supabase Error Response: 401 (Unauthorized)`);
                console.error(`⚠️ Problema de autenticação/autorização (RLS)`);
                console.error(`💡 Execute o script 'scripts/setup-rls-trocas-pneu-public.sql' no Supabase SQL Editor para permitir operações públicas.`);
              } else if (status === 403) {
                console.error(`❌ Supabase Error Response: 403 (Forbidden)`);
                console.error(`⚠️ Acesso negado - verifique as políticas RLS`);
              } else {
                console.error(`❌ Supabase Error Response: ${status} ${statusText}`);
              }
            }
            // Não lemos o body aqui para não interferir com o processamento do Supabase
            // O Supabase já tratará o erro adequadamente
          } else if (isSingleQueryNotFound && isDebugMode) {
            // Log informativo apenas em modo debug
            console.log('ℹ️ Nenhum resultado encontrado (comportamento esperado para .single())');
          }
          
          return response
        } catch (error) {
          // Log apenas em desenvolvimento para evitar spam de erros
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Erro na requisição Supabase:', error);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
              console.error('❌ Possíveis causas:');
              console.error('   - URL do Supabase incorreta ou inacessível');
              console.error('   - Problema de rede ou CORS');
              console.error('   - Variáveis de ambiente não carregadas (reinicie o servidor Next.js)');
              console.error('   - URL atual:', url.toString());
            }
          }
          throw error;
        }
      },
    },
  }
)

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
