-- Permitir quantidades fracionadas em entradas/saídas e estoque
-- Execute este script no Supabase SQL Editor

BEGIN;

-- Entradas
ALTER TABLE IF EXISTS entradas
  ALTER COLUMN quantidade TYPE NUMERIC(14,3) USING quantidade::NUMERIC(14,3);

-- Saídas
ALTER TABLE IF EXISTS saidas
  ALTER COLUMN quantidade TYPE NUMERIC(14,3) USING quantidade::NUMERIC(14,3);

-- Produtos (estoque também precisa aceitar fração para manter consistência)
ALTER TABLE IF EXISTS produtos
  ALTER COLUMN estoque TYPE NUMERIC(14,3) USING estoque::NUMERIC(14,3);

COMMIT;

