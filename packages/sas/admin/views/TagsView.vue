<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Gerenciamento de Tags</h1>
            <button
                @click="openDialog"
                class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3.5 w-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nova Tag
            </button>
        </div>

        <!-- Filtros e busca -->
        <div class="bg-neutral-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex-1 flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1">
                    <input
                        v-model="campaignSearchTable"
                        type="text"
                        placeholder="Buscar por campanha"
                        class="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 text-neutral-400 absolute left-2.5 top-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                        />
                    </svg>
                </div>

                <div class="w-full sm:w-64">
                    <select
                        v-model="modelFilter"
                        class="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            <div class="flex items-center gap-3">
                <button
                    @click="refreshData"
                    class="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium rounded-md flex items-center gap-1"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H4m0 0V4m0 5a8.003 8.003 0 0015.356 2H20"
                        />
                    </svg>
                    Atualizar
                </button>

                <button
                    @click="validateAllScripts"
                    :disabled="validatingScripts"
                    class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md flex items-center gap-1"
                >
                    <svg
                        v-if="!validatingScripts"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        ></circle>
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                        ></path>
                    </svg>
                    {{ validatingScripts ? 'Validando scripts...' : 'Validar Scripts' }}
                </button>
            </div>
        </div>

        <!-- Tabela de Tags -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                            Modelo de Script
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                            Campanha
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                            URL do Seller
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                            Código Gerado
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                            Status Script
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                            Status Tag
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="paginatedItems.length === 0">
                        <td colspan="7" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhuma tag cadastrada
                        </td>
                    </tr>
                    <tr
                        v-for="item in paginatedItems"
                        :key="item.id"
                        class="hover:bg-neutral-700"
                    >
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                            {{ getScriptSettingName(item.scriptSettingId) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                            {{ getItemCampaignName(item) || '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                            <span class="block max-w-xs truncate" :title="item.sellerUrl || ''">
                                {{ item.sellerUrl || '-' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 font-mono">
                            {{ item.generatedCode || '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span
                                :class="getStatusClass(item.scriptStatus)"
                                class="px-2 py-1 text-xs rounded-full text-white"
                            >
                                {{ getStatusLabel(item.scriptStatus) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span
                                :class="item.active ? 'bg-green-500' : 'bg-red-500'"
                                class="px-2 py-1 text-xs rounded-full text-white"
                            >
                                {{ item.active ? 'Ativa' : 'Inativa' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex items-center gap-2">
                                <button
                                    @click="editItem(item)"
                                    class="text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Editar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    @click="viewScript(item.generatedScript)"
                                    class="text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    :disabled="!item.generatedScript"
                                    title="Ver Script"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                                <button
                                    @click="deleteItem(item.id)"
                                    class="text-red-400 hover:text-red-300 transition-colors"
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

        <!-- Paginação -->
        <div
            v-if="filteredItems.length > 0"
            class="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-300"
        >
            <div>
                Mostrando {{ pageStart }}-{{ pageEnd }} de {{ filteredItems.length }} registros
            </div>
            <div class="flex items-center gap-2">
                <button
                    @click="currentPage = Math.max(1, currentPage - 1)"
                    :disabled="currentPage === 1"
                    class="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded disabled:opacity-50"
                >
                    Anterior
                </button>
                <span>Página {{ currentPage }} de {{ totalPages }}</span>
                <button
                    @click="currentPage = Math.min(totalPages, currentPage + 1)"
                    :disabled="currentPage === totalPages"
                    class="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded disabled:opacity-50"
                >
                    Próxima
                </button>
            </div>
        </div>

        <!-- Modal de Cadastro/Edição -->
        <div
            v-if="showDialog"
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            style="backdrop-filter: blur(4px);"
        >
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">
                        {{ isEditing ? 'Editar Tag' : 'Nova Tag' }}
                    </h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="saveTag" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Modelo de Script <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="form.scriptSettingId"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.scriptSettingId }"
                            @change="onScriptSettingChange"
                        >
                            <option value="">Selecione um modelo</option>
                            <option
                                v-for="setting in scriptSettings"
                                :key="setting.id"
                                :value="setting.id"
                            >
                                {{ getScriptSettingDisplayName(setting) }}
                            </option>
                        </select>
                        <p v-if="formErrors.scriptSettingId" class="mt-1 text-sm text-red-400">
                            {{ formErrors.scriptSettingId }}
                        </p>
                    </div>

                    <!-- Campo para nome do arquivo JS (apenas para modelos personalizados) -->
                    <div v-if="isCustomScriptSettingSelected" class="space-y-2">
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome do arquivo JS gerado
                        </label>
                        <input
                            v-model="form.customJsFileName"
                            type="text"
                            placeholder="Ex: gab22s4h20001000.js ou apenas gab22s4h20001000"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            :class="{ 'border-red-500': formErrors.customJsFileName }"
                        />
                        <p class="mt-1 text-xs text-neutral-400">
                            Informe o nome exato do arquivo JS já criado no servidor do parceiro. Você pode colar a URL
                            completa que o sistema extrai apenas o nome do arquivo.
                        </p>
                        <p v-if="formErrors.customJsFileName" class="mt-1 text-sm text-red-400">
                            {{ formErrors.customJsFileName }}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Campanha <span class="text-red-500">*</span>
                        </label>

                        <div class="relative">
                            <input
                                v-model="campaignSearch"
                                type="text"
                                placeholder="Buscar campanha pelo nome"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                @focus="loadAvailableCampaigns"
                                @input="loadAvailableCampaigns"
                            />
                            <div
                                v-if="loadingCampaigns"
                                class="absolute inset-y-0 right-0 flex items-center pr-3"
                            >
                                <svg
                                    class="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    ></circle>
                                    <path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                                    ></path>
                                </svg>
                            </div>
                        </div>

                        <div class="mt-2 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-md">
                            <div
                                v-for="campaign in filteredCampaigns"
                                :key="campaign.id"
                                class="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-neutral-800"
                                @click="form.campaignId = campaign.id"
                            >
                                <div class="flex-1">
                                    <p class="text-sm text-white font-medium">
                                        {{ campaign.name }}
                                    </p>
                                    <p class="text-xs text-neutral-400">
                                        {{ campaign.sellerDomain || 'Domínio não informado' }}
                                    </p>
                                </div>
                                <div class="ml-3">
                                    <span
                                        v-if="form.campaignId === campaign.id"
                                        class="inline-flex items-center justify-center w-4 h-4 rounded-full border border-blue-500"
                                    >
                                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                                    </span>
                                    <span
                                        v-else
                                        class="inline-flex items-center justify-center w-4 h-4 rounded-full border border-neutral-600"
                                    ></span>
                                </div>
                            </div>

                            <div v-if="!loadingCampaigns && filteredCampaigns.length === 0" class="px-3 py-2 text-xs text-neutral-400">
                                Nenhuma campanha encontrada para o modelo selecionado.
                            </div>
                        </div>

                        <p v-if="formErrors.campaignIds" class="mt-1 text-sm text-red-400">
                            {{ formErrors.campaignIds }}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            URL do Seller <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.sellerUrl"
                            type="text"
                            placeholder="https://exemplo.com.br/pagina-com-o-script"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.sellerUrl }"
                        />
                        <p class="mt-1 text-xs text-neutral-400">
                            Informe a URL exata da página onde o script será instalado.
                        </p>
                        <p v-if="formErrors.sellerUrl" class="mt-1 text-sm text-red-400">
                            {{ formErrors.sellerUrl }}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Script Gerado
                        </label>
                        <textarea
                            v-model="form.generatedScript"
                            rows="6"
                            class="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md text-xs text-neutral-200 font-mono placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="O script será gerado automaticamente ao selecionar o modelo de script"
                            readonly
                        ></textarea>
                        <p class="mt-1 text-xs text-neutral-400">
                            Este é o script que deve ser instalado na página do seller.
                        </p>
                    </div>

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
                    <h3 class="text-lg font-medium text:white">Script Gerado</h3>
                    <button @click="showScriptModal = false" class="text-neutral-400 hover:text:white">
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

// Lista de tags filtrada por modelo e nome de campanha, ordenada pelo último script criado
const filteredItems = computed(() => {
    // Cria mapa de campanhas por id para busca rápida
    const campaignMap = new Map<string, string>();
    for (const c of allCampaigns.value) {
        if (c.id && c.name) {
            campaignMap.set(c.id, c.name);
        }
    }

    const searchTerm = campaignSearchTable.value.toLowerCase().trim();

    const filtered = items.value.filter((item: any) => {
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

    // Ordenar pelo último script criado (id descendente - mais recente primeiro)
    return filtered.sort((a: any, b: any) => {
        // Comparar por id (UUIDs mais recentes são maiores)
        // Se não houver id, usar generatedCode como fallback
        if (a.id && b.id) {
            return b.id.localeCompare(a.id);
        }
        if (a.generatedCode && b.generatedCode) {
            return b.generatedCode.localeCompare(a.generatedCode);
        }
        return 0;
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

        console.log('[DEBUG loadData] Tags carregadas:', items.value.length);
        console.log('[DEBUG loadData] Script Settings carregados:', scriptSettings.value.length);
        console.log('[DEBUG loadData] Parceiros carregados:', commercialPartners.value.length);
        console.log('[DEBUG loadData] Campanhas carregadas:', allCampaigns.value.length);

        // Verificar quantos parceiros são do tipo "Direto"
        const directPartners = commercialPartners.value.filter((p: any) => p.partnerType === 'Direto');
        console.log('[DEBUG loadData] Parceiros do tipo "Direto":', directPartners.length);
        console.log('[DEBUG loadData] Lista de parceiros Direto:', directPartners.map((p: any) => ({ id: p.id, name: p.name, partnerType: p.partnerType })));

        // Verificar modelos de script sem commercialPartnerId (Modelo Único - Direto)
        const directModels = scriptSettings.value.filter((s: any) => !s.commercialPartnerId);
        console.log('[DEBUG loadData] Modelos "Direto" (sem commercialPartnerId):', directModels.length);
        console.log('[DEBUG loadData] Detalhes dos modelos Direto:', directModels);
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

        // 1) Tentar resolver como campanha normal
        const fromCampaign = mapToUse.get(firstId);
        if (fromCampaign) {
            return fromCampaign;
        }

        // 2) Fallback: tentar resolver como parceiro comercial (para casos Direto)
        const partner = commercialPartners.value.find((p: any) => p.id === firstId);
        if (partner && partner.name) {
            return partner.name;
        }

        return '';
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

        console.log('[DEBUG] Script Setting selecionado:', setting);
        console.log('[DEBUG] commercialPartnerId:', setting.commercialPartnerId);

        // Se for modelo Direto (sem commercialPartnerId), usar parceiros do tipo "Direto" como opções
        if (!setting.commercialPartnerId) {
            console.log('[DEBUG] Modelo DIRETO detectado - usando parceiros com partnerType = \"Direto\" como opções');

            // Reutilizar parceiros já carregados se possível; caso contrário, buscar da API
            let allPartnersData = commercialPartners.value && commercialPartners.value.length
                ? commercialPartners.value
                : (await client.commercialPartners.getAll())?.data || [];

            console.log('[DEBUG] Total de parceiros retornados (cache + API):', allPartnersData.length);

            // Filtrar parceiros do tipo Direto (case-insensitive, ignorando espaços)
            const directPartners = allPartnersData.filter((p: any) => {
                if (!p.partnerType) return false;
                const partnerType = String(p.partnerType).trim().toLowerCase();
                return partnerType === 'direto';
            });
            
            console.log('[DEBUG] Parceiros do tipo \"Direto\":', directPartners.length);
            console.log('[DEBUG] Parceiros Direto usados como \"campanhas\":', directPartners.map((p: any) => ({ 
                id: p.id, 
                name: p.name, 
                partnerType: p.partnerType,
                idType: typeof p.id,
                link: p.link || null
            })));

            // Montar availableCampaigns a partir dos parceiros Direto
            // Assim, para o modelo Direto, o usuário escolhe diretamente um parceiro do tipo Direto
            availableCampaigns.value = directPartners.map((p: any) => ({
                id: p.id,
                name: p.name,
                sellerDomain: p.link || '',
                partnerType: p.partnerType,
                isDirectPartner: true
            }));

            console.log('[DEBUG] ✅ Opções disponíveis para modelo Direto (parceiros Direto):', availableCampaigns.value.length);
        } else {
            console.log('[DEBUG] Modelo de REDE detectado - buscando campanhas do parceiro específico');
            console.log('[DEBUG] Partner ID:', setting.commercialPartnerId);

            // Se for modelo de Rede, buscar campanhas do parceiro específico
            const campaigns = await client.campaigns.getAllByPartner(setting.commercialPartnerId);
            console.log('[DEBUG] Campanhas retornadas para o parceiro:', campaigns?.data?.length || 0);

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

// Fechar dialog
const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    editingItem.value = null;
    formErrors.value = {};
    availableCampaigns.value = [];
    campaignSearch.value = '';
};

// Abrir dialog para adicionar
const openDialog = () => {
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
        campaignId: '',
        generatedScript: item.generatedScript || '',
        generatedCode: item.generatedCode || '',
        sellerUrl: item.sellerUrl || '',
        active: item.active !== undefined ? item.active : true,
        customJsFileName: ''
    };

    formErrors.value = {};
    availableCampaigns.value = [];
    campaignSearch.value = '';

    if (item.scriptSettingId) {
        onScriptSettingChange();
    }

    showDialog.value = true;
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
        console.error('Erro ao excluir tag:', error);
        showNotification('error', 'Erro ao excluir tag. Verifique o console para mais detalhes.');
    }
};

// Visualizar script completo em modal
const viewScript = (script: string | null | undefined) => {
    if (!script) return;
    scriptToView.value = script;
    showScriptModal.value = true;
};

// Copiar script para área de transferência
const copyScriptToClipboard = async (script: string) => {
    try {
        await navigator.clipboard.writeText(script);
        showNotification('success', 'Script copiado para a área de transferência!');
    } catch (error) {
        console.error('Erro ao copiar script:', error);
        showNotification('error', 'Não foi possível copiar o script.');
    }
};

// Validar todos os scripts
const validateAllScripts = async () => {
    if (validatingScripts.value) return;

    if (!confirm('Deseja validar todos os scripts agora? Isso pode levar alguns minutos.')) {
        return;
    }

    validatingScripts.value = true;

    try {
        const result = await client.tags.validateScripts();
        console.log('Resultado da validação de scripts:', result);

        showNotification('success', 'Validação de scripts iniciada. Aguarde alguns minutos e atualize a página.');
    } catch (error) {
        console.error('Erro ao validar scripts:', error);
        showNotification('error', 'Erro ao iniciar validação de scripts. Verifique o console para mais detalhes.');
    } finally {
        validatingScripts.value = false;
    }
};

const filters = ref({
    sortBy: 'id',
    sortOrder: 'desc' as 'asc' | 'desc'
});

const toggleSort = (column: string) => {
    if (filters.value.sortBy === column) {
        filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        filters.value.sortBy = column;
        filters.value.sortOrder = 'asc';
    }
};

// Atualizar dados
const refreshData = async () => {
    await loadData();
};

onMounted(() => {
    loadData();
});
</script>
