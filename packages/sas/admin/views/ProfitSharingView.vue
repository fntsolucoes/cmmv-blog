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

        <div v-if="result" class="space-y-4">
            <div class="bg-neutral-800 rounded-lg p-6">
                <h2 class="text-xl font-bold text-white mb-4">Resumo - {{ selectedMonth }}/{{ selectedYear }}</h2>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-neutral-400 text-sm">Total por Moeda</p>
                        <div class="mt-2 space-y-2">
                            <div v-for="(amount, currency) in result.totalByCurrency" :key="currency" class="text-white">
                                <strong>{{ currency }}:</strong> {{ amount.toLocaleString('pt-BR', { style: 'currency', currency: currency === 'BRL' ? 'BRL' : 'USD' }) }}
                            </div>
                        </div>
                    </div>
                    <div>
                        <p class="text-neutral-400 text-sm">Total em BRL</p>
                        <p class="text-2xl font-bold text-white mt-2">
                            {{ result.totalBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                        </p>
                    </div>
                </div>

                <div>
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
                                    {{ dist.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
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

const calculateProfitSharing = async () => {
    if (!selectedYear.value || !selectedMonth.value) {
        alert('Por favor, selecione ano e mês');
        return;
    }

    loading.value = true;
    try {
        const response = await client.profitSharing.getMonthly(
            selectedYear.value.toString(),
            selectedMonth.value.toString()
        );
        result.value = response;
    } catch (error) {
        console.error('Erro ao calcular divisão de lucros:', error);
        alert('Erro ao calcular divisão de lucros. Verifique o console para mais detalhes.');
    } finally {
        loading.value = false;
    }
};
</script>

