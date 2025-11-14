-- ============================================================================
-- SCRIPT SQL PARA CORRIGIR USERNAMES NA TABELA users
-- ============================================================================
-- Este script reverte os usernames para minúsculas (formato padrão)
-- pois a comparação no código é case-sensitive e pode falhar se estiver em maiúsculas
-- ============================================================================
-- ATENÇÃO: Faça backup antes de executar!
-- ============================================================================

BEGIN;

-- Script de correção com tratamento de erros
DO $$
BEGIN
  -- ==========================================================================
  -- TABELA: users
  -- Reverter usernames para minúsculas (formato padrão para login)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    
    -- Atualizar todos os usernames para minúsculas
    UPDATE users 
    SET username = LOWER(username), updated_at = NOW()
    WHERE username IS NOT NULL 
      AND username != LOWER(username);
    
    -- Também corrigir names para formato "Primeira Letra Maiúscula"
    UPDATE users 
    SET name = INITCAP(name), updated_at = NOW()
    WHERE name IS NOT NULL 
      AND name != INITCAP(name);
    
    RAISE NOTICE 'Tabela users: usernames e names corrigidos';
    
    -- Mostrar quantos registros foram atualizados
    RAISE NOTICE 'Verifique os registros para confirmar a correção';
  ELSE
    RAISE NOTICE 'Tabela users não encontrada';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DE USERNAMES CONCLUÍDA!';
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
-- Este script corrige os usernames que foram convertidos para maiúsculas
-- mas que devem estar em minúsculas para funcionar com a comparação case-sensitive
-- no código de autenticação (auth-context.tsx linha 580)
-- ============================================================================

