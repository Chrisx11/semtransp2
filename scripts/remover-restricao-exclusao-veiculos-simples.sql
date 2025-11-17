-- Script SIMPLES para remover restrições de exclusão de veículos
-- Execute este script no SQL Editor do Supabase
-- Este script verifica dinamicamente os nomes das colunas

-- 1. Remover todas as constraints de foreign key que referenciam veiculos
-- e recriar com ON DELETE CASCADE para permitir exclusão

-- Tabela trocas_pneu (verificar nome da coluna dinamicamente)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trocas_pneu') THEN
        -- Verificar qual é o nome da coluna
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'trocas_pneu'
        AND (column_name = 'veiculo_id' OR column_name = 'veiculoId')
        LIMIT 1;
        
        IF col_name IS NOT NULL THEN
            -- Primeiro, limpar dados órfãos (valores que não existem em veiculos)
            -- Como veiculo_id é NOT NULL, vamos excluir os registros órfãos
            EXECUTE format('
                DELETE FROM trocas_pneu 
                WHERE %I IS NOT NULL 
                AND %I NOT IN (SELECT id FROM veiculos)
            ', col_name, col_name);
            
            GET DIAGNOSTICS orphaned_count = ROW_COUNT;
            
            -- Encontrar e remover constraint existente
            SELECT tc.constraint_name INTO constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'trocas_pneu'
            AND kcu.column_name = col_name
            AND tc.constraint_type = 'FOREIGN KEY'
            LIMIT 1;
            
            IF constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE trocas_pneu DROP CONSTRAINT IF EXISTS %I', constraint_name);
            END IF;
            
            -- Recriar com CASCADE
            EXECUTE format('ALTER TABLE trocas_pneu ADD CONSTRAINT trocas_pneu_veiculo_fkey FOREIGN KEY (%I) REFERENCES veiculos(id) ON DELETE CASCADE', col_name);
            
            IF orphaned_count > 0 THEN
                RAISE NOTICE 'Excluídos % registros órfãos na tabela trocas_pneu', orphaned_count;
            END IF;
        END IF;
    END IF;
END $$;

-- Tabela trocas_oleo (verificar nome da coluna dinamicamente)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trocas_oleo') THEN
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'trocas_oleo'
        AND (column_name = 'veiculo_id' OR column_name = 'veiculoId')
        LIMIT 1;
        
        IF col_name IS NOT NULL THEN
            -- Limpar dados órfãos
            EXECUTE format('
                DELETE FROM trocas_oleo 
                WHERE %I IS NOT NULL 
                AND %I NOT IN (SELECT id FROM veiculos)
            ', col_name, col_name);
            
            GET DIAGNOSTICS orphaned_count = ROW_COUNT;
            
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
            
            IF orphaned_count > 0 THEN
                RAISE NOTICE 'Excluídos % registros órfãos na tabela trocas_oleo', orphaned_count;
            END IF;
        END IF;
    END IF;
END $$;

-- Tabela ordens_servico (verificar nome da coluna dinamicamente - pode ser veiculoId)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordens_servico') THEN
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'ordens_servico'
        AND (column_name = 'veiculo_id' OR column_name = 'veiculoId')
        LIMIT 1;
        
        IF col_name IS NOT NULL THEN
            -- Primeiro, limpar dados órfãos (valores que não existem em veiculos)
            EXECUTE format('
                UPDATE ordens_servico 
                SET %I = NULL 
                WHERE %I IS NOT NULL 
                AND %I NOT IN (SELECT id FROM veiculos)
            ', col_name, col_name, col_name);
            
            -- Contar quantos registros foram limpos
            GET DIAGNOSTICS orphaned_count = ROW_COUNT;
            
            -- Encontrar e remover constraint existente
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
            
            -- Agora criar a constraint (após limpar dados órfãos)
            EXECUTE format('ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_veiculo_fkey FOREIGN KEY (%I) REFERENCES veiculos(id) ON DELETE CASCADE', col_name);
            
            -- Informar quantos registros foram limpos
            IF orphaned_count > 0 THEN
                RAISE NOTICE 'Limpos % registros órfãos na tabela ordens_servico', orphaned_count;
            END IF;
        END IF;
    END IF;
END $$;

-- Tabela notas (manter SET NULL para não perder dados)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas') THEN
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'notas'
        AND (column_name = 'veiculo_id' OR column_name = 'veiculoId')
        LIMIT 1;
        
        IF col_name IS NOT NULL THEN
            -- Limpar dados órfãos (definir como NULL já que a coluna permite NULL)
            EXECUTE format('
                UPDATE notas 
                SET %I = NULL 
                WHERE %I IS NOT NULL 
                AND %I NOT IN (SELECT id FROM veiculos)
            ', col_name, col_name, col_name);
            
            GET DIAGNOSTICS orphaned_count = ROW_COUNT;
            
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
            
            IF orphaned_count > 0 THEN
                RAISE NOTICE 'Limpos % registros órfãos na tabela notas (definidos como NULL)', orphaned_count;
            END IF;
        END IF;
    END IF;
END $$;

-- Tabela filtros_registrados (verificar nome da coluna dinamicamente - pode ser veiculoid)
DO $$
DECLARE
    col_name TEXT;
    constraint_name TEXT;
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'filtros_registrados') THEN
        -- Verificar qual é o nome da coluna (priorizar veiculoid que é o padrão usado)
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_name = 'filtros_registrados'
        AND (column_name = 'veiculoid' OR column_name = 'veiculo_id' OR column_name = 'veiculoId')
        ORDER BY CASE 
            WHEN column_name = 'veiculoid' THEN 1
            WHEN column_name = 'veiculo_id' THEN 2
            WHEN column_name = 'veiculoId' THEN 3
        END
        LIMIT 1;
        
        -- Se não encontrou, tentar encontrar qualquer coluna que referencie veiculos
        IF col_name IS NULL THEN
            SELECT kcu.column_name INTO col_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'filtros_registrados'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.table_name = 'filtros_registrados'
            LIMIT 1;
        END IF;
        
        -- Se ainda não encontrou, procurar por padrões comuns
        IF col_name IS NULL THEN
            SELECT column_name INTO col_name
            FROM information_schema.columns
            WHERE table_name = 'filtros_registrados'
            AND (column_name ILIKE '%veiculo%' OR column_name = 'id')
            LIMIT 1;
        END IF;
        
        IF col_name IS NOT NULL THEN
            -- Limpar dados órfãos (excluir registros onde o veículo não existe)
            EXECUTE format('
                DELETE FROM filtros_registrados 
                WHERE %I IS NOT NULL 
                AND %I::text NOT IN (SELECT id::text FROM veiculos)
            ', col_name, col_name);
            
            GET DIAGNOSTICS orphaned_count = ROW_COUNT;
            
            -- Encontrar e remover constraint existente
            SELECT tc.constraint_name INTO constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'filtros_registrados'
            AND kcu.column_name = col_name
            AND tc.constraint_type = 'FOREIGN KEY'
            LIMIT 1;
            
            IF constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE filtros_registrados DROP CONSTRAINT IF EXISTS %I', constraint_name);
            END IF;
            
            -- Criar constraint com CASCADE
            EXECUTE format('ALTER TABLE filtros_registrados ADD CONSTRAINT filtros_registrados_veiculo_fkey FOREIGN KEY (%I) REFERENCES veiculos(id) ON DELETE CASCADE', col_name);
            
            IF orphaned_count > 0 THEN
                RAISE NOTICE 'Excluídos % registros órfãos na tabela filtros_registrados', orphaned_count;
            END IF;
        ELSE
            RAISE NOTICE 'Não foi possível encontrar a coluna de veículo na tabela filtros_registrados';
        END IF;
    END IF;
END $$;

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

