import { NextResponse } from 'next/server'
import { supabase, listSupabaseTables } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Verificar tabelas existentes
    const tables = await listSupabaseTables()
    
    // Verificar se a tabela de fornecedores existe
    const fornecedoresTable = tables.find(t => t.table === 'fornecedores')
    
    let results = {
      message: 'Verificação de banco de dados concluída',
      tables,
      actions: [] as string[]
    }
    
    // Se a tabela de fornecedores não existir, criar
    if (!fornecedoresTable?.exists) {
      try {
        // Executar script SQL para criar a tabela de fornecedores
        const sql = `
        CREATE TABLE IF NOT EXISTS fornecedores (
          id UUID PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          endereco TEXT NOT NULL,
          telefone VARCHAR(20) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Índices para melhorar a performance de consultas
        CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
        
        -- Trigger para atualizar automaticamente o campo updated_at
        CREATE OR REPLACE FUNCTION update_fornecedor_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS update_fornecedor_timestamp ON fornecedores;
        
        CREATE TRIGGER update_fornecedor_timestamp
        BEFORE UPDATE ON fornecedores
        FOR EACH ROW
        EXECUTE FUNCTION update_fornecedor_updated_at();
        
        -- Permissões RLS (Row Level Security) para Supabase
        ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
        
        -- Política para permitir leitura para usuários autenticados
        CREATE POLICY fornecedores_select_policy ON fornecedores
          FOR SELECT USING (true);
        
        -- Política para permitir inserção para usuários autenticados
        CREATE POLICY fornecedores_insert_policy ON fornecedores
          FOR INSERT WITH CHECK (true);
        
        -- Política para permitir atualização para usuários autenticados
        CREATE POLICY fornecedores_update_policy ON fornecedores
          FOR UPDATE USING (true);
        
        -- Política para permitir exclusão para usuários autenticados
        CREATE POLICY fornecedores_delete_policy ON fornecedores
          FOR DELETE USING (true);
        `
        
        // Executar o script SQL
        const { error } = await supabase.rpc('pgcrypto_extensions')
        if (error) {
          results.actions.push(`Erro ao habilitar extensões: ${error.message}`)
        }
        
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql })
        
        if (sqlError) {
          results.actions.push(`Erro ao criar tabela de fornecedores: ${sqlError.message}`)
        } else {
          results.actions.push('Tabela de fornecedores criada com sucesso')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        results.actions.push(`Erro ao criar tabela de fornecedores: ${errorMessage}`)
      }
    } else {
      results.actions.push('Tabela de fornecedores já existe')
    }
    
    return NextResponse.json(results)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 