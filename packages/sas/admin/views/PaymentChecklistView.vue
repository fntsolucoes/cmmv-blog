<template>
    <div class="space-y-6">
        <!-- Cabeçalho -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Checklist de Pagamentos</h1>
        </div>

        <!-- Seleção de Ano e Mês -->
        <div class="bg-neutral-800 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Ano</label>
                    <select
                        v-model.number="selectedYear"
                        @change="loadChecklist"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Mês</label>
                    <select
                        v-model.number="selectedMonth"
                        @change="loadChecklist"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option v-for="(month, index) in months" :key="index" :value="index + 1">{{ month }}</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Listagem de Parceiros -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="p-4 border-b border-neutral-700">
                <h2 class="text-lg font-semibold text-white">Parceiros Comerciais</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th 
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600"
                                @click="sortBy('name')"
                            >
                                <div class="flex items-center">
                                    Parceiro
                                    <span v-if="sortColumn === 'name'" class="ml-1">
                                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                    </span>
                                    <span v-else class="ml-1 text-neutral-500 text-xs">↕</span>
                                </div>
                            </th>
                            <th 
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600"
                                @click="sortBy('type')"
                            >
                                <div class="flex items-center">
                                    Tipo
                                    <span v-if="sortColumn === 'type'" class="ml-1">
                                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                    </span>
                                    <span v-else class="ml-1 text-neutral-500 text-xs">↕</span>
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Valor Captado</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Valor Validado</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Valor Recusado</th>
                            <th 
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600"
                                @click="sortBy('invoiceIssued')"
                            >
                                <div class="flex items-center">
                                    Nota Emitida
                                    <span v-if="sortColumn === 'invoiceIssued'" class="ml-1">
                                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                    </span>
                                    <span v-else class="ml-1 text-neutral-500 text-xs">↕</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-if="checklistData.length === 0 && !loading">
                            <td colspan="6" class="px-4 py-4 text-center text-sm text-neutral-400">
                                Nenhum parceiro encontrado
                            </td>
                        </tr>
                        <tr v-if="loading">
                            <td colspan="6" class="px-4 py-4 text-center text-sm text-neutral-400">
                                Carregando...
                            </td>
                        </tr>
                        <tr v-for="item in checklistData" :key="item.partner.id" class="hover:bg-neutral-700">
                            <td class="px-4 py-3 text-sm text-white">{{ item.partner.name }}</td>
                            <td class="px-4 py-3 text-sm text-white">
                                <span :class="item.partner.partnerType === 'Direto' ? 'bg-blue-500' : 'bg-purple-500'" 
                                      class="px-2 py-1 text-xs rounded-full text-white">
                                    {{ item.partner.partnerType === 'Rede de Afiliação' ? 'Rede' : item.partner.partnerType }}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <input
                                    :value="formatCurrencyInput(item.checklist.capturedValue)"
                                    @input="handleValueInput($event, item.checklist, 'capturedValue')"
                                    @blur="saveItem(item)"
                                    type="text"
                                    placeholder="0,00"
                                    maxlength="15"
                                    class="w-32 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </td>
                            <td class="px-4 py-3">
                                <input
                                    :value="formatCurrencyInput(item.checklist.validatedValue)"
                                    @input="handleValueInput($event, item.checklist, 'validatedValue')"
                                    @blur="saveItem(item)"
                                    type="text"
                                    placeholder="0,00"
                                    maxlength="15"
                                    class="w-32 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </td>
                            <td class="px-4 py-3">
                                <input
                                    :value="formatCurrencyInput(item.checklist.rejectedValue)"
                                    @input="handleValueInput($event, item.checklist, 'rejectedValue')"
                                    @blur="saveItem(item)"
                                    type="text"
                                    placeholder="0,00"
                                    maxlength="15"
                                    class="w-32 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </td>
                            <td class="px-4 py-3 text-center">
                                <input
                                    v-model="item.checklist.invoiceIssued"
                                    @change="saveItem(item)"
                                    type="checkbox"
                                    class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSasClient } from '../../client/client.vue3';

const client = useSasClient();

