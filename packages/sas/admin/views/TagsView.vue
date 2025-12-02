<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Tags</h1>
            <div class="flex gap-2">
                <button 
                    @click="validateAllScripts" 
                    :disabled="validatingScripts"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                >
                    <svg v-if="!validatingScripts" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <svg v-else class="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ validatingScripts ? 'Validando...' : 'Validar Scripts' }}
                </button>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nova Tag
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-neutral-800 rounded-lg px-6 py-4 mb-4 flex flex-col md:flex-row gap-4 md:items-end">
            <div class="flex-1">
                <label class="block text-xs font-medium text-neutral-400 mb-1">
                    Filtrar por modelo de script
                </label>
                <select
                    v-model="modelFilter"
                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Todos os modelos</option>
                    <option 
                        v-for="setting in scriptSettings" 
                        :key="setting.id" 
                        :value="setting.id"
                    >
                        {{ getScriptSettingDisplayName(setting) }}
                    </option>
                </select>
            </div>
            <div class="flex-1">
                <label class="block text-xs font-medium text-neutral-400 mb-1">
                    Buscar por campanha
                </label>
                <input
                    v-model="campaignSearchTable"
                    type="text"
                    placeholder="Digite o nome da campanha..."
                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>

        <!-- Tabela de Tags -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Modelo de Script</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Campanhas</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">URL do Seller</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Código</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="filteredItems.length === 0">
                        <td colspan="6" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhuma tag cadastrada
                        </td>
                    </tr>
                    <tr v-for="item in paginatedItems" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 text-sm text-neutral-300">
                            {{ item.scriptSettingId ? getScriptSettingName(item.scriptSettingId) : '-' }}
                        </td>
                        <td class="px-6 py-4 text-sm text-neutral-300">
                            <span v-if="getItemCampaignName(item)" class="text-xs">
                                {{ getItemCampaignName(item) }}
                            </span>
                            <span v-else class="text-neutral-500">-</span>
                        </td>
                        <td class="px-6 py-4 text-sm text-neutral-300">
                            <a 
                                v-if="item.sellerUrl" 
                                :href="item.sellerUrl" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                class="text-blue-400 hover:text-blue-300 underline truncate block max-w-xs"
                                :title="item.sellerUrl"
                            >
                                {{ item.sellerUrl }}
                            </a>
                            <span v-else class="text-neutral-500">-</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono">
                            {{ item.generatedCode || '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span 
                                :class="getStatusClass(item.scriptStatus)" 
                                class="px-2 py-1 text-xs rounded-full text-white font-medium"
                            >
                                {{ getStatusLabel(item.scriptStatus) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex items-center gap-2">
                                <button 
                                    v-if="item.generatedScript"
                                    @click="viewScript(item)" 
                                    class="text-green-400 hover:text-green-300"
                                    title="Ver script"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                                <button @click="editItem(item)" class="text-blue-400 hover:text-blue-300 mr-3">Editar</button>
                                <button @click="deleteItem(item.id)" class="text-red-400 hover:text-red-300">Excluir</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Paginação -->
            <div 
                v-if="filteredItems.length > 0" 
                class="px-6 py-3 border-t border-neutral-700 flex items-center justify-between text-xs text-neutral-400"
            >
                <div>
                    Mostrando {{ pageStart }} - {{ pageEnd }} de {{ filteredItems.length }} tag(s)
                </div>
                <div class="flex items-center gap-2">
                    <button
                        class="px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="currentPage === 1"
                        @click="currentPage = currentPage - 1"
                    >
                        Anterior
                    </button>
                    <span>
                        Página {{ currentPage }} de {{ totalPages }}
                    </span>
                    <button
                        class="px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="currentPage === totalPages"
                        @click="currentPage = currentPage + 1"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal de Cadastro/Edição -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Tag' : 'Nova Tag' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="saveTag" class="p-6 space-y-4">
                    <!-- Modelo de Script -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Modelo de Script
                        </label>
                        <select
                            v-model="form.scriptSettingId"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.scriptSettingId }"
                            @change="onScriptSettingChange"
                        >
                            <option value="">Selecione um modelo de script (opcional)</option>
                            <option 
                                v-for="setting in scriptSettings" 
                                :key="setting.id" 
                                :value="setting.id"
                            >
                                {{ getScriptSettingDisplayName(setting) }}
                            </option>
                        </select>
                        <p v-if="formErrors.scriptSettingId" class="mt-1 text-sm text-red-400">{{ formErrors.scriptSettingId }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Primeiro, selecione o modelo de script</p>
                    </div>

                    <!-- Campanhas (apenas quando modelo de script for selecionado) -->
                    <div v-if="form.scriptSettingId">
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Campanhas <span class="text-red-500">*</span>
                        </label>
                        <!-- Campo de busca -->
                        <div class="mb-3">
                            <input
                                v-model="campaignSearch"
                                type="text"
                                placeholder="Buscar campanha por nome..."
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div v-if="loadingCampaigns" class="flex items-center py-2">
                            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                            <span class="ml-2 text-neutral-400 text-sm">Carregando campanhas...</span>
                        </div>
                        <div v-else class="max-h-48 overflow-y-auto border border-neutral-600 rounded-md p-3 bg-neutral-700">
                            <div v-if="filteredCampaigns.length === 0" class="text-sm text-neutral-400 italic">
                                {{ campaignSearch ? 'Nenhuma campanha encontrada com este nome' : 'Nenhuma campanha disponível para este modelo' }}
                            </div>
                            <div v-else class="space-y-2">
                                <label 
                                    v-for="campaign in filteredCampaigns" 
                                    :key="campaign.id"
                                    class="flex items-center text-sm text-neutral-300 hover:text-white cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        :value="campaign.id"
                                        v-model="form.campaignId"
                                        class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 mr-2"
                                        name="tag-campaign"
                                    />
                                    <span>{{ campaign.name }}</span>
                                </label>
                            </div>
                        </div>
                        <p v-if="formErrors.campaignIds" class="mt-1 text-sm text-red-400">{{ formErrors.campaignIds }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Selecione as campanhas que usarão este script</p>
                    </div>

                    <!-- Nome do arquivo JS (apenas para modelos personalizados) -->
                    <div v-if="form.scriptSettingId && isCustomScriptSettingSelected">
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome do arquivo JS <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.customJsFileName"
                            type="text"
                            placeholder="ex: dio31ds4h6as25520.js ou apenas dio31ds4h6as25520"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            :class="{ 'border-red-500': formErrors.customJsFileName }"
                        />
                        <p v-if="formErrors.customJsFileName" class="mt-1 text-sm text-red-400">{{ formErrors.customJsFileName }}</p>
                        <p class="mt-1 text-xs text-neutral-400">
                            Informe exatamente o nome do arquivo JavaScript que você subiu no servidor para este modelo.
                        </p>
                    </div>

                    <!-- URL do Seller -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            URL do Seller <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.sellerUrl"
                            type="url"
                            placeholder="https://exemplo.com.br"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.sellerUrl }"
                        />
                        <p v-if="formErrors.sellerUrl" class="mt-1 text-sm text-red-400">{{ formErrors.sellerUrl }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Informe a URL onde a tag será instalada</p>
                    </div>

                    <!-- Script Gerado (apenas quando houver script) -->
                    <div v-if="form.generatedScript" class="p-3 bg-neutral-900 rounded-md border border-neutral-700">
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Script Gerado
                        </label>
                        <div class="relative">
                            <pre class="text-xs text-neutral-300 font-mono whitespace-pre-wrap break-all overflow-x-auto p-3 bg-neutral-800 rounded border border-neutral-600">{{ form.generatedScript }}</pre>
                            <button
                                type="button"
                                @click="copyScript"
                                class="absolute top-2 right-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                title="Copiar script"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                        <p class="mt-2 text-xs text-neutral-400">
                            Código gerado: <span class="font-mono text-neutral-300">{{ form.generatedCode }}</span>
                        </p>
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

        <!-- Modal para visualizar script completo -->
        <div v-if="showScriptModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Script Gerado</h3>
                    <button @click="showScriptModal = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <div class="relative">
                        <pre class="text-sm text-neutral-300 font-mono whitespace-pre-wrap break-all overflow-x-auto p-4 bg-neutral-900 rounded border border-neutral-600">{{ scriptToView }}</pre>
                        <button
                            type="button"
                            @click="copyScriptToClipboard(scriptToView)"
                            class="absolute top-4 right-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                            Copiar
                        </button>
                    </div>
                </div>
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
import { ref, onMounted, watch, computed } from 'vue';
import { useSasClient } from '../client';
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue';

const client = useSasClient();

const CUSTOM_START_CODE_SENTINEL = '__CUSTOM__';

const items = ref<any[]>([]);
const scriptSettings = ref<any[]>([]);
const commercialPartners = ref<any[]>([]);
const allCampaigns = ref<any[]>([]);
const availableCampaigns = ref<any[]>([]);
const showDialog = ref(false);
const isEditing = ref(false);
const editingItem = ref<any>(null);
const saving = ref(false);
const loadingCampaigns = ref(false);
const showScriptModal = ref(false);
const scriptToView = ref<string>('');
const campaignSearch = ref<string>('');
const modelFilter = ref<string>('');
const campaignSearchTable = ref<string>('');
const validatingScripts = ref(false);

// Toast notification (nativo do site)
const notification = ref({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
    duration: 3000
});

const showNotification = (type: 'success' | 'error', message: string) => {
    notification.value = {
        show: true,
        message,
        type,
        duration: 3000
    };

    setTimeout(() => {
        notification.value.show = false;
    }, notification.value.duration);
};
const itemsPerPage = 30;
const currentPage = ref(1);

const form = ref({
    description: '',
    scriptSettingId: '',
    campaignId: '',
    generatedScript: '',
    generatedCode: '',
    sellerUrl: '',
    active: true,
    customJsFileName: ''
});

const formErrors = ref<Record<string, string>>({});

const selectedScriptSetting = computed(() => {
    return scriptSettings.value.find(s => s.id === form.value.scriptSettingId) || null;
});

const isCustomScriptSettingSelected = computed(() => {
    const setting = selectedScriptSetting.value;
    return !!setting && setting.startCode === CUSTOM_START_CODE_SENTINEL;
});

// Filtrar campanhas baseado na busca (seleção no modal)
const filteredCampaigns = computed(() => {
    if (!campaignSearch.value || campaignSearch.value.trim() === '') {
        return availableCampaigns.value;
    }
    const searchTerm = campaignSearch.value.toLowerCase().trim();
    return availableCampaigns.value.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm)
    );
});

// Lista de tags filtrada por modelo e nome de campanha
const filteredItems = computed(() => {
    // Cria mapa de campanhas por id para busca rápida
    const campaignMap = new Map<string, string>();
    for (const c of allCampaigns.value) {
        if (c.id && c.name) {
            campaignMap.set(c.id, c.name);
        }
    }

    const searchTerm = campaignSearchTable.value.toLowerCase().trim();

    return items.value.filter((item: any) => {
        // Filtrar por modelo
        if (modelFilter.value && item.scriptSettingId !== modelFilter.value) {
            return false;
        }

        // Filtrar por nome de campanha
        if (searchTerm) {
            const campaignName = getItemCampaignName(item, campaignMap).toLowerCase();
            if (!campaignName.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });
});

// Itens paginados
const totalPages = computed(() => {
    if (filteredItems.value.length === 0) return 1;
    return Math.ceil(filteredItems.value.length / itemsPerPage);
});

const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredItems.value.slice(start, end);
});

const pageStart = computed(() => {
    if (filteredItems.value.length === 0) return 0;
    return (currentPage.value - 1) * itemsPerPage + 1;
});

const pageEnd = computed(() => {
    if (filteredItems.value.length === 0) return 0;
    const end = currentPage.value * itemsPerPage;
    return end > filteredItems.value.length ? filteredItems.value.length : end;
});

// Ajustar página atual quando o filtro mudar
watch(filteredItems, () => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = 1;
    }
});

// Carregar dados
const loadData = async () => {
    try {
        const [tagsResult, scriptSettingsResult, partnersResult, campaignsResult] = await Promise.all([
            client.tags.getAll(),
            client.scriptSettings.getAll(),
            client.commercialPartners.getAll(),
            client.campaigns.getAll()
        ]);
        items.value = tagsResult?.data || [];
        scriptSettings.value = scriptSettingsResult?.data || [];
        commercialPartners.value = partnersResult?.data || [];
        allCampaigns.value = campaignsResult?.data || [];
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('error', 'Erro ao carregar dados. Verifique o console para mais detalhes.');
    }
};

// Obter nome do modelo de script
const getScriptSettingName = (scriptSettingId: string): string => {
    const setting = scriptSettings.value.find(s => s.id === scriptSettingId);
    if (!setting) return scriptSettingId;
    
    if (!setting.commercialPartnerId) {
        return 'Modelo Único - Direto';
    }
    
    // Buscar nome do parceiro
    const partner = commercialPartners.value.find(p => p.id === setting.commercialPartnerId);
    return partner ? `Modelo - ${partner.name}` : `Modelo - ${scriptSettingId}`;
};

// Obter nome para exibição no select
const getScriptSettingDisplayName = (setting: any): string => {
    if (!setting.commercialPartnerId) {
        return 'Modelo Único - Direto';
    }
    
    // Buscar nome do parceiro
    const partner = commercialPartners.value.find(p => p.id === setting.commercialPartnerId);
    return partner ? `Modelo - ${partner.name}` : `Modelo - ${setting.commercialPartnerId}`;
};

// Obter nome da campanha para um item
const getItemCampaignName = (item: any, campaignMapParam?: Map<string, string>): string => {
    try {
        if (!item.campaignIds) return '';
        const ids = JSON.parse(item.campaignIds);
        if (!Array.isArray(ids) || ids.length === 0) return '';
        const firstId = ids[0];

        const mapToUse = campaignMapParam ?? (() => {
            const m = new Map<string, string>();
            for (const c of allCampaigns.value) {
                if (c.id && c.name) m.set(c.id, c.name);
            }
            return m;
        })();

        return mapToUse.get(firstId) || '';
    } catch {
        return '';
    }
};

// Obter classe CSS para o status do script
const getStatusClass = (scriptStatus: string | null | undefined): string => {
    if (!scriptStatus) return 'bg-gray-500';
    
    switch (scriptStatus) {
        case 'Ativo':
            return 'bg-green-500';
        case 'Caiu':
            return 'bg-red-500';
        case 'Não verificada':
            return 'bg-yellow-500';
        default:
            return 'bg-gray-500';
    }
};

// Obter label para o status do script
const getStatusLabel = (scriptStatus: string | null | undefined): string => {
    if (!scriptStatus) return 'Não verificada';
    return scriptStatus;
};

// Quando o modelo de script muda
const onScriptSettingChange = async () => {
    if (!form.value.scriptSettingId) {
        form.value.campaignId = '';
        form.value.generatedScript = '';
        form.value.generatedCode = '';
        form.value.customJsFileName = '';
        availableCampaigns.value = [];
        campaignSearch.value = '';
        return;
    }

    // Limpar seleção de campanhas e busca
    form.value.campaignId = '';
    campaignSearch.value = '';
    form.value.customJsFileName = '';
    
    // Carregar campanhas disponíveis baseado no modelo
    await loadAvailableCampaigns();
    
    // Para modelos sequenciais, gerar script automaticamente
    if (!isCustomScriptSettingSelected.value) {
        await generateScript();
    } else {
        // Para modelos personalizados, limpar script gerado
        form.value.generatedScript = '';
        form.value.generatedCode = '';
    }
};

// Carregar campanhas disponíveis
const loadAvailableCampaigns = async () => {
    if (!form.value.scriptSettingId) return;

    loadingCampaigns.value = true;
    try {
        const setting = scriptSettings.value.find(s => s.id === form.value.scriptSettingId);
        if (!setting) return;

        // Se for modelo Direto (sem commercialPartnerId), buscar todas as campanhas de parceiros Direto
        if (!setting.commercialPartnerId) {
            const allCampaigns = await client.campaigns.getAll();
            const allPartners = await client.commercialPartners.getAll();
            
            // Filtrar campanhas de parceiros Direto
            const directPartners = (allPartners?.data || []).filter((p: any) => p.partnerType === 'Direto');
            const directPartnerIds = directPartners.map((p: any) => p.id);
            
            availableCampaigns.value = (allCampaigns?.data || []).filter((c: any) => 
                directPartnerIds.includes(c.commercialPartnerId)
            );
        } else {
            // Se for modelo de Rede, buscar campanhas do parceiro específico
            const campaigns = await client.campaigns.getAllByPartner(setting.commercialPartnerId);
            availableCampaigns.value = campaigns?.data || [];
        }
    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        availableCampaigns.value = [];
    } finally {
        loadingCampaigns.value = false;
    }
};

// Gerar script automaticamente
const generateScript = async () => {
    if (!form.value.scriptSettingId) {
        form.value.generatedScript = '';
        form.value.generatedCode = '';
        return;
    }

    try {
        const result = await client.tags.generateScript(form.value.scriptSettingId);
        form.value.generatedScript = result.script;
        form.value.generatedCode = result.code;
    } catch (error: any) {
        console.error('Erro ao gerar script:', error);
        formErrors.value.scriptSettingId = 'Erro ao gerar script. Verifique o console.';
        form.value.generatedScript = '';
        form.value.generatedCode = '';
    }
};

// Copiar script para clipboard
const copyScript = async () => {
    if (!form.value.generatedScript) return;
    
    try {
        await navigator.clipboard.writeText(form.value.generatedScript);
        showNotification('success', 'Script copiado para a área de transferência!');
    } catch (error) {
        console.error('Erro ao copiar script:', error);
        showNotification('error', 'Erro ao copiar script. Tente selecionar e copiar manualmente.');
    }
};

// Copiar script do modal
const copyScriptToClipboard = async (script: string) => {
    if (!script) return;
    
    try {
        await navigator.clipboard.writeText(script);
        showNotification('success', 'Script copiado para a área de transferência!');
    } catch (error) {
        console.error('Erro ao copiar script:', error);
        showNotification('error', 'Erro ao copiar script. Tente selecionar e copiar manualmente.');
    }
};

// Ver script completo
const viewScript = (item: any) => {
    scriptToView.value = item.generatedScript || '';
    showScriptModal.value = true;
};

// Abrir dialog para adicionar
const openAddDialog = () => {
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        description: '',
        scriptSettingId: '',
        campaignId: '',
        generatedScript: '',
        generatedCode: '',
        sellerUrl: '',
        active: true,
        customJsFileName: ''
    };
    formErrors.value = {};
    availableCampaigns.value = [];
    campaignSearch.value = '';
    showDialog.value = true;
};

