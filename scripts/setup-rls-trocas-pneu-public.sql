-- Script para configurar políticas RLS (Row Level Security) para trocas_pneu
-- Este script permite operações públicas (sem autenticação) na tabela

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE trocas_pneu ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas que exigem autenticação (se existirem)
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON trocas_pneu;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON trocas_pneu;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON trocas_pneu;
DROP POLICY IF EXISTS "Permitir leitura pública de trocas_pneu" ON trocas_pneu;

-- Criar políticas públicas (sem necessidade de autenticação)
-- Permite leitura pública
CREATE POLICY "Permitir leitura pública de trocas_pneu" 
ON trocas_pneu 
FOR SELECT 
USING (true);

-- Permite inserção pública
CREATE POLICY "Permitir inserção pública de trocas_pneu" 
ON trocas_pneu 
FOR INSERT 
WITH CHECK (true);

-- Permite atualização pública
CREATE POLICY "Permitir atualização pública de trocas_pneu" 
ON trocas_pneu 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Permite exclusão pública
CREATE POLICY "Permitir exclusão pública de trocas_pneu" 
ON trocas_pneu 
FOR DELETE 
USING (true);

-- Fazer o mesmo para tipos_pneu
ALTER TABLE tipos_pneu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de tipos_pneu" ON tipos_pneu;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON tipos_pneu;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON tipos_pneu;

CREATE POLICY "Permitir leitura pública de tipos_pneu" 
ON tipos_pneu 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública de tipos_pneu" 
ON tipos_pneu 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de tipos_pneu" 
ON tipos_pneu 
FOR UPDATE 
USING (true)
WITH CHECK (true);

