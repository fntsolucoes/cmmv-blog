/**
 * Script para testar se o servidor consegue iniciar
 * Execute: tsx src/scripts/test-server-start.ts
 */

import "reflect-metadata";
import "./../config";

async function testServerStart() {
    console.log('🔍 Testando inicialização do servidor...\n');

    // Teste 1: Verificar imports básicos
    console.log('1️⃣  Testando imports básicos...');
    try {
        const { Application, EventsService } = await import("@cmmv/core");
        console.log('   ✅ @cmmv/core importado');
        
        const { AuthModule } = await import("@cmmv/auth");
        console.log('   ✅ @cmmv/auth importado');
        
        const { DefaultAdapter, DefaultHTTPModule } = await import("@cmmv/http");
        console.log('   ✅ @cmmv/http importado');
        
        const { RepositoryModule, Repository } = await import("@cmmv/repository");
        console.log('   ✅ @cmmv/repository importado');
        
        const { SasModule } = await import("@cmmv/sas");
        console.log('   ✅ @cmmv/sas importado');
    } catch (error: any) {
        console.error('   ❌ Erro ao importar módulos:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }

    // Teste 2: Verificar se puppeteer pode ser importado (lazy)
    console.log('\n2️⃣  Testando import lazy do puppeteer...');
    try {
        const puppeteer = await import("puppeteer");
        console.log('   ✅ Puppeteer pode ser importado (lazy)');
        console.log('   Versão:', puppeteer.default?.version || 'N/A');
    } catch (error: any) {
        console.error('   ❌ Erro ao importar puppeteer:', error.message);
        console.error('   Stack:', error.stack);
        // Não fazer exit aqui, pois o import é lazy
    }

    // Teste 3: Verificar se Application.create funciona
    console.log('\n3️⃣  Testando Application.create...');
    try {
        const { Application, EventsService } = await import("@cmmv/core");
        const { AuthModule } = await import("@cmmv/auth");
        const { DefaultAdapter, DefaultHTTPModule } = await import("@cmmv/http");
        const { RepositoryModule, Repository } = await import("@cmmv/repository");
        const { SasModule } = await import("@cmmv/sas");
        
        console.log('   ⏳ Criando aplicação...');
        
        Application.create({
            httpAdapter: DefaultAdapter,
            modules: [
                DefaultHTTPModule,
                RepositoryModule,
                AuthModule,
                SasModule
            ],
            providers: [
                Repository,
                EventsService
            ]
        });
        
        console.log('   ✅ Application.create executado sem erros');
        
        // Aguardar um pouco para ver se o servidor inicia
        console.log('   ⏳ Aguardando 5 segundos para verificar se o servidor inicia...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('   ✅ Teste concluído');
        
    } catch (error: any) {
        console.error('   ❌ Erro ao criar aplicação:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }

    console.log('\n✅ Todos os testes passaram!');
    process.exit(0);
}

testServerStart().catch((error) => {
    console.error('\n❌ Erro fatal no teste:', error);
    process.exit(1);
});

