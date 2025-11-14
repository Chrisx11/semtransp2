-- Script para desabilitar RLS temporariamente (APENAS PARA TESTE)

-- ATENÇÃO: Este script desabilita a segurança de nível de linha
-- Use apenas para teste e reative o RLS depois

-- Desabilitar RLS nas tabelas
ALTER TABLE fornecedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE notas DISABLE ROW LEVEL SECURITY;

-- Verificar status do RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('fornecedores', 'notas');

-- Para reativar o RLS depois, execute:
-- ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
