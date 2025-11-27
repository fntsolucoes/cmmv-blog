#!/bin/bash
# Script para corrigir a constraint NOT NULL na coluna sellerDomain
# Execute este script ANTES de reiniciar o servidor

DB_FILE="./database.sqlite"

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Arquivo database.sqlite não encontrado!"
    exit 1
fi

echo "📂 Corrigindo constraint NOT NULL na coluna sellerDomain..."

# 1. Atualizar todos os registros existentes para ter sellerDomain = ''
echo "📝 Atualizando registros existentes..."
sqlite3 "$DB_FILE" "UPDATE sas_campaigns SET sellerDomain = '' WHERE sellerDomain IS NULL OR sellerDomain = '';"

# 2. Verificar quantos registros foram atualizados
echo "📊 Verificando registros atualizados..."
sqlite3 "$DB_FILE" "SELECT COUNT(*) as total FROM sas_campaigns WHERE sellerDomain = '';"

# 3. Verificar estrutura da tabela
echo "📋 Estrutura da tabela sas_campaigns:"
sqlite3 "$DB_FILE" "PRAGMA table_info(sas_campaigns);" | grep sellerDomain

echo "✅ Script concluído! Agora você pode reiniciar o servidor."

