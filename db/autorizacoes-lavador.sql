-- Tabela de Autorizações de Lavagem
-- Execute este script no SQL Editor do Supabase

-- Remover tabela existente se necessário (descomente a linha abaixo se quiser recriar a tabela)
-- DROP TABLE IF EXISTS autorizacoes_lavador CASCADE;

CREATE TABLE IF NOT EXISTS autorizacoes_lavador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL,
  veiculo_placa VARCHAR(10) NOT NULL,
  veiculo_modelo VARCHAR(255) NOT NULL,
  veiculo_marca VARCHAR(255) NOT NULL,
  veiculo_secretaria VARCHAR(255) NOT NULL,
  autorizado_por UUID NOT NULL, -- ID do colaborador que autorizou
  autorizado_por_nome VARCHAR(255) NOT NULL,
  solicitante_id UUID NOT NULL, -- ID do colaborador solicitante
  solicitante_nome VARCHAR(255) NOT NULL,
  data_autorizacao DATE NOT NULL,
  data_prevista DATE NOT NULL,
  preco DECIMAL(10, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Autorizado', 'Em Andamento', 'Concluído', 'Cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_autorizacoes_lavador_veiculo_id ON autorizacoes_lavador(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_lavador_veiculo_placa ON autorizacoes_lavador(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_lavador_solicitante_id ON autorizacoes_lavador(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_lavador_status ON autorizacoes_lavador(status);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_lavador_data_autorizacao ON autorizacoes_lavador(data_autorizacao);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_lavador_data_prevista ON autorizacoes_lavador(data_prevista);

-- Comentários para documentação
COMMENT ON TABLE autorizacoes_lavador IS 'Tabela para armazenar autorizações de veículos para serviços de lavagem';
COMMENT ON COLUMN autorizacoes_lavador.id IS 'Identificador único da autorização (UUID)';
COMMENT ON COLUMN autorizacoes_lavador.veiculo_id IS 'ID do veículo autorizado';
COMMENT ON COLUMN autorizacoes_lavador.veiculo_placa IS 'Placa do veículo (para consultas rápidas)';
COMMENT ON COLUMN autorizacoes_lavador.veiculo_modelo IS 'Modelo do veículo';
COMMENT ON COLUMN autorizacoes_lavador.veiculo_marca IS 'Marca do veículo';
COMMENT ON COLUMN autorizacoes_lavador.veiculo_secretaria IS 'Secretaria do veículo';
COMMENT ON COLUMN autorizacoes_lavador.autorizado_por IS 'ID do colaborador que autorizou';
COMMENT ON COLUMN autorizacoes_lavador.autorizado_por_nome IS 'Nome do colaborador que autorizou';
COMMENT ON COLUMN autorizacoes_lavador.solicitante_id IS 'ID do colaborador que solicitou';
COMMENT ON COLUMN autorizacoes_lavador.solicitante_nome IS 'Nome do colaborador que solicitou';
COMMENT ON COLUMN autorizacoes_lavador.data_autorizacao IS 'Data em que a autorização foi concedida';
COMMENT ON COLUMN autorizacoes_lavador.data_prevista IS 'Data prevista para o serviço';
COMMENT ON COLUMN autorizacoes_lavador.preco IS 'Preço estimado ou acordado para o serviço (opcional)';
COMMENT ON COLUMN autorizacoes_lavador.status IS 'Status da autorização: Pendente, Autorizado, Em Andamento, Concluído ou Cancelado';
COMMENT ON COLUMN autorizacoes_lavador.observacoes IS 'Observações adicionais sobre a autorização';
COMMENT ON COLUMN autorizacoes_lavador.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN autorizacoes_lavador.updated_at IS 'Data e hora da última atualização do registro';

-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_autorizacao_lavador_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_autorizacao_lavador_timestamp ON autorizacoes_lavador;

CREATE TRIGGER update_autorizacao_lavador_timestamp
BEFORE UPDATE ON autorizacoes_lavador
FOR EACH ROW
EXECUTE FUNCTION update_autorizacao_lavador_updated_at();

-- Permissões RLS (Row Level Security) para Supabase
ALTER TABLE autorizacoes_lavador ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (caso esteja reexecutando o script)
DROP POLICY IF EXISTS autorizacoes_lavador_select_policy ON autorizacoes_lavador;
DROP POLICY IF EXISTS autorizacoes_lavador_insert_policy ON autorizacoes_lavador;
DROP POLICY IF EXISTS autorizacoes_lavador_update_policy ON autorizacoes_lavador;
DROP POLICY IF EXISTS autorizacoes_lavador_delete_policy ON autorizacoes_lavador;
DROP POLICY IF EXISTS autorizacoes_lavador_all_policy ON autorizacoes_lavador;
DROP POLICY IF EXISTS autorizacoes_lavador_public_policy ON autorizacoes_lavador;

-- Política pública que permite todas as operações (sem verificar autenticação do Supabase)
-- Esta política é necessária porque o sistema usa autenticação customizada, não a autenticação do Supabase
CREATE POLICY autorizacoes_lavador_public_policy ON autorizacoes_lavador
FOR ALL 
USING (true)
WITH CHECK (true);

