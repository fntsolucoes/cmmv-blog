/**
 * Script para testar se a rota de campanhas retorna o campo neverStarted
 * Execute: node test-campaigns-neverStarted-response.js
 */

const http = require('http');

const API_URL = process.env.API_URL || 'https://1001.smartanalytics.center';
const ENDPOINT = '/api/affiliation-manager/campaigns/all';

console.log('🔍 Testando se a rota de CAMPANHAS retorna o campo neverStarted...\n');
console.log(`URL: ${API_URL}${ENDPOINT}\n`);

// Extrair hostname e porta da URL
let hostname, port, path;
if (API_URL.startsWith('https://')) {
    hostname = API_URL.replace('https://', '').split(':')[0].split('/')[0];
    port = 443;
    path = API_URL.replace(`https://${hostname}`, '') + ENDPOINT;
} else if (API_URL.startsWith('http://')) {
    const urlParts = API_URL.replace('http://', '').split(':');
    hostname = urlParts[0].split('/')[0];
    port = urlParts[1] ? parseInt(urlParts[1].split('/')[0]) : 80;
    path = API_URL.replace(`http://${hostname}${port !== 80 ? ':' + port : ''}`, '') + ENDPOINT;
} else {
    hostname = API_URL.split(':')[0].split('/')[0];
    port = 80;
    path = ENDPOINT;
}

const options = {
    hostname: hostname,
    port: port,
    path: path,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

console.log(`Conectando em: ${hostname}:${port}${path}\n`);

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            
            console.log('📊 Resultado da API de CAMPANHAS:\n');
            console.log(`Status: ${res.statusCode}`);
            console.log(`Total de campanhas: ${response?.data?.length || response?.result?.data?.length || 0}\n`);
            
            const campaigns = response?.data || response?.result?.data || [];
            
            if (campaigns.length > 0) {
                const firstCampaign = campaigns[0];
                
                console.log('✅ Primeira campanha retornada:');
                console.log(`  - ID: ${firstCampaign.id}`);
                console.log(`  - Nome: ${firstCampaign.name}`);
                console.log(`  - neverStarted presente: ${'neverStarted' in firstCampaign}`);
                
                if ('neverStarted' in firstCampaign) {
                    console.log(`  ✅ Campo neverStarted está presente!`);
                    console.log(`  - neverStarted valor: ${firstCampaign.neverStarted}`);
                    console.log(`  - neverStarted tipo: ${typeof firstCampaign.neverStarted}`);
                } else {
                    console.log('  ❌ Campo neverStarted NÃO está presente na resposta!');
                }
                
                // Verificar todas as campanhas
                const withNeverStarted = campaigns.filter(c => 
                    'neverStarted' in c && (c.neverStarted === true || c.neverStarted === 1 || c.neverStarted === '1')
                );
                
                const withoutNeverStarted = campaigns.filter(c => !('neverStarted' in c));
                
                console.log(`\n📈 Estatísticas:`);
                console.log(`  - Total de campanhas: ${campaigns.length}`);
                console.log(`  - Campanhas COM campo neverStarted: ${campaigns.filter(c => 'neverStarted' in c).length}`);
                console.log(`  - Campanhas SEM campo neverStarted: ${withoutNeverStarted.length}`);
                console.log(`  - Campanhas com neverStarted = true/1: ${withNeverStarted.length}`);
                
                if (withNeverStarted.length > 0) {
                    console.log(`\n✅ Campanhas com neverStarted = true/1:`);
                    withNeverStarted.slice(0, 5).forEach(c => {
                        console.log(`  - ${c.name}: neverStarted = ${c.neverStarted} (${typeof c.neverStarted})`);
                    });
                }
                
                if (withoutNeverStarted.length > 0) {
                    console.log(`\n⚠️  Campanhas SEM campo neverStarted (primeiras 5):`);
                    withoutNeverStarted.slice(0, 5).forEach(c => {
                        console.log(`  - ${c.name}`);
                    });
                }
                
                // Verificar campos presentes
                console.log(`\n📋 Campos presentes na primeira campanha:`);
                const fields = Object.keys(firstCampaign).sort();
                fields.forEach(key => {
                    const value = firstCampaign[key];
                    const type = typeof value;
                    const hasValue = value !== null && value !== undefined;
                    console.log(`  - ${key}: ${type}${hasValue ? ` = ${value}` : ' (null/undefined)'}`);
                });
                
                // Verificar se neverStarted está na lista
                if (!fields.includes('neverStarted')) {
                    console.log(`\n❌ PROBLEMA DETECTADO: Campo 'neverStarted' NÃO está na lista de campos!`);
                    console.log(`   Isso significa que a API não está retornando o campo.`);
                    console.log(`   Possíveis causas:`);
                    console.log(`   1. Coluna não existe no banco de dados`);
                    console.log(`   2. TypeORM não está sincronizado com o schema`);
                    console.log(`   3. Campo está sendo filtrado em algum lugar`);
                }
                
            } else {
                console.log('⚠️  Nenhuma campanha retornada');
                console.log('Resposta completa:', JSON.stringify(response, null, 2).substring(0, 500));
            }
            
        } catch (error) {
            console.error('❌ Erro ao processar resposta:', error.message);
            console.log('Resposta raw (primeiros 1000 chars):', data.substring(0, 1000));
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
    console.log('\n💡 Dicas:');
    console.log('   1. Verifique se a API está acessível');
    console.log('   2. Verifique se precisa de autenticação');
    console.log(`   3. Tente: curl ${API_URL}${ENDPOINT}`);
    console.log('   4. Verifique se está usando HTTPS se necessário');
});

req.end();

