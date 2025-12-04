/**
 * Script para verificar e corrigir o campo neverStarted na tabela sas_campaigns
 * Execute: cd apps/api && tsx src/scripts/check-and-fix-neverStarted.ts
 */

import { DataSource } from 'typeorm';
import { join } from 'path';
import { existsSync } from 'fs';
import * as fs from 'fs';

const TABLE_NAME = 'sas_campaigns';
const COLUMN_NAME = 'neverStarted';
const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'database.sqlite');
const MIGRATION_FILE = join(process.cwd(), 'add-campaigns-never-started-column.sql');

async function checkAndFixNeverStarted() {
    console.log('🔍 Verificando campo neverStarted na tabela sas_campaigns...\n');
    
    if (!existsSync(DB_PATH)) {
        console.error(`❌ Banco de dados não encontrado em: ${DB_PATH}`);
        process.exit(1);
    }
    
    console.log(`📂 Banco de dados: ${DB_PATH}`);
    
    const dataSource = new DataSource({
        type: 'sqlite',
        database: DB_PATH,
        synchronize: false,
        logging: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Conexão com banco de dados estabelecida\n');

        const queryRunner = dataSource.createQueryRunner();

        try {
            // 1. Verificar se a coluna existe
            console.log('📋 Verificando estrutura da tabela...');
            const tableInfo = await queryRunner.query(`PRAGMA table_info(${TABLE_NAME})`);
            
            const columnExists = tableInfo.some((col: any) => col.name === COLUMN_NAME);
            
            console.log(`   Coluna '${COLUMN_NAME}' existe: ${columnExists ? '✅ SIM' : '❌ NÃO'}\n`);
            
            if (!columnExists) {
                console.log('🛠️  Coluna não encontrada. Aplicando migração...\n');
                
                // Verificar se arquivo de migração existe
                if (!existsSync(MIGRATION_FILE)) {
                    console.error(`❌ Arquivo de migração não encontrado: ${MIGRATION_FILE}`);
                    console.log('💡 Criando migração manualmente...\n');
                    
                    // Criar migração manualmente
                    await queryRunner.query(`
                        ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} INTEGER NOT NULL DEFAULT 0;
                    `);
                    
                    console.log('✅ Coluna adicionada manualmente');
                } else {
                    // Ler e executar arquivo de migração
                    const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf-8');
                    const commands = sqlContent
                        .split(';')
                        .map(cmd => cmd.trim())
                        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
                    
                    for (const command of commands) {
                        if (command.trim()) {
                            await queryRunner.query(command);
                        }
                    }
                    
                    console.log('✅ Migração aplicada com sucesso');
                }
                
                // Criar índice
                try {
                    await queryRunner.query(`
                        CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_${COLUMN_NAME} ON ${TABLE_NAME}(${COLUMN_NAME});
                    `);
                    console.log('✅ Índice criado');
                } catch (error: any) {
                    if (!error.message?.includes('already exists')) {
                        console.warn('⚠️  Erro ao criar índice (pode já existir):', error.message);
                    }
                }
            } else {
                console.log('✅ Coluna já existe no banco de dados');
            }
            
            // 2. Verificar valores no banco
            console.log('\n📊 Verificando valores no banco...');
            const stats = await queryRunner.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN ${COLUMN_NAME} = 1 THEN 1 ELSE 0 END) as true_count,
                    SUM(CASE WHEN ${COLUMN_NAME} = 0 THEN 1 ELSE 0 END) as false_count,
                    SUM(CASE WHEN ${COLUMN_NAME} IS NULL THEN 1 ELSE 0 END) as null_count
                FROM ${TABLE_NAME};
            `);
            
            const stat = stats[0];
            console.log(`   Total de campanhas: ${stat.total}`);
            console.log(`   neverStarted = 1: ${stat.true_count}`);
            console.log(`   neverStarted = 0: ${stat.false_count}`);
            console.log(`   neverStarted = NULL: ${stat.null_count}`);
            
            // 3. Normalizar valores NULL para 0
            if (stat.null_count > 0) {
                console.log(`\n🛠️  Normalizando ${stat.null_count} valores NULL para 0...`);
                await queryRunner.query(`
                    UPDATE ${TABLE_NAME} 
                    SET ${COLUMN_NAME} = 0 
                    WHERE ${COLUMN_NAME} IS NULL;
                `);
                console.log('✅ Valores normalizados');
            }
            
            // 4. Verificar estrutura final
            console.log('\n📋 Estrutura final da tabela:');
            const finalTableInfo = await queryRunner.query(`PRAGMA table_info(${TABLE_NAME})`);
            const neverStartedColumn = finalTableInfo.find((col: any) => col.name === COLUMN_NAME);
            
            if (neverStartedColumn) {
                console.log(`   ✅ ${COLUMN_NAME}:`);
                console.log(`      - Tipo: ${neverStartedColumn.type}`);
                console.log(`      - NOT NULL: ${neverStartedColumn.notnull === 1 ? 'SIM' : 'NÃO'}`);
                console.log(`      - Default: ${neverStartedColumn.dflt_value || 'NULL'}`);
            } else {
                console.log(`   ❌ Coluna ${COLUMN_NAME} não encontrada após tentativa de criação!`);
            }
            
            // 5. Testar query
            console.log('\n🧪 Testando query...');
            const testResult = await queryRunner.query(`
                SELECT id, name, ${COLUMN_NAME}, typeof(${COLUMN_NAME}) as type
                FROM ${TABLE_NAME}
                LIMIT 3;
            `);
            
            console.log('   Primeiras 3 campanhas:');
            testResult.forEach((row: any) => {
                console.log(`   - ${row.name}: neverStarted = ${row[COLUMN_NAME]} (${row.type})`);
            });
            
            console.log('\n✅ Verificação concluída!');
            console.log('\n💡 Próximos passos:');
            console.log('   1. Reiniciar a API: pm2 restart "SAS Afiliation"');
            console.log('   2. Testar a rota: curl https://1001.smartanalytics.center/api/affiliation-manager/campaigns/all');
            console.log('   3. Verificar se o campo aparece na resposta');

        } finally {
            await queryRunner.release();
        }

    } catch (error: any) {
        console.error('❌ Erro:', error.message);
        if (error.message?.includes('duplicate column name') || error.message?.includes('already exists')) {
            console.log('ℹ️  Coluna já existe (erro esperado)');
        } else {
            throw error;
        }
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkAndFixNeverStarted().catch((error) => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

export { checkAndFixNeverStarted };

