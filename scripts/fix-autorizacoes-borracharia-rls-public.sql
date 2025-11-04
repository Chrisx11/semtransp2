-- Script para permitir acesso público à tabela autorizacoes_borracharia
-- Use apenas se o sistema não usar autenticação do Supabase diretamente

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS autorizacoes_borracharia_select_policy ON autorizacoes_borracharia;
DROP POLICY IF EXISTS autorizacoes_borracharia_insert_policy ON autorizacoes_borracharia;
DROP POLICY IF EXISTS autorizacoes_borracharia_update_policy ON autorizacoes_borracharia;
DROP POLICY IF EXISTS autorizacoes_borracharia_delete_policy ON autorizacoes_borracharia;
DROP POLICY IF EXISTS autorizacoes_borracharia_all_policy ON autorizacoes_borracharia;

-- Opção 1: Desabilitar RLS completamente (TEMPORÁRIO - apenas para desenvolvimento)
-- ALTER TABLE autorizacoes_borracharia DISABLE ROW LEVEL SECURITY;

-- Opção 2: Criar política que permite acesso para qualquer um (incluindo anônimos)
CREATE POLICY autorizacoes_borracharia_public_policy ON autorizacoes_borracharia
FOR ALL 
USING (true)
WITH CHECK (true);

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'autorizacoes_borracharia';

