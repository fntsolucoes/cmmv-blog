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
                    <div class="flex items-center gap-2 mb-4">
                        <h2 class="text-xl font-bold text-white">Resumo - {{ String(selectedMonth).padStart(2, '0') }}/{{ selectedYear }}</h2>
                        <button
                            type="button"
                            @click="openOrdersModal"
                            class="px-2.5 py-1 bg-neutral-600 hover:bg-neutral-500 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1"
                            title="Ver ordens de pagamento do período"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Ver ordens
                        </button>
                    </div>

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

        <!-- Modal: Ordens de pagamento do período -->
        <div v-if="showOrdersModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-5xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center shrink-0">
                    <h3 class="text-lg font-medium text-white">
                        Ordens de pagamento - {{ String(selectedMonth).padStart(2, '0') }}/{{ selectedYear }}
                    </h3>
                    <button @click="closeOrdersModal" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-4 overflow-auto flex-1">
                    <div v-if="loadingOrders" class="text-center py-8 text-neutral-400">Carregando ordens...</div>
                    <div v-else-if="!modalOrders.length" class="text-center py-8 text-neutral-400">Nenhuma ordem de pagamento neste período.</div>
                    <template v-else>
                        <table class="min-w-full divide-y divide-neutral-700">
                            <thead class="bg-neutral-700 sticky top-0">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Parceiro comercial</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Data pagamento</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Valor fatura</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Moeda</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Valor pago (BRL)</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                                <tr v-for="order in modalOrdersPaginated" :key="order.id" class="hover:bg-neutral-700">
                                    <td class="px-4 py-3 text-sm text-white">{{ order.commercialPartnerName ?? '-' }}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-white">
                                        {{ order.effectivePaymentDate ? formatDate(order.effectivePaymentDate) : '-' }}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-white">
                                        {{ formatCurrency(order.invoiceAmount ?? 0, order.currency || 'BRL') }}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-white">{{ order.currency || '-' }}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-white">
                                        {{ formatCurrency(order.paidValue ?? 0, 'BRL') }}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-white">{{ order.status || '-' }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="modalOrdersTotalPages > 1" class="mt-4 flex items-center justify-between border-t border-neutral-700 pt-4">
                            <p class="text-sm text-neutral-400">
                                Notas {{ modalOrdersRange.from }}-{{ modalOrdersRange.to }} de {{ modalOrders.length }}
                            </p>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    :disabled="modalOrdersPage <= 1"
                                    @click="modalOrdersPage = Math.max(1, modalOrdersPage - 1)"
                                    class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 bg-neutral-700 hover:bg-neutral-600 disabled:hover:bg-neutral-700"
                                >
                                    Anterior
                                </button>
                                <span class="px-3 py-1.5 text-sm text-neutral-400">
                                    Página {{ modalOrdersPage }} de {{ modalOrdersTotalPages }}
                                </span>
                                <button
                                    type="button"
                                    :disabled="modalOrdersPage >= modalOrdersTotalPages"
                                    @click="modalOrdersPage = Math.min(modalOrdersTotalPages, modalOrdersPage + 1)"
                                    class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-neutral-300 bg-neutral-700 hover:bg-neutral-600 disabled:hover:bg-neutral-700"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSasClient } from '../client';

const ORDERS_PAGE_SIZE = 40;

const client = useSasClient();
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const result = ref<any>(null);
const loading = ref(false);
const showOrdersModal = ref(false);
const modalOrders = ref<any[]>([]);
const modalOrdersPage = ref(1);
const loadingOrders = ref(false);

const modalOrdersPaginated = computed(() => {
    const start = (modalOrdersPage.value - 1) * ORDERS_PAGE_SIZE;
    return modalOrders.value.slice(start, start + ORDERS_PAGE_SIZE);
});
const modalOrdersTotalPages = computed(() =>
    Math.max(1, Math.ceil(modalOrders.value.length / ORDERS_PAGE_SIZE))
);
const modalOrdersRange = computed(() => {
    const total = modalOrders.value.length;
    if (total === 0) return { from: 0, to: 0 };
    const from = (modalOrdersPage.value - 1) * ORDERS_PAGE_SIZE + 1;
    const to = Math.min(modalOrdersPage.value * ORDERS_PAGE_SIZE, total);
    return { from, to };
});

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

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

const openOrdersModal = async () => {
    if (!selectedYear.value || !selectedMonth.value) return;
    showOrdersModal.value = true;
    modalOrders.value = [];
    modalOrdersPage.value = 1;
    loadingOrders.value = true;
    try {
        const response = await client.profitSharing.getMonthlyOrders(
            String(selectedYear.value),
            String(selectedMonth.value)
        );
        const raw = response?.data ?? response;
        modalOrders.value = Array.isArray(raw) ? raw : (raw?.data ?? []);
    } catch (error: any) {
        console.error('Erro ao carregar ordens:', error);
        const msg = error.response?.data?.message || error.message || 'Erro ao carregar ordens';
        alert(msg);
    } finally {
        loadingOrders.value = false;
    }
};

const closeOrdersModal = () => {
    showOrdersModal.value = false;
};
</script>



