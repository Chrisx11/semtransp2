-- Script SQL para listar todas as tabelas e colunas do Supabase
-- Execute este script no SQL Editor do Supabase para ver a estrutura completa do banco

-- Opção 1: Lista simples de tabelas e colunas (formato mais legível)
SELECT 
    t.table_name AS "Tabela",
    c.column_name AS "Coluna",
    c.data_type AS "Tipo de Dados",
    c.character_maximum_length AS "Tamanho Máximo",
    CASE 
        WHEN c.is_nullable = 'YES' THEN 'Sim'
        ELSE 'Não'
    END AS "Permite NULL",
    c.column_default AS "Valor Padrão",
    c.ordinal_position AS "Ordem"
FROM 
    information_schema.tables t
    INNER JOIN information_schema.columns c 
        ON t.table_schema = c.table_schema 
        AND t.table_name = c.table_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name, 
    c.ordinal_position;

-- Opção 2: Lista agrupada por tabela (formato mais compacto)
SELECT 
    table_name AS "Tabela",
    STRING_AGG(
        column_name || ' (' || data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        ')',
        ', ' ORDER BY ordinal_position
    ) AS "Colunas"
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
GROUP BY 
    table_name
ORDER BY 
    table_name;

-- Opção 3: Lista apenas os nomes das tabelas
SELECT 
    table_name AS "Nome da Tabela"
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY 
    table_name;

-- Opção 4: Informações detalhadas incluindo chaves primárias e estrangeiras
SELECT 
    t.table_name AS "Tabela",
    c.column_name AS "Coluna",
    c.data_type AS "Tipo",
    c.character_maximum_length AS "Tamanho",
    CASE WHEN c.is_nullable = 'YES' THEN 'Sim' ELSE 'Não' END AS "Nullable",
    c.column_default AS "Default",
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PK'
        WHEN fk.column_name IS NOT NULL THEN 'FK'
        ELSE ''
    END AS "Chave"
FROM 
    information_schema.tables t
    INNER JOIN information_schema.columns c 
        ON t.table_schema = c.table_schema 
        AND t.table_name = c.table_name
    LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        INNER JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
    ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        INNER JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name, 
    c.ordinal_position;

