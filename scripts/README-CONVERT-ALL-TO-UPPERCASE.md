# Script SQL - Conversão Completa para Maiúsculas

## Descrição
Este script converte **TODOS** os campos de texto de **TODAS** as tabelas do banco de dados para maiúsculas, baseado na estrutura completa do banco.

## ⚠️ AVISOS IMPORTANTES

1. **FAÇA BACKUP ANTES DE EXECUTAR!** Este script altera permanentemente os dados.
2. **Teste primeiro em um ambiente de desenvolvimento** se possível.
3. O script usa transação - se algo der errado, você pode usar `ROLLBACK;`
4. O script só atualiza campos que ainda não estão em maiúsculas (otimizado)

## Como Usar

### No Supabase (SQL Editor):

1. Acesse o painel do Supabase (https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `convert-all-to-uppercase.sql`
6. Clique em **Run** para executar

### Ou via linha de comando (psql):

```bash
psql -h seu-host -U seu-usuario -d seu-banco -f scripts/convert-all-to-uppercase.sql
```

## O que o script faz:

- Verifica se cada tabela existe antes de tentar atualizar
- Converte apenas campos de texto que ainda não estão em maiúsculas (otimizado)
- Ignora campos NULL
- Atualiza campos `updated_at` automaticamente quando existem
- Mostra mensagens de progresso (NOTICE) para cada tabela processada

## Tabelas que serão atualizadas:

- ✅ autorizacoes_borracharia (veiculo_placa, veiculo_modelo, veiculo_marca, veiculo_secretaria, autorizado_por_nome, solicitante_nome, observacoes)
  - NOTA: Campo 'status' não é convertido pois tem constraint CHECK
- ✅ autorizacoes_lavador (veiculo_placa, veiculo_modelo, veiculo_marca, veiculo_secretaria, autorizado_por_nome, solicitante_nome, observacoes)
  - NOTA: Campo 'status' não é convertido pois tem constraint CHECK
- ✅ categorias (nome)
- ✅ colaboradores (nome, funcao, secretaria)
- ✅ entradas (produtoDescricao, responsavelNome)
- ✅ filtros_registrados (categoria, produtodescricao, produtoDescricao)
- ✅ fornecedores (nome)
- ✅ lavadores (nome, endereco)
- ✅ localizacoes (nome, setor)
- ✅ manutencoes_antigas (titulo, pecas)
- ✅ mensagens_chat (conteudo)
- ✅ modules (name, description)
- ✅ observacoes_veiculo (observacao)
- ✅ ordens_servico (numero, data, prioridade, status, kmAtual, defeitosRelatados, pecasServicos, observacoesAlmoxarifado, observacoesCompras, observacoesRetorno, veiculoInfo, solicitanteInfo, mecanicoInfo, observacao2)
- ✅ os_tabs (name, description)
- ✅ produtos (descricao, categoria, unidade, localizacao)
- ✅ saidas (produtoNome, categoria, responsavelNome, veiculoPlaca, veiculoModelo, observacao)
- ✅ tipos_pneu (marca, modelo, medida)
- ✅ trocas_oleo (tipo_servico, observacao)
- ✅ trocas_pneu (observacao)
- ✅ unidades (nome, sigla)
- ✅ usuarios (nome, sobrenome, login, perfil)
- ✅ users (name, username)
- ✅ veiculos (placa, modelo, marca, cor, tipo, chassi, renavam, combustivel, medicao, status, secretaria)

## Campos que NÃO serão alterados (propositalmente):

- ✅ **IDs** (todos os campos com tipo uuid ou que contenham "id" no nome)
- ✅ **Números** (quantidades, valores, anos, km, etc.)
- ✅ **Datas** (date, timestamp)
- ✅ **Booleanos** (true/false)
- ✅ **JSONB** (historico, permissoes_customizadas)
- ✅ **Arrays** (produtosSimilares, veiculosCompativeis, posicoes)
- ✅ **Senhas** (password, senha)
- ✅ **Telefones** (telefone - preservado como está)
- ✅ **Campos com CHECK constraints** (status em autorizacoes_borracharia e autorizacoes_lavador)
  - Estes campos têm valores específicos definidos na constraint ('Pendente', 'Autorizado', etc.)
  - Converter para maiúsculas violaria a constraint do banco

## Se algo der errado:

Se houver algum erro durante a execução, o script irá:
1. Mostrar uma mensagem de erro
2. A transação será revertida automaticamente (ROLLBACK)
3. Nenhum dado será alterado

## Observações:

- O script pode levar alguns minutos dependendo da quantidade de dados
- Campos que já estão em maiúsculas não serão atualizados (otimização)
- Se uma tabela não existir, ela será simplesmente ignorada
- O script processa todas as tabelas em uma única transação para garantir consistência

## Diferenças do script anterior:

Este script é mais completo e inclui:
- Todas as tabelas do banco de dados
- Campos adicionais que podem ter sido criados recentemente
- Melhor tratamento de campos com nomes em camelCase (usando aspas duplas)

