-- Script para adicionar colunas alinhamento e balanceamento à tabela trocas_pneu
-- Este script pode ser executado manualmente no Supabase SQL Editor

-- Verificar se as colunas já existem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'trocas_pneu' AND column_name = 'alinhamento'
    ) THEN
        -- Adicionar coluna alinhamento
        ALTER TABLE trocas_pneu
        ADD COLUMN alinhamento BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna "alinhamento" adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'Coluna "alinhamento" já existe.';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'trocas_pneu' AND column_name = 'balanceamento'
    ) THEN
        -- Adicionar coluna balanceamento
        ALTER TABLE trocas_pneu
        ADD COLUMN balanceamento BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna "balanceamento" adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'Coluna "balanceamento" já existe.';
    END IF;
END $$;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN trocas_pneu.alinhamento IS 'Indica se foi realizado alinhamento durante a troca de pneu';
COMMENT ON COLUMN trocas_pneu.balanceamento IS 'Indica se foi realizado balanceamento durante a troca de pneu';

-- Atualizar os registros existentes para definir valores padrão
UPDATE trocas_pneu 
SET 
    alinhamento = FALSE,
    balanceamento = FALSE
WHERE 
    alinhamento IS NULL OR balanceamento IS NULL; 