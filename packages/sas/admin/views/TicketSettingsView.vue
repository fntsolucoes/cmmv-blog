<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h1 class="text-2xl font-bold text-white">Configurações de Tickets - Parceiros</h1>
            <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar Parceiro
            </button>
        </div>

        <!-- Tabela de Parceiros -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Nome de Exibição</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Padrão</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="loading">
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Carregando parceiros...
                        </td>
                    </tr>
                    <tr v-else-if="partners.length === 0">
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhum parceiro cadastrado. Clique em "Adicionar Parceiro" para começar.
                        </td>
                    </tr>
                    <tr v-for="item in partners" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{{ item.name }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.displayName || item.name }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span v-if="item.isDefault" class="px-2 py-1 text-xs rounded-full bg-blue-500 text-white">
                                Padrão
                            </span>
                            <span v-else class="text-neutral-400 text-xs">-</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="item.active ? 'bg-green-500' : 'bg-red-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                {{ item.active ? 'Ativo' : 'Inativo' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex items-center gap-2">
                                <button 
                                    @click="editItem(item)" 
                                    class="text-blue-400 hover:text-blue-300 p-1.5 rounded transition-colors"
                                    title="Editar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button 
                                    @click="deleteItem(item.id)" 
                                    class="text-red-400 hover:text-red-300 p-1.5 rounded transition-colors"
                                    title="Excluir"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal de Cadastro/Edição -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Parceiro' : 'Adicionar Parceiro' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="savePartner" class="p-6 space-y-4">
                    <!-- Nome -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Ex: 1001, Ixan, Renan"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p class="mt-1 text-xs text-neutral-400">Nome único do parceiro usado no sistema</p>
                    </div>

                    <!-- Nome de Exibição -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome de Exibição
                        </label>
                        <input
                            v-model="form.displayName"
                            type="text"
                            placeholder="Ex: 1001 (padrão)"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p class="mt-1 text-xs text-neutral-400">Nome que será exibido na interface (opcional)</p>
                    </div>

                    <!-- Padrão -->
                    <div>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                v-model="form.isDefault"
                                class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                            />
                            <span class="text-sm text-neutral-300">Definir como parceiro padrão</span>
                        </label>
                        <p class="mt-1 text-xs text-neutral-400">Se marcado, este será o parceiro selecionado por padrão ao criar novos tickets</p>
                    </div>

                    <!-- Ativo -->
                    <div>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                v-model="form.active"
                                class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                            />
                            <span class="text-sm text-neutral-300">Ativo</span>
                        </label>
                        <p class="mt-1 text-xs text-neutral-400">Parceiros inativos não aparecerão na lista ao criar tickets</p>
                    </div>

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
                            class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {{ saving ? 'Salvando...' : (isEditing ? 'Salvar' : 'Adicionar') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Toast Notification -->
        <ToastNotification
            :show="notification.show"
            :message="notification.message"
            :type="notification.type"
            :duration="notification.duration"
            @close="notification.show = false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSasClient } from '../client';
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue';

const client = useSasClient();
const partners = ref<any[]>([]);
const loading = ref(false);
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);

const form = ref({
    id: '',
    name: '',
    displayName: '',
    isDefault: false,
    active: true
});

const notification = ref({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
    duration: 3000
});

const showNotification = (type: 'success' | 'error', message: string) => {
    notification.value = {
        show: true,
        message: message,
        type: type,
        duration: 3000
    };
    setTimeout(() => {
        notification.value.show = false;
    }, notification.value.duration);
};

const loadPartners = async () => {
    loading.value = true;
    try {
        const response = await client.ticketPartners.getAllIncludingInactive();
        let partnersData = [];
        if (Array.isArray(response.data)) {
            partnersData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            partnersData = response.data.data;
        } else if (Array.isArray(response)) {
            partnersData = response;
        }
        partners.value = partnersData;
    } catch (error) {
        console.error('Erro ao carregar parceiros:', error);
        showNotification('error', 'Erro ao carregar parceiros.');
    } finally {
        loading.value = false;
    }
};

const openAddDialog = () => {
    isEditing.value = false;
    form.value = {
        id: '',
        name: '',
        displayName: '',
        isDefault: false,
        active: true
    };
    showDialog.value = true;
};

const editItem = (item: any) => {
    isEditing.value = true;
    form.value = {
        id: item.id,
        name: item.name,
        displayName: item.displayName || '',
        isDefault: item.isDefault || false,
        active: item.active !== undefined ? item.active : true
    };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    form.value = {
        id: '',
        name: '',
        displayName: '',
        isDefault: false,
        active: true
    };
};

const savePartner = async () => {
    if (!form.value.name.trim()) {
        showNotification('error', 'Por favor, preencha o nome do parceiro.');
        return;
    }

    saving.value = true;
    try {
        // Se está marcado como padrão, desmarcar os outros
        if (form.value.isDefault) {
            // Buscar parceiros atuais para verificar se há outro padrão
            const currentPartners = partners.value.filter(p => p.isDefault && p.id);
            // Se estiver editando, não considerar o próprio item
            const otherDefaultPartners = isEditing.value 
                ? currentPartners.filter(p => p.id !== form.value.id)
                : currentPartners;
            
            // Se houver outros padrões, será necessário atualizá-los
            // Mas como não temos o ID do item sendo editado no form, vamos fazer isso no backend
        }

        if (isEditing.value) {
            if (!form.value.id) {
                showNotification('error', 'Erro: ID do item não encontrado para edição.');
                saving.value = false;
                return;
            }
            
            const updateData = {
                name: form.value.name,
                displayName: form.value.displayName || null,
                isDefault: form.value.isDefault,
                active: form.value.active
            };

            await client.ticketPartners.update(form.value.id, updateData);
            showNotification('success', 'Parceiro atualizado com sucesso!');
        } else {
            const createData = {
                name: form.value.name.trim(),
                displayName: form.value.displayName?.trim() || null,
                isDefault: form.value.isDefault,
                active: form.value.active
            };

            await client.ticketPartners.insert(createData);
            showNotification('success', 'Parceiro adicionado com sucesso!');
        }

        await loadPartners();
        closeDialog();
    } catch (error: any) {
        console.error('Erro ao salvar parceiro:', error);
        showNotification('error', `Erro ao salvar parceiro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        saving.value = false;
    }
};

const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro?')) {
        return;
    }

    try {
        await client.ticketPartners.delete(id);
        showNotification('success', 'Parceiro excluído com sucesso!');
        await loadPartners();
    } catch (error: any) {
        console.error('Erro ao excluir parceiro:', error);
        showNotification('error', `Erro ao excluir parceiro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    }
};

onMounted(() => {
    loadPartners();
});
</script>

