/**
 * Script para executar migrações SQL automaticamente
 * Este script verifica e executa migrações pendentes de forma idempotente
 * Usa TypeORM DataSource diretamente, sem depender do CLI sqlite3
 */

import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

interface Migration {
    name: string;
    file: string;
    tableName?: string;    // Opcional para migrações de dados
    columnName?: string;   // Opcional para migrações de dados
    type: 'schema' | 'data'; // Tipo de migração
}

const migrations: Migration[] = [
    {
        name: 'Adicionar coluna neverStarted em sas_campaigns',
        file: 'add-campaigns-never-started-column.sql',
        tableName: 'sas_campaigns',
        columnName: 'neverStarted',
        type: 'schema'
    },
    {
        name: 'Normalizar valores neverStarted em sas_campaigns',
        file: 'fix-neverStarted-values.sql',
        type: 'data'
    },
    {
        name: 'Adicionar coluna finalized_for_profit_sharing_at em sas_payment_orders',
        file: 'add-payment-orders-finalized-for-profit-sharing.sql',
        tableName: 'sas_payment_orders',
        columnName: 'finalized_for_profit_sharing_at',
        type: 'schema'
    },
    {
        name: 'Adicionar coluna cnpj_details em sas_cost_centers',
        file: 'add-cost-centers-cnpj-details.sql',
        tableName: 'sas_cost_centers',
        columnName: 'cnpj_details',
        type: 'schema'
    },
    {
        name: 'Criar tabelas fiscais (tax_regimes, tax_rules, tax_iss_municipality)',
        file: 'add-tax-fiscal-tables.sql',
        tableName: 'sas_tax_regimes',
        columnName: 'id',
        type: 'schema'
    },
    {
        name: 'Seed regimes e regras fiscais iniciais',
        file: 'seed-tax-fiscal-initial.sql',
        type: 'data'
    },
    {
        name: 'Adicionar colunas fiscais em sas_cost_centers',
        file: 'add-cost-centers-fiscal-columns.sql',
        tableName: 'sas_cost_centers',
        columnName: 'tax_regime_id',
        type: 'schema'
    },
    {
        name: 'Adicionar colunas fiscais em sas_payment_orders',
        file: 'add-payment-orders-fiscal-columns.sql',
        tableName: 'sas_payment_orders',
        columnName: 'natureza_rendimento',
        type: 'schema'
    },
    {
        name: 'Seed regra Adicional IRPJ (10% acima de R$ 20.000/mes)',
        file: 'seed-adicional-irpj-rule.sql',
        type: 'data'
    }
];

async function checkColumnExists(dataSource: DataSource, tableName: string, columnName: string): Promise<boolean> {
    try {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const tableInfo = await queryRunner.query(`PRAGMA table_info(${tableName})`);
            const columnExists = tableInfo.some((col: any) => col.name === columnName);
            return columnExists;
        } finally {
            await queryRunner.release();
        }
    } catch (error) {
        console.error(`❌ Erro ao verificar coluna ${columnName} na tabela ${tableName}:`, error);
        return false;
    }
}

async function checkMigrationExecuted(dataSource: DataSource, migrationName: string): Promise<boolean> {
    try {
        const queryRunner = dataSource.createQueryRunner();
        try {
            // Verificar se a tabela migrations existe
            const tables = await queryRunner.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'`);
            if (tables.length === 0) {
                // Criar tabela migrations se não existir
                await queryRunner.query(`
                    CREATE TABLE IF NOT EXISTS migrations (
                        id TEXT PRIMARY KEY,
                        timestamp INTEGER NOT NULL,
                        name TEXT NOT NULL,
                        hash TEXT
                    )
                `);
                return false;
            }

            // Verificar se a migração já foi executada
            const result = await queryRunner.query(
                `SELECT COUNT(*) as count FROM migrations WHERE name = ?`,
                [migrationName]
            );
            return result[0].count > 0;
        } finally {
            await queryRunner.release();
        }
    } catch (error) {
        console.error(`❌ Erro ao verificar migração ${migrationName}:`, error);
        return false;
    }
}

