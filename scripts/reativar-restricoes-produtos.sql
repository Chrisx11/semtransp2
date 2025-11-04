-- Script para reativar as restrições de chave estrangeira após a limpeza dos produtos duplicados
-- Execute este script APÓS ter removido os produtos duplicados para restaurar a integridade do banco

-- 1. Reativar restrições de chave estrangeira para a tabela 'entradas'
-- Adicionar restrição para produtoId na tabela entradas
ALTER TABLE IF EXISTS entradas 
ADD CONSTRAINT fk_entradas_produto 
FOREIGN KEY (produtoId) REFERENCES produtos(id) ON DELETE CASCADE;

-- 2. Reativar restrições de chave estrangeira para a tabela 'saidas'
-- Adicionar restrição para produtoId na tabela saidas
ALTER TABLE IF EXISTS saidas 
ADD CONSTRAINT fk_saidas_produto 
FOREIGN KEY (produtoId) REFERENCES produtos(id) ON DELETE CASCADE;

-- 3. Reativar restrições para outras possíveis tabelas que referenciam produtos
-- Para tabela ordem_servico_produtos (se existir) - comentado pois pode não existir
-- ALTER TABLE IF EXISTS ordem_servico_produtos 
-- ADD CONSTRAINT fk_ordem_servico_produtos_produto 
-- FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;

-- 4. Verificar se as restrições foram reativadas corretamente
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
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 5. Testar a integridade referencial
-- Esta query deve retornar 0 se não houver registros órfãos
SELECT 
    'entradas' as tabela,
    COUNT(*) as registros_orfãos
FROM entradas e 
LEFT JOIN produtos p ON e.produtoId = p.id 
WHERE p.id IS NULL

UNION ALL

SELECT 
    'saidas' as tabela,
    COUNT(*) as registros_orfãos
FROM saidas s 
LEFT JOIN produtos p ON s.produtoId = p.id 
WHERE p.id IS NULL;

-- Se alguma das queries acima retornar registros_orfãos > 0, 
-- você precisa corrigir esses registros antes de reativar as restrições
