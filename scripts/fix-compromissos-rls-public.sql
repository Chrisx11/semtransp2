-- Script para corrigir políticas RLS da tabela compromissos
-- Este script permite operações públicas (sem autenticação do Supabase)
-- Execute este script no SQL Editor do Supabase

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas que exigem autenticação
DROP POLICY IF EXISTS "compromissos_select_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_insert_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_update_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_delete_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_all_access" ON compromissos;

-- Criar políticas públicas (sem necessidade de autenticação do Supabase)
-- Permite leitura pública
CREATE POLICY "compromissos_select_public" ON compromissos
  FOR SELECT
  USING (true);

-- Permite inserção pública
CREATE POLICY "compromissos_insert_public" ON compromissos
  FOR INSERT
  WITH CHECK (true);

-- Permite atualização pública
CREATE POLICY "compromissos_update_public" ON compromissos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Permite exclusão pública
CREATE POLICY "compromissos_delete_public" ON compromissos
  FOR DELETE
  USING (true);

