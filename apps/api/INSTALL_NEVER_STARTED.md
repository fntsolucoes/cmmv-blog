# Instalação da Flag `neverStarted` para Campanhas

## O que foi implementado

- ✅ Campo `neverStarted` adicionado no contrato `SasCampaignsContract`
- ✅ Interface atualizada com checkbox no formulário de campanhas
- ✅ Coluna na tabela exibindo ícone de alerta para campanhas nunca iniciadas
- ✅ Script de migração SQL criado
- ✅ **Migração automática no startup do servidor**

## O que precisa ser feito no servidor

### ✅ Migração Automática

A migração SQL será executada **automaticamente** quando o servidor iniciar. O script `run-migrations.ts` verifica se a coluna já existe e executa a migração apenas se necessário (idempotente).

**Não é necessário executar nada manualmente!** Apenas:

1. Fazer `git pull` no servidor
2. Reiniciar o servidor (PM2 ou outro gerenciador)

```bash
# Se estiver usando PM2
pm2 restart all

# Ou se estiver usando outro gerenciador de processos
# Reinicie o servidor normalmente
```

### Execução Manual (Opcional)

Se preferir executar manualmente antes de reiniciar:

```bash
cd /caminho/para/sas/apps/api
pnpm run migrate
```

**OU** execute o script SQL diretamente:

```bash
cd /caminho/para/sas/apps/api
sqlite3 database.sqlite < add-campaigns-never-started-column.sql
```

### 3. Verificar se tudo está funcionando

1. Acesse a página `/affiliation-manager/campaigns`
2. Crie ou edite uma campanha
3. Verifique se o checkbox "Campanha nunca foi iniciada" aparece
4. Verifique se a coluna "Nunca Iniciada" aparece na tabela

## Arquivos que serão atualizados automaticamente

Quando o servidor reiniciar, o CMMV irá regenerar automaticamente:

- `apps/api/.generated/entities/affiliation-manager/sascampaigns.entity.ts`
- `apps/api/.generated/models/affiliation-manager/sascampaigns.model.ts`

Esses arquivos são gerados baseados no contrato `packages/sas/contracts/sas-campaigns.contract.ts`, que já foi atualizado.

## Verificação

Para verificar se a migração foi aplicada corretamente:

```bash
sqlite3 database.sqlite "PRAGMA table_info(sas_campaigns);" | grep -i never
```

Deve retornar algo como:
```
14|neverStarted|INTEGER|1|1|0
```

## Troubleshooting

### Erro: "no such column: neverStarted"

**Causa**: A migração SQL não foi executada.

**Solução**: Execute o script de instalação ou a migração SQL manualmente.

### Erro: "Property 'neverStarted' does not exist"

**Causa**: Os arquivos gerados ainda não foram atualizados.

**Solução**: Reinicie o servidor para que o CMMV regenere os arquivos.

### Checkbox não aparece na interface

**Causa**: O build do frontend não foi atualizado.

**Solução**: 
```bash
cd apps/admin
pnpm build
# Ou se estiver em desenvolvimento, apenas reinicie o servidor de dev
```

