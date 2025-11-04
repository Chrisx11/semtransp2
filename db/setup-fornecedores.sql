-- Configuração da tabela de fornecedores
-- Execute este script no SQL Editor do Supabase

-- Criar a tabela de fornecedores se não existir
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_fornecedor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS update_fornecedor_timestamp ON fornecedores;

-- Criar trigger para atualizar o campo updated_at
CREATE TRIGGER update_fornecedor_timestamp
BEFORE UPDATE ON fornecedores
FOR EACH ROW
EXECUTE FUNCTION update_fornecedor_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança mais permissivas para desenvolvimento
-- Permitir SELECT para todos
CREATE POLICY fornecedores_select_policy ON fornecedores
  FOR SELECT USING (true);

-- Permitir INSERT para todos
CREATE POLICY fornecedores_insert_policy ON fornecedores
  FOR INSERT WITH CHECK (true);

-- Permitir UPDATE para todos
CREATE POLICY fornecedores_update_policy ON fornecedores
  FOR UPDATE USING (true);

-- Permitir DELETE para todos
CREATE POLICY fornecedores_delete_policy ON fornecedores
  FOR DELETE USING (true);

-- Inserir alguns dados de teste (opcional, remova ou modifique conforme necessário)
INSERT INTO fornecedores (id, nome, endereco, telefone)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Auto Peças Silva', 'Rua das Autopeças, 123, Centro', '(11) 99999-8888'),
  ('22222222-2222-2222-2222-222222222222', 'Distribuidora de Peças Automotivas', 'Av. dos Distribuidores, 456, Distrito Industrial', '(11) 97777-6666'),
  ('33333333-3333-3333-3333-333333333333', 'Peças & Serviços Ltda', 'Rua dos Mecânicos, 789, Zona Industrial', '(11) 95555-4444')
ON CONFLICT (id) DO NOTHING;

-- Verificar se a tabela foi criada corretamente
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'fornecedores'
) AS tabela_fornecedores_existe; 