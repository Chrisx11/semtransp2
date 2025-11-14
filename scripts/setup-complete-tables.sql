-- Script completo para configurar as tabelas de fornecedores e notas

-- 1. Criar tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de notas
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

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_notas_fornecedor_id ON notas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_notas_veiculo_id ON notas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_notas_data ON notas(data);
CREATE INDEX IF NOT EXISTS idx_notas_status ON notas(status);

-- 4. Remover políticas existentes se houverem
DROP POLICY IF EXISTS "fornecedores_policy" ON fornecedores;
DROP POLICY IF EXISTS "notas_policy" ON notas;
DROP POLICY IF EXISTS "Permitir todas as operações em fornecedores para usuários autenticados" ON fornecedores;
DROP POLICY IF EXISTS "Permitir todas as operações em notas para usuários autenticados" ON notas;

-- 5. Habilitar RLS
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas permissivas para usuários autenticados
CREATE POLICY "fornecedores_all_access" ON fornecedores
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "notas_all_access" ON notas
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Verificar se tudo foi criado corretamente
SELECT 
  'fornecedores' as tabela,
  COUNT(*) as registros,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'fornecedores') as rls_habilitado
FROM fornecedores
UNION ALL
SELECT 
  'notas' as tabela,
  COUNT(*) as registros,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'notas') as rls_habilitado
FROM notas;

-- 8. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('fornecedores', 'notas')
ORDER BY tablename, policyname;
