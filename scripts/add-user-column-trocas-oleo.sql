-- Script para adicionar a coluna 'user' à tabela trocas_oleo
-- Esta coluna armazena o ID do usuário que realizou a troca de óleo ou atualização de KM

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trocas_oleo' 
        AND column_name = 'user_id'
    ) THEN
        -- Adicionar coluna user_id como UUID (pode ser NULL para registros antigos)
        ALTER TABLE trocas_oleo
        ADD COLUMN user_id UUID;
        
        -- Criar índice para melhorar performance de consultas
        CREATE INDEX IF NOT EXISTS idx_trocas_oleo_user_id ON trocas_oleo(user_id);
        
        -- Comentário na coluna para documentação
        COMMENT ON COLUMN trocas_oleo.user_id IS 'ID do usuário que realizou a troca de óleo ou atualização de KM';
        
        RAISE NOTICE 'Coluna user_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna user_id já existe na tabela.';
    END IF;
END $$;

-- Verificar se a coluna foi criada
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'trocas_oleo' 
  AND column_name = 'user_id';

