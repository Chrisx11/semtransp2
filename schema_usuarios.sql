-- Habilita a extensão de UUID, caso ainda não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tipo enum para perfis
CREATE TYPE perfil_tipo AS ENUM ('admin', 'gestor', 'almoxarifado', 'oficina', 'basico', 'customizado');

-- Criar tabela de usuários
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  sobrenome TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,  -- Em produção, nunca armazene senhas em texto puro. Use HASH + SALT
  perfil perfil_tipo NOT NULL DEFAULT 'basico',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  permissoes_customizadas JSONB,
  
  -- Restrições adicionais
  CONSTRAINT login_check CHECK (login ~* '^[a-z0-9\.]+$'),
  CONSTRAINT senha_check CHECK (LENGTH(senha) >= 6)
);

-- Cria índices para consultas frequentes
CREATE INDEX idx_usuarios_login ON usuarios(login);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- Insere um usuário admin padrão
INSERT INTO usuarios (
  nome, 
  sobrenome, 
  login, 
  senha, 
  perfil
) VALUES (
  'Administrador',
  'Sistema',
  'admin.sistema',
  'admin123', -- Em produção, use uma senha forte e criptografada
  'admin'
);

-- Configura Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para administradores terem acesso total
CREATE POLICY "Administradores têm acesso total" ON usuarios
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Política para usuários comuns visualizarem apenas suas próprias informações
CREATE POLICY "Usuários visualizam apenas seus próprios dados" ON usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Função de gatilho para validar permissões customizadas
CREATE OR REPLACE FUNCTION validate_custom_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o perfil for customizado, permissões_customizadas não pode ser nulo
  IF NEW.perfil = 'customizado' AND NEW.permissoes_customizadas IS NULL THEN
    RAISE EXCEPTION 'Permissões customizadas são obrigatórias para perfil customizado';
  END IF;
  
  -- Se o perfil não for customizado, permissões_customizadas deve ser nulo
  IF NEW.perfil != 'customizado' AND NEW.permissoes_customizadas IS NOT NULL THEN
    NEW.permissoes_customizadas := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o gatilho para validar permissões antes de inserir ou atualizar
CREATE TRIGGER check_custom_permissions
BEFORE INSERT OR UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION validate_custom_permissions(); 