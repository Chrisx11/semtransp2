-- =============================================================================
-- SOMENTE PRÉ-VISUALIZAÇÃO (sem alterar dados — sem aviso destrutivo no Supabase)
-- Execute este arquivo primeiro. Não cria tabelas nem faz UPDATE.
-- =============================================================================

WITH ano_atual AS (
  SELECT TO_CHAR(CURRENT_DATE, 'YY') AS yy
),
duplicados AS (
  SELECT
    o.id,
    o.numero AS numero_atual,
    o."createdAt",
    o.status,
    o."veiculoInfo",
    ROW_NUMBER() OVER (
      PARTITION BY o.numero
      ORDER BY o."createdAt" ASC, o.id ASC
    ) AS rn
  FROM ordens_servico o
  WHERE o.numero IN (
    SELECT numero FROM ordens_servico GROUP BY numero HAVING COUNT(*) > 1
  )
),
max_seq_ano AS (
  SELECT COALESCE(MAX(CAST(SUBSTRING(os.numero FROM 6 FOR 4) AS INTEGER)), 0) AS max_seq
  FROM ordens_servico os
  CROSS JOIN ano_atual a
  WHERE os.numero ~ ('^OS-' || a.yy || '[0-9]{4}$')
),
para_renumerar AS (
  SELECT d.*, ROW_NUMBER() OVER (ORDER BY d."createdAt" ASC, d.id ASC) AS fila
  FROM duplicados d
  WHERE d.rn > 1
)
SELECT
  p.id,
  p.numero_atual,
  p."createdAt",
  p.status,
  p."veiculoInfo",
  'OS-' || a.yy || LPAD((m.max_seq + p.fila)::TEXT, 4, '0') AS numero_novo
FROM para_renumerar p
CROSS JOIN ano_atual a
CROSS JOIN max_seq_ano m
ORDER BY p."createdAt";
