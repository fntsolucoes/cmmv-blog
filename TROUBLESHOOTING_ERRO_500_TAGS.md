# 🔧 Troubleshooting: Erro 500 ao Salvar Tag

## 🎯 Solução Rápida

### Passo 1: Executar Migration Manualmente

**Opção A - Via Endpoint (Mais Fácil):**

1. Certifique-se de que o servidor backend está rodando
2. Abra o navegador ou use Postman/curl:
   ```
   POST http://localhost:5002/api/affiliation-manager/tags-migration/add-seller-domain
   ```
3. Verifique a resposta - deve mostrar `"success": true`

**Opção B - Verificar Logs do Backend:**

1. Abra o terminal onde o servidor backend está rodando
2. Procure por mensagens como:
   ```
   [DatabaseMigrationsService] 🔄 Iniciando migrations automáticas...
   [DatabaseMigrationsService] ✅ Coluna sellerDomain adicionada com sucesso
   ```

### Passo 2: Verificar se a Coluna Foi Criada

Após executar a migration, tente atualizar uma tag novamente. O erro 500 deve desaparecer.

---

## 🔍 Diagnóstico Detalhado

### Verificar Logs do Backend

Quando você tenta salvar uma tag, o backend deve mostrar logs como:

```
[TagsController.update] Atualizando tag: { id: '...', updateData: {...} }
[TagsController.update] ❌ Erro ao atualizar tag: { ... }
```

**Copie o erro completo** do terminal do backend e me envie para análise.

### Possíveis Causas

1. **Coluna não existe** (mais provável)
   - **Solução**: Execute o endpoint de migration acima

2. **Erro no formato do Repository.update**
   - **Solução**: Já corrigido no código, mas pode precisar reiniciar o servidor

3. **Erro de permissão no banco**
   - **Solução**: Verifique permissões do arquivo `database.sqlite`

4. **Banco de dados corrompido**
   - **Solução**: Faça backup e recrie o banco

---

## 🛠️ Soluções Implementadas

### 1. Fallback Automático no Controller

O controller agora:
- ✅ Verifica se a coluna existe antes de tentar atualizar
- ✅ Remove `sellerDomain` do update se a coluna não existir
- ✅ Tenta criar a coluna automaticamente se houver erro relacionado

### 2. Endpoint de Migration

Endpoint disponível:
- `POST /api/affiliation-manager/tags-migration/add-seller-domain`
- Pode ser chamado a qualquer momento
- É idempotente (pode ser executado múltiplas vezes)

### 3. Sistema de Migrations Automáticas

- Executa automaticamente na inicialização
- Sistema de retry integrado
- Logs detalhados

---

## 📋 Checklist de Verificação

- [ ] Servidor backend está rodando
- [ ] Endpoint de migration foi executado (ou migration automática rodou)
- [ ] Logs do backend mostram sucesso na criação da coluna
- [ ] Tentei atualizar uma tag novamente
- [ ] Verifiquei os logs do backend para o erro específico

---

## 🚨 Se Nada Funcionar

1. **Copie o erro completo do backend** (terminal onde o servidor está rodando)
2. **Verifique se o banco de dados existe** em `apps/api/database.sqlite`
3. **Tente criar uma tag nova** (não apenas atualizar) para ver se o erro é específico de update
4. **Verifique se há outras colunas faltando** - o erro pode ser de outra coluna

---

## 📞 Informações para Debug

Quando reportar o problema, inclua:

1. **Erro completo do backend** (console do servidor)
2. **Resposta do endpoint de migration** (se executou)
3. **Dados sendo enviados** (body da requisição PUT)
4. **Versão do Node.js** (`node --version`)
5. **Sistema operacional**

