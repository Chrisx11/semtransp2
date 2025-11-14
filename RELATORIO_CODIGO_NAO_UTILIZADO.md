# Relatório de Código Não Utilizado

Este relatório identifica código, páginas, componentes e serviços que podem não estar em uso no sistema.

## 📋 Sumário Executivo

- **Páginas não referenciadas no sidebar:** 4
- **Arquivos de backup:** 3
- **Serviços potencialmente não utilizados:** 1
- **Componentes potencialmente não utilizados:** 3
- **Rotas sem permissões configuradas:** 2

---

## 🚫 1. Páginas Não Referenciadas no Sidebar

### 1.1. `/dashboard/servico-externo/fornecedores`
- **Status:** Página existe e funciona
- **Problema:** Não está no menu lateral (sidebar)
- **Referências encontradas:**
  - Está em `components/dashboard-header.tsx` (linha 53)
  - NÃO está em `components/sidebar.tsx`
  - NÃO está em `lib/auth-context.tsx` (rotasPermissoes)
- **Recomendação:** 
  - Se a página deve ser acessível, adicionar ao sidebar em "Serviços"
  - Se não for mais necessária, considerar remoção
  - Adicionar em `rotasPermissoes` se for manter

### 1.2. `/dashboard/servico-externo/fornecedores/diagnostico`
- **Status:** Página de diagnóstico/teste
- **Problema:** Página de desenvolvimento, não deveria estar em produção
- **Recomendação:** Remover ou mover para área de desenvolvimento

### 1.3. `/dashboard/servico-externo/borracharia/diagnostico`
- **Status:** Página de diagnóstico/teste
- **Problema:** Página de desenvolvimento, não deveria estar em produção
- **Recomendação:** Remover ou mover para área de desenvolvimento

### 1.4. `/dashboard/admin/setup-db`
- **Status:** Página existe
- **Problema:** Não está no sidebar
- **Referências encontradas:**
  - Está em `components/dashboard-header.tsx` (linha 109)
  - NÃO está em `components/sidebar.tsx`
  - NÃO está em `lib/auth-context.tsx` (rotasPermissoes)
- **Recomendação:** 
  - Se for página administrativa, adicionar ao sidebar com permissão adequada
  - Se não for mais necessária, considerar remoção

### 1.5. `/dashboard/planner`
- **Status:** Página existe e está no sidebar
- **Problema:** NÃO está em `rotasPermissoes` em `lib/auth-context.tsx`
- **Recomendação:** Adicionar à configuração de permissões

---

## 🗑️ 2. Arquivos de Backup (.bak, .new)

### 2.1. `components/troca-oleo-dialog.tsx.bak`
- **Status:** Arquivo de backup
- **Recomendação:** **REMOVER** - não é necessário em produção

### 2.2. `app/dashboard/manutencoes/troca-oleo/page.tsx.bak`
- **Status:** Arquivo de backup
- **Recomendação:** **REMOVER** - não é necessário em produção

### 2.3. `components/troca-oleo-dialog.tsx.new`
- **Status:** Arquivo temporário
- **Recomendação:** **REMOVER** - não é necessário em produção

---

## 🔧 3. Serviços Potencialmente Não Utilizados

### 3.1. `services/nota-service.ts`
- **Status:** ✅ **CONFIRMADO NÃO UTILIZADO**
- **Verificação:** Nenhuma importação encontrada no projeto
- **Conteúdo:** Serviço para gerenciar notas fiscais de fornecedores
- **Recomendação:** 
  - **REMOVER** se não for necessário no futuro
  - Se for uma funcionalidade planejada, manter mas documentar
  - Considerar remover também a tabela `notas` do banco se não for usada

### 3.2. Outros Serviços (Verificar Uso)
Todos os outros serviços parecem estar em uso:
- ✅ `autorizacao-borracharia-service.ts` - usado
- ✅ `autorizacao-lavador-service.ts` - usado
- ✅ `borracharia-service.ts` - usado
- ✅ `cadastro-lavador-service.ts` - usado
- ✅ `colaborador-service.ts` - usado
- ✅ `compromisso-service.ts` - usado (planner)
- ✅ `entrada-service.ts` - usado
- ✅ `fornecedor-service.ts` - usado (fornecedores)
- ✅ `lavador-service.ts` - usado
- ✅ `manutencao-antiga-service.ts` - usado (historicos)
- ✅ `observacao-veiculo-service.ts` - usado (historicos)
- ✅ `ordem-servico-service.ts` - usado
- ✅ `produto-service.ts` - usado
- ✅ `saida-service.ts` - usado
- ✅ `troca-oleo-service.ts` - usado
- ✅ `veiculo-service.ts` - usado

---

## 🧩 4. Componentes Potencialmente Não Utilizados

### 4.1. `components/ChatWidget.tsx`
- **Status:** ✅ **CONFIRMADO NÃO UTILIZADO**
- **Verificação:** Componente existe mas não é importado em nenhum lugar
- **Conteúdo:** Widget de chat com mensagens em tempo real (usa tabela `mensagens_chat`)
- **Recomendação:** 
  - **REMOVER** se não for necessário
  - Se for uma funcionalidade planejada, manter mas documentar
  - Considerar remover também a tabela `mensagens_chat` do banco se não for usada

### 4.2. `components/development-notice.tsx`
- **Status:** Componente usado apenas na página de fornecedores
- **Uso:** `app/dashboard/servico-externo/fornecedores/page.tsx`
- **Recomendação:** 
  - Manter se a página de fornecedores for mantida
  - Remover se a página for removida

