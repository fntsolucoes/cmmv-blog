<template>
    <div class="space-y-6">
        <!-- Cabeçalho e Ações -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <h1 class="text-2xl font-bold text-white">Campanhas</h1>
            <div class="flex gap-2">
                <button 
                    @click="validateAllLinks" 
                    :disabled="validatingAllLinks"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                >
                    <svg v-if="!validatingAllLinks" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <svg v-else class="animate-spin h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ validatingAllLinks ? 'Validando...' : 'Validar Todos os Links' }}
                </button>
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nova Campanha
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-neutral-800 rounded-lg p-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Busca por nome -->
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Busca por nome</label>
                    <input
                        v-model="filters.search"
                        type="text"
                        placeholder="Digite o nome..."
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        @input="applyFilters"
                    />
                </div>

                <!-- Filtro por parceiro -->
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Filtro por parceiro</label>
                    <select
                        v-model="filters.partner"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        @change="applyFilters"
                    >
                        <option value="">Todos</option>
                        <option value="Direto">Direto</option>
                        <option
                            v-for="partner in affiliatePartners"
                            :key="partner.id"
                            :value="partner.id"
                        >
                            {{ partner.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Tabela Unificada -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th 
                            class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:bg-neutral-600"
                            @click="sortBy('name')"
                        >
                            <div class="flex items-center">
                                Título
                                <span v-if="sortColumn === 'name'" class="ml-1">
                                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                </span>
                                <span v-else class="ml-1 text-neutral-500 text-xs">↕</span>
                            </div>
                        </th>
                        <th 
                            class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:bg-neutral-600"
                            @click="sortBy('partner')"
                        >
                            <div class="flex items-center">
                                Parceiro
                                <span v-if="sortColumn === 'partner'" class="ml-1">
                                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                </span>
                            </div>
                        </th>
                        <th 
                            class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider cursor-pointer hover:bg-neutral-600"
                            @click="sortBy('status')"
                        >
                            <div class="flex items-center">
                                Status
                                <span v-if="sortColumn === 'status'" class="ml-1">
                                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                                </span>
                            </div>
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Tag</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ponderação</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Link</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="paginatedItems.length === 0">
                        <td colspan="7" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhum item encontrado
                        </td>
                    </tr>
                    <tr v-for="item in paginatedItems" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.name }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ getPartnerDisplay(item) }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="getStatusClass(item)" class="px-2 py-1 text-xs rounded-full text-white border">
                                {{ getStatusText(item) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="getTagClass(item)" class="px-2 py-1 text-xs rounded text-white">
                                {{ getTagText(item) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {{ getWeightingDisplay(item) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span v-if="item.link" :class="getLinkStatusClass(item)" class="px-2 py-1 text-xs rounded-full text-white border">
                                {{ getLinkStatusText(item) }}
                            </span>
                            <span v-else class="text-xs text-neutral-500">-</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex items-center gap-2">
                                <button 
                                    v-if="item.link && item.link.trim()"
                                    @click="validateLink(item)" 
                                    :disabled="validatingLinks[item.id]"
                                    class="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    :title="item.type === 'campaign' ? 'Validar link da campanha' : 'Validar link do parceiro direto'"
                                >
                                    <svg v-if="!validatingLinks[item.id]" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <svg v-else class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </button>
                                <button @click="editItem(item)" class="text-blue-400 hover:text-blue-300">Editar</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Paginação -->
            <div v-if="totalRecords > 0" class="bg-neutral-700 px-6 py-4 flex items-center justify-between border-t border-neutral-600">
                <div class="text-sm text-neutral-300">
                    Mostrando {{ ((currentPage - 1) * itemsPerPage) + 1 }} a {{ Math.min(currentPage * itemsPerPage, totalRecords) }} de {{ totalRecords }} registro{{ totalRecords !== 1 ? 's' : '' }}
                </div>
                <div v-if="totalPages > 1" class="flex gap-2">
                    <button
                        @click="prevPage"
                        :disabled="currentPage === 1"
                        class="px-3 py-1 bg-neutral-600 hover:bg-neutral-500 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span class="px-3 py-1 text-sm text-neutral-300">
                        Página {{ currentPage }} de {{ totalPages }}
                    </span>
                    <button
                        @click="nextPage"
                        :disabled="currentPage === totalPages"
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

        <!-- Modal de Campanha -->
        <div v-if="showCampaignDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center sticky top-0 bg-neutral-800 z-10">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Campanha' : 'Nova Campanha' }}</h3>
                    <button @click="closeCampaignDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="saveCampaign" class="p-6 space-y-4">
                    <!-- Nome -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="campaignForm.name"
                            type="text"
                            placeholder="Nome da campanha"
                            maxlength="255"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.name }"
                            @input="validateCampaignName"
                            required
                        />
                        <p v-if="formErrors.name" class="mt-1 text-sm text-red-400">{{ formErrors.name }}</p>
                    </div>

                    <!-- Parceiro -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Parceiro <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="campaignForm.commercialPartnerId"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.commercialPartnerId }"
                            required
                        >
                            <option value="">Selecione...</option>
                            <option
                                v-for="partner in affiliatePartners"
                                :key="partner.id"
                                :value="partner.id"
                            >
                                {{ partner.name }}
                            </option>
                        </select>
                        <p v-if="formErrors.commercialPartnerId" class="mt-1 text-sm text-red-400">{{ formErrors.commercialPartnerId }}</p>
                    </div>

                    <!-- Data de Início -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Data de Início <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="campaignForm.startDate"
                            type="date"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.startDate }"
                            required
                            @change="validateCampaignDates"
                        />
                        <p v-if="formErrors.startDate" class="mt-1 text-sm text-red-400">{{ formErrors.startDate }}</p>
                    </div>

                    <!-- Data de Fim -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Data de Fim
                        </label>
                        <input
                            v-model="campaignForm.endDate"
                            type="date"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.endDate }"
                            @input="onCampaignEndDateChange"
                            @change="validateCampaignDates"
                        />
                        <p v-if="formErrors.endDate" class="mt-1 text-sm text-red-400">{{ formErrors.endDate }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Deixe em branco se a campanha estiver em andamento indefinidamente</p>
                    </div>

                    <!-- Script -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">Script</label>
                        <textarea
                            v-model="campaignForm.script"
                            rows="6"
                            placeholder="Código do script"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                        ></textarea>
                    </div>

                    <!-- Status do Script -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">Status do Script</label>
                        <select
                            v-model="campaignForm.scriptStatus"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecione...</option>
                            <option value="Implementado">Implementado</option>
                            <option value="Caiu">Caiu</option>
                            <option value="Pendente de instalar">Pendente de instalar</option>
                        </select>
                    </div>

                    <!-- Ponderação -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">Ponderação (%)</label>
                        <input
                            v-model="campaignForm.weighting"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.weighting }"
                            @input="validateWeighting"
                        />
                        <p v-if="formErrors.weighting" class="mt-1 text-sm text-red-400">{{ formErrors.weighting }}</p>
                    </div>

                    <!-- Link -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">Link</label>
                        <input
                            v-model="campaignForm.link"
                            type="url"
                            placeholder="https://exemplo.com/campanha"
                            maxlength="500"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <!-- Campanha não iniciada (Pendência) -->
                    <div class="flex items-center">
                        <input
                            v-model="campaignForm.neverStarted"
                            type="checkbox"
                            id="neverStarted"
                            class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                        />
                        <label for="neverStarted" class="ml-2 text-sm font-medium text-neutral-300">
                            Campanha não iniciada (Pendência)
                        </label>
                    </div>

                    <!-- Botões -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-neutral-700">
                        <button
                            type="button"
                            @click="closeCampaignDialog"
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
                            {{ saving ? 'Salvando...' : 'Salvar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal de Parceiro Direto -->
        <div v-if="showPartnerDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center sticky top-0 bg-neutral-800 z-10">
                    <h3 class="text-lg font-medium text-white">Editar Parceiro Direto</h3>
                    <button @click="closePartnerDialog" class="text-neutral-400 hover:text-white">
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
                            v-model="partnerForm.name"
                            type="text"
                            placeholder="Nome do parceiro"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.name }"
                            required
                        />
                        <p v-if="formErrors.name" class="mt-1 text-sm text-red-400">{{ formErrors.name }}</p>
                    </div>

                    <!-- Data de Início -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Data de Início
                        </label>
                        <input
                            v-model="partnerForm.startDate"
                            type="date"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.startDate }"
                            @change="validatePartnerDates"
                        />
                        <p v-if="formErrors.startDate" class="mt-1 text-sm text-red-400">{{ formErrors.startDate }}</p>
                    </div>

                    <!-- Data de Fim -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Data de Fim
                        </label>
                        <input
                            v-model="partnerForm.endDate"
                            type="date"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.endDate }"
                            @input="onPartnerEndDateChange"
                            @change="validatePartnerDates"
                        />
                        <p v-if="formErrors.endDate" class="mt-1 text-sm text-red-400">{{ formErrors.endDate }}</p>
                    </div>

                    <!-- Status Ativo/Inativo -->
                    <div class="flex items-center">
                        <input
                            v-model="partnerForm.active"
                            type="checkbox"
                            id="partnerActive"
                            class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                        />
                        <label for="partnerActive" class="ml-2 text-sm font-medium text-neutral-300">
                            Parceiro ativo
                        </label>
                    </div>

                    <!-- Script -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">Script</label>
                        <textarea
                            v-model="partnerForm.script"
                            rows="6"
                            placeholder="Código do script"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                        ></textarea>
                    </div>

                    <!-- Status do Script -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">Status do Script</label>
                        <select
                            v-model="partnerForm.scriptStatus"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecione...</option>
                            <option value="Implementado">Implementado</option>
                            <option value="Caiu">Caiu</option>
                            <option value="Pendente de instalar">Pendente de instalar</option>
                        </select>
                    </div>

                    <!-- Ponderação -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">Ponderação (%)</label>
                        <input
                            v-model="partnerForm.weighting"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.weighting }"
                            @input="validateWeighting"
                        />
                        <p v-if="formErrors.weighting" class="mt-1 text-sm text-red-400">{{ formErrors.weighting }}</p>
                    </div>

                    <!-- Link -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">Link</label>
                        <input
                            v-model="partnerForm.link"
                            type="url"
                            placeholder="https://exemplo.com"
                            maxlength="500"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <!-- Botões -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-neutral-700">
                        <button
                            type="button"
                            @click="closePartnerDialog"
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
                            {{ saving ? 'Salvando...' : 'Salvar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();

// Dados
const campaigns = ref<any[]>([]);
const commercialPartners = ref<any[]>([]);
const directPartners = ref<any[]>([]);

// Filtros e ordenação
const filters = ref({
    search: '',
    partner: ''
});

const sortColumn = ref<string>('name'); // Ordenação padrão por título
const sortDirection = ref<'asc' | 'desc'>('asc');

// Estados
const showCampaignDialog = ref(false);
const showPartnerDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const editingItem = ref<any>(null);
const formErrors = ref<Record<string, string>>({});
const validatingAllLinks = ref(false);
const validatingLinks = ref<Record<string, boolean>>({});

// Formulários
const campaignForm = ref({
    commercialPartnerId: '',
    name: '',
    startDate: '',
    endDate: '',
    script: '',
    scriptStatus: '',
    weighting: '',
    link: '',
    active: true,
    originalActive: true, // Guardar status original para restaurar
    neverStarted: false // Campanha não iniciada (Pendência) - padrão: false
});

const partnerForm = ref({
    name: '',
    startDate: '',
    endDate: '',
    script: '',
    scriptStatus: '',
    weighting: '',
    link: '',
    active: true
});

// Computed: Parceiros de Afiliação
const affiliatePartners = computed(() => {
    return commercialPartners.value.filter(p => p.partnerType === 'Rede de Afiliação' && p.active);
});

// Computed: Itens unificados (campanhas + parceiros diretos)
const unifiedItems = computed(() => {
    const items: any[] = [];
    
    // Adicionar campanhas
    campaigns.value.forEach(campaign => {
        items.push({
            ...campaign,
            type: 'campaign',
            partnerName: getPartnerName(campaign.commercialPartnerId)
        });
    });
    
    // Adicionar parceiros diretos
    directPartners.value.forEach(partner => {
        items.push({
            ...partner,
            type: 'partner',
            partnerName: 'Direto'
        });
    });
    
    return items;
});

// Paginação
const currentPage = ref(1);
const itemsPerPage = 30;
const totalRecords = computed(() => filteredItems.value.length);
const totalPages = computed(() => Math.ceil(totalRecords.value / itemsPerPage));

// Items paginados
const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredItems.value.slice(start, end);
});

