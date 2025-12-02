# 🔧 Solução para Erro 500 no PUT /tags/:id

## 📋 Problema

O backend retorna erro 500 ao tentar atualizar uma tag porque a coluna `sellerDomain` não existe na tabela `sas_tags`.

## ✅ Soluções Disponíveis

### 🎯 Opção 1: Endpoint Temporário (RECOMENDADO - Mais Fácil)

**Vantagens:**
- ✅ Não requer acesso direto ao banco
- ✅ Pode ser executado via navegador ou Postman
- ✅ Mostra resultado detalhado

**Como usar:**

1. **Certifique-se de que o servidor backend está rodando**

2. **Chame o endpoint via navegador ou ferramenta HTTP:**
   ```
   POST http://localhost:5002/api/affiliation-manager/tags-migration/add-seller-domain
   ```

3. **Ou via curl:**
   ```bash
   curl -X POST http://localhost:5002/api/affiliation-manager/tags-migration/add-seller-domain
   ```

4. **Resposta esperada:**
   ```json
   {
     "success": true,
     "message": "Coluna sellerDomain adicionada com sucesso!",
     "columnExists": false,
     "columns": [...]
   }
   ```

**Após executar:** O endpoint pode ser removido do código se desejar.

---

### 🎯 Opção 2: Script TypeScript (Se tiver tsx instalado)

**Vantagens:**
- ✅ Execução via linha de comando
- ✅ Mostra estrutura completa da tabela

**Como usar:**

1. **Navegue até a pasta da API:**
   ```bash
   cd sas/apps/api
   ```

2. **Execute o script:**
   ```bash
   pnpm tsx src/scripts/fix-seller-domain-simple.ts
   ```
   
   Ou usando o script do package.json:
   ```bash
   pnpm run fix:seller-domain
   ```

3. **Verifique a saída** - deve mostrar:
   ```
   ✅ Coluna sellerDomain adicionada com sucesso!
   ✅ Índice criado com sucesso!
   ```

**Nota:** Este script requer `better-sqlite3` ou `sqlite3` instalado. Se não tiver, use a Opção 1 ou 3.

---

### 🎯 Opção 3: SQL Manual (Se tiver acesso ao banco)

**Vantagens:**
- ✅ Controle total
- ✅ Não requer servidor rodando

**Como usar:**

1. **Se tiver sqlite3 instalado:**
   ```bash
   sqlite3 apps/api/database.sqlite "ALTER TABLE sas_tags ADD COLUMN sellerDomain TEXT NOT NULL DEFAULT '';"
   sqlite3 apps/api/database.sqlite "CREATE INDEX IF NOT EXISTS idx_sas_tags_sellerDomain ON sas_tags(sellerDomain);"
   ```

2. **Ou use uma ferramenta gráfica de SQLite:**
   - DB Browser for SQLite
   - SQLiteStudio
   - Execute os comandos SQL do arquivo `apps/api/add-seller-domain-to-tags.sql`

---

## 🔍 Verificação

Após executar qualquer uma das opções, verifique se funcionou:

### Via Endpoint (Opção 1):
Chame novamente o endpoint - deve retornar `"columnExists": true`

### Via SQL:
```sql
PRAGMA table_info(sas_tags);
```

Deve mostrar a coluna `sellerDomain` na lista.

### Via Teste:
Tente atualizar uma tag no frontend - o erro 500 deve desaparecer.

---

## 🧹 Limpeza (Opcional)

Após confirmar que a coluna foi criada e tudo está funcionando, você pode:

1. **Remover o controller de migration:**
   - Deletar: `packages/sas/api/tags/tags-migration.controller.ts`
   - Remover do módulo: `packages/sas/api/tags/tags.module.ts`

2. **Remover scripts temporários:**
   - `apps/api/src/scripts/fix-seller-domain-simple.ts`
   - `apps/api/src/scripts/check-and-fix-seller-domain.ts`

---

## 📝 Notas

- A coluna será criada com `TEXT NOT NULL DEFAULT ''`
- Um índice será criado automaticamente para melhor performance
- O framework CMMV pode criar a coluna automaticamente em futuras inicializações, mas para bancos existentes, é necessário executar a migration manualmente

---

## ✅ Próximos Passos

1. ✅ Execute uma das opções acima
2. ✅ Verifique se a coluna foi criada
3. ✅ Teste atualizar uma tag no frontend
4. ✅ Se funcionar, o erro 500 deve estar resolvido!

