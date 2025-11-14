-- Script para listar todos os produtos duplicados com detalhes para exclusão manual

-- 1. Listar produtos duplicados com IDs para exclusão
SELECT 
    descricao,
    categoria,
    COUNT(*) as quantidade_duplicados,
    STRING_AGG(id::text, ', ') as todos_ids,
    STRING_AGG(createdAt::text, ', ') as datas_criacao
FROM produtos 
GROUP BY descricao, categoria
HAVING COUNT(*) > 1
ORDER BY quantidade_duplicados DESC, descricao;

-- 2. Mostrar detalhes completos dos produtos duplicados para facilitar a escolha
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
    'DUPLICADO' as status
FROM produtos p
INNER JOIN produtos_duplicados pd ON p.descricao = pd.descricao AND p.categoria = pd.categoria
ORDER BY p.descricao, p.categoria, p.createdAt;

-- 3. Exemplo de comando DELETE para produtos duplicados específicos
-- (Substitua os IDs pelos IDs reais dos produtos que você quer excluir)

-- Exemplo para excluir produtos duplicados de "Wega WO-612":
-- DELETE FROM produtos WHERE id IN ('id1', 'id2', 'id3', 'id4', 'id5', 'id6');
-- (Mantenha apenas o produto mais antigo ou com mais movimentações)

-- 4. Verificar se há registros órfãos antes de excluir
SELECT 
    'entradas' as tabela,
    COUNT(*) as registros_com_produtos_duplicados
FROM entradas e 
INNER JOIN (
    SELECT id FROM produtos WHERE descricao IN (
        SELECT descricao FROM produtos 
        GROUP BY descricao, categoria 
        HAVING COUNT(*) > 1
    )
) p ON e.produtoId = p.id

UNION ALL

SELECT 
    'saidas' as tabela,
    COUNT(*) as registros_com_produtos_duplicados
FROM saidas s 
INNER JOIN (
    SELECT id FROM produtos WHERE descricao IN (
        SELECT descricao FROM produtos 
        GROUP BY descricao, categoria 
        HAVING COUNT(*) > 1
    )
) p ON s.produtoId = p.id;
