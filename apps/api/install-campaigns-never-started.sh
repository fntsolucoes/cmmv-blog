#!/bin/bash

# Script de instalação da flag neverStarted para campanhas
# Este script deve ser executado no servidor após fazer git pull

set -e  # Para na primeira erro

echo "🔄 Instalando flag 'neverStarted' para campanhas..."

# Caminho do banco de dados (ajuste se necessário)
DB_PATH="${DB_PATH:-database.sqlite}"
MIGRATION_FILE="add-campaigns-never-started-column.sql"

# Verificar se o arquivo de migração existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Erro: Arquivo de migração '$MIGRATION_FILE' não encontrado!"
    exit 1
fi

# Verificar se o banco de dados existe
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Erro: Banco de dados '$DB_PATH' não encontrado!"
    exit 1
fi

# Verificar se sqlite3 está instalado
if ! command -v sqlite3 &> /dev/null; then
    echo "❌ Erro: sqlite3 não está instalado!"
    echo "   Instale com: apt-get install sqlite3"
    exit 1
fi

# Verificar se a coluna já existe
if sqlite3 "$DB_PATH" "PRAGMA table_info(sas_campaigns);" | grep -qi "neverStarted"; then
    echo "✅ Coluna 'neverStarted' já existe. Pulando migração."
else
    echo "📝 Executando migração SQL..."
    
    # Executar a migração
    if sqlite3 "$DB_PATH" < "$MIGRATION_FILE"; then
        echo "✅ Migração executada com sucesso!"
    else
        echo "❌ Erro ao executar migração!"
        exit 1
    fi
fi

# Verificar se a coluna foi criada corretamente
if sqlite3 "$DB_PATH" "PRAGMA table_info(sas_campaigns);" | grep -qi "neverStarted"; then
    echo "✅ Coluna 'neverStarted' verificada no banco de dados."
    
    # Contar campanhas
    TOTAL=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sas_campaigns;")
    NUNCA_INICIADAS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sas_campaigns WHERE neverStarted = 1;")
    
    echo "📊 Estatísticas:"
    echo "   - Total de campanhas: $TOTAL"
    echo "   - Campanhas nunca iniciadas: $NUNCA_INICIADAS"
else
    echo "❌ Erro: Coluna 'neverStarted' não foi criada!"
    exit 1
fi

echo "✅ Instalação concluída com sucesso!"

