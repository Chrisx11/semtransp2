-- ============================================================================
-- SCRIPT PARA VERIFICAR STATUS DAS ORDENS DE SERVIÇO
-- ============================================================================
-- Este script mostra quais status existem no banco e quantos registros têm cada um
-- ============================================================================

-- Verificar contagem total
SELECT 
  'Total de ordens' AS tipo,
  COUNT(*) AS quantidade
FROM ordens_servico;

-- Verificar todos os status únicos e suas quantidades
SELECT 
  status,
  COUNT(*) AS quantidade
FROM ordens_servico
GROUP BY status
ORDER BY quantidade DESC;

-- Verificar se os status estão em maiúsculas
SELECT 
  'Status em maiúsculas' AS tipo,
  COUNT(CASE WHEN status = UPPER(status) THEN 1 END) AS em_maiusculas,
  COUNT(CASE WHEN status != UPPER(status) THEN 1 END) AS nao_maiusculas,
  COUNT(*) AS total
FROM ordens_servico
WHERE status IS NOT NULL;

-- Mostrar exemplos de status
SELECT 
  id,
  numero,
  status,
  prioridade
FROM ordens_servico
LIMIT 20;

