-- ============================================================================
-- SCRIPT PARA VERIFICAR DADOS DAS TABELAS trocas_oleo E trocas_pneu
-- ============================================================================
-- Este script mostra quais valores existem no banco e quantos registros têm cada um
-- ============================================================================

-- Verificar contagem total de trocas_oleo
SELECT 
  'Total de trocas_oleo' AS tipo,
  COUNT(*) AS quantidade
FROM trocas_oleo;

-- Verificar todos os tipo_servico únicos e suas quantidades
SELECT 
  tipo_servico,
  COUNT(*) AS quantidade
FROM trocas_oleo
GROUP BY tipo_servico
ORDER BY quantidade DESC;

-- Verificar se os tipo_servico estão em maiúsculas
SELECT 
  'tipo_servico em maiúsculas' AS tipo,
  COUNT(CASE WHEN tipo_servico = UPPER(tipo_servico) THEN 1 END) AS em_maiusculas,
  COUNT(CASE WHEN tipo_servico != UPPER(tipo_servico) THEN 1 END) AS nao_maiusculas,
  COUNT(*) AS total
FROM trocas_oleo
WHERE tipo_servico IS NOT NULL;

-- Verificar contagem total de trocas_pneu
SELECT 
  'Total de trocas_pneu' AS tipo,
  COUNT(*) AS quantidade
FROM trocas_pneu;

-- Mostrar exemplos de dados
SELECT 
  'Exemplos de trocas_oleo' AS tipo,
  id,
  veiculo_id,
  tipo_servico,
  observacao
FROM trocas_oleo
LIMIT 10;

SELECT 
  'Exemplos de trocas_pneu' AS tipo,
  id,
  veiculo_id,
  observacao
FROM trocas_pneu
LIMIT 10;

