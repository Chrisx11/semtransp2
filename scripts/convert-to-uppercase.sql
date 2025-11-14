-- ============================================================================
-- SCRIPT SQL PARA CONVERTER TODOS OS CAMPOS DE TEXTO PARA MAIÚSCULAS
-- ============================================================================
-- ATENÇÃO: Este script irá converter TODOS os dados de texto para MAIÚSCULAS
-- Execute com cuidado e faça backup antes de executar!
-- 
-- IMPORTANTE:
-- 1. Faça backup do banco de dados antes de executar
-- 2. Este script usa transação (BEGIN/COMMIT) - se algo der errado, use ROLLBACK
-- 3. O script só atualiza campos que ainda não estão em maiúsculas
-- 4. Campos NULL são ignorados
-- ============================================================================

BEGIN;

-- Script de conversão com tratamento de erros
DO $$
DECLARE
  v_sql TEXT;
  v_where_clause TEXT;
  v_set_clause TEXT;
  v_has_update BOOLEAN := FALSE;
BEGIN
  -- ==========================================================================
  -- TABELA: produtos
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produtos') THEN
    UPDATE produtos 
    SET 
      descricao = UPPER(descricao),
      categoria = UPPER(categoria),
      unidade = UPPER(unidade),
      localizacao = UPPER(localizacao),
      "updatedAt" = NOW()
    WHERE 
      (descricao IS NOT NULL AND descricao != UPPER(descricao))
      OR (categoria IS NOT NULL AND categoria != UPPER(categoria))
      OR (unidade IS NOT NULL AND unidade != UPPER(unidade))
      OR (localizacao IS NOT NULL AND localizacao != UPPER(localizacao));
    
    RAISE NOTICE 'Tabela produtos atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: entradas
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entradas') THEN
    UPDATE entradas 
    SET 
      "produtoDescricao" = UPPER("produtoDescricao"),
      "responsavelNome" = UPPER("responsavelNome")
    WHERE 
      ("produtoDescricao" IS NOT NULL AND "produtoDescricao" != UPPER("produtoDescricao"))
      OR ("responsavelNome" IS NOT NULL AND "responsavelNome" != UPPER("responsavelNome"));
    
    RAISE NOTICE 'Tabela entradas atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: saidas
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saidas') THEN
    UPDATE saidas 
    SET 
      "produtoNome" = UPPER("produtoNome"),
      categoria = UPPER(categoria),
      "responsavelNome" = UPPER("responsavelNome"),
      "veiculoPlaca" = UPPER("veiculoPlaca"),
      "veiculoModelo" = UPPER("veiculoModelo"),
      "updatedAt" = NOW()
    WHERE 
      ("produtoNome" IS NOT NULL AND "produtoNome" != UPPER("produtoNome"))
      OR (categoria IS NOT NULL AND categoria != UPPER(categoria))
      OR ("responsavelNome" IS NOT NULL AND "responsavelNome" != UPPER("responsavelNome"))
      OR ("veiculoPlaca" IS NOT NULL AND "veiculoPlaca" != UPPER("veiculoPlaca"))
      OR ("veiculoModelo" IS NOT NULL AND "veiculoModelo" != UPPER("veiculoModelo"));
    
    RAISE NOTICE 'Tabela saidas atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: veiculos
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'veiculos') THEN
    UPDATE veiculos 
    SET 
      placa = UPPER(placa),
      modelo = UPPER(modelo),
      marca = UPPER(marca),
      cor = UPPER(cor),
      secretaria = UPPER(secretaria),
      status = UPPER(status),
      "updatedAt" = NOW()
    WHERE 
      (placa IS NOT NULL AND placa != UPPER(placa))
      OR (modelo IS NOT NULL AND modelo != UPPER(modelo))
      OR (marca IS NOT NULL AND marca != UPPER(marca))
      OR (cor IS NOT NULL AND cor != UPPER(cor))
      OR (secretaria IS NOT NULL AND secretaria != UPPER(secretaria))
      OR (status IS NOT NULL AND status != UPPER(status));
    
    RAISE NOTICE 'Tabela veiculos atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: colaboradores
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'colaboradores') THEN
    UPDATE colaboradores 
    SET 
      nome = UPPER(nome),
      funcao = UPPER(funcao),
      secretaria = UPPER(secretaria),
      updated_at = NOW()
    WHERE 
      (nome IS NOT NULL AND nome != UPPER(nome))
      OR (funcao IS NOT NULL AND funcao != UPPER(funcao))
      OR (secretaria IS NOT NULL AND secretaria != UPPER(secretaria));
    
    RAISE NOTICE 'Tabela colaboradores atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: fornecedores
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fornecedores') THEN
    -- Verificar e atualizar apenas as colunas que existem
    v_set_clause := '';
    v_where_clause := '';
    v_has_update := FALSE;
    
    -- Nome
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'nome') THEN
      IF v_set_clause != '' THEN v_set_clause := v_set_clause || ', '; END IF;
      v_set_clause := v_set_clause || 'nome = UPPER(nome)';
      IF v_where_clause != '' THEN v_where_clause := v_where_clause || ' OR '; END IF;
      v_where_clause := v_where_clause || '(nome IS NOT NULL AND nome != UPPER(nome))';
      v_has_update := TRUE;
    END IF;
    
    -- Endereco (verificar se existe)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'endereco') THEN
      IF v_set_clause != '' THEN v_set_clause := v_set_clause || ', '; END IF;
      v_set_clause := v_set_clause || 'endereco = UPPER(endereco)';
      IF v_where_clause != '' THEN v_where_clause := v_where_clause || ' OR '; END IF;
      v_where_clause := v_where_clause || '(endereco IS NOT NULL AND endereco != UPPER(endereco))';
      v_has_update := TRUE;
    END IF;
    
    -- Updated_at (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fornecedores' AND column_name = 'updated_at') THEN
      IF v_set_clause != '' THEN v_set_clause := v_set_clause || ', '; END IF;
      v_set_clause := v_set_clause || 'updated_at = NOW()';
    END IF;
    
    IF v_has_update THEN
      v_sql := 'UPDATE fornecedores SET ' || v_set_clause || ' WHERE ' || v_where_clause;
      EXECUTE v_sql;
      RAISE NOTICE 'Tabela fornecedores atualizada';
    ELSE
      RAISE NOTICE 'Tabela fornecedores: nenhuma coluna de texto encontrada para atualizar';
    END IF;
  END IF;

  -- ==========================================================================
  -- TABELA: lavadores
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lavadores') THEN
    UPDATE lavadores 
    SET 
      nome = UPPER(nome),
      updated_at = NOW()
    WHERE 
      nome IS NOT NULL AND nome != UPPER(nome);
    
    RAISE NOTICE 'Tabela lavadores atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: ordens_servico
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ordens_servico') THEN
    UPDATE ordens_servico 
    SET 
      numero = UPPER(numero),
      "veiculoInfo" = UPPER("veiculoInfo"),
      "solicitanteInfo" = UPPER("solicitanteInfo"),
      "mecanicoInfo" = UPPER("mecanicoInfo"),
      prioridade = UPPER(prioridade),
      status = UPPER(status),
      "defeitosRelatados" = UPPER("defeitosRelatados"),
      "pecasServicos" = UPPER("pecasServicos"),
      "observacoesAlmoxarifado" = UPPER("observacoesAlmoxarifado"),
      "observacoesCompras" = UPPER("observacoesCompras"),
      "observacoesRetorno" = UPPER("observacoesRetorno"),
      "updatedAt" = NOW()
    WHERE 
      (numero IS NOT NULL AND numero != UPPER(numero))
      OR ("veiculoInfo" IS NOT NULL AND "veiculoInfo" != UPPER("veiculoInfo"))
      OR ("solicitanteInfo" IS NOT NULL AND "solicitanteInfo" != UPPER("solicitanteInfo"))
      OR ("mecanicoInfo" IS NOT NULL AND "mecanicoInfo" != UPPER("mecanicoInfo"))
      OR (prioridade IS NOT NULL AND prioridade != UPPER(prioridade))
      OR (status IS NOT NULL AND status != UPPER(status))
      OR ("defeitosRelatados" IS NOT NULL AND "defeitosRelatados" != UPPER("defeitosRelatados"))
      OR ("pecasServicos" IS NOT NULL AND "pecasServicos" != UPPER("pecasServicos"))
      OR ("observacoesAlmoxarifado" IS NOT NULL AND "observacoesAlmoxarifado" != UPPER("observacoesAlmoxarifado"))
      OR ("observacoesCompras" IS NOT NULL AND "observacoesCompras" != UPPER("observacoesCompras"))
      OR ("observacoesRetorno" IS NOT NULL AND "observacoesRetorno" != UPPER("observacoesRetorno"));
    
    RAISE NOTICE 'Tabela ordens_servico atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: tipos_pneu
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tipos_pneu') THEN
    UPDATE tipos_pneu 
    SET 
      marca = UPPER(marca),
      modelo = UPPER(modelo),
      medida = UPPER(medida)
    WHERE 
      (marca IS NOT NULL AND marca != UPPER(marca))
      OR (modelo IS NOT NULL AND modelo != UPPER(modelo))
      OR (medida IS NOT NULL AND medida != UPPER(medida));
    
    RAISE NOTICE 'Tabela tipos_pneu atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: manutencoes_antigas
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'manutencoes_antigas') THEN
    UPDATE manutencoes_antigas 
    SET 
      titulo = UPPER(titulo),
      pecas = UPPER(pecas)
    WHERE 
      (titulo IS NOT NULL AND titulo != UPPER(titulo))
      OR (pecas IS NOT NULL AND pecas != UPPER(pecas));
    
    RAISE NOTICE 'Tabela manutencoes_antigas atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: observacoes_veiculo
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'observacoes_veiculo') THEN
    UPDATE observacoes_veiculo 
    SET 
      observacao = UPPER(observacao)
    WHERE 
      observacao IS NOT NULL AND observacao != UPPER(observacao);
    
    RAISE NOTICE 'Tabela observacoes_veiculo atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: categorias
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categorias') THEN
    UPDATE categorias 
    SET 
      nome = UPPER(nome)
    WHERE 
      nome IS NOT NULL AND nome != UPPER(nome);
    
    RAISE NOTICE 'Tabela categorias atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: unidades
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unidades') THEN
    UPDATE unidades 
    SET 
      nome = UPPER(nome),
      sigla = UPPER(sigla)
    WHERE 
      (nome IS NOT NULL AND nome != UPPER(nome))
      OR (sigla IS NOT NULL AND sigla != UPPER(sigla));
    
    RAISE NOTICE 'Tabela unidades atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: localizacoes
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'localizacoes') THEN
    UPDATE localizacoes 
    SET 
      nome = UPPER(nome),
      setor = UPPER(setor)
    WHERE 
      (nome IS NOT NULL AND nome != UPPER(nome))
      OR (setor IS NOT NULL AND setor != UPPER(setor));
    
    RAISE NOTICE 'Tabela localizacoes atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: trocas_oleo (se existir)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trocas_oleo') THEN
    UPDATE trocas_oleo 
    SET 
      tipo_servico = UPPER(tipo_servico),
      observacao = UPPER(observacao)
    WHERE 
      (tipo_servico IS NOT NULL AND tipo_servico != UPPER(tipo_servico))
      OR (observacao IS NOT NULL AND observacao != UPPER(observacao));
    
    RAISE NOTICE 'Tabela trocas_oleo atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: trocas_pneu
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trocas_pneu') THEN
    UPDATE trocas_pneu 
    SET 
      observacao = UPPER(observacao),
      updated_at = NOW()
    WHERE 
      observacao IS NOT NULL AND observacao != UPPER(observacao);
    
    RAISE NOTICE 'Tabela trocas_pneu atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: usuarios (se existir)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios') THEN
    UPDATE usuarios 
    SET 
      nome = UPPER(nome),
      sobrenome = UPPER(sobrenome),
      login = UPPER(login),
      perfil = UPPER(perfil)
    WHERE 
      (nome IS NOT NULL AND nome != UPPER(nome))
      OR (sobrenome IS NOT NULL AND sobrenome != UPPER(sobrenome))
      OR (login IS NOT NULL AND login != UPPER(login))
      OR (perfil IS NOT NULL AND perfil != UPPER(perfil));
    
    RAISE NOTICE 'Tabela usuarios atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: users (se existir)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE users 
    SET 
      name = UPPER(name),
      username = UPPER(username),
      updated_at = NOW()
    WHERE 
      (name IS NOT NULL AND name != UPPER(name))
      OR (username IS NOT NULL AND username != UPPER(username));
    
    RAISE NOTICE 'Tabela users atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: autorizacoes_borracharia (se existir)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autorizacoes_borracharia') THEN
    UPDATE autorizacoes_borracharia 
    SET 
      status = UPPER(status),
      observacao = UPPER(observacao)
    WHERE 
      (status IS NOT NULL AND status != UPPER(status))
      OR (observacao IS NOT NULL AND observacao != UPPER(observacao));
    
    RAISE NOTICE 'Tabela autorizacoes_borracharia atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: autorizacoes_lavador (se existir)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autorizacoes_lavador') THEN
    UPDATE autorizacoes_lavador 
    SET 
      status = UPPER(status),
      observacao = UPPER(observacao)
    WHERE 
      (status IS NOT NULL AND status != UPPER(status))
      OR (observacao IS NOT NULL AND observacao != UPPER(observacao));
    
    RAISE NOTICE 'Tabela autorizacoes_lavador atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: notas (se existir)
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notas') THEN
    UPDATE notas 
    SET 
      veiculo_descricao = UPPER(veiculo_descricao),
      status = UPPER(status),
      observacoes = UPPER(observacoes),
      updated_at = NOW()
    WHERE 
      (veiculo_descricao IS NOT NULL AND veiculo_descricao != UPPER(veiculo_descricao))
      OR (status IS NOT NULL AND status != UPPER(status))
      OR (observacoes IS NOT NULL AND observacoes != UPPER(observacoes));
    
    RAISE NOTICE 'Tabela notas atualizada';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CONVERSÃO PARA MAIÚSCULAS CONCLUÍDA!';
  RAISE NOTICE 'Todas as tabelas foram processadas com sucesso.';
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
-- NOTA: Se algo der errado, você pode desfazer usando:
-- ROLLBACK;
-- ============================================================================

