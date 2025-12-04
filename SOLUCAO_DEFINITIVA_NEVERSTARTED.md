# 🔧 SOLUÇÃO DEFINITIVA: Campo neverStarted não aparece na API

## ❌ Problema Confirmado

A rota `/api/affiliation-manager/campaigns/all` **NÃO está retornando** o campo `neverStarted` em nenhuma campanha.

**Análise da resposta:**
- ✅ 57 campanhas retornadas
- ❌ Campo `neverStarted` ausente em TODAS as campanhas

---

## 🔍 Causa Raiz

O campo `neverStarted` **não existe na tabela `sas_campaigns`** do banco de dados de produção, ou a migração não foi aplicada.

---

## ✅ Solução Passo a Passo

### 1. Verificar se a coluna existe no banco

```bash
# Conectar ao banco de produção
cd /root/1001div
sqlite3 database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted
```

**Se não retornar nada**, a coluna não existe e precisa ser criada.

### 2. Aplicar migração manualmente

```bash
cd /root/1001div

# Verificar se arquivo de migração existe
ls -la apps/api/add-campaigns-never-started-column.sql

# Aplicar migração
sqlite3 database.sqlite < apps/api/add-campaigns-never-started-column.sql

# Verificar se foi criada
sqlite3 database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted
```

**Resultado esperado:**
```
6|neverStarted|INTEGER|1|0|0
```

### 3. Verificar valores no banco

```bash
# Verificar se há campanhas com neverStarted = 1
sqlite3 database.sqlite "SELECT id, name, neverStarted FROM sas_campaigns WHERE neverStarted = 1 LIMIT 5;"

# Verificar estatísticas
sqlite3 database.sqlite "SELECT COUNT(*) as total, SUM(neverStarted) as true_count FROM sas_campaigns;"
```

### 4. Normalizar valores NULL (se necessário)

```bash
# Se houver valores NULL, normalizar para 0
sqlite3 database.sqlite "UPDATE sas_campaigns SET neverStarted = 0 WHERE neverStarted IS NULL;"
```

### 5. Reiniciar a API

```bash
pm2 restart "SAS Afiliation"
```

### 6. Verificar logs da API

```bash
pm2 logs "SAS Afiliation" --lines 50 | grep -i "neverStarted\|migration"
```

### 7. Testar a rota novamente

```bash
curl "https://1001.smartanalytics.center/api/affiliation-manager/campaigns/all?t=$(date +%s)" | jq '.result.data[0] | {id, name, neverStarted}'
```

**Resultado esperado:**
```json
{
  "id": "...",
  "name": "...",
  "neverStarted": 0
}
```

---

## 🛠️ Script Automatizado

Execute o script de verificação e correção:

```bash
cd /root/1001div
cd apps/api
tsx src/scripts/check-and-fix-neverStarted.ts
```

Este script:
1. ✅ Verifica se a coluna existe
2. ✅ Cria a coluna se não existir
3. ✅ Normaliza valores NULL
4. ✅ Mostra estatísticas
5. ✅ Testa uma query

---

## 🔄 Alternativa: Usar Script de Migração do Sistema

O sistema já tem um script de migrações que deveria executar automaticamente:

```bash
# Verificar se migrações foram executadas
cd /root/1001div
sqlite3 database.sqlite "SELECT * FROM migrations WHERE name LIKE '%neverStarted%';"
```

**Se não retornar nada**, a migração não foi executada. Forçar execução:

```bash
cd apps/api
tsx src/scripts/run-migrations.ts
```

---

## 📋 Checklist Final

- [ ] Coluna `neverStarted` existe no banco
- [ ] Índice criado (se necessário)
- [ ] Valores NULL normalizados para 0
- [ ] API reiniciada
- [ ] Campo aparece na resposta da API
- [ ] Frontend atualizado e rebuild feito
- [ ] Testado em produção

---

## 🚨 Se o Problema Persistir

Se após aplicar a migração o campo ainda não aparecer:

1. **Verificar TypeORM synchronize:**
   - Arquivo: `apps/api/src/config.ts`
   - Deve ter `synchronize: true`
   - Reiniciar API após verificar

2. **Verificar Entity Contract:**
   - Arquivo: `packages/sas/contracts/sas-campaigns.contract.ts`
   - Campo `neverStarted` deve estar definido

3. **Verificar logs do TypeORM:**
   - Ativar `logging: true` temporariamente em `config.ts`
   - Verificar se TypeORM reconhece a coluna

4. **Forçar sincronização:**
   - Desabilitar `synchronize: false` temporariamente
   - Reiniciar API
   - Reabilitar `synchronize: true`

---

## 📝 Notas Importantes

- ⚠️ **NUNCA** use `synchronize: true` em produção por longos períodos
- ✅ Use migrações SQL para alterações de schema
- ✅ Sempre teste migrações em ambiente de desenvolvimento primeiro
- ✅ Faça backup do banco antes de aplicar migrações

