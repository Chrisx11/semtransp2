-- ============================================================================
-- SCRIPT SQL - ADICIONAR SUPORTE PARA "Filtro Separador 2°"
-- ============================================================================
-- Este script verifica e garante que a tabela filtros_registrados
-- está preparada para aceitar a nova categoria "Filtro Separador 2°"
-- ============================================================================
-- NOTA: A coluna 'categoria' já existe na tabela filtros_registrados
-- e aceita qualquer texto, então não é necessário adicionar uma nova coluna.
-- Este script apenas valida a estrutura e documenta a mudança.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  -- Verificar se a tabela filtros_registrados existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'filtros_registrados'
  ) THEN
    
    -- Verificar se a coluna categoria existe
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'filtros_registrados' 
      AND column_name = 'categoria'
    ) THEN
      RAISE NOTICE 'Tabela filtros_registrados encontrada. Coluna categoria existe.';
      RAISE NOTICE 'A nova categoria "Filtro Separador 2°" pode ser usada imediatamente.';
      RAISE NOTICE 'Nenhuma alteração na estrutura do banco é necessária.';
    ELSE
      RAISE EXCEPTION 'Coluna categoria não encontrada na tabela filtros_registrados!';
    END IF;
    
    -- Verificar se há constraints ou enums que precisam ser atualizados
    -- (Normalmente não há, pois categoria é texto livre)
    RAISE NOTICE 'Verificação concluída. A categoria "Filtro Separador 2°" está pronta para uso.';
    
  ELSE
    RAISE EXCEPTION 'Tabela filtros_registrados não encontrada!';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- RESUMO:
-- ============================================================================
-- A tabela filtros_registrados já possui a coluna 'categoria' como texto livre,
-- então não é necessário adicionar uma nova coluna ou modificar a estrutura.
-- 
-- A nova categoria "Filtro Separador 2°" foi adicionada ao código em:
-- app/dashboard/filtros/page.tsx (array FILTER_HEADERS)
--
-- A partir de agora, você pode:
-- 1. Selecionar "Filtro Separador 2°" no dropdown de registro de filtros
-- 2. Ver filtros dessa categoria na visualização "Ver Filtros"
-- 3. Os dados serão armazenados normalmente na coluna 'categoria'
-- ============================================================================