// Funções de paginação
const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

// Computed: Itens filtrados e ordenados
const filteredItems = computed(() => {
    let items = [...unifiedItems.value];
    
    // Aplicar filtro de busca
    if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        items = items.filter(item => 
            item.name.toLowerCase().includes(search)
        );
    }
    
    // Aplicar filtro de parceiro
    if (filters.value.partner) {
        if (filters.value.partner === 'Direto') {
            items = items.filter(item => item.type === 'partner');
        } else {
            items = items.filter(item => 
                item.type === 'campaign' && item.commercialPartnerId === filters.value.partner
            );
        }
    }
    
    // Aplicar ordenação
    if (sortColumn.value) {
        console.log(`[CampaignsView] Aplicando ordenação: coluna=${sortColumn.value}, direção=${sortDirection.value}, total de itens=${items.length}`);
        items.sort((a, b) => {
            let aVal: any;
            let bVal: any;
            
            if (sortColumn.value === 'name') {
                aVal = (a.name || '').toLowerCase();
                bVal = (b.name || '').toLowerCase();
            } else if (sortColumn.value === 'partner') {
                aVal = (a.partnerName || '').toLowerCase();
                bVal = (b.partnerName || '').toLowerCase();
            } else if (sortColumn.value === 'status') {
                aVal = getStatusText(a);
                bVal = getStatusText(b);
            }
            
            // Tratar valores nulos/undefined
            if (aVal == null) aVal = '';
            if (bVal == null) bVal = '';
            
            const result = aVal < bVal ? (sortDirection.value === 'asc' ? -1 : 1) : (aVal > bVal ? (sortDirection.value === 'asc' ? 1 : -1) : 0);
            return result;
        });
        console.log(`[CampaignsView] Ordenação aplicada. Primeiros 3 itens:`, items.slice(0, 3).map(i => i.name));
    } else {
        // Se não houver ordenação definida, ordenar por título por padrão
        items.sort((a, b) => {
            const aVal = (a.name || '').toLowerCase();
            const bVal = (b.name || '').toLowerCase();
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });
    }
    
    return items;
});

