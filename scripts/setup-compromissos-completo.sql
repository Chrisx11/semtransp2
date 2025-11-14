-- Script completo para configurar a tabela compromissos com campo concluido
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna concluido se não existir
ALTER TABLE compromissos 
ADD COLUMN IF NOT EXISTS concluido BOOLEAN DEFAULT false;

-- 2. Criar índice para melhorar performance de consultas por status
CREATE INDEX IF NOT EXISTS idx_compromissos_concluido ON compromissos(concluido);

-- 3. Comentário na coluna
COMMENT ON COLUMN compromissos.concluido IS 'Indica se o compromisso foi concluído';

-- 4. Habilitar RLS se ainda não estiver habilitado
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas antigas que exigem autenticação
DROP POLICY IF EXISTS "compromissos_select_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_insert_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_update_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_delete_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_all_access" ON compromissos;
DROP POLICY IF EXISTS "compromissos_select_public" ON compromissos;
DROP POLICY IF EXISTS "compromissos_insert_public" ON compromissos;
DROP POLICY IF EXISTS "compromissos_update_public" ON compromissos;
DROP POLICY IF EXISTS "compromissos_delete_public" ON compromissos;

-- 6. Criar políticas públicas (sem necessidade de autenticação do Supabase)
-- Permite leitura pública
CREATE POLICY "compromissos_select_public" ON compromissos
  FOR SELECT
  USING (true);

-- Permite inserção pública
CREATE POLICY "compromissos_insert_public" ON compromissos
  FOR INSERT
  WITH CHECK (true);

-- Permite atualização pública (incluindo o campo concluido)
CREATE POLICY "compromissos_update_public" ON compromissos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Permite exclusão pública
CREATE POLICY "compromissos_delete_public" ON compromissos
  FOR DELETE
  USING (true);