const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const checklistData = ref([]);
const loading = ref(false);
const sortColumn = ref('');
const sortDirection = ref('asc');

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const loadChecklist = async () => {
    if (!selectedYear.value || !selectedMonth.value) return;
    
    loading.value = true;
    try {
        const response = await client.paymentChecklist.get({
            year: selectedYear.value.toString(),
            month: selectedMonth.value.toString()
        });
        
        if (response?.data) {
            checklistData.value = response.data;
            // Aplicar ordenação após carregar
            applySorting();
        }
    } catch (error) {
        console.error('Erro ao carregar checklist:', error);
        alert('Erro ao carregar checklist');
    } finally {
        loading.value = false;
    }
};

const sortBy = (column) => {
    if (sortColumn.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn.value = column;
        sortDirection.value = 'asc';
    }
    applySorting();
};

const applySorting = () => {
    if (!sortColumn.value) return;
    
    checklistData.value.sort((a, b) => {
        let aVal, bVal;
        
        if (sortColumn.value === 'name') {
            aVal = (a.partner.name || '').toLowerCase();
            bVal = (b.partner.name || '').toLowerCase();
        } else if (sortColumn.value === 'type') {
            aVal = (a.partner.partnerType || '').toLowerCase();
            bVal = (b.partner.partnerType || '').toLowerCase();
        } else if (sortColumn.value === 'invoiceIssued') {
            aVal = a.checklist.invoiceIssued ? 1 : 0;
            bVal = b.checklist.invoiceIssued ? 1 : 0;
        }
        
        if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
    });
};

const saveItem = async (item) => {
    try {
        await client.paymentChecklist.save({
            commercialPartnerId: item.partner.id,
            year: selectedYear.value,
            month: selectedMonth.value,
            capturedValue: item.checklist.capturedValue || 0,
            validatedValue: item.checklist.validatedValue || 0,
            rejectedValue: item.checklist.rejectedValue || 0,
            invoiceIssued: item.checklist.invoiceIssued || false
        });
    } catch (error) {
        console.error('Erro ao salvar item:', error);
        alert('Erro ao salvar item');
    }
};

const formatCurrency = (value, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency
    }).format(value || 0);
};

const formatCurrencyInput = (value) => {
    if (!value || value === 0) return '';
    // Formatar como 000.000.000,00
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
    if (isNaN(numValue) || numValue === 0) return '';
    
    // Garantir que temos no máximo 10 dígitos na parte inteira
    const integerPart = Math.floor(numValue).toString();
    if (integerPart.length > 10) {
        // Se exceder 10 dígitos, truncar
        const truncated = integerPart.substring(0, 10);
        const truncatedValue = parseFloat(truncated + '.' + (numValue % 1).toFixed(2).split('.')[1]);
        return truncatedValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    return numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const parseCurrencyInput = (value) => {
    if (!value) return 0;
    // Remover pontos e substituir vírgula por ponto
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const numValue = parseFloat(cleaned);
    return isNaN(numValue) ? 0 : numValue;
};

const handleValueInput = (event, checklist, field) => {
    let inputValue = event.target.value;
    
    // Remover tudo exceto números
    let numbersOnly = inputValue.replace(/\D/g, '');
    
    // Limitar a 12 dígitos (10 inteiros + 2 decimais)
    if (numbersOnly.length > 12) {
        numbersOnly = numbersOnly.substring(0, 12);
    }
    
    // Converter para número e depois formatar
    if (numbersOnly === '') {
        checklist[field] = 0;
        event.target.value = '';
        return;
    }
    
    // Dividir em parte inteira e decimal
    const integerPart = numbersOnly.slice(0, -2) || '0';
    const decimalPart = numbersOnly.slice(-2).padStart(2, '0');
    
    // Limitar parte inteira a 10 dígitos
    const limitedInteger = integerPart.length > 10 ? integerPart.substring(0, 10) : integerPart;
    
    // Formatar com separadores de milhar
    const formattedInteger = limitedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatted = `${formattedInteger},${decimalPart}`;
    
    // Atualizar o valor no input
    event.target.value = formatted;
    
    // Atualizar o valor numérico no objeto
    const numValue = parseFloat(`${limitedInteger}.${decimalPart}`);
    checklist[field] = isNaN(numValue) ? 0 : numValue;
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

onMounted(() => {
    loadChecklist();
});
</script>

