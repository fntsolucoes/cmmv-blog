# ✅ Verificação: Campo neverStarted na API

## 📋 Resumo das Verificações

### ✅ O que foi verificado:

1. **Contract**: Campo `neverStarted` está definido no Contract (linha 100-106)
2. **Controller**: Rota `/affiliation-manager/campaigns/all` usa `Repository.findAll` que retorna todos os campos
3. **Service**: Função `getAllCampaigns()` não tem `select` explícito que exclua campos
4. **Logs**: Adicionados logs para verificar se o campo está presente na resposta

---

## 🧪 Como Testar Agora

### 1. Executar Script de Teste

```bash
cd /root/1001div
node test-campaigns-api-neverStarted.js
```

**O que o script verifica:**
- ✅ Se o campo `neverStarted` está presente na resposta
- ✅ Valor e tipo do campo
- ✅ Quantidade de campanhas com `neverStarted = true/1`
- ✅ Lista de todos os campos retornados

### 2. Verificar Logs do PM2

Após fazer uma requisição à API, verificar os logs:

```bash
pm2 logs "SAS Afiliation" | grep -A 5 "getAllCampaigns\|neverStarted"
```

**O que procurar nos logs:**
```
[getAllCampaigns] ✅ Verificação neverStarted na primeira campanha:
  - Campo presente: true/false
  - Valor: 0 ou 1
  - Tipo: number
  - Campanhas com neverStarted = true/1: X
```

### 3. Testar via curl

```bash
curl http://localhost:5000/affiliation-manager/campaigns/all | jq '.data[0] | {name, neverStarted, type: (type)}'
```

### 4. Testar no Console do Navegador

1. Abrir `/affiliation-manager/campaigns` no navegador
2. Abrir console (F12)
3. Executar:
```javascript
const response = await fetch('/api/affiliation-manager/campaigns/all');
const data = await response.json();
const first = data.data[0];
console.log('Campo neverStarted presente:', 'neverStarted' in first);
console.log('Valor:', first?.neverStarted);
console.log('Tipo:', typeof first?.neverStarted);
console.log('Todos os campos:', Object.keys(first));
```

---

## 🔍 Possíveis Resultados

### ✅ Cenário 1: Campo está presente

**Logs mostrarão:**
```
Campo presente: true
Valor: 0 ou 1
Tipo: number
```

**Ação**: O problema é no frontend/build (já corrigido com função helper)

### ❌ Cenário 2: Campo não está presente

**Logs mostrarão:**
```
Campo presente: false
```

**Possíveis causas:**
1. **Schema do banco desatualizado** - Coluna não existe
2. **TypeORM não sincronizado** - Entidade não tem o campo
3. **Problema de serialização** - Campo sendo filtrado

**Verificar:**
```bash
# Verificar se coluna existe no banco
sqlite3 database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted

# Verificar migrações
sqlite3 database.sqlite "SELECT * FROM migrations WHERE name LIKE '%neverStarted%';"
```

---

## 🔧 Correções Aplicadas

### 1. Logs de Debug Adicionados

**Arquivos modificados:**
- `packages/sas/api/campaigns/campaigns.service.ts` - Logs em `getAllCampaigns()`
- `packages/sas/api/campaigns/campaigns.controller.ts` - Logs em `getAll()`

### 2. Script de Teste Criado

**Arquivo**: `test-campaigns-api-neverStarted.js`

Script Node.js para testar a API e verificar o campo.

---

## 📊 Próximos Passos

1. **Executar o script de teste** para confirmar se o campo está presente
2. **Verificar logs do PM2** após uma requisição
3. **Se o campo não estiver presente**:
   - Verificar schema do banco
   - Verificar se migração foi aplicada
   - Verificar se TypeORM está sincronizado
4. **Se o campo estiver presente**:
   - O problema é no frontend (já corrigido)
   - Fazer rebuild do admin
   - Testar em produção

---

## 🚨 Se o Campo Não Estiver Presente

### Solução 1: Verificar Migração

```bash
# Verificar se coluna existe
sqlite3 /root/1001div/database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted

# Se não existir, executar migração manualmente
sqlite3 /root/1001div/database.sqlite < apps/api/add-campaigns-never-started-column.sql
```

### Solução 2: Forçar Sincronização do TypeORM

Se o campo existe no banco mas não aparece na resposta, pode ser problema de sincronização. Verificar configuração do TypeORM em `apps/api/src/config.ts`:

```typescript
repository: {
    type: 'sqlite',
    database: "./database.sqlite",
    synchronize: true, // Deve estar true
    logging: false,
}
```

### Solução 3: Reiniciar API

```bash
pm2 restart "SAS Afiliation"
```

---

## ✅ Checklist Final

- [ ] Script de teste executado
- [ ] Campo verificado na resposta
- [ ] Logs do backend verificados
- [ ] Schema do banco verificado
- [ ] Migrações verificadas
- [ ] Se campo presente: rebuild do frontend feito
- [ ] Testado em produção

