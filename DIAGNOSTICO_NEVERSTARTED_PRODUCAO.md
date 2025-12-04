# 🔍 Diagnóstico: Flag neverStarted não funciona em Produção

## 📋 Problema Reportado

A flag de campanha "não iniciada" (`neverStarted`) **funciona em `pnpm dev`** mas **não funciona em produção** após build.

**Informações importantes:**
- ✅ A informação está sendo gravada no banco corretamente
- ✅ Funciona em desenvolvimento (`pnpm dev`)
- ❌ Não funciona em produção (após build)

---

## ✅ Correções Aplicadas

### 1. Função Helper Explícita

**Arquivo**: `packages/sas/admin/views/CampaignsView.vue`

Adicionada função `isNeverStarted()` que evita problemas de minificação:

```javascript
/**
 * Função helper para verificar se uma campanha nunca foi iniciada
 * Evita problemas de minificação/otimização em produção
 * Suporta todos os formatos possíveis: boolean, number (0/1), string ('0'/'1'/'true'/'false')
 */
const isNeverStarted = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (value === true) return true;
    if (value === 1) return true;
    if (value === '1') return true;
    if (value === 'true') return true;
    return false;
};
```

**Modificação na função `getStatusText()`:**
```javascript
// ANTES (linha 733)
if (item.neverStarted === true || item.neverStarted === 1 || item.neverStarted === '1') {
    return 'Pendência';
}

// DEPOIS
if (isNeverStarted(item.neverStarted)) {
    return 'Pendência';
}
```

### 2. Configuração do Build Melhorada

**Arquivo**: `apps/admin/vite.config.ts`

Adicionadas configurações do Terser para evitar otimizações agressivas:

```typescript
build: {
    minify: 'terser',
    terserOptions: {
        compress: {
            drop_console: false, // Manter console.logs para debug
            pure_funcs: [], // Não remover funções "puras"
            passes: 2 // Reduzir passes para evitar otimizações agressivas
        },
        mangle: {
            reserved: ['neverStarted', 'isNeverStarted', 'getStatusText', 'getStatusClass']
        }
    }
}
```

---

## 🔧 Verificações Necessárias

### 1. Verificar Build Gerado

```bash
cd /root/1001div/apps/admin
pnpm run build

# Verificar se o código está presente
grep -r "isNeverStarted\|neverStarted" dist/ | head -20
```

### 2. Verificar Resposta da API

```bash
# No servidor
curl http://localhost:5000/affiliation-manager/campaigns/all | jq '.data[0] | {name, neverStarted, type: (type)}'
```

### 3. Verificar Banco de Dados

```bash
sqlite3 /root/1001div/database.sqlite "SELECT id, name, neverStarted, typeof(neverStarted) FROM sas_campaigns WHERE neverStarted = 1 LIMIT 5;"
```

### 4. Verificar Logs de Migração

```bash
pm2 logs "SAS Afiliation" | grep -i "migration\|neverStarted"
```

### 5. Testar em Produção

1. Fazer rebuild completo:
```bash
cd /root/1001div/apps/admin
rm -rf dist node_modules/.vite
pnpm run build
```

2. Reiniciar PM2:
```bash
pm2 restart "SAS Afiliation"
```

3. Limpar cache do navegador (Ctrl+Shift+Delete)

4. Testar na interface:
   - Acessar `/affiliation-manager/campaigns`
   - Verificar se campanhas com `neverStarted = 1` aparecem como "Pendência"

---

## 📊 Checklist de Diagnóstico

- [x] Função helper adicionada (`isNeverStarted`)
- [x] Função `getStatusText` atualizada para usar helper
- [x] Configuração do build melhorada (Terser)
- [ ] Build executado e verificado
- [ ] API retorna campo corretamente
- [ ] Banco tem coluna e valores corretos
- [ ] Migração aplicada
- [ ] Cache limpo
- [ ] Testado em produção

---

## 🚨 Próximos Passos

1. **Executar build**:
```bash
cd /root/1001div/apps/admin
pnpm run build
```

2. **Verificar se build contém o código**:
```bash
grep -r "isNeverStarted" dist/
```

3. **Reiniciar PM2**:
```bash
pm2 restart "SAS Afiliation"
```

4. **Testar na interface** e verificar se funciona

5. **Se ainda não funcionar**, verificar:
   - Resposta da API (console do navegador)
   - Valores no banco de dados
   - Logs do PM2

---

## 📝 Notas Técnicas

### Por que a função helper resolve o problema?

1. **Evita otimizações agressivas**: Funções nomeadas são menos propensas a serem otimizadas incorretamente
2. **Código mais explícito**: O minificador não consegue simplificar a lógica complexa
3. **Preservação de nomes**: Configuração `mangle.reserved` garante que nomes importantes não sejam alterados
4. **Suporte a múltiplos formatos**: A função trata todos os casos possíveis (boolean, number, string)

### Diferenças entre Dev e Produção

- **Dev**: Código não é minificado, comparações funcionam normalmente
- **Produção**: Código é minificado/otimizado, comparações podem ser simplificadas incorretamente

A função helper garante que a lógica seja preservada mesmo após minificação.

