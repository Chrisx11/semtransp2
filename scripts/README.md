# Scripts para Configuração do Banco de Dados

Este diretório contém scripts SQL que devem ser executados para configurar ou atualizar o banco de dados do sistema.

## Scripts disponíveis

### `add-planejamento-module.sql`
Este script adiciona o módulo "planejamento" ao banco de dados, necessário para que as permissões da página de planejamento funcionem corretamente.

### `add-troca-pneu-module.sql`
Este script adiciona o módulo "trocaPneu" ao banco de dados, necessário para que as permissões da nova página de troca de pneus funcionem corretamente.

### `setup-troca-pneu-tables.sql`
Este script configura o banco de dados para o sistema de troca de pneus. Ele cria as tabelas `tipos_pneu` e `trocas_pneu`, além de funções, triggers e índices necessários para o funcionamento do sistema. Também inclui dados de demonstração com alguns tipos de pneus pré-cadastrados.

### `update-troca-pneu-tables.sql`
Este script atualiza as tabelas do sistema de troca de pneus caso elas já existam. Ele é útil para adicionar novas colunas, índices ou triggers que foram incluídos em versões mais recentes do sistema. Use este script se você já tinha criado as tabelas manualmente ou está atualizando um sistema existente.

### `add-alinhamento-balanceamento-columns.sql`
Este script adiciona as colunas `alinhamento` e `balanceamento` à tabela `trocas_pneu`. Estas colunas permitem registrar se foram realizados serviços de alinhamento e balanceamento durante a troca de pneus. O script verifica se as colunas já existem antes de adicioná-las e atualiza os registros existentes para definir valores padrão.

### `create-ordem-servico-table.sql`
Este script cria a tabela `ordens_servico` no banco de dados, com todos os campos necessários para o funcionamento do módulo de planejamento de ordens de serviço. Execute este script se estiver tendo problemas com a página de planejamento devido à ausência da tabela.

## Como executar os scripts

### Usando o Supabase UI

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard/)
2. Selecione seu projeto
3. Vá para "SQL Editor" no menu lateral
4. Crie um novo script (New Query)
5. Cole o conteúdo do script SQL desejado
6. Clique em "Run" para executar o script

### Usando o Supabase CLI (Linha de Comando)

Se você tem o Supabase CLI instalado, você pode executar:

```bash
# Conectar ao seu projeto Supabase (execute apenas uma vez)
npx supabase link --project-ref [seu-project-ref]

# Executar o script SQL
npx supabase db execute -f scripts/[nome-do-script].sql
```

## Verificação e Diagnóstico

Para verificar se seu banco de dados está configurado corretamente, acesse a página:

```
/dashboard/supabase-diagnostico
```

Esta página mostrará o status de conexão com o Supabase e verificará se todas as tabelas necessárias estão criadas corretamente.

## Após executar os scripts

Depois de adicionar novos módulos como "planejamento" ou "trocaPneu" ao banco de dados, você precisa:

1. Acesse a página de "Configurações" do sistema
2. Na aba "Permissões", selecione um usuário
3. Ative a permissão para os módulos correspondentes para os usuários que devem ter acesso a estas funcionalidades

Isso permitirá que os usuários selecionados visualizem e utilizem as novas páginas de planejamento e troca de pneus no sistema. 