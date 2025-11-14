-- ============================================================================
-- SCRIPT SQL PARA REVERTER CONVERSÃO PARA MAIÚSCULAS
-- ============================================================================
-- ⚠️ ATENÇÃO CRÍTICA: Este script tenta reverter as mudanças, mas:
-- 1. NÃO pode restaurar dados que foram perdidos
-- 2. Só funciona se os dados ainda existirem no banco
-- 3. É MELHOR usar backup/restore do Supabase se disponível
-- ============================================================================
-- 
-- IMPORTANTE:
-- 1. Faça backup ANTES de executar este script
-- 2. Verifique se o Supabase tem Point-in-Time Recovery disponível
-- 3. Este script tenta converter de volta para formato original (primeira letra maiúscula)
-- 4. Alguns dados podem não ser restaurados perfeitamente
-- ============================================================================

BEGIN;

-- Script de reversão com tratamento de erros
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INICIANDO REVERSÃO DE CONVERSÃO PARA MAIÚSCULAS';
  RAISE NOTICE 'Este processo pode levar alguns minutos...';
  RAISE NOTICE '========================================';

  -- ==========================================================================
  -- TABELA: autorizacoes_borracharia
  -- Reverter campos de texto para formato original (primeira letra maiúscula)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autorizacoes_borracharia') THEN
    -- Função para capitalizar primeira letra de cada palavra
    UPDATE autorizacoes_borracharia 
    SET 
      veiculo_placa = INITCAP(veiculo_placa),
      veiculo_modelo = INITCAP(veiculo_modelo),
      veiculo_marca = INITCAP(veiculo_marca),
      veiculo_secretaria = INITCAP(veiculo_secretaria),
      autorizado_por_nome = INITCAP(autorizado_por_nome),
      solicitante_nome = INITCAP(solicitante_nome),
      observacoes = INITCAP(observacoes),
      updated_at = NOW()
    WHERE 
      veiculo_placa IS NOT NULL 
      OR veiculo_modelo IS NOT NULL 
      OR veiculo_marca IS NOT NULL 
      OR veiculo_secretaria IS NOT NULL 
      OR autorizado_por_nome IS NOT NULL 
      OR solicitante_nome IS NOT NULL 
      OR observacoes IS NOT NULL;
    
    RAISE NOTICE 'Tabela autorizacoes_borracharia revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: autorizacoes_lavador
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autorizacoes_lavador') THEN
    UPDATE autorizacoes_lavador 
    SET 
      veiculo_placa = INITCAP(veiculo_placa),
      veiculo_modelo = INITCAP(veiculo_modelo),
      veiculo_marca = INITCAP(veiculo_marca),
      veiculo_secretaria = INITCAP(veiculo_secretaria),
      autorizado_por_nome = INITCAP(autorizado_por_nome),
      solicitante_nome = INITCAP(solicitante_nome),
      observacoes = INITCAP(observacoes),
      updated_at = NOW()
    WHERE 
      veiculo_placa IS NOT NULL 
      OR veiculo_modelo IS NOT NULL 
      OR veiculo_marca IS NOT NULL 
      OR veiculo_secretaria IS NOT NULL 
      OR autorizado_por_nome IS NOT NULL 
      OR solicitante_nome IS NOT NULL 
      OR observacoes IS NOT NULL;
    
    RAISE NOTICE 'Tabela autorizacoes_lavador revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: categorias
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categorias') THEN
    UPDATE categorias 
    SET nome = INITCAP(nome)
    WHERE nome IS NOT NULL;
    
    RAISE NOTICE 'Tabela categorias revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: colaboradores
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colaboradores') THEN
    UPDATE colaboradores 
    SET 
      nome = INITCAP(nome),
      funcao = INITCAP(funcao),
      secretaria = INITCAP(secretaria),
      updated_at = NOW()
    WHERE 
      nome IS NOT NULL 
      OR funcao IS NOT NULL 
      OR secretaria IS NOT NULL;
    
    RAISE NOTICE 'Tabela colaboradores revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: entradas
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entradas') THEN
    UPDATE entradas 
    SET 
      "produtoDescricao" = INITCAP("produtoDescricao"),
      "responsavelNome" = INITCAP("responsavelNome")
    WHERE 
      "produtoDescricao" IS NOT NULL 
      OR "responsavelNome" IS NOT NULL;
    
    RAISE NOTICE 'Tabela entradas revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: filtros_registrados
  -- Reverter categorias para formato exato dos FILTER_HEADERS
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'filtros_registrados') THEN
    -- Reverter categorias específicas para formato exato
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Óleo'
    WHERE UPPER(categoria) = 'FILTRO DE ÓLEO';
    
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Comb.'
    WHERE UPPER(categoria) = 'FILTRO DE COMB.';
    
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Ar'
    WHERE UPPER(categoria) = 'FILTRO DE AR';
    
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Cabine'
    WHERE UPPER(categoria) = 'FILTRO DE CABINE';
    
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Ar 1°'
    WHERE UPPER(categoria) = 'FILTRO DE AR 1°';
    
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Ar 2°'
    WHERE UPPER(categoria) = 'FILTRO DE AR 2°';
    
    UPDATE filtros_registrados 
    SET categoria = 'Filtro Separador'
    WHERE UPPER(categoria) = 'FILTRO SEPARADOR';
    
    UPDATE filtros_registrados 
    SET categoria = 'Desumidificador'
    WHERE UPPER(categoria) = 'DESUMIDIFICADOR';
    
    UPDATE filtros_registrados 
    SET categoria = 'Filtro de Transmissão'
    WHERE UPPER(categoria) = 'FILTRO DE TRANSMISSÃO';
    
    -- Reverter descrições de produtos
    UPDATE filtros_registrados 
    SET 
      produtodescricao = INITCAP(produtodescricao),
      "produtoDescricao" = INITCAP("produtoDescricao")
    WHERE 
      produtodescricao IS NOT NULL 
      OR "produtoDescricao" IS NOT NULL;
    
    RAISE NOTICE 'Tabela filtros_registrados revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: fornecedores
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fornecedores') THEN
    UPDATE fornecedores 
    SET 
      nome = INITCAP(nome),
      updated_at = NOW()
    WHERE nome IS NOT NULL;
    
    RAISE NOTICE 'Tabela fornecedores revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: lavadores
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lavadores') THEN
    UPDATE lavadores 
    SET 
      nome = INITCAP(nome),
      endereco = INITCAP(endereco),
      updated_at = NOW()
    WHERE 
      nome IS NOT NULL 
      OR endereco IS NOT NULL;
    
    RAISE NOTICE 'Tabela lavadores revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: localizacoes
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'localizacoes') THEN
    UPDATE localizacoes 
    SET 
      nome = INITCAP(nome),
      setor = INITCAP(setor)
    WHERE 
      nome IS NOT NULL 
      OR setor IS NOT NULL;
    
    RAISE NOTICE 'Tabela localizacoes revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: manutencoes_antigas
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'manutencoes_antigas') THEN
    UPDATE manutencoes_antigas 
    SET 
      titulo = INITCAP(titulo),
      pecas = INITCAP(pecas),
      updated_at = NOW()
    WHERE 
      titulo IS NOT NULL 
      OR pecas IS NOT NULL;
    
    RAISE NOTICE 'Tabela manutencoes_antigas revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: mensagens_chat
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mensagens_chat') THEN
    UPDATE mensagens_chat 
    SET conteudo = INITCAP(conteudo)
    WHERE conteudo IS NOT NULL;
    
    RAISE NOTICE 'Tabela mensagens_chat revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: modules
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
    UPDATE modules 
    SET 
      name = INITCAP(name),
      description = INITCAP(description)
    WHERE 
      name IS NOT NULL 
      OR description IS NOT NULL;
    
    RAISE NOTICE 'Tabela modules revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: observacoes_veiculo
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'observacoes_veiculo') THEN
    UPDATE observacoes_veiculo 
    SET 
      observacao = INITCAP(observacao),
      updated_at = NOW()
    WHERE observacao IS NOT NULL;
    
    RAISE NOTICE 'Tabela observacoes_veiculo revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: ordens_servico
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ordens_servico') THEN
    UPDATE ordens_servico 
    SET 
      numero = INITCAP(numero),
      "veiculoInfo" = INITCAP("veiculoInfo"),
      "solicitanteInfo" = INITCAP("solicitanteInfo"),
      "mecanicoInfo" = INITCAP("mecanicoInfo"),
      prioridade = INITCAP(prioridade),
      status = INITCAP(status),
      "kmAtual" = INITCAP("kmAtual"),
      "defeitosRelatados" = INITCAP("defeitosRelatados"),
      "pecasServicos" = INITCAP("pecasServicos"),
      "observacoesAlmoxarifado" = INITCAP("observacoesAlmoxarifado"),
      "observacoesCompras" = INITCAP("observacoesCompras"),
      "observacoesRetorno" = INITCAP("observacoesRetorno"),
      "observacao2" = INITCAP("observacao2"),
      "updatedAt" = NOW()
    WHERE 
      numero IS NOT NULL 
      OR "veiculoInfo" IS NOT NULL 
      OR "solicitanteInfo" IS NOT NULL 
      OR "mecanicoInfo" IS NOT NULL 
      OR prioridade IS NOT NULL 
      OR status IS NOT NULL 
      OR "kmAtual" IS NOT NULL 
      OR "defeitosRelatados" IS NOT NULL 
      OR "pecasServicos" IS NOT NULL 
      OR "observacoesAlmoxarifado" IS NOT NULL 
      OR "observacoesCompras" IS NOT NULL 
      OR "observacoesRetorno" IS NOT NULL 
      OR "observacao2" IS NOT NULL;
    
    RAISE NOTICE 'Tabela ordens_servico revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: os_tabs
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'os_tabs') THEN
    UPDATE os_tabs 
    SET 
      name = INITCAP(name),
      description = INITCAP(description)
    WHERE 
      name IS NOT NULL 
      OR description IS NOT NULL;
    
    RAISE NOTICE 'Tabela os_tabs revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: produtos
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produtos') THEN
    UPDATE produtos 
    SET 
      descricao = INITCAP(descricao),
      categoria = INITCAP(categoria),
      unidade = INITCAP(unidade),
      localizacao = INITCAP(localizacao),
      "updatedAt" = NOW()
    WHERE 
      descricao IS NOT NULL 
      OR categoria IS NOT NULL 
      OR unidade IS NOT NULL 
      OR localizacao IS NOT NULL;
    
    RAISE NOTICE 'Tabela produtos revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: saidas
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saidas') THEN
    UPDATE saidas 
    SET 
      "produtoNome" = INITCAP("produtoNome"),
      categoria = INITCAP(categoria),
      "responsavelNome" = INITCAP("responsavelNome"),
      "veiculoPlaca" = INITCAP("veiculoPlaca"),
      "veiculoModelo" = INITCAP("veiculoModelo"),
      observacao = INITCAP(observacao),
      "updatedAt" = NOW()
    WHERE 
      "produtoNome" IS NOT NULL 
      OR categoria IS NOT NULL 
      OR "responsavelNome" IS NOT NULL 
      OR "veiculoPlaca" IS NOT NULL 
      OR "veiculoModelo" IS NOT NULL 
      OR observacao IS NOT NULL;
    
    RAISE NOTICE 'Tabela saidas revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: tipos_pneu
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tipos_pneu') THEN
    UPDATE tipos_pneu 
    SET 
      marca = INITCAP(marca),
      modelo = INITCAP(modelo),
      medida = INITCAP(medida)
    WHERE 
      marca IS NOT NULL 
      OR modelo IS NOT NULL 
      OR medida IS NOT NULL;
    
    RAISE NOTICE 'Tabela tipos_pneu revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: trocas_oleo
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trocas_oleo') THEN
    UPDATE trocas_oleo 
    SET 
      tipo_servico = INITCAP(tipo_servico),
      observacao = INITCAP(observacao),
      updated_at = NOW()
    WHERE 
      tipo_servico IS NOT NULL 
      OR observacao IS NOT NULL;
    
    RAISE NOTICE 'Tabela trocas_oleo revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: trocas_pneu
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trocas_pneu') THEN
    UPDATE trocas_pneu 
    SET 
      observacao = INITCAP(observacao),
      updated_at = NOW()
    WHERE observacao IS NOT NULL;
    
    RAISE NOTICE 'Tabela trocas_pneu revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: unidades
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unidades') THEN
    UPDATE unidades 
    SET 
      nome = INITCAP(nome),
      sigla = INITCAP(sigla)
    WHERE 
      nome IS NOT NULL 
      OR sigla IS NOT NULL;
    
    RAISE NOTICE 'Tabela unidades revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: usuarios
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios') THEN
    UPDATE usuarios 
    SET 
      nome = INITCAP(nome),
      sobrenome = INITCAP(sobrenome),
      login = INITCAP(login),
      perfil = INITCAP(perfil)
    WHERE 
      nome IS NOT NULL 
      OR sobrenome IS NOT NULL 
      OR login IS NOT NULL 
      OR perfil IS NOT NULL;
    
    RAISE NOTICE 'Tabela usuarios revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: users
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE users 
    SET 
      name = INITCAP(name),
      username = INITCAP(username),
      updated_at = NOW()
    WHERE 
      name IS NOT NULL 
      OR username IS NOT NULL;
    
    RAISE NOTICE 'Tabela users revertida';
  END IF;

  -- ==========================================================================
  -- TABELA: veiculos
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'veiculos') THEN
    UPDATE veiculos 
    SET 
      placa = UPPER(placa), -- Placas devem ficar em maiúsculas
      modelo = INITCAP(modelo),
      marca = INITCAP(marca),
      cor = INITCAP(cor),
      tipo = INITCAP(tipo),
      chassi = UPPER(chassi), -- Chassi deve ficar em maiúsculas
      renavam = UPPER(renavam), -- RENAVAM deve ficar em maiúsculas
      combustivel = INITCAP(combustivel),
      medicao = INITCAP(medicao),
      status = INITCAP(status),
      secretaria = INITCAP(secretaria),
      "updatedAt" = NOW()
    WHERE 
      placa IS NOT NULL 
      OR modelo IS NOT NULL 
      OR marca IS NOT NULL 
      OR cor IS NOT NULL 
      OR tipo IS NOT NULL 
      OR chassi IS NOT NULL 
      OR renavam IS NOT NULL 
      OR combustivel IS NOT NULL 
      OR medicao IS NOT NULL 
      OR status IS NOT NULL 
      OR secretaria IS NOT NULL;
    
    RAISE NOTICE 'Tabela veiculos revertida';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'REVERSÃO CONCLUÍDA!';
  RAISE NOTICE 'Verifique os dados para confirmar se estão corretos.';
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERRO: %', SQLERRM;
    RAISE NOTICE 'Executando ROLLBACK devido ao erro...';
    RAISE;
END $$;

-- Confirmar a transação
COMMIT;

-- ============================================================================
-- ⚠️ IMPORTANTE: 
-- Este script usa INITCAP que capitaliza a primeira letra de cada palavra.
-- Isso pode não ser 100% preciso para todos os casos.
-- 
-- SE OS DADOS REALMENTE SUMIRAM (não apenas não aparecem):
-- 1. Verifique se há backup no Supabase (Point-in-Time Recovery)
-- 2. Acesse: Settings > Database > Backups no painel do Supabase
-- 3. Restaure para um ponto antes da execução do script de maiúsculas
-- ============================================================================

