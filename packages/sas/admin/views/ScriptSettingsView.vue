<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Configurações de Scripts</h1>
            <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Novo Modelo de Script
            </button>
        </div>

        <!-- Tabela de Configurações de Scripts -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Parceiro</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Rota Padrão</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Código de Partida</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Sequência Atual</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="items.length === 0">
                        <td colspan="6" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhuma configuração de script cadastrada
                        </td>
                    </tr>
                    <tr v-for="item in items" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                            {{ getDisplayName(item) }}
                        </td>
                        <td class="px-6 py-4 text-sm text-neutral-300 break-all max-w-xs">
                            {{ item.defaultRoute }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono">
                            {{ item.startCode === CUSTOM_START_CODE_SENTINEL ? 'Personalizado' : item.startCode }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                            {{ item.currentSequence || 0 }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="item.active ? 'bg-green-500' : 'bg-red-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                {{ item.active ? 'Ativo' : 'Inativo' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex items-center gap-2">
                                <button @click="editItem(item)" class="text-blue-400 hover:text-blue-300 mr-3">Editar</button>
                                <button @click="deleteItem(item.id)" class="text-red-400 hover:text-red-300">Excluir</button>
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
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Modelo de Script' : 'Novo Modelo de Script' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="saveScriptSetting" class="p-6 space-y-4">
                    <!-- Tipo de Modelo -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Tipo de Modelo <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="form.modelType"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.modelType }"
                            required
                            @change="onModelTypeChange"
                        >
                            <option value="">Selecione o tipo</option>
                            <option value="Rede de Afiliação">Rede de Afiliação (por parceiro)</option>
                            <option value="Direto">Direto (modelo único para todos)</option>
                        </select>
                        <p v-if="formErrors.modelType" class="mt-1 text-sm text-red-400">{{ formErrors.modelType }}</p>
                    </div>

                    <!-- Parceiro Comercial (apenas para Rede de Afiliação) -->
                    <div v-if="form.modelType === 'Rede de Afiliação'">
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Parceiro Comercial <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="form.commercialPartnerId"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.commercialPartnerId }"
                        >
                            <option value="">Selecione um parceiro</option>
                            <option 
                                v-for="partner in availablePartners.filter(p => p.partnerType === 'Rede de Afiliação')" 
                                :key="partner.id" 
                                :value="partner.id"
                            >
                                {{ partner.name }}
                            </option>
                        </select>
                        <p v-if="formErrors.commercialPartnerId" class="mt-1 text-sm text-red-400">{{ formErrors.commercialPartnerId }}</p>
                    </div>

                    <!-- Informação para modelo Direto -->
                    <div v-if="form.modelType === 'Direto'" class="p-3 bg-blue-900/30 border border-blue-700 rounded-md">
                        <p class="text-sm text-blue-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Este modelo será usado para todos os parceiros do tipo "Direto"
                        </p>
                    </div>

                    <!-- Rota Padrão -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Rota Padrão <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.defaultRoute"
                            type="text"
                            placeholder="https://rt-pixel.com/r/s/p/"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.defaultRoute }"
                            required
                        />
                        <p v-if="formErrors.defaultRoute" class="mt-1 text-sm text-red-400">{{ formErrors.defaultRoute }}</p>
                    </div>

                    <!-- Modo de Código -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Modo do Código <span class="text-red-500">*</span>
                        </label>
                        <div class="flex flex-col gap-1 text-sm text-neutral-300">
                            <label class="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="sequencial"
                                    v-model="form.codeMode"
                                    class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                                />
                                <span>Sequencial (gera código automaticamente a partir do código de partida)</span>
                            </label>
                            <label class="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="personalizado"
                                    v-model="form.codeMode"
                                    class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                                />
                                <span>Personalizado (código definido na criação da Tag)</span>
                            </label>
                        </div>
                    </div>

                    <!-- Código de Partida (apenas para modo sequencial) -->
                    <div v-if="form.codeMode === 'sequencial'">
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Código de Partida <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.startCode"
                            type="text"
                            placeholder="adp15a98123453500"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            :class="{ 'border-red-500': formErrors.startCode }"
                        />
                        <p v-if="formErrors.startCode" class="mt-1 text-sm text-red-400">{{ formErrors.startCode }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Código base que será usado para gerar sequenciais</p>
                    </div>

                    <div v-else class="p-3 bg-blue-900/30 border border-blue-700 rounded-md text-xs text-blue-300">
                        Neste modo o código do script será informado manualmente ao criar a Tag. Nenhum código sequencial será gerado automaticamente.
                    </div>

                    <!-- Descrição -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Descrição
                        </label>
                        <textarea
                            v-model="form.description"
                            placeholder="Descrição do modelo de script (opcional)"
                            rows="3"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
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
                            Modelo ativo
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

const CUSTOM_START_CODE_SENTINEL = '__CUSTOM__';

const items = ref<any[]>([]);
const availablePartners = ref<any[]>([]);
const showDialog = ref(false);
const isEditing = ref(false);
const editingItem = ref<any>(null);
const saving = ref(false);

const form = ref({
    modelType: '',
    commercialPartnerId: '',
    defaultRoute: '',
    startCode: '',
    description: '',
    active: true,
    currentSequence: 0,
    codeMode: 'sequencial' // 'sequencial' | 'personalizado'
});

const formErrors = ref<Record<string, string>>({});

// Carregar dados
const loadData = async () => {
    try {
        const [scriptSettingsResult, partnersResult] = await Promise.all([
            client.scriptSettings.getAll(),
            client.commercialPartners.getAll()
        ]);
        
        items.value = scriptSettingsResult?.data || [];
        
        // Carregar todos os parceiros (serão filtrados conforme necessário)
        availablePartners.value = partnersResult?.data || [];
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
    }
};

// Obter nome do parceiro
const getPartnerName = (partnerId: string): string => {
    if (!partnerId) return '';
    const partner = availablePartners.value.find(p => p.id === partnerId);
    return partner ? partner.name : partnerId;
};

// Obter nome para exibição (considera modelo Direto único)
const getDisplayName = (item: any): string => {
    if (!item.commercialPartnerId) {
        return 'Modelo Único - Direto';
    }
    return getPartnerName(item.commercialPartnerId);
};

// Quando o tipo de modelo muda
const onModelTypeChange = () => {
    if (form.value.modelType === 'Direto') {
        // Limpar parceiro quando for modelo Direto
        form.value.commercialPartnerId = '';
    } else if (form.value.modelType === 'Rede de Afiliação') {
        // Garantir que há um parceiro selecionado
        if (!form.value.commercialPartnerId) {
            form.value.commercialPartnerId = '';
        }
    }
};

// Abrir dialog para adicionar
const openAddDialog = () => {
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        modelType: '',
        commercialPartnerId: '',
        defaultRoute: '',
        startCode: '',
        description: '',
        active: true,
        currentSequence: 0,
        codeMode: 'sequencial'
    };
    formErrors.value = {};
    showDialog.value = true;
};

