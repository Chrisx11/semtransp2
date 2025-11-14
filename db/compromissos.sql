-- Criar tabela de compromissos (Planner)
CREATE TABLE IF NOT EXISTS compromissos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  duracao INTEGER DEFAULT 60, -- Duração em minutos
  cor TEXT DEFAULT 'bg-blue-500', -- Cor do compromisso no planner (pode ser classe Tailwind ou código hex)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_compromissos_data ON compromissos(data);
CREATE INDEX IF NOT EXISTS idx_compromissos_data_hora ON compromissos(data, hora);
CREATE INDEX IF NOT EXISTS idx_compromissos_titulo ON compromissos(titulo);

-- Criar função para atualizar o timestamp de updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o timestamp de updated_at automaticamente
DROP TRIGGER IF EXISTS update_compromissos_updated_at ON compromissos;
CREATE TRIGGER update_compromissos_updated_at
BEFORE UPDATE ON compromissos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela e colunas
COMMENT ON TABLE compromissos IS 'Tabela de compromissos do planner';
COMMENT ON COLUMN compromissos.id IS 'Identificador único do compromisso';
COMMENT ON COLUMN compromissos.titulo IS 'Título do compromisso';
COMMENT ON COLUMN compromissos.descricao IS 'Descrição detalhada do compromisso (opcional)';
COMMENT ON COLUMN compromissos.data IS 'Data do compromisso';
COMMENT ON COLUMN compromissos.hora IS 'Hora do compromisso';
COMMENT ON COLUMN compromissos.duracao IS 'Duração do compromisso em minutos';
COMMENT ON COLUMN compromissos.cor IS 'Cor do compromisso no planner (formato: bg-{cor}-{intensidade})';
COMMENT ON COLUMN compromissos.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN compromissos.updated_at IS 'Data e hora da última atualização do registro';

-- Habilitar Row Level Security (RLS)
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houverem (para evitar conflitos)
DROP POLICY IF EXISTS "compromissos_select_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_insert_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_update_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_delete_policy" ON compromissos;
DROP POLICY IF EXISTS "compromissos_all_access" ON compromissos;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "compromissos_select_policy" ON compromissos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "compromissos_insert_policy" ON compromissos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "compromissos_update_policy" ON compromissos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY "compromissos_delete_policy" ON compromissos
  FOR DELETE
  TO authenticated
  USING (true);

