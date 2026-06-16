-- ============================================
-- POLÍTICAS RLS PARA O BUCKET 'despesas-notas'
-- ============================================
--
-- Execute este arquivo APÓS criar o bucket 'despesas-notas' no Supabase Storage
-- ============================================

DROP POLICY IF EXISTS "Permitir leitura de despesas-notas no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de despesas-notas no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de despesas-notas no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de despesas-notas no storage" ON storage.objects;

CREATE POLICY "Permitir leitura de despesas-notas no storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'despesas-notas');

CREATE POLICY "Permitir upload de despesas-notas no storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'despesas-notas');

CREATE POLICY "Permitir exclusão de despesas-notas no storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'despesas-notas');

CREATE POLICY "Permitir atualização de despesas-notas no storage"
ON storage.objects FOR UPDATE
USING (bucket_id = 'despesas-notas')
WITH CHECK (bucket_id = 'despesas-notas');
