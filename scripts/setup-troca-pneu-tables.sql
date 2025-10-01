-- Script para configuração do sistema de Troca de Pneus
-- Este script cria as tabelas necessárias para o funcionamento do sistema de troca de pneus

-- Habilitar a extensão uuid-ossp caso ainda não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de tipos de pneu
CREATE TABLE IF NOT EXISTS tipos_pneu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  medida TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários das colunas para documentar o schema
COMMENT ON TABLE tipos_pneu IS 'Armazena os diferentes tipos/modelos de pneus disponíveis';
COMMENT ON COLUMN tipos_pneu.id IS 'Identificador único do tipo de pneu';
COMMENT ON COLUMN tipos_pneu.marca IS 'Marca do pneu (ex: Pirelli, Michelin)';
COMMENT ON COLUMN tipos_pneu.modelo IS 'Modelo do pneu (ex: Scorpion, Energy)';
COMMENT ON COLUMN tipos_pneu.medida IS 'Dimensões do pneu (ex: 215/65 R16)';
COMMENT ON COLUMN tipos_pneu.ativo IS 'Indica se o tipo de pneu está ativo para seleção';

-- Tabela de trocas de pneu
CREATE TABLE IF NOT EXISTS trocas_pneu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  tipo_pneu_id UUID NOT NULL REFERENCES tipos_pneu(id),
  data_troca TIMESTAMPTZ DEFAULT NOW(),
  km INTEGER NOT NULL,
  posicoes TEXT[] NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários das colunas para documentar o schema
COMMENT ON TABLE trocas_pneu IS 'Armazena os registros de trocas de pneus realizadas nos veículos';
COMMENT ON COLUMN trocas_pneu.id IS 'Identificador único da troca de pneu';
COMMENT ON COLUMN trocas_pneu.veiculo_id IS 'Referência ao veículo que teve os pneus trocados';
COMMENT ON COLUMN trocas_pneu.tipo_pneu_id IS 'Referência ao tipo de pneu utilizado';
COMMENT ON COLUMN trocas_pneu.data_troca IS 'Data em que a troca foi realizada';
COMMENT ON COLUMN trocas_pneu.km IS 'Quilometragem do veículo no momento da troca';
COMMENT ON COLUMN trocas_pneu.posicoes IS 'Array com as posições dos pneus que foram trocados (dianteira-esquerda, dianteira-direita, etc.)';
COMMENT ON COLUMN trocas_pneu.observacao IS 'Observações adicionais sobre a troca';

-- Índices para melhorar a performance de consultas comuns
CREATE INDEX IF NOT EXISTS idx_tipos_pneu_ativo ON tipos_pneu(ativo);
CREATE INDEX IF NOT EXISTS idx_trocas_pneu_veiculo ON trocas_pneu(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_trocas_pneu_data ON trocas_pneu(data_troca);
CREATE INDEX IF NOT EXISTS idx_trocas_pneu_tipo ON trocas_pneu(tipo_pneu_id);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger na tabela trocas_pneu
DROP TRIGGER IF EXISTS set_timestamp ON trocas_pneu;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON trocas_pneu
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Função para atualizar o km do veículo após registro de troca de pneu
CREATE OR REPLACE FUNCTION update_km_veiculo_after_troca_pneu()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza a quilometragem do veículo se o valor for maior que o atual
  UPDATE veiculos
  SET "kmAtual" = NEW.km
  WHERE id = NEW.veiculo_id AND (
    "kmAtual" IS NULL OR NEW.km > "kmAtual"
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger na tabela trocas_pneu
DROP TRIGGER IF EXISTS update_km_veiculo ON trocas_pneu;
CREATE TRIGGER update_km_veiculo
AFTER INSERT ON trocas_pneu
FOR EACH ROW
EXECUTE FUNCTION update_km_veiculo_after_troca_pneu();

-- Funções RPC para serem chamadas pelo frontend

-- Função para criar a tabela tipos_pneu caso não exista
CREATE OR REPLACE FUNCTION create_tipos_pneu_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS tipos_pneu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    medida TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
END;
$$;

-- Função para criar a tabela trocas_pneu caso não exista
CREATE OR REPLACE FUNCTION create_trocas_pneu_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS trocas_pneu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
    tipo_pneu_id UUID NOT NULL REFERENCES tipos_pneu(id),
    data_troca TIMESTAMPTZ DEFAULT NOW(),
    km INTEGER NOT NULL,
    posicoes TEXT[] NOT NULL,
    observacao TEXT,
    alinhamento BOOLEAN DEFAULT FALSE,
    balanceamento BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
END;
$$;

-- Função para permitir a execução de SQL customizado (usada para criar tabelas)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Inserir alguns tipos de pneus para demonstração
INSERT INTO tipos_pneu (marca, modelo, medida, ativo)
VALUES
  ('Pirelli', 'Scorpion', '215/65 R16', true),
  ('Michelin', 'Energy', '195/55 R15', true),
  ('Goodyear', 'Eagle', '225/45 R17', true),
  ('Bridgestone', 'Turanza', '205/60 R16', true),
  ('Continental', 'CrossContact', '235/75 R15', true)
ON CONFLICT DO NOTHING;

-- Adiciona políticas RLS (Row Level Security) para proteger os dados
-- Necessário se o seu Supabase estiver com RLS ativado

-- Políticas para tipos_pneu
ALTER TABLE tipos_pneu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de tipos_pneu" ON tipos_pneu
    FOR SELECT
    USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON tipos_pneu
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON tipos_pneu
    FOR UPDATE
    TO authenticated
    USING (true);

-- Políticas para trocas_pneu
ALTER TABLE trocas_pneu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de trocas_pneu" ON trocas_pneu
    FOR SELECT
    USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON trocas_pneu
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" ON trocas_pneu
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Permitir exclusão para usuários autenticados" ON trocas_pneu
    FOR DELETE
    TO authenticated
    USING (true); 