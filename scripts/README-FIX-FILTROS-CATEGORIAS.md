# Script SQL - Correção de Categorias em filtros_registrados

## Descrição
Este script corrige as categorias na tabela `filtros_registrados` que foram convertidas para maiúsculas pelo script de conversão, mas que devem manter o formato original (primeira letra maiúscula) para corresponder aos valores em `FILTER_HEADERS` no código.

## ⚠️ Problema Identificado

Após executar o script `convert-all-to-uppercase.sql`, as categorias na tabela `filtros_registrados` foram convertidas para maiúsculas (ex: "FILTRO DE ÓLEO"), mas o código em `app/dashboard/filtros/page.tsx` compara essas categorias exatamente com valores fixos como "Filtro de Óleo" (primeira letra maiúscula).

Isso causou o desaparecimento dos registros na página de filtros porque a comparação `f.categoria === header` nunca encontra correspondência.

## Como Usar

### No Supabase (SQL Editor):

1. Acesse o painel do Supabase (https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `fix-filtros-registrados-categorias.sql`
6. Clique em **Run** para executar

## O que o script faz:

- Reverte as categorias para o formato original (primeira letra maiúscula)
- Atualiza apenas as categorias que foram convertidas para maiúsculas
- Preserva outras categorias que já estavam no formato correto
- Usa transação para garantir consistência

## Categorias que serão corrigidas:

- "FILTRO DE ÓLEO" → "Filtro de Óleo"
- "FILTRO DE COMB." → "Filtro de Comb."
- "FILTRO DE AR" → "Filtro de Ar"
- "FILTRO DE CABINE" → "Filtro de Cabine"
- "FILTRO DE AR 1°" → "Filtro de Ar 1°"
- "FILTRO DE AR 2°" → "Filtro de Ar 2°"
- "FILTRO SEPARADOR" → "Filtro Separador"
- "DESUMIDIFICADOR" → "Desumidificador"
- "FILTRO DE TRANSMISSÃO" → "Filtro de Transmissão"

## Se algo der errado:

Se houver algum erro durante a execução, o script irá:
1. Mostrar uma mensagem de erro
2. A transação será revertida automaticamente (ROLLBACK)
3. Nenhum dado será alterado

## Observações:

- O script atualiza apenas as categorias que estão em maiúsculas
- Categorias que já estão no formato correto não serão alteradas
- Após executar este script, os registros devem voltar a aparecer na página de filtros

## Prevenção Futura:

O script `convert-all-to-uppercase.sql` foi atualizado para **não converter** o campo `categoria` na tabela `filtros_registrados`, evitando que este problema ocorra novamente.

