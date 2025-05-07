-- Verificar se o módulo "planejamento" já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM modules WHERE id = 'planejamento') THEN
        -- Inserir o módulo "planejamento"
        INSERT INTO modules (id, name, description)
        VALUES ('planejamento', 'Planejamento', 'Módulo para gerenciamento do planejamento de ordens de serviço');
        
        RAISE NOTICE 'Módulo "planejamento" adicionado com sucesso.';
    ELSE
        RAISE NOTICE 'Módulo "planejamento" já existe.';
    END IF;
END $$; 