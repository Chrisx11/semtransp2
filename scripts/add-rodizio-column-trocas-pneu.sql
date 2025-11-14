-- Script para adicionar a coluna 'rodizio' à tabela trocas_pneu
-- Esta coluna indica se foi realizado rodízio de pneus (troca de posição)

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trocas_pneu' 
        AND column_name = 'rodizio'
    ) THEN
        ALTER TABLE trocas_pneu
        ADD COLUMN rodizio BOOLEAN DEFAULT FALSE;
        
        -- Comentário na coluna para documentação
        COMMENT ON COLUMN trocas_pneu.rodizio IS 'Indica se foi realizado rodízio de pneus (troca de posição) nesta troca';
        
        RAISE NOTICE 'Coluna rodizio adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna rodizio já existe na tabela.';
    END IF;
END $$;

-- Verificar se a coluna foi criada
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'trocas_pneu' 
  AND column_name = 'rodizio';

