-- Script para remover restrições de exclusão de veículos
-- Este script identifica e altera todas as foreign keys que referenciam veiculos
-- para permitir exclusão em cascata ou set null

-- 1. Primeiro, vamos listar todas as constraints que referenciam veiculos
-- Execute este SELECT para ver quais constraints existem:
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'veiculos'
    AND ccu.column_name = 'id'
ORDER BY tc.table_name;

-- 2. Remover constraints existentes e recriar com ON DELETE CASCADE ou SET NULL
-- Isso permitirá excluir veículos mesmo que tenham registros relacionados

-- Tabela: trocas_pneu
-- Se a constraint existir, vamos alterá-la
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%veiculo_id%' 
        AND table_name = 'trocas_pneu'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE trocas_pneu 
        DROP CONSTRAINT IF EXISTS trocas_pneu_veiculo_id_fkey;
    END IF;
    
    -- Recriar com CASCADE
    ALTER TABLE trocas_pneu
    ADD CONSTRAINT trocas_pneu_veiculo_id_fkey 
    FOREIGN KEY (veiculo_id) 
    REFERENCES veiculos(id) 
    ON DELETE CASCADE;
END $$;

-- Tabela: trocas_oleo (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'trocas_oleo'
    ) THEN
        ALTER TABLE trocas_oleo 
        DROP CONSTRAINT IF EXISTS trocas_oleo_veiculo_id_fkey;
        
        ALTER TABLE trocas_oleo
        ADD CONSTRAINT trocas_oleo_veiculo_id_fkey 
        FOREIGN KEY (veiculo_id) 
        REFERENCES veiculos(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela: ordens_servico (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ordens_servico'
    ) THEN
        ALTER TABLE ordens_servico 
        DROP CONSTRAINT IF EXISTS ordens_servico_veiculo_id_fkey;
        
        ALTER TABLE ordens_servico
        ADD CONSTRAINT ordens_servico_veiculo_id_fkey 
        FOREIGN KEY (veiculo_id) 
        REFERENCES veiculos(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela: notas (se existir - já tem SET NULL, mas vamos garantir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notas'
    ) THEN
        ALTER TABLE notas 
        DROP CONSTRAINT IF EXISTS notas_veiculo_id_fkey;
        
        ALTER TABLE notas
        ADD CONSTRAINT notas_veiculo_id_fkey 
        FOREIGN KEY (veiculo_id) 
        REFERENCES veiculos(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Tabela: historicos (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'historicos'
    ) THEN
        ALTER TABLE historicos 
        DROP CONSTRAINT IF EXISTS historicos_veiculo_id_fkey;
        
        ALTER TABLE historicos
        ADD CONSTRAINT historicos_veiculo_id_fkey 
        FOREIGN KEY (veiculo_id) 
        REFERENCES veiculos(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela: compromissos (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'compromissos'
    ) THEN
        ALTER TABLE compromissos 
        DROP CONSTRAINT IF EXISTS compromissos_veiculo_id_fkey;
        
        ALTER TABLE compromissos
        ADD CONSTRAINT compromissos_veiculo_id_fkey 
        FOREIGN KEY (veiculo_id) 
        REFERENCES veiculos(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- IMPORTANTE: Para produtos com veiculosCompativeis (campo JSON/array)
-- Não há foreign key tradicional, mas precisamos limpar o array quando excluir veículo
-- Criar função para limpar veiculosCompativeis quando um veículo for excluído

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

-- Criar trigger para executar a função quando um veículo for excluído
DROP TRIGGER IF EXISTS trigger_limpar_veiculo_produtos ON veiculos;
CREATE TRIGGER trigger_limpar_veiculo_produtos
    BEFORE DELETE ON veiculos
    FOR EACH ROW
    EXECUTE FUNCTION limpar_veiculo_de_produtos_compativeis();

-- Verificar se todas as constraints foram atualizadas
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'veiculos'
    AND ccu.column_name = 'id'
ORDER BY tc.table_name;

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE 'Script executado com sucesso! Agora é possível excluir veículos mesmo que tenham registros relacionados.';
    RAISE NOTICE 'Os registros relacionados serão excluídos em cascata (CASCADE) ou setados como NULL (SET NULL) conforme configurado.';
    RAISE NOTICE 'O campo veiculosCompativeis nos produtos será limpo automaticamente quando um veículo for excluído.';
END $$;

