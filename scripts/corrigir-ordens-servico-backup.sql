-- =============================================================================
-- BACKUP antes da correção
--
-- AVISOS DO SUPABASE (normais neste passo):
--   • "Operações destrutivas" — recria a tabela de backup (esperado).
--   • "Tabela sem RLS" — escolha no diálogo:
--       >>> "Executar e habilitar o RLS"  (recomendado)
--       NÃO use "Correr sem RLS"
-- =============================================================================

DROP TABLE IF EXISTS ordens_servico_backup_numeros;

CREATE TABLE ordens_servico_backup_numeros AS
SELECT
  id,
  numero,
  "createdAt",
  status,
  "veiculoInfo",
  now() AT TIME ZONE 'America/Sao_Paulo' AS backup_em
FROM ordens_servico;

ALTER TABLE ordens_servico_backup_numeros ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE ordens_servico_backup_numeros FROM anon, authenticated;

SELECT COUNT(*) AS registros_backup FROM ordens_servico_backup_numeros;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'servicos_externos'
  ) THEN
    EXECUTE 'DROP TABLE IF EXISTS servicos_externos_backup_numeros';
    EXECUTE '
      CREATE TABLE servicos_externos_backup_numeros AS
      SELECT id, ordem_servico_id, ordem_servico_numero, now() AS backup_em
      FROM servicos_externos
    ';
    EXECUTE 'ALTER TABLE servicos_externos_backup_numeros ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON TABLE servicos_externos_backup_numeros FROM anon, authenticated';
    RAISE NOTICE 'Backup de servicos_externos criado.';
  END IF;
END $$;
