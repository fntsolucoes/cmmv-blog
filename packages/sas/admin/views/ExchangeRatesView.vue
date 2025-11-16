<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Taxas de Câmbio</h1>
            <div class="flex gap-2">
                <button @click="fetchTodayRates" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Buscar Taxas de Hoje
                </button>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Adicionar Taxa
                </button>
            </div>
        </div>

        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Par de Moedas</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Data</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Taxa</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-for="item in items" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.currencyPair }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ new Date(item.date).toLocaleDateString('pt-BR') }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.rate.toFixed(4) }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button @click="editItem(item)" class="text-blue-400 hover:text-blue-300 mr-3">Editar</button>
                            <button @click="deleteItem(item.id)" class="text-red-400 hover:text-red-300">Excluir</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();
const items = ref<any[]>([]);
const showDialog = ref(false);
const editingItem = ref<any>(null);
const loading = ref(false);

const loadData = async () => {
    try {
        const response = await client.exchangeRates.get({});
        items.value = response.data || [];
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
};

const fetchTodayRates = async () => {
    loading.value = true;
    try {
        await client.exchangeRates.fetchToday();
        await loadData();
        alert('Taxas atualizadas com sucesso!');
    } catch (error) {
        console.error('Erro ao buscar taxas:', error);
        alert('Erro ao buscar taxas. Verifique o console para mais detalhes.');
    } finally {
        loading.value = false;
    }
};

const openAddDialog = () => {
    editingItem.value = null;
    showDialog.value = true;
};

const editItem = (item: any) => {
    editingItem.value = item;
    showDialog.value = true;
};

const deleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        try {
            await client.exchangeRates.delete(id);
            await loadData();
        } catch (error) {
            console.error('Erro ao excluir:', error);
        }
    }
};

onMounted(() => {
    loadData();
});
</script>

