-- Script SIMPLES para remover restrições de exclusão de veículos
-- Execute este script no SQL Editor do Supabase

-- 1. Remover todas as constraints de foreign key que referenciam veiculos
-- e recriar com ON DELETE CASCADE para permitir exclusão

-- Tabela trocas_pneu
ALTER TABLE trocas_pneu 
DROP CONSTRAINT IF EXISTS trocas_pneu_veiculo_id_fkey;

ALTER TABLE trocas_pneu
ADD CONSTRAINT trocas_pneu_veiculo_id_fkey 
FOREIGN KEY (veiculo_id) 
REFERENCES veiculos(id) 
ON DELETE CASCADE;

-- Tabela trocas_oleo (se existir)
ALTER TABLE trocas_oleo 
DROP CONSTRAINT IF EXISTS trocas_oleo_veiculo_id_fkey;

ALTER TABLE trocas_oleo
ADD CONSTRAINT trocas_oleo_veiculo_id_fkey 
FOREIGN KEY (veiculo_id) 
REFERENCES veiculos(id) 
ON DELETE CASCADE;

-- Tabela ordens_servico (se existir)
ALTER TABLE ordens_servico 
DROP CONSTRAINT IF EXISTS ordens_servico_veiculo_id_fkey;

ALTER TABLE ordens_servico
ADD CONSTRAINT ordens_servico_veiculo_id_fkey 
FOREIGN KEY (veiculo_id) 
REFERENCES veiculos(id) 
ON DELETE CASCADE;

-- Tabela notas (manter SET NULL para não perder dados)
ALTER TABLE notas 
DROP CONSTRAINT IF EXISTS notas_veiculo_id_fkey;

ALTER TABLE notas
ADD CONSTRAINT notas_veiculo_id_fkey 
FOREIGN KEY (veiculo_id) 
REFERENCES veiculos(id) 
ON DELETE SET NULL;

-- 2. Criar função e trigger para limpar veiculosCompativeis dos produtos
-- quando um veículo for excluído (já que é um campo JSON/array, não foreign key)

CREATE OR REPLACE FUNCTION limpar_veiculo_de_produtos_compativeis()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove o ID do veículo excluído de todos os arrays veiculosCompativeis
    UPDATE produtos
    SET "veiculosCompativeis" = array_remove("veiculosCompativeis", OLD.id::text)
    WHERE OLD.id::text = ANY("veiculosCompativeis");
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir e criar novo
DROP TRIGGER IF EXISTS trigger_limpar_veiculo_produtos ON veiculos;
CREATE TRIGGER trigger_limpar_veiculo_produtos
    BEFORE DELETE ON veiculos
    FOR EACH ROW
    EXECUTE FUNCTION limpar_veiculo_de_produtos_compativeis();

-- Pronto! Agora você pode excluir veículos mesmo que tenham registros relacionados.
-- Os registros relacionados serão excluídos automaticamente (CASCADE)
-- e o veículo será removido dos arrays veiculosCompativeis dos produtos.

