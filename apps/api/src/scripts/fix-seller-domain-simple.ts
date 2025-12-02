/**
 * Script simples para adicionar coluna sellerDomain na tabela sas_tags
 * 
 * Uso: tsx apps/api/src/scripts/fix-seller-domain-simple.ts
 */

import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.join(__dirname, '../../database.sqlite');

async function fixSellerDomain() {
    console.log('🔍 Verificando e corrigindo coluna sellerDomain...\n');

    if (!fs.existsSync(DB_PATH)) {
        console.error(`❌ Banco de dados não encontrado em: ${DB_PATH}`);
        process.exit(1);
    }

    // Criar DataSource para SQLite
    const dataSource = new DataSource({
        type: 'better-sqlite3',
        database: DB_PATH,
        synchronize: false,
        logging: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Conectado ao banco de dados\n');

        const queryRunner = dataSource.createQueryRunner();

        try {
            // Verificar se a coluna existe
            const tableInfo = await queryRunner.query(`PRAGMA table_info(sas_tags)`);
            const columnExists = tableInfo.some((col: any) => col.name === 'sellerDomain');

            if (columnExists) {
                console.log('✅ Coluna sellerDomain já existe na tabela sas_tags');
            } else {
                console.log('⚠️  Coluna sellerDomain não encontrada. Adicionando...\n');

                // Adicionar coluna
                await queryRunner.query(
                    `ALTER TABLE sas_tags ADD COLUMN sellerDomain TEXT NOT NULL DEFAULT ''`
                );
                console.log('✅ Coluna sellerDomain adicionada com sucesso!');

                // Criar índice
                await queryRunner.query(
                    `CREATE INDEX IF NOT EXISTS idx_sas_tags_sellerDomain ON sas_tags(sellerDomain)`
                );
                console.log('✅ Índice criado com sucesso!');
            }

            // Mostrar estrutura atual
            const updatedTableInfo = await queryRunner.query(`PRAGMA table_info(sas_tags)`);
            console.log('\n📋 Estrutura atual da tabela sas_tags:');
            console.log('┌─────┬─────────────────────┬─────────┬─────────┬──────────┬─────────┐');
            console.log('│ CID │ Name                │ Type    │ NotNull │ Default  │ PK      │');
            console.log('├─────┼─────────────────────┼─────────┼─────────┼──────────┼─────────┤');

            updatedTableInfo.forEach((row: any) => {
                const cid = String(row.cid || '').padEnd(3);
                const name = String(row.name || '').padEnd(19);
                const type = String(row.type || '').padEnd(7);
                const notNull = row.notnull ? '1' : '0';
                const dfltValue = (row.dflt_value || '').toString().padEnd(8);
                const pk = row.pk ? '1' : '0';

                console.log(`│ ${cid} │ ${name} │ ${type} │ ${notNull.padEnd(7)} │ ${dfltValue} │ ${pk.padEnd(7)} │`);
            });

            console.log('└─────┴─────────────────────┴─────────┴─────────┴──────────┴─────────┘');
            console.log('\n✅ Verificação concluída!');

        } finally {
            await queryRunner.release();
        }

    } catch (error: any) {
        console.error('\n❌ Erro:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}

fixSellerDomain();


