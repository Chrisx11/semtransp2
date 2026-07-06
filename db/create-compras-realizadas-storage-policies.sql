-- ============================================
-- POLÍTICAS RLS PARA O BUCKET DE STORAGE "compras-realizadas-pdfs"
-- ============================================
--
-- Execute este arquivo APÓS criar o bucket 'compras-realizadas-pdfs'
-- no Supabase Dashboard > Storage.
-- ============================================

DROP POLICY IF EXISTS "Permitir leitura de compras_realizadas_pdfs no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de compras_realizadas_pdfs no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de compras_realizadas_pdfs no storage" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de compras_realizadas_pdfs no storage" ON storage.objects;

CREATE POLICY "Permitir leitura de compras_realizadas_pdfs no storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'compras-realizadas-pdfs');

CREATE POLICY "Permitir upload de compras_realizadas_pdfs no storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'compras-realizadas-pdfs');

CREATE POLICY "Permitir exclusão de compras_realizadas_pdfs no storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'compras-realizadas-pdfs');

CREATE POLICY "Permitir atualização de compras_realizadas_pdfs no storage"
ON storage.objects FOR UPDATE
USING (bucket_id = 'compras-realizadas-pdfs')
WITH CHECK (bucket_id = 'compras-realizadas-pdfs');
