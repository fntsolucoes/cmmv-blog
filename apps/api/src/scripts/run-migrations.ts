/**
 * Script para executar migrações SQL automaticamente
 * Este script verifica e executa migrações pendentes de forma idempotente
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Migration {
    name: string;
    file: string;
    checkQuery: string;
}

const migrations: Migration[] = [
    {
        name: 'Adicionar coluna neverStarted em sas_campaigns',
        file: 'add-campaigns-never-started-column.sql',
        checkQuery: "SELECT COUNT(*) FROM pragma_table_info('sas_campaigns') WHERE name = 'neverStarted';"
    }
];

function checkColumnExists(dbPath: string, tableName: string, columnName: string): boolean {
    try {
        // Usar execSync com opções seguras
        const query = `SELECT COUNT(*) FROM pragma_table_info('${tableName}') WHERE name = '${columnName}';`;
        const result = execSync(
            `sqlite3 "${dbPath}" "${query}"`,
            { encoding: 'utf-8', stdio: 'pipe' }
        ).trim();
        return result === '1';
    } catch (error) {
        // Se sqlite3 não estiver disponível, retornar false (migração será tentada)
        return false;
    }
}

function executeMigration(dbPath: string, migrationFile: string): boolean {
    try {
        const migrationPath = path.join(process.cwd(), migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Arquivo de migração não encontrado: ${migrationPath}`);
            return false;
        }

        console.log(`📝 Executando migração: ${migrationFile}`);

        // Ler o conteúdo do arquivo SQL e executar
        const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
        execSync(`sqlite3 "${dbPath}"`, {
            input: sqlContent,
            stdio: ['pipe', 'inherit', 'inherit']
        });

        console.log(`✅ Migração executada com sucesso: ${migrationFile}`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao executar migração ${migrationFile}:`, error);
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

    // Verificar se sqlite3 está disponível
    try {
        execSync('sqlite3 --version', { stdio: 'ignore' });
    } catch (error) {
        console.log('⚠️  sqlite3 não está disponível. Migrações serão puladas.');
        console.log('   Instale com: apt-get install sqlite3');
        console.log('   Ou execute manualmente: sqlite3 database.sqlite < add-campaigns-never-started-column.sql');
        return;
    }

    console.log('🔄 Verificando migrações pendentes...\n');

    let executed = 0;
    let skipped = 0;

    for (const migration of migrations) {
        // Verificar se a migração já foi aplicada
        const tableName = migration.checkQuery.includes('sas_campaigns') ? 'sas_campaigns' : '';
        const columnName = migration.name.includes('neverStarted') ? 'neverStarted' : '';

        if (tableName && columnName) {
            if (checkColumnExists(dbPath, tableName, columnName)) {
                console.log(`⏭️  Migração já aplicada: ${migration.name}`);
                skipped++;
                continue;
            }
        }

        // Executar migração
        if (executeMigration(dbPath, migration.file)) {
            executed++;
        } else {
            console.error(`❌ Falha ao executar: ${migration.name}`);
            process.exit(1);
        }
    }

    console.log(`\n✅ Migrações concluídas: ${executed} executadas, ${skipped} já aplicadas`);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    runMigrations().catch((error) => {
        console.error('❌ Erro fatal ao executar migrações:', error);
        process.exit(1);
    });
}

export { runMigrations };

