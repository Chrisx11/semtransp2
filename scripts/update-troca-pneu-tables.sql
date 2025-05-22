-- Script para atualização das tabelas de Troca de Pneus
-- Este script é usado para atualizar tabelas já existentes, adicionando novos campos ou índices

-- Função para adicionar coluna se ela não existir
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    table_name text,
    column_name text,
    column_type text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = add_column_if_not_exists.table_name 
        AND column_name = add_column_if_not_exists.column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
                      table_name, 
                      column_name, 
                      column_type);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Verificar e adicionar coluna updated_at para trocas_pneu se não existir
SELECT add_column_if_not_exists('trocas_pneu', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');

-- Garantir que o trigger para atualizar updated_at existe
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar ou atualizar o trigger
DROP TRIGGER IF EXISTS set_timestamp ON trocas_pneu;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON trocas_pneu
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Garantir que o trigger para atualizar km do veículo existe
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

-- Adicionar ou atualizar o trigger
DROP TRIGGER IF EXISTS update_km_veiculo ON trocas_pneu;
CREATE TRIGGER update_km_veiculo
AFTER INSERT ON trocas_pneu
FOR EACH ROW
EXECUTE FUNCTION update_km_veiculo_after_troca_pneu();

-- Verificar e criar índices se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tipos_pneu_ativo') THEN
        CREATE INDEX idx_tipos_pneu_ativo ON tipos_pneu(ativo);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trocas_pneu_veiculo') THEN
        CREATE INDEX idx_trocas_pneu_veiculo ON trocas_pneu(veiculo_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trocas_pneu_data') THEN
        CREATE INDEX idx_trocas_pneu_data ON trocas_pneu(data_troca);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trocas_pneu_tipo') THEN
        CREATE INDEX idx_trocas_pneu_tipo ON trocas_pneu(tipo_pneu_id);
    END IF;
END
$$;

-- Atualizar os comentários das tabelas e colunas
COMMENT ON TABLE tipos_pneu IS 'Armazena os diferentes tipos/modelos de pneus disponíveis';
COMMENT ON COLUMN tipos_pneu.id IS 'Identificador único do tipo de pneu';
COMMENT ON COLUMN tipos_pneu.marca IS 'Marca do pneu (ex: Pirelli, Michelin)';
COMMENT ON COLUMN tipos_pneu.modelo IS 'Modelo do pneu (ex: Scorpion, Energy)';
COMMENT ON COLUMN tipos_pneu.medida IS 'Dimensões do pneu (ex: 215/65 R16)';
COMMENT ON COLUMN tipos_pneu.ativo IS 'Indica se o tipo de pneu está ativo para seleção';

COMMENT ON TABLE trocas_pneu IS 'Armazena os registros de trocas de pneus realizadas nos veículos';
COMMENT ON COLUMN trocas_pneu.id IS 'Identificador único da troca de pneu';
COMMENT ON COLUMN trocas_pneu.veiculo_id IS 'Referência ao veículo que teve os pneus trocados';
COMMENT ON COLUMN trocas_pneu.tipo_pneu_id IS 'Referência ao tipo de pneu utilizado';
COMMENT ON COLUMN trocas_pneu.data_troca IS 'Data em que a troca foi realizada';
COMMENT ON COLUMN trocas_pneu.km IS 'Quilometragem do veículo no momento da troca';
COMMENT ON COLUMN trocas_pneu.posicoes IS 'Array com as posições dos pneus que foram trocados';
COMMENT ON COLUMN trocas_pneu.observacao IS 'Observações adicionais sobre a troca';

-- Atualizar RLS para garantir segurança
-- Políticas para tipos_pneu - só criamos se a tabela tiver RLS ativado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'tipos_pneu' 
        AND rowsecurity = true
    ) THEN
        -- Criar políticas se não existirem
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'tipos_pneu' 
            AND policyname = 'Permitir leitura pública de tipos_pneu'
        ) THEN
            CREATE POLICY "Permitir leitura pública de tipos_pneu" ON tipos_pneu
                FOR SELECT
                USING (true);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'tipos_pneu' 
            AND policyname = 'Permitir inserção para usuários autenticados'
        ) THEN
            CREATE POLICY "Permitir inserção para usuários autenticados" ON tipos_pneu
                FOR INSERT
                TO authenticated
                WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'tipos_pneu' 
            AND policyname = 'Permitir atualização para usuários autenticados'
        ) THEN
            CREATE POLICY "Permitir atualização para usuários autenticados" ON tipos_pneu
                FOR UPDATE
                TO authenticated
                USING (true);
        END IF;
    END IF;
    
    -- Políticas para trocas_pneu - só criamos se a tabela tiver RLS ativado
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'trocas_pneu' 
        AND rowsecurity = true
    ) THEN
        -- Criar políticas se não existirem
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'trocas_pneu' 
            AND policyname = 'Permitir leitura pública de trocas_pneu'
        ) THEN
            CREATE POLICY "Permitir leitura pública de trocas_pneu" ON trocas_pneu
                FOR SELECT
                USING (true);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'trocas_pneu' 
            AND policyname = 'Permitir inserção para usuários autenticados'
        ) THEN
            CREATE POLICY "Permitir inserção para usuários autenticados" ON trocas_pneu
                FOR INSERT
                TO authenticated
                WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'trocas_pneu' 
            AND policyname = 'Permitir atualização para usuários autenticados'
        ) THEN
            CREATE POLICY "Permitir atualização para usuários autenticados" ON trocas_pneu
                FOR UPDATE
                TO authenticated
                USING (true);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'trocas_pneu' 
            AND policyname = 'Permitir exclusão para usuários autenticados'
        ) THEN
            CREATE POLICY "Permitir exclusão para usuários autenticados" ON trocas_pneu
                FOR DELETE
                TO authenticated
                USING (true);
        END IF;
    END IF;
END
$$; 