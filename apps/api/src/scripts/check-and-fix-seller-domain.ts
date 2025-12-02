import { Repository } from '@cmmv/repository';

const TABLE_NAME = 'sas_tags';
const COLUMN_NAME = 'sellerDomain';

console.log('🔍 Verificando coluna sellerDomain na tabela sas_tags...\n');

async function checkAndFixSellerDomain() {
    try {
        // Obter a entidade
        const TagsEntity = Repository.getEntity('SasTagsEntity');
        
        // Tentar buscar uma tag para verificar se a coluna existe
        // Se a coluna não existir, isso vai falhar
        try {
            const testQuery = await Repository.findAll(TagsEntity, {}, [], { limit: 1 });
            console.log('✅ Conexão com banco de dados OK');
        } catch (error: any) {
            console.error('❌ Erro ao conectar ao banco:', error.message);
            throw error;
        }

        // Verificar se a coluna existe executando PRAGMA table_info
        // Usando query raw do TypeORM
        const dataSource = (Repository as any).dataSource;
        if (!dataSource) {
            throw new Error('DataSource não encontrado. Certifique-se de que o Repository está inicializado.');
        }

        const queryRunner = dataSource.createQueryRunner();
        
        try {
            // Verificar estrutura da tabela
            const tableInfo = await queryRunner.query(`PRAGMA table_info(${TABLE_NAME})`);
            
            const columnExists = tableInfo.some((col: any) => col.name === COLUMN_NAME);
            
            if (!columnExists) {
                console.log(`⚠️  Coluna ${COLUMN_NAME} não encontrada. Adicionando...`);
                
                // Adicionar coluna
                await queryRunner.query(
                    `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} TEXT NOT NULL DEFAULT ''`
                );
                console.log('✅ Coluna adicionada com sucesso!');
                
                // Criar índice
                await queryRunner.query(
                    `CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_${COLUMN_NAME} ON ${TABLE_NAME}(${COLUMN_NAME})`
                );
                console.log('✅ Índice criado com sucesso!');
            } else {
                console.log(`✅ Coluna ${COLUMN_NAME} já existe na tabela ${TABLE_NAME}`);
            }
            
            // Mostrar estrutura atual
            const updatedTableInfo = await queryRunner.query(`PRAGMA table_info(${TABLE_NAME})`);
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
            
        } finally {
            await queryRunner.release();
        }
        
        console.log('\n✅ Verificação concluída!');
        
    } catch (error: any) {
        console.error('\n❌ Erro ao verificar/corrigir coluna:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    // Importar configuração e inicializar aplicação
    import('../../src/config').then(() => {
        import('../../src/main').then(() => {
            // Aguardar um pouco para o Repository inicializar
            setTimeout(() => {
                checkAndFixSellerDomain().then(() => {
                    process.exit(0);
                }).catch((error) => {
                    console.error('Erro fatal:', error);
                    process.exit(1);
                });
            }, 2000);
        });
    });
}

export { checkAndFixSellerDomain };

