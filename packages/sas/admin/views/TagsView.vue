<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Tags</h1>
            <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nova Tag
            </button>
        </div>

        <!-- Tabela de Tags -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Descrição</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Cor</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="items.length === 0">
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhuma tag cadastrada
                        </td>
                    </tr>
                    <tr v-for="item in items" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{{ item.name }}</td>
                        <td class="px-6 py-4 text-sm text-neutral-300">{{ item.description || '-' }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center gap-2">
                                <div 
                                    v-if="item.color" 
                                    class="w-6 h-6 rounded border border-neutral-600"
                                    :style="{ backgroundColor: item.color }"
                                ></div>
                                <span v-if="item.color" class="text-xs text-neutral-400">{{ item.color }}</span>
                                <span v-else class="text-xs text-neutral-500">-</span>
                            </div>
                        </td>
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
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Tag' : 'Nova Tag' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="saveTag" class="p-6 space-y-4">
                    <!-- Nome -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Nome da tag"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.name }"
                            required
                        />
                        <p v-if="formErrors.name" class="mt-1 text-sm text-red-400">{{ formErrors.name }}</p>
                    </div>

                    <!-- Descrição -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Descrição
                        </label>
                        <textarea
                            v-model="form.description"
                            placeholder="Descrição da tag (opcional)"
                            rows="3"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>

                    <!-- Cor -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Cor
                        </label>
                        <div class="flex items-center gap-3">
                            <input
                                v-model="form.color"
                                type="color"
                                class="h-10 w-20 rounded border border-neutral-600 cursor-pointer"
                            />
                            <input
                                v-model="form.color"
                                type="text"
                                placeholder="#FF5733"
                                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                class="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <p class="mt-1 text-xs text-neutral-400">Selecione uma cor ou digite o código hexadecimal</p>
                    </div>

                    <!-- Status Ativo -->
                    <div class="flex items-center">
                        <input
                            v-model="form.active"
                            type="checkbox"
                            id="active"
                            class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                        />
                        <label for="active" class="ml-2 text-sm text-neutral-300">
                            Tag ativa
                        </label>
                    </div>

                    <!-- Botões -->
                    <div class="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            @click="closeDialog"
                            class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            :disabled="saving"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span v-if="saving">Salvando...</span>
                            <span v-else>{{ isEditing ? 'Salvar' : 'Criar' }}</span>
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
const showDialog = ref(false);
const isEditing = ref(false);
const editingItem = ref<any>(null);
const saving = ref(false);

const form = ref({
    name: '',
    description: '',
    color: '#3B82F6',
    active: true
});

const formErrors = ref<Record<string, string>>({});

// Carregar dados
const loadData = async () => {
    try {
        const result = await client.tags.getAll();
        items.value = result?.data || [];
    } catch (error) {
        console.error('Erro ao carregar tags:', error);
        alert('Erro ao carregar tags. Verifique o console para mais detalhes.');
    }
};

// Abrir dialog para adicionar
const openAddDialog = () => {
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        name: '',
        description: '',
        color: '#3B82F6',
        active: true
    };
    formErrors.value = {};
    showDialog.value = true;
};

// Editar item
const editItem = (item: any) => {
    isEditing.value = true;
    editingItem.value = item;
    form.value = {
        name: item.name || '',
        description: item.description || '',
        color: item.color || '#3B82F6',
        active: item.active !== undefined ? item.active : true
    };
    formErrors.value = {};
    showDialog.value = true;
};

// Fechar dialog
const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        name: '',
        description: '',
        color: '#3B82F6',
        active: true
    };
    formErrors.value = {};
};

// Salvar tag
const saveTag = async () => {
    formErrors.value = {};

    // Validações
    if (!form.value.name || form.value.name.trim() === '') {
        formErrors.value.name = 'Nome é obrigatório';
        return;
    }

    if (form.value.name.length < 2 || form.value.name.length > 255) {
        formErrors.value.name = 'Nome deve ter entre 2 e 255 caracteres';
        return;
    }

    // Validar cor se fornecida
    if (form.value.color && !form.value.color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
        formErrors.value.color = 'Cor deve ser um código hexadecimal válido (ex: #FF5733)';
        return;
    }

    saving.value = true;

    try {
        const data = {
            name: form.value.name.trim(),
            description: form.value.description?.trim() || null,
            color: form.value.color || null,
            active: form.value.active
        };

        if (isEditing.value && editingItem.value) {
            await client.tags.update(editingItem.value.id, data);
        } else {
            await client.tags.insert(data);
        }

        await loadData();
        closeDialog();
    } catch (error: any) {
        console.error('Erro ao salvar tag:', error);
        
        if (error.response?.data?.message) {
            const errorMessage = error.response.data.message;
            if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
                formErrors.value.name = 'Já existe uma tag com este nome';
            } else {
                alert(`Erro ao salvar: ${errorMessage}`);
            }
        } else {
            alert('Erro ao salvar tag. Verifique o console para mais detalhes.');
        }
    } finally {
        saving.value = false;
    }
};

// Excluir item
const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tag?')) {
        return;
    }

    try {
        await client.tags.delete(id);
        await loadData();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir tag. Verifique o console para mais detalhes.');
    }
};

onMounted(() => {
    loadData();
});
</script>

