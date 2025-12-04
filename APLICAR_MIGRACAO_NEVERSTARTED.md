# 🚀 APLICAR MIGRAÇÃO: Campo neverStarted

## ✅ Problema Confirmado

O campo `neverStarted` **não existe** na tabela `sas_campaigns` do banco de dados.

## 🔧 Solução Rápida

### Opção 1: Script Automatizado (Recomendado)

```bash
cd /root/1001div
bash apps/api/apply-neverStarted-migration.sh
```

### Opção 2: Comandos Manuais

```bash
cd /root/1001div

# 1. Aplicar migração
sqlite3 database.sqlite < apps/api/add-campaigns-never-started-column.sql

# 2. Verificar se foi criada
sqlite3 database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted

# 3. Verificar valores
sqlite3 database.sqlite "SELECT COUNT(*) as total, SUM(neverStarted) as true_count FROM sas_campaigns;"
```

### Opção 3: SQL Direto

```bash
cd /root/1001div
sqlite3 database.sqlite <<EOF
ALTER TABLE sas_campaigns ADD COLUMN neverStarted INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_sas_campaigns_neverStarted ON sas_campaigns(neverStarted);
EOF
```

## ✅ Verificação

Após aplicar a migração, verifique:

```bash
# Ver estrutura da coluna
sqlite3 /root/1001div/database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted

# Resultado esperado:
# 6|neverStarted|INTEGER|1|0|0
```

## 🔄 Reiniciar API

```bash
pm2 restart "SAS Afiliation"
```

## 🧪 Testar

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

## 📝 Notas

- A coluna será criada com valor padrão `0` (false) para todas as campanhas existentes
- O índice será criado automaticamente para melhorar performance
- Todas as campanhas existentes terão `neverStarted = 0` por padrão

