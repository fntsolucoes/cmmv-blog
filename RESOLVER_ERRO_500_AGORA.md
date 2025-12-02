# 🚨 Resolver Erro 500 - Instruções Imediatas

## ⚡ Solução Rápida (2 minutos)

### Passo 1: Executar Migration

**Abra o navegador e acesse (ou use curl/Postman):**

```
POST http://localhost:5002/api/affiliation-manager/tags-migration/add-seller-domain
```

**Ou via curl:**
```bash
curl -X POST http://localhost:5002/api/affiliation-manager/tags-migration/add-seller-domain
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Coluna sellerDomain adicionada com sucesso!",
  "columnExists": false
}
```

### Passo 2: Testar

1. Volte ao frontend
2. Tente atualizar uma tag
3. O erro 500 deve desaparecer ✅

---

## 🔍 Se Ainda Não Funcionar

### Verificar Logs do Backend

1. **Abra o terminal onde o servidor backend está rodando**
2. **Procure por estas mensagens quando tentar salvar:**

```
[TagsController.update] Atualizando tag: { id: '...', updateData: {...} }
[TagsController.update] ❌ Erro ao atualizar tag: { ... }
```

3. **Copie o erro completo** e me envie

### Verificar se a Migration Automática Rodou

Procure no terminal do backend por:

```
[DatabaseMigrationsService] 🔄 Iniciando migrations automáticas...
[DatabaseMigrationsService] ✅ Coluna sellerDomain adicionada com sucesso
```

**Se não aparecer:**
- A migration automática pode não ter executado ainda
- Use o endpoint manual acima

---

## 🛡️ Proteções Implementadas

O código agora tem **3 camadas de proteção**:

1. **✅ Verificação prévia**: Verifica se a coluna existe antes de tentar atualizar
2. **✅ Remoção automática**: Remove `sellerDomain` do update se a coluna não existir
3. **✅ Criação automática**: Tenta criar a coluna se houver erro relacionado

**Mas ainda é necessário criar a coluna uma vez** - use o endpoint acima.

---

## 📋 Checklist

- [ ] Servidor backend está rodando
- [ ] Executei o endpoint de migration
- [ ] Recebi resposta `"success": true`
- [ ] Tentei atualizar uma tag no frontend
- [ ] Verifiquei os logs do backend

---

## 🎯 Próximo Passo

**Execute o endpoint de migration AGORA** e me diga o resultado!


