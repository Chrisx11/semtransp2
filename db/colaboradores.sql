-- Criar tabela de colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  telefone TEXT,
  secretaria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome ON colaboradores(nome);
CREATE INDEX IF NOT EXISTS idx_colaboradores_secretaria ON colaboradores(secretaria);

-- Criar função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp de updated_at automaticamente
DROP TRIGGER IF EXISTS update_colaboradores_updated_at ON colaboradores;
CREATE TRIGGER update_colaboradores_updated_at
BEFORE UPDATE ON colaboradores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela e colunas
COMMENT ON TABLE colaboradores IS 'Tabela de colaboradores do sistema';
COMMENT ON COLUMN colaboradores.id IS 'Identificador único do colaborador';
COMMENT ON COLUMN colaboradores.nome IS 'Nome completo do colaborador';
COMMENT ON COLUMN colaboradores.funcao IS 'Função ou cargo do colaborador';
COMMENT ON COLUMN colaboradores.telefone IS 'Número de telefone do colaborador';
COMMENT ON COLUMN colaboradores.secretaria IS 'Secretaria à qual o colaborador está vinculado';
COMMENT ON COLUMN colaboradores.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN colaboradores.updated_at IS 'Data e hora da última atualização do registro';
