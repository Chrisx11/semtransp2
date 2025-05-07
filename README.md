# Sistema de Gerenciamento - SEMTRANSP

## Visão Geral

Sistema de gerenciamento com controle de usuários e permissões para acesso a diferentes módulos do sistema.

## Configuração Inicial

### Configuração do Banco de Dados

O sistema utiliza o Supabase como banco de dados. Execute o script SQL para criar as tabelas necessárias:

1. Acesse o painel de controle do Supabase
2. Vá até a seção SQL Editor
3. Execute o script contido no arquivo `supabase-setup.sql`

Este script irá:
- Criar todas as tabelas necessárias
- Inserir os módulos e abas padrão
- Criar um usuário administrador inicial

### Usuário Administrador Padrão

Após executar o script, você terá acesso com as seguintes credenciais:
- **Usuário**: admin
- **Senha**: admin123

**Importante**: Altere essa senha após o primeiro login por motivos de segurança.

## Gerenciamento de Usuários

### Usuários e Permissões

O sistema permite:

1. **Criar usuários** com diferentes níveis de permissões
2. **Editar usuários** existentes
3. **Ativar/desativar** usuários
4. **Excluir** usuários
5. **Gerenciar permissões** de acesso a diferentes módulos:
   - Acesso de visualização
   - Acesso completo (incluindo edição)
   - Acesso a abas específicas para Ordem de Serviço

### Como Acessar o Gerenciamento de Usuários

1. Faça login com um usuário que tenha permissões de acesso ao módulo de Configurações
2. Navegue até a seção "Configurações"
3. Use as abas "Usuários" e "Permissões" para gerenciar contas

## Login e Autenticação

Os usuários criados pelo sistema de gerenciamento de usuários podem fazer login na página inicial. O sistema verifica:

1. Se o usuário existe
2. Se a senha está correta
3. Se o usuário está ativo
4. Quais permissões o usuário possui

### Restrição de Acesso

O sistema restringe o acesso dos usuários com base nas permissões configuradas. Usuários só podem acessar módulos e funcionalidades para os quais tenham permissões.

## Desenvolvimento

### Estrutura de Tabelas

O sistema utiliza as seguintes tabelas no Supabase:

- `users`: Armazena informações dos usuários
- `modules`: Lista todos os módulos do sistema
- `os_tabs`: Lista as abas específicas de Ordem de Serviço
- `user_module_permissions`: Permissões dos usuários para cada módulo
- `user_os_tab_permissions`: Permissões dos usuários para abas de Ordem de Serviço

### Tecnologias Utilizadas

- Next.js
- React
- TypeScript
- Supabase (PostgreSQL)
- ShadCN/UI 