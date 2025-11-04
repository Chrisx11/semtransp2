-- Script para corrigir as políticas RLS da tabela autorizacoes_borracharia
-- Execute este script no SQL Editor do Supabase se houver problemas de permissão

-- Primeiro, verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'autorizacoes_borracharia'
  ) THEN
    -- Remover todas as políticas existentes
    DROP POLICY IF EXISTS autorizacoes_borracharia_select_policy ON autorizacoes_borracharia;
    DROP POLICY IF EXISTS autorizacoes_borracharia_insert_policy ON autorizacoes_borracharia;
    DROP POLICY IF EXISTS autorizacoes_borracharia_update_policy ON autorizacoes_borracharia;
    DROP POLICY IF EXISTS autorizacoes_borracharia_delete_policy ON autorizacoes_borracharia;
    DROP POLICY IF EXISTS autorizacoes_borracharia_all_policy ON autorizacoes_borracharia;
    
    -- Criar política única para todas as operações
    CREATE POLICY autorizacoes_borracharia_all_policy ON autorizacoes_borracharia
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);
  ELSE
    RAISE NOTICE 'Tabela autorizacoes_borracharia não existe. Execute primeiro o script db/autorizacoes-borracharia.sql';
  END IF;
END $$;

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'autorizacoes_borracharia'
ORDER BY policyname;

