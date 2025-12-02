#!/bin/bash

# Script para verificar e adicionar coluna sellerDomain na tabela sas_tags

DB_FILE="apps/api/database.sqlite"
TABLE_NAME="sas_tags"
COLUMN_NAME="sellerDomain"

echo "🔍 Verificando coluna $COLUMN_NAME na tabela $TABLE_NAME..."

# Verificar se o arquivo do banco existe
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Banco de dados não encontrado em: $DB_FILE"
    exit 1
fi

# Verificar se sqlite3 está instalado
if ! command -v sqlite3 &> /dev/null; then
    echo "❌ sqlite3 não encontrado. Instale o sqlite3 primeiro."
    exit 1
fi

# Verificar se a coluna existe
COLUMN_EXISTS=$(sqlite3 "$DB_FILE" "PRAGMA table_info($TABLE_NAME);" | grep -c "$COLUMN_NAME" || echo "0")

if [ "$COLUMN_EXISTS" -eq "0" ]; then
    echo "⚠️  Coluna $COLUMN_NAME não encontrada. Adicionando..."
    
    # Adicionar coluna
    sqlite3 "$DB_FILE" "ALTER TABLE $TABLE_NAME ADD COLUMN $COLUMN_NAME TEXT NOT NULL DEFAULT '';"
    
    # Criar índice
    sqlite3 "$DB_FILE" "CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_${COLUMN_NAME} ON $TABLE_NAME($COLUMN_NAME);"
    
    echo "✅ Coluna $COLUMN_NAME adicionada com sucesso!"
else
    echo "✅ Coluna $COLUMN_NAME já existe na tabela $TABLE_NAME"
fi

# Mostrar estrutura da tabela
echo ""
echo "📋 Estrutura atual da tabela $TABLE_NAME:"
sqlite3 "$DB_FILE" "PRAGMA table_info($TABLE_NAME);" | column -t -s '|'


