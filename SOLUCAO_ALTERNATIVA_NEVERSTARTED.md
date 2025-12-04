# 🔧 Soluções Alternativas: Campo neverStarted não aparece após reiniciar

## ⚠️ Se reiniciar a API não resolver

Se após reiniciar a API o campo `neverStarted` ainda não aparecer na resposta, siga estas soluções alternativas:

---

## 🔍 Diagnóstico Avançado

### 1. Verificar se TypeORM está buscando a coluna

```bash
# Ativar logging temporariamente no config.ts
# Editar: apps/api/src/config.ts
# Mudar: logging: false → logging: true

# Reiniciar API
pm2 restart "SAS Afiliation"

# Verificar logs de queries SQL
pm2 logs "SAS Afiliation" --lines 200 | grep -i "SELECT\|neverStarted"
```

**O que procurar:**
- Se a query SQL inclui `neverStarted` na lista de colunas
- Se não incluir, o TypeORM não está reconhecendo a coluna

---

### 2. Verificar metadados da entidade

O TypeORM pode não estar sincronizando corretamente. Verificar se o contract está sendo carregado:

```bash
# Verificar se há erros de carregamento de entidades
pm2 logs "SAS Afiliation" --lines 200 | grep -i "error\|contract\|entity\|metadata"
```

---

## 🔧 Soluções Alternativas

### Solução 1: Forçar sincronização do TypeORM

**Opção A: Desabilitar e reabilitar synchronize**

```typescript
// apps/api/src/config.ts
repository: {
    type: 'sqlite',
    database: "./database.sqlite",
    synchronize: false, // Desabilitar temporariamente
    logging: true, // Ativar para ver o que acontece
}
```

1. Salvar arquivo
2. Reiniciar API: `pm2 restart "SAS Afiliation"`
3. Aguardar 10 segundos
4. Reabilitar `synchronize: true`
5. Reiniciar novamente

**⚠️ CUIDADO:** `synchronize: true` pode alterar o schema. Use com cuidado em produção.

---

### Solução 2: Verificar se há transformação/serialização customizada

Verificar se o Repository ou algum middleware está filtrando campos:

```bash
# Procurar por transformações ou serializações
grep -r "toJSON\|serialize\|transform\|select" sas/packages/sas/api/campaigns/
```

Se houver transformações, verificar se estão incluindo `neverStarted`.

---

### Solução 3: Usar query raw para testar

Criar um endpoint temporário para testar se a coluna está acessível:

```typescript
// Adicionar temporariamente em campaigns.controller.ts
@Get("test-neverStarted")
async testNeverStarted() {
    const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
    const queryRunner = Repository.getDataSource().createQueryRunner();
    
    try {
        const result = await queryRunner.query(`
            SELECT id, name, neverStarted 
            FROM sas_campaigns 
            LIMIT 5
        `);
        return { success: true, data: result };
    } finally {
        await queryRunner.release();
    }
}
```

Testar:
```bash
curl "https://1001.smartanalytics.center/api/affiliation-manager/campaigns/test-neverStarted"
```

**Se retornar o campo:**
- ✅ Coluna existe e está acessível
- Problema é no TypeORM/Entity mapping

**Se não retornar:**
- ❌ Verificar nome exato da coluna no banco

---

### Solução 4: Verificar nome exato da coluna

```bash
# Verificar nome exato (case-sensitive)
sqlite3 /root/1001div/database.sqlite "PRAGMA table_info(sas_campaigns);" | grep -i never

# Verificar se há diferença de case
sqlite3 /root/1001div/database.sqlite "SELECT sql FROM sqlite_master WHERE type='table' AND name='sas_campaigns';" | grep -i never
```

**Possíveis problemas:**
- Nome diferente: `never_started` vs `neverStarted`
- Case diferente: `NeverStarted` vs `neverStarted`

---

### Solução 5: Recriar metadados do TypeORM

Forçar recriação dos metadados:

1. **Parar API:**
```bash
pm2 stop "SAS Afiliation"
```

2. **Limpar cache (se houver):**
```bash
# Verificar se há diretório de cache
ls -la /root/1001div/apps/api/.cache
rm -rf /root/1001div/apps/api/.cache  # Se existir
```

3. **Reiniciar API:**
```bash
pm2 start "SAS Afiliation"
```

