# 🔍 Diagnóstico: Coluna existe mas campo não aparece na API

## ✅ Situação Confirmada

- ✅ Coluna `neverStarted` **EXISTE** no banco de dados
- ✅ Campo `neverStarted` **ESTÁ DEFINIDO** no contract (`sas-campaigns.contract.ts` linha 100-106)
- ❌ Campo `neverStarted` **NÃO APARECE** na resposta da API

---

## 🔍 Possíveis Causas

### 1. ⚠️ TypeORM não sincronizado (mais provável)

O TypeORM pode ter carregado os metadados da entidade **antes** da coluna ser criada, e não recarregou após a migração.

**Solução:**
```bash
# Reiniciar API para recarregar metadados
pm2 restart "SAS Afiliation"
```

### 2. ⚠️ Cache de metadados do TypeORM

O TypeORM pode estar usando metadados em cache que não incluem a nova coluna.

**Solução:**
- Reiniciar API (força recarregamento de metadados)
- Se não funcionar, verificar se há cache de metadados

### 3. ⚠️ Problema na serialização/transformação

O Repository pode estar transformando os dados e excluindo o campo.

**Verificar:**
- Logs do backend devem mostrar o campo se estiver vindo do banco
- Verificar se há transformações customizadas

### 4. ⚠️ TypeORM não reconhece coluna adicionada manualmente

Se a coluna foi adicionada manualmente (não via `synchronize: true`), o TypeORM pode não reconhecê-la até reiniciar.

---

## 🔧 Soluções (em ordem de prioridade)

### Solução 1: Reiniciar API (Mais Simples)

```bash
pm2 restart "SAS Afiliation"
```

**Por quê funciona:**
- Força o TypeORM a recarregar metadados das entidades
- Reconhece colunas adicionadas após a última inicialização

---

### Solução 2: Verificar Logs do Backend

O código já tem logs de debug que verificam o campo:

```bash
pm2 logs "SAS Afiliation" --lines 200 | grep -A 10 "getAllCampaigns\|neverStarted"
```

**Procure por:**
```
[getAllCampaigns] ✅ Verificação neverStarted na primeira campanha:
  - Campo presente: true/false
  - Valor: 0/1
  - Tipo: number/boolean
```

**Se mostrar `Campo presente: false`:**
- TypeORM não está buscando a coluna do banco
- Precisa reiniciar API

**Se mostrar `Campo presente: true`:**
- Campo está vindo do banco
- Problema pode ser na serialização/resposta

---

### Solução 3: Verificar se TypeORM está usando o schema correto

```bash
# Verificar logs do TypeORM (se logging estiver ativo)
pm2 logs "SAS Afiliation" | grep -i "typeorm\|schema\|metadata"
```

---

### Solução 4: Forçar recarregamento de metadados

Se reiniciar não funcionar, pode ser necessário:

1. **Verificar configuração do TypeORM:**
   - Arquivo: `apps/api/src/config.ts`
   - `synchronize: true` deve estar ativo (já está)

2. **Temporariamente ativar logging:**
   ```typescript
   repository: {
       type: 'sqlite',
       database: "./database.sqlite",
       synchronize: true,
       logging: true, // Ativar temporariamente
   }
   ```
   
   Reiniciar e verificar logs para ver se TypeORM reconhece a coluna.

---

### Solução 5: Testar query direta no banco

```bash
# Verificar se coluna realmente existe e tem dados
sqlite3 /root/1001div/database.sqlite "SELECT id, name, neverStarted FROM sas_campaigns LIMIT 5;"
```

**Se retornar dados:**
- ✅ Coluna existe e tem dados
- Problema é no TypeORM/API

**Se der erro:**
- ❌ Coluna não existe ou nome está errado
- Verificar nome exato da coluna

---

## 🧪 Teste Completo

Execute este teste completo:

```bash
# 1. Verificar coluna no banco
sqlite3 /root/1001div/database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted

# 2. Verificar dados
sqlite3 /root/1001div/database.sqlite "SELECT id, name, neverStarted FROM sas_campaigns LIMIT 3;"

# 3. Reiniciar API
pm2 restart "SAS Afiliation"

# 4. Aguardar alguns segundos
sleep 5

# 5. Verificar logs
pm2 logs "SAS Afiliation" --lines 100 | grep -A 5 "neverStarted"

# 6. Testar rota
curl "https://1001.smartanalytics.center/api/affiliation-manager/campaigns/all?t=$(date +%s)" | jq '.result.data[0] | {id, name, neverStarted}'
```

---

## 📊 Resultados Esperados

### Se funcionar após reiniciar:

```json
{
  "id": "...",
  "name": "...",
  "neverStarted": 0
}
```

✅ **Problema resolvido** - Era apenas sincronização do TypeORM

### Se ainda não funcionar:

Verificar:
1. Logs do backend mostram o campo?
2. Query direta no banco retorna o campo?
3. Contract está correto?

---

## 💡 Próximos Passos

1. **Reiniciar API** (solução mais simples)
2. **Verificar logs** para confirmar se campo está sendo buscado
3. **Testar rota** novamente
4. Se ainda não funcionar, investigar transformações/serializações

