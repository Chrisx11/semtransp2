# Script SQL - Conversão para Maiúsculas

## Descrição
Este script converte todos os campos de texto de todas as tabelas do banco de dados para maiúsculas.

## ⚠️ AVISOS IMPORTANTES

1. **FAÇA BACKUP ANTES DE EXECUTAR!** Este script altera permanentemente os dados.
2. **Teste primeiro em um ambiente de desenvolvimento** se possível.
3. O script usa transação - se algo der errado, você pode usar `ROLLBACK;`

## Como Usar

### No Supabase (SQL Editor):

1. Acesse o painel do Supabase (https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `convert-to-uppercase.sql`
6. Clique em **Run** para executar

### Ou via linha de comando (psql):

```bash
psql -h seu-host -U seu-usuario -d seu-banco -f scripts/convert-to-uppercase.sql
```

## O que o script faz:

- Verifica se cada tabela existe antes de tentar atualizar
- Converte apenas campos que ainda não estão em maiúsculas (otimizado)
- Ignora campos NULL
- Atualiza campos `updated_at` automaticamente quando existem
- Mostra mensagens de progresso (NOTICE) para cada tabela processada

## Tabelas que serão atualizadas:

- ✅ produtos (descricao, categoria, unidade, localizacao)
- ✅ entradas (produtoDescricao, responsavelNome)
- ✅ saidas (produtoNome, categoria, responsavelNome, veiculoPlaca, veiculoModelo)
- ✅ veiculos (placa, modelo, marca, cor, secretaria, status)
- ✅ colaboradores (nome, funcao, secretaria)
- ✅ fornecedores (nome, endereco)
- ✅ lavadores (nome)
- ✅ ordens_servico (todos os campos de texto)
- ✅ tipos_pneu (marca, modelo, medida)
- ✅ manutencoes_antigas (titulo, pecas)
- ✅ observacoes_veiculo (observacao)
- ✅ categorias (nome)
- ✅ unidades (nome, sigla)
- ✅ localizacoes (nome, setor)
- ✅ trocas_oleo (tipo_servico, observacao)
- ✅ trocas_pneu (observacao)
- ✅ usuarios/users (se existirem)
- ✅ autorizacoes_borracharia (status, observacao)
- ✅ autorizacoes_lavador (status, observacao)
- ✅ notas (veiculo_descricao, status, observacoes)

## Se algo der errado:

Se houver algum erro durante a execução, o script irá:
1. Mostrar uma mensagem de erro
2. A transação será revertida automaticamente (ROLLBACK)
3. Nenhum dado será alterado

## Campos que NÃO serão alterados:

- IDs (UUIDs, etc.)
- Números (quantidades, valores, etc.)
- Datas
- Campos booleanos
- Campos JSON/JSONB (o conteúdo interno não é alterado)
- Campos que já estão em maiúsculas

## Observações:

- O script pode levar alguns minutos dependendo da quantidade de dados
- Campos que já estão em maiúsculas não serão atualizados (otimização)
- Se uma tabela não existir, ela será simplesmente ignorada

