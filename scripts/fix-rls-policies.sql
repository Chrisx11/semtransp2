-- Script para corrigir as políticas de RLS

-- Primeiro, vamos remover as políticas existentes se houverem
DROP POLICY IF EXISTS "Permitir todas as operações em fornecedores para usuários autenticados" ON fornecedores;
DROP POLICY IF EXISTS "Permitir todas as operações em notas para usuários autenticados" ON notas;

-- Criar políticas mais específicas e funcionais
-- Política para fornecedores - permitir todas as operações para usuários autenticados
CREATE POLICY "fornecedores_policy" ON fornecedores
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para notas - permitir todas as operações para usuários autenticados
CREATE POLICY "notas_policy" ON notas
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('fornecedores', 'notas')
ORDER BY tablename, policyname;
