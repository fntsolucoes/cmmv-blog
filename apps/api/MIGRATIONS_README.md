# Sistema de Migrações

## Visão Geral

O sistema de migrações foi expandido para suportar dois tipos de migrações:

### 1. Migrações de Schema (`type: 'schema'`)
- Alteram a estrutura do banco (CREATE TABLE, ALTER TABLE, etc)
- Verificação: Verifica se a coluna existe na tabela
- Idempotência: Pode ser executada múltiplas vezes sem erro

### 2. Migrações de Dados (`type: 'data'`)
- Modificam dados existentes (UPDATE, INSERT, DELETE)
- Verificação: Registra execução na tabela `migrations`
- Idempotência: Executa apenas uma vez, mesmo com múltiplos restarts

## Como Funciona

### Execução Automática

As migrações são executadas **automaticamente** no startup do servidor:

```typescript
// Executado automaticamente quando o servidor inicia
import { runMigrations } from './scripts/run-migrations';

await runMigrations();
```

### Execução Manual

Você também pode executar as migrações manualmente:

```bash
# Executar todas as migrações pendentes
pnpm run migrate

# Ou diretamente com tsx
npx tsx src/scripts/run-migrations.ts
```

## Adicionar Nova Migração

### Passo 1: Criar o arquivo SQL

Crie o arquivo na raiz de `apps/api/`:

```sql
-- nova-migracao.sql
-- Descrição do que a migração faz

-- Comandos SQL aqui
ALTER TABLE minha_tabela ADD COLUMN novo_campo TEXT;
```

### Passo 2: Registrar no sistema

Edite `src/scripts/run-migrations.ts`:

```typescript
const migrations: Migration[] = [
    // Migrações existentes...

    // Nova migração de schema
    {
        name: 'Adicionar coluna X na tabela Y',
        file: 'nova-migracao.sql',
        tableName: 'minha_tabela',
        columnName: 'novo_campo',
        type: 'schema'
    },

    // Ou nova migração de dados
    {
        name: 'Normalizar dados da tabela Y',
        file: 'normalizar-dados.sql',
        type: 'data'
    }
];
```

### Passo 3: Testar localmente

```bash
# Fazer backup do banco
cp database.sqlite database.sqlite.backup

# Executar migrações
pnpm run migrate

# Verificar resultado
sqlite3 database.sqlite "SELECT * FROM migrations;"
```

### Passo 4: Deploy

Faça commit e push. As migrações executarão automaticamente quando o servidor reiniciar.

## Migrações Atuais

| Nome | Arquivo | Tipo | Status |
|------|---------|------|--------|
| Adicionar coluna neverStarted | `add-campaigns-never-started-column.sql` | schema | ✅ Aplicada |
| Normalizar valores neverStarted | `fix-neverStarted-values.sql` | data | ✅ Aplicada |

## Verificar Status das Migrações

### Ver migrações de dados executadas

```sql
SELECT
    datetime(timestamp/1000, 'unixepoch') as executed_at,
    name
FROM migrations
ORDER BY timestamp DESC;
```

### Ver estrutura de uma tabela

```sql
PRAGMA table_info(sas_campaigns);
```

## Troubleshooting

### Erro: "no such table: migrations"

**Causa**: Primeira execução do sistema de migrações de dados.

**Solução**: A tabela será criada automaticamente. Nenhuma ação necessária.

### Migração não executou

**Causa**: Migração já foi aplicada anteriormente.

**Solução**: Verifique os logs do servidor. Se a migração foi pulada, é normal.

### Forçar reexecução de migração de dados

**⚠️ Cuidado**: Isso pode causar duplicação de dados!

```sql
-- Remover registro da migração
DELETE FROM migrations WHERE name = 'Nome da migração';

-- Reiniciar servidor para reexecutar
```

### Rollback de migração

Migrações não têm rollback automático. Se necessário:

1. Restaurar backup do banco de dados
2. Remover a migração do array em `run-migrations.ts`
3. Reiniciar o servidor

## Boas Práticas

### ✅ DO

- ✅ Sempre fazer backup antes de migração em produção
- ✅ Testar migrações localmente primeiro
- ✅ Usar migrações idempotentes (podem rodar múltiplas vezes)
- ✅ Documentar o que cada migração faz
- ✅ Usar `type: 'schema'` para ALTER TABLE
- ✅ Usar `type: 'data'` para UPDATE/INSERT/DELETE

### ❌ DON'T

- ❌ Editar migrações já aplicadas em produção
- ❌ Remover migrações do array sem verificar impacto
- ❌ Fazer migrações destrutivas sem backup
- ❌ Usar SELECT em arquivos de migração (retorna dados desnecessários)
- ❌ Esquecer de adicionar índices para colunas novas

## Exemplos

### Exemplo 1: Adicionar coluna (Schema)

```typescript
// run-migrations.ts
{
    name: 'Adicionar coluna email em users',
    file: 'add-user-email-column.sql',
    tableName: 'users',
    columnName: 'email',
    type: 'schema'
}
```

```sql
-- add-user-email-column.sql
ALTER TABLE users ADD COLUMN email TEXT;
CREATE INDEX idx_users_email ON users(email);
```

### Exemplo 2: Normalizar dados (Data)

```typescript
// run-migrations.ts
{
    name: 'Normalizar emails para lowercase',
    file: 'normalize-user-emails.sql',
    type: 'data'
}
```

```sql
-- normalize-user-emails.sql
UPDATE users
SET email = LOWER(email)
WHERE email IS NOT NULL;
```

## Arquitetura

```
apps/api/
├── src/scripts/
│   └── run-migrations.ts       # Sistema de migrações
├── *.sql                        # Arquivos de migração SQL
└── database.sqlite             # Banco de dados
```

### Fluxo de Execução

```
1. Servidor inicia
2. run-migrations() é chamado
3. Para cada migração:
   ├─ Se type=schema: verifica se coluna existe
   ├─ Se type=data: verifica na tabela migrations
   └─ Se não aplicada: executa SQL e registra
4. Servidor continua inicialização
```

## Migração de Sistema Legado

Se você tem scripts SQL antigos que foram executados manualmente:

1. Adicione-os ao array `migrations`
2. Marque como `type: 'schema'` ou `type: 'data'`
3. O sistema detectará automaticamente que já foram aplicados
4. Futuras execuções serão automáticas

## Suporte

Para problemas com migrações:

1. Verifique os logs do servidor no startup
2. Execute `pnpm run migrate` manualmente para ver erros detalhados
3. Consulte `FIX_NEVERSTARTED.md` para exemplo completo
