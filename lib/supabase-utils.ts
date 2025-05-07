import { supabase } from './supabase';

/**
 * Verifica se a tabela de usuários existe no Supabase
 */
export async function verificarTabelaUsuarios() {
  try {
    // Tenta fazer uma consulta para verificar se a tabela existe
    const { data, error, status } = await supabase
      .from('usuarios')
      .select('count', { count: 'exact', head: true });
    
    console.log("Verificação de tabela usuários:", { data, error, status });
    
    if (error) {
      if (error.code === '42P01') { // Código para "tabela não existe"
        console.error("A tabela 'usuarios' não existe no banco de dados.");
        return { 
          existe: false, 
          mensagem: "A tabela 'usuarios' não existe no banco de dados.", 
          error 
        };
      }
      
      console.error("Erro ao verificar tabela 'usuarios':", error);
      return { 
        existe: false, 
        mensagem: `Erro ao verificar tabela: ${error.message}`, 
        error 
      };
    }
    
    return { 
      existe: true, 
      mensagem: "Tabela 'usuarios' encontrada com sucesso." 
    };
  } catch (error) {
    console.error("Erro ao verificar tabela:", error);
    return { 
      existe: false, 
      mensagem: "Erro ao verificar tabela de usuários", 
      error 
    };
  }
}

/**
 * Tenta executar o SQL para criar a tabela de usuários
 */
export async function criarTabelaUsuarios() {
  try {
    // Script SQL para criar a tabela (versão simplificada para teste)
    const sql = `
      -- Criar tipo enum para perfis (se não existir)
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_tipo') THEN
          CREATE TYPE perfil_tipo AS ENUM ('admin', 'gestor', 'almoxarifado', 'oficina', 'basico', 'customizado');
        END IF;
      END $$;
      
      -- Criar tabela de usuários (se não existir)
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome TEXT NOT NULL,
        sobrenome TEXT NOT NULL,
        login TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        perfil TEXT NOT NULL DEFAULT 'basico',
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        permissoes_customizadas JSONB
      );
      
      -- Insere um usuário admin padrão se a tabela estiver vazia
      INSERT INTO usuarios (nome, sobrenome, login, senha, perfil)
      SELECT 'Administrador', 'Sistema', 'admin.sistema', 'admin123', 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM usuarios LIMIT 1);
    `;
    
    // Executa o SQL (requer permissões de administrador)
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error("Erro ao criar tabela:", error);
      return { 
        sucesso: false, 
        mensagem: `Erro ao criar tabela: ${error.message}`, 
        error 
      };
    }
    
    return { 
      sucesso: true, 
      mensagem: "Tabela 'usuarios' criada com sucesso." 
    };
  } catch (error) {
    console.error("Erro ao criar tabela:", error);
    return { 
      sucesso: false, 
      mensagem: "Erro ao criar tabela de usuários", 
      error 
    };
  }
} 