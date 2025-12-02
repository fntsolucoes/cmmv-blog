# Análise dos Erros - Tags e Vue Currency Input

## 📋 Resumo dos Problemas

### 1. ⚠️ Warning do Vue: `onUnmounted is called when there is no active component instance`
### 2. ❌ Erro 500: `PUT /api/affiliation-manager/tags/:id`

---

## 🔍 Problema 1: Warning do Vue Currency Input

### Explicação

O warning ocorre porque o plugin `vue-currency-input` está tentando usar lifecycle hooks (`onUnmounted`) durante a inicialização global do plugin, antes de qualquer componente Vue estar montado.

**Stack Trace:**
```
useCurrencyInput @ vue-currency-input.js:524
use @ chunk-JIMQJSX2.js:6049
(anonymous) @ main.ts:10
```

**Localização:** `apps/admin/src/main.ts:10` - onde o plugin é registrado globalmente.

### Impacto

- ⚠️ **Não crítico**: É apenas um warning, não um erro fatal
- ✅ **Funcionalidade**: O plugin geralmente funciona normalmente apesar do warning
- 🐛 **Possível sintoma**: Pode indicar que o plugin não está totalmente compatível com Vue 3

### Soluções

#### ✅ Opção 1: Ignorar o Warning (Recomendado se funciona)
**Quando usar:** Se o `vue-currency-input` está funcionando corretamente nos componentes.

**Ação:** Nenhuma. O warning pode ser ignorado se não afeta a funcionalidade.

**Prós:**
- Sem mudanças no código
- Funcionalidade mantida

**Contras:**
- Warning continua aparecendo no console

---

#### ✅ Opção 2: Registrar o Plugin de Forma Condicional
**Quando usar:** Se quiser eliminar o warning sem mudar de plugin.

**Implementação:**
```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueCurrencyInput from 'vue-currency-input'

const app = createApp(App)
app.use(router)

// Registrar apenas quando necessário, não globalmente
// Ou usar uma versão mais recente do plugin
app.use(VueCurrencyInput, {
    globalOptions: {
        currency: 'BRL',
        locale: 'pt-BR',
        precision: 2,
        autoDecimalDigits: true,
        useGrouping: true,
        accountingSign: false,
        valueAsInteger: false
    }
})

app.mount('#app')
```

**Prós:**
- Mantém o plugin atual
- Pode reduzir o warning

**Contras:**
- Pode não resolver completamente

---

#### ✅ Opção 3: Atualizar ou Substituir o Plugin
**Quando usar:** Se o warning está causando problemas ou se quiser uma solução mais robusta.

**Opções de substituição:**

1. **`v-money3`** (Recomendado para Vue 3)
   ```bash
   npm install v-money3
   ```
   ```typescript
   import VMoney from 'v-money3'
   app.use(VMoney, { precision: 2 })
   ```

2. **`vue3-currency-input`**
   ```bash
   npm install vue3-currency-input
   ```

3. **Atualizar `vue-currency-input`**
   ```bash
   npm update vue-currency-input
   ```

**Prós:**
- Solução mais robusta
- Melhor compatibilidade com Vue 3
- Elimina o warning

**Contras:**
- Requer mudanças nos componentes que usam o plugin
- Pode ter API diferente

---

## 🔍 Problema 2: Erro 500 no PUT /tags/:id

### Explicação

O backend está retornando erro 500 ao tentar atualizar uma tag. Possíveis causas:

1. **Coluna `sellerDomain` não existe no banco de dados**
2. **Formato incorreto do `Repository.update`**
3. **Dados inválidos sendo enviados**
4. **Erro de validação no backend**

### Stack Trace
```
PUT http://localhost:5002/api/affiliation-manager/tags/24c65770-f29b-4e3c-a62c-c202dff0f3cb 500
update @ client.vue3.ts:97
saveTag @ TagsView.vue:722
```

### Soluções

#### ✅ Opção 1: Verificar e Criar a Coluna no Banco (PRIORITÁRIO)

**Problema:** A coluna `sellerDomain` pode não existir na tabela `sas_tags`.

**Solução:**

1. **Verificar se a coluna existe:**
   ```sql
   PRAGMA table_info(sas_tags);
   ```

