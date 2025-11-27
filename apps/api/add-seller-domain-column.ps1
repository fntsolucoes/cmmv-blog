# Script PowerShell para adicionar a coluna sellerDomain à tabela sas_campaigns
# Execute: .\add-seller-domain-column.ps1

$dbFile = ".\database.sqlite"

if (-not (Test-Path $dbFile)) {
    Write-Host "❌ Arquivo database.sqlite não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Adicionando coluna sellerDomain à tabela sas_campaigns..." -ForegroundColor Yellow

# Verificar se sqlite3 está disponível
$sqlite3Path = Get-Command sqlite3 -ErrorAction SilentlyContinue
if (-not $sqlite3Path) {
    Write-Host "❌ sqlite3 não encontrado no PATH. Por favor, instale o SQLite ou adicione ao PATH." -ForegroundColor Red
    Write-Host "💡 Alternativa: Execute o SQL manualmente:" -ForegroundColor Yellow
    Write-Host "   sqlite3 database.sqlite \"ALTER TABLE sas_campaigns ADD COLUMN sellerDomain VARCHAR(255) NOT NULL DEFAULT '';\"" -ForegroundColor Cyan
    exit 1
}

# Verificar se a coluna já existe
$checkColumn = sqlite3 $dbFile "PRAGMA table_info(sas_campaigns);" | Select-String "sellerDomain"

if ($checkColumn) {
    Write-Host "✅ Coluna sellerDomain já existe!" -ForegroundColor Green
    exit 0
}

# Adicionar a coluna
$result = sqlite3 $dbFile "ALTER TABLE sas_campaigns ADD COLUMN sellerDomain VARCHAR(255) NOT NULL DEFAULT '';"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Coluna sellerDomain adicionada com sucesso!" -ForegroundColor Green
    Write-Host "📋 Verificando estrutura da tabela:" -ForegroundColor Yellow
    sqlite3 $dbFile "PRAGMA table_info(sas_campaigns);" | Select-String "sellerDomain"
} else {
    Write-Host "❌ Erro ao adicionar coluna!" -ForegroundColor Red
    exit 1
}

