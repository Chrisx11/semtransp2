-- ============================================================================
-- SCRIPT SQL COMPLETO PARA CORRIGIR TODAS AS TABELAS COM COMPARAÇÃO EXATA
-- ============================================================================
-- Este script corrige todas as tabelas que têm campos usados em comparações exatas
-- no código, revertendo de maiúsculas para o formato original
-- ============================================================================
-- ATENÇÃO: Faça backup antes de executar!
-- ============================================================================

BEGIN;

-- Script de correção com tratamento de erros
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INICIANDO CORREÇÃO DE TODAS AS TABELAS';
  RAISE NOTICE '========================================';

  -- ==========================================================================
  -- TABELA: filtros_registrados
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'filtros_registrados') THEN
    UPDATE filtros_registrados SET categoria = 'Filtro de Óleo' WHERE UPPER(categoria) = 'FILTRO DE ÓLEO';
    UPDATE filtros_registrados SET categoria = 'Filtro de Comb.' WHERE UPPER(categoria) = 'FILTRO DE COMB.';
    UPDATE filtros_registrados SET categoria = 'Filtro de Ar' WHERE UPPER(categoria) = 'FILTRO DE AR';
    UPDATE filtros_registrados SET categoria = 'Filtro de Cabine' WHERE UPPER(categoria) = 'FILTRO DE CABINE';
    UPDATE filtros_registrados SET categoria = 'Filtro de Ar 1°' WHERE UPPER(categoria) = 'FILTRO DE AR 1°';
    UPDATE filtros_registrados SET categoria = 'Filtro de Ar 2°' WHERE UPPER(categoria) = 'FILTRO DE AR 2°';
    UPDATE filtros_registrados SET categoria = 'Filtro Separador' WHERE UPPER(categoria) = 'FILTRO SEPARADOR';
    UPDATE filtros_registrados SET categoria = 'Desumidificador' WHERE UPPER(categoria) = 'DESUMIDIFICADOR';
    UPDATE filtros_registrados SET categoria = 'Filtro de Transmissão' WHERE UPPER(categoria) = 'FILTRO DE TRANSMISSÃO';
    RAISE NOTICE 'Tabela filtros_registrados: categorias corrigidas';
  END IF;

  -- ==========================================================================
  -- TABELA: ordens_servico
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ordens_servico') THEN
    UPDATE ordens_servico SET status = 'Aguardando Mecânico', "updatedAt" = NOW() WHERE UPPER(status) = 'AGUARDANDO MECÂNICO';
    UPDATE ordens_servico SET status = 'Em Serviço', "updatedAt" = NOW() WHERE UPPER(status) = 'EM SERVIÇO';
    UPDATE ordens_servico SET status = 'Aguardando aprovação', "updatedAt" = NOW() WHERE UPPER(status) = 'AGUARDANDO APROVAÇÃO';
    UPDATE ordens_servico SET status = 'Fila de Serviço', "updatedAt" = NOW() WHERE UPPER(status) = 'FILA DE SERVIÇO';
    UPDATE ordens_servico SET status = 'Em Análise', "updatedAt" = NOW() WHERE UPPER(status) = 'EM ANÁLISE';
    UPDATE ordens_servico SET status = 'Aguardando OS', "updatedAt" = NOW() WHERE UPPER(status) = 'AGUARDANDO OS';
    UPDATE ordens_servico SET status = 'Aguardando Fornecedor', "updatedAt" = NOW() WHERE UPPER(status) = 'AGUARDANDO FORNECEDOR';
    UPDATE ordens_servico SET status = 'Comprar na Rua', "updatedAt" = NOW() WHERE UPPER(status) = 'COMPRAR NA RUA';
    UPDATE ordens_servico SET status = 'Em Aprovação', "updatedAt" = NOW() WHERE UPPER(status) = 'EM APROVAÇÃO';
    UPDATE ordens_servico SET status = 'Finalizado', "updatedAt" = NOW() WHERE UPPER(status) = 'FINALIZADO';
    UPDATE ordens_servico SET status = 'Serviço Externo', "updatedAt" = NOW() WHERE UPPER(status) = 'SERVIÇO EXTERNO';
    UPDATE ordens_servico SET status = 'Rascunho', "updatedAt" = NOW() WHERE UPPER(status) = 'RASCUNHO';
    RAISE NOTICE 'Tabela ordens_servico: status corrigidos';
  END IF;

  -- ==========================================================================
  -- TABELA: trocas_oleo
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trocas_oleo') THEN
    UPDATE trocas_oleo SET tipo_servico = 'Troca de Óleo', updated_at = NOW() WHERE UPPER(tipo_servico) = 'TROCA DE ÓLEO';
    UPDATE trocas_oleo SET tipo_servico = 'Atualização de Km', updated_at = NOW() WHERE UPPER(tipo_servico) = 'ATUALIZAÇÃO DE KM' OR UPPER(tipo_servico) = 'ATUALIZACAO DE KM';
    RAISE NOTICE 'Tabela trocas_oleo: tipo_servico corrigidos';
  END IF;

  -- ==========================================================================
  -- TABELA: trocas_pneu
  -- Nota: Esta tabela não tem comparações exatas no código, mas vamos manter
  -- os dados no formato correto para consistência
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trocas_pneu') THEN
    -- Apenas corrigir observações se necessário (não há comparações exatas)
    RAISE NOTICE 'Tabela trocas_pneu: verificada (sem comparações exatas no código)';
  END IF;

  -- ==========================================================================
  -- TABELA: veiculos
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'veiculos') THEN
    UPDATE veiculos 
    SET status = 'Ativo', "updatedAt" = NOW()
    WHERE UPPER(status) = 'ATIVO';
    
    UPDATE veiculos 
    SET status = 'Inativo', "updatedAt" = NOW()
    WHERE UPPER(status) = 'INATIVO';
    
    RAISE NOTICE 'Tabela veiculos: status corrigidos';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DE TODAS AS TABELAS CONCLUÍDA!';
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
-- Este script corrige todas as tabelas que têm campos usados em comparações
-- exatas no código, revertendo de maiúsculas para o formato original.
-- 
-- Tabelas corrigidas:
-- - filtros_registrados (categoria)
-- - ordens_servico (status)
-- - trocas_oleo (tipo_servico)
-- - veiculos (status)
-- ============================================================================

