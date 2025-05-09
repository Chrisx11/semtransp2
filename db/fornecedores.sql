-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);

-- Comentários para documentação
COMMENT ON TABLE fornecedores IS 'Tabela para armazenar informações de fornecedores do sistema';
COMMENT ON COLUMN fornecedores.id IS 'Identificador único do fornecedor (UUID)';
COMMENT ON COLUMN fornecedores.nome IS 'Nome do fornecedor';
COMMENT ON COLUMN fornecedores.endereco IS 'Endereço completo do fornecedor';
COMMENT ON COLUMN fornecedores.telefone IS 'Número de telefone do fornecedor';
COMMENT ON COLUMN fornecedores.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN fornecedores.updated_at IS 'Data e hora da última atualização do registro';

-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_fornecedor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fornecedor_timestamp ON fornecedores;

CREATE TRIGGER update_fornecedor_timestamp
BEFORE UPDATE ON fornecedores
FOR EACH ROW
EXECUTE FUNCTION update_fornecedor_updated_at();

-- Dados iniciais para teste (opcional)
-- INSERT INTO fornecedores (id, nome, endereco, telefone)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'Auto Peças Silva', 'Rua das Autopeças, 123, Centro', '(11) 99999-8888'),
--   ('22222222-2222-2222-2222-222222222222', 'Distribuidora de Peças Automotivas', 'Av. dos Distribuidores, 456, Distrito Industrial', '(11) 97777-6666'),
--   ('33333333-3333-3333-3333-333333333333', 'Peças & Serviços Ltda', 'Rua dos Mecânicos, 789, Zona Industrial', '(11) 95555-4444');

-- Permissões RLS (Row Level Security) para Supabase
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY fornecedores_select_policy ON fornecedores
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
CREATE POLICY fornecedores_insert_policy ON fornecedores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
CREATE POLICY fornecedores_update_policy ON fornecedores
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY fornecedores_delete_policy ON fornecedores
  FOR DELETE USING (auth.role() = 'authenticated'); 