2. **Se não existir, executar a migration:**
   ```bash
   sqlite3 apps/api/database.sqlite < apps/api/add-seller-domain-to-tags.sql
   ```

3. **Ou executar manualmente:**
   ```sql
   ALTER TABLE sas_tags ADD COLUMN sellerDomain TEXT NOT NULL DEFAULT '';
   CREATE INDEX IF NOT EXISTS idx_sas_tags_sellerDomain ON sas_tags(sellerDomain);
   ```

**Prós:**
- Resolve o problema na raiz
- Necessário para a funcionalidade funcionar

**Contras:**
- Requer acesso ao banco de dados

---

#### ✅ Opção 2: Verificar Logs do Backend

**Ação:** Verificar o console do servidor backend para ver o erro exato.

**O que procurar:**
```
[TagsController.update] ❌ Erro ao atualizar tag: { id: '...', error: '...' }
```

**Prós:**
- Identifica o problema exato
- Permite correção cirúrgica

**Contras:**
- Requer acesso ao terminal do servidor

---

#### ✅ Opção 3: Adicionar Tratamento de Erro Mais Robusto

**Implementação no Controller:**

```typescript
@Put(":id")
async update(@Param("id") id: string, @Body() body: any) {
    const TagsEntity = Repository.getEntity("SasTagsEntity");

    try {
        // Verificar se a tag existe
        const existingTag = await Repository.findOne(TagsEntity, { id }, []);
        if (!existingTag) {
            throw new Error(`Tag com ID ${id} não encontrada`);
        }

        // Normalizar sellerDomain
        if (body && body.sellerDomain !== undefined) {
            body.sellerDomain = String(body.sellerDomain || '').trim();
        }

        // Filtrar apenas campos válidos do contrato
        const validFields = [
            'description',
            'sellerDomain',
            'scriptSettingId',
            'campaignIds',
            'generatedScript',
            'generatedCode',
            'active'
        ];
        
        const updateData: any = {};
        for (const field of validFields) {
            if (field in body) {
                updateData[field] = body[field];
            }
        }

        const result = await Repository.update(TagsEntity, { id }, updateData);
        return result;
    } catch (error: any) {
        console.error("[TagsController.update] ❌ Erro ao atualizar tag:", {
            id,
            body,
            error: error?.message || String(error),
            stack: error?.stack
        });
        throw error;
    }
}
```

**Prós:**
- Melhor tratamento de erros
- Validação de dados
- Logs mais detalhados

**Contras:**
- Requer mudanças no código

---

#### ✅ Opção 4: Verificar Assinatura do Repository.update

**Problema:** Pode haver inconsistência na forma de chamar `Repository.update`.

**Verificar:**
- Alguns lugares usam: `Repository.update(Entity, { id }, body)`
- Outros usam: `Repository.update(Entity, id, body)`

**Solução:** Padronizar para `Repository.update(Entity, { id }, body)` (já corrigido no controller).

---

## 🎯 Plano de Ação Recomendado

### Passo 1: Verificar Banco de Dados (URGENTE)
```bash
sqlite3 apps/api/database.sqlite "PRAGMA table_info(sas_tags);"
```

Se `sellerDomain` não existir:
```bash
sqlite3 apps/api/database.sqlite "ALTER TABLE sas_tags ADD COLUMN sellerDomain TEXT NOT NULL DEFAULT '';"
sqlite3 apps/api/database.sqlite "CREATE INDEX IF NOT EXISTS idx_sas_tags_sellerDomain ON sas_tags(sellerDomain);"
```

### Passo 2: Verificar Logs do Backend
- Abrir terminal do servidor backend
- Tentar atualizar uma tag
- Copiar o erro completo do console

### Passo 3: Aplicar Correções
- Se for problema de coluna: executar migration
- Se for outro erro: aplicar correção específica baseada no log

### Passo 4: Tratar Warning do Vue (Opcional)
- Se não afeta funcionalidade: ignorar
- Se quiser eliminar: considerar substituir o plugin

---

## 📝 Notas Adicionais

1. **O warning do Vue é secundário** - o erro 500 é o problema crítico
2. **A coluna `sellerDomain` precisa existir** - o framework CMMV pode criar automaticamente, mas pode ser necessário executar a migration manualmente
3. **Verificar logs é essencial** - o erro 500 pode ter causas diferentes

