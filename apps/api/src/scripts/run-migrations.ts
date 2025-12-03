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
    tableName: string;
    columnName: string;
}

const migrations: Migration[] = [
    {
        name: 'Adicionar coluna neverStarted em sas_campaigns',
        file: 'add-campaigns-never-started-column.sql',
        tableName: 'sas_campaigns',
        columnName: 'neverStarted'
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

async function executeMigration(dataSource: DataSource, migrationFile: string): Promise<boolean> {
    try {
        const migrationPath = path.join(process.cwd(), migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Arquivo de migração não encontrado: ${migrationPath}`);
            return false;
        }

        console.log(`📝 Executando migração: ${migrationFile}`);

        // Ler o conteúdo do arquivo SQL
        const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
        
        // Dividir em comandos individuais (separados por ;)
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

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
            // Verificar se a migração já foi aplicada
            const columnExists = await checkColumnExists(dataSource, migration.tableName, migration.columnName);

            if (columnExists) {
                console.log(`⏭️  Migração já aplicada: ${migration.name}`);
                skipped++;
                continue;
            }

            // Executar migração
            if (await executeMigration(dataSource, migration.file)) {
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

