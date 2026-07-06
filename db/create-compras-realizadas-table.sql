-- Criar tabela de Compras Realizadas (lançamentos importados de Ordens de Serviço em PDF)
CREATE TABLE IF NOT EXISTS compras_realizadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_os TEXT NOT NULL,
  placa TEXT,
  veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  veiculo_modelo TEXT,
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  fornecedor TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_nota NUMERIC(12,2) NOT NULL DEFAULT 0,
  arquivo_nome TEXT NOT NULL,
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para as buscas mais comuns da tela (por OS, placa, veículo e ordenação por data)
CREATE INDEX IF NOT EXISTS idx_compras_realizadas_numero_os ON compras_realizadas(numero_os);
CREATE INDEX IF NOT EXISTS idx_compras_realizadas_placa ON compras_realizadas(placa);
CREATE INDEX IF NOT EXISTS idx_compras_realizadas_veiculo_id ON compras_realizadas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_compras_realizadas_data ON compras_realizadas(data DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE compras_realizadas ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (mesmo padrão usado em documentos/colaboradores/fornecedores neste projeto)
DROP POLICY IF EXISTS "Permitir leitura de compras_realizadas" ON compras_realizadas;
CREATE POLICY "Permitir leitura de compras_realizadas"
  ON compras_realizadas FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir inserção de compras_realizadas" ON compras_realizadas;
CREATE POLICY "Permitir inserção de compras_realizadas"
  ON compras_realizadas FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de compras_realizadas" ON compras_realizadas;
CREATE POLICY "Permitir atualização de compras_realizadas"
  ON compras_realizadas FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de compras_realizadas" ON compras_realizadas;
CREATE POLICY "Permitir exclusão de compras_realizadas"
  ON compras_realizadas FOR DELETE
  USING (true);

-- Função + trigger para manter updated_at em dia
CREATE OR REPLACE FUNCTION update_compras_realizadas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_compras_realizadas_updated_at ON compras_realizadas;
CREATE TRIGGER trg_update_compras_realizadas_updated_at
  BEFORE UPDATE ON compras_realizadas
  FOR EACH ROW
  EXECUTE FUNCTION update_compras_realizadas_updated_at();

-- Comentários
COMMENT ON TABLE compras_realizadas IS 'Lançamentos de compras importados de Ordens de Serviço em PDF, um registro por nota';
COMMENT ON COLUMN compras_realizadas.numero_os IS 'Número da Ordem de Serviço (extraído do PDF/nome do arquivo)';
COMMENT ON COLUMN compras_realizadas.placa IS 'Placa lida no PDF (pode ser nula quando a OS não está vinculada a um veículo)';
COMMENT ON COLUMN compras_realizadas.veiculo_id IS 'Veículo casado pela placa (automático ou selecionado manualmente na importação)';
COMMENT ON COLUMN compras_realizadas.itens IS 'Array JSON dos itens da nota: [{codigo, descricao, quantidade, valorUnitario, valorTotal}]';
COMMENT ON COLUMN compras_realizadas.pdf_path IS 'Caminho do PDF original no bucket de Storage "compras-realizadas-pdfs" (nulo se não anexado)';

-- ============================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE (para anexar o PDF original)
-- ============================================
--
-- Após executar este SQL:
--
-- 1. Crie o bucket no Supabase Dashboard > Storage > Create Bucket:
--    - Nome: compras-realizadas-pdfs
--    - Público: false (recomendado)
--    - File size limit: 10MB
--    - Allowed MIME types: application/pdf
--
-- 2. Execute o arquivo db/create-compras-realizadas-storage-policies.sql
--    (obrigatório para o upload/leitura do PDF funcionar)
-- ============================================
