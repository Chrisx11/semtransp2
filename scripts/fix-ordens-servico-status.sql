-- ============================================================================
-- SCRIPT SQL PARA CORRIGIR STATUS DAS ORDENS DE SERVIÇO
-- ============================================================================
-- Este script reverte os status para o formato original (primeira letra maiúscula)
-- pois esses status devem corresponder exatamente aos valores esperados pelo código
-- ============================================================================
-- ATENÇÃO: Faça backup antes de executar!
-- ============================================================================

BEGIN;

-- Script de correção com tratamento de erros
DO $$
BEGIN
  -- ==========================================================================
  -- TABELA: ordens_servico
  -- Reverter status para o formato original (primeira letra maiúscula)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ordens_servico') THEN
    
    -- Atualizar "AGUARDANDO MECÂNICO" para "Aguardando Mecânico"
    UPDATE ordens_servico 
    SET status = 'Aguardando Mecânico', "updatedAt" = NOW()
    WHERE UPPER(status) = 'AGUARDANDO MECÂNICO';
    
    -- Atualizar "EM SERVIÇO" para "Em Serviço"
    UPDATE ordens_servico 
    SET status = 'Em Serviço', "updatedAt" = NOW()
    WHERE UPPER(status) = 'EM SERVIÇO';
    
    -- Atualizar "AGUARDANDO APROVAÇÃO" para "Aguardando aprovação"
    UPDATE ordens_servico 
    SET status = 'Aguardando aprovação', "updatedAt" = NOW()
    WHERE UPPER(status) = 'AGUARDANDO APROVAÇÃO';
    
    -- Atualizar "FILA DE SERVIÇO" para "Fila de Serviço"
    UPDATE ordens_servico 
    SET status = 'Fila de Serviço', "updatedAt" = NOW()
    WHERE UPPER(status) = 'FILA DE SERVIÇO';
    
    -- Atualizar "EM ANÁLISE" para "Em Análise"
    UPDATE ordens_servico 
    SET status = 'Em Análise', "updatedAt" = NOW()
    WHERE UPPER(status) = 'EM ANÁLISE';
    
    -- Atualizar "AGUARDANDO OS" para "Aguardando OS"
    UPDATE ordens_servico 
    SET status = 'Aguardando OS', "updatedAt" = NOW()
    WHERE UPPER(status) = 'AGUARDANDO OS';
    
    -- Atualizar "AGUARDANDO FORNECEDOR" para "Aguardando Fornecedor"
    UPDATE ordens_servico 
    SET status = 'Aguardando Fornecedor', "updatedAt" = NOW()
    WHERE UPPER(status) = 'AGUARDANDO FORNECEDOR';
    
    -- Atualizar "COMPRAR NA RUA" para "Comprar na Rua"
    UPDATE ordens_servico 
    SET status = 'Comprar na Rua', "updatedAt" = NOW()
    WHERE UPPER(status) = 'COMPRAR NA RUA';
    
    -- Atualizar "EM APROVAÇÃO" para "Em Aprovação"
    UPDATE ordens_servico 
    SET status = 'Em Aprovação', "updatedAt" = NOW()
    WHERE UPPER(status) = 'EM APROVAÇÃO';
    
    -- Atualizar "FINALIZADO" para "Finalizado"
    UPDATE ordens_servico 
    SET status = 'Finalizado', "updatedAt" = NOW()
    WHERE UPPER(status) = 'FINALIZADO';
    
    -- Atualizar "SERVIÇO EXTERNO" para "Serviço Externo"
    UPDATE ordens_servico 
    SET status = 'Serviço Externo', "updatedAt" = NOW()
    WHERE UPPER(status) = 'SERVIÇO EXTERNO';
    
    -- Atualizar "RASCUNHO" para "Rascunho" (se existir)
    UPDATE ordens_servico 
    SET status = 'Rascunho', "updatedAt" = NOW()
    WHERE UPPER(status) = 'RASCUNHO';
    
    -- Corrigir também valores no campo historico (JSONB) se necessário
    -- Nota: O histórico é JSONB, então precisamos atualizar de forma diferente
    -- Por enquanto, apenas corrigimos o campo status diretamente
    
    RAISE NOTICE 'Tabela ordens_servico: status corrigidos';
    
    -- Mostrar quantos registros foram atualizados
    RAISE NOTICE 'Verifique os registros para confirmar a correção';
    RAISE NOTICE 'NOTA: Se o histórico (JSONB) também tiver valores em maiúsculas,';
    RAISE NOTICE 'pode ser necessário corrigir manualmente ou criar script específico';
  ELSE
    RAISE NOTICE 'Tabela ordens_servico não encontrada';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DE STATUS CONCLUÍDA!';
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERRO: %', SQLERRM;
    RAISE NOTICE 'Executando ROLLBACK devido ao erro...';
    RAISE;
END $$;

-- Confirmar a transação
COMMIT;

-- ============================================================================
-- NOTA: Se algo der errado, você pode desfazer usando:
-- ROLLBACK;
-- ============================================================================
-- 
-- Este script corrige os status que foram convertidos para maiúsculas
-- mas que devem manter o formato original (primeira letra maiúscula) para
-- corresponder aos valores esperados pelo código em ordem-servico/page.tsx
-- ============================================================================