// Editar item
const editItem = (item: any) => {
    isEditing.value = true;
    editingItem.value = item;
    form.value = {
        description: item.description || '',
        scriptSettingId: item.scriptSettingId || '',
        campaignId: (() => {
            if (item.campaignIds) {
                try {
                    const ids = JSON.parse(item.campaignIds);
                    return Array.isArray(ids) && ids.length > 0 ? ids[0] : '';
                } catch {
                    return '';
                }
            }
            return '';
        })(),
        generatedScript: item.generatedScript || '',
        generatedCode: item.generatedCode || '',
        sellerUrl: item.sellerUrl || '',
        active: item.active !== undefined ? item.active : true,
        customJsFileName: item.customJsFileName || ''
    };
    formErrors.value = {};
    campaignSearch.value = '';
    
    // Carregar campanhas se houver modelo selecionado
    if (form.value.scriptSettingId) {
        loadAvailableCampaigns();
    }
    
    showDialog.value = true;
};

// Fechar dialog
const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        description: '',
        scriptSettingId: '',
        campaignId: '',
        generatedScript: '',
        generatedCode: '',
        sellerUrl: '',
        active: true,
        customJsFileName: ''
    };
    formErrors.value = {};
    availableCampaigns.value = [];
    campaignSearch.value = '';
};

