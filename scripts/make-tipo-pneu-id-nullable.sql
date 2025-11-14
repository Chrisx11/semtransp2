-- Script para tornar a coluna tipo_pneu_id opcional (nullable) na tabela trocas_pneu
-- Isso permite registrar trocas de pneu usando produtos do estoque sem ter um tipo de pneu cadastrado

-- Alterar a coluna para permitir NULL
ALTER TABLE trocas_pneu 
ALTER COLUMN tipo_pneu_id DROP NOT NULL;

-- Verificar se a alteração foi aplicada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'trocas_pneu' 
  AND column_name = 'tipo_pneu_id';

