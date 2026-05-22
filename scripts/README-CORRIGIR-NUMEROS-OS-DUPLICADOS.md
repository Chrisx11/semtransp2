# Corrigir números de OS duplicados no Supabase

## Por que isso aconteceu

O sistema gerava o próximo número com `quantidade_de_linhas + 1`. O Supabase devolve **no máximo 1000 registros** por consulta. Com mais de 1000 OS, o contador travava e várias ordens recebiam o **mesmo número** (ex.: `OS-261001`).

A geração automática no app já foi corrigida em `services/ordem-servico-service.ts`. Este guia serve para **limpar os dados antigos** no banco.

## Aviso do Supabase (“operações destrutivas” / RLS)

Ao executar scripts que **criam backup** ou **alteram dados**, o Supabase exibe um alerta. Isso é **normal**.

| Botão no diálogo | O que fazer |
|------------------|-------------|
| **Cancelar** | Não executa — use se ainda não revisou a pré-visualização |
| **Correr sem RLS** | **Evite** — a tabela de backup ficaria acessível pela API do app |
| **Executar e habilitar o RLS** | **Use este** no arquivo de backup (`corrigir-ordens-servico-backup.sql`) |

Scripts **somente leitura** (`identificar-...` e `corrigir-...-preview-apenas.sql`) em geral **não** mostram esse aviso.

## Passo a passo (recomendado)

### 1. Identificar duplicados

1. Abra o [Supabase](https://supabase.com) → seu projeto → **SQL Editor**.
2. Execute: `scripts/identificar-ordens-servico-numero-duplicado.sql`

Anote:

- Quantos **números** estão duplicados (consulta 1).
- Quantas **OS** precisam ser renumeradas (consulta 2 — linhas com `acao_sugerida = 'RENumerar'`).
- Se há **serviços externos** ligados (consulta 3).

### 2. Pré-visualizar (sem alterar nada)

Execute: `scripts/corrigir-ordens-servico-preview-apenas.sql`

Revise `numero_atual` → `numero_novo`. A OS mais antiga de cada grupo **não** deve aparecer na lista.

### 3. Backup

Execute: `scripts/corrigir-ordens-servico-backup.sql`

No diálogo: **Executar e habilitar o RLS**.

Confira que `registros_backup` bate com a quantidade de OS no sistema.

### 4. Aplicar a correção

Execute: `scripts/corrigir-ordens-servico-aplicar.sql`

Confirme o aviso destrutivo só se já validou o passo 2. No final, a validação deve retornar **0 duplicados**.

### 5. No aplicativo

1. Reinicie o servidor (`npm run dev`) se estiver rodando.
2. Abra a página de Ordem de Serviço e confira se os números estão distintos.
3. Crie uma OS de teste e verifique se o próximo número é sequencial.

## Regras da correção

| Situação | Ação |
|----------|------|
| Várias OS com o mesmo `numero` | A **primeira criada** (`createdAt` mais antigo) **mantém** o número |
| Demais do mesmo grupo | Recebem `OS-YY####` novos, após o maior sequencial do **ano atual** |
| `servicos_externos` | Campo `ordem_servico_numero` atualizado junto, pelo `ordem_servico_id` |

## Histórico e PDFs

Observações no campo `historico` (JSON) ou textos antigos podem ainda citar o número anterior (ex.: “OS criada OS-261001”). Isso **não quebra** o sistema; é apenas registro histórico. Se precisar alinhar textos, faça manualmente ou em lote depois.

## Reverter

Se algo sair errado, execute: `scripts/corrigir-ordens-servico-reverter.sql` (restaura a partir de `ordens_servico_backup_numeros`).

## Evitar duplicados no futuro

Opcional no Supabase (após corrigir os dados):

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_ordens_servico_numero_unique
ON ordens_servico (numero);
```

Só crie esse índice **depois** de não existir nenhum `numero` repetido; caso contrário a criação falha.

## Suporte

Se a pré-visualização (PASSO 1) retornar vazia mas você ainda vê números iguais na tela:

- Confirme que está no projeto Supabase correto.
- Rode a consulta 5 do script de identificação (números fora do padrão `OS-YY####`).
