-- Tabela de módulos do sistema
CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para as abas de Ordem de Serviço
CREATE TABLE IF NOT EXISTS os_tabs (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissões de módulos para usuários
CREATE TABLE IF NOT EXISTS user_module_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id VARCHAR(255) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Permissões de abas de Ordem de Serviço para usuários
CREATE TABLE IF NOT EXISTS user_os_tab_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  os_tab_id VARCHAR(255) NOT NULL REFERENCES os_tabs(id) ON DELETE CASCADE,
  has_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, os_tab_id)
);

-- Inserir módulos padrão
INSERT INTO modules (id, name, description)
VALUES
  ('dashboard', 'Dashboard', 'Painel principal do sistema'),
  ('colaboradores', 'Colaboradores', 'Gerenciamento de colaboradores'),
  ('veiculos', 'Veículos', 'Gerenciamento de veículos'),
  ('produtos', 'Produtos', 'Gerenciamento de produtos'),
  ('entradas', 'Entradas', 'Registro de entradas de produtos'),
  ('saidas', 'Saídas', 'Registro de saídas de produtos'),
  ('painel', 'Painel', 'Painel de controle'),
  ('planejamento', 'Planejamento', 'Gerenciamento de planejamento'),
  ('trocaOleo', 'Troca de Óleo', 'Gerenciamento de trocas de óleo'),
  ('trocaPneu', 'Troca de Pneu', 'Gerenciamento de trocas de pneu'),
  ('historico', 'Histórico', 'Histórico de operações'),
  ('configuracoes', 'Configurações', 'Configurações do sistema'),
  ('ordemServico', 'Ordem de Serviço', 'Gerenciamento de ordens de serviço')
ON CONFLICT (id) DO NOTHING;

-- Inserir abas de Ordem de Serviço padrão
INSERT INTO os_tabs (id, name, description)
VALUES
  ('oficina', 'Oficina', 'Setor de oficina'),
  ('almoxarifado', 'Almoxarifado', 'Setor de almoxarifado'),
  ('compras', 'Compras', 'Setor de compras'),
  ('finalizadas', 'Finalizadas', 'Ordens de serviço finalizadas')
ON CONFLICT (id) DO NOTHING;

-- Inserir um usuário administrador padrão (username: admin, senha: admin123)
INSERT INTO users (name, username, password, active)
VALUES ('Administrador', 'admin', 'admin123', true)
ON CONFLICT (username) DO NOTHING;

-- Atribuir todas as permissões ao usuário administrador
-- Primeiro precisamos obter o ID do usuário admin
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE username = 'admin';
  
  -- Inserir permissões para todos os módulos
  INSERT INTO user_module_permissions (user_id, module_id, can_view, can_edit)
  SELECT admin_id, id, true, true
  FROM modules
  ON CONFLICT (user_id, module_id) DO NOTHING;
  
  -- Inserir permissões para todas as abas de OS
  INSERT INTO user_os_tab_permissions (user_id, os_tab_id, has_access)
  SELECT admin_id, id, true
  FROM os_tabs
  ON CONFLICT (user_id, os_tab_id) DO NOTHING;
END
$$; 