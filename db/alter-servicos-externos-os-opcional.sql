-- Permitir lançar serviços externos sem Ordem de Serviço
-- Execute no SQL Editor do Supabase

ALTER TABLE servicos_externos
  ALTER COLUMN ordem_servico_id DROP NOT NULL;

ALTER TABLE servicos_externos
  ALTER COLUMN ordem_servico_numero DROP NOT NULL;

COMMENT ON COLUMN servicos_externos.ordem_servico_id IS 'ID da ordem de serviço relacionada (nulo quando lançado diretamente sem OS)';
COMMENT ON COLUMN servicos_externos.ordem_servico_numero IS 'Número da ordem de serviço (nulo ou "Sem OS" quando lançado diretamente)';
