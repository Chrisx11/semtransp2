-- ============================================================================
-- SCRIPT SQL PARA VERIFICAR SE OS DADOS AINDA EXISTEM NO BANCO
-- ============================================================================
-- Este script ajuda a identificar se os dados foram realmente deletados
-- ou se apenas não aparecem por problemas de comparação/formatação
-- ============================================================================

-- Verificar contagem de registros em cada tabela principal
-- Nota: Verificando apenas se as tabelas existem e têm dados
SELECT 
  'autorizacoes_borracharia' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN veiculo_placa IS NOT NULL THEN 1 END) AS com_placa,
  COUNT(CASE WHEN status IS NOT NULL THEN 1 END) AS com_status
FROM autorizacoes_borracharia
UNION ALL
SELECT 
  'autorizacoes_lavador' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN veiculo_placa IS NOT NULL THEN 1 END) AS com_placa,
  COUNT(CASE WHEN status IS NOT NULL THEN 1 END) AS com_status
FROM autorizacoes_lavador
UNION ALL
SELECT 
  'filtros_registrados' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN veiculoid IS NOT NULL THEN 1 END) AS com_veiculo,
  COUNT(CASE WHEN categoria IS NOT NULL THEN 1 END) AS com_categoria
FROM filtros_registrados
UNION ALL
SELECT 
  'produtos' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN descricao IS NOT NULL THEN 1 END) AS com_descricao,
  COUNT(CASE WHEN categoria IS NOT NULL THEN 1 END) AS com_categoria
FROM produtos
UNION ALL
SELECT 
  'veiculos' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN placa IS NOT NULL THEN 1 END) AS com_placa,
  COUNT(CASE WHEN modelo IS NOT NULL THEN 1 END) AS com_modelo
FROM veiculos
UNION ALL
SELECT 
  'entradas' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN "produtoDescricao" IS NOT NULL THEN 1 END) AS com_produto,
  COUNT(CASE WHEN "responsavelNome" IS NOT NULL THEN 1 END) AS com_responsavel
FROM entradas
UNION ALL
SELECT 
  'saidas' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN "produtoNome" IS NOT NULL THEN 1 END) AS com_produto,
  COUNT(CASE WHEN "veiculoPlaca" IS NOT NULL THEN 1 END) AS com_placa
FROM saidas
UNION ALL
SELECT 
  'ordens_servico' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN numero IS NOT NULL THEN 1 END) AS com_numero,
  COUNT(CASE WHEN status IS NOT NULL THEN 1 END) AS com_status
FROM ordens_servico
UNION ALL
SELECT 
  'colaboradores' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN nome IS NOT NULL THEN 1 END) AS com_nome,
  COUNT(CASE WHEN funcao IS NOT NULL THEN 1 END) AS com_funcao
FROM colaboradores
UNION ALL
SELECT 
  'fornecedores' AS tabela,
  COUNT(*) AS total_registros,
  COUNT(CASE WHEN nome IS NOT NULL THEN 1 END) AS com_nome,
  0 AS com_categoria
FROM fornecedores
ORDER BY tabela;

-- Verificar formato das categorias em filtros_registrados
SELECT 
  categoria,
  COUNT(*) AS quantidade,
  'Formato atual' AS observacao
FROM filtros_registrados
GROUP BY categoria
ORDER BY quantidade DESC;

-- Verificar se há dados em maiúsculas vs formato original
SELECT 
  'Verificação de formato' AS tipo,
  COUNT(CASE WHEN categoria = UPPER(categoria) THEN 1 END) AS em_maiusculas,
  COUNT(CASE WHEN categoria != UPPER(categoria) THEN 1 END) AS nao_maiusculas,
  COUNT(*) AS total
FROM filtros_registrados
WHERE categoria IS NOT NULL;

-- Mostrar alguns exemplos de dados para verificar formato
SELECT 
  'Exemplos de filtros_registrados' AS tipo,
  veiculoid,
  categoria,
  produtodescricao,
  "produtoDescricao"
FROM filtros_registrados
LIMIT 10;

