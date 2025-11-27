#!/bin/bash
# Script completo para corrigir a constraint NOT NULL na coluna sellerDomain
# Execute este script ANTES de reiniciar o servidor

DB_FILE="./database.sqlite"

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Arquivo database.sqlite não encontrado!"
    exit 1
fi

echo "📂 Corrigindo constraint NOT NULL na coluna sellerDomain..."
echo ""

# 1. Verificar se a coluna existe
echo "1️⃣ Verificando se a coluna sellerDomain existe..."
COLUMN_EXISTS=$(sqlite3 "$DB_FILE" "PRAGMA table_info(sas_campaigns);" | grep -c "sellerDomain" || echo "0")

if [ "$COLUMN_EXISTS" -eq "0" ]; then
    echo "   ⚠️  Coluna sellerDomain não existe. Adicionando..."
    sqlite3 "$DB_FILE" "ALTER TABLE sas_campaigns ADD COLUMN sellerDomain TEXT NOT NULL DEFAULT '';"
    echo "   ✅ Coluna adicionada"
else
    echo "   ✅ Coluna sellerDomain já existe"
fi

# 2. Atualizar todos os registros existentes para ter sellerDomain = ''
echo ""
echo "2️⃣ Atualizando registros existentes..."
BEFORE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sas_campaigns WHERE sellerDomain IS NULL OR sellerDomain = '';" 2>/dev/null || echo "0")
sqlite3 "$DB_FILE" "UPDATE sas_campaigns SET sellerDomain = '' WHERE sellerDomain IS NULL OR sellerDomain = '';"
AFTER_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sas_campaigns WHERE sellerDomain = '';" 2>/dev/null || echo "0")
echo "   📊 Registros atualizados: $AFTER_COUNT"

# 3. Verificar estrutura da tabela
echo ""
echo "3️⃣ Verificando estrutura da tabela..."
sqlite3 "$DB_FILE" "PRAGMA table_info(sas_campaigns);" | grep sellerDomain

# 4. Verificar se há algum registro com sellerDomain NULL (não deveria ter)
echo ""
echo "4️⃣ Verificando registros com sellerDomain NULL..."
NULL_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sas_campaigns WHERE sellerDomain IS NULL;" 2>/dev/null || echo "0")
if [ "$NULL_COUNT" -gt "0" ]; then
    echo "   ⚠️  AINDA EXISTEM $NULL_COUNT registros com sellerDomain NULL!"
    echo "   Tentando corrigir novamente..."
    sqlite3 "$DB_FILE" "UPDATE sas_campaigns SET sellerDomain = '' WHERE sellerDomain IS NULL;"
else
    echo "   ✅ Nenhum registro com sellerDomain NULL encontrado"
fi

echo ""
echo "✅ Script concluído! Agora você pode reiniciar o servidor."
echo "💡 Se o erro persistir, o framework pode estar tentando recriar a tabela."
echo "   Nesse caso, você pode precisar desabilitar temporariamente o synchronize no config.ts"

