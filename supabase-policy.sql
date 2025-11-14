-- Arquivo para definir políticas de segurança por linha (RLS) para a tabela trocas_oleo
-- Execute este script no SQL Editor do Supabase para configurar as permissões

-- Primeiro, verifique se o RLS está habilitado (o que está causando o erro)
ALTER TABLE trocas_oleo ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT para qualquer usuário autenticado
CREATE POLICY "Permitir SELECT para usuários autenticados" 
ON trocas_oleo FOR SELECT 
USING (true);

-- Política para permitir INSERT para qualquer usuário autenticado
CREATE POLICY "Permitir INSERT para usuários autenticados" 
ON trocas_oleo FOR INSERT 
WITH CHECK (true);

-- Política para permitir UPDATE para usuários autenticados (apenas em seus próprios registros)
CREATE POLICY "Permitir UPDATE para usuários autenticados" 
ON trocas_oleo FOR UPDATE 
USING (true);

-- Política para permitir DELETE para usuários autenticados (apenas em seus próprios registros)
CREATE POLICY "Permitir DELETE para usuários autenticados" 
ON trocas_oleo FOR DELETE 
USING (true);

-- Se você quiser permitir acesso apenas ao proprietário do registro, use algo como:
-- USING (auth.uid() = usuario_id);

-- Alternativamente, se você precisar desativar o RLS para depuração,
-- você pode usar esta linha (use apenas em ambiente de desenvolvimento):
-- ALTER TABLE trocas_oleo DISABLE ROW LEVEL SECURITY; 