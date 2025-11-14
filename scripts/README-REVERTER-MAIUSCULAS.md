# Script SQL - Reverter Conversão para Maiúsculas

## ⚠️ ATENÇÃO CRÍTICA

Este script tenta reverter as mudanças feitas pelo script de conversão para maiúsculas, mas **NÃO pode restaurar dados que foram realmente deletados ou perdidos**.

## Opções de Recuperação

### Opção 1: Point-in-Time Recovery do Supabase (RECOMENDADO)

Se você tem Point-in-Time Recovery habilitado no Supabase:

1. Acesse o painel do Supabase: https://app.supabase.com
2. Vá em **Settings** > **Database** > **Backups**
3. Procure por um backup de **ANTES** de executar o script de maiúsculas
4. Restaure o banco para esse ponto no tempo

**Esta é a melhor opção** pois restaura o banco exatamente como estava antes.

### Opção 2: Usar o Script de Reversão

Se não houver backup disponível, você pode tentar usar o script `REVERT-TO-LOWERCASE.sql`:

1. **FAÇA BACKUP ANTES** de executar qualquer coisa
2. Execute o script no SQL Editor do Supabase
3. O script usa `INITCAP()` para converter de volta para formato "Primeira Letra Maiúscula"
4. **Verifique os dados** após executar para confirmar se estão corretos

## Limitações do Script de Reversão

- ❌ **Não pode restaurar dados deletados** - se registros foram realmente removidos, eles não voltarão
- ⚠️ **INITCAP pode não ser 100% preciso** - pode capitalizar palavras que não deveriam
- ⚠️ **Alguns formatos podem não ser restaurados perfeitamente** (ex: siglas, códigos)

## O que o Script Faz

O script `REVERT-TO-LOWERCASE.sql`:

1. Converte campos de texto de MAIÚSCULAS para "Primeira Letra Maiúscula" usando `INITCAP()`
2. Preserva campos que devem ficar em maiúsculas (placas, chassi, RENAVAM)
3. Corrige categorias específicas em `filtros_registrados` para formato exato
4. Atualiza campos `updated_at` automaticamente

## Investigação: O que Realmente "Sumiu"?

Antes de reverter, é importante entender:

1. **Os dados ainda existem no banco?** 
   - Execute: `SELECT COUNT(*) FROM nome_da_tabela;`
   - Se retornar 0, os dados foram deletados
   - Se retornar um número, os dados existem mas podem não aparecer por problemas de comparação

2. **É problema de comparação?**
   - Como vimos com `filtros_registrados`, os dados podem existir mas não aparecer por comparações exatas
   - Nesse caso, corrigir as comparações no código pode ser melhor que reverter tudo

3. **Quais tabelas foram afetadas?**
   - Verifique cada página do sistema
   - Identifique quais dados não aparecem

## Como Usar o Script de Reversão

### No Supabase (SQL Editor):

1. **PRIMEIRO**: Verifique se há backup disponível (Opção 1 acima)
2. Se não houver backup, faça um backup manual exportando os dados
3. Acesse o SQL Editor no Supabase
4. Copie e cole o conteúdo do arquivo `REVERT-TO-LOWERCASE.sql`
5. Execute o script
6. **Verifique os dados** após a execução

## Verificação Pós-Reversão

Após executar o script, verifique:

1. ✅ Os registros voltaram a aparecer nas páginas?
2. ✅ Os dados estão no formato correto?
3. ✅ Não há dados duplicados ou corrompidos?
4. ✅ As comparações no código funcionam corretamente?

## Se Algo Der Errado

Se o script de reversão causar problemas:

1. Use `ROLLBACK;` se ainda estiver na mesma transação
2. Restaure do backup do Supabase (se disponível)
3. Entre em contato com suporte se necessário

## Prevenção Futura

Para evitar problemas similares:

1. ✅ Sempre faça backup antes de scripts que alteram dados
2. ✅ Teste scripts em ambiente de desenvolvimento primeiro
3. ✅ Use transações para poder reverter
4. ✅ Verifique constraints e comparações no código antes de converter dados

