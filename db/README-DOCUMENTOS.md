# Configuração da Funcionalidade de Documentos

## Passo a Passo para Configurar

### 1. Criar a Tabela no Banco de Dados

Execute o arquivo SQL no Supabase:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `db/create-documentos-table.sql`
4. Clique em **Run** para executar

### 2. Criar o Bucket no Supabase Storage

**IMPORTANTE:** Este passo é obrigatório! Sem o bucket, o upload não funcionará.

1. Acesse o **Supabase Dashboard**
2. Vá em **Storage** (no menu lateral)
3. Clique em **Create Bucket** ou **New Bucket**
4. Configure o bucket:
   - **Nome do bucket:** `documentos` (exatamente este nome, sem espaços)
   - **Público:** 
     - `false` (recomendado) - Para documentos privados (requer autenticação)
     - `true` - Para documentos públicos (acessíveis sem autenticação)
   - **File size limit:** `50MB` (ou conforme sua necessidade)
   - **Allowed MIME types:** `application/pdf` (opcional, mas recomendado)

5. Clique em **Create bucket**

### 3. Configurar Políticas RLS do Bucket (OBRIGATÓRIO)

**IMPORTANTE:** Este passo é obrigatório! Sem as políticas RLS do storage, o upload não funcionará.

As políticas RLS do Supabase Storage são diferentes das políticas da tabela. Você precisa executar o arquivo SQL com as políticas:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `db/create-documentos-storage-policies.sql`
4. Cole o conteúdo no editor
5. Clique em **Run** para executar

Este arquivo cria as políticas necessárias para:
- **SELECT:** Permitir leitura de arquivos
- **INSERT:** Permitir upload de arquivos
- **DELETE:** Permitir exclusão de arquivos
- **UPDATE:** Permitir atualização de arquivos (opcional)

**Nota:** Se você não executar este arquivo, receberá o erro "new row violates row-level security policy" ao tentar fazer upload.

### 4. Verificar a Configuração

Após criar o bucket, você pode testar:

1. Acesse a página de **Documentos** no sistema
2. Tente fazer upload de um arquivo PDF
3. Se tudo estiver configurado corretamente, o upload deve funcionar

## Solução de Problemas

### Erro: "Bucket not found"

**Causa:** O bucket `documentos` não foi criado no Supabase Storage.

**Solução:**
1. Acesse o Supabase Dashboard > Storage
2. Verifique se o bucket `documentos` existe
3. Se não existir, crie-o seguindo o passo 2 acima
4. Certifique-se de que o nome está exatamente como `documentos` (sem espaços, minúsculas)

### Erro: "Permission denied" ou "Access denied"

**Causa:** As políticas RLS do bucket estão bloqueando o acesso.

**Solução:**
1. Se o bucket for público, certifique-se de que está marcado como `Public`
2. Se o bucket for privado, configure as políticas RLS conforme o passo 3 acima
3. Verifique se o usuário está autenticado

### Erro: "File size too large"

**Causa:** O arquivo excede o limite configurado no bucket.

**Solução:**
1. Aumente o limite de tamanho do arquivo no bucket
2. Ou reduza o tamanho do arquivo PDF

### Erro: "Invalid file type"

**Causa:** O arquivo não é um PDF.

**Solução:**
1. Certifique-se de que está fazendo upload apenas de arquivos PDF
2. Verifique a extensão do arquivo (.pdf)

## Estrutura do Bucket

O bucket `documentos` armazenará os arquivos PDF com a seguinte estrutura:

```
documentos/
  ├── 1234567890_nome_arquivo.pdf
  ├── 1234567891_outro_arquivo.pdf
  └── ...
```

Os arquivos são nomeados com um timestamp + nome original para evitar conflitos.

## Notas Importantes

- O bucket deve se chamar exatamente `documentos` (sem espaços, minúsculas)
- Recomenda-se usar bucket privado para maior segurança
- O tamanho máximo padrão é 50MB, mas pode ser ajustado
- Apenas arquivos PDF são aceitos
- Os metadados dos documentos são armazenados na tabela `documentos` do banco de dados

