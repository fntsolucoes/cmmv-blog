# 🔍 Diagnóstico: Erro ECONNREFUSED na Porta 5000

## ❌ Problema
A API não está iniciando na porta 5000, causando erro `ECONNREFUSED` quando o frontend tenta se conectar.

## 🔧 Mudanças Aplicadas

### 1. Import Lazy do Puppeteer
- **Arquivo**: `sas/packages/sas/api/tags/tags.service.ts`
- **Mudança**: Import do `puppeteer` movido para dentro do método `fetchPageHtml()` (lazy import)
- **Motivo**: Evitar que o import trave a inicialização do servidor

### 2. Logs Adicionados no main.ts
- **Arquivo**: `sas/apps/api/src/main.ts`
- **Mudança**: Adicionados logs para rastrear a inicialização
- **Logs adicionados**:
  - `🚀 Iniciando aplicação CMMV...`
  - `📝 Executando migrações...`
  - `✅ Migrações concluídas`
  - `🔧 Criando aplicação CMMV...`
  - `✅ Aplicação CMMV criada com sucesso`
  - `📡 Servidor deve estar escutando na porta 5000`

### 3. Script de Teste Criado
- **Arquivo**: `sas/apps/api/src/scripts/test-server-start.ts`
- **Comando**: `pnpm test-server-start` (ou `tsx src/scripts/test-server-start.ts`)
- **Função**: Testa se os módulos podem ser importados e se a aplicação pode ser criada

## 📋 Como Diagnosticar

### Passo 1: Verificar Logs do Servidor
Quando executar `pnpm dev`, verifique os logs do `cmmv-blog-api:dev`:

**Logs esperados:**
```
🚀 Iniciando aplicação CMMV...
📝 Executando migrações...
✅ Migrações concluídas
🔧 Criando aplicação CMMV...
✅ Aplicação CMMV criada com sucesso
📡 Servidor deve estar escutando na porta 5000
```

**Se não aparecer esses logs:**
- Há um erro antes da inicialização
- Verifique se há erros de importação
- Verifique se há erros nas migrações

### Passo 2: Executar Script de Teste
```bash
cd /mnt/c/Users/ferna/Desktop/Projetos/sas/apps/api
pnpm test-server-start
```

**O que o script testa:**
1. ✅ Imports básicos dos módulos CMMV
2. ✅ Import lazy do puppeteer
3. ✅ Criação da aplicação CMMV

**Se algum teste falhar:**
- O erro será exibido com stack trace
- Isso ajudará a identificar o problema exato

### Passo 3: Verificar se Puppeteer Está Instalado
```bash
cd /mnt/c/Users/ferna/Desktop/Projetos/sas
pnpm list puppeteer
```

**Se não estiver instalado:**
```bash
pnpm install
```

### Passo 4: Verificar Porta 5000
```bash
# Verificar se a porta está em uso
lsof -i :5000
# Ou
netstat -ano | grep 5000
```

**Se a porta estiver em uso:**
- Pare o processo que está usando a porta
- Ou altere a porta no `config.ts`

## 🎯 Possíveis Causas

1. **Puppeteer não instalado** (já corrigido com lazy import)
2. **Erro silencioso na inicialização** (logs adicionados para identificar)
3. **Problema com algum módulo** (script de teste ajudará a identificar)
4. **Porta 5000 já em uso** (verificar com lsof/netstat)
5. **Erro nas migrações** (já tem tratamento, mas verificar logs)

## ✅ Próximos Passos

1. **Reinicie o servidor** e observe os novos logs
2. **Execute o script de teste** para identificar problemas específicos
3. **Compartilhe os logs** se o problema persistir


