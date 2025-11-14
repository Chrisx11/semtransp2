-- Script SIMPLES para desabilitar RLS
-- Execute este script no Supabase SQL Editor

-- Desabilitar RLS nas tabelas
ALTER TABLE fornecedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE notas DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('fornecedores', 'notas')
ORDER BY tablename;
