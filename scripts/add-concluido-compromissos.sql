-- Script para adicionar campo concluido na tabela compromissos
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna concluido se não existir
ALTER TABLE compromissos 
ADD COLUMN IF NOT EXISTS concluido BOOLEAN DEFAULT false;

-- Criar índice para melhorar performance de consultas por status
CREATE INDEX IF NOT EXISTS idx_compromissos_concluido ON compromissos(concluido);

-- Comentário na coluna
COMMENT ON COLUMN compromissos.concluido IS 'Indica se o compromisso foi concluído';

