-- ============================================================================
-- SCRIPT SQL SIMPLES PARA VERIFICAR SE OS DADOS AINDA EXISTEM NO BANCO
-- ============================================================================
-- Este script verifica apenas a contagem de registros em cada tabela
-- Execute uma query por vez se houver erros
-- ============================================================================

-- 1. Verificar filtros_registrados (tabela que teve problemas)
SELECT 
  'filtros_registrados' AS tabela,
  COUNT(*) AS total_registros
FROM filtros_registrados;

-- 2. Verificar produtos
SELECT 
  'produtos' AS tabela,
  COUNT(*) AS total_registros
FROM produtos;

-- 3. Verificar veiculos
SELECT 
  'veiculos' AS tabela,
  COUNT(*) AS total_registros
FROM veiculos;

-- 4. Verificar entradas
SELECT 
  'entradas' AS tabela,
  COUNT(*) AS total_registros
FROM entradas;

-- 5. Verificar saidas
SELECT 
  'saidas' AS tabela,
  COUNT(*) AS total_registros
FROM saidas;

-- 6. Verificar ordens_servico
SELECT 
  'ordens_servico' AS tabela,
  COUNT(*) AS total_registros
FROM ordens_servico;

-- 7. Verificar colaboradores
SELECT 
  'colaboradores' AS tabela,
  COUNT(*) AS total_registros
FROM colaboradores;

-- 8. Verificar fornecedores
SELECT 
  'fornecedores' AS tabela,
  COUNT(*) AS total_registros
FROM fornecedores;

-- 9. Verificar autorizacoes_borracharia
SELECT 
  'autorizacoes_borracharia' AS tabela,
  COUNT(*) AS total_registros
FROM autorizacoes_borracharia;

-- 10. Verificar autorizacoes_lavador
SELECT 
  'autorizacoes_lavador' AS tabela,
  COUNT(*) AS total_registros
FROM autorizacoes_lavador;

-- ============================================================================
-- VERIFICAÇÕES ESPECÍFICAS PARA FILTROS_REGISTRADOS
-- ============================================================================

-- Verificar formato das categorias em filtros_registrados
SELECT 
  categoria,
  COUNT(*) AS quantidade
FROM filtros_registrados
GROUP BY categoria
ORDER BY quantidade DESC;

-- Verificar se há dados em maiúsculas
SELECT 
  COUNT(CASE WHEN categoria = UPPER(categoria) THEN 1 END) AS em_maiusculas,
  COUNT(CASE WHEN categoria != UPPER(categoria) THEN 1 END) AS nao_maiusculas,
  COUNT(*) AS total
FROM filtros_registrados
WHERE categoria IS NOT NULL;

-- Mostrar exemplos de dados
SELECT 
  veiculoid,
  categoria,
  COALESCE(produtodescricao, "produtoDescricao") AS produto_descricao
FROM filtros_registrados
LIMIT 20;

