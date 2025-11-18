/**
 * Script temporário para limpar todas as taxas de câmbio
 * Execute com: npx ts-node sas/packages/sas/api/exchange-rates/clear-all-rates.ts
 */

import {
    Repository
} from "@cmmv/repository";

async function clearAllRates() {
    try {
        console.log('🔄 Iniciando limpeza da tabela de moedas...\n');
        
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        
        // Contar registros antes
        const allRates = await Repository.findAll(ExchangeRatesEntity, {}, [], {
            order: {
                date: 'DESC'
            }
        });
        
        const totalRecords = allRates?.data?.length || 0;
        
        if (totalRecords === 0) {
            console.log('✅ A tabela já está vazia.');
            return;
        }
        
        console.log(`📊 Total de registros encontrados: ${totalRecords}`);
        console.log('🗑️  Deletando todos os registros...\n');
        
        // Deletar todos os registros
        const deleteResult = await Repository.delete(ExchangeRatesEntity, {});
        
        console.log('✅ Tabela de moedas limpa com sucesso!');
        console.log(`📊 ${totalRecords} registro(s) deletado(s).\n`);
        
    } catch (error) {
        console.error('❌ Erro ao limpar tabela:', error);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    clearAllRates()
        .then(() => {
            console.log('✅ Processo concluído.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        });
}

export { clearAllRates };


