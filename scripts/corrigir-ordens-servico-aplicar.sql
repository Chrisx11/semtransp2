-- =============================================================================
-- APLICAR correção (UPDATE em ordens_servico)
--
-- Pré-requisitos:
--   1. identificar-ordens-servico-numero-duplicado.sql (revisar duplicados)
--   2. corrigir-ordens-servico-preview-apenas.sql (conferir numero_novo)
--   3. corrigir-ordens-servico-backup.sql (backup feito)
--
-- AVISO DO SUPABASE: "operações destrutivas" — altera numeros das OS.
-- Confirme apenas após revisar a pré-visualização.
-- =============================================================================

BEGIN;

WITH ano_atual AS (
  SELECT TO_CHAR(CURRENT_DATE, 'YY') AS yy
),
duplicados AS (
  SELECT
    o.id,
    o.numero AS numero_atual,
    o."createdAt",
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
  SELECT d.id, d.numero_atual, ROW_NUMBER() OVER (ORDER BY d."createdAt" ASC, d.id ASC) AS fila
  FROM duplicados d
  WHERE d.rn > 1
),
mapeamento AS (
  SELECT
    p.id,
    p.numero_atual,
    'OS-' || a.yy || LPAD((m.max_seq + p.fila)::TEXT, 4, '0') AS numero_novo
  FROM para_renumerar p
  CROSS JOIN ano_atual a
  CROSS JOIN max_seq_ano m
),
atualiza_os AS (
  UPDATE ordens_servico o
  SET
    numero = mp.numero_novo,
    "updatedAt" = now()
  FROM mapeamento mp
  WHERE o.id = mp.id
  RETURNING o.id, mp.numero_atual, mp.numero_novo
)
UPDATE servicos_externos se
SET
  ordem_servico_numero = ao.numero_novo,
  updated_at = now()
FROM atualiza_os ao
WHERE se.ordem_servico_id = ao.id;

COMMIT;

-- Validação (deve retornar 0 linhas)
SELECT numero, COUNT(*) AS qtd
FROM ordens_servico
GROUP BY numero
HAVING COUNT(*) > 1;
