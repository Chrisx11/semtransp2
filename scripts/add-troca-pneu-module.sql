-- Verificar se o módulo "trocaPneu" já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM modules WHERE id = 'trocaPneu') THEN
        -- Inserir o módulo "trocaPneu"
        INSERT INTO modules (id, name, description)
        VALUES ('trocaPneu', 'Troca de Pneu', 'Módulo para gerenciamento da troca de pneus dos veículos');
        
        RAISE NOTICE 'Módulo "trocaPneu" adicionado com sucesso.';
    ELSE
        RAISE NOTICE 'Módulo "trocaPneu" já existe.';
    END IF;
END $$; 