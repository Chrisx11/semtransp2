-- Adicionar campo lavador_id na tabela autorizacoes_lavador
-- Execute este script no SQL Editor do Supabase após criar a tabela lavadores

-- Adicionar a coluna lavador_id (opcional, pode ser NULL para autorizações antigas)
ALTER TABLE autorizacoes_lavador 
ADD COLUMN IF NOT EXISTS lavador_id UUID REFERENCES lavadores(id) ON DELETE SET NULL;

-- Criar índice para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_autorizacoes_lavador_lavador_id ON autorizacoes_lavador(lavador_id);

-- Comentário para documentação
COMMENT ON COLUMN autorizacoes_lavador.lavador_id IS 'ID do lavador responsável pelo serviço (opcional)';