### 4.3. `app/dashboard/supabase-diagnostico.tsx`
- **Status:** Arquivo TSX na raiz do dashboard
- **Problema:** Não é uma página route do Next.js (deveria estar em uma pasta)
- **Recomendação:** 
  - Mover para uma página adequada ou remover
  - Se for diagnóstico, criar rota `/dashboard/admin/diagnostico` ou similar

---

## 🔐 5. Rotas sem Permissões Configuradas

### 5.1. `/dashboard/planner`
- **Status:** Existe no sidebar mas não em `rotasPermissoes`
- **Recomendação:** Adicionar em `lib/auth-context.tsx`:
  ```typescript
  "/dashboard/planner": { modulo: "planner", acao: "visualizar" },
  ```

### 5.2. `/dashboard/servico-externo/fornecedores`
- **Status:** Não está em `rotasPermissoes`
- **Recomendação:** Se for manter, adicionar:
  ```typescript
  "/dashboard/servico-externo/fornecedores": { modulo: "fornecedores", acao: "visualizar" },
  ```

---

## 📁 6. Arquivos e Pastas Órfãs

### 6.1. `app/services/veiculo-service.ts`
- **Status:** ✅ **ARQUIVO LEGADO**
- **Problema:** Apenas contém interface TypeScript (definição de tipos)
- **Conteúdo:** Interface `Veiculo` duplicada (já existe em `services/veiculo-service.ts`)
- **Recomendação:** 
  - **REMOVER** - é código duplicado/legado
  - O serviço correto está em `services/veiculo-service.ts`

### 6.2. `pages/api/teste-env.js` (Legado)
- **Status:** ✅ **ARQUIVO DE TESTE LEGADO**
- **Problema:** Projeto usa App Router (`app/api/`), não Pages Router
- **Conteúdo:** Arquivo de teste de variáveis de ambiente
- **Recomendação:** 
  - **REMOVER** - é código de teste legado
  - A pasta `pages/` não é mais usada (projeto migrado para App Router)

---

## ✅ 7. Ações Recomendadas por Prioridade

### 🔴 Alta Prioridade (Remover Imediatamente)
1. **Remover arquivos de backup:**
   - `components/troca-oleo-dialog.tsx.bak`
   - `app/dashboard/manutencoes/troca-oleo/page.tsx.bak`
   - `components/troca-oleo-dialog.tsx.new`

2. **Remover páginas de diagnóstico:**
   - `app/dashboard/servico-externo/fornecedores/diagnostico/`
   - `app/dashboard/servico-externo/borracharia/diagnostico/`

3. **Remover código não utilizado confirmado:**
   - `components/ChatWidget.tsx` (não usado)
   - `services/nota-service.ts` (não usado)
   - `app/services/veiculo-service.ts` (legado/duplicado)
   - `pages/api/teste-env.js` (legado)
   - `app/dashboard/supabase-diagnostico.tsx` (não é uma rota válida)

### 🟡 Média Prioridade (Avaliar e Decidir)
1. **Decidir sobre página de fornecedores:**
   - Se manter: Adicionar ao sidebar e `rotasPermissoes`
   - Se remover: Deletar página e componentes relacionados

2. **Decidir sobre página admin/setup-db:**
   - Se manter: Adicionar ao sidebar com permissão administrativa
   - Se remover: Deletar página

3. **Adicionar permissões para planner:**
   - Adicionar `/dashboard/planner` em `rotasPermissoes`

### 🟢 Baixa Prioridade (Verificar e Limpar)
1. **Verificar serviços não utilizados:**
   - Confirmar se `nota-service.ts` é realmente não usado
   - Remover se confirmado não uso

2. **Verificar componentes não utilizados:**
   - Verificar uso de `ChatWidget.tsx`
   - Verificar `app/dashboard/supabase-diagnostico.tsx`

3. **Limpar estrutura:**
   - Verificar `app/services/veiculo-service.ts`
   - Verificar `pages/api/` (legado)

---

## 📊 Resumo de Impacto

### Arquivos para Remover (Imediato)
- 3 arquivos de backup (.bak, .new)
- 2 páginas de diagnóstico (se não forem necessárias)
- 1 componente não usado (ChatWidget)
- 1 serviço não usado (nota-service)
- 1 arquivo legado (app/services/veiculo-service.ts)
- 1 arquivo de teste legado (pages/api/teste-env.js)
- 1 arquivo TSX inválido (app/dashboard/supabase-diagnostico.tsx)

**Total: 10 arquivos/pastas para remover**

### Páginas para Avaliar
- 1 página de fornecedores (adicionar ao menu ou remover)
- 1 página admin/setup-db (adicionar ao menu ou remover)
- 1 rota planner (adicionar permissões)

### Código para Verificar
- 1 serviço (nota-service)
- 2-3 componentes (ChatWidget, development-notice, supabase-diagnostico)

---

## 🔍 Como Verificar Uso de Código

Para verificar se um arquivo está em uso, use:
```bash
# Procurar importações
grep -r "nome-do-arquivo" --include="*.ts" --include="*.tsx" .

# Procurar referências
grep -r "NomeDoComponente" --include="*.ts" --include="*.tsx" .
```

---

## 📝 Notas Finais

- Este relatório foi gerado através de análise estática do código
- Alguns itens podem estar em uso dinâmico (não detectável estaticamente)
- Sempre teste após remover código para garantir que nada quebrou
- Considere fazer commit antes de remover código (para facilitar rollback)

---

**Data do Relatório:** $(Get-Date -Format "dd/MM/yyyy")
**Versão do Projeto:** Baseado na estrutura atual do repositório

