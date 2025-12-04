# ✅ SOLUÇÃO FINAL: Campo neverStarted

## 📊 Diagnóstico Confirmado

✅ **Coluna existe no banco:** `neverStarted` (Tipo: boolean, NOT NULL, Default: 0)
✅ **Query raw funciona:** Campo é retornado como INTEGER (0)
❌ **TypeORM Entity:** Precisa verificar se metadados estão carregados na API

---

## 🔍 Problema Identificado

O campo existe no banco e funciona via query raw, mas pode não estar sendo retornado pelo TypeORM na API porque:

1. **Metadados não recarregados** após criar a coluna
2. **TypeORM não reconhece** coluna adicionada manualmente
3. **Cache de metadados** desatualizado

---

## ✅ Solução 1: Reiniciar API (Primeira Tentativa)

```bash
pm2 restart "SAS Afiliation"
```

Aguarde 10 segundos e teste:

```bash
curl "https://1001.smartanalytics.center/api/affiliation-manager/campaigns/all?t=$(date +%s)" | jq '.result.data[0] | {id, name, neverStarted}'
```

---

## ✅ Solução 2: Forçar Select Explícito (Se Solução 1 não funcionar)

Como a query raw funciona, podemos forçar o TypeORM a incluir o campo explicitamente:

### Modificar `campaigns.service.ts`:

```typescript
// Linha ~109 - getAllCampaigns()
const result = await Repository.findAll(CampaignsEntity, {
    limit: 10000
}, [], {
    select: [
        'id', 
        'commercialPartnerId', 
        'name', 
        'startDate', 
        'endDate',
        'script', 
        'scriptStatus', 
        'weighting', 
        'link', 
        'linkStatus',
        'active', 
        'neverStarted', // ✅ Incluir explicitamente
        'createdAt', 
        'updatedAt'
    ],
    order: {
        startDate: 'DESC'
    }
});
```

**Também modificar `getAllCampaignsByPartner()` (linha ~49):**

```typescript
const result = await Repository.findAll(CampaignsEntity, {
    commercialPartnerId: partnerId,
    limit: 10000
}, [], {
    select: [
        'id', 
        'commercialPartnerId', 
        'name', 
        'startDate', 
        'endDate',
        'script', 
        'scriptStatus', 
        'weighting', 
        'link', 
        'linkStatus',
        'active', 
        'neverStarted', // ✅ Incluir explicitamente
        'createdAt', 
        'updatedAt'
    ],
    order: {
        startDate: 'DESC'
    }
});
```

---

## ✅ Solução 3: Usar Query Raw Temporariamente (Workaround)

Se as soluções anteriores não funcionarem, usar query raw como workaround:

```typescript
// campaigns.service.ts - getAllCampaigns()
async getAllCampaigns() {
    const CampaignsEntity = Repository.getEntity("SasCampaignsEntity");
    
    // Workaround: Usar query raw se TypeORM não retornar neverStarted
    const queryRunner = Repository.getDataSource().createQueryRunner();
    
    try {
        const rawResult = await queryRunner.query(`
            SELECT 
                id, commercialPartnerId, name, startDate, endDate,
                script, scriptStatus, weighting, link, linkStatus,
                active, neverStarted, createdAt, updatedAt
            FROM sas_campaigns
            ORDER BY startDate DESC
            LIMIT 10000
        `);
        
        return {
            data: rawResult,
            count: rawResult.length,
            pagination: {
                limit: 10000,
                offset: 0
            }
        };
    } finally {
        await queryRunner.release();
    }
}
```

---

## 🧪 Verificação Após Aplicar Solução

### 1. Verificar logs da API:

```bash
pm2 logs "SAS Afiliation" --lines 100 | grep -A 5 "neverStarted"
```

Procure por:
```
[getAllCampaigns] ✅ Verificação neverStarted na primeira campanha:
  - Campo presente: true
  - Valor: 0
  - Tipo: number
```

### 2. Testar rota:

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

## 📋 Checklist de Implementação

- [ ] Tentar Solução 1 (reiniciar API)
- [ ] Se não funcionar, aplicar Solução 2 (select explícito)
- [ ] Verificar logs da API
- [ ] Testar rota
- [ ] Se campo aparecer, fazer rebuild do frontend
- [ ] Testar em produção

---

## 💡 Recomendação

**Começar com Solução 1** (reiniciar API). Se não funcionar em 2 minutos, aplicar **Solução 2** (select explícito), que é mais garantida já que sabemos que a query raw funciona.

---

## 🔄 Após Resolver

1. **Fazer rebuild do frontend:**
```bash
cd /root/1001div/apps/admin
pnpm run build
```

2. **Reiniciar frontend (se necessário):**
```bash
pm2 restart "SAS Admin" # ou o nome do processo do frontend
```

3. **Testar página:**
Acessar `/affiliation-manager/campaigns` e verificar se o status "Pendência" aparece corretamente.

