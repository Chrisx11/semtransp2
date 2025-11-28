# Sistema de Permissões Mobile/Desktop

Este documento explica como usar o novo sistema de controle de acesso por dispositivo (mobile/desktop).

## Instalação

1. Execute o script SQL para adicionar o campo `device_access` na tabela:
   ```sql
   \i scripts/add-device-access-permission.sql
   ```

   Ou execute diretamente no Supabase:
   - Acesse o SQL Editor
   - Cole o conteúdo do arquivo `scripts/add-device-access-permission.sql`
   - Execute o script

## Como Funciona

O sistema permite controlar se um usuário tem acesso a um módulo específico em:
- **Mobile**: Apenas em dispositivos móveis (largura < 768px)
- **Desktop**: Apenas em desktops (largura >= 768px)
- **Ambos**: Acesso em qualquer dispositivo (padrão)

## Configuração

### 1. Na Página de Configurações

1. Acesse **Dashboard > Configurações > Permissões**
2. Selecione um usuário
3. Marque as permissões desejadas
4. Para cada permissão marcada, você verá um dropdown com as opções:
   - **Mobile + Desktop**: Acesso em ambos os dispositivos (padrão)
   - **Apenas Mobile**: Acesso somente em dispositivos móveis
   - **Apenas Desktop**: Acesso somente em desktops

### 2. Valores Padrão

- Todos os usuários existentes terão automaticamente `device_access = 'both'` (acesso a ambos)
- Novos usuários também terão `device_access = 'both'` por padrão

## Comportamento

- Se um usuário tentar acessar um módulo em um dispositivo não permitido, o acesso será negado
- Administradores sempre têm acesso completo, independente do dispositivo
- A verificação é feita automaticamente em todas as rotas protegidas

## Exemplo de Uso

**Cenário**: Você quer que um usuário tenha acesso ao Dashboard apenas no mobile:

1. Vá em Configurações > Permissões
2. Selecione o usuário
3. Marque a permissão "Dashboard"
4. No dropdown ao lado, selecione "Apenas Mobile"
5. Salve as permissões

Agora esse usuário só conseguirá acessar o Dashboard em dispositivos móveis.

## Estrutura do Banco de Dados

O campo `device_access` foi adicionado na tabela `user_module_permissions`:

```sql
device_access VARCHAR(20) DEFAULT 'both' 
CHECK (device_access IN ('mobile', 'desktop', 'both'))
```

## Notas Importantes

- A detecção de mobile é baseada na largura da janela (< 768px)
- Se você redimensionar a janela do navegador, pode ser necessário recarregar a página
- O sistema é retrocompatível: permissões antigas sem `device_access` serão tratadas como 'both'

