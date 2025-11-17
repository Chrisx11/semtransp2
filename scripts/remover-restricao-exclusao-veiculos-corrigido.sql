-- Script CORRIGIDO para remover restrições de exclusão de veículos
-- Este script verifica dinamicamente os nomes das colunas antes de alterar constraints

-- 1. Primeiro, vamos listar todas as constraints que referenciam veiculos
-- para identificar os nomes corretos das colunas
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

-- 2. Remover e recriar constraints com verificação dinâmica de nomes de colunas

-- Tabela trocas_pneu (verificar se existe e qual o nome da coluna)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trocas_pneu') THEN
        -- Verificar qual é o nome da coluna (veiculo_id ou veiculoId)
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'trocas_pneu'
        AND (column_name = 'veiculo_id' OR column_name = 'veiculoId')
        LIMIT 1;
        
        IF col_name IS NOT NULL THEN
            -- Encontrar o nome da constraint
            SELECT tc.constraint_name INTO constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'trocas_pneu'
            AND kcu.column_name = col_name
            AND tc.constraint_type = 'FOREIGN KEY'
            LIMIT 1;
            
            -- Remover constraint se existir
            IF constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE trocas_pneu DROP CONSTRAINT IF EXISTS %I', constraint_name);
            END IF;
            
            -- Recriar com CASCADE
            EXECUTE format('ALTER TABLE trocas_pneu ADD CONSTRAINT trocas_pneu_veiculo_fkey FOREIGN KEY (%I) REFERENCES veiculos(id) ON DELETE CASCADE', col_name);
        END IF;
    END IF;
END $$;

-- Tabela trocas_oleo (verificar se existe e qual o nome da coluna)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trocas_oleo') THEN
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'trocas_oleo'
        AND (column_name = 'veiculo_id' OR column_name = 'veiculoId')
        LIMIT 1;
        
        IF col_name IS NOT NULL THEN
            SELECT tc.constraint_name INTO constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'trocas_oleo'
            AND kcu.column_name = col_name
            AND tc.constraint_type = 'FOREIGN KEY'
            LIMIT 1;
            
            IF constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE trocas_oleo DROP CONSTRAINT IF EXISTS %I', constraint_name);
            END IF;
            
            EXECUTE format('ALTER TABLE trocas_oleo ADD CONSTRAINT trocas_oleo_veiculo_fkey FOREIGN KEY (%I) REFERENCES veiculos(id) ON DELETE CASCADE', col_name);
        END IF;
    END IF;
END $$;

-- Tabela ordens_servico (verificar se existe e qual o nome da coluna)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordens_servico') THEN
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'ordens_servico'
        AND (column_name = 'veiculo_id' OR column_name = 'veiculoId')
        LIMIT 1;
        
        IF col_name IS NOT NULL THEN
            SELECT tc.constraint_name INTO constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'ordens_servico'
            AND kcu.column_name = col_name
            AND tc.constraint_type = 'FOREIGN KEY'
            LIMIT 1;
            
            IF constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS %I', constraint_name);
            END IF;
            
            EXECUTE format('ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_veiculo_fkey FOREIGN KEY (%I) REFERENCES veiculos(id) ON DELETE CASCADE', col_name);
        END IF;
    END IF;
END $$;

-- Tabela notas (verificar se existe e qual o nome da coluna)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas') THEN
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'notas'
        AND (column_name = 'veiculo_id' OR column_name = 'veiculoId')
        LIMIT 1;
        
        IF col_name IS NOT NULL THEN
            SELECT tc.constraint_name INTO constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'notas'
            AND kcu.column_name = col_name
            AND tc.constraint_type = 'FOREIGN KEY'
            LIMIT 1;
            
            IF constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE notas DROP CONSTRAINT IF EXISTS %I', constraint_name);
            END IF;
            
            EXECUTE format('ALTER TABLE notas ADD CONSTRAINT notas_veiculo_fkey FOREIGN KEY (%I) REFERENCES veiculos(id) ON DELETE SET NULL', col_name);
        END IF;
    END IF;
END $$;

-- 3. Criar função e trigger para limpar veiculosCompativeis dos produtos
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

-- 4. Verificar se todas as constraints foram atualizadas
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

