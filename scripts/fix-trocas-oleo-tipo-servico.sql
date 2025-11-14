-- ============================================================================
-- SCRIPT SQL PARA CORRIGIR TIPO_SERVICO NA TABELA trocas_oleo
-- ============================================================================
-- Este script reverte os valores de tipo_servico para o formato original
-- pois esses valores devem corresponder exatamente aos valores esperados pelo código
-- ============================================================================
-- ATENÇÃO: Faça backup antes de executar!
-- ============================================================================

BEGIN;

-- Script de correção com tratamento de erros
DO $$
BEGIN
  -- ==========================================================================
  -- TABELA: trocas_oleo
  -- Reverter tipo_servico para o formato original (primeira letra maiúscula)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trocas_oleo') THEN
    
    -- Atualizar "TROCA DE ÓLEO" para "Troca de Óleo"
    UPDATE trocas_oleo 
    SET tipo_servico = 'Troca de Óleo', updated_at = NOW()
    WHERE UPPER(tipo_servico) = 'TROCA DE ÓLEO';
    
    -- Atualizar "ATUALIZAÇÃO DE KM" para "Atualização de Km"
    UPDATE trocas_oleo 
    SET tipo_servico = 'Atualização de Km', updated_at = NOW()
    WHERE UPPER(tipo_servico) = 'ATUALIZAÇÃO DE KM' 
       OR UPPER(tipo_servico) = 'ATUALIZACAO DE KM';
    
    RAISE NOTICE 'Tabela trocas_oleo: tipo_servico corrigidos';
    
    -- Mostrar quantos registros foram atualizados
    RAISE NOTICE 'Verifique os registros para confirmar a correção';
  ELSE
    RAISE NOTICE 'Tabela trocas_oleo não encontrada';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DE TIPO_SERVICO CONCLUÍDA!';
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
-- Este script corrige os valores de tipo_servico que foram convertidos para maiúsculas
-- mas que devem manter o formato original (primeira letra maiúscula) para
-- corresponder aos valores esperados pelo código em troca-oleo-service.ts
-- ============================================================================

