-- =============================================================================
-- DIAGNÓSTICO: números de OS duplicados em ordens_servico
-- Execute no SQL Editor do Supabase (somente leitura — não altera dados)
-- =============================================================================

-- 1) Resumo: quais números aparecem mais de uma vez
SELECT
  numero,
  COUNT(*) AS quantidade,
  MIN("createdAt") AS primeira_criacao,
  MAX("createdAt") AS ultima_criacao
FROM ordens_servico
GROUP BY numero
HAVING COUNT(*) > 1
ORDER BY quantidade DESC, numero;

-- 2) Detalhe: todas as OS com número repetido (para revisar antes de corrigir)
SELECT
  o.id,
  o.numero,
  o."createdAt",
  o.status,
  o."veiculoInfo",
  o."solicitanteInfo",
  o."mecanicoInfo",
  ROW_NUMBER() OVER (
    PARTITION BY o.numero
    ORDER BY o."createdAt" ASC, o.id ASC
  ) AS ordem_no_grupo,
  CASE
    WHEN ROW_NUMBER() OVER (
      PARTITION BY o.numero
      ORDER BY o."createdAt" ASC, o.id ASC
    ) = 1 THEN 'MANTER (mais antiga)'
    ELSE 'RENumerar'
  END AS acao_sugerida
FROM ordens_servico o
WHERE o.numero IN (
  SELECT numero
  FROM ordens_servico
  GROUP BY numero
  HAVING COUNT(*) > 1
)
ORDER BY o.numero, o."createdAt" ASC;

-- 3) Serviços externos que referenciam OS duplicadas (impacto da correção)
SELECT
  se.id AS servico_externo_id,
  se.ordem_servico_id,
  se.ordem_servico_numero,
  o.numero AS numero_atual_na_os,
  o."createdAt",
  o.status
FROM servicos_externos se
JOIN ordens_servico o ON o.id = se.ordem_servico_id
WHERE o.numero IN (
  SELECT numero
  FROM ordens_servico
  GROUP BY numero
  HAVING COUNT(*) > 1
)
ORDER BY se.ordem_servico_numero, o."createdAt";

-- 4) Maior sequencial por ano (formato OS-YY####) — referência para novos números
SELECT
  SUBSTRING(numero FROM 4 FOR 2) AS ano,
  MAX(CAST(SUBSTRING(numero FROM 6 FOR 4) AS INTEGER)) AS maior_sequencial,
  COUNT(*) AS total_os_ano
FROM ordens_servico
WHERE numero ~ '^OS-[0-9]{6}$'
GROUP BY SUBSTRING(numero FROM 4 FOR 2)
ORDER BY ano DESC;

-- 5) Números fora do padrão esperado (OS-YY + 4 dígitos)
SELECT id, numero, "createdAt", status
FROM ordens_servico
WHERE numero IS NULL
   OR numero !~ '^OS-[0-9]{6}$'
ORDER BY "createdAt" DESC;
