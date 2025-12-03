# Changelog: Correção do Status "Pendência" em Campanhas

## Data: 2025-12-03

## Problema Original

O campo `neverStarted` nas campanhas não funcionava corretamente em produção porque:
1. SQLite armazena booleans como INTEGER (0 ou 1), mas o código Vue usava `=== true`
2. A lógica de status verificava `active = false` antes das datas, causando status incorretos

## Solução Implementada

### 1. ✅ Sistema de Migrações Expandido

**Arquivo**: `apps/api/src/scripts/run-migrations.ts`

- Adicionado suporte para dois tipos de migrações:
  - `type: 'schema'` - Migrações de estrutura (ALTER TABLE, CREATE INDEX)
  - `type: 'data'` - Migrações de dados (UPDATE, INSERT, DELETE)
- Migrações de dados são registradas na tabela `migrations` para evitar reexecução
- Sistema totalmente idempotente e automático

**Nova interface:**
```typescript
interface Migration {
    name: string;
    file: string;
    tableName?: string;    // Opcional para migrações de dados
    columnName?: string;   // Opcional para migrações de dados
    type: 'schema' | 'data'; // Tipo de migração
}
```

**Funções adicionadas:**
- `checkMigrationExecuted()` - Verifica se migração de dados foi executada
- `registerMigration()` - Registra migração na tabela migrations

### 2. ✅ Nova Migração de Dados

**Arquivo**: `apps/api/fix-neverStarted-values.sql`

Normaliza valores do campo `neverStarted`:
- Converte NULL para 0 (false)
- Normaliza valores inválidos para 0 ou 1
- Registrada como `type: 'data'` no sistema de migrações

**Execução**: Automática no próximo restart do servidor

### 3. ✅ Correção da Lógica de Status (Frontend)

**Arquivo**: `packages/sas/admin/views/CampaignsView.vue`

**Função `getStatusText()` - Linha 731-759:**

```javascript
// Comparação que funciona com SQLite (0/1) e JavaScript (true/false)
if (item.neverStarted === true || item.neverStarted === 1 || item.neverStarted === '1') {
    return 'Pendência';
}

// Reorganização da lógica:
// 1. Pendência (prioridade máxima)
// 2. Agendada (data início futura)
// 3. Encerrada (data fim passada - independente de active)
// 4. Ativa/Inativa (baseado em active)
```

**Mudanças chave:**
- ✅ Removida verificação prematura de `active = false`
- ✅ Campanhas encerradas sempre mostram "Encerrada"
- ✅ Compatibilidade com tipos INTEGER do SQLite

### 4. ✅ Script npm Adicionado

**Arquivo**: `apps/api/package.json`

```json
"scripts": {
    "migrate": "tsx src/scripts/run-migrations.ts"
}
```

**Uso**: `pnpm run migrate` para executar migrações manualmente

### 5. ✅ Testes Criados

**Arquivo**: `test-neverStarted-logic.js`

- 9 cenários testados
- Testa todos os tipos possíveis (boolean, number, string, undefined)
- **Resultado**: 9/9 testes passaram ✅

### 6. ✅ Documentação Completa

**Arquivos criados:**
- `apps/api/FIX_NEVERSTARTED.md` - Documentação da correção
- `apps/api/MIGRATIONS_README.md` - Guia completo do sistema de migrações

## Arquivos Modificados

### Backend
- ✅ `apps/api/src/scripts/run-migrations.ts` - Sistema expandido
- ✅ `apps/api/fix-neverStarted-values.sql` - Nova migração de dados
- ✅ `apps/api/package.json` - Script npm adicionado

### Frontend
- ✅ `packages/sas/admin/views/CampaignsView.vue` - Lógica corrigida

### Testes
- ✅ `test-neverStarted-logic.js` - Suite de testes

### Documentação
- ✅ `apps/api/FIX_NEVERSTARTED.md`
- ✅ `apps/api/MIGRATIONS_README.md`
- ✅ `CHANGELOG_NEVERSTARED_FIX.md` (este arquivo)

## Deploy em Produção

### Processo Automático

```bash
# 1. Backup
cp database.sqlite database.sqlite.backup

# 2. Deploy
git pull

# 3. Restart (migrações executam automaticamente)
pm2 restart all
```

### Logs Esperados

```
🔄 Verificando migrações pendentes...
✅ Conexão com banco de dados estabelecida
⏭️  Migração já aplicada: Adicionar coluna neverStarted em sas_campaigns
🔄 Executando: Normalizar valores neverStarted em sas_campaigns
✅ Migração executada com sucesso: fix-neverStarted-values.sql
✅ Migrações concluídas: 1 executada, 1 já aplicada
```

## Status Possíveis

| Status | Condição |
|--------|----------|
| **Pendência** | `neverStarted = true/1` (prioridade máxima) |
| **Agendada** | Data início futura + `active = true` |
| **Ativa** | Em andamento + `active = true` |
| **Encerrada** | Data fim passada (independente de `active`) |
| **Inativo** | `active = false` (desativada manualmente) |

## Verificação Pós-Deploy

### 1. Verificar migrações executadas

```sql
SELECT * FROM migrations ORDER BY timestamp DESC;
```

### 2. Verificar distribuição de valores

```sql
SELECT
    COUNT(*) as total,
    SUM(CASE WHEN neverStarted = 1 THEN 1 ELSE 0 END) as pendencias,
    SUM(CASE WHEN neverStarted = 0 THEN 1 ELSE 0 END) as normais
FROM sas_campaigns;
```

### 3. Testar na interface

- ✅ Acessar `/affiliation-manager/campaigns`
- ✅ Criar nova campanha marcando como "Pendência"
- ✅ Verificar se status aparece corretamente na listagem
- ✅ Editar campanha e desmarcar "Pendência"
- ✅ Verificar mudança de status

## Impacto

- ✅ **Zero downtime** - Migrações executam no startup
- ✅ **Backward compatible** - Não quebra funcionalidades existentes
- ✅ **Idempotente** - Pode reiniciar servidor sem problemas
- ✅ **Testado** - 9/9 testes passaram

## Rollback (Se Necessário)

```bash
# 1. Parar servidor
pm2 stop all

# 2. Restaurar backup
mv database.sqlite.backup database.sqlite

# 3. Reverter código
git revert <commit-hash>

# 4. Reiniciar
pm2 start all
```

## Melhorias Futuras Sugeridas

1. Adicionar testes automatizados no CI/CD
2. Criar dashboard de monitoramento de migrações
3. Adicionar suporte a rollback automático de migrações
4. Implementar dry-run para testar migrações antes de aplicar

## Contatos

Para dúvidas ou problemas:
- Consultar: `apps/api/MIGRATIONS_README.md`
- Logs: `pm2 logs` ou console do servidor
- Testes: `node test-neverStarted-logic.js`

---

**Resumo**: Sistema de migrações expandido para suportar migrações de dados, campo `neverStarted` agora funciona corretamente em produção, totalmente automático e testado.
