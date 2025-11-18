<template>
    <div class="space-y-6">
        <!-- Cabeçalho e Ações -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Cotações de Moedas</h1>
            <div class="flex gap-2 mt-4 sm:mt-0">
                <button 
                    @click="handleImportCSV" 
                    :disabled="importing || validating"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {{ importing ? 'Importando...' : 'Importar CSV' }}
                </button>
                <button 
                    @click="handleValidateImport" 
                    :disabled="importing || validating || !lastImportedFile"
                    class="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Validar se todos os registros do último arquivo importado foram salvos no banco"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ validating ? 'Validando...' : 'Validar Importação' }}
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
                <div class="text-2xl font-bold text-white">{{ latestRate?.open ? formatCurrency(latestRate.open) : '-' }}</div>
                <div class="text-xs text-neutral-500 mt-1">{{ formatDate(latestRate?.date) }}</div>
            </div>
            <div class="bg-neutral-800 rounded-lg p-4 border border-emerald-400">
                <div class="text-sm text-neutral-400 mb-1">Máxima</div>
                <div class="text-2xl font-bold text-emerald-400">{{ latestRate?.high ? formatCurrency(latestRate.high) : '-' }}</div>
                <div class="text-xs text-neutral-500 mt-1">{{ formatDate(latestRate?.date) }}</div>
            </div>
            <div class="bg-neutral-800 rounded-lg p-4 border border-red-400">
                <div class="text-sm text-neutral-400 mb-1">Mínima</div>
                <div class="text-2xl font-bold text-red-400">{{ latestRate?.low ? formatCurrency(latestRate.low) : '-' }}</div>
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
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-white">
                    Histórico 
                    <span v-if="totalRecords > 0" class="text-sm text-neutral-400 font-normal">
                        ({{ totalRecords }} registro{{ totalRecords !== 1 ? 's' : '' }})
                    </span>
                </h2>
                <div v-if="!loading && filteredRates.length > 0" class="text-xs text-neutral-400">
                    Mostrando {{ filteredRates.length }} de {{ totalRecords }}
                </div>
            </div>
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
                        <tr v-if="loading">
                            <td colspan="6" class="px-6 py-4 text-center text-sm text-neutral-400">
                                Carregando...
                            </td>
                        </tr>
                        <tr v-else-if="filteredRates.length === 0">
                            <td colspan="6" class="px-6 py-4 text-center text-sm text-neutral-400">
                                <div>
                                    <p>Nenhuma taxa encontrada</p>
                                    <p class="text-xs mt-2 text-neutral-500">
                                        Total de registros: {{ totalRecords }} | 
                                        Página: {{ currentPage }}/{{ totalPages }}
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <tr v-for="(rate, index) in filteredRates" :key="rate.id" class="hover:bg-neutral-700">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ formatDate(rate.date) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ rate.open ? formatCurrency(rate.open) : '-' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-emerald-400">{{ rate.high ? formatCurrency(rate.high) : '-' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-400">{{ rate.low ? formatCurrency(rate.low) : '-' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-400">{{ formatCurrency(rate.rate) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getVariationClass(rate, index)">
                                {{ getVariation(rate, index) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <!-- Paginação -->
                <div v-if="!loading && totalRecords > 0" class="bg-neutral-700 px-6 py-4 flex items-center justify-between border-t border-neutral-600">
                    <div class="text-sm text-neutral-300">
                        Mostrando {{ ((currentPage - 1) * itemsPerPage) + 1 }} a {{ Math.min(currentPage * itemsPerPage, totalRecords) }} de {{ totalRecords }} registro{{ totalRecords !== 1 ? 's' : '' }}
                    </div>
                    <div v-if="totalPages > 1" class="flex gap-2">
                        <button
                            @click="prevPage"
                            :disabled="currentPage === 1 || loading"
                            class="px-3 py-1 bg-neutral-600 hover:bg-neutral-500 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <span class="px-3 py-1 text-sm text-neutral-300">
                            Página {{ currentPage }} de {{ totalPages }}
                        </span>
                        <button
                            @click="nextPage"
                            :disabled="currentPage === totalPages || loading"
                            class="px-3 py-1 bg-neutral-600 hover:bg-neutral-500 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                    <div v-else class="text-xs text-neutral-400">
                        Página única
                    </div>
                </div>
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

// Paginação
const currentPage = ref(1);
const itemsPerPage = 30;
const totalRecords = ref(0);
const totalPages = ref(0);

// Estados
const importing = ref(false);
const updating = ref(false);
const validating = ref(false);
const lastImportedFile = ref<string | null>(null);
const loading = ref(false);

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

// Computed: Taxas filtradas (agora vem paginado do servidor)
const filteredRates = computed(() => {
    // Os dados já vêm filtrados e paginados do servidor
    const result = rates.value || [];
    console.log('[ExchangeRatesView] filteredRates computed:', {
        count: result.length,
        sample: result.slice(0, 2)
    });
    return result;
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
    // Usar UTC para evitar problemas de timezone
    // A data está armazenada em UTC, então usamos getUTC* para formatar
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
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
    loading.value = true;
    try {
        // Converter todos os valores para string (URLSearchParams requer strings)
        const params: Record<string, string> = {
            currencyPair: filters.value.currencyPair,
            limit: String(itemsPerPage),
            page: String(currentPage.value),
            orderBy: 'DESC'
        };
        
        // Adicionar filtros de data se existirem
        if (filters.value.startDate) {
            params.startDate = filters.value.startDate;
        }
        if (filters.value.endDate) {
            params.endDate = filters.value.endDate;
        }
        
        console.log('[ExchangeRatesView] Carregando dados com parâmetros:', params);
        const response = await client.exchangeRates.get(params);
        console.log('[ExchangeRatesView] Resposta recebida (tipo):', typeof response, 'É array?', Array.isArray(response));
        
        // Processar resposta - o framework pode envolver em .data
        let finalData: any = null;
        
        if (Array.isArray(response)) {
            // Se a resposta é um array direto
            finalData = {
                data: response,
                total: response.length,
                totalPages: Math.ceil(response.length / itemsPerPage)
            };
        } else if (response && typeof response === 'object') {
            // Se response.data é um array, usar diretamente
            if (response.data && Array.isArray(response.data)) {
                finalData = response;
            }
            // Se response.data existe mas não é array, verificar se tem .data.data
            else if (response.data && typeof response.data === 'object' && response.data.data && Array.isArray(response.data.data)) {
                finalData = response.data;
            }
            // Se response é um objeto mas não tem estrutura esperada
            else {
                console.warn('[ExchangeRatesView] Estrutura de resposta inesperada:', response);
                finalData = { data: [], total: 0, totalPages: 0 };
            }
        } else {
            console.warn('[ExchangeRatesView] Resposta inválida:', response);
            finalData = { data: [], total: 0, totalPages: 0 };
        }
        
        rates.value = finalData.data || [];
        totalRecords.value = finalData.total || 0;
        totalPages.value = finalData.totalPages || 0;
        
        console.log('[ExchangeRatesView] Dados processados:', {
            ratesCount: rates.value.length,
            ratesSample: rates.value.slice(0, 2),
            totalRecords: totalRecords.value,
            totalPages: totalPages.value,
            currentPage: currentPage.value
        });
        
        // Carregar última cotação
        await loadLatestRate();
    } catch (error) {
        console.error('[ExchangeRatesView] Erro ao carregar dados:', error);
        rates.value = [];
        totalRecords.value = 0;
        totalPages.value = 0;
    } finally {
        loading.value = false;
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
    currentPage.value = 1;
    loadData();
};

const applyFilters = () => {
    // Resetar para primeira página ao aplicar filtros
    currentPage.value = 1;
    loadData();
};

const clearFilters = () => {
    filters.value.startDate = '';
    filters.value.endDate = '';
    currentPage.value = 1;
    loadData();
};

// Navegação de páginas
const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        loadData();
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
        loadData();
    }
};

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
        loadData();
    }
};

// Importar CSV
const handleImportCSV = () => {
    // Garantir que uma moeda foi selecionada antes de importar
    if (!filters.value.currencyPair) {
        alert('Selecione a moeda (por exemplo, EUR-BRL ou USD-BRL) antes de importar o arquivo CSV.');
        return;
    }

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
        
        // Guardar conteúdo do arquivo para validação posterior
        lastImportedFile.value = text;
        
        const result = await client.exchangeRates.importCSV(text, filters.value.currencyPair, file.name);
        console.log('=== RESULTADO DA IMPORTAÇÃO ===');
        console.log('Resultado completo:', result);
        console.log('Result.data:', result.data);
        console.log('Registros importados:', result.data.imported);
        console.log('Registros atualizados:', result.data.updated);
        console.log('Total de erros:', result.data.errors?.length || 0);
        if (result.data.errors && result.data.errors.length > 0) {
            console.log('Erros detalhados:', result.data.errors);
        }
        console.log('=== FIM DO RESULTADO ===');
        
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

// Validar importação
const handleValidateImport = async () => {
    console.log('=== INÍCIO DA VALIDAÇÃO ===');
    console.log('1. Verificando condições iniciais...');
    console.log('   - lastImportedFile existe?', !!lastImportedFile.value);
    console.log('   - lastImportedFile tamanho:', lastImportedFile.value?.length || 0);
    console.log('   - currencyPair selecionada:', filters.value.currencyPair);
    
    if (!lastImportedFile.value || !filters.value.currencyPair) {
        console.log('❌ ERRO: Condições não atendidas');
        alert('Nenhum arquivo foi importado ainda ou moeda não selecionada.');
        return;
    }
    
    console.log('2. Iniciando validação...');
    validating.value = true;
    
    try {
        console.log('3. Chamando API de validação...');
        console.log('   - Parâmetros:', {
            currencyPair: filters.value.currencyPair,
            csvContentLength: lastImportedFile.value.length,
            csvContentPreview: lastImportedFile.value.substring(0, 200)
        });
        
        const result = await client.exchangeRates.validateImport(lastImportedFile.value, filters.value.currencyPair);
        
        console.log('4. Resposta recebida da API:');
        console.log('   - Result completo:', result);
        console.log('   - Result.data:', result.data);
        
        const validation = result.data;
        
        console.log('5. Dados de validação:');
        console.log('   - CSV Records:', validation.csvRecords);
        console.log('   - DB Records:', validation.dbRecords);
        console.log('   - Matches:', validation.matches);
        console.log('   - Missing count:', validation.missing?.length || 0);
        console.log('   - Extra count:', validation.extra?.length || 0);
        console.log('   - Errors count:', validation.errors?.length || 0);
        
        if (validation.missing && validation.missing.length > 0) {
            console.log('   - Missing (primeiros 5):', validation.missing.slice(0, 5));
        }
        
        if (validation.extra && validation.extra.length > 0) {
            console.log('   - Extra (primeiros 5):', validation.extra.slice(0, 5));
        }
        
        if (validation.errors && validation.errors.length > 0) {
            console.log('   - Errors:', validation.errors);
        }
        
        let message = `=== VALIDAÇÃO DA IMPORTAÇÃO ===\n\n`;
        message += `Registros no CSV: ${validation.csvRecords}\n`;
        message += `Registros no banco: ${validation.dbRecords}\n`;
        message += `Registros que coincidem: ${validation.matches}\n\n`;
        
        if (validation.missing.length > 0) {
            message += `⚠️ REGISTROS FALTANDO NO BANCO (${validation.missing.length}):\n`;
            validation.missing.slice(0, 10).forEach(item => {
                message += `  - ${item.date}: R$ ${item.rate.toFixed(4)}\n`;
            });
            if (validation.missing.length > 10) {
                message += `  ... e mais ${validation.missing.length - 10} registros\n`;
            }
            message += `\n`;
        }
        
        if (validation.extra.length > 0) {
            message += `ℹ️ REGISTROS EXTRAS NO BANCO (não no CSV) (${validation.extra.length}):\n`;
            validation.extra.slice(0, 5).forEach(item => {
                message += `  - ${item.date}: R$ ${item.rate.toFixed(4)}\n`;
            });
            if (validation.extra.length > 5) {
                message += `  ... e mais ${validation.extra.length - 5} registros\n`;
            }
            message += `\n`;
        }
        
        if (validation.errors.length > 0) {
            message += `❌ ERROS ENCONTRADOS (${validation.errors.length}):\n`;
            validation.errors.forEach(err => {
                message += `  - ${err}\n`;
            });
            message += `\n`;
        }
        
        if (validation.missing.length === 0 && validation.errors.length === 0) {
            message += `✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!\n`;
            message += `Todos os ${validation.csvRecords} registros do CSV foram importados corretamente.`;
            console.log('✅ VALIDAÇÃO SUCESSO: Todos os registros foram importados corretamente');
        } else {
            message += `⚠️ ATENÇÃO: Alguns registros não foram importados ou há diferenças.`;
            console.log('⚠️ VALIDAÇÃO COM PROBLEMAS: Há registros faltando ou erros');
        }
        
        console.log('6. Mensagem final que será exibida:');
        console.log(message);
        console.log('=== FIM DA VALIDAÇÃO ===');
        
        alert(message);
    } catch (error: any) {
        console.error('=== ERRO NA VALIDAÇÃO ===');
        console.error('Erro completo:', error);
        console.error('Erro tipo:', typeof error);
        console.error('Erro message:', error.message);
        console.error('Erro stack:', error.stack);
        console.error('Erro response:', error.response);
        console.error('Erro response.data:', error.response?.data);
        console.error('Erro response.status:', error.response?.status);
        console.error('=== FIM DO ERRO ===');
        
        let errorMessage = 'Erro ao validar importação.\n\n';
        if (error.response?.data?.message) {
            errorMessage += `Mensagem: ${error.response.data.message}\n`;
        }
        if (error.message) {
            errorMessage += `Erro: ${error.message}\n`;
        }
        errorMessage += '\nVerifique o console para mais detalhes.';
        alert(errorMessage);
    } finally {
        console.log('7. Finalizando validação (finally)');
        validating.value = false;
        console.log('=== VALIDAÇÃO FINALIZADA ===');
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
