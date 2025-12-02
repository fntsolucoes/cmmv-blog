import {
    Repository
} from "@cmmv/repository";

/**
 * Script temporário para exibir as últimas 10 linhas da tabela de moedas
 * Execute com: npx ts-node sas/packages/sas/api/exchange-rates/show-last-10.ts
 */

async function showLast10Rates() {
    try {
        const ExchangeRatesEntity = Repository.getEntity("SasExchangeRatesEntity");
        
        // Buscar todos os registros ordenados por data (mais recentes primeiro)
        const rates = await Repository.findAll(ExchangeRatesEntity, {}, [], {
            order: {
                date: 'DESC'
            },
            take: 10  // Limitar a 10 registros
        });
        
        if (!rates?.data || rates.data.length === 0) {
            console.log('❌ Nenhum registro encontrado na tabela de moedas.');
            return;
        }
        
        console.log('\n📊 ÚLTIMAS 10 LINHAS DA TABELA DE MOEDAS:\n');
        console.log('═'.repeat(100));
        console.log(
            'ID'.padEnd(40) + ' | ' +
            'Moeda'.padEnd(10) + ' | ' +
            'Data (Banco)'.padEnd(15) + ' | ' +
            'Data (UTC)'.padEnd(15) + ' | ' +
            'Taxa'.padEnd(12) + ' | ' +
            'Fonte'
        );
        console.log('═'.repeat(100));
        
        for (const rate of rates.data) {
            const date = new Date(rate.date);
            const dateStr = date.toISOString().split('T')[0]; // AAAA-MM-DD
            const dateUTC = `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCFullYear()}`;
            
            console.log(
                (rate.id || '').substring(0, 38).padEnd(40) + ' | ' +
                (rate.currencyPair || '').padEnd(10) + ' | ' +
                dateStr.padEnd(15) + ' | ' +
                dateUTC.padEnd(15) + ' | ' +
                (rate.rate?.toFixed(4) || '').padEnd(12) + ' | ' +
                (rate.source || '')
            );
        }
        
        console.log('═'.repeat(100));
        console.log(`\n✅ Total de registros exibidos: ${rates.data.length}`);
        console.log(`📅 Data mais recente: ${new Date(rates.data[0]?.date).toLocaleDateString('pt-BR')}`);
        console.log(`📅 Data mais antiga (dentre as 10): ${new Date(rates.data[rates.data.length - 1]?.date).toLocaleDateString('pt-BR')}\n`);
        
    } catch (error) {
        console.error('❌ Erro ao buscar registros:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    showLast10Rates()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Erro fatal:', error);
            process.exit(1);
        });
}

export { showLast10Rates };


