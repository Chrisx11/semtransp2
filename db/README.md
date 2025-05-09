# Instruções para Configuração do Banco de Dados

Este diretório contém scripts SQL para criar as tabelas e estruturas necessárias no banco de dados Supabase.

## Tabela de Fornecedores

O arquivo `fornecedores.sql` contém o script para criar a tabela de fornecedores com todos os campos necessários, índices, triggers e políticas de segurança.

### Como executar o script no Supabase

1. Acesse o painel de controle do Supabase (https://app.supabase.com)
2. Selecione seu projeto
3. Navegue até a seção "SQL Editor" no menu lateral
4. Clique em "New Query"
5. Copie e cole o conteúdo do arquivo `fornecedores.sql`
6. Clique em "Run" para executar o script

### Estrutura da tabela

A tabela `fornecedores` possui os seguintes campos:

- `id` (UUID): Identificador único do fornecedor
- `nome` (VARCHAR): Nome do fornecedor
- `endereco` (TEXT): Endereço completo do fornecedor
- `telefone` (VARCHAR): Número de telefone do fornecedor
- `created_at` (TIMESTAMP): Data e hora de criação do registro
- `updated_at` (TIMESTAMP): Data e hora da última atualização do registro

### Funcionalidades adicionais

O script também configura:

1. **Índices**: Para melhorar a performance das consultas por nome
2. **Trigger de atualização**: Atualiza automaticamente o campo `updated_at` quando um registro é modificado
3. **Políticas de segurança (RLS)**: Configura permissões para que apenas usuários autenticados possam acessar os dados

### Dados de teste

O script inclui exemplos de inserção de dados comentados. Para usá-los, remova os comentários das linhas correspondentes.

## Integração com a aplicação

A aplicação já está configurada para se conectar ao Supabase através dos arquivos:

- `lib/supabase.ts`: Configuração do cliente Supabase
- `lib/db.ts`: Wrapper para operações de banco de dados
- `services/fornecedor-service.ts`: Serviços para manipulação de fornecedores

Certifique-se de que as variáveis de ambiente estejam configuradas corretamente no arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
``` 