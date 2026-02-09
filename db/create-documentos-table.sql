-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  tamanho BIGINT NOT NULL,
  tipo_mime TEXT NOT NULL DEFAULT 'application/pdf',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Criar índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_documentos_nome ON documentos USING gin(to_tsvector('portuguese', nome));

-- Criar índice para busca por descrição
CREATE INDEX IF NOT EXISTS idx_documentos_descricao ON documentos USING gin(to_tsvector('portuguese', COALESCE(descricao, '')));

-- Criar índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_documentos_created_at ON documentos(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (ajuste conforme necessário)
CREATE POLICY "Permitir leitura de documentos para todos autenticados"
  ON documentos FOR SELECT
  USING (true);

-- Política para permitir inserção para todos autenticados
CREATE POLICY "Permitir inserção de documentos para todos autenticados"
  ON documentos FOR INSERT
  WITH CHECK (true);

-- Política para permitir atualização para todos autenticados
CREATE POLICY "Permitir atualização de documentos para todos autenticados"
  ON documentos FOR UPDATE
  USING (true);

-- Política para permitir exclusão para todos autenticados
CREATE POLICY "Permitir exclusão de documentos para todos autenticados"
  ON documentos FOR DELETE
  USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_documentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_documentos_updated_at();

-- ============================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- ============================================
-- 
-- IMPORTANTE: Após executar este SQL, você precisa:
-- 
-- 1. Criar o bucket no Supabase Storage:
--    - Acesse o Supabase Dashboard
--    - Vá em Storage > Create Bucket
--    - Nome: 'documentos'
--    - Público: false (recomendado) ou true
--    - File size limit: 50MB
--    - Allowed MIME types: application/pdf
-- 
-- 2. Executar as políticas RLS do Storage:
--    - Execute o arquivo: db/create-documentos-storage-policies.sql
--    - Isso é OBRIGATÓRIO para que o upload funcione!
-- 
-- ============================================

