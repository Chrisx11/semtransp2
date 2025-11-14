-- Script para zerar o estoque de todos os produtos
-- Este script atualiza a coluna 'estoque' para 0 em todos os produtos da tabela

-- Atualizar todos os produtos para estoque = 0
UPDATE produtos 
SET estoque = 0,
    updatedAt = NOW()
WHERE estoque != 0;

-- Verificar quantos produtos foram atualizados
SELECT 
    COUNT(*) as total_produtos_atualizados,
    COUNT(CASE WHEN estoque = 0 THEN 1 END) as produtos_com_estoque_zero,
    COUNT(CASE WHEN estoque > 0 THEN 1 END) as produtos_com_estoque_positivo
FROM produtos;

-- Opcional: Mostrar alguns exemplos de produtos após a atualização
SELECT 
    id,
    descricao,
    categoria,
    estoque,
    updatedAt
FROM produtos 
ORDER BY updatedAt DESC
LIMIT 10;

