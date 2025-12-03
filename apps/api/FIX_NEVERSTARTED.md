# Correção da Lógica do Status "Pendência" em Campanhas

## Problema Identificado

O campo `neverStarted` nas campanhas não estava funcionando corretamente em produção devido a incompatibilidade de tipos entre SQLite e JavaScript.

### Causa Raiz

1. **SQLite armazena booleans como INTEGER**: O banco de dados SQLite armazena valores boolean como `0` (false) ou `1` (true)
2. **Comparação estrita no frontend**: O código Vue estava usando `item.neverStarted === true`, que falha quando o valor vem como `1` (número) do banco
3. **Status "Encerrada" vs "Inativo"**: A lógica verificava `active = false` antes de verificar se a data de fim já passou, causando status incorretos

## Correções Aplicadas

### 1. Frontend (`CampaignsView.vue`)

**Função `getStatusText` - Linha 731-735:**
```javascript
// ANTES (❌ Não funcionava com SQLite)
if (item.neverStarted === true) {
    return 'Pendência';
}

// DEPOIS (✅ Funciona com todos os tipos)
// SQLite retorna 0/1 para boolean, então usar comparação truthy
if (item.neverStarted === true || item.neverStarted === 1 || item.neverStarted === '1') {
    return 'Pendência';
}
```

**Reorganização da lógica de status:**
- Removida verificação prematura de `active = false`
- Ordem correta: Pendência → Agendada → Encerrada → Ativa/Inativo
- Campanhas com data de fim passada sempre mostram "Encerrada" (independente do flag `active`)

### 2. Backend (`campaigns.controller.ts`)

O backend já estava correto, com conversões explícitas para boolean:
- Linhas 73-90: Conversão no método `create`
- Linhas 106-128: Conversão no método `update`

### 3. Banco de Dados

Migration já aplicada: `add-campaigns-never-started-column.sql`
- Coluna: `neverStarted INTEGER NOT NULL DEFAULT 0`
- Índice: `idx_sas_campaigns_neverStarted`

## Sistema de Migrações

As correções foram integradas ao **sistema automático de migrações** do projeto:

### ✅ Migrações Automáticas

1. **Migração de Schema** (já existente):
   - Arquivo: `add-campaigns-never-started-column.sql`
   - Tipo: `schema`
   - Adiciona a coluna `neverStarted` à tabela

2. **Migração de Dados** (nova):
   - Arquivo: `fix-neverStarted-values.sql`
   - Tipo: `data`
   - Normaliza valores NULL ou inválidos para 0 ou 1
   - Registrada na tabela `migrations` para evitar reexecução

### Como Funciona

Ao reiniciar o servidor, o sistema:
1. ✅ Verifica se a coluna existe (migração de schema)
2. ✅ Verifica na tabela `migrations` se a normalização foi executada (migração de dados)
3. ✅ Executa apenas migrações pendentes
4. ✅ Registra migrações de dados executadas para não repetir

### Deploy em Produção

**É automático!** Apenas:

```bash
# 1. Fazer backup do banco de dados
cp database.sqlite database.sqlite.backup

# 2. Fazer pull do código
git pull

# 3. Reiniciar o servidor
pm2 restart all
```

As migrações serão executadas automaticamente no startup.

### Verificar Migrações Aplicadas

```sql
-- Ver todas as migrações de dados executadas
SELECT * FROM migrations ORDER BY timestamp DESC;

-- Verificar distribuição de valores em campanhas
SELECT
    COUNT(*) as total,
    SUM(CASE WHEN neverStarted = 1 THEN 1 ELSE 0 END) as pendencias,
    SUM(CASE WHEN neverStarted = 0 THEN 1 ELSE 0 END) as normais
FROM sas_campaigns;
```

## Testes Realizados

Criado script de teste abrangente: `test-neverStarted-logic.js`

**Cenários testados:**
- ✅ `neverStarted = true` (boolean)
- ✅ `neverStarted = 1` (number do SQLite)
- ✅ `neverStarted = "1"` (string)
- ✅ `neverStarted = false` (boolean)
- ✅ `neverStarted = 0` (number do SQLite)
- ✅ `neverStarted = "0"` (string)
- ✅ `neverStarted = undefined`
- ✅ Combinações com datas de término

**Resultado:** 9/9 testes passaram ✅

## Status Possíveis

| Status | Condição |
|--------|----------|
| **Pendência** | `neverStarted = true` (prioridade máxima) |
| **Agendada** | Data início no futuro + `active = true` |
| **Ativa** | Em andamento + `active = true` |
| **Encerrada** | Data fim no passado (independente de `active`) |
| **Inativo** | `active = false` (campanhas desativadas manualmente) |

## Rollout em Produção

### Checklist

1. ✅ Fazer backup do banco de dados
2. ✅ Fazer `git pull` no servidor
3. ✅ Reiniciar o servidor (migrações executam automaticamente)
4. ✅ Verificar logs do servidor para confirmar execução das migrações
5. ✅ Testar criação/edição de campanhas
6. ✅ Verificar listagem de campanhas com diferentes status

### Logs Esperados no Startup

```
🔄 Verificando migrações pendentes...
✅ Conexão com banco de dados estabelecida
⏭️  Migração já aplicada: Adicionar coluna neverStarted em sas_campaigns
🔄 Executando: Normalizar valores neverStarted em sas_campaigns
✅ Migração executada com sucesso: fix-neverStarted-values.sql
✅ Migrações concluídas: 1 executada, 1 já aplicada
```

## Arquivos Modificados

### Frontend
- `packages/sas/admin/views/CampaignsView.vue` - Correção da lógica de status

### Backend
- `apps/api/src/scripts/run-migrations.ts` - Sistema de migrações expandido (schema + data)
- `apps/api/fix-neverStarted-values.sql` - Migração de dados para normalizar valores
- `packages/sas/api/campaigns/campaigns.controller.ts` - Já tinha conversões corretas

### Testes e Documentação
- `test-neverStarted-logic.js` - Script de testes (9/9 passaram)
- `apps/api/FIX_NEVERSTARTED.md` - Esta documentação

### ⚠️ Arquivos Legados (Não Usar)

- `apps/api/install-campaigns-never-started.sh` - Script shell manual (substituído pelo sistema automático)
- `apps/api/INSTALL_NEVER_STARTED.md` - Documentação antiga
