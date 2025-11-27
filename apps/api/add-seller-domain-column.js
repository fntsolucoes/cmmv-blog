// Script para adicionar a coluna sellerDomain à tabela sas_campaigns
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');

if (!fs.existsSync(dbPath)) {
    console.error('❌ Arquivo database.sqlite não encontrado em:', dbPath);
    process.exit(1);
}

console.log('📂 Conectando ao banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado ao banco de dados SQLite');
});

// Verificar se a coluna já existe
db.all("PRAGMA table_info(sas_campaigns)", (err, rows) => {
    if (err) {
        console.error('❌ Erro ao verificar estrutura da tabela:', err.message);
        db.close();
        process.exit(1);
    }

    const hasSellerDomain = rows.some(row => row.name === 'sellerDomain');
    
    if (hasSellerDomain) {
        console.log('✅ Coluna sellerDomain já existe na tabela sas_campaigns');
        db.close();
        process.exit(0);
    }

    console.log('📝 Adicionando coluna sellerDomain à tabela sas_campaigns...');

    // Adicionar a coluna
    db.run(
        "ALTER TABLE sas_campaigns ADD COLUMN sellerDomain VARCHAR(255) NOT NULL DEFAULT ''",
        (err) => {
            if (err) {
                console.error('❌ Erro ao adicionar coluna:', err.message);
                db.close();
                process.exit(1);
            }

            console.log('✅ Coluna sellerDomain adicionada com sucesso!');
            
            // Verificar novamente
            db.all("PRAGMA table_info(sas_campaigns)", (err, rows) => {
                if (err) {
                    console.error('❌ Erro ao verificar estrutura após adição:', err.message);
                } else {
                    const sellerDomainColumn = rows.find(row => row.name === 'sellerDomain');
                    if (sellerDomainColumn) {
                        console.log('✅ Verificação: Coluna sellerDomain encontrada:', sellerDomainColumn);
                    } else {
                        console.warn('⚠️  Aviso: Coluna sellerDomain não encontrada após adição');
                    }
                }
                db.close();
                console.log('✅ Script concluído!');
            });
        }
    );
});

