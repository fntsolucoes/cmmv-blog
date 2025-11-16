<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Campanhas</h1>
            <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar Campanha
            </button>
        </div>

        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Parceiro</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Início</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Fim</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-for="item in items" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.name }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.commercialPartnerId }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ formatDate(item.startDate) }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.endDate ? formatDate(item.endDate) : 'Em andamento' }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="item.active ? 'bg-green-500' : 'bg-red-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                {{ item.active ? 'Ativa' : 'Inativa' }}
                            </span>
                        </td>
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

// Função para formatar data
const formatDate = (date: string | Date): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
};

const loadData = async () => {
    try {
        const response = await client.campaigns.get({});
        items.value = response.data || [];
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
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
            await client.campaigns.delete(id);
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

