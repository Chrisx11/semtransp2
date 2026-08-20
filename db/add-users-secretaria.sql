-- ============================================================================
-- Acesso especial por secretaria
-- Login = nome da secretaria (ex: SEMFAZ) | Senha = 123456
-- Páginas: Dashboard, Veículos, Filtros, Tela, Troca de Óleo
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS secretaria VARCHAR(50) NULL;

ALTER TABLE user_module_permissions
ADD COLUMN IF NOT EXISTS device_access VARCHAR(20) DEFAULT 'both';

COMMENT ON COLUMN users.secretaria IS
  'Quando preenchida, o usuário vê apenas dados dessa secretaria (login especial).';

-- Garantir módulos necessários
INSERT INTO modules (id, name, description)
VALUES
  ('dashboard', 'Dashboard', 'Painel principal'),
  ('veiculos', 'Veículos', 'Gestão de veículos'),
  ('filtros', 'Filtros', 'Filtros de veículos'),
  ('tela', 'Tela', 'Tela de oficina'),
  ('trocaOleo', 'Troca de Óleo', 'Controle de troca de óleo')
ON CONFLICT (id) DO NOTHING;

-- Criar/atualizar usuários de cada secretaria
DO $$
DECLARE
  secs TEXT[] := ARRAY[
    'SEMGOV','SEMPLAD','SEMFAZ','SEMEDUC','SEMUSA','SEMATHRAB',
    'SEMOSP','SEMALP','SEMAEV','SEMCI','SEMGAP','SEMCTEL',
    'SEMSEG','SEMTRANSP','PROGEM','LEONARDO'
  ];
  sec TEXT;
  uid UUID;
  mid TEXT;
  mods TEXT[] := ARRAY['dashboard','veiculos','filtros','tela','trocaOleo'];
BEGIN
  FOREACH sec IN ARRAY secs LOOP
    INSERT INTO users (name, username, password, active, secretaria)
    VALUES (sec, sec, '123456', true, sec)
    ON CONFLICT (username) DO UPDATE
      SET
        name = EXCLUDED.name,
        password = '123456',
        active = true,
        secretaria = EXCLUDED.secretaria,
        updated_at = NOW();

    SELECT id INTO uid FROM users WHERE UPPER(username) = sec LIMIT 1;

    IF uid IS NULL THEN
      RAISE EXCEPTION 'Não foi possível criar/obter usuário %', sec;
    END IF;

    DELETE FROM user_module_permissions WHERE user_id = uid;

    FOREACH mid IN ARRAY mods LOOP
      INSERT INTO user_module_permissions (user_id, module_id, can_view, can_edit, device_access)
      VALUES (uid, mid, true, false, 'both')
      ON CONFLICT (user_id, module_id) DO UPDATE
        SET can_view = true, can_edit = false, device_access = COALESCE(EXCLUDED.device_access, 'both');
    END LOOP;

    RAISE NOTICE 'Usuário secretaria pronto: % (id=%)', sec, uid;
  END LOOP;
END $$;
