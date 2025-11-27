#!/bin/bash
# Script para adicionar a coluna sellerDomain à tabela sas_campaigns

DB_FILE="./database.sqlite"

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Arquivo database.sqlite não encontrado!"
    exit 1
fi

echo "📂 Adicionando coluna sellerDomain à tabela sas_campaigns..."

# Verificar se a coluna já existe
sqlite3 "$DB_FILE" "PRAGMA table_info(sas_campaigns);" | grep -q "sellerDomain"

if [ $? -eq 0 ]; then
    echo "✅ Coluna sellerDomain já existe!"
    exit 0
fi

# Adicionar a coluna
sqlite3 "$DB_FILE" "ALTER TABLE sas_campaigns ADD COLUMN sellerDomain VARCHAR(255) NOT NULL DEFAULT '';"

if [ $? -eq 0 ]; then
    echo "✅ Coluna sellerDomain adicionada com sucesso!"
    echo "📋 Verificando estrutura da tabela:"
    sqlite3 "$DB_FILE" "PRAGMA table_info(sas_campaigns);" | grep sellerDomain
else
    echo "❌ Erro ao adicionar coluna!"
    exit 1
fi

