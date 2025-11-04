-- Script específico para remover proteções das tabelas fornecedores e notas
-- Este script é mais seguro e focado apenas nas tabelas necessárias

-- 1. Desabilitar RLS apenas nas tabelas de fornecedores e notas
ALTER TABLE IF EXISTS fornecedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notas DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas específicas dessas tabelas
DROP POLICY IF EXISTS "fornecedores_policy" ON fornecedores;
DROP POLICY IF EXISTS "notas_policy" ON notas;
DROP POLICY IF EXISTS "fornecedores_all_access" ON fornecedores;
DROP POLICY IF EXISTS "notas_all_access" ON notas;
DROP POLICY IF EXISTS "Permitir todas as operações em fornecedores para usuários autenticados" ON fornecedores;
DROP POLICY IF EXISTS "Permitir todas as operações em notas para usuários autenticados" ON notas;

-- 3. Garantir que as tabelas existem
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

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_notas_fornecedor_id ON notas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_notas_veiculo_id ON notas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_notas_data ON notas(data);
CREATE INDEX IF NOT EXISTS idx_notas_status ON notas(status);

-- 5. Verificar se as proteções foram removidas
SELECT 
  'fornecedores' as tabela,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'fornecedores') as rls_habilitado,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'fornecedores') as politicas_restantes
UNION ALL
SELECT 
  'notas' as tabela,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'notas') as rls_habilitado,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notas') as politicas_restantes;

-- 6. Teste de inserção simples
INSERT INTO fornecedores (nome) VALUES ('Teste de Segurança') ON CONFLICT DO NOTHING;
SELECT 'Teste de inserção realizado com sucesso' as resultado;
