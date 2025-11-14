-- ============================================================================
-- SCRIPT SQL PARA CORRIGIR STATUS DOS VEÍCULOS
-- ============================================================================
-- Este script reverte os status para o formato original (primeira letra maiúscula)
-- pois esses valores devem corresponder exatamente aos valores esperados pelo código
-- ============================================================================
-- ATENÇÃO: Faça backup antes de executar!
-- ============================================================================

BEGIN;

-- Script de correção com tratamento de erros
DO $$
BEGIN
  -- ==========================================================================
  -- TABELA: veiculos
  -- Reverter status para o formato original (primeira letra maiúscula)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'veiculos') THEN
    
    -- Atualizar "ATIVO" para "Ativo"
    UPDATE veiculos 
    SET status = 'Ativo', "updatedAt" = NOW()
    WHERE UPPER(status) = 'ATIVO';
    
    -- Atualizar "INATIVO" para "Inativo"
    UPDATE veiculos 
    SET status = 'Inativo', "updatedAt" = NOW()
    WHERE UPPER(status) = 'INATIVO';
    
    -- Outros status possíveis (se existirem)
    -- Manter em maiúsculas apenas se forem siglas ou códigos
    -- Exemplo: se houver "EM MANUTENÇÃO", converter para "Em Manutenção"
    UPDATE veiculos 
    SET status = INITCAP(status), "updatedAt" = NOW()
    WHERE status IS NOT NULL 
      AND status != UPPER(status) 
      AND UPPER(status) NOT IN ('ATIVO', 'INATIVO');
    
    RAISE NOTICE 'Tabela veiculos: status corrigidos';
    
    -- Mostrar quantos registros foram atualizados
    RAISE NOTICE 'Verifique os registros para confirmar a correção';
  ELSE
    RAISE NOTICE 'Tabela veiculos não encontrada';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DE STATUS DOS VEÍCULOS CONCLUÍDA!';
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
-- corresponder aos valores esperados pelo código em dashboard/page.tsx
-- ============================================================================

