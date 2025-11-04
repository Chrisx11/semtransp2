-- Script para remover TODAS as proteções e políticas de segurança
-- ⚠️ ATENÇÃO: Este script remove TODAS as proteções de segurança
-- Use apenas para desenvolvimento/teste

-- 1. Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS fornecedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veiculos DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "fornecedores_policy" ON fornecedores;
DROP POLICY IF EXISTS "notas_policy" ON notas;
DROP POLICY IF EXISTS "fornecedores_all_access" ON fornecedores;
DROP POLICY IF EXISTS "notas_all_access" ON notas;
DROP POLICY IF EXISTS "Permitir todas as operações em fornecedores para usuários autenticados" ON fornecedores;
DROP POLICY IF EXISTS "Permitir todas as operações em notas para usuários autenticados" ON notas;

-- 3. Remover políticas de outras tabelas que possam existir
DROP POLICY IF EXISTS "veiculos_policy" ON veiculos;
DROP POLICY IF EXISTS "veiculos_all_access" ON veiculos;
DROP POLICY IF EXISTS "Permitir todas as operações em veiculos para usuários autenticados" ON veiculos;

-- 4. Verificar se as tabelas existem e criar se necessário
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
  veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  veiculo_descricao VARCHAR(500) NOT NULL,
  data DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Pago')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_notas_fornecedor_id ON notas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_notas_veiculo_id ON notas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_notas_data ON notas(data);
CREATE INDEX IF NOT EXISTS idx_notas_status ON notas(status);

-- 6. Verificar status final
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_habilitado,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as politicas_restantes
FROM pg_tables t
WHERE tablename IN ('fornecedores', 'notas', 'veiculos')
ORDER BY tablename;

-- 7. Mostrar mensagem de confirmação
SELECT 'Todas as proteções foram removidas. As tabelas estão acessíveis sem restrições.' as status;
