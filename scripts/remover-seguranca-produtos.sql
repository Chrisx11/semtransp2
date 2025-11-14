-- Script para remover as restrições de chave estrangeira da tabela produtos
-- Isso permitirá que você exclua produtos duplicados manualmente
-- 
-- ATENÇÃO: Após remover os produtos duplicados, execute o script 
-- "reativar-restricoes-produtos.sql" para restaurar a segurança

-- 1. Primeiro, vamos ver quais restrições existem atualmente
SELECT 
    tc.table_name as tabela_que_referencia,
    kcu.column_name as coluna_que_referencia,
    tc.constraint_name as nome_da_restricao
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.constraint_name LIKE '%produto%';

-- 2. Remover as restrições de chave estrangeira que impedem exclusão de produtos

-- Remover restrições da tabela 'entradas'
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_produtoid_fkey;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS fk_entradas_produto;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_produto_id_fkey;

-- Remover restrições da tabela 'saidas'  
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_produtoid_fkey;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS fk_saidas_produto;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_produto_id_fkey;

-- Remover restrições de outras possíveis tabelas (comentado pois podem não existir)
-- ALTER TABLE ordem_servico_produtos DROP CONSTRAINT IF EXISTS ordem_servico_produtos_produto_id_fkey;
-- ALTER TABLE ordem_servico_produtos DROP CONSTRAINT IF EXISTS fk_ordem_servico_produtos_produto;

-- 3. Verificar se as restrições foram removidas
SELECT 
    tc.table_name as tabela_que_referencia,
    kcu.column_name as coluna_que_referencia,
    tc.constraint_name as nome_da_restricao
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.constraint_name LIKE '%produto%';

-- Se a query acima retornar resultados vazios, as restrições foram removidas com sucesso
-- Agora você pode excluir os produtos duplicados manualmente

-- IMPORTANTE: Após terminar de excluir os produtos duplicados,
-- execute o script "reativar-restricoes-produtos.sql" para restaurar a segurança
