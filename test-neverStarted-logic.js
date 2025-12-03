/**
 * Script de teste para verificar a lógica do campo neverStarted
 * Simula diferentes valores que podem vir do SQLite e testa as conversões
 */

console.log('=== TESTE DA LÓGICA neverStarted ===\n');

// Função que simula getStatusText do Vue
function getStatusText(item) {
    if (item.type === 'partner') {
        return item.active ? 'Ativo' : 'Inativo';
    }

    // Para campanhas, verificar primeiro se nunca foi iniciada (Pendência)
    // SQLite retorna 0/1 para boolean, então usar comparação truthy
    if (item.neverStarted === true || item.neverStarted === 1 || item.neverStarted === '1') {
        return 'Pendência';
    }

    // Calcular status baseado em datas (independente de active)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(item.startDate);
    startDate.setHours(0, 0, 0, 0);

    // Se ainda não começou
    if (today < startDate) {
        return item.active ? 'Agendada' : 'Inativo';
    }

    // Se tem data de fim
    if (item.endDate) {
        const endDate = new Date(item.endDate);
        endDate.setHours(0, 0, 0, 0);

        if (today > endDate) {
            return 'Encerrada';  // Campanha encerrada (não importa active)
        }
    }

    // Campanha em andamento - verificar se está ativa
    return item.active ? 'Ativa' : 'Inativo';
}

// Função que simula a conversão ao carregar no formulário
function loadIntoForm(item) {
    return Boolean(item.neverStarted === true || item.neverStarted === 1 || item.neverStarted === '1');
}

// Casos de teste
const testCases = [
    {
        name: 'Campanha com neverStarted = true (boolean)',
        item: {
            type: 'campaign',
            neverStarted: true,
            active: true,
            startDate: '2024-01-01',
            endDate: null
        },
        expectedStatus: 'Pendência',
        expectedFormValue: true
    },
    {
        name: 'Campanha com neverStarted = 1 (number - do SQLite)',
        item: {
            type: 'campaign',
            neverStarted: 1,
            active: true,
            startDate: '2024-01-01',
            endDate: null
        },
        expectedStatus: 'Pendência',
        expectedFormValue: true
    },
    {
        name: 'Campanha com neverStarted = "1" (string)',
        item: {
            type: 'campaign',
            neverStarted: '1',
            active: true,
            startDate: '2024-01-01',
            endDate: null
        },
        expectedStatus: 'Pendência',
        expectedFormValue: true
    },
    {
        name: 'Campanha com neverStarted = false (boolean)',
        item: {
            type: 'campaign',
            neverStarted: false,
            active: true,
            startDate: '2024-01-01',
            endDate: null
        },
        expectedStatus: 'Ativa',
        expectedFormValue: false
    },
    {
        name: 'Campanha com neverStarted = 0 (number - do SQLite)',
        item: {
            type: 'campaign',
            neverStarted: 0,
            active: true,
            startDate: '2024-01-01',
            endDate: null
        },
        expectedStatus: 'Ativa',
        expectedFormValue: false
    },
    {
        name: 'Campanha com neverStarted = "0" (string)',
        item: {
            type: 'campaign',
            neverStarted: '0',
            active: true,
            startDate: '2024-01-01',
            endDate: null
        },
        expectedStatus: 'Ativa',
        expectedFormValue: false
    },
    {
        name: 'Campanha ativa sem neverStarted (undefined)',
        item: {
            type: 'campaign',
            active: true,
            startDate: '2024-01-01',
            endDate: null
        },
        expectedStatus: 'Ativa',
        expectedFormValue: false
    },
    {
        name: 'Campanha encerrada com neverStarted = true',
        item: {
            type: 'campaign',
            neverStarted: true,
            active: true,
            startDate: '2024-01-01',
            endDate: '2024-06-01'
        },
        expectedStatus: 'Pendência', // Pendência tem prioridade sobre datas
        expectedFormValue: true
    },
    {
        name: 'Campanha encerrada com neverStarted = false',
        item: {
            type: 'campaign',
            neverStarted: false,
            active: true,
            startDate: '2024-01-01',
            endDate: '2024-06-01'
        },
        expectedStatus: 'Encerrada',
        expectedFormValue: false
    }
];

// Executar testes
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    console.log(`\n--- Teste ${index + 1}: ${test.name} ---`);
    console.log(`Valor neverStarted: ${test.item.neverStarted} (tipo: ${typeof test.item.neverStarted})`);

    const status = getStatusText(test.item);
    const formValue = loadIntoForm(test.item);

    const statusOk = status === test.expectedStatus;
    const formOk = formValue === test.expectedFormValue;

    console.log(`Status: ${status} ${statusOk ? '✅' : '❌'} (esperado: ${test.expectedStatus})`);
    console.log(`Valor no form: ${formValue} ${formOk ? '✅' : '❌'} (esperado: ${test.expectedFormValue})`);

    if (statusOk && formOk) {
        passed++;
    } else {
        failed++;
    }
});

console.log(`\n=== RESULTADO ===`);
console.log(`✅ Passou: ${passed}/${testCases.length}`);
console.log(`❌ Falhou: ${failed}/${testCases.length}`);

if (failed === 0) {
    console.log('\n🎉 Todos os testes passaram!');
    process.exit(0);
} else {
    console.log('\n⚠️  Alguns testes falharam!');
    process.exit(1);
}