async function registerMigration(dataSource: DataSource, migrationName: string): Promise<void> {
    try {
        const queryRunner = dataSource.createQueryRunner();
        try {
            const timestamp = Date.now();
            const id = `${timestamp}-${migrationName.replace(/\s+/g, '-')}`;

            await queryRunner.query(
                `INSERT INTO migrations (id, timestamp, name) VALUES (?, ?, ?)`,
                [id, timestamp, migrationName]
            );
        } finally {
            await queryRunner.release();
        }
    } catch (error) {
        console.error(`❌ Erro ao registrar migração ${migrationName}:`, error);
        throw error;
    }
}

async function executeMigration(dataSource: DataSource, migrationFile: string): Promise<boolean> {
    try {
        const migrationPath = path.join(process.cwd(), migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Arquivo de migração não encontrado: ${migrationPath}`);
            return false;
        }

        console.log(`📝 Executando migração: ${migrationFile}`);

        // Ler o conteúdo do arquivo SQL
        let sqlContent = fs.readFileSync(migrationPath, 'utf-8');
        // Remover apenas linhas que sao comentario inteiro (evita descartar CREATE TABLE apos comentarios
        // e evita que ";" dentro de comentario quebre o split)
        sqlContent = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');
        // Dividir em comandos individuais (separados por ;)
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        const queryRunner = dataSource.createQueryRunner();
        
        try {
            for (const command of commands) {
                if (command.trim()) {
                    await queryRunner.query(command);
                }
            }
            console.log(`✅ Migração executada com sucesso: ${migrationFile}`);
            return true;
        } finally {
            await queryRunner.release();
        }
    } catch (error: any) {
        // Ignorar erro se a coluna já existir
        if (error?.message?.includes('duplicate column name') || 
            error?.message?.includes('already exists') ||
            error?.message?.includes('UNIQUE constraint failed')) {
            console.log(`ℹ️  Migração ${migrationFile} já foi aplicada (erro esperado)`);
            return true;
        }
        console.error(`❌ Erro ao executar migração ${migrationFile}:`, error?.message || error);
        return false;
    }
}

async function runMigrations() {
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite');

    // Verificar se o banco existe
    if (!fs.existsSync(dbPath)) {
        console.log(`⚠️  Banco de dados não encontrado em: ${dbPath}`);
        console.log('   Pulando migrações (banco será criado na primeira execução)');
        return;
    }

    console.log('🔄 Verificando migrações pendentes...\n');

    // Criar DataSource do TypeORM
    const dataSource = new DataSource({
        type: 'sqlite',
        database: dbPath,
        synchronize: false,
        logging: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Conexão com banco de dados estabelecida');

        let executed = 0;
        let skipped = 0;

        for (const migration of migrations) {
            let alreadyApplied = false;

            // Verificar se a migração já foi aplicada baseado no tipo
            if (migration.type === 'schema' && migration.tableName && migration.columnName) {
                // Para migrações de schema, verificar se a coluna existe
                alreadyApplied = await checkColumnExists(dataSource, migration.tableName, migration.columnName);
            } else if (migration.type === 'data') {
                // Para migrações de dados, verificar na tabela migrations
                alreadyApplied = await checkMigrationExecuted(dataSource, migration.name);
            }

            if (alreadyApplied) {
                console.log(`⏭️  Migração já aplicada: ${migration.name}`);
                skipped++;
                continue;
            }

            // Executar migração
            console.log(`🔄 Executando: ${migration.name}`);
            if (await executeMigration(dataSource, migration.file)) {
                // Registrar migração de dados na tabela migrations
                if (migration.type === 'data') {
                    await registerMigration(dataSource, migration.name);
                }
                executed++;
            } else {
                console.error(`❌ Falha ao executar: ${migration.name}`);
                // Não fazer exit(1) para não bloquear a inicialização
                console.warn('⚠️  Continuando apesar do erro na migração');
            }
        }

        console.log(`\n✅ Migrações concluídas: ${executed} executadas, ${skipped} já aplicadas`);
    } catch (error: any) {
        console.error('❌ Erro ao executar migrações:', error?.message || error);
        // Não bloquear a inicialização se houver erro
        console.warn('⚠️  Continuando inicialização apesar do erro nas migrações');
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    runMigrations().catch((error) => {
        console.error('❌ Erro fatal ao executar migrações:', error);
        process.exit(1);
    });
}

export { runMigrations };

