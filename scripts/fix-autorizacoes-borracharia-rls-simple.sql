-- Script simples para corrigir as políticas RLS da tabela autorizacoes_borracharia
-- Execute este script linha por linha no SQL Editor do Supabase

-- Passo 1: Remover políticas existentes (execute cada linha separadamente se houver erro)
DROP POLICY IF EXISTS autorizacoes_borracharia_select_policy ON autorizacoes_borracharia;
DROP POLICY IF EXISTS autorizacoes_borracharia_insert_policy ON autorizacoes_borracharia;
DROP POLICY IF EXISTS autorizacoes_borracharia_update_policy ON autorizacoes_borracharia;
DROP POLICY IF EXISTS autorizacoes_borracharia_delete_policy ON autorizacoes_borracharia;
DROP POLICY IF EXISTS autorizacoes_borracharia_all_policy ON autorizacoes_borracharia;

-- Passo 2: Criar política única para todas as operações
CREATE POLICY autorizacoes_borracharia_all_policy ON autorizacoes_borracharia
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Passo 3: Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'autorizacoes_borracharia';

