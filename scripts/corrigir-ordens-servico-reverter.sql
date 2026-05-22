-- =============================================================================
-- REVERTER números usando o backup (somente se a correção deu errado)
-- Requer que corrigir-ordens-servico-backup.sql tenha sido executado antes.
-- =============================================================================

BEGIN;

UPDATE ordens_servico o
SET numero = b.numero, "updatedAt" = now()
FROM ordens_servico_backup_numeros b
WHERE o.id = b.id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'servicos_externos_backup_numeros'
  ) THEN
    EXECUTE '
      UPDATE servicos_externos se
      SET ordem_servico_numero = b.ordem_servico_numero, updated_at = now()
      FROM servicos_externos_backup_numeros b
      WHERE se.id = b.id
    ';
  END IF;
END $$;

COMMIT;

SELECT COUNT(*) AS os_restauradas FROM ordens_servico_backup_numeros;
