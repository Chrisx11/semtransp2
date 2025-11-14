# 🔧 Guia: Solucionar Deploy Automático no Vercel

## Problema: Deploy não está sendo acionado automaticamente

### ✅ Soluções Rápidas

#### 1. **Verificar Branch no Vercel**
   - Acesse seu projeto no Vercel: https://vercel.com/dashboard
   - Vá em **Settings** → **Git**
   - Verifique se a **Production Branch** está configurada para `main`
   - Se estiver como `master`, altere para `main` e salve

#### 2. **Verificar Integração do GitHub**
   - No Vercel: **Settings** → **Git**
   - Verifique se o repositório está conectado corretamente
   - Se necessário, reconecte o repositório

#### 3. **Disparar Deploy Manual (Temporário)**
   - No Vercel: **Deployments**
   - Clique em **"Redeploy"** no último deploy
   - Ou clique em **"Deploy"** → **"Create Deployment"**

#### 4. **Verificar Webhooks do GitHub**
   - No GitHub: Vá em **Settings** do repositório
   - **Settings** → **Webhooks**
   - Verifique se há um webhook do Vercel configurado
   - Se não houver, o Vercel deve criar automaticamente ao conectar

#### 5. **Fazer um Push para Disparar**
   ```powershell
   # Criar um commit vazio para disparar o deploy
   git commit --allow-empty -m "chore: trigger vercel deployment"
   git push origin main
   ```

#### 6. **Verificar Configuração do Projeto**
   - No Vercel: **Settings** → **General**
   - Verifique:
     - **Root Directory**: Deve estar vazio ou como `.`
     - **Build Command**: `npm run build` (padrão para Next.js)
     - **Output Directory**: `.next` (padrão para Next.js)
     - **Install Command**: `npm install`

### 🔍 Verificações Adicionais

#### Verificar se há erros no build:
- No Vercel: **Deployments** → Clique no último deploy
- Verifique os logs para erros de build

#### Verificar Variáveis de Ambiente:
- No Vercel: **Settings** → **Environment Variables**
- Certifique-se de que todas as variáveis necessárias estão configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 📝 Checklist de Troubleshooting

- [ ] Branch `main` está configurada no Vercel
- [ ] Repositório está conectado corretamente
- [ ] Webhooks do GitHub estão funcionando
- [ ] Não há erros nos logs de build
- [ ] Variáveis de ambiente estão configuradas
- [ ] Último push foi feito para a branch `main`

### 🚀 Deploy Manual (Se necessário)

Se nada funcionar, você pode fazer deploy manual via CLI:

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy de produção
vercel --prod
```

### 💡 Dica

Se o problema persistir, tente:
1. Desconectar e reconectar o repositório no Vercel
2. Verificar se há algum limite de rate no GitHub
3. Contactar o suporte do Vercel

