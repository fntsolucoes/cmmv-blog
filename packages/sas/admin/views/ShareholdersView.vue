<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Sócios</h1>
            <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar Sócio
            </button>
        </div>

        <div v-if="validation" class="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-4">
            <p class="text-yellow-200">
                <strong>Atenção:</strong> Total de porcentagens: {{ validation.totalPercentage }}%
                <span v-if="!validation.isValid" class="text-red-300"> (excede 100%)</span>
            </p>
        </div>

        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Porcentagem</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="items.length === 0">
                        <td colspan="4" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhum sócio cadastrado
                        </td>
                    </tr>
                    <tr v-for="item in items" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.name }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.percentage }}%</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="item.active ? 'bg-green-500' : 'bg-red-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                {{ item.active ? 'Ativo' : 'Inativo' }}
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

        <!-- Modal de Cadastro/Edição -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Sócio' : 'Adicionar Sócio' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="saveShareholder" class="p-6 space-y-4">
                    <!-- Nome -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Nome do sócio"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.name }"
                            required
                        />
                        <p v-if="formErrors.name" class="mt-1 text-sm text-red-400">{{ formErrors.name }}</p>
                    </div>

                    <!-- Porcentagem -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Porcentagem (%) <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model.number="form.percentage"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.percentage }"
                            required
                        />
                        <p v-if="formErrors.percentage" class="mt-1 text-sm text-red-400">{{ formErrors.percentage }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Valor entre 0 e 100</p>
                    </div>

                    <!-- Status Ativo/Inativo -->
                    <div class="flex items-center">
                        <input
                            v-model="form.active"
                            type="checkbox"
                            id="active"
                            class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                        />
                        <label for="active" class="ml-2 text-sm font-medium text-neutral-300">
                            Sócio ativo
                        </label>
                    </div>

                    <!-- Botões de Ação -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-neutral-700">
                        <button
                            type="button"
                            @click="closeDialog"
                            class="px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            :disabled="saving"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {{ saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();
const items = ref<any[]>([]);
const validation = ref<any>(null);
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const editingItem = ref<any>(null);
const formErrors = ref<Record<string, string>>({});

const form = ref({
    name: '',
    percentage: 0,
    active: true
});

const loadData = async () => {
    try {
        const response = await client.shareholders.get({});
        items.value = response.data || [];
        await validatePercentages();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar sócios. Verifique o console para mais detalhes.');
    }
};

const validatePercentages = async () => {
    try {
        const response = await client.shareholders.validatePercentages();
        validation.value = response;
    } catch (error) {
        console.error('Erro ao validar porcentagens:', error);
    }
};

const openAddDialog = () => {
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        name: '',
        percentage: 0,
        active: true
    };
    formErrors.value = {};
    showDialog.value = true;
};

const editItem = (item: any) => {
    isEditing.value = true;
    editingItem.value = item;
    form.value = {
        name: item.name || '',
        percentage: item.percentage || 0,
        active: item.active !== undefined ? item.active : true
    };
    formErrors.value = {};
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        name: '',
        percentage: 0,
        active: true
    };
    formErrors.value = {};
};

const saveShareholder = async () => {
    formErrors.value = {};

    // Validações
    if (!form.value.name || form.value.name.trim() === '') {
        formErrors.value.name = 'Nome é obrigatório';
    }

    if (form.value.percentage === null || form.value.percentage === undefined) {
        formErrors.value.percentage = 'Porcentagem é obrigatória';
    } else if (form.value.percentage < 0 || form.value.percentage > 100) {
        formErrors.value.percentage = 'Porcentagem deve estar entre 0 e 100';
    }

    if (Object.keys(formErrors.value).length > 0) {
        return;
    }

    saving.value = true;

    try {
        const data = {
            name: form.value.name.trim(),
            percentage: Number(form.value.percentage),
            active: form.value.active
        };

        if (isEditing.value && editingItem.value) {
            await client.shareholders.update(editingItem.value.id, data);
        } else {
            await client.shareholders.insert(data);
        }

        await loadData();
        closeDialog();
    } catch (error: any) {
        console.error('Erro ao salvar sócio:', error);
        
        if (error.response?.data?.message) {
            alert(`Erro ao salvar: ${error.response.data.message}`);
        } else {
            alert('Erro ao salvar sócio. Verifique o console para mais detalhes.');
        }
    } finally {
        saving.value = false;
    }
};

const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este sócio?')) {
        return;
    }

    try {
        await client.shareholders.delete(id);
        await loadData();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir sócio. Verifique o console para mais detalhes.');
    }
};

onMounted(() => {
    loadData();
});
</script>



