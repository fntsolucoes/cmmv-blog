#!/bin/bash

# Script para aplicar migração do campo neverStarted na tabela sas_campaigns
# Execute: bash apps/api/apply-neverStarted-migration.sh

set -e  # Parar em caso de erro

DB_PATH="${DATABASE_PATH:-/root/1001div/database.sqlite}"
MIGRATION_FILE="apps/api/add-campaigns-never-started-column.sql"
TABLE_NAME="sas_campaigns"
COLUMN_NAME="neverStarted"

echo "🔍 Verificando migração do campo neverStarted..."
echo "📂 Banco de dados: $DB_PATH"
echo ""

# Verificar se banco existe
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Banco de dados não encontrado em: $DB_PATH"
    exit 1
fi

# Verificar se coluna já existe
echo "1️⃣ Verificando se coluna já existe..."
COLUMN_EXISTS=$(sqlite3 "$DB_PATH" "PRAGMA table_info($TABLE_NAME);" | grep -c "$COLUMN_NAME" || true)

if [ "$COLUMN_EXISTS" -gt 0 ]; then
    echo "✅ Coluna $COLUMN_NAME já existe na tabela $TABLE_NAME"
    echo ""
    echo "📊 Estrutura atual da coluna:"
    sqlite3 "$DB_PATH" "PRAGMA table_info($TABLE_NAME);" | grep "$COLUMN_NAME"
    echo ""
    
    # Verificar valores
    echo "📊 Estatísticas:"
    sqlite3 "$DB_PATH" "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN $COLUMN_NAME = 1 THEN 1 ELSE 0 END) as true_count,
            SUM(CASE WHEN $COLUMN_NAME = 0 THEN 1 ELSE 0 END) as false_count,
            SUM(CASE WHEN $COLUMN_NAME IS NULL THEN 1 ELSE 0 END) as null_count
        FROM $TABLE_NAME;
    " | awk -F'|' '{print "   Total: " $1 "\n   neverStarted = 1: " $2 "\n   neverStarted = 0: " $3 "\n   NULL: " $4}'
    
    exit 0
fi

echo "❌ Coluna $COLUMN_NAME NÃO existe. Aplicando migração..."
echo ""

# Verificar se arquivo de migração existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Arquivo de migração não encontrado: $MIGRATION_FILE"
    echo "💡 Criando migração manualmente..."
    
    # Aplicar migração manualmente
    sqlite3 "$DB_PATH" <<EOF
ALTER TABLE $TABLE_NAME ADD COLUMN $COLUMN_NAME INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_${COLUMN_NAME} ON ${TABLE_NAME}(${COLUMN_NAME});
EOF
    
    echo "✅ Migração aplicada manualmente"
else
    echo "2️⃣ Aplicando migração do arquivo: $MIGRATION_FILE"
    
    # Aplicar migração
    sqlite3 "$DB_PATH" < "$MIGRATION_FILE"
    
    echo "✅ Migração aplicada com sucesso"
fi

echo ""
echo "3️⃣ Verificando se coluna foi criada..."
sqlite3 "$DB_PATH" "PRAGMA table_info($TABLE_NAME);" | grep "$COLUMN_NAME" || {
    echo "❌ Erro: Coluna não foi criada!"
    exit 1
}

echo "✅ Coluna criada com sucesso!"
echo ""

# Verificar estrutura
echo "📊 Estrutura da coluna:"
sqlite3 "$DB_PATH" "PRAGMA table_info($TABLE_NAME);" | grep "$COLUMN_NAME"
echo ""

# Verificar valores
echo "📊 Estatísticas após migração:"
sqlite3 "$DB_PATH" "
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN $COLUMN_NAME = 1 THEN 1 ELSE 0 END) as true_count,
        SUM(CASE WHEN $COLUMN_NAME = 0 THEN 1 ELSE 0 END) as false_count,
        SUM(CASE WHEN $COLUMN_NAME IS NULL THEN 1 ELSE 0 END) as null_count
    FROM $TABLE_NAME;
" | awk -F'|' '{print "   Total: " $1 "\n   neverStarted = 1: " $2 "\n   neverStarted = 0: " $3 "\n   NULL: " $4}'

# Normalizar valores NULL se houver
NULL_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $TABLE_NAME WHERE $COLUMN_NAME IS NULL;")
if [ "$NULL_COUNT" -gt 0 ]; then
    echo ""
    echo "4️⃣ Normalizando $NULL_COUNT valores NULL para 0..."
    sqlite3 "$DB_PATH" "UPDATE $TABLE_NAME SET $COLUMN_NAME = 0 WHERE $COLUMN_NAME IS NULL;"
    echo "✅ Valores normalizados"
fi

echo ""
echo "✅ Migração concluída com sucesso!"
echo ""
echo "💡 Próximos passos:"
echo "   1. Reiniciar a API: pm2 restart 'SAS Afiliation'"
echo "   2. Testar a rota: curl 'https://1001.smartanalytics.center/api/affiliation-manager/campaigns/all?t=\$(date +%s)' | jq '.result.data[0]'"
echo "   3. Verificar se o campo aparece na resposta"

