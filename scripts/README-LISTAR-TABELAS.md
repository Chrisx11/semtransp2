# Script SQL - Listar Todas as Tabelas e Colunas

## Descrição
Este script SQL lista todas as tabelas e suas colunas do banco de dados Supabase, fornecendo informações detalhadas sobre a estrutura do banco.

## Como Usar

### No Supabase (SQL Editor):

1. Acesse o painel do Supabase (https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `listar-todas-tabelas-colunas.sql`
6. Execute a consulta desejada (comente as outras se necessário)
7. Clique em **Run** para executar

## Opções de Consulta Disponíveis

O script contém 4 opções diferentes de consulta:

### Opção 1: Lista Detalhada (Recomendada)
Mostra todas as tabelas e colunas com informações completas:
- Nome da tabela
- Nome da coluna
- Tipo de dados
- Tamanho máximo (quando aplicável)
- Se permite NULL
- Valor padrão
- Ordem da coluna

**Use quando:** Quiser ver a estrutura completa do banco de forma organizada.

### Opção 2: Lista Agrupada por Tabela
Mostra cada tabela com todas suas colunas em uma única linha, formatadas de forma compacta.

**Use quando:** Quiser uma visão rápida e compacta de todas as tabelas.

### Opção 3: Lista Apenas Nomes das Tabelas
Lista apenas os nomes de todas as tabelas do banco.

**Use quando:** Quiser apenas saber quais tabelas existem no banco.

### Opção 4: Lista com Chaves Primárias e Estrangeiras
Similar à Opção 1, mas inclui informações sobre quais colunas são chaves primárias (PK) ou estrangeiras (FK).

**Use quando:** Quiser entender as relações entre as tabelas.

## Exemplo de Resultado

A Opção 1 retornará algo como:

```
Tabela          | Coluna        | Tipo de Dados | Tamanho | Permite NULL | Valor Padrão
----------------|---------------|---------------|---------|--------------|-------------
produtos        | id            | uuid           | NULL    | Não          | gen_random_uuid()
produtos        | descricao     | character varying | 255  | Não          | NULL
produtos        | created_at    | timestamp with time zone | NULL | Não | now()
...
```

## Observações

- Todas as consultas filtram apenas tabelas do schema `public`
- Tabelas do sistema são automaticamente excluídas
- As consultas são apenas de leitura (SELECT), não alteram nenhum dado
- Você pode executar múltiplas consultas ao mesmo tempo, mas é recomendado executar uma por vez para melhor visualização

## Dicas

- Para ver apenas uma tabela específica, adicione `AND table_name = 'nome_da_tabela'` na cláusula WHERE
- Para exportar os resultados, use o botão de exportação do SQL Editor do Supabase
- Você pode salvar consultas favoritas no Supabase para acesso rápido

