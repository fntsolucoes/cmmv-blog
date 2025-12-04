/**
 * Script para testar se a coluna neverStarted está acessível via query raw
 * Execute: cd apps/api && tsx src/scripts/test-neverStarted-raw.ts
 */

import { DataSource } from 'typeorm';
import { join } from 'path';
import { existsSync } from 'fs';

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'database.sqlite');

async function testNeverStartedRaw() {
    console.log('🔍 Testando acesso à coluna neverStarted via query raw...\n');
    
    if (!existsSync(DB_PATH)) {
        console.error(`❌ Banco de dados não encontrado em: ${DB_PATH}`);
        process.exit(1);
    }
    
    console.log(`📂 Banco de dados: ${DB_PATH}\n`);
    
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
            // 1. Verificar estrutura da tabela
            console.log('1️⃣ Verificando estrutura da tabela...');
            const tableInfo = await queryRunner.query(`PRAGMA table_info(sas_campaigns)`);
            const neverStartedColumn = tableInfo.find((col: any) => 
                col.name.toLowerCase() === 'neverstarted'
            );
            
            if (neverStartedColumn) {
                console.log('✅ Coluna encontrada:');
                console.log(`   - Nome: ${neverStartedColumn.name}`);
                console.log(`   - Tipo: ${neverStartedColumn.type}`);
                console.log(`   - NOT NULL: ${neverStartedColumn.notnull === 1}`);
                console.log(`   - Default: ${neverStartedColumn.dflt_value || 'NULL'}`);
            } else {
                console.log('❌ Coluna neverStarted NÃO encontrada na tabela!');
                console.log('\n📋 Colunas disponíveis:');
                tableInfo.forEach((col: any) => {
                    console.log(`   - ${col.name} (${col.type})`);
                });
                return;
            }
            
            console.log('\n2️⃣ Testando query raw...');
            const rawResult = await queryRunner.query(`
                SELECT id, name, neverStarted, typeof(neverStarted) as tipo
                FROM sas_campaigns
                LIMIT 5
            `);
            
            console.log(`✅ Query executada com sucesso! ${rawResult.length} registros retornados\n`);
            console.log('📊 Resultados:');
            rawResult.forEach((row: any, index: number) => {
                console.log(`   ${index + 1}. ${row.name}:`);
                console.log(`      - neverStarted: ${row.neverStarted} (${row.tipo})`);
            });
            
            console.log('\n3️⃣ Testando via TypeORM Entity...');
            const CampaignsEntity = dataSource.getRepository('SasCampaignsEntity');
            
            if (!CampaignsEntity) {
                console.log('⚠️  Entidade SasCampaignsEntity não encontrada no DataSource');
                console.log('   Isso pode indicar problema no carregamento de metadados');
                return;
            }
            
            const entityResult = await CampaignsEntity.find({
                take: 5,
                select: ['id', 'name', 'neverStarted'] as any
            });
            
            console.log(`✅ Query TypeORM executada! ${entityResult.length} registros retornados\n`);
            console.log('📊 Resultados TypeORM:');
            entityResult.forEach((row: any, index: number) => {
                const hasField = 'neverStarted' in row;
                console.log(`   ${index + 1}. ${row.name}:`);
                console.log(`      - Campo presente: ${hasField}`);
                if (hasField) {
                    console.log(`      - Valor: ${row.neverStarted} (${typeof row.neverStarted})`);
                } else {
                    console.log(`      - ❌ Campo neverStarted NÃO está presente!`);
                }
            });
            
            // Comparação
            console.log('\n📊 Comparação:');
            if (rawResult.length > 0 && entityResult.length > 0) {
                const rawHasField = rawResult[0].neverStarted !== undefined;
                const entityHasField = 'neverStarted' in entityResult[0];
                
                console.log(`   Query Raw: ${rawHasField ? '✅ Campo presente' : '❌ Campo ausente'}`);
                console.log(`   TypeORM Entity: ${entityHasField ? '✅ Campo presente' : '❌ Campo ausente'}`);
                
                if (rawHasField && !entityHasField) {
                    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
                    console.log('   - Query raw consegue acessar a coluna');
                    console.log('   - TypeORM Entity NÃO está retornando o campo');
                    console.log('   - Isso indica problema nos metadados do TypeORM');
                    console.log('\n💡 Solução: Reiniciar API ou forçar recarregamento de metadados');
                } else if (!rawHasField) {
                    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
                    console.log('   - Nem query raw consegue acessar a coluna');
                    console.log('   - Verificar se coluna existe com nome correto');
                } else {
                    console.log('\n✅ Tudo funcionando corretamente!');
                }
            }

        } finally {
            await queryRunner.release();
        }

    } catch (error: any) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testNeverStartedRaw().catch((error) => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

export { testNeverStartedRaw };

