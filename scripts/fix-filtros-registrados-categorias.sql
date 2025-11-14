-- ============================================================================
-- SCRIPT SQL PARA CORRIGIR CATEGORIAS NA TABELA filtros_registrados
-- ============================================================================
-- Este script reverte as categorias para o formato original (primeira letra maiúscula)
-- pois essas categorias devem corresponder exatamente aos valores em FILTER_HEADERS
-- ============================================================================
-- ATENÇÃO: Faça backup antes de executar!
-- ============================================================================

BEGIN;

-- Script de correção com tratamento de erros
DO $$
BEGIN
  -- ==========================================================================
  -- TABELA: filtros_registrados
  -- Reverter categorias para o formato original (primeira letra maiúscula)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'filtros_registrados') THEN
    
    -- Atualizar "FILTRO DE ÓLEO" para "Filtro de Óleo"
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Óleo'
    WHERE UPPER(categoria) = 'FILTRO DE ÓLEO';
    
    -- Atualizar "FILTRO DE COMB." para "Filtro de Comb."
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Comb.'
    WHERE UPPER(categoria) = 'FILTRO DE COMB.';
    
    -- Atualizar "FILTRO DE AR" para "Filtro de Ar"
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Ar'
    WHERE UPPER(categoria) = 'FILTRO DE AR';
    
    -- Atualizar "FILTRO DE CABINE" para "Filtro de Cabine"
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Cabine'
    WHERE UPPER(categoria) = 'FILTRO DE CABINE';
    
    -- Atualizar "FILTRO DE AR 1°" para "Filtro de Ar 1°"
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Ar 1°'
    WHERE UPPER(categoria) = 'FILTRO DE AR 1°';
    
    -- Atualizar "FILTRO DE AR 2°" para "Filtro de Ar 2°"
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Ar 2°'
    WHERE UPPER(categoria) = 'FILTRO DE AR 2°';
    
    -- Atualizar "FILTRO SEPARADOR" para "Filtro Separador"
    UPDATE filtros_registrados 
    SET categoria = 'Filtro Separador'
    WHERE UPPER(categoria) = 'FILTRO SEPARADOR';
    
    -- Atualizar "DESUMIDIFICADOR" para "Desumidificador"
    UPDATE filtros_registrados 
    SET categoria = 'Desumidificador'
    WHERE UPPER(categoria) = 'DESUMIDIFICADOR';
    
    -- Atualizar "FILTRO DE TRANSMISSÃO" para "Filtro de Transmissão"
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Transmissão'
    WHERE UPPER(categoria) = 'FILTRO DE TRANSMISSÃO';
    
    RAISE NOTICE 'Tabela filtros_registrados: categorias corrigidas';
    
    -- Mostrar quantos registros foram atualizados
    RAISE NOTICE 'Verifique os registros para confirmar a correção';
  ELSE
    RAISE NOTICE 'Tabela filtros_registrados não encontrada';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DE CATEGORIAS CONCLUÍDA!';
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
-- Este script corrige as categorias que foram convertidas para maiúsculas
-- mas que devem manter o formato original (primeira letra maiúscula) para
-- corresponder aos valores em FILTER_HEADERS no código.
-- ============================================================================

