-- Script completo para remover TODAS as restrições que impedem exclusão de produtos
-- Execute este script para identificar e remover todas as restrições de chave estrangeira

-- 1. PRIMEIRO: Identificar TODAS as restrições que referenciam a tabela produtos
SELECT 
    tc.table_name as tabela_que_referencia,
    kcu.column_name as coluna_que_referencia,
    tc.constraint_name as nome_da_restricao,
    tc.constraint_type as tipo_restricao
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'produtos'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 2. SEGUNDO: Remover TODAS as restrições identificadas acima
-- (Execute apenas as linhas correspondentes às restrições encontradas na query acima)

-- Para tabela 'entradas'
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'produtos'
          AND tc.table_name = 'entradas'
          AND tc.table_schema = 'public'
    LOOP
        EXECUTE 'ALTER TABLE entradas DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Removida restrição: %', constraint_name;
    END LOOP;
END $$;

-- Para tabela 'saidas'
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'produtos'
          AND tc.table_name = 'saidas'
          AND tc.table_schema = 'public'
    LOOP
        EXECUTE 'ALTER TABLE saidas DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Removida restrição: %', constraint_name;
    END LOOP;
END $$;

-- Para qualquer outra tabela que referencie produtos
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'produtos'
          AND tc.table_name NOT IN ('entradas', 'saidas')
          AND tc.table_schema = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Removida restrição da tabela %: %', constraint_record.table_name, constraint_record.constraint_name;
    END LOOP;
END $$;

-- 3. TERCEIRO: Verificar se todas as restrições foram removidas
SELECT 
    tc.table_name as tabela_que_referencia,
    kcu.column_name as coluna_que_referencia,
    tc.constraint_name as nome_da_restricao
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'produtos'
  AND tc.table_schema = 'public';

-- Se a query acima retornar resultados vazios, todas as restrições foram removidas
-- Agora você pode excluir os produtos duplicados manualmente

-- 4. QUARTO: Listar produtos duplicados para facilitar a exclusão manual
SELECT 
    descricao,
    categoria,
    COUNT(*) as quantidade_duplicados,
    STRING_AGG(id::text, ', ') as ids_para_excluir
FROM produtos 
GROUP BY descricao, categoria
HAVING COUNT(*) > 1
ORDER BY quantidade_duplicados DESC, descricao;
