<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Divisão de Lucros</h1>
            <div class="flex gap-2">
                <input v-model="selectedYear" type="number" placeholder="Ano" class="px-3 py-1 bg-neutral-700 text-white rounded-md text-sm" />
                <input v-model="selectedMonth" type="number" min="1" max="12" placeholder="Mês" class="px-3 py-1 bg-neutral-700 text-white rounded-md text-sm" />
                <button @click="calculateProfitSharing" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    Calcular
                </button>
            </div>
        </div>

        <div v-if="loading" class="bg-neutral-800 rounded-lg p-6 text-center">
            <p class="text-neutral-400">Calculando divisão de lucros...</p>
        </div>

        <div v-else-if="result" class="space-y-4">
            <div class="bg-neutral-800 rounded-lg p-6">
                <h2 class="text-xl font-bold text-white mb-4">Resumo - {{ String(selectedMonth).padStart(2, '0') }}/{{ selectedYear }}</h2>
                
                <div v-if="result.ordersCount === 0" class="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-4">
                    <p class="text-yellow-200">
                        <strong>Atenção:</strong> Nenhuma ordem de pagamento encontrada para o período selecionado.
                    </p>
                </div>

                <div v-else class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-neutral-400 text-sm">Total por Moeda</p>
                        <div class="mt-2 space-y-2">
                            <div v-if="Object.keys(result.totalByCurrency || {}).length === 0" class="text-neutral-400 italic">
                                Nenhum valor encontrado
                            </div>
                            <div v-for="(amount, currency) in result.totalByCurrency" :key="currency" class="text-white">
                                <strong>{{ currency }}:</strong> {{ formatCurrency(amount, currency) }}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p class="text-neutral-400 text-sm">Total em BRL</p>
                        <p class="text-2xl font-bold text-white mt-2">
                            {{ formatCurrency(result.totalBRL || 0, 'BRL') }}
                        </p>
                        <p class="text-xs text-neutral-400 mt-1">
                            {{ result.ordersCount || 0 }} ordem(ns) processada(s)
                        </p>
                    </div>
                </div>

                <div v-if="result.distribution && result.distribution.length > 0">
                    <p class="text-neutral-400 text-sm mb-2">Distribuição por Sócio</p>
                    <table class="min-w-full divide-y divide-neutral-700">
                        <thead class="bg-neutral-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Sócio</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Porcentagem</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Valor</th>
                            </tr>
                        </thead>
                        <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                            <tr v-for="dist in result.distribution" :key="dist.shareholderId" class="hover:bg-neutral-700">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ dist.shareholderName }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ dist.percentage }}%</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    {{ formatCurrency(dist.amount, 'BRL') }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else-if="result.ordersCount > 0" class="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                    <p class="text-yellow-200">
                        <strong>Atenção:</strong> Nenhum sócio ativo encontrado. Cadastre sócios para calcular a distribuição.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const result = ref<any>(null);
const loading = ref(false);

const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency === 'BRL' ? 'BRL' : (currency === 'EUR' ? 'EUR' : 'USD')
    }).format(value);
};

const calculateProfitSharing = async () => {
    if (!selectedYear.value || !selectedMonth.value) {
        alert('Por favor, selecione ano e mês');
        return;
    }

    loading.value = true;
    result.value = null;
    try {
        const response = await client.profitSharing.getMonthly(
            selectedYear.value.toString(),
            selectedMonth.value.toString()
        );
        // Verificar se a resposta tem data
        result.value = response?.data || response;
    } catch (error: any) {
        console.error('Erro ao calcular divisão de lucros:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
        alert(`Erro ao calcular divisão de lucros: ${errorMessage}`);
    } finally {
        loading.value = false;
    }
};
</script>



