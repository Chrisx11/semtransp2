-- Tabela de Lavadores
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS lavadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_lavadores_nome ON lavadores(nome);

-- Comentários para documentação
COMMENT ON TABLE lavadores IS 'Tabela para armazenar informações de lavadores cadastrados';
COMMENT ON COLUMN lavadores.id IS 'Identificador único do lavador (UUID)';
COMMENT ON COLUMN lavadores.nome IS 'Nome do lavador';
COMMENT ON COLUMN lavadores.endereco IS 'Endereço completo do lavador';
COMMENT ON COLUMN lavadores.telefone IS 'Número de telefone do lavador';
COMMENT ON COLUMN lavadores.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN lavadores.updated_at IS 'Data e hora da última atualização do registro';

-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_lavador_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lavador_timestamp ON lavadores;

CREATE TRIGGER update_lavador_timestamp
BEFORE UPDATE ON lavadores
FOR EACH ROW
EXECUTE FUNCTION update_lavador_updated_at();

-- Permissões RLS (Row Level Security) para Supabase
ALTER TABLE lavadores ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (caso esteja reexecutando o script)
DROP POLICY IF EXISTS lavadores_select_policy ON lavadores;
DROP POLICY IF EXISTS lavadores_insert_policy ON lavadores;
DROP POLICY IF EXISTS lavadores_update_policy ON lavadores;
DROP POLICY IF EXISTS lavadores_delete_policy ON lavadores;
DROP POLICY IF EXISTS lavadores_public_policy ON lavadores;

-- Política pública que permite todas as operações (sem verificar autenticação do Supabase)
-- Esta política é necessária porque o sistema usa autenticação customizada, não a autenticação do Supabase
CREATE POLICY lavadores_public_policy ON lavadores
FOR ALL 
USING (true)
WITH CHECK (true);
