-- Script para adicionar os novos módulos: Fornecedores, Borracharia e Serviços de Lavagem

-- Verificar e adicionar o módulo "fornecedores" se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM modules WHERE id = 'fornecedores') THEN
        -- Inserir o módulo "fornecedores"
        INSERT INTO modules (id, name, description)
        VALUES ('fornecedores', 'Fornecedores', 'Módulo para gerenciamento de fornecedores');
        
        RAISE NOTICE 'Módulo "fornecedores" adicionado com sucesso.';
    ELSE
        RAISE NOTICE 'Módulo "fornecedores" já existe.';
    END IF;
END $$;

-- Verificar e adicionar o módulo "borracharia" se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM modules WHERE id = 'borracharia') THEN
        -- Inserir o módulo "borracharia"
        INSERT INTO modules (id, name, description)
        VALUES ('borracharia', 'Borracharia', 'Módulo para gerenciamento de serviços de borracharia');
        
        RAISE NOTICE 'Módulo "borracharia" adicionado com sucesso.';
    ELSE
        RAISE NOTICE 'Módulo "borracharia" já existe.';
    END IF;
END $$;

-- Verificar e adicionar o módulo "lavador" se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM modules WHERE id = 'lavador') THEN
        -- Inserir o módulo "lavador"
        INSERT INTO modules (id, name, description)
        VALUES ('lavador', 'Serviços de Lavagem', 'Módulo para gerenciamento de serviços de lavagem de veículos');
        
        RAISE NOTICE 'Módulo "lavador" adicionado com sucesso.';
    ELSE
        RAISE NOTICE 'Módulo "lavador" já existe.';
    END IF;
END $$; 