---

### Solução 6: Verificar se contract está sendo carregado corretamente

```bash
# Verificar se contract está sendo importado
grep -r "SasCampaignsContract\|SasCampaignsEntity" sas/packages/sas/

# Verificar se há erros de importação
pm2 logs "SAS Afiliation" --lines 500 | grep -i "contract\|entity\|import"
```

---

### Solução 7: Adicionar campo explicitamente na query

Modificar temporariamente o service para forçar inclusão do campo:

```typescript
// campaigns.service.ts - getAllCampaigns()
const result = await Repository.findAll(CampaignsEntity, {
    limit: 10000
}, [], {
    select: [
        'id', 'commercialPartnerId', 'name', 'startDate', 'endDate',
        'script', 'scriptStatus', 'weighting', 'link', 'linkStatus',
        'active', 'neverStarted', 'createdAt', 'updatedAt' // Incluir explicitamente
    ],
    order: {
        startDate: 'DESC'
    }
});
```

**⚠️ Nota:** Isso força a inclusão do campo, mas não resolve o problema raiz.

---

### Solução 8: Verificar se há problema de tipo

O TypeORM pode estar tendo problema com o tipo `boolean` vs `INTEGER`:

```typescript
// Contract define como boolean
neverStarted!: boolean;

// Mas banco tem INTEGER (0/1)
// TypeORM pode não estar convertendo corretamente
```

**Solução temporária:** Verificar se precisa de transformação customizada.

---

## 🧪 Teste Completo de Diagnóstico

Execute este script completo:

```bash
#!/bin/bash

echo "🔍 Diagnóstico Completo - Campo neverStarted"
echo ""

echo "1️⃣ Verificando coluna no banco..."
sqlite3 /root/1001div/database.sqlite "PRAGMA table_info(sas_campaigns);" | grep -i never
echo ""

echo "2️⃣ Verificando dados no banco..."
sqlite3 /root/1001div/database.sqlite "SELECT id, name, neverStarted, typeof(neverStarted) as tipo FROM sas_campaigns LIMIT 3;"
echo ""

echo "3️⃣ Verificando contract..."
grep -A 3 "neverStarted" sas/packages/sas/contracts/sas-campaigns.contract.ts
echo ""

echo "4️⃣ Verificando logs da API..."
pm2 logs "SAS Afiliation" --lines 50 --nostream | grep -A 5 "neverStarted"
echo ""

echo "5️⃣ Testando rota da API..."
curl -s "https://1001.smartanalytics.center/api/affiliation-manager/campaigns/all?t=$(date +%s)" | jq '.result.data[0] | {id, name, neverStarted}'
echo ""

echo "✅ Diagnóstico concluído"
```

---

## 📊 Checklist de Troubleshooting

- [ ] Coluna existe no banco (verificado com PRAGMA)
- [ ] Dados existem na coluna (verificado com SELECT)
- [ ] Contract define o campo corretamente
- [ ] API foi reiniciada após criar coluna
- [ ] Logs mostram campo sendo buscado?
- [ ] Query SQL inclui a coluna?
- [ ] Nome da coluna está correto (case-sensitive)?
- [ ] Não há transformações filtrando o campo?
- [ ] TypeORM está sincronizado?

---

## 🚨 Se NADA funcionar

Última opção: **Recriar a coluna**

```bash
# 1. Remover coluna
sqlite3 /root/1001div/database.sqlite "ALTER TABLE sas_campaigns DROP COLUMN neverStarted;"

# 2. Recriar coluna
sqlite3 /root/1001div/database.sqlite "ALTER TABLE sas_campaigns ADD COLUMN neverStarted INTEGER NOT NULL DEFAULT 0;"

# 3. Criar índice
sqlite3 /root/1001div/database.sqlite "CREATE INDEX IF NOT EXISTS idx_sas_campaigns_neverStarted ON sas_campaigns(neverStarted);"

# 4. Reiniciar API
pm2 restart "SAS Afiliation"
```

---

## 💡 Próximos Passos Recomendados

1. **Executar diagnóstico completo** (script acima)
2. **Verificar logs com logging ativado**
3. **Testar query raw** para confirmar acesso à coluna
4. **Se necessário, usar select explícito** temporariamente
5. **Investigar transformações/serializações** se persistir

