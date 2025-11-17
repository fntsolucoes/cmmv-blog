<template>
    <div class="space-y-6">
        <!-- Cabeçalho e Ações -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Cotações de Moedas</h1>
            <div class="flex gap-2 mt-4 sm:mt-0">
                <button 
                    @click="handleImportCSV" 
                    :disabled="importing"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {{ importing ? 'Importando...' : 'Importar CSV' }}
                </button>
                <input
                    ref="fileInput"
                    type="file"
                    accept=".csv"
                    @change="handleFileSelect"
                    class="hidden"
                />
                <button 
                    @click="updateRates" 
                    :disabled="updating"
                    class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {{ updating ? 'Atualizando...' : 'Atualizar Cotações' }}
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-neutral-800 rounded-lg p-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Moeda -->
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Moeda</label>
                    <select
                        v-model="filters.currencyPair"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        @change="onCurrencyChange"
                    >
                        <option value="EUR-BRL">EUR-BRL (Euro)</option>
                        <option value="USD-BRL">USD-BRL (Dólar)</option>
                    </select>
                </div>

                <!-- Data Inicial -->
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Data Inicial</label>
                    <input
                        v-model="filters.startDate"
                        type="date"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <!-- Data Final -->
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Data Final</label>
                    <input
                        v-model="filters.endDate"
                        type="date"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <!-- Botões -->
                <div class="flex items-end gap-2">
                    <button
                        @click="applyFilters"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Aplicar
                    </button>
                    <button
                        @click="clearFilters"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
        </div>

        <!-- Última Cotação -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <div class="text-sm text-neutral-400 mb-1">Abertura</div>
                <div class="text-2xl font-bold text-white">{{ formatCurrency(latestRate?.rate) }}</div>
                <div class="text-xs text-neutral-500 mt-1">{{ formatDate(latestRate?.date) }}</div>
            </div>
            <div class="bg-neutral-800 rounded-lg p-4 border border-emerald-400">
                <div class="text-sm text-neutral-400 mb-1">Máxima</div>
                <div class="text-2xl font-bold text-emerald-400">{{ formatCurrency(latestRate?.rate) }}</div>
                <div class="text-xs text-neutral-500 mt-1">{{ formatDate(latestRate?.date) }}</div>
            </div>
            <div class="bg-neutral-800 rounded-lg p-4 border border-red-400">
                <div class="text-sm text-neutral-400 mb-1">Mínima</div>
                <div class="text-2xl font-bold text-red-400">{{ formatCurrency(latestRate?.rate) }}</div>
                <div class="text-xs text-neutral-500 mt-1">{{ formatDate(latestRate?.date) }}</div>
            </div>
            <div class="bg-neutral-800 rounded-lg p-4 border border-blue-400">
                <div class="text-sm text-neutral-400 mb-1">Fechamento</div>
                <div class="text-2xl font-bold text-blue-400">{{ formatCurrency(latestRate?.rate) }}</div>
                <div class="text-xs text-neutral-500 mt-1">{{ formatDate(latestRate?.date) }}</div>
            </div>
        </div>

        <!-- Estatísticas (últimos 30 dias) -->
        <div>
            <h2 class="text-lg font-semibold text-white mb-4">Estatísticas (últimos 30 dias)</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div class="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                    <div class="text-sm text-neutral-400 mb-1">Média Abertura</div>
                    <div class="text-xl font-bold text-white">{{ formatCurrency(stats30Days.average) }}</div>
                </div>
                <div class="bg-neutral-800 rounded-lg p-4 border border-emerald-400">
                    <div class="text-sm text-neutral-400 mb-1">Média Máxima</div>
                    <div class="text-xl font-bold text-emerald-400">{{ formatCurrency(stats30Days.average) }}</div>
                </div>
                <div class="bg-neutral-800 rounded-lg p-4 border border-red-400">
                    <div class="text-sm text-neutral-400 mb-1">Média Mínima</div>
                    <div class="text-xl font-bold text-red-400">{{ formatCurrency(stats30Days.average) }}</div>
                </div>
                <div class="bg-neutral-800 rounded-lg p-4 border border-blue-400">
                    <div class="text-sm text-neutral-400 mb-1">Média Fechamento</div>
                    <div class="text-xl font-bold text-blue-400">{{ formatCurrency(stats30Days.average) }}</div>
                </div>
                <div class="bg-neutral-800 rounded-lg p-4 border border-red-400">
                    <div class="text-sm text-neutral-400 mb-1">Fechamento Mínimo</div>
                    <div class="text-xl font-bold text-red-400">{{ formatCurrency(stats30Days.min) }}</div>
                </div>
                <div class="bg-neutral-800 rounded-lg p-4 border border-emerald-400">
                    <div class="text-sm text-neutral-400 mb-1">Fechamento Máximo</div>
                    <div class="text-xl font-bold text-emerald-400">{{ formatCurrency(stats30Days.max) }}</div>
                </div>
            </div>
        </div>

        <!-- Histórico -->
        <div>
            <h2 class="text-lg font-semibold text-white mb-4">Histórico</h2>
            <div class="bg-neutral-800 rounded-lg overflow-hidden">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Data</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Abertura</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Máxima</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Mínima</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Fechamento</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Variação</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-if="filteredRates.length === 0">
                            <td colspan="6" class="px-6 py-4 text-center text-sm text-neutral-400">
                                Nenhuma taxa encontrada
                            </td>
                        </tr>
                        <tr v-for="(rate, index) in filteredRates" :key="rate.id" class="hover:bg-neutral-700">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ formatDate(rate.date) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ formatCurrency(rate.rate) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-400">{{ formatCurrency(rate.rate) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-400">{{ formatCurrency(rate.rate) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-400">{{ formatCurrency(rate.rate) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getVariationClass(rate, index)">
                                {{ getVariation(rate, index) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();

// Dados
const rates = ref<any[]>([]);
const latestRate = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Filtros
const filters = ref({
    currencyPair: 'EUR-BRL',
    startDate: '',
    endDate: ''
});

// Estados
const importing = ref(false);
const updating = ref(false);

// Função auxiliar para normalizar data (remover timezone e horas)
const normalizeDate = (date: Date | string): Date => {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Criar nova data usando apenas ano, mês e dia (evita problemas de timezone)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// Função auxiliar para comparar apenas a parte de data
const compareDatesOnly = (date1: Date | string, date2: Date | string): number => {
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    return d1.getTime() - d2.getTime();
};

// Computed: Taxas filtradas
const filteredRates = computed(() => {
    let filtered = rates.value.filter(rate => rate.currencyPair === filters.value.currencyPair);
    
    if (filters.value.startDate) {
        // Quando o input type="date" retorna "YYYY-MM-DD", precisamos criar a data corretamente
        const startDateStr = filters.value.startDate; // Formato: "YYYY-MM-DD"
        const [year, month, day] = startDateStr.split('-').map(Number);
        const startDate = new Date(year, month - 1, day); // month é 0-indexed
        
        filtered = filtered.filter(rate => {
            const rateDate = normalizeDate(rate.date);
            return compareDatesOnly(rateDate, startDate) >= 0;
        });
    }
    
    if (filters.value.endDate) {
        // Quando o input type="date" retorna "YYYY-MM-DD", precisamos criar a data corretamente
        const endDateStr = filters.value.endDate; // Formato: "YYYY-MM-DD"
        const [year, month, day] = endDateStr.split('-').map(Number);
        const endDate = new Date(year, month - 1, day); // month é 0-indexed
        
        filtered = filtered.filter(rate => {
            const rateDate = normalizeDate(rate.date);
            return compareDatesOnly(rateDate, endDate) <= 0;
        });
    }
    
    // Ordenar por data (mais recente primeiro)
    return filtered.sort((a, b) => {
        const dateA = normalizeDate(a.date).getTime();
        const dateB = normalizeDate(b.date).getTime();
        return dateB - dateA;
    });
});

// Computed: Estatísticas dos últimos 30 dias
const stats30Days = computed(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const recentRates = rates.value.filter(rate => {
        if (rate.currencyPair !== filters.value.currencyPair) return false;
        const rateDate = new Date(rate.date);
        rateDate.setHours(0, 0, 0, 0);
        return rateDate >= thirtyDaysAgo;
    });
    
    if (recentRates.length === 0) {
        return { average: 0, min: 0, max: 0 };
    }
    
    const values = recentRates.map(r => r.rate);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { average, min, max };
});

// Funções auxiliares
const formatCurrency = (value: number | undefined | null): string => {
    if (value === null || value === undefined || isNaN(value)) {
        return 'R$ 0,0000';
    }
    return `R$ ${value.toFixed(4).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
};

const getVariation = (rate: any, index: number): string => {
    if (index === filteredRates.value.length - 1) {
        return '-';
    }
    
    const previousRate = filteredRates.value[index + 1];
    if (!previousRate) return '-';
    
    const variation = rate.rate - previousRate.rate;
    
    if (variation === 0) return '-';
    
    const sign = variation > 0 ? '+' : '';
    return `${sign}${formatCurrency(variation)}`;
};

const getVariationClass = (rate: any, index: number): string => {
    if (index === filteredRates.value.length - 1) {
        return 'text-neutral-400';
    }
    
    const previousRate = filteredRates.value[index + 1];
    if (!previousRate) return 'text-neutral-400';
    
    const variation = rate.rate - previousRate.rate;
    
    if (variation === 0) return 'text-neutral-400';
    if (variation > 0) return 'text-emerald-400';
    return 'text-red-400';
};

// Carregar dados
const loadData = async () => {
    try {
        const response = await client.exchangeRates.get({});
        rates.value = response.data || [];
        
        // Carregar última cotação
        await loadLatestRate();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
};

const loadLatestRate = async () => {
    try {
        const response = await client.exchangeRates.getLatest(filters.value.currencyPair);
        latestRate.value = response.data || null;
    } catch (error) {
        console.error('Erro ao carregar última cotação:', error);
        latestRate.value = null;
    }
};

// Filtros
const onCurrencyChange = () => {
    loadLatestRate();
    applyFilters();
};

const applyFilters = () => {
    // Os filtros são aplicados automaticamente pelo computed
    loadLatestRate();
};

const clearFilters = () => {
    filters.value.startDate = '';
    filters.value.endDate = '';
    applyFilters();
};

// Importar CSV
const handleImportCSV = () => {
    if (fileInput.value) {
        fileInput.value.click();
    }
};

const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 5MB');
        return;
    }
    
    if (!file.name.endsWith('.csv')) {
        alert('Por favor, selecione um arquivo CSV');
        return;
    }
    
    importing.value = true;
    
    try {
        console.log('Lendo arquivo:', file.name, 'Tamanho:', file.size);
        const text = await file.text();
        console.log('Conteúdo lido (primeiros 500 caracteres):', text.substring(0, 500));
        
        const result = await client.exchangeRates.importCSV(text, filters.value.currencyPair, file.name);
        console.log('Resultado da importação:', result);
        
        let message = `Importação concluída!\n`;
        message += `Registros importados: ${result.data.imported}\n`;
        message += `Registros atualizados: ${result.data.updated}`;
        
        if (result.data.errors && result.data.errors.length > 0) {
            message += `\n\nErros encontrados (${result.data.errors.length}):\n${result.data.errors.join('\n')}`;
            if (result.data.errors.length >= 10) {
                message += '\n... (mais erros não exibidos)';
            }
        }
        
        if (result.data.imported === 0 && result.data.updated === 0 && result.data.errors.length > 0) {
            alert(`Erro na importação:\n\n${result.data.errors.join('\n')}\n\nVerifique o console para mais detalhes.`);
        } else {
            alert(message);
            await loadData();
        }
    } catch (error: any) {
        console.error('Erro ao importar CSV:', error);
        console.error('Stack:', error.stack);
        let errorMessage = 'Erro ao importar CSV.\n\n';
        if (error.response?.data?.message) {
            errorMessage += `Mensagem: ${error.response.data.message}\n`;
        }
        if (error.message) {
            errorMessage += `Erro: ${error.message}\n`;
        }
        errorMessage += '\nVerifique o console para mais detalhes.';
        alert(errorMessage);
    } finally {
        importing.value = false;
        if (fileInput.value) {
            fileInput.value.value = '';
        }
    }
};

// Atualizar cotações
const updateRates = async () => {
    updating.value = true;
    const startTime = Date.now();
    
    try {
        const result = await client.exchangeRates.fetchLast30Days();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        alert(`Cotações atualizadas com sucesso!\nRegistros salvos: ${result.data.count}\nTempo de execução: ${duration}s`);
        await loadData();
    } catch (error: any) {
        console.error('Erro ao atualizar cotações:', error);
        alert('Erro ao atualizar cotações. Verifique o console para mais detalhes.');
    } finally {
        updating.value = false;
    }
};

onMounted(() => {
    loadData();
});
</script>
