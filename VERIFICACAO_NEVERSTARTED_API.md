# 🔍 Verificação: Campo neverStarted na API

## 📋 Objetivo

Verificar se a rota que retorna a listagem de campanhas (`/affiliation-manager/campaigns/all`) inclui o campo `neverStarted` na resposta.

---

## ✅ Verificações Implementadas

### 1. Logs Adicionados no Backend

**Arquivo**: `packages/sas/api/campaigns/campaigns.service.ts`

Adicionados logs na função `getAllCampaigns()` para verificar:
- Se o campo `neverStarted` está presente na resposta
- Valor e tipo do campo
- Quantidade de campanhas com `neverStarted = true/1`

**Arquivo**: `packages/sas/api/campaigns/campaigns.controller.ts`

Adicionados logs na rota `GET /affiliation-manager/campaigns` para verificar o campo.

### 2. Script de Teste Criado

**Arquivo**: `test-campaigns-api-neverStarted.js`

Script Node.js para testar a API e verificar se o campo está presente.

---

## 🧪 Como Testar

### Opção 1: Usar o Script de Teste

```bash
cd /root/1001div
node test-campaigns-api-neverStarted.js
```

Ou com URL customizada:
```bash
API_URL=http://localhost:5000 node test-campaigns-api-neverStarted.js
```

### Opção 2: Usar curl

```bash
curl http://localhost:5000/affiliation-manager/campaigns/all | jq '.data[0] | {name, neverStarted, type: (type)}'
```

### Opção 3: Verificar Logs do PM2

```bash
pm2 logs "SAS Afiliation" | grep -i "neverStarted\|getAllCampaigns"
```

### Opção 4: Testar no Navegador

1. Abrir console do navegador (F12)
2. Acessar `/affiliation-manager/campaigns`
3. No console, executar:
```javascript
const response = await fetch('/api/affiliation-manager/campaigns/all');
const data = await response.json();
console.log('Primeira campanha:', data.data[0]);
console.log('neverStarted presente:', 'neverStarted' in data.data[0]);
console.log('neverStarted valor:', data.data[0]?.neverStarted);
```

---

## 📊 O que Verificar

### ✅ Campo Presente

Se o campo estiver presente, você verá:
- `neverStarted presente: true`
- `neverStarted valor: 0 ou 1`
- `neverStarted tipo: number` (SQLite retorna como INTEGER)

### ❌ Campo Ausente

Se o campo NÃO estiver presente, você verá:
- `neverStarted presente: false`
- Lista de campos não inclui `neverStarted`

---

## 🔧 Possíveis Problemas e Soluções

### Problema 1: Campo não está no Contract

**Sintoma**: Campo não aparece na resposta

**Solução**: Já verificado - o campo está no Contract (linha 100-106)

### Problema 2: Schema do banco desatualizado

**Sintoma**: Campo não existe no banco

**Verificar**:
```bash
sqlite3 database.sqlite "PRAGMA table_info(sas_campaigns);" | grep neverStarted
```

**Solução**: Executar migração:
```bash
# Verificar se migração foi aplicada
sqlite3 database.sqlite "SELECT * FROM migrations WHERE name LIKE '%neverStarted%';"
```

### Problema 3: Repository não retorna o campo

**Sintoma**: Campo existe no banco mas não na resposta

**Possíveis causas**:
- TypeORM não está sincronizado com o schema
- Campo está sendo filtrado em algum lugar
- Problema de serialização

**Solução**: Verificar logs adicionados e verificar se o campo aparece nos logs.

---

## 📝 Próximos Passos

1. **Executar o script de teste** para verificar se o campo está presente
2. **Verificar logs do PM2** após fazer uma requisição
3. **Se o campo não estiver presente**, verificar:
   - Schema do banco
   - Migrações aplicadas
   - Logs do backend
4. **Se o campo estiver presente mas não funcionar no frontend**, o problema é no build/minificação (já corrigido)

---

## 🔍 Checklist

- [ ] Script de teste executado
- [ ] Campo verificado na resposta da API
- [ ] Logs do backend verificados
- [ ] Schema do banco verificado
- [ ] Migrações verificadas
- [ ] Frontend recebendo o campo corretamente

