-- ============================================================================
-- SCRIPT SQL PARA CONVERTER TODOS OS CAMPOS DE TEXTO PARA MAIÚSCULAS
-- Baseado na estrutura completa do banco de dados
-- ============================================================================
-- ATENÇÃO: Este script irá converter TODOS os dados de texto para MAIÚSCULAS
-- Execute com cuidado e faça backup antes de executar!
-- 
-- IMPORTANTE:
-- 1. Faça backup do banco de dados antes de executar
-- 2. Este script usa transação (BEGIN/COMMIT) - se algo der errado, use ROLLBACK
-- 3. O script só atualiza campos que ainda não estão em maiúsculas
-- 4. Campos NULL são ignorados
-- 5. IDs, números, datas, booleanos, JSONB e arrays NÃO são alterados
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
  -- TABELA: autorizacoes_borracharia
  -- NOTA: Campo 'status' não é convertido pois tem constraint CHECK com valores específicos
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autorizacoes_borracharia') THEN
    UPDATE autorizacoes_borracharia 
    SET 
      veiculo_placa = UPPER(veiculo_placa),
      veiculo_modelo = UPPER(veiculo_modelo),
      veiculo_marca = UPPER(veiculo_marca),
      veiculo_secretaria = UPPER(veiculo_secretaria),
      autorizado_por_nome = UPPER(autorizado_por_nome),
      solicitante_nome = UPPER(solicitante_nome),
      observacoes = UPPER(observacoes),
      updated_at = NOW()
    WHERE 
      (veiculo_placa IS NOT NULL AND veiculo_placa != UPPER(veiculo_placa))
      OR (veiculo_modelo IS NOT NULL AND veiculo_modelo != UPPER(veiculo_modelo))
      OR (veiculo_marca IS NOT NULL AND veiculo_marca != UPPER(veiculo_marca))
      OR (veiculo_secretaria IS NOT NULL AND veiculo_secretaria != UPPER(veiculo_secretaria))
      OR (autorizado_por_nome IS NOT NULL AND autorizado_por_nome != UPPER(autorizado_por_nome))
      OR (solicitante_nome IS NOT NULL AND solicitante_nome != UPPER(solicitante_nome))
      OR (observacoes IS NOT NULL AND observacoes != UPPER(observacoes));
    
    RAISE NOTICE 'Tabela autorizacoes_borracharia atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: autorizacoes_lavador
  -- NOTA: Campo 'status' não é convertido pois tem constraint CHECK com valores específicos
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'autorizacoes_lavador') THEN
    UPDATE autorizacoes_lavador 
    SET 
      veiculo_placa = UPPER(veiculo_placa),
      veiculo_modelo = UPPER(veiculo_modelo),
      veiculo_marca = UPPER(veiculo_marca),
      veiculo_secretaria = UPPER(veiculo_secretaria),
      autorizado_por_nome = UPPER(autorizado_por_nome),
      solicitante_nome = UPPER(solicitante_nome),
      observacoes = UPPER(observacoes),
      updated_at = NOW()
    WHERE 
      (veiculo_placa IS NOT NULL AND veiculo_placa != UPPER(veiculo_placa))
      OR (veiculo_modelo IS NOT NULL AND veiculo_modelo != UPPER(veiculo_modelo))
      OR (veiculo_marca IS NOT NULL AND veiculo_marca != UPPER(veiculo_marca))
      OR (veiculo_secretaria IS NOT NULL AND veiculo_secretaria != UPPER(veiculo_secretaria))
      OR (autorizado_por_nome IS NOT NULL AND autorizado_por_nome != UPPER(autorizado_por_nome))
      OR (solicitante_nome IS NOT NULL AND solicitante_nome != UPPER(solicitante_nome))
      OR (observacoes IS NOT NULL AND observacoes != UPPER(observacoes));
    
    RAISE NOTICE 'Tabela autorizacoes_lavador atualizada';
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
  -- TABELA: filtros_registrados
  -- NOTA: Campo 'categoria' não é convertido pois deve corresponder exatamente
  -- aos valores em FILTER_HEADERS no código (ex: "Filtro de Óleo", não "FILTRO DE ÓLEO")
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'filtros_registrados') THEN
    UPDATE filtros_registrados 
    SET 
      produtodescricao = UPPER(produtodescricao),
      "produtoDescricao" = UPPER("produtoDescricao")
    WHERE 
      (produtodescricao IS NOT NULL AND produtodescricao != UPPER(produtodescricao))
      OR ("produtoDescricao" IS NOT NULL AND "produtoDescricao" != UPPER("produtoDescricao"));
    
    RAISE NOTICE 'Tabela filtros_registrados atualizada (categoria preservada)';
  END IF;

  -- ==========================================================================
  -- TABELA: fornecedores
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fornecedores') THEN
    UPDATE fornecedores 
    SET 
      nome = UPPER(nome),
      updated_at = NOW()
    WHERE 
      nome IS NOT NULL AND nome != UPPER(nome);
    
    RAISE NOTICE 'Tabela fornecedores atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: lavadores
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lavadores') THEN
    UPDATE lavadores 
    SET 
      nome = UPPER(nome),
      endereco = UPPER(endereco),
      updated_at = NOW()
    WHERE 
      (nome IS NOT NULL AND nome != UPPER(nome))
      OR (endereco IS NOT NULL AND endereco != UPPER(endereco));
    
    RAISE NOTICE 'Tabela lavadores atualizada';
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
  -- TABELA: manutencoes_antigas
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'manutencoes_antigas') THEN
    UPDATE manutencoes_antigas 
    SET 
      titulo = UPPER(titulo),
      pecas = UPPER(pecas),
      updated_at = NOW()
    WHERE 
      (titulo IS NOT NULL AND titulo != UPPER(titulo))
      OR (pecas IS NOT NULL AND pecas != UPPER(pecas));
    
    RAISE NOTICE 'Tabela manutencoes_antigas atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: mensagens_chat
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mensagens_chat') THEN
    UPDATE mensagens_chat 
    SET 
      conteudo = UPPER(conteudo)
    WHERE 
      conteudo IS NOT NULL AND conteudo != UPPER(conteudo);
    
    RAISE NOTICE 'Tabela mensagens_chat atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: modules
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
    UPDATE modules 
    SET 
      name = UPPER(name),
      description = UPPER(description)
    WHERE 
      (name IS NOT NULL AND name != UPPER(name))
      OR (description IS NOT NULL AND description != UPPER(description));
    
    RAISE NOTICE 'Tabela modules atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: observacoes_veiculo
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'observacoes_veiculo') THEN
    UPDATE observacoes_veiculo 
    SET 
      observacao = UPPER(observacao),
      updated_at = NOW()
    WHERE 
      observacao IS NOT NULL AND observacao != UPPER(observacao);
    
    RAISE NOTICE 'Tabela observacoes_veiculo atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: ordens_servico
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ordens_servico') THEN
    UPDATE ordens_servico 
    SET 
      numero = UPPER(numero),
      data = UPPER(data),
      prioridade = UPPER(prioridade),
      status = UPPER(status),
      "kmAtual" = UPPER("kmAtual"),
      "defeitosRelatados" = UPPER("defeitosRelatados"),
      "pecasServicos" = UPPER("pecasServicos"),
      "observacoesAlmoxarifado" = UPPER("observacoesAlmoxarifado"),
      "observacoesCompras" = UPPER("observacoesCompras"),
      "observacoesRetorno" = UPPER("observacoesRetorno"),
      "veiculoInfo" = UPPER("veiculoInfo"),
      "solicitanteInfo" = UPPER("solicitanteInfo"),
      "mecanicoInfo" = UPPER("mecanicoInfo"),
      "observacao2" = UPPER("observacao2"),
      "updatedAt" = NOW()
    WHERE 
      (numero IS NOT NULL AND numero != UPPER(numero))
      OR (data IS NOT NULL AND data != UPPER(data))
      OR (prioridade IS NOT NULL AND prioridade != UPPER(prioridade))
      OR (status IS NOT NULL AND status != UPPER(status))
      OR ("kmAtual" IS NOT NULL AND "kmAtual" != UPPER("kmAtual"))
      OR ("defeitosRelatados" IS NOT NULL AND "defeitosRelatados" != UPPER("defeitosRelatados"))
      OR ("pecasServicos" IS NOT NULL AND "pecasServicos" != UPPER("pecasServicos"))
      OR ("observacoesAlmoxarifado" IS NOT NULL AND "observacoesAlmoxarifado" != UPPER("observacoesAlmoxarifado"))
      OR ("observacoesCompras" IS NOT NULL AND "observacoesCompras" != UPPER("observacoesCompras"))
      OR ("observacoesRetorno" IS NOT NULL AND "observacoesRetorno" != UPPER("observacoesRetorno"))
      OR ("veiculoInfo" IS NOT NULL AND "veiculoInfo" != UPPER("veiculoInfo"))
      OR ("solicitanteInfo" IS NOT NULL AND "solicitanteInfo" != UPPER("solicitanteInfo"))
      OR ("mecanicoInfo" IS NOT NULL AND "mecanicoInfo" != UPPER("mecanicoInfo"))
      OR ("observacao2" IS NOT NULL AND "observacao2" != UPPER("observacao2"));
    
    RAISE NOTICE 'Tabela ordens_servico atualizada';
  END IF;

  -- ==========================================================================
  -- TABELA: os_tabs
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'os_tabs') THEN
    UPDATE os_tabs 
    SET 
      name = UPPER(name),
      description = UPPER(description)
    WHERE 
      (name IS NOT NULL AND name != UPPER(name))
      OR (description IS NOT NULL AND description != UPPER(description));
    
    RAISE NOTICE 'Tabela os_tabs atualizada';
  END IF;

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
      observacao = UPPER(observacao),
      "updatedAt" = NOW()
    WHERE 
      ("produtoNome" IS NOT NULL AND "produtoNome" != UPPER("produtoNome"))
      OR (categoria IS NOT NULL AND categoria != UPPER(categoria))
      OR ("responsavelNome" IS NOT NULL AND "responsavelNome" != UPPER("responsavelNome"))
      OR ("veiculoPlaca" IS NOT NULL AND "veiculoPlaca" != UPPER("veiculoPlaca"))
      OR ("veiculoModelo" IS NOT NULL AND "veiculoModelo" != UPPER("veiculoModelo"))
      OR (observacao IS NOT NULL AND observacao != UPPER(observacao));
    
    RAISE NOTICE 'Tabela saidas atualizada';
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
  -- TABELA: trocas_oleo
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trocas_oleo') THEN
    UPDATE trocas_oleo 
    SET 
      tipo_servico = UPPER(tipo_servico),
      observacao = UPPER(observacao),
      updated_at = NOW()
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
  -- TABELA: usuarios
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
  -- TABELA: users
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
  -- TABELA: veiculos
  -- ==========================================================================
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'veiculos') THEN
    UPDATE veiculos 
    SET 
      placa = UPPER(placa),
      modelo = UPPER(modelo),
      marca = UPPER(marca),
      cor = UPPER(cor),
      tipo = UPPER(tipo),
      chassi = UPPER(chassi),
      renavam = UPPER(renavam),
      combustivel = UPPER(combustivel),
      medicao = UPPER(medicao),
      status = UPPER(status),
      secretaria = UPPER(secretaria),
      "updatedAt" = NOW()
    WHERE 
      (placa IS NOT NULL AND placa != UPPER(placa))
      OR (modelo IS NOT NULL AND modelo != UPPER(modelo))
      OR (marca IS NOT NULL AND marca != UPPER(marca))
      OR (cor IS NOT NULL AND cor != UPPER(cor))
      OR (tipo IS NOT NULL AND tipo != UPPER(tipo))
      OR (chassi IS NOT NULL AND chassi != UPPER(chassi))
      OR (renavam IS NOT NULL AND renavam != UPPER(renavam))
      OR (combustivel IS NOT NULL AND combustivel != UPPER(combustivel))
      OR (medicao IS NOT NULL AND medicao != UPPER(medicao))
      OR (status IS NOT NULL AND status != UPPER(status))
      OR (secretaria IS NOT NULL AND secretaria != UPPER(secretaria));
    
    RAISE NOTICE 'Tabela veiculos atualizada';
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
-- 
-- CAMPOS QUE NÃO FORAM ALTERADOS (propositalmente):
-- - Todos os IDs (uuid, character varying com "id" no nome)
-- - Campos numéricos (integer, numeric)
-- - Campos de data (date, timestamp)
-- - Campos booleanos
-- - Campos JSONB (historico, permissoes_customizadas)
-- - Campos ARRAY (produtosSimilares, veiculosCompativeis, posicoes)
-- - Campos de senha (password, senha)
-- - Campos de telefone (telefone)
-- - Campos com CHECK constraints (status em autorizacoes_borracharia e autorizacoes_lavador)
--   Estes campos têm valores específicos definidos na constraint e não podem ser convertidos
-- ============================================================================

