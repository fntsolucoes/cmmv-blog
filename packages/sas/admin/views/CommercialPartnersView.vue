<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h1 class="text-2xl font-bold text-white">Parceiros Comerciais</h1>
            <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar Parceiro
            </button>
        </div>

        <!-- Busca por Nome -->
        <div class="bg-neutral-800 rounded-lg p-4">
            <div class="flex items-center gap-4">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Buscar por Nome</label>
                    <input
                        v-model="searchName"
                        type="text"
                        placeholder="Digite o nome do parceiro..."
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div class="flex items-end">
                    <button
                        @click="clearSearch"
                        class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Limpar
                    </button>
                </div>
            </div>
        </div>

        <!-- Tabela de Parceiros Comerciais -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Tipo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Rede de Afiliação</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Empresa de Recebimento</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Moeda Padrão</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Campanhas Ativas</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Campanhas Inativas</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="paginatedItems.length === 0">
                        <td colspan="9" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhum parceiro comercial cadastrado
                        </td>
                    </tr>
                    <tr v-for="item in paginatedItems" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.name }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.partnerType }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                            {{ item.affiliateNetworkId ? getAffiliateNetworkName(item.affiliateNetworkId) : '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ getCostCenterName(item.costCenterId) }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.defaultCurrency }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="item.active ? 'bg-green-500' : 'bg-red-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                {{ item.active ? 'Ativo' : 'Inativo' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                            <span class="bg-green-600 px-2 py-1 rounded text-xs font-medium">
                                {{ getActiveCampaignsCount(item) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                            <span class="bg-red-600 px-2 py-1 rounded text-xs font-medium">
                                {{ getInactiveCampaignsCount(item) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex items-center gap-2">
                                <button 
                                    @click="viewPaymentOrders(item.id)" 
                                    class="text-blue-400 hover:text-blue-300 p-1.5 rounded transition-colors"
                                    title="Histórico"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
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

        <!-- Modal de Cadastro/Edição -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center sticky top-0 bg-neutral-800 z-10">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Parceiro Comercial' : 'Adicionar Parceiro Comercial' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="savePartner" class="p-6 space-y-4">
                    <!-- Nome do Parceiro Comercial -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome do Parceiro Comercial <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Nome do parceiro"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.name }"
                            required
                        />
                        <p v-if="formErrors.name" class="mt-1 text-sm text-red-400">{{ formErrors.name }}</p>
                    </div>

                    <!-- Tipo de Parceiro -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Tipo de Parceiro <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="form.partnerType"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.partnerType }"
                            required
                            @change="onPartnerTypeChange"
                        >
                            <option value="">Selecione uma opção</option>
                            <option value="Rede de Afiliação">Rede de Afiliação</option>
                            <option value="Direto">Direto</option>
                        </select>
                        <p v-if="formErrors.partnerType" class="mt-1 text-sm text-red-400">{{ formErrors.partnerType }}</p>
                    </div>

                    <!-- Rede de Afiliação (apenas quando tipo = "Rede de Afiliação") -->
                    <div v-if="form.partnerType === 'Rede de Afiliação'">
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Rede de Afiliação
                        </label>
                        <div v-if="loadingAffiliateNetworks" class="flex items-center py-2">
                            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                            <span class="ml-2 text-neutral-400 text-sm">Carregando redes de afiliação...</span>
                        </div>
                        <select
                            v-else
                            v-model="form.affiliateNetworkId"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.affiliateNetworkId }"
                        >
                            <option value="">Selecione uma rede de afiliação (opcional)</option>
                            <option
                                v-for="network in affiliateNetworks"
                                :key="network.id"
                                :value="network.id"
                            >
                                {{ network.name }}
                            </option>
                        </select>
                        <p v-if="formErrors.affiliateNetworkId" class="mt-1 text-sm text-red-400">{{ formErrors.affiliateNetworkId }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Selecione a rede de afiliação vinculada a este parceiro</p>
                    </div>

                    <!-- Empresa de Recebimento -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Empresa de Recebimento <span class="text-red-500">*</span>
                        </label>
                        <div v-if="loadingCostCenters" class="flex items-center py-2">
                            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                            <span class="ml-2 text-neutral-400 text-sm">Carregando centros de custos...</span>
                        </div>
                        <select
                            v-else
                            v-model="form.costCenterId"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.costCenterId }"
                            required
                        >
                            <option value="">Selecione uma empresa</option>
                            <option
                                v-for="costCenter in costCenters"
                                :key="costCenter.id"
                                :value="costCenter.id"
                            >
                                {{ costCenter.name }} ({{ formatIdentifier(costCenter.identifier) }})
                            </option>
                        </select>
                        <p v-if="formErrors.costCenterId" class="mt-1 text-sm text-red-400">{{ formErrors.costCenterId }}</p>
                        <p v-if="costCenters.length === 0 && !loadingCostCenters" class="mt-1 text-xs text-yellow-400">
                            Nenhum centro de custo cadastrado. Cadastre um centro de custo primeiro.
                        </p>
                    </div>

                    <!-- Moeda de Pagamento Padrão -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Moeda de Pagamento Padrão <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="form.defaultCurrency"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.defaultCurrency }"
                            required
                        >
                            <option value="">Selecione uma moeda</option>
                            <option value="USD">Dólar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                            <option value="BRL">Real (BRL)</option>
                            <option value="Outra">Outra</option>
                        </select>
                        <p v-if="formErrors.defaultCurrency" class="mt-1 text-sm text-red-400">{{ formErrors.defaultCurrency }}</p>
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
                            Parceiro ativo
                        </label>
                    </div>

                    <!-- Anotações (Login, Senha, Link do Dashboard) -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Anotações
                        </label>
                        <textarea
                            v-model="form.notes"
                            rows="4"
                            placeholder="Login, senha, link do dashboard, etc..."
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        ></textarea>
                        <p class="mt-1 text-xs text-neutral-400">
                            Use este campo para armazenar informações como login, senha e link do dashboard do parceiro.
                        </p>
                    </div>

                    <!-- Seção de Campanhas (apenas para Rede de Afiliação) -->
                    <div v-if="form.partnerType === 'Rede de Afiliação'" class="pt-4 border-t border-neutral-700">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-md font-medium text-white">Campanhas</h4>
                            <button
                                type="button"
                                @click="openCampaignDialog()"
                                class="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Adicionar Campanha
                            </button>
                        </div>

                        <div v-if="form.campaigns.length === 0" class="text-sm text-neutral-400 italic mb-2">
                            Nenhuma campanha cadastrada. Clique em "Adicionar Campanha" para começar.
                        </div>

                        <div v-for="(campaign, index) in form.campaigns" :key="index" class="mb-3 p-3 bg-neutral-700 rounded-lg border border-neutral-600">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-white">{{ campaign.name }}</p>
                                    <p class="text-xs text-neutral-400">
                                        {{ formatDate(campaign.startDate) }}
                                        <span v-if="campaign.endDate"> - {{ formatDate(campaign.endDate) }}</span>
                                        <span v-else class="text-green-400"> (Em andamento)</span>
                                    </p>
                                    <div class="flex flex-wrap gap-2 mt-1">
                                        <span v-if="campaign.scriptStatus" :class="getScriptStatusClass(campaign.scriptStatus)" class="px-2 py-0.5 text-xs rounded">
                                            {{ campaign.scriptStatus }}
                                        </span>
                                        <span v-if="campaign.weighting" class="px-2 py-0.5 bg-purple-600 text-white text-xs rounded">
                                            Ponderação: {{ campaign.weighting }}%
                                        </span>
                                        <span :class="getCampaignStatusClass(campaign)" class="px-2 py-0.5 text-xs rounded">
                                            {{ getCampaignStatus(campaign) }}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button
                                        type="button"
                                        @click="openCampaignDialog(index)"
                                        class="text-blue-400 hover:text-blue-300"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        @click="removeCampaign(index)"
                                        class="text-red-400 hover:text-red-300"
                                        title="Remover"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
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

        <!-- Modal de Campanha -->
        <div v-if="showCampaignDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center sticky top-0 bg-neutral-800 z-10">
                    <h3 class="text-lg font-medium text-white">{{ editingCampaignIndex !== null ? 'Editar Campanha' : 'Adicionar Campanha' }}</h3>
                    <button @click="closeCampaignDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="saveCampaign" class="p-6 space-y-4">
                    <!-- Nome da Campanha -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome da Campanha <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="campaignForm.name"
                            type="text"
                            placeholder="Nome da campanha (2-255 caracteres)"
                            maxlength="255"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': campaignErrors.name }"
                            @input="validateCampaignName"
                            required
                        />
                        <p v-if="campaignErrors.name" class="mt-1 text-sm text-red-400">{{ campaignErrors.name }}</p>
                        <p class="mt-1 text-xs text-neutral-400">{{ campaignForm.name.length }}/255 caracteres</p>
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
                            :class="{ 'border-red-500': campaignErrors.startDate }"
                            required
                            @change="validateCampaignDates"
                        />
                        <p v-if="campaignErrors.startDate" class="mt-1 text-sm text-red-400">{{ campaignErrors.startDate }}</p>
                    </div>

                    <!-- Data de Fim -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Data de Fim (opcional)
                        </label>
                        <input
                            v-model="campaignForm.endDate"
                            type="date"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': campaignErrors.endDate }"
                            @change="validateCampaignDates"
                        />
                        <p v-if="campaignErrors.endDate" class="mt-1 text-sm text-red-400">{{ campaignErrors.endDate }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Deixe em branco se a campanha estiver em andamento indefinidamente</p>
                    </div>

                    <!-- Script -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Script
                        </label>
                        <textarea
                            v-model="campaignForm.script"
                            rows="6"
                            placeholder="Código do script da campanha"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                        ></textarea>
                        <p class="mt-1 text-xs text-neutral-400">Código do script da campanha (opcional)</p>
                    </div>

                    <!-- Status do Script -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Status do Script
                        </label>
                        <select
                            v-model="campaignForm.scriptStatus"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecione uma opção</option>
                            <option value="Implementado">Implementado</option>
                            <option value="Caiu">Caiu</option>
                            <option value="Pendente de instalar">Pendente de instalar</option>
                        </select>
                        <p class="mt-1 text-xs text-neutral-400">Status atual do script (opcional)</p>
                    </div>

                    <!-- Ponderação -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Ponderação (%)
                        </label>
                        <input
                            v-model="campaignForm.weighting"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="Ex: 15.50"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': campaignErrors.weighting }"
                            @input="validateWeighting"
                        />
                        <p v-if="campaignErrors.weighting" class="mt-1 text-sm text-red-400">{{ campaignErrors.weighting }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Porcentagem da campanha (até 2 casas decimais, opcional)</p>
                    </div>

                    <!-- Link -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Link
                        </label>
                        <input
                            v-model="campaignForm.link"
                            type="url"
                            placeholder="https://exemplo.com/campanha"
                            maxlength="500"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': campaignErrors.link }"
                        />
                        <p v-if="campaignErrors.link" class="mt-1 text-sm text-red-400">{{ campaignErrors.link }}</p>
                        <p class="mt-1 text-xs text-neutral-400">{{ campaignForm.link?.length || 0 }}/500 caracteres</p>
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
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSasClient } from '../client';
// @ts-ignore
import { useAffiliateClient } from '@cmmv/affiliate/admin/client';

const router = useRouter();
const client = useSasClient();
const affiliateClient = useAffiliateClient();
const items = ref<any[]>([]);
const costCenters = ref<any[]>([]);
const affiliateNetworks = ref<any[]>([]);
const campaignsByPartner = ref<Record<string, any[]>>({});
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const loadingCostCenters = ref(false);
const loadingAffiliateNetworks = ref(false);
const editingItem = ref<any>(null);
const formErrors = ref<Record<string, string>>({});

// Busca
const searchName = ref('');

// Filtrar items por nome
const filteredItems = computed(() => {
    if (!searchName.value.trim()) {
        return items.value;
    }
    const searchLower = searchName.value.toLowerCase().trim();
    return items.value.filter((item: any) => 
        item.name?.toLowerCase().includes(searchLower)
    );
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

// Limpar busca
const clearSearch = () => {
    searchName.value = '';
    currentPage.value = 1;
};

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

const showCampaignDialog = ref(false);
const editingCampaignIndex = ref<number | null>(null);
const campaignErrors = ref<Record<string, string>>({});
const campaignForm = ref({
    name: '',
    startDate: '',
    endDate: '',
    script: '',
    scriptStatus: '',
    weighting: '',
    link: '',
    neverStarted: false
});

const form = ref({
    name: '',
    partnerType: '',
    affiliateNetworkId: '',
    costCenterId: '',
    defaultCurrency: '',
    active: true,
    notes: '',
        campaigns: [] as Array<{
        id?: string;
        name: string;
        startDate: string;
        endDate?: string;
        script?: string;
        scriptStatus?: string;
        weighting?: number;
        link?: string;
        active?: boolean;
        neverStarted?: boolean;
        }>
});

// Função para formatar CNPJ ou CPF
const formatIdentifier = (identifier: string): string => {
    if (!identifier) return '';
    const numbers = identifier.replace(/\D/g, '');
    
    if (numbers.length === 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return identifier;
};

// Função para formatar data
const formatDate = (date: string | Date): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
};

// Função para validar caracteres orientais
const hasOrientalCharacters = (text: string): boolean => {
    // Regex para detectar caracteres orientais (chinês, japonês, coreano, etc.)
    const orientalRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\uAC00-\uD7AF]/;
    return orientalRegex.test(text);
};

// Função para validar nome da campanha
const validateCampaignName = () => {
    campaignErrors.value.name = '';
    const name = campaignForm.value.name.trim();
    
    if (name.length < 2) {
        campaignErrors.value.name = 'Nome deve ter no mínimo 2 caracteres';
        return false;
    }
    
    if (name.length > 255) {
        campaignErrors.value.name = 'Nome deve ter no máximo 255 caracteres';
        return false;
    }
    
    if (hasOrientalCharacters(name)) {
        campaignErrors.value.name = 'Nome não pode conter caracteres orientais';
        return false;
    }
    
    return true;
};

// Função para validar datas
const validateCampaignDates = () => {
    campaignErrors.value.startDate = '';
    campaignErrors.value.endDate = '';
    
    if (!campaignForm.value.startDate) {
        return true; // Validação de obrigatório é feita pelo HTML
    }
    
    if (campaignForm.value.endDate) {
        const startDate = new Date(campaignForm.value.startDate);
        const endDate = new Date(campaignForm.value.endDate);
        
        if (endDate < startDate) {
            campaignErrors.value.endDate = 'Data de fim não pode ser anterior à data de início';
            return false;
        }
    }
    
    return true;
};

// Função para validar ponderação
const validateWeighting = () => {
    campaignErrors.value.weighting = '';
    
    if (!campaignForm.value.weighting || campaignForm.value.weighting === '') {
        return true; // Opcional
    }
    
    const weighting = parseFloat(campaignForm.value.weighting);
    
    if (isNaN(weighting)) {
        campaignErrors.value.weighting = 'Ponderação deve ser um número válido';
        return false;
    }
    
    if (weighting < 0 || weighting > 100) {
        campaignErrors.value.weighting = 'Ponderação deve estar entre 0 e 100';
        return false;
    }
    
    // Verificar casas decimais
    const parts = campaignForm.value.weighting.toString().split('.');
    if (parts[1] && parts[1].length > 2) {
        campaignErrors.value.weighting = 'Ponderação deve ter no máximo 2 casas decimais';
        return false;
    }
    
    return true;
};


// Função para obter status da campanha
const getCampaignStatus = (campaign: any): string => {
    if (!campaign.active) return 'Inativa';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(campaign.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    if (campaign.endDate) {
        const endDate = new Date(campaign.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        if (today < startDate) return 'Agendada';
        if (today > endDate) return 'Encerrada';
        return 'Ativa';
    }
    
    if (today < startDate) return 'Agendada';
    return 'Ativa';
};

// Função para obter classe CSS do status
const getCampaignStatusClass = (campaign: any): string => {
    const status = getCampaignStatus(campaign);
    if (status === 'Ativa') return 'bg-green-600 text-white';
    if (status === 'Encerrada') return 'bg-gray-600 text-white';
    if (status === 'Agendada') return 'bg-blue-600 text-white';
    return 'bg-red-600 text-white';
};

// Função para obter classe CSS do status do script
const getScriptStatusClass = (status: string): string => {
    if (status === 'Implementado') return 'bg-green-600 text-white';
    if (status === 'Caiu') return 'bg-red-600 text-white';
    if (status === 'Pendente de instalar') return 'bg-yellow-600 text-white';
    return 'bg-gray-600 text-white';
};

// Obter nome do centro de custo
const getCostCenterName = (costCenterId: string): string => {
    const costCenter = costCenters.value.find(cc => cc.id === costCenterId);
    return costCenter ? costCenter.name : 'N/A';
};

// Obter nome da rede de afiliação
const getAffiliateNetworkName = (networkId: string): string => {
    const network = affiliateNetworks.value.find(n => n.id === networkId);
    return network ? network.name : 'N/A';
};

// Carregar redes de afiliação
const loadAffiliateNetworks = async () => {
    loadingAffiliateNetworks.value = true;
    try {
        const response = await affiliateClient.networks.get({});
        affiliateNetworks.value = response.data || [];
    } catch (error) {
        console.error('Erro ao carregar redes de afiliação:', error);
    } finally {
        loadingAffiliateNetworks.value = false;
    }
};

// Obter contagem de campanhas ativas
const getActiveCampaignsCount = (item: any): number => {
    if (item.partnerType === 'Rede de Afiliação') {
        const campaigns = campaignsByPartner.value[item.id] || [];
        return campaigns.filter((c: any) => c.active === true).length;
    } else if (item.partnerType === 'Direto') {
        // Para tipo Direto: se o parceiro estiver ativo, 1 ativa; se inativo, 0 ativa
        return item.active ? 1 : 0;
    }
    return 0;
};

// Obter contagem de campanhas inativas
const getInactiveCampaignsCount = (item: any): number => {
    if (item.partnerType === 'Rede de Afiliação') {
        const campaigns = campaignsByPartner.value[item.id] || [];
        return campaigns.filter((c: any) => c.active === false).length;
    } else if (item.partnerType === 'Direto') {
        // Para tipo Direto: se o parceiro estiver ativo, 0 inativa; se inativo, 1 inativa
        return item.active ? 0 : 1;
    }
    return 0;
};

// Carregar centros de custos
const loadCostCenters = async () => {
    loadingCostCenters.value = true;
    try {
        const response = await client.costCenters.get({});
        costCenters.value = response.data || [];
    } catch (error) {
        console.error('Erro ao carregar centros de custos:', error);
    } finally {
        loadingCostCenters.value = false;
    }
};

// Carregar campanhas do parceiro
const loadCampaigns = async (partnerId: string) => {
    try {
        console.log(`[CommercialPartnersView] Carregando campanhas para parceiro ${partnerId}`);
        // Usar endpoint customizado que retorna todas as campanhas sem limite
        const response = await client.campaigns.getAllByPartner(partnerId);
        const campaigns = response.data || [];
        console.log(`[CommercialPartnersView] ✅ ${campaigns.length} campanhas carregadas para parceiro ${partnerId}`);
        return campaigns;
    } catch (error) {
        console.error(`[CommercialPartnersView] ❌ Erro ao carregar campanhas do parceiro ${partnerId}:`, error);
        // Fallback para o endpoint padrão se o customizado falhar
        try {
            console.log(`[CommercialPartnersView] Tentando fallback para parceiro ${partnerId}...`);
            const fallbackResponse = await client.campaigns.get({ commercialPartnerId: partnerId, limit: '10000' });
            const fallbackCampaigns = fallbackResponse.data || [];
            console.log(`[CommercialPartnersView] ✅ Fallback: ${fallbackCampaigns.length} campanhas carregadas`);
            return fallbackCampaigns;
        } catch (fallbackError) {
            console.error(`[CommercialPartnersView] ❌ Erro no fallback ao carregar campanhas do parceiro ${partnerId}:`, fallbackError);
            return [];
        }
    }
};

// Carregar dados
const loadData = async () => {
    try {
        console.log(`[CommercialPartnersView] Carregando parceiros comerciais...`);
        // Usar endpoint customizado que retorna todos os parceiros sem limite
        let partners = [];
        try {
            const response = await client.commercialPartners.getAll();
            partners = response.data || [];
            console.log(`[CommercialPartnersView] ✅ ${partners.length} parceiros carregados via getAll`);
        } catch (error) {
            console.error(`[CommercialPartnersView] ❌ Erro ao usar getAll, tentando fallback:`, error);
            // Fallback para o endpoint padrão se o customizado falhar
            const fallbackResponse = await client.commercialPartners.get({ limit: '10000' });
            partners = fallbackResponse.data || [];
            console.log(`[CommercialPartnersView] ✅ Fallback: ${partners.length} parceiros carregados`);
        }
        items.value = partners;
        // Resetar para primeira página ao carregar dados
        currentPage.value = 1;
        // Limpar busca ao recarregar
        searchName.value = '';
        
        // Carregar campanhas para cada parceiro do tipo "Rede de Afiliação"
        campaignsByPartner.value = {};
        for (const partner of items.value) {
            if (partner.partnerType === 'Rede de Afiliação') {
                try {
                    // Usar endpoint customizado que retorna todas as campanhas sem limite
                    const campaignsResponse = await client.campaigns.getAllByPartner(partner.id);
                    campaignsByPartner.value[partner.id] = campaignsResponse.data || [];
                } catch (error) {
                    console.error(`Erro ao carregar campanhas do parceiro ${partner.id}:`, error);
                    // Fallback para o endpoint padrão se o customizado falhar
                    try {
                        const fallbackResponse = await client.campaigns.get({ commercialPartnerId: partner.id, limit: '10000' });
                        campaignsByPartner.value[partner.id] = fallbackResponse.data || [];
                    } catch (fallbackError) {
                        console.error(`Erro no fallback ao carregar campanhas do parceiro ${partner.id}:`, fallbackError);
                        campaignsByPartner.value[partner.id] = [];
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar parceiros comerciais. Verifique o console para mais detalhes.');
    }
};

// Quando o tipo de parceiro muda
const onPartnerTypeChange = () => {
    if (form.value.partnerType !== 'Rede de Afiliação') {
        form.value.campaigns = [];
    }
};

// Abrir dialog de adicionar
const openAddDialog = async () => {
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        name: '',
        partnerType: '',
        affiliateNetworkId: '',
        costCenterId: '',
        defaultCurrency: '',
        active: true,
        notes: '',
        campaigns: []
    };
    formErrors.value = {};
    await loadCostCenters();
    await loadAffiliateNetworks();
    showDialog.value = true;
};

// Editar item
const editItem = async (item: any) => {
    isEditing.value = true;
    editingItem.value = item;
    
    await loadCostCenters();
    
    // Carregar campanhas se for Rede de Afiliação
    let campaigns = [];
    if (item.partnerType === 'Rede de Afiliação') {
        campaigns = await loadCampaigns(item.id);
        console.log(`[CommercialPartnersView] editItem: ${campaigns.length} campanhas carregadas para edição`);
    }
    
    const mappedCampaigns = campaigns
        .map((c: any) => ({
            id: c.id,
            name: c.name,
            startDate: c.startDate ? (typeof c.startDate === 'string' ? c.startDate : c.startDate.split('T')[0]) : '',
            endDate: c.endDate ? (typeof c.endDate === 'string' ? c.endDate : c.endDate.split('T')[0]) : undefined,
            script: c.script || '',
            scriptStatus: c.scriptStatus || '',
            weighting: c.weighting || undefined,
            link: c.link || '',
            active: c.active !== undefined ? c.active : true,
            neverStarted: Boolean(c.neverStarted === true || c.neverStarted === 1 || c.neverStarted === '1')
        }))
        .sort((a, b) => {
            // Ordenar por data de início (mais recentes primeiro)
            const dateA = new Date(a.startDate).getTime();
            const dateB = new Date(b.startDate).getTime();
            return dateB - dateA;
        });
    
    console.log(`[CommercialPartnersView] editItem: ${mappedCampaigns.length} campanhas mapeadas e ordenadas`);
    
    form.value = {
        name: item.name || '',
        partnerType: item.partnerType || '',
        affiliateNetworkId: item.affiliateNetworkId || '',
        costCenterId: item.costCenterId || '',
        defaultCurrency: item.defaultCurrency || '',
        active: item.active !== undefined ? item.active : true,
        notes: item.notes || '',
        campaigns: mappedCampaigns
    };
    formErrors.value = {};
    await loadAffiliateNetworks();
    showDialog.value = true;
};

// Fechar dialog
const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        name: '',
        partnerType: '',
        affiliateNetworkId: '',
        costCenterId: '',
        defaultCurrency: '',
        active: true,
        notes: '',
        campaigns: []
    };
    formErrors.value = {};
};

// Abrir dialog de campanha
const openCampaignDialog = (index: number | null = null) => {
    editingCampaignIndex.value = index;
    campaignErrors.value = {};
    
    if (index !== null && form.value.campaigns[index]) {
        const campaign = form.value.campaigns[index];
        campaignForm.value = {
            name: campaign.name || '',
            startDate: campaign.startDate || '',
            endDate: campaign.endDate || '',
            script: campaign.script || '',
            scriptStatus: campaign.scriptStatus || '',
            weighting: campaign.weighting?.toString() || '',
            link: campaign.link || '',
            neverStarted: Boolean(campaign.neverStarted === true || campaign.neverStarted === 1 || campaign.neverStarted === '1')
        };
    } else {
        campaignForm.value = {
            name: '',
            startDate: '',
            endDate: '',
            script: '',
            scriptStatus: '',
            weighting: '',
            link: '',
            neverStarted: false
        };
    }
    showCampaignDialog.value = true;
};

// Fechar dialog de campanha
const closeCampaignDialog = () => {
    showCampaignDialog.value = false;
    editingCampaignIndex.value = null;
    campaignErrors.value = {};
    campaignForm.value = {
        name: '',
        startDate: '',
        endDate: '',
        script: '',
        scriptStatus: '',
        weighting: '',
        link: '',
        neverStarted: false
    };
};

// Salvar campanha
const saveCampaign = () => {
    campaignErrors.value = {};
    
    // Validações
    if (!validateCampaignName()) {
        return;
    }
    
    if (!validateCampaignDates()) {
        return;
    }
    
    if (campaignForm.value.weighting && !validateWeighting()) {
        return;
    }
    
    // Validar link
    if (campaignForm.value.link && campaignForm.value.link.length > 500) {
        campaignErrors.value.link = 'Link deve ter no máximo 500 caracteres';
        return;
    }
    
    const campaign: any = {
        name: campaignForm.value.name.trim(),
        startDate: campaignForm.value.startDate,
        endDate: campaignForm.value.endDate.trim() || undefined,
        script: campaignForm.value.script.trim() || null,
        scriptStatus: campaignForm.value.scriptStatus || null,
        weighting: campaignForm.value.weighting ? parseFloat(campaignForm.value.weighting) : null,
        link: campaignForm.value.link.trim() || null,
        active: true,
        neverStarted: campaignForm.value.neverStarted !== undefined ? Boolean(campaignForm.value.neverStarted) : false
    };

    console.log('[CommercialPartnersView] Salvando campanha no formulário:', campaign);

    if (editingCampaignIndex.value !== null) {
        // Preservar ID se estiver editando
        if (form.value.campaigns[editingCampaignIndex.value].id) {
            campaign.id = form.value.campaigns[editingCampaignIndex.value].id;
        }
        form.value.campaigns[editingCampaignIndex.value] = campaign;
        console.log('[CommercialPartnersView] Campanha atualizada no array:', form.value.campaigns[editingCampaignIndex.value]);
    } else {
        form.value.campaigns.push(campaign);
        console.log('[CommercialPartnersView] Campanha adicionada ao array. Total:', form.value.campaigns.length);
    }

    closeCampaignDialog();
};

// Remover campanha
const removeCampaign = (index: number) => {
    form.value.campaigns.splice(index, 1);
};

// Salvar parceiro comercial
const savePartner = async () => {
    formErrors.value = {};

    // Validações
    if (!form.value.name || form.value.name.trim() === '') {
        formErrors.value.name = 'Nome é obrigatório';
    }

    if (!form.value.partnerType) {
        formErrors.value.partnerType = 'Tipo de parceiro é obrigatório';
    }

    if (!form.value.costCenterId) {
        formErrors.value.costCenterId = 'Empresa de recebimento é obrigatória';
    }

    if (!form.value.defaultCurrency) {
        formErrors.value.defaultCurrency = 'Moeda de pagamento padrão é obrigatória';
    }

    if (Object.keys(formErrors.value).length > 0) {
        return;
    }

    saving.value = true;

    try {
        const data = {
            name: form.value.name.trim(),
            partnerType: form.value.partnerType,
            affiliateNetworkId: form.value.affiliateNetworkId || null,
            costCenterId: form.value.costCenterId,
            notes: form.value.notes || null,
            defaultCurrency: form.value.defaultCurrency,
            active: form.value.active
        };

        let partnerId: string;
        if (isEditing.value && editingItem.value) {
            await client.commercialPartners.update(editingItem.value.id, data);
            partnerId = editingItem.value.id;
        } else {
            const response = await client.commercialPartners.insert(data);
            partnerId = response.data?.id || response.id;
        }

        // Salvar campanhas se for Rede de Afiliação
        if (form.value.partnerType === 'Rede de Afiliação' && form.value.campaigns.length > 0) {
            // Primeiro, buscar campanhas existentes para deletar as que foram removidas
            if (isEditing.value) {
                const existingCampaigns = await loadCampaigns(partnerId);
                const existingIds = existingCampaigns.map((c: any) => c.id);
                
                // Deletar campanhas que não estão mais na lista
                for (const existingCampaign of existingCampaigns) {
                    const stillExists = form.value.campaigns.some((c: any) => c.id === existingCampaign.id);
                    if (!stillExists) {
                        await client.campaigns.delete(existingCampaign.id);
                    }
                }
            }

            // Salvar/atualizar campanhas
            for (const campaign of form.value.campaigns) {
                const campaignData: any = {
                    commercialPartnerId: partnerId,
                    name: campaign.name,
                    startDate: new Date(campaign.startDate),
                    endDate: campaign.endDate ? new Date(campaign.endDate) : null,
                    script: campaign.script || null,
                    scriptStatus: campaign.scriptStatus || null,
                    weighting: campaign.weighting || null,
                    link: campaign.link || null,
                    active: campaign.active !== undefined ? campaign.active : true,
                    neverStarted: campaign.neverStarted !== undefined ? Boolean(campaign.neverStarted) : false
                };
                
                try {
                    if (campaign.id) {
                        // Atualizar campanha existente
                        console.log(`[CommercialPartnersView] Atualizando campanha ${campaign.id}:`, campaignData);
                        await client.campaigns.update(campaign.id, campaignData);
                    } else {
                        // Criar nova campanha
                        console.log(`[CommercialPartnersView] Criando nova campanha:`, campaignData);
                        await client.campaigns.insert(campaignData);
                    }
                } catch (error: any) {
                    console.error(`[CommercialPartnersView] Erro ao salvar campanha "${campaign.name}":`, error);
                    const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
                    alert(`Erro ao salvar campanha "${campaign.name}": ${errorMessage}`);
                    saving.value = false;
                    return;
                }
            }
        }

        await loadData();
        closeDialog();
    } catch (error: any) {
        console.error('Erro ao salvar parceiro comercial:', error);
        
        if (error.response?.data?.message) {
            alert(`Erro ao salvar: ${error.response.data.message}`);
        } else {
            alert('Erro ao salvar parceiro comercial. Verifique o console para mais detalhes.');
        }
    } finally {
        saving.value = false;
    }
};

// Excluir item
const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro comercial?')) {
        return;
    }

    try {
        await client.commercialPartners.delete(id);
        await loadData();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir parceiro comercial. Verifique o console para mais detalhes.');
    }
};

// Ver histórico de ordens de pagamento
const viewPaymentOrders = (partnerId: string) => {
    router.push({ name: 'sas.payment-orders', query: { partnerId } });
};

// Resetar página quando busca mudar
watch(searchName, () => {
    currentPage.value = 1;
});

onMounted(() => {
    loadData();
    loadCostCenters();
    loadAffiliateNetworks();
});
</script>
