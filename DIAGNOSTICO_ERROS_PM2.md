# Diagnóstico de Erros PM2 - SAS Affiliation

## 📋 Resumo dos Problemas

### 1. ❌ Erro Crítico: Build não executado
**Erro**: `command (/root/1001div/apps/web) /root/.nvm/versions/node/v22.15.1/bin/pnpm run start exited (1)`

**Causa**: O script `start` tenta executar `node dist/server.js`, mas o diretório `dist` não existe porque o build não foi executado.

**Solução**: Executar o build antes de iniciar o servidor.

---

### 2. ⚠️ Erro do Vite: Arquivo de assets não encontrado
**Erro**: `[vite] Pre-transform error: Failed to load url /assets/index-BuL_VEpu.js`

**Causa**: O Vite está tentando servir arquivos de assets que não foram gerados porque o build do cliente não foi executado.

**Solução**: Executar o build do cliente antes de iniciar em produção.

---

### 3. ⚠️ Aviso: Configuração undefined
**Aviso**: `adSenseSidebarLeft value in PagePost: undefined`

**Causa**: A configuração `blog.adSenseSidebarLeft` não está sendo carregada corretamente do banco de dados ou não existe.

**Solução**: Verificar se a configuração existe no banco e se está sendo carregada corretamente.

---

### 4. ⚠️ Erro 401: Autenticação
**Erro**: `GET /affiliate/special-dates (0ms) 401`

**Causa**: Requisição sem autenticação válida.

**Solução**: Verificar se o token de autenticação está sendo enviado corretamente.

---

## 🔧 Soluções Implementadas

### Solução 1: Script de Build Automático

O script `start` foi modificado para verificar se o build existe e executá-lo automaticamente se necessário.

### Solução 2: Verificação de Build no PM2

Adicionar verificação no ecosystem.config.cjs para garantir que o build seja executado antes de iniciar.

### Solução 3: Tratamento de Configuração Undefined

Adicionar fallback para valores undefined nas configurações de ads.

---

## 📝 Comandos para Resolver

### 1. Executar Build Manualmente

```bash
cd /root/1001div/apps/web
pnpm run build
```

Ou na raiz do projeto:

```bash
cd /root/1001div
pnpm run build:web
```

### 2. Verificar se o Build foi Executado

```bash
ls -la /root/1001div/apps/web/dist/
```

Deve conter:
- `server.js`
- `entry-server.js`
- `assets/` (diretório com os arquivos buildados)

### 3. Reiniciar PM2 após Build

```bash
pm2 restart "SAS Afil"
```

### 4. Verificar Logs após Reiniciar

```bash
pm2 logs "SAS Afil" --lines 50
```

---

## 🛠️ Correções Aplicadas

### 1. Script de Start Melhorado ✅

- Adicionado hook `prestart` que executa `check-build` antes de iniciar
- Script `check-build.js` verifica se todos os arquivos necessários existem
- Se o build não existir, executa automaticamente antes de iniciar

**Arquivos modificados:**
- `apps/web/package.json` - Adicionado `prestart` e `check-build`
- `apps/web/scripts/check-build.js` - Novo script de verificação

### 2. Tratamento de Configuração Undefined ✅

- Removido log desnecessário quando `adSenseSidebarLeft` é undefined
- Log agora só aparece quando há valor definido (evita spam nos logs)

**Arquivos modificados:**
- `apps/web/src/theme-pitadagourmet/views/PagePost.vue` - Log condicional

### 3. Configuração PM2 Melhorada ✅

- Adicionados caminhos explícitos para logs
- Configuração de restart automático
- Formato de data nos logs

**Arquivos modificados:**
- `ecosystem.config.cjs` - Configuração melhorada

---

## 🔍 Verificações Adicionais

### Verificar Configuração no Banco

```sql
SELECT * FROM settings WHERE key = 'blog.adSenseSidebarLeft';
```

### Verificar se API está Respondendo

```bash
curl http://localhost:5000/settings
```

### Verificar Portas

```bash
netstat -tulpn | grep -E '5000|5001|5002'
```

---

## 📊 Status Atual

- ✅ **API**: Funcionando (logs mostram requisições 200)
- ❌ **Web App**: Falhando (build não executado)
- ⚠️ **Configurações**: Algumas undefined
- ⚠️ **Autenticação**: Algumas requisições 401 (normal para rotas protegidas)

---

## 🚀 Próximos Passos

### Passo 1: Executar Build (se necessário)

O script agora executa automaticamente, mas você pode executar manualmente:

```bash
cd /root/1001div/apps/web
pnpm run build
```

Ou verificar se precisa de build:

```bash
cd /root/1001div/apps/web
pnpm run check-build
```

### Passo 2: Reiniciar PM2

```bash
pm2 restart "SAS Afiliation"
```

Ou se não estiver rodando:

```bash
cd /root/1001div
pm2 start ecosystem.config.cjs
```

### Passo 3: Monitorar Logs

```bash
pm2 logs "SAS Afiliation" --lines 50
```

### Passo 4: Verificar Status

```bash
pm2 status
pm2 info "SAS Afiliation"
```

### Passo 5: Verificar Configurações (se necessário)

Se `adSenseSidebarLeft` continuar undefined, verificar no banco:

```sql
SELECT * FROM settings WHERE key LIKE '%adSense%';
```

E garantir que a configuração existe no admin.

