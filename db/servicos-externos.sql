-- Tabela de Serviços Externos
-- Execute este script no SQL Editor do Supabase
-- Criada automaticamente quando uma OS é enviada para serviço externo

-- Remover tabela existente se necessário (descomente a linha abaixo se quiser recriar a tabela)
-- DROP TABLE IF EXISTS servicos_externos CASCADE;

CREATE TABLE IF NOT EXISTS servicos_externos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id UUID NOT NULL,
  ordem_servico_numero VARCHAR(255) NOT NULL,
  veiculo_id UUID NOT NULL,
  veiculo_placa VARCHAR(255) NOT NULL,
  veiculo_modelo VARCHAR(255) NOT NULL,
  veiculo_marca VARCHAR(255) NOT NULL,
  veiculo_secretaria VARCHAR(255) NOT NULL,
  fornecedor_id UUID NOT NULL,
  fornecedor_nome VARCHAR(255) NOT NULL,
  servico_solicitado TEXT NOT NULL,
  valor DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  data_autorizacao DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Pendente' NOT NULL CHECK (status IN ('Pendente', 'Em Andamento', 'Concluído', 'Cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_servicos_externos_ordem_servico_id ON servicos_externos(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_servicos_externos_veiculo_id ON servicos_externos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_servicos_externos_fornecedor_id ON servicos_externos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_servicos_externos_status ON servicos_externos(status);
CREATE INDEX IF NOT EXISTS idx_servicos_externos_data_autorizacao ON servicos_externos(data_autorizacao);

-- Comentários para documentação
COMMENT ON TABLE servicos_externos IS 'Tabela para armazenar serviços externos criados automaticamente ao enviar uma OS para serviço externo';
COMMENT ON COLUMN servicos_externos.id IS 'Identificador único do serviço externo (UUID)';
COMMENT ON COLUMN servicos_externos.ordem_servico_id IS 'ID da ordem de serviço relacionada';
COMMENT ON COLUMN servicos_externos.ordem_servico_numero IS 'Número da ordem de serviço';
COMMENT ON COLUMN servicos_externos.veiculo_id IS 'ID do veículo';
COMMENT ON COLUMN servicos_externos.veiculo_placa IS 'Placa do veículo';
COMMENT ON COLUMN servicos_externos.veiculo_modelo IS 'Modelo do veículo';
COMMENT ON COLUMN servicos_externos.veiculo_marca IS 'Marca do veículo';
COMMENT ON COLUMN servicos_externos.veiculo_secretaria IS 'Secretaria do veículo';
COMMENT ON COLUMN servicos_externos.fornecedor_id IS 'ID do fornecedor (colaborador com função MECÂNICO)';
COMMENT ON COLUMN servicos_externos.fornecedor_nome IS 'Nome do fornecedor';
COMMENT ON COLUMN servicos_externos.servico_solicitado IS 'Descrição do serviço solicitado';
COMMENT ON COLUMN servicos_externos.valor IS 'Valor do serviço externo (inicialmente 0, pode ser editado posteriormente)';
COMMENT ON COLUMN servicos_externos.data_autorizacao IS 'Data em que o serviço externo foi autorizado';
COMMENT ON COLUMN servicos_externos.status IS 'Status do serviço externo: Pendente, Em Andamento, Concluído ou Cancelado';
COMMENT ON COLUMN servicos_externos.observacoes IS 'Observações adicionais sobre o serviço externo';
COMMENT ON COLUMN servicos_externos.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN servicos_externos.updated_at IS 'Data e hora da última atualização do registro';

-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_servicos_externos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_servicos_externos_timestamp ON servicos_externos;

CREATE TRIGGER update_servicos_externos_timestamp
BEFORE UPDATE ON servicos_externos
FOR EACH ROW
EXECUTE FUNCTION update_servicos_externos_updated_at();

-- Permissões RLS (Row Level Security) para Supabase
ALTER TABLE servicos_externos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (caso esteja reexecutando o script)
DROP POLICY IF EXISTS servicos_externos_select_policy ON servicos_externos;
DROP POLICY IF EXISTS servicos_externos_insert_policy ON servicos_externos;
DROP POLICY IF EXISTS servicos_externos_update_policy ON servicos_externos;
DROP POLICY IF EXISTS servicos_externos_delete_policy ON servicos_externos;
DROP POLICY IF EXISTS servicos_externos_all_policy ON servicos_externos;
DROP POLICY IF EXISTS servicos_externos_public_policy ON servicos_externos;

-- Política pública que permite todas as operações (sem verificar autenticação do Supabase)
-- Esta política é necessária porque o sistema usa autenticação customizada, não a autenticação do Supabase
CREATE POLICY servicos_externos_public_policy ON servicos_externos
FOR ALL 
USING (true)
WITH CHECK (true);

