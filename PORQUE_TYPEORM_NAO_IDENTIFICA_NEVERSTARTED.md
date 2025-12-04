# 🔍 Por que o TypeORM não identifica o campo `neverStarted`?

## 📊 Situação Atual

✅ **Contract define o campo** (`sas-campaigns.contract.ts` linha 100-106)
✅ **Coluna existe no banco** (verificado via PRAGMA)
✅ **Query raw funciona** (testado com sucesso)
❌ **TypeORM não retorna o campo** na resposta da API

---

## 🔍 Causa Raiz

### 1. **Metadados do TypeORM são carregados na inicialização**

O TypeORM carrega os metadados das entidades **apenas uma vez**, quando a aplicação inicia:

```
Inicialização da API
    ↓
Carregamento de Contracts
    ↓
Conversão de Contracts → TypeORM Entities
    ↓
Geração de Metadados (schema, colunas, tipos)
    ↓
Cache de Metadados em memória
    ↓
API pronta para uso
```

**Problema:** Se a coluna foi adicionada **depois** que a API iniciou, os metadados em cache **não incluem** essa coluna.

---

### 2. **`synchronize: true` não adiciona colunas existentes**

O `synchronize: true` do TypeORM funciona assim:

- ✅ **Cria tabelas** que não existem
- ✅ **Adiciona colunas** que não existem (se a tabela foi criada pelo TypeORM)
- ❌ **NÃO adiciona colunas** que foram criadas manualmente após a inicialização
- ❌ **NÃO atualiza metadados** de colunas adicionadas manualmente

**Por quê?** O TypeORM compara o schema do banco com os metadados das entidades. Se a coluna existe no banco mas não está nos metadados, ele **ignora** porque assume que foi adicionada manualmente e não deve ser gerenciada.

---

### 3. **Sistema usa Contracts → Entities (conversão em tempo de build/startup)**

O sistema CMMV usa uma arquitetura de **Contracts** que são convertidos para **TypeORM Entities**:

```
Contract (TypeScript Class com decorators)
    ↓
Processamento em tempo de inicialização
    ↓
Geração de Entity Metadata
    ↓
TypeORM usa os metadados gerados
```

**Problema:** Os metadados são gerados **baseados no Contract**, não no banco de dados real. Se você adicionar uma coluna no banco **depois** que os metadados foram gerados, o TypeORM não sabe sobre ela.

---

### 4. **Cache de metadados não é invalidado**

O TypeORM mantém os metadados em cache durante toda a execução da aplicação. Mesmo que:

- ✅ A coluna exista no banco
- ✅ O Contract defina o campo
- ✅ Você reinicie a API

Se os metadados foram gerados **antes** da coluna existir, eles podem estar desatualizados.

---

## 🔧 Por que o `select` explícito falhou?

Quando você usa `select` explícito:

```typescript
select: ['id', 'name', 'neverStarted', ...]
```

O TypeORM **valida** se cada campo no `select` existe nos metadados da entidade. Como `neverStarted` não está nos metadados (ou está desatualizado), ele:

1. ❌ Rejeita a query
2. ❌ Retorna 0 resultados
3. ❌ Ou lança um erro

---

## ✅ Soluções Implementadas

### Solução Atual: Fallback com Query Raw

A solução implementada funciona assim:

1. **Tenta buscar normalmente** com `Repository.findAll` (sem select)
2. **Verifica se `neverStarted` está presente** no resultado
3. **Se não estiver**, faz uma query raw para buscar apenas `id` e `neverStarted`
4. **Mescla os dados** manualmente

**Por que funciona:**
- ✅ Não depende dos metadados do TypeORM
- ✅ Usa query raw que acessa diretamente o banco
- ✅ Transparente para o frontend

---

## 🔄 Como fazer o TypeORM reconhecer (Soluções Permanentes)

### Solução 1: Reiniciar API após criar coluna

```bash
# 1. Criar coluna
sqlite3 database.sqlite < apps/api/add-campaigns-never-started-column.sql

# 2. Reiniciar API (força recarregamento de metadados)
pm2 restart "SAS Afiliation"
```

**Funciona se:**
- O Contract já tinha o campo definido
- A API recarrega os metadados corretamente

---

### Solução 2: Usar `synchronize: true` desde o início

Se você tivesse `synchronize: true` **antes** de criar a coluna, o TypeORM teria criado automaticamente. Mas como a coluna já existe, isso não ajuda mais.

---

### Solução 3: Forçar recarregamento de metadados

Algumas opções (mais complexas):

1. **Limpar cache de metadados** (se houver)
2. **Recompilar/rebuild** a aplicação
3. **Forçar TypeORM a ler schema do banco** (não padrão)

---

## 📊 Resumo Técnico

| Componente | Status | Explicação |
|------------|--------|------------|
| **Contract** | ✅ Correto | Campo `neverStarted` definido |
| **Banco de Dados** | ✅ Correto | Coluna existe e funciona |
| **Query Raw** | ✅ Funciona | Acessa banco diretamente |
| **TypeORM Metadados** | ❌ Desatualizado | Gerado antes da coluna existir |
| **TypeORM Entity** | ❌ Não reconhece | Baseado em metadados desatualizados |

---

## 💡 Por que a solução atual é a melhor?

A solução de fallback com query raw é a melhor porque:

1. ✅ **Não depende de metadados** do TypeORM
2. ✅ **Funciona imediatamente** sem reiniciar
3. ✅ **Transparente** para o frontend
4. ✅ **Resiliente** a mudanças futuras
5. ✅ **Não quebra** se metadados estiverem desatualizados

---

## 🔮 Solução Ideal (Futuro)

Para evitar esse problema no futuro:

1. **Sempre adicionar campos no Contract primeiro**
2. **Usar migrações SQL** para criar colunas
3. **Reiniciar API** após migrações
4. **Ou usar `synchronize: true`** em desenvolvimento (não em produção)

---

## 📝 Conclusão

O TypeORM não identifica o campo porque:

1. **Metadados foram gerados antes** da coluna existir
2. **Cache de metadados não é atualizado** automaticamente
3. **`synchronize: true` não ajuda** com colunas já existentes
4. **Sistema usa Contracts** que geram metadados em tempo de inicialização

A solução de fallback com query raw resolve o problema de forma robusta e não depende dos metadados do TypeORM.

