-- ============================================================================
-- SCRIPT SQL PARA ADICIONAR CONTROLE DE ACESSO MOBILE/DESKTOP
-- ============================================================================
-- Este script adiciona um campo device_access na tabela user_module_permissions
-- para controlar se o usuário tem acesso mobile, desktop ou ambos
-- ============================================================================

BEGIN;

-- Adicionar coluna device_access na tabela user_module_permissions
-- Valores possíveis: 'mobile', 'desktop', 'both'
-- Por padrão, todos terão 'both' (acesso a ambos)
ALTER TABLE user_module_permissions
ADD COLUMN IF NOT EXISTS device_access VARCHAR(20) DEFAULT 'both' 
CHECK (device_access IN ('mobile', 'desktop', 'both'));

-- Atualizar todos os registros existentes para ter acesso a ambos (mobile e desktop)
UPDATE user_module_permissions
SET device_access = 'both'
WHERE device_access IS NULL OR device_access = '';

-- Criar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_device_access 
ON user_module_permissions(device_access);

COMMIT;

-- Verificar se a coluna foi criada corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_module_permissions' 
    AND column_name = 'device_access'
  ) THEN
    RAISE NOTICE 'Coluna device_access criada com sucesso!';
  ELSE
    RAISE EXCEPTION 'Erro ao criar coluna device_access';
  END IF;
END $$;

