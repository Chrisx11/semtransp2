-- Script para FORÇAR a remoção de todas as restrições de chave estrangeira
-- Este script tenta remover todas as possíveis variações de nomes de restrições

-- 1. Remover restrições da tabela entradas (todas as possíveis variações)
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_produtoid_fkey;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS fk_entradas_produto;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_produto_id_fkey;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_produtoid_fkey;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_produto_fkey;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS fk_produto_entradas;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS produto_id_fkey;
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS produtos_entradas_fkey;

-- 2. Remover restrições da tabela saidas (todas as possíveis variações)
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_produtoid_fkey;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS fk_saidas_produto;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_produto_id_fkey;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_produtoid_fkey;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_produto_fkey;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS fk_produto_saidas;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS produto_id_fkey;
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS produtos_saidas_fkey;

-- 3. Verificar se ainda existem restrições
SELECT 
    tc.table_name as tabela,
    kcu.column_name as coluna,
    tc.constraint_name as restricao
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'produtos'
  AND tc.table_schema = 'public';

-- Se ainda houver restrições listadas acima, execute manualmente:
-- ALTER TABLE [nome_da_tabela] DROP CONSTRAINT [nome_da_restricao];










