# 🚀 Solução Rápida para Erros PM2

## ⚡ Solução Imediata (1 minuto)

Execute estes comandos na ordem:

```bash
# 1. Ir para o diretório do projeto
cd /root/1001div

# 2. Verificar e executar build se necessário
cd apps/web
pnpm run check-build

# 3. Voltar para raiz e reiniciar PM2
cd ../..
pm2 restart "SAS Afiliation"

# 4. Verificar logs
pm2 logs "SAS Afiliation" --lines 20
```

## ✅ O que foi corrigido

1. **Build automático**: O script agora verifica e executa build automaticamente
2. **Logs limpos**: Removido log desnecessário de `adSenseSidebarLeft undefined`
3. **PM2 configurado**: Logs organizados e restart automático

## 🔍 Verificar se está funcionando

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs "SAS Afiliation" --lines 50

# Verificar se o servidor está respondendo
curl http://localhost:5001
```

## ❌ Se ainda houver erros

1. **Erro de build**: Verificar se todas as dependências estão instaladas
   ```bash
   cd /root/1001div
   pnpm install
   ```

2. **Erro de porta**: Verificar se a porta 5001 está livre
   ```bash
   netstat -tulpn | grep 5001
   ```

3. **Erro de permissões**: Verificar permissões do diretório dist
   ```bash
   ls -la /root/1001div/apps/web/dist/
   ```

## 📞 Suporte

Se os problemas persistirem, verificar:
- Logs completos: `pm2 logs "SAS Afiliation" --err --lines 100`
- Status do PM2: `pm2 status`
- Processos Node: `ps aux | grep node`

