-- Script para adicionar colunas de período na tabela trocas_pneu
-- Essas colunas permitem controlar quando cada tipo de manutenção deve ser realizada novamente

-- Adicionar coluna para período de rodízio (em km)
ALTER TABLE trocas_pneu
ADD COLUMN IF NOT EXISTS periodo_rodizio INTEGER;

-- Adicionar coluna para período de alinhamento (em km)
ALTER TABLE trocas_pneu
ADD COLUMN IF NOT EXISTS periodo_alinhamento INTEGER;

-- Adicionar coluna para período de balanceamento (em km)
ALTER TABLE trocas_pneu
ADD COLUMN IF NOT EXISTS periodo_balanceamento INTEGER;

-- Comentários para documentar as colunas
COMMENT ON COLUMN trocas_pneu.periodo_rodizio IS 'Período em km para próximo rodízio de pneus';
COMMENT ON COLUMN trocas_pneu.periodo_alinhamento IS 'Período em km para próximo alinhamento';
COMMENT ON COLUMN trocas_pneu.periodo_balanceamento IS 'Período em km para próximo balanceamento';

