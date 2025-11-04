-- Script para remover o registro "Teste de Segurança" do banco de dados

-- Remover o fornecedor "Teste de Segurança"
DELETE FROM fornecedores WHERE nome = 'Teste de Segurança';

-- Verificar se foi removido
SELECT COUNT(*) as registros_restantes 
FROM fornecedores 
WHERE nome = 'Teste de Segurança';

-- Mostrar todos os fornecedores restantes
SELECT id, nome, created_at 
FROM fornecedores 
ORDER BY nome;

