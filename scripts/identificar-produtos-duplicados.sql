-- Script para identificar produtos duplicados na tabela produtos
-- Execute este script ANTES de remover as restrições para ver quais produtos estão duplicados

-- 1. Identificar produtos duplicados por descrição (nome)
-- Esta query mostra todos os produtos que têm a mesma descrição
SELECT 
    descricao,
    COUNT(*) as quantidade_duplicados,
    STRING_AGG(id::text, ', ') as ids_duplicados,
    STRING_AGG(createdAt, ', ') as datas_criacao
FROM produtos 
GROUP BY descricao 
HAVING COUNT(*) > 1
ORDER BY quantidade_duplicados DESC, descricao;

-- 2. Identificar produtos duplicados por descrição + categoria
-- Esta query é mais específica, considerando descrição e categoria juntas
SELECT 
    descricao,
    categoria,
    COUNT(*) as quantidade_duplicados,
    STRING_AGG(id::text, ', ') as ids_duplicados,
    STRING_AGG(createdAt, ', ') as datas_criacao
FROM produtos 
GROUP BY descricao, categoria
HAVING COUNT(*) > 1
ORDER BY quantidade_duplicados DESC, descricao, categoria;

-- 3. Verificar se produtos duplicados têm entradas/saídas
-- Esta query mostra quais produtos duplicados têm movimentações
WITH produtos_duplicados AS (
    SELECT 
        descricao,
        categoria,
        COUNT(*) as quantidade_duplicados,
        STRING_AGG(id::text, ', ') as ids_duplicados
    FROM produtos 
    GROUP BY descricao, categoria
    HAVING COUNT(*) > 1
)
SELECT 
    pd.descricao,
    pd.categoria,
    pd.quantidade_duplicados,
    pd.ids_duplicados,
    COUNT(e.id) as total_entradas,
    COUNT(s.id) as total_saidas
FROM produtos_duplicados pd
LEFT JOIN produtos p ON p.descricao = pd.descricao AND p.categoria = pd.categoria
LEFT JOIN entradas e ON e.produtoId = p.id
LEFT JOIN saidas s ON s.produtoId = p.id
GROUP BY pd.descricao, pd.categoria, pd.quantidade_duplicados, pd.ids_duplicados
ORDER BY (COUNT(e.id) + COUNT(s.id)) DESC;

-- 4. Mostrar detalhes completos dos produtos duplicados
-- Esta query mostra todas as informações dos produtos duplicados
WITH produtos_duplicados AS (
    SELECT 
        descricao,
        categoria,
        COUNT(*) as quantidade_duplicados
    FROM produtos 
    GROUP BY descricao, categoria
    HAVING COUNT(*) > 1
)
SELECT 
    p.id,
    p.descricao,
    p.categoria,
    p.unidade,
    p.localizacao,
    p.estoque,
    p.createdAt,
    p.updatedAt,
    CASE 
        WHEN EXISTS (SELECT 1 FROM entradas WHERE produtoId = p.id) THEN 'Tem Entradas'
        WHEN EXISTS (SELECT 1 FROM saidas WHERE produtoId = p.id) THEN 'Tem Saídas'
        ELSE 'Sem Movimentação'
    END as status_movimentacao
FROM produtos p
INNER JOIN produtos_duplicados pd ON p.descricao = pd.descricao AND p.categoria = pd.categoria
ORDER BY p.descricao, p.categoria, p.createdAt;

-- 5. Sugestão de produtos para manter (manter o mais antigo ou com mais movimentação)
-- Esta query sugere qual produto manter baseado na data de criação
WITH produtos_duplicados AS (
    SELECT 
        descricao,
        categoria,
        COUNT(*) as quantidade_duplicados
    FROM produtos 
    GROUP BY descricao, categoria
    HAVING COUNT(*) > 1
),
produtos_com_movimentacao AS (
    SELECT 
        p.id,
        p.descricao,
        p.categoria,
        p.createdAt,
        COUNT(e.id) as total_entradas,
        COUNT(s.id) as total_saidas,
        (COUNT(e.id) + COUNT(s.id)) as total_movimentacao
    FROM produtos p
    INNER JOIN produtos_duplicados pd ON p.descricao = pd.descricao AND p.categoria = pd.categoria
    LEFT JOIN entradas e ON e.produtoId = p.id
    LEFT JOIN saidas s ON s.produtoId = p.id
    GROUP BY p.id, p.descricao, p.categoria, p.createdAt
)
SELECT 
    descricao,
    categoria,
    id as produto_manter,
    createdAt as data_criacao,
    total_movimentacao,
    CASE 
        WHEN total_movimentacao > 0 THEN 'Manter - Tem movimentação'
        ELSE 'Manter - Mais antigo'
    END as motivo_manter
FROM (
    SELECT 
        *,
        ROW_NUMBER() OVER (
            PARTITION BY descricao, categoria 
            ORDER BY total_movimentacao DESC, createdAt ASC
        ) as rn
    FROM produtos_com_movimentacao
) ranked
WHERE rn = 1
ORDER BY descricao, categoria;
