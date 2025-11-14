-- ============================================================================
-- SCRIPT PARA VERIFICAR USUÁRIOS E USERNAMES
-- ============================================================================
-- Este script mostra os usernames na tabela users para verificar o formato
-- ============================================================================

-- Verificar contagem total
SELECT 
  'Total de usuários' AS tipo,
  COUNT(*) AS quantidade
FROM users;

-- Verificar todos os usernames e seus formatos
SELECT 
  id,
  name,
  username,
  active,
  CASE 
    WHEN username = UPPER(username) THEN 'MAIÚSCULAS'
    WHEN username = LOWER(username) THEN 'minúsculas'
    WHEN username = INITCAP(username) THEN 'Primeira Maiúscula'
    ELSE 'Misto'
  END AS formato_username
FROM users
ORDER BY username;

-- Verificar se há usernames em maiúsculas
SELECT 
  'Usernames em maiúsculas' AS tipo,
  COUNT(CASE WHEN username = UPPER(username) THEN 1 END) AS em_maiusculas,
  COUNT(CASE WHEN username != UPPER(username) THEN 1 END) AS nao_maiusculas,
  COUNT(*) AS total
FROM users
WHERE username IS NOT NULL;

-- Mostrar exemplos
SELECT 
  id,
  name,
  username,
  active
FROM users
LIMIT 10;