// Funções auxiliares
const getPartnerName = (partnerId: string): string => {
    const partner = commercialPartners.value.find(p => p.id === partnerId);
    return partner ? partner.name : partnerId;
};

const getPartnerDisplay = (item: any): string => {
    if (item.type === 'partner') {
        return 'Direto';
    }
    return item.partnerName || getPartnerName(item.commercialPartnerId);
};

const getStatusText = (item: any): string => {
    if (item.type === 'partner') {
        // Para parceiros diretos, verificar se a data de fim já passou
        if (item.endDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(item.endDate);
            endDate.setHours(0, 0, 0, 0);
            
            if (today > endDate) {
                return 'Inativo';
            }
        }
        return item.active ? 'Ativo' : 'Inativo';
    }
    
    // Para campanhas, verificar primeiro se nunca foi iniciada (Pendência)
    if (item.neverStarted === true) {
        return 'Pendência';
    }
    
    // Para campanhas, calcular baseado em datas
    if (!item.active) return 'Inativo';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(item.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    if (item.endDate) {
        const endDate = new Date(item.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        if (today < startDate) return 'Agendada';
        if (today > endDate) return 'Encerrada';
        return 'Ativa';
    }
    
    if (today < startDate) return 'Agendada';
    return 'Ativa';
};

const getStatusClass = (item: any): string => {
    const status = getStatusText(item);
    if (status === 'Ativo' || status === 'Ativa') {
        return 'bg-green-500 border-green-600';
    }
    if (status === 'Pendência') {
        return 'bg-yellow-500 border-yellow-600';
    }
    if (status === 'Agendada') {
        return 'bg-blue-500 border-blue-600';
    }
    if (status === 'Encerrada') {
        return 'bg-gray-500 border-gray-600';
    }
    return 'bg-red-500 border-red-600';
};

const getTagText = (item: any): string => {
    if (!item.script || !item.script.trim()) {
        return 'Não possui';
    }
    
    if (item.scriptStatus === 'Implementado') return 'Implementado';
    if (item.scriptStatus === 'Caiu') return 'Caiu';
    if (item.scriptStatus === 'Pendente de instalar') return 'Pendente de instalar';
    
    // Se tem script mas não tem status, é "Instalada"
    return 'Instalada';
};

const getTagClass = (item: any): string => {
    const tag = getTagText(item);
    if (tag === 'Implementado' || tag === 'Instalada') return 'bg-green-600';
    if (tag === 'Caiu') return 'bg-red-600';
    if (tag === 'Pendente de instalar') return 'bg-yellow-600';
    return 'bg-gray-600';
};

const getWeightingDisplay = (item: any): string => {
    if (item.weighting !== null && item.weighting !== undefined && item.weighting !== '') {
        const weighting = typeof item.weighting === 'string' ? parseFloat(item.weighting) : item.weighting;
        if (!isNaN(weighting)) {
            return `${weighting.toFixed(2)}%`;
        }
    }
    return '-';
};

const getLinkStatusText = (item: any): string => {
    if (!item.link || !item.link.trim()) {
        return '-';
    }
    
    if (item.linkStatus === 'OK') {
        return 'Link Ok';
    }
    
    if (item.linkStatus === 'Quebrado') {
        return 'Link Quebrado';
    }
    
    // Se não tem status ainda, retornar "Não validado"
    return 'Não validado';
};

const getLinkStatusClass = (item: any): string => {
    if (item.linkStatus === 'OK') {
        return 'bg-green-500 border-green-600';
    }
    
    if (item.linkStatus === 'Quebrado') {
        return 'bg-red-500 border-red-600';
    }
    
    // Status não validado
    return 'bg-yellow-500 border-yellow-600';
};

// Ordenação
const sortBy = (column: string) => {
    console.log(`[CampaignsView] Ordenando por: ${column}, coluna atual: ${sortColumn.value}, direção: ${sortDirection.value}`);
    if (sortColumn.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn.value = column;
        sortDirection.value = 'asc';
    }
    console.log(`[CampaignsView] Nova ordenação: coluna=${sortColumn.value}, direção=${sortDirection.value}`);
    // Resetar para primeira página ao ordenar
    currentPage.value = 1;
};

// Aplicar filtros
const applyFilters = () => {
    // Os filtros são aplicados automaticamente pelo computed
};

// Validações
const hasOrientalCharacters = (text: string): boolean => {
    const orientalRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\uAC00-\uD7AF]/;
    return orientalRegex.test(text);
};

const validateCampaignName = () => {
    formErrors.value.name = '';
    const name = campaignForm.value.name.trim();
    
    if (name.length < 2) {
        formErrors.value.name = 'Nome deve ter no mínimo 2 caracteres';
        return false;
    }
    
    if (name.length > 255) {
        formErrors.value.name = 'Nome deve ter no máximo 255 caracteres';
        return false;
    }
    
    if (hasOrientalCharacters(name)) {
        formErrors.value.name = 'Nome não pode conter caracteres orientais';
        return false;
    }
    
    return true;
};

// Atualizar status quando a data de fim mudar
const onCampaignEndDateChange = () => {
    // Se a data de fim foi limpa, voltar para ativa
    if (!campaignForm.value.endDate || campaignForm.value.endDate === '' || campaignForm.value.endDate.trim() === '') {
        campaignForm.value.active = true;
        // Garantir que o campo está realmente vazio
        campaignForm.value.endDate = '';
    }
};

const validateCampaignDates = () => {
    formErrors.value.startDate = '';
    formErrors.value.endDate = '';
    
    if (!campaignForm.value.startDate) {
        return true;
    }
    
    // Se a data de fim foi limpa, garantir que está vazia e status ativo
    if (!campaignForm.value.endDate || campaignForm.value.endDate === '' || campaignForm.value.endDate.trim() === '') {
        campaignForm.value.endDate = '';
        campaignForm.value.active = true;
        return true;
    }
    
    const startDate = new Date(campaignForm.value.startDate);
    const endDate = new Date(campaignForm.value.endDate);
    
    if (endDate < startDate) {
        formErrors.value.endDate = 'Data de fim não pode ser anterior à data de início';
        return false;
    }
    
    return true;
};

const validatePartnerDates = () => {
    formErrors.value.startDate = '';
    formErrors.value.endDate = '';
    
    if (!partnerForm.value.startDate) {
        return true;
    }
    
    if (partnerForm.value.endDate) {
        const startDate = new Date(partnerForm.value.startDate);
        const endDate = new Date(partnerForm.value.endDate);
        
        if (endDate < startDate) {
            formErrors.value.endDate = 'Data de fim não pode ser anterior à data de início';
            return false;
        }
    }
    
    return true;
};

// Atualizar status ativo quando a data de fim mudar
const onPartnerEndDateChange = () => {
    // Se a data de fim foi limpa, voltar para ativo
    if (!partnerForm.value.endDate || partnerForm.value.endDate === '' || partnerForm.value.endDate.trim() === '') {
        partnerForm.value.active = true;
        partnerForm.value.endDate = '';
        validatePartnerDates();
        return;
    }
    
    validatePartnerDates();
    
    // Se a data de fim já passou, desativar automaticamente
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(partnerForm.value.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    if (today > endDate) {
        partnerForm.value.active = false;
    }
};

const validateWeighting = () => {
    formErrors.value.weighting = '';
    
    const weightingValue = campaignForm.value.weighting || partnerForm.value.weighting;
    if (!weightingValue || weightingValue === '') {
        return true;
    }
    
    const weighting = parseFloat(weightingValue);
    
    if (isNaN(weighting)) {
        formErrors.value.weighting = 'Ponderação deve ser um número válido';
        return false;
    }
    
    if (weighting < 0 || weighting > 100) {
        formErrors.value.weighting = 'Ponderação deve estar entre 0 e 100';
        return false;
    }
    
    const parts = weightingValue.toString().split('.');
    if (parts[1] && parts[1].length > 2) {
        formErrors.value.weighting = 'Ponderação deve ter no máximo 2 casas decimais';
        return false;
    }
    
    return true;
};

// Carregar dados
const loadData = async () => {
    try {
        console.log(`[CampaignsView] Carregando campanhas...`);
        // Usar endpoint customizado que retorna todas as campanhas sem limite
        let campaignsData = [];
        try {
            const campaignsResponse = await client.campaigns.getAll();
            campaignsData = campaignsResponse.data || [];
            console.log(`[CampaignsView] ✅ ${campaignsData.length} campanhas carregadas via getAll`);
        } catch (error) {
            console.error(`[CampaignsView] ❌ Erro ao usar getAll, tentando fallback:`, error);
            // Fallback para o endpoint padrão se o customizado falhar
            const fallbackResponse = await client.campaigns.get({ limit: '10000' });
            campaignsData = fallbackResponse.data || [];
            console.log(`[CampaignsView] ✅ Fallback: ${campaignsData.length} campanhas carregadas`);
        }
        campaigns.value = campaignsData;
        // Resetar para primeira página ao carregar dados
        currentPage.value = 1;
        
        // Carregar parceiros comerciais
        console.log(`[CampaignsView] Carregando parceiros comerciais...`);
        let partnersData = [];
        try {
            const partnersResponse = await client.commercialPartners.getAll();
            partnersData = partnersResponse.data || [];
            console.log(`[CampaignsView] ✅ ${partnersData.length} parceiros carregados via getAll`);
        } catch (error) {
            console.error(`[CampaignsView] ❌ Erro ao usar getAll de parceiros, tentando fallback:`, error);
            const fallbackResponse = await client.commercialPartners.get({ limit: '10000' });
            partnersData = fallbackResponse.data || [];
            console.log(`[CampaignsView] ✅ Fallback: ${partnersData.length} parceiros carregados`);
        }
        commercialPartners.value = partnersData;
        
        // Filtrar parceiros diretos
        directPartners.value = commercialPartners.value.filter(p => p.partnerType === 'Direto');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
    }
};

// Dialog de Campanha
const openAddDialog = async () => {
    isEditing.value = false;
    editingItem.value = null;
    campaignForm.value = {
        commercialPartnerId: '',
        name: '',
        startDate: '',
        endDate: '',
        script: '',
        scriptStatus: '',
        weighting: '',
        link: '',
        active: true,
        originalActive: true,
        neverStarted: false
    };
    formErrors.value = {};
    showCampaignDialog.value = true;
};

const closeCampaignDialog = () => {
    showCampaignDialog.value = false;
    formErrors.value = {};
    // Resetar formulário
    campaignForm.value = {
        commercialPartnerId: '',
        name: '',
        startDate: '',
        endDate: '',
        script: '',
        scriptStatus: '',
        weighting: '',
        link: '',
        active: true,
        originalActive: true,
        neverStarted: false
    };
};

const editItem = (item: any) => {
    if (item.type === 'partner') {
        // Editar parceiro direto
        editingItem.value = item;
        
        const startDate = item.startDate ? (typeof item.startDate === 'string' ? item.startDate.split('T')[0] : new Date(item.startDate).toISOString().split('T')[0]) : '';
        const endDate = item.endDate ? (typeof item.endDate === 'string' ? item.endDate.split('T')[0] : new Date(item.endDate).toISOString().split('T')[0]) : '';
        
        partnerForm.value = {
            name: item.name || '',
            startDate: startDate,
            endDate: endDate,
            script: item.script || '',
            scriptStatus: item.scriptStatus || '',
            weighting: item.weighting !== null && item.weighting !== undefined ? item.weighting.toString() : '',
            link: item.link || '',
            active: item.active !== undefined ? item.active : true
        };
        formErrors.value = {};
        showPartnerDialog.value = true;
    } else {
        // Editar campanha
        isEditing.value = true;
        editingItem.value = item;
        
        const startDate = item.startDate ? (typeof item.startDate === 'string' ? item.startDate.split('T')[0] : new Date(item.startDate).toISOString().split('T')[0]) : '';
        const endDate = item.endDate ? (typeof item.endDate === 'string' ? item.endDate.split('T')[0] : new Date(item.endDate).toISOString().split('T')[0]) : '';
        
        // Guardar o status original para restaurar se necessário
        const originalActive = item.active !== undefined ? item.active : true;
        
        campaignForm.value = {
            commercialPartnerId: item.commercialPartnerId || '',
            name: item.name || '',
            startDate: startDate,
            endDate: endDate || '',
            script: item.script || '',
            scriptStatus: item.scriptStatus || '',
            weighting: item.weighting !== null && item.weighting !== undefined ? item.weighting.toString() : '',
            link: item.link || '',
            active: originalActive,
            originalActive: originalActive, // Guardar para restaurar depois
            neverStarted: Boolean(item.neverStarted === true || item.neverStarted === 1 || item.neverStarted === '1')
        };
        formErrors.value = {};
        showCampaignDialog.value = true;
    }
};

const saveCampaign = async () => {
    if (!validateCampaignName() || !validateCampaignDates() || !validateWeighting()) {
        return;
    }
    
    if (!campaignForm.value.commercialPartnerId) {
        formErrors.value.commercialPartnerId = 'Selecione um parceiro';
        return;
    }
    
    saving.value = true;
    formErrors.value = {};
    
    try {
        const dataToSave: any = {
            commercialPartnerId: campaignForm.value.commercialPartnerId,
            name: campaignForm.value.name.trim(),
            startDate: campaignForm.value.startDate,
            active: campaignForm.value.active !== undefined ? campaignForm.value.active : true
        };
        
        // sellerDomain foi removido da interface, não enviar o campo (será mantido o valor existente no banco)
        
        // Tratar data de fim - se estiver vazia, enviar null para limpar
        if (campaignForm.value.endDate && campaignForm.value.endDate.trim() !== '') {
            dataToSave.endDate = campaignForm.value.endDate;
        } else {
            // Se a data de fim foi limpa, enviar null explicitamente
            dataToSave.endDate = null;
            // E garantir que a campanha volte para ativa
            dataToSave.active = true;
        }
        
        if (campaignForm.value.script && campaignForm.value.script.trim()) {
            dataToSave.script = campaignForm.value.script.trim();
        }
        
        if (campaignForm.value.scriptStatus) {
            dataToSave.scriptStatus = campaignForm.value.scriptStatus;
        }
        
        if (campaignForm.value.weighting && campaignForm.value.weighting !== '') {
            dataToSave.weighting = parseFloat(campaignForm.value.weighting);
        }
        
        if (campaignForm.value.link && campaignForm.value.link.trim()) {
            dataToSave.link = campaignForm.value.link.trim();
        }
        
        // Adicionar campo neverStarted (Campanha não iniciada - Pendência)
        // SEMPRE enviar explicitamente como boolean, mesmo quando false
        // Isso é crítico porque alguns sistemas ignoram campos false durante updates
        const neverStartedValue = campaignForm.value.neverStarted;
        // Converter explicitamente para boolean (true ou false)
        dataToSave.neverStarted = Boolean(neverStartedValue === true || neverStartedValue === 'true' || neverStartedValue === 1 || neverStartedValue === '1');
        
        // Garantir que o campo seja sempre incluído no objeto, mesmo quando false
        // Não usar condicionais que possam omitir o campo
        console.log('[CampaignsView] Salvando campanha:');
        console.log('  - neverStarted no form:', neverStartedValue, 'tipo:', typeof neverStartedValue);
        console.log('  - neverStarted a ser enviado:', dataToSave.neverStarted, 'tipo:', typeof dataToSave.neverStarted);
        console.log('  - dados completos:', JSON.stringify(dataToSave, null, 2));
        
        if (isEditing.value && editingItem.value) {
            console.log('[CampaignsView] Atualizando campanha:', editingItem.value.id, 'dados:', dataToSave);
            await client.campaigns.update(editingItem.value.id, dataToSave);
        } else {
            console.log('[CampaignsView] Criando nova campanha com dados:', dataToSave);
            await client.campaigns.insert(dataToSave);
        }
        
        await loadData();
        closeCampaignDialog();
    } catch (error: any) {
        console.error('Erro ao salvar campanha:', error);
        alert('Erro ao salvar campanha. Verifique o console para mais detalhes.');
    } finally {
        saving.value = false;
    }
};

// Dialog de Parceiro
const closePartnerDialog = () => {
    showPartnerDialog.value = false;
    formErrors.value = {};
};

const savePartner = async () => {
    if (!validateWeighting() || !validatePartnerDates()) {
        return;
    }
    
    saving.value = true;
    formErrors.value = {};
    
    try {
        // Verificar se a data de fim já passou para desativar automaticamente
        let shouldBeActive = partnerForm.value.active;
        if (partnerForm.value.endDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(partnerForm.value.endDate);
            endDate.setHours(0, 0, 0, 0);
            
            // Se a data de fim já passou, desativar automaticamente
            if (today > endDate) {
                shouldBeActive = false;
            }
        }
        
        const dataToSave: any = {
            name: partnerForm.value.name.trim(),
            active: shouldBeActive
        };
        
        if (partnerForm.value.startDate && partnerForm.value.startDate.trim() !== '') {
            dataToSave.startDate = new Date(partnerForm.value.startDate);
        }
        
        // Tratar data de fim - se estiver vazia, enviar null para limpar
        if (partnerForm.value.endDate && partnerForm.value.endDate.trim() !== '') {
            dataToSave.endDate = new Date(partnerForm.value.endDate);
        } else {
            dataToSave.endDate = null;
            // Se a data de fim foi limpa, garantir que volte para ativo
            dataToSave.active = true;
        }
        
        if (partnerForm.value.script && partnerForm.value.script.trim()) {
            dataToSave.script = partnerForm.value.script.trim();
        }
        
        if (partnerForm.value.scriptStatus) {
            dataToSave.scriptStatus = partnerForm.value.scriptStatus;
        }
        
        if (partnerForm.value.weighting && partnerForm.value.weighting !== '') {
            dataToSave.weighting = parseFloat(partnerForm.value.weighting);
        }
        
        if (partnerForm.value.link && partnerForm.value.link.trim()) {
            dataToSave.link = partnerForm.value.link.trim();
        }
        
        if (editingItem.value) {
            await client.commercialPartners.update(editingItem.value.id, dataToSave);
        }
        
        await loadData();
        closePartnerDialog();
    } catch (error: any) {
        console.error('Erro ao salvar parceiro:', error);
        alert('Erro ao salvar parceiro. Verifique o console para mais detalhes.');
    } finally {
        saving.value = false;
    }
};

// Validação de links
const validateAllLinks = async () => {
    if (validatingAllLinks.value) return;
    
    if (!confirm('Deseja validar os links de todas as campanhas que possuem links cadastrados (ativas e inativas)? Isso pode levar alguns minutos.')) {
        return;
    }
    
    validatingAllLinks.value = true;
    
    try {
        const [campaignsResult, partnersResult] = await Promise.all([
            client.campaigns.validateLinks(),
            client.commercialPartners.validateLinks()
        ]);

        console.log('Resultado da validação de campanhas:', campaignsResult);
        console.log('Resultado da validação de parceiros diretos:', partnersResult);
        
        // Recarregar dados para atualizar os status
        await loadData();

        const total = (campaignsResult?.total || 0) + (partnersResult?.total || 0);
        const ok = (campaignsResult?.ok || 0) + (partnersResult?.ok || 0);
        const broken = (campaignsResult?.broken || 0) + (partnersResult?.broken || 0);
        
        alert(`Validação concluída!\nTotal: ${total}\nOK: ${ok}\nQuebrados: ${broken}`);
    } catch (error: any) {
        console.error('Erro ao validar links:', error);
        alert('Erro ao validar links. Verifique o console para mais detalhes.');
    } finally {
        validatingAllLinks.value = false;
    }
};

const validateLink = async (item: any) => {
    if (!item || !item.id) return;

    const id = item.id as string;

    if (validatingLinks.value[id]) return;
    
    validatingLinks.value[id] = true;
    
    try {
        let result: any = null;

        if (item.type === 'campaign') {
            result = await client.campaigns.validateLink(id);
        } else if (item.type === 'partner') {
            result = await client.commercialPartners.validateLink(id);
        } else {
            return;
        }

        console.log('Resultado da validação:', result);
        
        // Recarregar dados para atualizar o status
        await loadData();
        
        const status = result?.linkStatus === 'OK'
            ? 'Link Ok'
            : result?.linkStatus === 'Quebrado'
                ? 'Link Quebrado'
                : 'Não validado';

        alert(`Link validado: ${status}`);
    } catch (error: any) {
        console.error('Erro ao validar link:', error);
        alert('Erro ao validar link. Verifique o console para mais detalhes.');
    } finally {
        validatingLinks.value[id] = false;
    }
};

// Resetar página quando filtros mudarem
watch([() => filters.value.search, () => filters.value.partner], () => {
    currentPage.value = 1;
});

onMounted(() => {
    loadData();
});
</script>
