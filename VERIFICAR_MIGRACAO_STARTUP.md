# 🔍 Verificação: Migração no Startup

## ✅ Sim, a coluna DEVERIA ser criada automaticamente

O sistema está configurado para executar migrações automaticamente no startup:

### Como funciona:

1. **`main.ts` (linha 24-28)**: Executa `runMigrations()` antes de inicializar a aplicação
2. **`run-migrations.ts`**: Verifica e executa migrações pendentes
3. **Migração registrada** (linhas 20-26):
   ```typescript
   {
       name: 'Adicionar coluna neverStarted em sas_campaigns',
       file: 'add-campaigns-never-started-column.sql',
       tableName: 'sas_campaigns',
       columnName: 'neverStarted',
       type: 'schema'
   }
   ```

### Lógica de execução:

1. Verifica se a coluna já existe (`checkColumnExists`)
2. Se **NÃO existir**, executa a migração
3. Se **existir**, pula a migração

---

## ❓ Por que não foi criada?

Possíveis causas:

### 1. Caminho do arquivo de migração incorreto

O script usa `process.cwd()` para encontrar o arquivo:
```typescript
const migrationPath = path.join(process.cwd(), migrationFile);
```

**Problema**: Se a API rodar de um diretório diferente, o arquivo não será encontrado.

**Verificar:**
```bash
# Ver logs do PM2 para verificar o caminho
pm2 logs "SAS Afiliation" | grep -i "migration\|neverStarted"

# Verificar se arquivo existe no caminho esperado
ls -la /root/1001div/apps/api/add-campaigns-never-started-column.sql
```

### 2. Erro silencioso

O código tem `try/catch` que **não bloqueia** a inicialização:
```typescript
catch (error: any) {
    console.warn('⚠️  Aviso: Erro ao executar migrações (continuando inicialização):', error?.message || error);
}
```

**Verificar logs:**
```bash
pm2 logs "SAS Afiliation" --lines 100 | grep -i "migration\|erro\|error"
```

### 3. Variável de ambiente SKIP_MIGRATIONS

Se `SKIP_MIGRATIONS=true`, as migrações não executam:
```typescript
if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_MIGRATIONS) {
    // executa migrações
}
```

**Verificar:**
```bash
pm2 env "SAS Afiliation" | grep SKIP_MIGRATIONS
```

### 4. Caminho do banco de dados incorreto

O script usa:
```typescript
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite');
```

**Verificar:**
```bash
# Ver qual caminho está sendo usado
pm2 logs "SAS Afiliation" | grep -i "database\|banco"

# Verificar variável de ambiente
pm2 env "SAS Afiliation" | grep DATABASE_PATH
```

---

## 🔧 Solução Imediata

### Opção 1: Aplicar manualmente (Recomendado)

```bash
cd /root/1001div
sqlite3 database.sqlite < apps/api/add-campaigns-never-started-column.sql
pm2 restart "SAS Afiliation"
```

### Opção 2: Forçar execução da migração

```bash
cd /root/1001div/apps/api
tsx src/scripts/run-migrations.ts
```

### Opção 3: Verificar e corrigir caminhos

```bash
# Verificar se arquivo existe
ls -la /root/1001div/apps/api/add-campaigns-never-started-column.sql

# Se não existir, copiar do repositório
# (assumindo que o código está em /root/1001div)
```

---

## 📋 Checklist de Diagnóstico

Execute estes comandos para diagnosticar:

```bash
# 1. Verificar se arquivo de migração existe
ls -la /root/1001div/apps/api/add-campaigns-never-started-column.sql

# 2. Verificar logs de migração no startup
pm2 logs "SAS Afiliation" --lines 200 | grep -A 5 -B 5 "migra\|Migration"

# 3. Verificar variáveis de ambiente
pm2 env "SAS Afiliation" | grep -E "NODE_ENV|SKIP_MIGRATIONS|DATABASE_PATH"

# 4. Verificar se coluna existe
sqlite3 /root/1001div/database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted

# 5. Testar execução manual da migração
cd /root/1001div/apps/api
tsx src/scripts/run-migrations.ts
```

---

## ✅ Após Aplicar Manualmente

Após aplicar a migração manualmente, no próximo restart a migração será **pulada** automaticamente porque o sistema detectará que a coluna já existe.

---

## 💡 Recomendação

**Aplicar manualmente agora** e depois investigar por que não funcionou automaticamente, verificando os logs do PM2.

