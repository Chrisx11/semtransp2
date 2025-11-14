-- Script SIMPLES para adicionar a coluna 'rodizio' à tabela trocas_pneu
-- Execute este script no Supabase SQL Editor

ALTER TABLE trocas_pneu ADD COLUMN rodizio BOOLEAN DEFAULT FALSE;

