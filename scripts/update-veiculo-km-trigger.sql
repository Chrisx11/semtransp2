-- Script para criar trigger que atualiza o kmAtual do veículo quando há atualização em trocas_oleo
-- Este trigger garante que o campo kmAtual na tabela veiculos seja sempre atualizado

-- Função para atualizar km do veículo após inserção/atualização em trocas_oleo
CREATE OR REPLACE FUNCTION update_km_veiculo_after_troca_oleo()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza a quilometragem do veículo com o novo km_atual
  UPDATE veiculos
  SET "kmAtual" = NEW.km_atual
  WHERE id = NEW.veiculo_id AND (
    "kmAtual" IS NULL OR NEW.km_atual > "kmAtual"
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_km_veiculo_troca_oleo_insert ON trocas_oleo;
DROP TRIGGER IF EXISTS update_km_veiculo_troca_oleo_update ON trocas_oleo;

-- Criar trigger para INSERT
CREATE TRIGGER update_km_veiculo_troca_oleo_insert
AFTER INSERT ON trocas_oleo
FOR EACH ROW
EXECUTE FUNCTION update_km_veiculo_after_troca_oleo();

-- Criar trigger para UPDATE (para garantir que atualizações também sejam refletidas)
CREATE TRIGGER update_km_veiculo_troca_oleo_update
AFTER UPDATE ON trocas_oleo
FOR EACH ROW
WHEN (NEW.km_atual IS DISTINCT FROM OLD.km_atual)
EXECUTE FUNCTION update_km_veiculo_after_troca_oleo();