// Salvar tag
const saveTag = async () => {
    formErrors.value = {};

    // Validar modelo de script
    if (!form.value.scriptSettingId) {
        formErrors.value.scriptSettingId = 'Selecione um modelo de script';
        return;
    }

    // Validar campanhas se modelo de script foi selecionado
    if (form.value.scriptSettingId && (!form.value.campaignId || form.value.campaignId === '')) {
        formErrors.value.campaignIds = 'Selecione pelo menos uma campanha';
        return;
    }

    // Validar URL do seller
    if (!form.value.sellerUrl || form.value.sellerUrl.trim() === '') {
        formErrors.value.sellerUrl = 'Informe a URL do seller';
        return;
    }

    // Validar formato de URL
    try {
        const url = form.value.sellerUrl.trim();
        // Adicionar https:// se não tiver protocolo
        const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') 
            ? url 
            : `https://${url}`;
        new URL(urlWithProtocol);
        // Atualizar o form com a URL corrigida se necessário
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            form.value.sellerUrl = urlWithProtocol;
        }
    } catch {
        formErrors.value.sellerUrl = 'URL inválida. Use o formato: https://exemplo.com.br';
        return;
    }

    // Descobrir configuração selecionada
    const setting = selectedScriptSetting.value;
    const isCustom = !!setting && setting.startCode === CUSTOM_START_CODE_SENTINEL;

    if (isCustom) {
        // Para modelos personalizados, exigir nome do arquivo JS
        if (!form.value.customJsFileName || form.value.customJsFileName.trim() === '') {
            formErrors.value.customJsFileName = 'Informe o nome do arquivo JS que foi criado';
            return;
        }

        const rawName = form.value.customJsFileName.trim();

        // Normalizar: aceitar com ou sem .js
        let fileName = rawName;
        if (!fileName.toLowerCase().endsWith('.js')) {
            fileName = `${fileName}.js`;
        }

        // Extrair "código" a partir do nome do arquivo (sem caminho e sem extensão)
        const baseFileName = fileName.split(/[\\/]/).pop() || fileName;
        const code = baseFileName.replace(/\.js$/i, '');

        const baseRoute = (setting?.defaultRoute || '').trim();
        const scriptUrl = `${baseRoute}${fileName}`;

        // Gerar script evitando conflito com parser Vue (usar concatenação ao invés de template literal com tags script)
        const scriptStart = '<' + 'script' + '>';
        const scriptEnd = '<' + '/' + 'script' + '>';
        const generatedScript = scriptStart + `
(function () {
      var script = document.createElement('script'),
          head   = document.getElementsByTagName('head')[0];

      script.async = 1;
      script.type  = 'text/javascript';
      script.src   = '${scriptUrl}';

      head.appendChild(script);
})();
` + scriptEnd;

        form.value.generatedScript = generatedScript;
        form.value.generatedCode = code;
    } else {
        // Se modelo sequencial foi selecionado mas script não foi gerado, gerar agora
        if (form.value.scriptSettingId && !form.value.generatedScript) {
            await generateScript();
            if (!form.value.generatedScript) {
                formErrors.value.scriptSettingId = 'Erro ao gerar script. Tente novamente.';
                return;
            }
        }
    }

    saving.value = true;

    try {
        const data = {
            description: form.value.description?.trim() || null,
            scriptSettingId: form.value.scriptSettingId || null,
            campaignIds: form.value.campaignId 
                ? JSON.stringify([form.value.campaignId]) 
                : null,
            generatedScript: form.value.generatedScript || null,
            generatedCode: form.value.generatedCode || null,
            sellerUrl: form.value.sellerUrl?.trim() || null,
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
            showNotification('error', `Erro ao salvar: ${error.response.data.message}`);
        } else {
            showNotification('error', 'Erro ao salvar tag. Verifique o console para mais detalhes.');
        }
    } finally {
        saving.value = false;
    }
};

// Validar scripts de todas as tags
const validateAllScripts = async () => {
    if (validatingScripts.value) {
        return;
    }

    validatingScripts.value = true;

    try {
        const result = await client.tags.validateScripts();
        console.log('[TagsView] Resultado da validação de scripts:', result);

        // Recarregar dados para garantir que qualquer mudança futura seja refletida
        await loadData();

        const total = result?.total ?? 0;
        const encontrados = result?.encontrados ?? 0;
        const naoEncontrados = result?.naoEncontrados ?? 0;
        const erros = result?.erros ?? 0;

        const message =
            `Validação concluída. ` +
            `Total: ${total} | Ativos: ${encontrados} | Caiu/Não encontrados: ${naoEncontrados} | Erros: ${erros}`;

        showNotification('success', message);
    } catch (error: any) {
        console.error('[TagsView] Erro ao validar scripts:', error);
        showNotification('error', 'Erro ao validar scripts. Verifique o console para mais detalhes.');
    } finally {
        validatingScripts.value = false;
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
        showNotification('error', 'Erro ao excluir tag. Verifique o console para mais detalhes.');
    }
};

onMounted(() => {
    loadData();
});
</script>

