-- Script para remover temporariamente as restrições de chave estrangeira
-- que impedem a exclusão de produtos duplicados
-- 
-- ATENÇÃO: Este script deve ser executado com cuidado e as restrições
-- devem ser reativadas após a limpeza dos produtos duplicados

-- 1. Identificar todas as restrições de chave estrangeira que referenciam a tabela produtos
-- Execute esta query primeiro para ver quais restrições existem:

SELECT 
    tc.table_name as tabela_referenciadora,
    kcu.column_name as coluna_referenciadora,
    ccu.table_name AS tabela_referenciada,
    ccu.column_name AS coluna_referenciada,
    tc.constraint_name as nome_constraint
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'produtos'
  AND tc.table_schema = 'public';

-- 2. Remover restrições de chave estrangeira das tabelas que referenciam produtos
-- (Execute apenas as linhas necessárias baseadas no resultado da query acima)

-- Para tabela 'entradas':
ALTER TABLE IF EXISTS entradas DROP CONSTRAINT IF EXISTS entradas_produtoid_fkey;
ALTER TABLE IF EXISTS entradas DROP CONSTRAINT IF EXISTS fk_entradas_produto;
ALTER TABLE IF EXISTS entradas DROP CONSTRAINT IF EXISTS entradas_produto_id_fkey;

-- Para tabela 'saidas':
ALTER TABLE IF EXISTS saidas DROP CONSTRAINT IF EXISTS saidas_produtoid_fkey;
ALTER TABLE IF EXISTS saidas DROP CONSTRAINT IF EXISTS fk_saidas_produto;
ALTER TABLE IF EXISTS saidas DROP CONSTRAINT IF EXISTS saidas_produto_id_fkey;

-- Para outras possíveis tabelas que possam referenciar produtos:
ALTER TABLE IF EXISTS ordem_servico_produtos DROP CONSTRAINT IF EXISTS ordem_servico_produtos_produto_id_fkey;
ALTER TABLE IF EXISTS ordem_servico_produtos DROP CONSTRAINT IF EXISTS fk_ordem_servico_produtos_produto;

-- 3. Verificar se as restrições foram removidas
SELECT 
    tc.table_name as tabela_referenciadora,
    kcu.column_name as coluna_referenciadora,
    ccu.table_name AS tabela_referenciada,
    ccu.column_name AS coluna_referenciada,
    tc.constraint_name as nome_constraint
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'produtos'
  AND tc.table_schema = 'public';

-- Se a query acima retornar resultados vazios, as restrições foram removidas com sucesso
-- Agora você pode prosseguir com a exclusão dos produtos duplicados
