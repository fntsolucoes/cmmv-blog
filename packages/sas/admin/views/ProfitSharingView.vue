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
            <!-- Divisão mensal: tudo em boxes, exceto a listagem Distribuição por Sócio -->
            <div class="space-y-4">
                <div class="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
                    <h2 class="text-xl font-bold text-white mb-4">Resumo - {{ String(selectedMonth).padStart(2, '0') }}/{{ selectedYear }}</h2>

                    <div v-if="result.ordersCount === 0" class="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                        <p class="text-yellow-200">
                            <strong>Atenção:</strong> Nenhuma ordem de pagamento encontrada para o período selecionado.
                        </p>
                    </div>

                    <template v-else>
                        <div class="bg-neutral-700/50 rounded-lg border border-neutral-600 p-4 mb-4">
                            <p class="text-neutral-400 text-sm mb-3">Total bruto do período</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p class="text-neutral-500 text-xs font-medium mb-2">Com imposto</p>
                                    <div v-if="Object.keys(result.totalGrossWithTaxByCurrency || {}).length === 0" class="text-neutral-400 italic text-sm">
                                        Nenhum valor
                                    </div>
                                    <div v-else class="space-y-1.5 text-sm">
                                        <div v-for="(amount, currency) in result.totalGrossWithTaxByCurrency" :key="'with-' + currency" class="text-white">
                                            <span v-if="currency === 'BRL'">{{ currency }}: {{ formatCurrency(amount, currency) }}</span>
                                            <span v-else-if="currency === 'USD'">
                                                USD: {{ formatCurrency(amount, 'USD') }}
                                                <span v-if="(result.totalGrossWithTaxUsdInBRL ?? 0) > 0" class="text-neutral-400">(convertido: {{ formatCurrency(result.totalGrossWithTaxUsdInBRL, 'BRL') }})</span>
                                            </span>
                                            <span v-else-if="currency === 'EUR'">
                                                EUR: {{ formatCurrency(amount, 'EUR') }}
                                                <span v-if="(result.totalGrossWithTaxEurInBRL ?? 0) > 0" class="text-neutral-400">(convertido: {{ formatCurrency(result.totalGrossWithTaxEurInBRL, 'BRL') }})</span>
                                            </span>
                                            <span v-else>{{ currency }}: {{ formatCurrency(amount, currency) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-neutral-500 text-xs font-medium mb-2">Sem imposto</p>
                                    <div v-if="Object.keys(result.totalGrossWithoutTaxByCurrency || {}).length === 0" class="text-neutral-400 italic text-sm">
                                        Nenhum valor
                                    </div>
                                    <div v-else class="space-y-1.5 text-sm">
                                        <div v-for="(amount, currency) in result.totalGrossWithoutTaxByCurrency" :key="'without-' + currency" class="text-white">
                                            <span v-if="currency === 'BRL'">{{ currency }}: {{ formatCurrency(amount, currency) }}</span>
                                            <span v-else-if="currency === 'USD'">
                                                USD: {{ formatCurrency(amount, 'USD') }}
                                                <span v-if="(result.totalGrossWithoutTaxUsdInBRL ?? 0) > 0" class="text-neutral-400">(convertido: {{ formatCurrency(result.totalGrossWithoutTaxUsdInBRL, 'BRL') }})</span>
                                            </span>
                                            <span v-else-if="currency === 'EUR'">
                                                EUR: {{ formatCurrency(amount, 'EUR') }}
                                                <span v-if="(result.totalGrossWithoutTaxEurInBRL ?? 0) > 0" class="text-neutral-400">(convertido: {{ formatCurrency(result.totalGrossWithoutTaxEurInBRL, 'BRL') }})</span>
                                            </span>
                                            <span v-else>{{ currency }}: {{ formatCurrency(amount, currency) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p class="text-xs text-neutral-500 mt-2">Soma dos valores da fatura (antes de imposto e desconto)</p>
                            <div class="mt-4 pt-4 border-t border-neutral-600">
                                <p class="text-neutral-400 text-sm mb-1">Total final em R$</p>
                                <p class="text-2xl font-bold text-white">
                                    {{ formatCurrency(result.totalGrossFinalBRL ?? 0, 'BRL') }}
                                </p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div class="bg-neutral-700/50 rounded-lg border border-neutral-600 p-4 max-w-xs">
                                <p class="text-neutral-400 text-sm mb-2">Total por Moeda</p>
                                <div class="space-y-2">
                                    <div v-if="Object.keys(result.totalByCurrency || {}).length === 0" class="text-neutral-400 italic text-sm">
                                        Nenhum valor encontrado
                                    </div>
                                    <div v-for="(amount, currency) in result.totalByCurrency" :key="currency" class="text-white text-sm">
                                        <strong>{{ currency }}:</strong> {{ formatCurrency(amount, currency) }}
                                    </div>
                                </div>
                            </div>
                            <div class="bg-neutral-700/50 rounded-lg border border-neutral-600 p-4 max-w-xs">
                                <p class="text-neutral-400 text-sm mb-2">Total em BRL</p>
                                <p class="text-xl font-bold text-white">
                                    {{ formatCurrency(result.totalBRL || 0, 'BRL') }}
                                </p>
                            </div>
                            <div class="bg-neutral-700/50 rounded-lg border border-neutral-600 p-4 max-w-xs">
                                <p class="text-neutral-400 text-sm mb-2">Número de notas pagas</p>
                                <p class="text-2xl font-bold text-green-500">
                                    {{ result.ordersCount ?? 0 }}
                                </p>
                            </div>
                            <div class="bg-neutral-700/50 rounded-lg border border-neutral-600 p-4 max-w-xs">
                                <p class="text-neutral-400 text-sm mb-2">Número de notas em aberto</p>
                                <p class="text-2xl font-bold text-red-500">
                                    {{ result.ordersCountOpen ?? 0 }}
                                </p>
                            </div>
                        </div>

                        <div class="bg-neutral-700/50 rounded-lg border border-neutral-600 p-4">
                            <p class="text-neutral-400 text-sm mb-2">Total gasto em imposto por centro de custo</p>
                            <div v-if="!result.totalTaxByCostCenter || result.totalTaxByCostCenter.length === 0" class="text-neutral-400 italic">
                                Nenhum imposto no período
                            </div>
                            <div v-else class="space-y-2">
                                <div v-for="row in result.totalTaxByCostCenter" :key="row.costCenterId" class="flex justify-between items-center text-white">
                                    <span>{{ row.costCenterName }}</span>
                                    <span class="font-medium">{{ formatCurrency(row.taxAmount, 'BRL') }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Listagem Distribuição por Sócio fora do box -->
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



