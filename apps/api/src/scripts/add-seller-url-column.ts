/**
 * Script para adicionar coluna sellerUrl na tabela sas_tags
 * Execute: pnpm --filter cmmv-blog-api add-seller-url-column
 * Ou: cd apps/api && tsx src/scripts/add-seller-url-column.ts
 */

import { DataSource } from 'typeorm';
import { join } from 'path';
import { existsSync } from 'fs';

async function addSellerUrlColumn() {
    // Caminho do banco de dados (relativo ao diretório do script)
    const dbPath = join(process.cwd(), 'database.sqlite');
    
    if (!existsSync(dbPath)) {
        console.error(`❌ Banco de dados não encontrado em: ${dbPath}`);
        console.log('💡 Certifique-se de executar o script a partir do diretório apps/api');
        process.exit(1);
    }
    
    console.log(`🔍 Verificando estrutura da tabela sas_tags em: ${dbPath}`);
    
    const dataSource = new DataSource({
        type: 'sqlite',
        database: dbPath,
        synchronize: false,
        logging: true,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Conexão com banco de dados estabelecida');

        const queryRunner = dataSource.createQueryRunner();

        try {
            // Verificar se a coluna já existe
            const tableInfo = await queryRunner.query(`PRAGMA table_info(sas_tags)`);
            const columnExists = tableInfo.some((col: any) => col.name === 'sellerUrl');

            if (columnExists) {
                console.log('✅ Coluna sellerUrl já existe na tabela sas_tags');
                return;
            }

            console.log('🛠️  Adicionando coluna sellerUrl...');

            // Adicionar coluna
            await queryRunner.query(
                `ALTER TABLE sas_tags ADD COLUMN sellerUrl TEXT`
            );

            console.log('✅ Coluna sellerUrl adicionada com sucesso!');

            // Verificar estrutura final
            const finalTableInfo = await queryRunner.query(`PRAGMA table_info(sas_tags)`);
            const columns = finalTableInfo.map((col: any) => ({
                name: col.name,
                type: col.type,
                notNull: col.notnull === 1,
                defaultValue: col.dflt_value,
                primaryKey: col.pk === 1
            }));

            console.log('\n📋 Estrutura atual da tabela sas_tags:');
            columns.forEach(col => {
                console.log(`   - ${col.name} (${col.type})${col.notNull ? ' NOT NULL' : ''}${col.primaryKey ? ' PRIMARY KEY' : ''}`);
            });

        } finally {
            await queryRunner.release();
        }

    } catch (error: any) {
        console.error('❌ Erro ao adicionar coluna:', error.message);
        if (error.message?.includes('duplicate column name') || error.message?.includes('already exists')) {
            console.log('ℹ️  Coluna sellerUrl já existe (erro esperado)');
        } else {
            throw error;
        }
    } finally {
        await dataSource.destroy();
        console.log('✅ Conexão fechada');
    }
}

addSellerUrlColumn()
    .then(() => {
        console.log('\n✅ Processo concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro fatal:', error);
        process.exit(1);
    });

