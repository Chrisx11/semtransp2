-- Criar tabela de despesas extraídas de notas de fornecedor escaneadas
CREATE TABLE IF NOT EXISTS despesas_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_nota TEXT,
  data_nota DATE,
  veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  placa TEXT,
  fornecedor TEXT,
  itens JSONB NOT NULL DEFAULT '[]',
  valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  caminho_imagem TEXT NOT NULL,
  texto_extraido TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_despesas_notas_data ON despesas_notas(data_nota DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_notas_veiculo ON despesas_notas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_despesas_notas_placa ON despesas_notas(placa);
CREATE INDEX IF NOT EXISTS idx_despesas_notas_created_at ON despesas_notas(created_at DESC);

ALTER TABLE despesas_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de despesas_notas para todos autenticados"
  ON despesas_notas FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de despesas_notas para todos autenticados"
  ON despesas_notas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de despesas_notas para todos autenticados"
  ON despesas_notas FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão de despesas_notas para todos autenticados"
  ON despesas_notas FOR DELETE
  USING (true);

CREATE OR REPLACE FUNCTION update_despesas_notas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_despesas_notas_updated_at
  BEFORE UPDATE ON despesas_notas
  FOR EACH ROW
  EXECUTE FUNCTION update_despesas_notas_updated_at();

-- ============================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- ============================================
--
-- Após executar este SQL, crie o bucket no Supabase Storage:
--   - Nome: 'despesas-notas'
--   - Público: false (recomendado)
--   - Allowed MIME types: image/png, image/jpeg, image/webp
--
-- Em seguida, execute: db/create-despesas-notas-storage-policies.sql
-- ============================================