// Editar item
const editItem = (item: any) => {
    isEditing.value = true;
    editingItem.value = item;
    // Determinar o tipo de modelo baseado no commercialPartnerId
    const modelType = item.commercialPartnerId ? 'Rede de Afiliação' : 'Direto';

    const isCustom = item.startCode === CUSTOM_START_CODE_SENTINEL;

    form.value = {
        modelType,
        commercialPartnerId: item.commercialPartnerId || '',
        defaultRoute: item.defaultRoute || '',
        // Para modelo personalizado, não exibimos o sentinela para o usuário
        startCode: isCustom ? '' : (item.startCode || ''),
        description: item.description || '',
        active: item.active !== undefined ? item.active : true,
        currentSequence: item.currentSequence || 0,
        codeMode: isCustom ? 'personalizado' : 'sequencial'
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
        modelType: '',
        commercialPartnerId: '',
        defaultRoute: '',
        startCode: '',
        description: '',
        active: true,
        currentSequence: 0,
        codeMode: 'sequencial'
    };
    formErrors.value = {};
};

// Salvar configuração de script
const saveScriptSetting = async () => {
    formErrors.value = {};

    // Validações
    if (!form.value.modelType) {
        formErrors.value.modelType = 'Tipo de modelo é obrigatório';
        return;
    }

    // Para Rede de Afiliação, é obrigatório ter parceiro
    if (form.value.modelType === 'Rede de Afiliação' && !form.value.commercialPartnerId) {
        formErrors.value.commercialPartnerId = 'Parceiro comercial é obrigatório para modelos de Rede de Afiliação';
        return;
    }

    // Para Direto, verificar se já existe um modelo único
    if (form.value.modelType === 'Direto') {
        const existingDirectModel = items.value.find(
            (item: any) => !item.commercialPartnerId && item.id !== editingItem.value?.id
        );
        if (existingDirectModel) {
            formErrors.value.modelType = 'Já existe um modelo único para parceiros Direto. Edite o modelo existente.';
            return;
        }
    }

    if (!form.value.defaultRoute || form.value.defaultRoute.trim() === '') {
        formErrors.value.defaultRoute = 'Rota padrão é obrigatória';
        return;
    }

    // Para modo sequencial, exigir código de partida
    if (form.value.codeMode !== 'personalizado') {
        if (!form.value.startCode || form.value.startCode.trim() === '') {
            formErrors.value.startCode = 'Código de partida é obrigatório para modo sequencial';
            return;
        }
    }

    saving.value = true;

    try {
        const startCode =
            form.value.codeMode === 'personalizado'
                ? CUSTOM_START_CODE_SENTINEL
                : (form.value.startCode || '').trim();

        const data = {
            commercialPartnerId: form.value.modelType === 'Direto' ? null : form.value.commercialPartnerId,
            defaultRoute: form.value.defaultRoute.trim(),
            startCode,
            description: form.value.description?.trim() || null,
            active: form.value.active,
            currentSequence: form.value.currentSequence || 0
        };

        if (isEditing.value && editingItem.value) {
            await client.scriptSettings.update(editingItem.value.id, data);
        } else {
            await client.scriptSettings.insert(data);
        }

        await loadData();
        closeDialog();
    } catch (error: any) {
        console.error('Erro ao salvar configuração de script:', error);
        
        if (error.response?.data?.message) {
            const errorMessage = error.response.data.message;
            if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
                formErrors.value.commercialPartnerId = 'Já existe uma configuração para este parceiro';
            } else {
                alert(`Erro ao salvar: ${errorMessage}`);
            }
        } else {
            alert('Erro ao salvar configuração de script. Verifique o console para mais detalhes.');
        }
    } finally {
        saving.value = false;
    }
};

// Excluir item
const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração de script?')) {
        return;
    }

    try {
        await client.scriptSettings.delete(id);
        await loadData();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir configuração de script. Verifique o console para mais detalhes.');
    }
};

onMounted(() => {
    loadData();
});
</script>

