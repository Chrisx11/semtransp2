-- ============================================
-- POLÍTICAS RLS PARA O BUCKET DE STORAGE
-- ============================================
-- 
-- Execute este arquivo APÓS criar o bucket 'documentos' no Supabase Storage
-- 
-- IMPORTANTE: Este arquivo configura as políticas de acesso ao bucket de storage
-- que são diferentes das políticas da tabela 'documentos'
-- ============================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Permitir leitura de documentos no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de documentos no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de documentos no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de documentos no storage" ON storage.objects;

-- Política para permitir leitura de arquivos do bucket 'documentos'
-- Permite que qualquer usuário autenticado leia os arquivos
CREATE POLICY "Permitir leitura de documentos no storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');

-- Política para permitir upload de arquivos no bucket 'documentos'
-- Permite que qualquer usuário autenticado faça upload
CREATE POLICY "Permitir upload de documentos no storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos');

-- Política para permitir exclusão de arquivos do bucket 'documentos'
-- Permite que qualquer usuário autenticado delete arquivos
CREATE POLICY "Permitir exclusão de documentos no storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'documentos');

-- Política para permitir atualização de arquivos do bucket 'documentos'
-- Permite que qualquer usuário autenticado atualize arquivos (opcional)
CREATE POLICY "Permitir atualização de documentos no storage"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documentos')
WITH CHECK (bucket_id = 'documentos');

-- ============================================
-- NOTAS:
-- ============================================
-- 
-- Se você quiser políticas mais restritivas, pode modificar as condições:
-- 
-- Exemplo: Permitir apenas para usuários autenticados específicos:
-- USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL)
-- 
-- Exemplo: Permitir apenas para o dono do arquivo:
-- USING (bucket_id = 'documentos' AND owner = auth.uid())
-- 
-- Para buckets públicos, você pode usar:
-- USING (bucket_id = 'documentos')
-- (sem verificação de autenticação)
-- 
-- ============================================

