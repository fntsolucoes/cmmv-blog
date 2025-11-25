<template>
    <div class="space-y-6">
        <!-- Cabeçalho -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Tickets - Ativação/Desativação</h1>
            <button @click="openCreateDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Novo Ticket
            </button>
        </div>

        <!-- Filtros -->
        <div class="bg-neutral-800 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Status</label>
                    <select
                        v-model="filters.status"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos</option>
                        <option value="Não Iniciado">Não Iniciado</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Feito">Feito</option>
                        <option value="Com Pendência">Com Pendência</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Tipo</label>
                    <select
                        v-model="filters.activationType"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos</option>
                        <option value="Ativação">Ativação</option>
                        <option value="Adição">Adição</option>
                        <option value="Pausa">Pausa</option>
                        <option value="substituição">substituição</option>
                        <option value="Ajustes">Ajustes</option>
                        <option value="Aumento de Trafego">Aumento de Trafego</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Buscar</label>
                    <input
                        v-model="filters.search"
                        type="text"
                        placeholder="Número do ticket..."
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div class="flex items-end">
                    <button
                        @click="clearFilters"
                        class="w-full px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-md transition-colors"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
        </div>

        <!-- Tickets em Aberto -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="bg-neutral-700 px-6 py-4 border-b border-neutral-600">
                <h2 class="text-lg font-semibold text-white">Tickets em Aberto</h2>
                <p class="text-sm text-neutral-400 mt-1">Tickets não iniciados, em andamento, com pendência ou concluídos há menos de 5 dias</p>
            </div>
            <div v-if="loading" class="p-8 text-center text-neutral-400">
                Carregando tickets...
            </div>
            <div v-else-if="openTickets.length === 0" class="p-8 text-center text-neutral-400">
                Nenhum ticket em aberto encontrado
            </div>
            <div v-else>
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Número</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Campanha</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Tipo</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Parceiro</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Status</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Prioridade</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Criado em</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Última atualização</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-for="ticket in paginatedOpenTickets" :key="ticket.id" class="hover:bg-neutral-700">
                        <td class="px-4 py-3 text-sm text-white font-mono">{{ ticket.ticketNumber }}</td>
                        <td class="px-4 py-3 text-sm text-white">{{ getCampaignName(ticket.campaignId) }}</td>
                        <td class="px-4 py-3 text-sm text-white">{{ ticket.activationType || '-' }}</td>
                        <td class="px-4 py-3 text-sm text-white">{{ ticket.partner || getDefaultPartnerName() }}</td>
                        <td class="px-4 py-3 text-sm">
                            <span :class="getStatusClass(ticket.status)" class="px-2 py-1 text-xs rounded-full">
                                {{ ticket.status }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm">
                            <span :class="getPriorityClass(ticket.priority)" class="px-2 py-1 text-xs rounded-full">
                                {{ ticket.priority }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-white">{{ formatDate(ticket.createdAt) }}</td>
                        <td class="px-4 py-3 text-sm text-white">{{ formatDate(ticket.updatedAt) }}</td>
                        <td class="px-4 py-3 text-sm font-medium">
                            <button
                                @click="viewTicket(ticket)"
                                class="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-400/10"
                                title="Ver detalhes"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <!-- Paginação Tickets em Aberto -->
                <div v-if="totalOpenPages > 1" class="bg-neutral-700 px-6 py-4 border-t border-neutral-600 flex items-center justify-between">
                    <div class="text-sm text-neutral-400">
                        Mostrando {{ (openTicketsPage - 1) * 10 + 1 }} a {{ Math.min(openTicketsPage * 10, openTickets.length) }} de {{ openTickets.length }} tickets
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            @click="openTicketsPage = Math.max(1, openTicketsPage - 1)"
                            :disabled="openTicketsPage === 1"
                            class="px-3 py-1.5 text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <span class="text-sm text-neutral-300">
                            Página {{ openTicketsPage }} de {{ totalOpenPages }}
                        </span>
                        <button
                            @click="openTicketsPage = Math.min(totalOpenPages, openTicketsPage + 1)"
                            :disabled="openTicketsPage === totalOpenPages"
                            class="px-3 py-1.5 text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tickets Concluídos -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden mt-6">
            <div class="bg-neutral-700 px-6 py-4 border-b border-neutral-600 flex items-center justify-between cursor-pointer" @click="showClosedTickets = !showClosedTickets">
                <div class="flex-1">
                    <div class="flex items-center gap-3">
                        <h2 class="text-lg font-semibold text-white">Tickets Concluídos</h2>
                        <span v-if="!loading && closedTickets.length > 0" class="px-2 py-0.5 bg-neutral-600 text-neutral-300 text-xs rounded-full">
                            {{ closedTickets.length }}
                        </span>
                    </div>
                    <p class="text-sm text-neutral-400 mt-1">Tickets fechados há mais de 5 dias</p>
                </div>
                <button class="text-neutral-400 hover:text-white transition-colors p-1">
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        class="h-5 w-5 transition-transform duration-200"
                        :class="{ 'rotate-180': showClosedTickets }"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
            <div v-show="showClosedTickets">
                <div v-if="loading" class="p-8 text-center text-neutral-400">
                    Carregando tickets...
                </div>
                <div v-else-if="closedTickets.length === 0" class="p-8 text-center text-neutral-400">
                    Nenhum ticket concluído encontrado
                </div>
                <div v-else>
                    <table class="min-w-full divide-y divide-neutral-700">
                        <thead class="bg-neutral-700">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Número</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Campanha</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Tipo</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Parceiro</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Prioridade</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Concluído em</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Última atualização</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                            <tr v-for="ticket in paginatedClosedTickets" :key="ticket.id" class="hover:bg-neutral-700">
                            <td class="px-4 py-3 text-sm text-white font-mono">{{ ticket.ticketNumber }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ getCampaignName(ticket.campaignId) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ ticket.activationType || '-' }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ ticket.partner || getDefaultPartnerName() }}</td>
                            <td class="px-4 py-3 text-sm">
                                <span :class="getStatusClass(ticket.status)" class="px-2 py-1 text-xs rounded-full">
                                    {{ ticket.status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm">
                                <span :class="getPriorityClass(ticket.priority)" class="px-2 py-1 text-xs rounded-full">
                                    {{ ticket.priority }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(ticket.resolvedAt || ticket.updatedAt || ticket.closedAt) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(ticket.updatedAt) }}</td>
                            <td class="px-4 py-3 text-sm font-medium">
                                <button
                                    @click="viewTicket(ticket)"
                                    class="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-400/10"
                                    title="Ver detalhes"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                    <!-- Paginação Tickets Concluídos -->
                    <div v-if="totalClosedPages > 1" class="bg-neutral-700 px-6 py-4 border-t border-neutral-600 flex items-center justify-between">
                        <div class="text-sm text-neutral-400">
                            Mostrando {{ (closedTicketsPage - 1) * 20 + 1 }} a {{ Math.min(closedTicketsPage * 20, closedTickets.length) }} de {{ closedTickets.length }} tickets
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                @click="closedTicketsPage = Math.max(1, closedTicketsPage - 1)"
                                :disabled="closedTicketsPage === 1"
                                class="px-3 py-1.5 text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span class="text-sm text-neutral-300">
                                Página {{ closedTicketsPage }} de {{ totalClosedPages }}
                            </span>
                            <button
                                @click="closedTicketsPage = Math.min(totalClosedPages, closedTicketsPage + 1)"
                                :disabled="closedTicketsPage === totalClosedPages"
                                class="px-3 py-1.5 text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: Criar Ticket -->
        <div v-if="showCreateDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center sticky top-0 bg-neutral-800 z-10">
                    <h3 class="text-lg font-medium text-white">Novo Ticket - Ativação/Desativação</h3>
                    <button @click="closeCreateDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form @submit.prevent="createTicket" class="p-6 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Campanha <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <input
                                    v-model="campaignSearch"
                                    @input="filterCampaigns"
                                    @focus="showCampaignDropdown = true"
                                    @blur="setTimeout(() => showCampaignDropdown = false, 200)"
                                    type="text"
                                    placeholder="Digite para buscar campanha..."
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <div v-if="showCampaignDropdown && filteredCampaignsList.length > 0" class="absolute z-50 w-full mt-1 bg-neutral-700 border border-neutral-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    <div
                                        v-for="item in filteredCampaignsList"
                                        :key="item.id"
                                        @mousedown.prevent="selectCampaign(item)"
                                        class="px-3 py-2 hover:bg-neutral-600 cursor-pointer text-white text-sm"
                                    >
                                        <div class="font-medium">{{ item.name }}</div>
                                        <div class="text-xs text-neutral-400">{{ item.partnerName }}</div>
                                    </div>
                                </div>
                                <div v-if="form.campaignId && selectedCampaignName" class="mt-2 text-sm text-neutral-300">
                                    <span class="text-neutral-400">Selecionado:</span> {{ selectedCampaignName }}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Tipo <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="form.activationType"
                                required
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecione o tipo...</option>
                                <option value="Ativação">Ativação</option>
                                <option value="Adição">Adição</option>
                                <option value="Pausa">Pausa</option>
                                <option value="substituição">substituição</option>
                                <option value="Ajustes">Ajustes</option>
                                <option value="Aumento de Trafego">Aumento de Trafego</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Parceiro
                            </label>
                            <select
                                v-model="form.partner"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option v-for="partner in ticketPartners" :key="partner.id" :value="partner.name">
                                    {{ partner.displayName || partner.name }}{{ partner.isDefault ? ' (padrão)' : '' }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Descrição <span class="text-red-500">*</span>
                        </label>
                        <textarea
                            v-model="form.description"
                            required
                            rows="6"
                            placeholder="Descreva detalhadamente a solicitação de ativação/desativação..."
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        ></textarea>
                    </div>
                    <div class="flex justify-end gap-3 pt-4 border-t border-neutral-700">
                        <button
                            type="button"
                            @click="closeCreateDialog"
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
                            {{ saving ? 'Criando...' : 'Criar Ticket' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal: Visualizar Ticket -->
        <div v-if="showViewDialog && selectedTicket" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);" @click.self="closeViewDialog">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-5xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center sticky top-0 bg-neutral-800 z-10">
                    <div>
                        <h3 class="text-lg font-medium text-white">Ticket {{ selectedTicket.ticketNumber }}</h3>
                        <p class="text-sm text-neutral-400 mt-1">{{ selectedTicket.title }}</p>
                    </div>
                    <button @click="closeViewDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="p-6 space-y-6">
                    <!-- Informações Principais -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-neutral-700/50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-neutral-300 mb-3">Informações do Ticket</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-neutral-400">Número:</span>
                                    <span class="text-white font-mono">{{ selectedTicket.ticketNumber }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-400">Status:</span>
                                    <span :class="getStatusClass(selectedTicket.status)" class="px-2 py-1 text-xs rounded-full">
                                        {{ selectedTicket.status }}
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-400">Prioridade:</span>
                                    <span class="text-white">{{ selectedTicket.priority }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-400">Tipo:</span>
                                    <span class="text-white">{{ selectedTicket.activationType || '-' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-400">Parceiro:</span>
                                    <span class="text-white">{{ selectedTicket.partner || getDefaultPartnerName() }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-400">Atribuído a:</span>
                                    <span class="text-white">{{ selectedTicket.assignedTo || 'Não atribuído' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="bg-neutral-700/50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-neutral-300 mb-3">Informações da Campanha</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-neutral-400">Campanha:</span>
                                    <span class="text-white">{{ getCampaignName(selectedTicket.campaignId) }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-400">Criado em:</span>
                                    <span class="text-white">{{ formatDate(selectedTicket.createdAt) }}</span>
                                </div>
                                <div v-if="selectedTicket.firstResponseAt" class="flex justify-between">
                                    <span class="text-neutral-400">Primeira resposta:</span>
                                    <span class="text-white">{{ formatDate(selectedTicket.firstResponseAt) }}</span>
                                </div>
                                <div v-if="selectedTicket.resolvedAt" class="flex justify-between">
                                    <span class="text-neutral-400">Resolvido em:</span>
                                    <span class="text-white">{{ formatDate(selectedTicket.resolvedAt) }}</span>
                                </div>
                                <div v-if="selectedTicket.slaResponseDeadline" class="flex justify-between">
                                    <span class="text-neutral-400">Prazo SLA Resposta:</span>
                                    <span class="text-white">{{ formatDate(selectedTicket.slaResponseDeadline) }}</span>
                                </div>
                                <div v-if="selectedTicket.slaResolutionDeadline" class="flex justify-between">
                                    <span class="text-neutral-400">Prazo SLA Resolução:</span>
                                    <span class="text-white">{{ formatDate(selectedTicket.slaResolutionDeadline) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Descrição -->
                    <div class="bg-neutral-700/50 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-neutral-300 mb-3">Descrição</h4>
                        <p class="text-sm text-white whitespace-pre-wrap">{{ selectedTicket.description }}</p>
                    </div>

                    <!-- Nota de Resolução -->
                    <div v-if="selectedTicket.resolutionNote" class="bg-neutral-700/50 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-neutral-300 mb-3">Nota de Resolução</h4>
                        <p class="text-sm text-white whitespace-pre-wrap">{{ selectedTicket.resolutionNote }}</p>
                    </div>

                    <!-- Áreas de Interação -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Mudar Status -->
                        <div class="bg-neutral-700/50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-neutral-300 mb-3">Mudar Status</h4>
                            <div class="space-y-3">
                                <select
                                    v-model="statusForm.status"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Não Iniciado">Não Iniciado</option>
                                    <option value="Em andamento">Em andamento</option>
                                    <option value="Feito">Feito</option>
                                    <option value="Com Pendência">Com Pendência</option>
                                </select>
                                <textarea
                                    v-if="statusForm.status === 'Feito'"
                                    v-model="statusForm.resolutionNote"
                                    placeholder="Nota de resolução (obrigatória)"
                                    rows="3"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                ></textarea>
                                <button
                                    @click="updateStatus"
                                    :disabled="updating || !statusForm.status || (statusForm.status === 'Feito' && !statusForm.resolutionNote)"
                                    class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {{ updating ? 'Atualizando...' : 'Atualizar Status' }}
                                </button>
                            </div>
                        </div>

                        <!-- Mudar Prioridade -->
                        <div class="bg-neutral-700/50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-neutral-300 mb-3">Mudar Prioridade</h4>
                            <div class="space-y-3">
                                <select
                                    v-model="priorityForm.priority"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Alta">Alta</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Média">Média</option>
                                    <option value="Baixa">Baixa</option>
                                </select>
                                <button
                                    @click="updatePriority"
                                    :disabled="updating || !priorityForm.priority"
                                    class="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {{ updating ? 'Atualizando...' : 'Atualizar Prioridade' }}
                                </button>
                            </div>
                        </div>

                        <!-- Atribuir Ticket -->
                        <div class="bg-neutral-700/50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-neutral-300 mb-3">Atribuir Ticket</h4>
                            <div class="space-y-3">
                                <input
                                    v-model="assignForm.assignedTo"
                                    type="text"
                                    placeholder="Nome do usuário ou ID"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p class="text-xs text-neutral-400">Digite o nome ou ID do usuário. O sistema buscará o nome automaticamente.</p>
                                <button
                                    @click="assignTicket"
                                    :disabled="updating || !assignForm.assignedTo"
                                    class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {{ updating ? 'Atribuindo...' : 'Atribuir' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Histórico -->
                    <div class="bg-neutral-700/50 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-neutral-300 mb-3">Histórico</h4>
                        <div v-if="loadingHistory" class="text-center text-neutral-400 py-4">
                            Carregando histórico...
                        </div>
                        <div v-else-if="ticketHistory.length === 0" class="text-center text-neutral-400 py-4">
                            Nenhum histórico disponível
                        </div>
                        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
                            <div
                                v-for="(entry, index) in ticketHistory"
                                :key="index"
                                class="bg-neutral-800 rounded p-3 text-sm"
                            >
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-white font-medium">{{ entry.action }}</span>
                                    <span class="text-neutral-400 text-xs">{{ formatDate(entry.createdAt) }}</span>
                                </div>
                                <p class="text-neutral-300 text-xs">{{ entry.description }}</p>
                                <div v-if="entry.field && entry.oldValue !== undefined && entry.newValue !== undefined" class="mt-2 text-xs">
                                    <span class="text-neutral-400">{{ entry.field }}:</span>
                                    <span class="text-red-400 line-through ml-1">{{ entry.oldValue }}</span>
                                    <span class="text-green-400 ml-1">→ {{ entry.newValue }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Comentários -->
                    <div class="bg-neutral-700/50 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-neutral-300 mb-3">Comentários</h4>
                        
                        <!-- Formulário de novo comentário -->
                        <div class="mb-4 bg-neutral-800 rounded-lg p-4">
                            <div class="space-y-3">
                                <textarea
                                    v-model="commentForm.content"
                                    placeholder="Digite seu comentário..."
                                    rows="4"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                ></textarea>
                                <div class="flex items-center justify-between">
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            v-model="commentForm.isInternal"
                                            class="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                                        />
                                        <span class="text-sm text-neutral-300">Comentário interno</span>
                                    </label>
                                    <button
                                        @click="createComment"
                                        :disabled="savingComment || !commentForm.content.trim()"
                                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <svg v-if="savingComment" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {{ savingComment ? 'Enviando...' : 'Enviar Comentário' }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Lista de comentários -->
                        <div v-if="loadingComments" class="text-center text-neutral-400 py-4">
                            Carregando comentários...
                        </div>
                        <div v-else-if="ticketComments.length === 0" class="text-center text-neutral-400 py-4">
                            Nenhum comentário ainda. Seja o primeiro a comentar!
                        </div>
                        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
                            <div
                                v-for="(comment, index) in ticketComments"
                                :key="index"
                                :class="[
                                    'bg-neutral-800 rounded-lg p-4 border-l-4',
                                    comment.isInternal ? 'border-yellow-500' : 'border-blue-500'
                                ]"
                            >
                                <div class="flex justify-between items-start mb-2">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-white font-medium text-sm">Usuário: {{ comment.userEmail || userEmailsMap[comment.userId] || comment.userId }}</span>
                                        <span v-if="comment.isInternal" class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                            Interno
                                        </span>
                                    </div>
                                    <span class="text-neutral-400 text-xs">{{ formatDate(comment.createdAt) }}</span>
                                </div>
                                <p class="text-neutral-300 text-sm whitespace-pre-wrap">{{ comment.content }}</p>
                            </div>
                        </div>
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
import { ref, onMounted, computed, watch } from 'vue';
import { useSasClient } from '../client';
import { useApi } from '@cmmv/blog/admin/api';
import ToastNotification from '@cmmv/blog/admin/components/ToastNotification.vue';

const client = useSasClient();
const api = useApi();
const tickets = ref<any[]>([]);
const campaigns = ref<any[]>([]);
const partners = ref<any[]>([]);
const directPartners = ref<any[]>([]);
const ticketPartners = ref<any[]>([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const saving = ref(false);
const showClosedTickets = ref(false); // Começa minimizada

// Paginação
const openTicketsPage = ref(1);
const closedTicketsPage = ref(1);

// Busca de campanha
const campaignSearch = ref('');
const showCampaignDropdown = ref(false);
const allCampaignsList = ref<any[]>([]);
const filteredCampaignsList = ref<any[]>([]);
const selectedCampaignName = ref('');

// Sistema de notificações
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

const filters = ref({
    status: '',
    activationType: '',
    search: ''
});

// Função auxiliar para verificar se um ticket foi concluído há mais de 5 dias
const isTicketClosedMoreThan5Days = (ticket: any): boolean => {
    if (ticket.status !== 'Feito') {
        return false;
    }
    
    // Usar resolvedAt, closedAt ou updatedAt como referência
    const resolvedDate = ticket.resolvedAt || ticket.closedAt || ticket.updatedAt;
    if (!resolvedDate) {
        // Se não tem data de resolução, considerar como não concluído há mais de 5 dias
        return false;
    }
    
    const resolved = new Date(resolvedDate);
    const now = new Date();
    const diffInMs = now.getTime() - resolved.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    return diffInDays >= 5;
};

// Tickets em Aberto: não iniciados, em andamento, com pendência ou concluídos há menos de 5 dias
const openTickets = computed(() => {
    let result = tickets.value;

    // Aplicar filtros
    if (filters.value.status) {
        result = result.filter(t => t.status === filters.value.status);
    }

    if (filters.value.activationType) {
        result = result.filter(t => t.activationType === filters.value.activationType);
    }

    if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        result = result.filter(t => 
            t.ticketNumber?.toLowerCase().includes(search)
        );
    }

    // Filtrar apenas tickets em aberto
    return result.filter(ticket => {
        // Se não está concluído, está em aberto
        if (ticket.status !== 'Feito') {
            return true;
        }
        
        // Se está concluído mas há menos de 5 dias, ainda está em aberto
        return !isTicketClosedMoreThan5Days(ticket);
    });
});

// Tickets Concluídos: apenas tickets "Feito" há mais de 5 dias
const closedTickets = computed(() => {
    let result = tickets.value;

    // Aplicar filtros
    if (filters.value.status) {
        result = result.filter(t => t.status === filters.value.status);
    }

    if (filters.value.activationType) {
        result = result.filter(t => t.activationType === filters.value.activationType);
    }

    if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        result = result.filter(t => 
            t.ticketNumber?.toLowerCase().includes(search)
        );
    }

    // Filtrar apenas tickets concluídos há mais de 5 dias
    return result.filter(ticket => isTicketClosedMoreThan5Days(ticket));
});

// Tickets paginados
const paginatedOpenTickets = computed(() => {
    const start = (openTicketsPage.value - 1) * 10;
    const end = start + 10;
    return openTickets.value.slice(start, end);
});

const paginatedClosedTickets = computed(() => {
    const start = (closedTicketsPage.value - 1) * 20;
    const end = start + 20;
    return closedTickets.value.slice(start, end);
});

// Total de páginas
const totalOpenPages = computed(() => {
    return Math.ceil(openTickets.value.length / 10);
});

const totalClosedPages = computed(() => {
    return Math.ceil(closedTickets.value.length / 20);
});

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Não Iniciado':
            return 'bg-gray-500 text-white';
        case 'Em andamento':
            return 'bg-yellow-500 text-white';
        case 'Feito':
            return 'bg-green-500 text-white';
        case 'Com Pendência':
            return 'bg-orange-500 text-white';
        default:
            return 'bg-neutral-500 text-white';
    }
};

const getPriorityClass = (priority: string) => {
    switch (priority) {
        case 'Alta':
            return 'bg-red-500 text-white';
        case 'Normal':
            return 'bg-blue-500 text-white';
        case 'Média':
            return 'bg-yellow-500 text-white';
        case 'Baixa':
            return 'bg-green-500 text-white';
        default:
            return 'bg-neutral-500 text-white';
    }
};

const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getCampaignName = (campaignId: string | null | undefined) => {
    if (!campaignId) return '-';
    
    // Buscar em campanhas normais
    const campaign = campaigns.value.find(c => c.id === campaignId);
    if (campaign) {
        const partner = partners.value.find(p => p.id === campaign.commercialPartnerId);
        return `${campaign.name}${partner ? ` - ${partner.name}` : ''}`;
    }
    
    // Buscar em parceiros diretos
    const directPartner = directPartners.value.find(p => p.id === campaignId);
    if (directPartner) {
        return `${directPartner.name} - Direto`;
    }
    
    return '-';
};

const getPartnerName = (partnerId: string | null | undefined) => {
    if (!partnerId) return '';
    const partner = partners.value.find(p => p.id === partnerId);
    return partner ? partner.name : '';
};

const getDefaultPartnerName = () => {
    const defaultPartner = ticketPartners.value.find(p => p.isDefault && p.active);
    return defaultPartner ? defaultPartner.name : '';
};

const clearFilters = () => {
    filters.value = {
        status: '',
        activationType: '',
        search: ''
    };
};

const form = ref({
    description: '',
    campaignId: '',
    activationType: '',
    partner: ''
});

// Filtrar campanhas baseado na busca
const filterCampaigns = () => {
    if (!campaignSearch.value.trim()) {
        filteredCampaignsList.value = allCampaignsList.value.slice(0, 20); // Mostrar primeiras 20
        return;
    }
    
    const search = campaignSearch.value.toLowerCase();
    filteredCampaignsList.value = allCampaignsList.value.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.partnerName.toLowerCase().includes(search)
    ).slice(0, 20); // Limitar a 20 resultados
};

// Selecionar campanha
const selectCampaign = (item: any) => {
    form.value.campaignId = item.id;
    selectedCampaignName.value = `${item.name} - ${item.partnerName}`;
    campaignSearch.value = item.name;
    showCampaignDropdown.value = false;
};

// Preparar lista unificada de campanhas
const prepareCampaignsList = () => {
    allCampaignsList.value = [];
    
    // Adicionar campanhas normais
    campaigns.value.forEach((campaign: any) => {
        const partner = partners.value.find(p => p.id === campaign.commercialPartnerId);
        allCampaignsList.value.push({
            id: campaign.id,
            name: campaign.name,
            partnerName: partner ? partner.name : 'N/A',
            type: 'campaign'
        });
    });
    
    // Adicionar parceiros diretos (como campanhas)
    directPartners.value.forEach((partner: any) => {
        allCampaignsList.value.push({
            id: partner.id,
            name: partner.name,
            partnerName: 'Direto',
            type: 'direct'
        });
    });
    
    // Ordenar por nome
    allCampaignsList.value.sort((a, b) => a.name.localeCompare(b.name));
    
    // Inicializar lista filtrada
    filteredCampaignsList.value = allCampaignsList.value.slice(0, 20);
};

const openCreateDialog = () => {
    // Buscar parceiro padrão
    const defaultPartner = ticketPartners.value.find(p => p.isDefault && p.active);
    form.value = {
        description: '',
        campaignId: '',
        activationType: '',
        partner: defaultPartner ? defaultPartner.name : (ticketPartners.value.length > 0 ? ticketPartners.value[0].name : '')
    };
    campaignSearch.value = '';
    selectedCampaignName.value = '';
    showCampaignDropdown.value = false;
    showCreateDialog.value = true;
};

const closeCreateDialog = () => {
    showCreateDialog.value = false;
    const defaultPartner = ticketPartners.value.find(p => p.isDefault && p.active);
    form.value = {
        description: '',
        campaignId: '',
        activationType: '',
        partner: defaultPartner ? defaultPartner.name : (ticketPartners.value.length > 0 ? ticketPartners.value[0].name : '')
    };
    campaignSearch.value = '';
    selectedCampaignName.value = '';
    showCampaignDropdown.value = false;
};

const createTicket = async () => {
    if (!form.value.campaignId || !form.value.description || !form.value.activationType) {
        showNotification('error', 'Por favor, preencha todos os campos obrigatórios (Campanha, Descrição e Tipo).');
        return;
    }
    
    // Validar se a campanha selecionada existe na lista
    const selectedItem = allCampaignsList.value.find(item => item.id === form.value.campaignId);
    if (!selectedItem) {
        showNotification('error', 'Por favor, selecione uma campanha válida da lista.');
        return;
    }

    saving.value = true;
    try {
        // Obter ID do usuário atual
        let userId: string | null = null;
        
        // Tentar obter do user do api
        const currentUser = api.user.value;
        if (currentUser) {
            if (currentUser.id) {
                userId = currentUser.id;
            } else if (currentUser._id) {
                userId = currentUser._id;
            } else if (typeof currentUser === 'string') {
                userId = currentUser;
            } else {
                // Tentar acessar propriedades comuns
                const userKeys = Object.keys(currentUser);
                if (userKeys.length > 0) {
                    // Tentar encontrar qualquer propriedade que pareça um ID
                    const possibleId = userKeys.find(key => 
                        key.toLowerCase().includes('id') && currentUser[key]
                    );
                    if (possibleId) {
                        userId = currentUser[possibleId];
                    }
                }
            }
        }

        // Se não encontrou no user, tentar decodificar o token JWT
        if (!userId && api.token.value) {
            try {
                const tokenParts = api.token.value.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    userId = payload.id || payload.userId || payload.sub || payload._id || null;
                }
            } catch (e) {
                console.warn('Erro ao decodificar token:', e);
            }
        }

        // Se ainda não encontrou, usar 'system' como fallback
        if (!userId) {
            userId = 'system';
            console.warn('Usuário não identificado, usando "system" como padrão');
        }

        // Buscar dados da campanha ou parceiro direto para gerar o título
        let campaign = campaigns.value.find(c => c.id === form.value.campaignId);
        let title = '';
        
        if (campaign) {
            // É uma campanha normal
            const partner = partners.value.find(p => p.id === campaign.commercialPartnerId);
            title = `${campaign.name}${partner ? ` - ${partner.name}` : ''}`;
        } else {
            // Pode ser um parceiro direto
            const directPartner = directPartners.value.find(p => p.id === form.value.campaignId);
            if (directPartner) {
                title = `${directPartner.name} - Direto`;
            } else {
                showNotification('error', 'Campanha não encontrada.');
                saving.value = false;
                return;
            }
        }

        const payload: any = {
            title: title,
            description: form.value.description.trim(),
            ticketType: 'activation',
            campaignId: form.value.campaignId,
            activationType: form.value.activationType,
            partner: form.value.partner || (ticketPartners.value.find(p => p.isDefault && p.active)?.name || ''),
            createdBy: userId
        };

        const createResponse = await client.tickets.create(payload);
        console.log('Ticket criado, resposta:', createResponse); // Debug
        console.log('Ticket criado, dados:', createResponse.data || createResponse.result || createResponse); // Debug
        
        await loadTickets();
        closeCreateDialog();
        showNotification('success', 'Ticket criado com sucesso!');
    } catch (error: any) {
        console.error('Erro ao criar ticket:', error);
        showNotification('error', `Erro ao criar ticket: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        saving.value = false;
    }
};

const selectedTicket = ref<any>(null);
const showViewDialog = ref(false);
const ticketHistory = ref<any[]>([]);
const loadingHistory = ref(false);
const updating = ref(false);

// Comentários
const ticketComments = ref<any[]>([]);
const loadingComments = ref(false);
const savingComment = ref(false);
const commentForm = ref({
    content: '',
    isInternal: false
});
const userEmailsMap = ref<Record<string, string>>({});

// Formulários de interação
const statusForm = ref({
    status: '',
    resolutionNote: ''
});

const priorityForm = ref({
    priority: ''
});

const assignForm = ref({
    assignedTo: ''
});

const viewTicket = async (ticket: any) => {
    showViewDialog.value = true;
    try {
        // Obter ID do usuário atual
        let userId = 'system';
        const currentUser = api.user.value;
        if (currentUser?.id) userId = currentUser.id;
        else if (currentUser?._id) userId = currentUser._id;
        else if (typeof currentUser === 'string') userId = currentUser;

        // Abrir ticket (atribui ao usuário se não estiver atribuído)
        try {
            await client.tickets.open(ticket.id, { userId });
        } catch (error) {
            console.warn('Erro ao abrir ticket (pode já estar atribuído):', error);
        }

        // Buscar dados completos do ticket
        const response = await client.tickets.getById(ticket.id);
        let ticketData = null;
        if (response.data) {
            ticketData = response.data;
        } else if (response) {
            ticketData = response;
        } else {
            ticketData = ticket; // Fallback para o ticket da lista
        }
        
        selectedTicket.value = ticketData;
        statusForm.value.status = ticketData.status;
        priorityForm.value.priority = ticketData.priority;
        assignForm.value.assignedTo = ticketData.assignedTo || '';
        
        await loadTicketHistory(ticketData.id);
        await loadTicketComments(ticketData.id);
    } catch (error) {
        console.error('Erro ao carregar ticket:', error);
        // Em caso de erro, usar o ticket da lista
        selectedTicket.value = ticket;
        statusForm.value.status = ticket.status;
        priorityForm.value.priority = ticket.priority;
        assignForm.value.assignedTo = ticket.assignedTo || '';
    }
};

const closeViewDialog = () => {
    showViewDialog.value = false;
    selectedTicket.value = null;
    ticketHistory.value = [];
    ticketComments.value = [];
    statusForm.value = { status: '', resolutionNote: '' };
    priorityForm.value = { priority: '' };
    assignForm.value = { assignedTo: '' };
    commentForm.value = { content: '', isInternal: false };
};

const loadTicketHistory = async (ticketId: string) => {
    loadingHistory.value = true;
    try {
        const response = await client.tickets.getHistory(ticketId);
        let historyData = [];
        if (Array.isArray(response.data)) {
            historyData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            historyData = response.data.data;
        } else if (Array.isArray(response)) {
            historyData = response;
        }
        ticketHistory.value = historyData.reverse(); // Mais recentes primeiro
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    } finally {
        loadingHistory.value = false;
    }
};

const loadTicketComments = async (ticketId: string) => {
    loadingComments.value = true;
    try {
        const response = await client.ticketComments.get(ticketId);
        let commentsData = [];
        if (Array.isArray(response.data)) {
            commentsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            commentsData = response.data.data;
        } else if (Array.isArray(response)) {
            commentsData = response;
        }
        
        // Os comentários já vêm com userEmail do backend
        // Criar mapa de emails para facilitar acesso
        commentsData.forEach((comment: any) => {
            if (comment.userEmail) {
                userEmailsMap.value[comment.userId] = comment.userEmail;
            }
        });
        
        ticketComments.value = commentsData.reverse(); // Mais recentes primeiro
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
    } finally {
        loadingComments.value = false;
    }
};

const createComment = async () => {
    if (!selectedTicket.value || !commentForm.value.content.trim()) {
        showNotification('error', 'Por favor, digite um comentário.');
        return;
    }

    savingComment.value = true;
    try {
        let userId: string | null = null;
        let userName = 'Sistema';
        
        // Tentar obter do user do api
        const currentUser = api.user.value;
        if (currentUser) {
            if (currentUser.id) {
                userId = String(currentUser.id);
                userName = currentUser.name || currentUser.username || currentUser.email || 'Usuário';
            } else if (currentUser._id) {
                userId = String(currentUser._id);
                userName = currentUser.name || currentUser.username || currentUser.email || 'Usuário';
            } else if (typeof currentUser === 'string') {
                userId = currentUser;
            } else {
                // Tentar acessar propriedades comuns
                const userKeys = Object.keys(currentUser);
                if (userKeys.length > 0) {
                    const possibleId = userKeys.find(key => 
                        key.toLowerCase().includes('id') && currentUser[key]
                    );
                    if (possibleId) {
                        userId = String(currentUser[possibleId]);
                    }
                }
            }
        }

        // Se não encontrou no user, tentar decodificar o token JWT
        if (!userId && api.token.value) {
            try {
                const tokenParts = api.token.value.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    userId = String(payload.id || payload.userId || payload.sub || payload._id || null);
                    if (userId && userId !== 'null') {
                        userName = payload.name || payload.username || payload.email || 'Usuário';
                    }
                }
            } catch (e) {
                console.warn('Erro ao decodificar token:', e);
            }
        }

        // Se ainda não encontrou, usar 'system' como fallback
        if (!userId || userId === 'null') {
            userId = 'system';
            console.warn('Usuário não identificado, usando "system" como padrão');
        }
        
        console.log(`[createComment] userId identificado: ${userId}, userName: ${userName}`);

        const response = await client.ticketComments.create({
            ticketId: selectedTicket.value.id,
            userId: userId,
            content: commentForm.value.content.trim(),
            isInternal: commentForm.value.isInternal
        });

        // Adicionar comentário à lista com email do usuário
        let newComment = null;
        if (response.data) {
            newComment = response.data;
        } else if (response) {
            newComment = response;
        }

        if (newComment) {
            // O comentário retornado já deve ter userEmail do backend
            // Adicionar no início da lista (mais recente primeiro)
            ticketComments.value.unshift(newComment);
            // Atualizar mapa de emails
            if (newComment.userEmail) {
                userEmailsMap.value[newComment.userId] = newComment.userEmail;
            }
        }

        // Limpar formulário e recarregar histórico
        commentForm.value.content = '';
        commentForm.value.isInternal = false;
        await loadTicketHistory(selectedTicket.value.id);
        
        // Recarregar ticket para pegar possível atualização de assignedTo
        const updated = await client.tickets.getById(selectedTicket.value.id);
        if (updated.data) {
            selectedTicket.value = updated.data;
            assignForm.value.assignedTo = updated.data.assignedTo || '';
        } else if (updated) {
            selectedTicket.value = updated;
            assignForm.value.assignedTo = updated.assignedTo || '';
        }
        
        await loadTickets(); // Atualizar lista
    } catch (error: any) {
        console.error('Erro ao criar comentário:', error);
        showNotification('error', `Erro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        savingComment.value = false;
    }
};

const updateStatus = async () => {
    if (!selectedTicket.value || !statusForm.value.status) return;
    
    updating.value = true;
    try {
        let userId = 'system';
        const currentUser = api.user.value;
        if (currentUser?.id) userId = currentUser.id;
        else if (currentUser?._id) userId = currentUser._id;
        
        await client.tickets.updateStatus(selectedTicket.value.id, {
            status: statusForm.value.status,
            resolutionNote: statusForm.value.resolutionNote,
            userId: userId
        });
        
        // Recarregar ticket e histórico
        const updated = await client.tickets.getById(selectedTicket.value.id);
        let ticketData = null;
        if (updated.data) {
            ticketData = updated.data;
        } else if (updated) {
            ticketData = updated;
        }
        
        if (ticketData) {
            selectedTicket.value = ticketData;
            statusForm.value.status = ticketData.status;
        }
        
        await loadTicketHistory(selectedTicket.value.id);
        await loadTickets(); // Atualizar lista
        
        statusForm.value.resolutionNote = '';
        showNotification('success', 'Status atualizado com sucesso!');
    } catch (error: any) {
        console.error('Erro ao atualizar status:', error);
        showNotification('error', `Erro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        updating.value = false;
    }
};

const updatePriority = async () => {
    if (!selectedTicket.value || !priorityForm.value.priority) return;
    
    updating.value = true;
    try {
        let userId = 'system';
        const currentUser = api.user.value;
        if (currentUser?.id) userId = currentUser.id;
        else if (currentUser?._id) userId = currentUser._id;
        
        await client.tickets.updatePriority(selectedTicket.value.id, {
            priority: priorityForm.value.priority,
            userId: userId
        });
        
        // Recarregar ticket e histórico
        const updated = await client.tickets.getById(selectedTicket.value.id);
        let ticketData = null;
        if (updated.data) {
            ticketData = updated.data;
        } else if (updated) {
            ticketData = updated;
        }
        
        if (ticketData) {
            selectedTicket.value = ticketData;
            priorityForm.value.priority = ticketData.priority;
        }
        
        await loadTicketHistory(selectedTicket.value.id);
        await loadTickets(); // Atualizar lista
        
        showNotification('success', 'Prioridade atualizada com sucesso!');
    } catch (error: any) {
        console.error('Erro ao atualizar prioridade:', error);
        showNotification('error', `Erro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        updating.value = false;
    }
};

const assignTicket = async () => {
    if (!selectedTicket.value || !assignForm.value.assignedTo) {
        showNotification('error', 'Por favor, informe o usuário para atribuição.');
        return;
    }
    
    updating.value = true;
    try {
        let userId = 'system';
        const currentUser = api.user.value;
        if (currentUser?.id) userId = currentUser.id;
        else if (currentUser?._id) userId = currentUser._id;
        
        await client.tickets.assign(selectedTicket.value.id, {
            assignedTo: assignForm.value.assignedTo,
            userId: userId,
            assignmentType: 'manual'
        });
        
        // Recarregar ticket e histórico
        const updated = await client.tickets.getById(selectedTicket.value.id);
        let ticketData = null;
        if (updated.data) {
            ticketData = updated.data;
        } else if (updated) {
            ticketData = updated;
        }
        
        if (ticketData) {
            selectedTicket.value = ticketData;
            assignForm.value.assignedTo = ticketData.assignedTo || '';
        }
        
        await loadTicketHistory(selectedTicket.value.id);
        await loadTickets(); // Atualizar lista
        
        showNotification('success', 'Ticket atribuído com sucesso!');
    } catch (error: any) {
        console.error('Erro ao atribuir ticket:', error);
        showNotification('error', `Erro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        updating.value = false;
    }
};

const loadTickets = async () => {
    loading.value = true;
    try {
        // Buscar apenas tickets do tipo activation (filtro no backend)
        const response = await client.tickets.get({ ticketType: 'activation' });
        
        // Extrair dados da resposta
        let ticketsData = [];
        if (Array.isArray(response.data)) {
            ticketsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            ticketsData = response.data.data;
        } else if (Array.isArray(response)) {
            ticketsData = response;
        }
        
        tickets.value = ticketsData;
    } catch (error) {
        console.error('Erro ao carregar tickets:', error);
        showNotification('error', 'Erro ao carregar tickets.');
    } finally {
        loading.value = false;
    }
};

const loadCampaigns = async () => {
    try {
        const response = await client.campaigns.getAll();
        campaigns.value = response.data || [];
        
        // Preparar lista de campanhas após carregar campanhas
        prepareCampaignsList();
    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
    }
};

const loadPartners = async () => {
    try {
        const response = await client.commercialPartners.getAll();
        const allPartners = response.data || [];
        partners.value = allPartners;
        
        // Filtrar parceiros diretos
        directPartners.value = allPartners.filter((p: any) => p.partnerType === 'Direto');
        
        // Preparar lista de campanhas após carregar parceiros
        prepareCampaignsList();
    } catch (error) {
        console.error('Erro ao carregar parceiros:', error);
    }
};

const loadTicketPartners = async () => {
    try {
        const response = await client.ticketPartners.getAll();
        let partnersData = [];
        if (Array.isArray(response.data)) {
            partnersData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            partnersData = response.data.data;
        } else if (Array.isArray(response)) {
            partnersData = response;
        }
        ticketPartners.value = partnersData;
        
        // Se não há parceiro padrão definido no form, definir agora
        if (!form.value.partner && partnersData.length > 0) {
            const defaultPartner = partnersData.find(p => p.isDefault && p.active);
            form.value.partner = defaultPartner ? defaultPartner.name : partnersData[0].name;
        }
    } catch (error) {
        console.error('Erro ao carregar parceiros de tickets:', error);
    }
};

// Resetar páginas quando filtros mudarem
watch(() => [filters.value.status, filters.value.activationType, filters.value.search], () => {
    openTicketsPage.value = 1;
    closedTicketsPage.value = 1;
});

onMounted(() => {
    loadTickets();
    loadCampaigns();
    loadPartners();
    loadTicketPartners();
});
</script>

