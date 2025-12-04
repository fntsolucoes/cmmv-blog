/**
 * Script para testar se a API retorna o campo neverStarted
 * Execute: node test-campaigns-api-neverStarted.js
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ENDPOINT = '/affiliation-manager/campaigns/all';

console.log('🔍 Testando se a API retorna o campo neverStarted...\n');
console.log(`URL: ${API_URL}${ENDPOINT}\n`);

const options = {
    hostname: API_URL.replace('http://', '').replace('https://', '').split(':')[0],
    port: API_URL.includes(':') ? API_URL.split(':')[2] || (API_URL.includes('https') ? 443 : 80) : (API_URL.includes('https') ? 443 : 80),
    path: ENDPOINT,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            console.log('📊 Resultado da API:\n');
            console.log(`Status: ${res.statusCode}`);
            console.log(`Total de campanhas: ${response?.data?.length || 0}\n`);
            
            if (response?.data && response.data.length > 0) {
                const firstCampaign = response.data[0];
                
                console.log('✅ Primeira campanha retornada:');
                console.log(`  - ID: ${firstCampaign.id}`);
                console.log(`  - Nome: ${firstCampaign.name}`);
                console.log(`  - neverStarted presente: ${'neverStarted' in firstCampaign}`);
                
                if ('neverStarted' in firstCampaign) {
                    console.log(`  - neverStarted valor: ${firstCampaign.neverStarted}`);
                    console.log(`  - neverStarted tipo: ${typeof firstCampaign.neverStarted}`);
                } else {
                    console.log('  ❌ Campo neverStarted NÃO está presente na resposta!');
                }
                
                // Verificar todas as campanhas
                const withNeverStarted = response.data.filter(c => 
                    'neverStarted' in c && (c.neverStarted === true || c.neverStarted === 1 || c.neverStarted === '1')
                );
                
                console.log(`\n📈 Estatísticas:`);
                console.log(`  - Total de campanhas: ${response.data.length}`);
                console.log(`  - Campanhas com neverStarted = true/1: ${withNeverStarted.length}`);
                
                if (withNeverStarted.length > 0) {
                    console.log(`\n✅ Campanhas com neverStarted = true/1:`);
                    withNeverStarted.slice(0, 5).forEach(c => {
                        console.log(`  - ${c.name}: neverStarted = ${c.neverStarted} (${typeof c.neverStarted})`);
                    });
                }
                
                // Verificar campos presentes
                console.log(`\n📋 Campos presentes na primeira campanha:`);
                Object.keys(firstCampaign).forEach(key => {
                    console.log(`  - ${key}: ${typeof firstCampaign[key]}`);
                });
                
            } else {
                console.log('⚠️  Nenhuma campanha retornada');
            }
            
        } catch (error) {
            console.error('❌ Erro ao processar resposta:', error.message);
            console.log('Resposta raw:', data.substring(0, 500));
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
    console.log('\n💡 Dica: Verifique se a API está rodando e acessível');
    console.log(`   Tente: curl ${API_URL}${ENDPOINT}`);
});

req.end();

