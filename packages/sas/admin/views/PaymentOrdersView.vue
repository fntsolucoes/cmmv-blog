<template>
    <div class="space-y-6">
        <!-- Cabeçalho -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <h1 class="text-2xl font-bold text-white">Ordens de Pagamento</h1>
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    @click="exportToCSV"
                    :disabled="exportingCSV || filteredItems.length === 0"
                    class="px-2.5 py-1 bg-neutral-600 hover:bg-neutral-500 text-white text-xs font-medium rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {{ exportingCSV ? 'Exportando...' : 'Exportar CSV' }}
                </button>
                <button
                    type="button"
                    @click="triggerImportCSV"
                    :disabled="importingCSV"
                    class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {{ importingCSV ? 'Importando...' : 'Importar CSV' }}
                </button>
                <input
                    ref="csvFileInput"
                    type="file"
                    accept=".csv"
                    class="hidden"
                    @change="handleImportCSVFile"
                />
                <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nova Ordem
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-neutral-800 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Filtrar por Parceiro</label>
                    <input
                        v-model="filters.partnerName"
                        type="text"
                        placeholder="Nome do parceiro"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Filtrar por Data de Saque</label>
                    <input
                        v-model="filters.withdrawalDate"
                        type="date"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-neutral-300 mb-2">Filtrar por Mês de Pagamento</label>
                    <input
                        v-model="filters.paymentMonthYear"
                        type="month"
                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <!-- Tabela 1: Notas Abertas e Pagas no Mês Vigente -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="p-4 border-b border-neutral-700 flex justify-between items-center cursor-pointer" @click="toggleTable1">
                <h2 class="text-lg font-semibold text-white">Notas Abertas e Pagas no Mês Vigente</h2>
                <svg
                    :class="{ 'rotate-180': !isTable1Expanded }"
                    class="w-5 h-5 text-neutral-400 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            <div v-if="isTable1Expanded">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th 
                                @click="toggleSort1('partner')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Parceiro
                                    <svg v-if="sortKey1 === 'partner'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort1('month')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Mês Referência
                                    <svg v-if="sortKey1 === 'month'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort1('invoiceAmount')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Valor da Fatura
                                    <svg v-if="sortKey1 === 'invoiceAmount'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort1('taxPercentage')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    % do Imposto
                                    <svg v-if="sortKey1 === 'taxPercentage'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Câmbio</th>
                            <th 
                                @click="toggleSort1('netValue')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Valor Líquido
                                    <svg v-if="sortKey1 === 'netValue'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort1('paidValue')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Valor Pago
                                    <svg v-if="sortKey1 === 'paidValue'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Método de Pagamento</th>
                            <th 
                                @click="toggleSort1('status')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Status
                                    <svg v-if="sortKey1 === 'status'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort1('withdrawalDate')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Data do Saque
                                    <svg v-if="sortKey1 === 'withdrawalDate'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort1('effectivePaymentDate')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Data do Pagamento
                                    <svg v-if="sortKey1 === 'effectivePaymentDate'" :class="{ 'rotate-180': sortOrder1 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-if="paginatedTable1.length === 0">
                            <td colspan="12" class="px-4 py-4 text-center text-sm text-neutral-400">
                                Nenhuma nota encontrada
                            </td>
                        </tr>
                        <tr v-for="item in paginatedTable1" :key="item.id" class="hover:bg-neutral-700">
                            <td class="px-4 py-3 text-sm text-white">{{ getPartnerName(item.commercialPartnerId) || '-' }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatMonthReference(item.expectedPaymentMonth) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatCurrency(item.invoiceAmount, item.currency) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ calculateTaxPercentage(item) }}%</td>
                            <td class="px-4 py-3 text-sm text-white">{{ getExchangeRateDisplay(item) }}</td>
                            <td class="px-4 py-3 text-sm" :class="getNetValueColor(item)">
                                <span :title="getNetValueTooltip(item)">{{ formatNetValue(item) }}</span>
                            </td>
                            <td class="px-4 py-3 text-sm" :class="getPaidValueColor(item)">
                                {{ formatPaidValue(item) }}
                            </td>
                            <td class="px-4 py-3 text-sm text-white">
                                {{ getPaymentMethodsDisplay(item) }}
                            </td>
                            <td class="px-4 py-3">
                                <span :class="item.status === 'Pago' ? 'bg-green-500' : 'bg-yellow-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                    {{ item.status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(item.withdrawalDate) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(item.effectivePaymentDate) }}</td>
                            <td class="px-4 py-3 text-sm font-medium">
                                <div class="flex items-center gap-2">
                                    <button
                                        v-if="item.status === 'Pendente'"
                                        @click="markAsPaid(item)"
                                        class="text-green-400 hover:text-green-300 transition-colors p-1 rounded hover:bg-green-400/10"
                                        title="Marcar como pago"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="editItem(item)"
                                        class="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-400/10"
                                        title="Editar ordem de pagamento"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="deleteItem(item.id)"
                                        class="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                                        title="Excluir ordem de pagamento"
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
                <!-- Paginação Tabela 1 -->
                <div class="px-4 py-3 border-t border-neutral-700 flex items-center justify-between">
                    <div class="text-sm text-neutral-400">
                        Mostrando {{ (currentPage1 - 1) * 30 + 1 }} a {{ Math.min(currentPage1 * 30, filteredTable1.length) }} de {{ filteredTable1.length }} notas
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            @click="currentPage1--"
                            :disabled="currentPage1 === 1"
                            class="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <span class="text-sm text-neutral-300">
                            Página {{ currentPage1 }} de {{ totalPages1 }}
                        </span>
                        <button
                            @click="currentPage1++"
                            :disabled="currentPage1 >= totalPages1"
                            class="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabela 2: Notas Pagas -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="p-4 border-b border-neutral-700 flex justify-between items-center cursor-pointer" @click="toggleTable2">
                <h2 class="text-lg font-semibold text-white">Notas Pagas</h2>
                <svg
                    :class="{ 'rotate-180': !isTable2Expanded }"
                    class="w-5 h-5 text-neutral-400 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            <div v-if="isTable2Expanded">
                <table class="min-w-full divide-y divide-neutral-700">
                    <thead class="bg-neutral-700">
                        <tr>
                            <th 
                                @click="toggleSort2('partner')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Parceiro
                                    <svg v-if="sortKey2 === 'partner'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort2('month')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Mês Referência
                                    <svg v-if="sortKey2 === 'month'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort2('invoiceAmount')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Valor da Fatura
                                    <svg v-if="sortKey2 === 'invoiceAmount'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort2('taxPercentage')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    % do Imposto
                                    <svg v-if="sortKey2 === 'taxPercentage'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Câmbio</th>
                            <th 
                                @click="toggleSort2('netValue')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Valor Líquido
                                    <svg v-if="sortKey2 === 'netValue'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort2('paidValue')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Valor Pago
                                    <svg v-if="sortKey2 === 'paidValue'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Método de Pagamento</th>
                            <th 
                                @click="toggleSort2('status')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Status
                                    <svg v-if="sortKey2 === 'status'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort2('withdrawalDate')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Data do Saque
                                    <svg v-if="sortKey2 === 'withdrawalDate'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                @click="toggleSort2('effectivePaymentDate')"
                                class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase cursor-pointer hover:bg-neutral-600 transition-colors select-none"
                            >
                                <div class="flex items-center gap-1">
                                    Data do Pagamento
                                    <svg v-if="sortKey2 === 'effectivePaymentDate'" :class="{ 'rotate-180': sortOrder2 === 'desc' }" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                    <svg v-else class="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                        <tr v-if="paginatedTable2.length === 0">
                            <td colspan="12" class="px-4 py-4 text-center text-sm text-neutral-400">
                                Nenhuma nota encontrada
                            </td>
                        </tr>
                        <tr v-for="item in paginatedTable2" :key="item.id" class="hover:bg-neutral-700">
                            <td class="px-4 py-3 text-sm text-white">{{ getPartnerName(item.commercialPartnerId) || '-' }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatMonthReference(item.expectedPaymentMonth) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatCurrency(item.invoiceAmount, item.currency) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ calculateTaxPercentage(item) }}%</td>
                            <td class="px-4 py-3 text-sm text-white">{{ getExchangeRateDisplay(item) }}</td>
                            <td class="px-4 py-3 text-sm" :class="getNetValueColor(item)">
                                <span :title="getNetValueTooltip(item)">{{ formatNetValue(item) }}</span>
                            </td>
                            <td class="px-4 py-3 text-sm" :class="getPaidValueColor(item)">
                                {{ formatPaidValue(item) }}
                            </td>
                            <td class="px-4 py-3 text-sm text-white">
                                {{ getPaymentMethodsDisplay(item) }}
                            </td>
                            <td class="px-4 py-3">
                                <span :class="item.status === 'Pago' ? 'bg-green-500' : 'bg-yellow-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                    {{ item.status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(item.withdrawalDate) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(item.effectivePaymentDate) }}</td>
                            <td class="px-4 py-3 text-sm font-medium">
                                <div class="flex items-center gap-2">
                                    <button
                                        @click="editItem(item)"
                                        class="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-400/10"
                                        title="Editar ordem de pagamento"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        v-if="item.observations"
                                        @click="viewObservations(item.observations)"
                                        class="text-purple-400 hover:text-purple-300 transition-colors p-1 rounded hover:bg-purple-400/10"
                                        title="Ver observações"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button
                                        @click="deleteItem(item.id)"
                                        class="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                                        title="Excluir ordem de pagamento"
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
                <!-- Paginação Tabela 2 -->
                <div class="px-4 py-3 border-t border-neutral-700 flex items-center justify-between">
                    <div class="text-sm text-neutral-400">
                        Mostrando {{ (currentPage2 - 1) * 30 + 1 }} a {{ Math.min(currentPage2 * 30, filteredTable2.length) }} de {{ filteredTable2.length }} notas
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            @click="currentPage2--"
                            :disabled="currentPage2 === 1"
                            class="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <span class="text-sm text-neutral-300">
                            Página {{ currentPage2 }} de {{ totalPages2 }}
                        </span>
                        <button
                            @click="currentPage2++"
                            :disabled="currentPage2 >= totalPages2"
                            class="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: Marcar como Pago -->
        <div v-if="showMarkAsPaidModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Marcar como Pago</h3>
                    <button @click="closeMarkAsPaidModal" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form @submit.prevent="confirmMarkAsPaid" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Data de Pagamento <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="markAsPaidForm.effectivePaymentDate"
                            type="date"
                            required
                            :max="todayDate"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Valor Pago (BRL) <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model.number="markAsPaidForm.paidValue"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div class="flex justify-end gap-3 pt-4 border-t border-neutral-700">
                        <button
                            type="button"
                            @click="closeMarkAsPaidModal"
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
                            {{ saving ? 'Salvando...' : 'Confirmar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal: Criar/Editar Ordem -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Ordem de Pagamento' : 'Nova Ordem de Pagamento' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form @submit.prevent="saveOrder" class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Parceiro <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <input
                                    v-model="partnerSearchText"
                                    @input="filterPartners"
                                    @focus="showPartnerDropdown = true"
                                    @blur="handlePartnerBlur"
                                    type="text"
                                    placeholder="Digite para buscar o parceiro..."
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    :required="!form.commercialPartnerId"
                                />
                                <div
                                    v-if="showPartnerDropdown && filteredPartners.length > 0"
                                    class="absolute z-50 w-full mt-1 bg-neutral-700 border border-neutral-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                                >
                                    <div
                                        v-for="partner in filteredPartners"
                                        :key="partner.id"
                                        @mousedown.prevent="selectPartner(partner)"
                                        class="px-3 py-2 hover:bg-neutral-600 cursor-pointer text-white text-sm"
                                    >
                                        {{ partner.name }}
                                    </div>
                                </div>
                                <div
                                    v-if="showPartnerDropdown && filteredPartners.length === 0 && partnerSearchText"
                                    class="absolute z-50 w-full mt-1 bg-neutral-700 border border-neutral-600 rounded-md shadow-lg"
                                >
                                    <div class="px-3 py-2 text-neutral-400 text-sm">
                                        Nenhum parceiro encontrado
                                    </div>
                                </div>
                            </div>
                            <input
                                v-model="form.commercialPartnerId"
                                type="hidden"
                            />
                            <p v-if="selectedPartnerName" class="mt-1 text-xs text-neutral-400">
                                Selecionado: {{ selectedPartnerName }}
                            </p>
                            <p v-if="!form.commercialPartnerId && partnerSearchText" class="mt-1 text-xs text-yellow-400">
                                Selecione um parceiro da lista
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Empresa <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="form.costCenterId"
                                required
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecione uma empresa</option>
                                <option v-for="costCenter in costCenters" :key="costCenter.id" :value="costCenter.id">{{ costCenter.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Moeda <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="form.currency"
                                required
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="BRL">BRL</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Status <span class="text-red-500">*</span>
                            </label>
                            <select
                                v-model="form.status"
                                required
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Pendente">Pendente</option>
                                <option value="Pago">Pago</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Mês Referência <span class="text-red-500">*</span>
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <select
                                    v-model.number="form.expectedPaymentMonth"
                                    required
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option v-for="month in 12" :key="month" :value="month">{{ String(month).padStart(2, '0') }}</option>
                                </select>
                                <input
                                    v-model.number="form.expectedPaymentYear"
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    required
                                    placeholder="Ano"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Valor da Fatura <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="form.invoiceAmount"
                                v-currency="getCurrencyOptions()"
                                type="text"
                                required
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                @input="handleCurrencyInput"
                                @paste.prevent="handleCurrencyPaste"
                                @keydown="handleCurrencyKeydown"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Percentual do Imposto (%) <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="taxPercentageInput"
                                type="text"
                                step="0.01"
                                min="0"
                                max="100"
                                required
                                @input="handleTaxPercentageInput"
                                placeholder="Ex: 23,50"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Valor do Imposto (Calculado)
                            </label>
                            <input
                                :value="formatCurrency(form.taxAmount, form.currency)"
                                type="text"
                                readonly
                                class="w-full px-3 py-2 bg-neutral-600 border border-neutral-600 rounded-md text-neutral-300 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Valor de Desconto
                            </label>
                            <input
                                v-model="form.discountAmount"
                                v-currency="getCurrencyOptions()"
                                type="text"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                @input="handleDiscountInput"
                                @paste.prevent="handleDiscountPaste"
                                @keydown="handleCurrencyKeydown"
                                placeholder="0,00"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Valor Líquido (Calculado)
                            </label>
                            <input
                                :value="formatCurrency(calculateNetAmount(), form.currency)"
                                type="text"
                                readonly
                                class="w-full px-3 py-2 bg-neutral-600 border border-neutral-600 rounded-md text-neutral-300 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Data de Saque
                            </label>
                            <input
                                v-model="form.withdrawalDate"
                                type="date"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Data Efetiva de Pagamento
                            </label>
                            <input
                                v-model="form.effectivePaymentDate"
                                type="date"
                                :required="form.status === 'Pago'"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p class="mt-1 text-xs text-neutral-400">Obrigatório se status for "Pago"</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Método de Pagamento
                            </label>
                            <select
                                v-model="form.paymentMethod"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                :disabled="!form.costCenterId"
                            >
                                <option value="">Selecione um método</option>
                                <option
                                    v-for="(method, index) in availablePaymentMethods"
                                    :key="index"
                                    :value="method.details ? `${method.method}: ${method.details}` : method.method"
                                >
                                    {{ method.details ? `${method.method}: ${method.details}` : method.method }}
                                </option>
                            </select>
                            <p v-if="!form.costCenterId" class="mt-1 text-xs text-neutral-400">Selecione uma empresa primeiro</p>
                            <p v-else-if="availablePaymentMethods.length === 0" class="mt-1 text-xs text-yellow-400">Nenhum método de pagamento cadastrado para esta empresa</p>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Observações
                            </label>
                            <textarea
                                v-model="form.observations"
                                rows="3"
                                placeholder="Digite observações sobre esta ordem de pagamento..."
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            ></textarea>
                        </div>
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

        <!-- Modal: Visualizar Observações -->
        <div v-if="showObservationsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Observações</h3>
                    <button @click="closeObservationsModal" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <p class="text-white whitespace-pre-wrap">{{ observationsText || 'Nenhuma observação cadastrada.' }}</p>
                </div>
                <div class="px-6 pb-6">
                    <button
                        @click="closeObservationsModal"
                        class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();
const items = ref<any[]>([]);
const partners = ref<any[]>([]);
const costCenters = ref<any[]>([]);
const exchangeRatesCache = ref<Map<string, any>>(new Map());

const csvFileInput = ref<HTMLInputElement | null>(null);
const importingCSV = ref(false);
const exportingCSV = ref(false);

// Estados para busca de parceiros
const partnerSearchText = ref('');
const showPartnerDropdown = ref(false);

// Estados das tabelas
const isTable1Expanded = ref(true);
const isTable2Expanded = ref(false);

// Estados para ordenação
const sortKey1 = ref<string>('');
const sortOrder1 = ref<'asc' | 'desc'>('asc');
const sortKey2 = ref<string>('');
const sortOrder2 = ref<'asc' | 'desc'>('asc');

// Filtros
const filters = ref({
    partnerName: '',
    withdrawalDate: '',
    paymentMonthYear: ''
});

// Paginação
const currentPage1 = ref(1);
const currentPage2 = ref(1);
const itemsPerPage = 30;

// Modais
const showDialog = ref(false);
const showMarkAsPaidModal = ref(false);
const showObservationsModal = ref(false);
const observationsText = ref('');
const isEditing = ref(false);
const saving = ref(false);
const editingItem = ref<any>(null);
const markAsPaidItem = ref<any>(null);

const form = ref({
    commercialPartnerId: '',
    costCenterId: '',
    currency: 'BRL',
    invoiceAmount: 0,
    taxAmount: 0,
    discountAmount: 0,
    withdrawalDate: '',
    expectedPaymentMonth: new Date().getMonth() + 1,
    expectedPaymentYear: new Date().getFullYear(),
    effectivePaymentDate: '',
    status: 'Pendente',
    paidValue: null as number | null,
    paymentMethod: '' as string | null,
    observations: '' as string | null
});

const markAsPaidForm = ref({
    effectivePaymentDate: (() => {
        const today = new Date();
        const year = today.getUTCFullYear();
        const month = String(today.getUTCMonth() + 1).padStart(2, '0');
        const day = String(today.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })(),
    paidValue: 0
});

const taxPercentage = ref(0);
const taxPercentageInput = ref('0');

const todayDate = computed(() => {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    const day = String(today.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
});

// Filtrar itens
const filteredItems = computed(() => {
    let result = items.value;

    if (filters.value.partnerName) {
        const partnerNameLower = filters.value.partnerName.toLowerCase();
        result = result.filter(item => {
            const partnerName = getPartnerName(item.commercialPartnerId)?.toLowerCase() || '';
            return partnerName.includes(partnerNameLower);
        });
    }

    if (filters.value.withdrawalDate) {
        result = result.filter(item => {
            if (!item.withdrawalDate) return false;
            // Usar UTC para comparar datas
            const d = new Date(item.withdrawalDate);
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            const itemDate = `${year}-${month}-${day}`;
            return itemDate === filters.value.withdrawalDate;
        });
    }

    if (filters.value.paymentMonthYear) {
        const [filterYear, filterMonth] = filters.value.paymentMonthYear.split('-').map(Number);
        result = result.filter(item => {
            if (!item.effectivePaymentDate) return false;
            const d = new Date(item.effectivePaymentDate);
            const itemYear = d.getUTCFullYear();
            const itemMonth = d.getUTCMonth() + 1;
            return itemYear === filterYear && itemMonth === filterMonth;
        });
    }

    return result;
});

// Separar em duas tabelas
const currentMonth = computed(() => {
    const now = new Date();
    // Usar UTC para consistência com as datas armazenadas no backend
    return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
});

// Função auxiliar para ordenação
const sortItems = (items: any[], sortKey: string, sortOrder: 'asc' | 'desc') => {
    if (!sortKey) return items;
    
    return [...items].sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortKey) {
            case 'partner':
                aValue = getPartnerName(a.commercialPartnerId) || '';
                bValue = getPartnerName(b.commercialPartnerId) || '';
                break;
            case 'month':
                aValue = a.expectedPaymentMonth || '';
                bValue = b.expectedPaymentMonth || '';
                break;
            case 'invoiceAmount':
                aValue = a.invoiceAmount || 0;
                bValue = b.invoiceAmount || 0;
                break;
            case 'taxPercentage':
                aValue = calculateTaxPercentageNumber(a);
                bValue = calculateTaxPercentageNumber(b);
                break;
            case 'netValue':
                const discountA = a.discountAmount || 0;
                const discountB = b.discountAmount || 0;
                aValue = (a.invoiceAmount - a.taxAmount - discountA) || 0;
                bValue = (b.invoiceAmount - b.taxAmount - discountB) || 0;
                break;
            case 'paidValue':
                aValue = a.paidValue || 0;
                bValue = b.paidValue || 0;
                break;
            case 'status':
                aValue = a.status || '';
                bValue = b.status || '';
                break;
            case 'withdrawalDate':
                aValue = a.withdrawalDate ? new Date(a.withdrawalDate).getTime() : 0;
                bValue = b.withdrawalDate ? new Date(b.withdrawalDate).getTime() : 0;
                break;
            case 'effectivePaymentDate':
                aValue = a.effectivePaymentDate ? new Date(a.effectivePaymentDate).getTime() : 0;
                bValue = b.effectivePaymentDate ? new Date(b.effectivePaymentDate).getTime() : 0;
                break;
            default:
                return 0;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue, 'pt-BR');
            return sortOrder === 'asc' ? comparison : -comparison;
        }
        
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
    });
};

const calculateTaxPercentageNumber = (item: any): number => {
    if (!item.invoiceAmount || item.invoiceAmount === 0) return 0;
    return (item.taxAmount / item.invoiceAmount) * 100;
};

const filteredTable1 = computed(() => {
    let result = filteredItems.value.filter(item => {
        if (item.status === 'Pendente') return true;
        if (item.status === 'Pago' && item.effectivePaymentDate) {
            const paymentDate = new Date(item.effectivePaymentDate);
            // Usar UTC para consistência com as datas armazenadas no backend
            return paymentDate.getUTCMonth() + 1 === currentMonth.value.month &&
                   paymentDate.getUTCFullYear() === currentMonth.value.year;
        }
        return false;
    });
    
    return sortItems(result, sortKey1.value, sortOrder1.value);
});

const filteredTable2 = computed(() => {
    let result = filteredItems.value.filter(item => {
        if (item.status === 'Pago' && item.effectivePaymentDate) {
            const paymentDate = new Date(item.effectivePaymentDate);
            // Usar UTC para consistência com as datas armazenadas no backend
            return !(paymentDate.getUTCMonth() + 1 === currentMonth.value.month &&
                    paymentDate.getUTCFullYear() === currentMonth.value.year);
        }
        return false;
    });
    
    return sortItems(result, sortKey2.value, sortOrder2.value);
});

// Paginação
const paginatedTable1 = computed(() => {
    const start = (currentPage1.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTable1.value.slice(start, end);
});

const paginatedTable2 = computed(() => {
    const start = (currentPage2.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTable2.value.slice(start, end);
});

const totalPages1 = computed(() => Math.ceil(filteredTable1.value.length / itemsPerPage));
const totalPages2 = computed(() => Math.ceil(filteredTable2.value.length / itemsPerPage));

// Funções auxiliares
const getPartnerName = (id: string) => {
    const partner = partners.value.find(p => p.id === id);
    return partner?.name;
};

// Filtro de parceiros para busca
const filteredPartners = computed(() => {
    if (!partnerSearchText.value.trim()) {
        return partners.value;
    }
    const searchLower = partnerSearchText.value.toLowerCase().trim();
    return partners.value.filter((partner: any) =>
        partner.name?.toLowerCase().includes(searchLower)
    );
});

// Nome do parceiro selecionado
const selectedPartnerName = computed(() => {
    if (!form.value.commercialPartnerId) return '';
    const partner = partners.value.find(p => p.id === form.value.commercialPartnerId);
    return partner?.name || '';
});

// Selecionar parceiro (preenche tambem o centro de custo/Empresa atrelado ao parceiro)
const selectPartner = (partner: any) => {
    form.value.commercialPartnerId = partner.id;
    partnerSearchText.value = partner.name;
    if (partner.costCenterId) {
        form.value.costCenterId = partner.costCenterId;
    }
    showPartnerDropdown.value = false;
};

// Filtrar parceiros
const filterPartners = () => {
    showPartnerDropdown.value = true;
    // Se o campo de busca estiver vazio, limpar o parceiro selecionado
    if (!partnerSearchText.value.trim()) {
        form.value.commercialPartnerId = '';
    }
};

// Fechar dropdown quando perder foco (com delay para permitir clique)
const handlePartnerBlur = () => {
    setTimeout(() => {
        showPartnerDropdown.value = false;
    }, 200);
};

const getCostCenterName = (id: string) => {
    const costCenter = costCenters.value.find(c => c.id === id);
    return costCenter?.name;
};

// Obter métodos de pagamento do centro de custos
const getPaymentMethodsFromCostCenter = (costCenterId: string): Array<{ method: string; details: string }> => {
    const costCenter = costCenters.value.find(c => c.id === costCenterId);
    if (!costCenter || !costCenter.paymentMethods) return [];
    
    try {
        if (typeof costCenter.paymentMethods === 'string') {
            return JSON.parse(costCenter.paymentMethods);
        }
        return costCenter.paymentMethods;
    } catch (error) {
        console.error('Erro ao parsear métodos de pagamento:', error);
        return [];
    }
};

// Obter métodos de pagamento disponíveis para o centro de custos selecionado
const availablePaymentMethods = computed(() => {
    if (!form.value.costCenterId) return [];
    return getPaymentMethodsFromCostCenter(form.value.costCenterId);
});

// Formatar exibição dos métodos de pagamento
const getPaymentMethodsDisplay = (item: any): string => {
    // Se houver um método selecionado na ordem, exibir ele
    if (item.paymentMethod) {
        return item.paymentMethod;
    }
    
    // Caso contrário, exibir todos os métodos disponíveis do centro de custos
    const methods = getPaymentMethodsFromCostCenter(item.costCenterId);
    if (methods.length === 0) return '-';
    
    return methods.map(m => {
        if (m.details) {
            return `${m.method}: ${m.details}`;
        }
        return m.method;
    }).join(' | ');
};

const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency
    }).format(value);
};

const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    // Usar UTC para evitar problemas de timezone
    // A data está armazenada em UTC, então usamos getUTC* para formatar
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

const formatMonthReference = (monthStr: string) => {
    if (!monthStr) return '-';
    const parts = monthStr.split('-');
    if (parts.length === 2) {
        return `${parts[1]}/${parts[0]}`;
    }
    return monthStr;
};

const calculateTaxPercentage = (item: any) => {
    if (!item.invoiceAmount || item.invoiceAmount === 0) return '0.00';
    const percentage = (item.taxAmount / item.invoiceAmount) * 100;
    return percentage.toFixed(2);
};

// Função auxiliar para determinar qual data usar para buscar a taxa de câmbio
// Regra: Se status é "Pago" e tem effectivePaymentDate, usar effectivePaymentDate
//        Caso contrário, usar withdrawalDate (se disponível)
const getExchangeRateDate = (item: any): Date | undefined => {
    if (item.status === 'Pago' && item.effectivePaymentDate) {
        return new Date(item.effectivePaymentDate);
    }
    if (item.withdrawalDate) {
        return new Date(item.withdrawalDate);
    }
    return undefined;
};

// Buscar taxa de câmbio
const getExchangeRate = async (currencyPair: string, date?: Date) => {
    // Usar UTC para formatar a data da chave de cache
    const dateKey = date 
        ? (() => {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })()
        : 'latest';
    const cacheKey = `${currencyPair}-${dateKey}`;
    
    if (exchangeRatesCache.value.has(cacheKey)) {
        return exchangeRatesCache.value.get(cacheKey);
    }

    try {
        let rate = null;
        if (date) {
            // Primeiro tenta buscar pela data específica (usando UTC)
            const response = await client.exchangeRates.getByDate(currencyPair, dateKey);
            rate = response?.data;
            
            // Se não encontrou para a data específica, busca a mais recente
            if (!rate) {
                const latestResponse = await client.exchangeRates.getLatest(currencyPair);
                rate = latestResponse?.data;
                // Cache também com a chave 'latest' para reutilização
                if (rate) {
                    exchangeRatesCache.value.set(`${currencyPair}-latest`, rate);
                }
            }
        } else {
            const response = await client.exchangeRates.getLatest(currencyPair);
            rate = response?.data;
        }
        
        if (rate) {
            exchangeRatesCache.value.set(cacheKey, rate);
        }
        return rate;
    } catch (error) {
        console.error(`Erro ao buscar taxa de câmbio ${currencyPair}:`, error);
        return null;
    }
};

const getExchangeRateDisplay = (item: any) => {
    if (item.currency === 'BRL') return '-';
    const currencyPair = `${item.currency}-BRL`;
    // Usar a função auxiliar para determinar qual data usar
    const exchangeDate = getExchangeRateDate(item);
    const dateKey = exchangeDate
        ? (() => {
            const year = exchangeDate.getUTCFullYear();
            const month = String(exchangeDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(exchangeDate.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })()
        : 'latest';
    const rate = exchangeRatesCache.value.get(`${currencyPair}-${dateKey}`);
    if (!rate) return '-';
    return `R$ ${Number(rate.rate).toFixed(4)}`;
};

// Calcular valor líquido (função auxiliar, não usada diretamente no template)
const calculateNetValue = (item: any) => {
    const discountAmount = item.discountAmount || 0;
    const netValue = item.invoiceAmount - item.taxAmount - discountAmount;
    if (item.currency === 'BRL') return netValue;
    
    const currencyPair = `${item.currency}-BRL`;
    // Usar a função auxiliar para determinar qual data usar
    const exchangeDate = getExchangeRateDate(item);
    const dateKey = exchangeDate
        ? (() => {
            const year = exchangeDate.getUTCFullYear();
            const month = String(exchangeDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(exchangeDate.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })()
        : 'latest';
    const cacheKey = `${currencyPair}-${dateKey}`;
    const rate = exchangeRatesCache.value.get(cacheKey);
    
    if (!rate) return netValue;
    return netValue * Number(rate.rate);
};

const formatNetValue = (item: any) => {
    const discountAmount = item.discountAmount || 0;
    const netValue = item.invoiceAmount - item.taxAmount - discountAmount;
    if (item.currency === 'BRL') {
        return formatCurrency(netValue, 'BRL');
    }
    
    const currencyPair = `${item.currency}-BRL`;
    // Usar a função auxiliar para determinar qual data usar
    const exchangeDate = getExchangeRateDate(item);
    const dateKey = exchangeDate
        ? (() => {
            const year = exchangeDate.getUTCFullYear();
            const month = String(exchangeDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(exchangeDate.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })()
        : 'latest';
    const cacheKey = `${currencyPair}-${dateKey}`;
    const rate = exchangeRatesCache.value.get(cacheKey);
    
    if (!rate) {
        return formatCurrency(netValue, item.currency);
    }
    
    const convertedValue = netValue * Number(rate.rate);
    return formatCurrency(convertedValue, 'BRL');
};

const getNetValueColor = (item: any) => {
    if (item.withdrawalDate && !item.effectivePaymentDate) {
        return 'text-yellow-400';
    }
    return 'text-white';
};

const getNetValueTooltip = (item: any) => {
    if (item.withdrawalDate && !item.effectivePaymentDate) {
        return 'Valor temporário';
    }
    return '';
};

const formatPaidValue = (item: any) => {
    if (!item.paidValue) return '-';
    return formatCurrency(item.paidValue, 'BRL');
};

const getPaidValueColor = (item: any) => {
    if (!item.paidValue) return 'text-white';
    
    // Calcular valor líquido esperado (fatura - imposto - desconto)
    const discountAmount = item.discountAmount || 0;
    const netValue = item.invoiceAmount - item.taxAmount - discountAmount;
    let expectedNetValue = netValue;
    
    if (item.currency !== 'BRL') {
        const currencyPair = `${item.currency}-BRL`;
        // Usar a função auxiliar para determinar qual data usar
        const exchangeDate = getExchangeRateDate(item);
        const dateKey = exchangeDate
            ? (() => {
                const year = exchangeDate.getUTCFullYear();
                const month = String(exchangeDate.getUTCMonth() + 1).padStart(2, '0');
                const day = String(exchangeDate.getUTCDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            })()
            : 'latest';
        const cacheKey = `${currencyPair}-${dateKey}`;
        const rate = exchangeRatesCache.value.get(cacheKey);
        if (rate) {
            expectedNetValue = netValue * Number(rate.rate);
        }
    }
    
    const difference = Math.abs(item.paidValue - expectedNetValue);
    
    if (difference < 0.01) {
        return 'text-green-400';
    }
    return 'text-yellow-400';
};

// Carregar dados
const loadData = async () => {
    try {
        // Buscar todas as ordens sem limite
        const response = await client.paymentOrders.get({ limit: '10000' });
        items.value = response.data || [];
        
        // Carregar taxas de câmbio para todos os itens
        const ratePromises: Promise<any>[] = [];
        for (const item of items.value) {
            if (item.currency !== 'BRL') {
                const currencyPair = `${item.currency}-BRL`;
                // Usar a função auxiliar para determinar qual data usar
                const exchangeDate = getExchangeRateDate(item);
                ratePromises.push(getExchangeRate(currencyPair, exchangeDate));
            }
        }
        await Promise.all(ratePromises);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar ordens de pagamento.');
    }
};

const loadPartners = async () => {
    try {
        const response = await client.commercialPartners.getAll();
        let partnersList = response.data || [];
        // Ordenar parceiros alfabeticamente por padrão
        partnersList = partnersList.sort((a: any, b: any) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB, 'pt-BR');
        });
        partners.value = partnersList;
    } catch (error) {
        console.error('Erro ao carregar parceiros:', error);
        // Fallback para o método antigo se getAll falhar
        try {
            const fallbackResponse = await client.commercialPartners.get({ limit: '10000' });
            let partnersList = fallbackResponse.data || [];
            // Ordenar parceiros alfabeticamente por padrão
            partnersList = partnersList.sort((a: any, b: any) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB, 'pt-BR');
            });
            partners.value = partnersList;
        } catch (fallbackError) {
            console.error('Erro no fallback ao carregar parceiros:', fallbackError);
        }
    }
};

const loadCostCenters = async () => {
    try {
        const response = await client.costCenters.get({});
        costCenters.value = response.data || [];
    } catch (error) {
        console.error('Erro ao carregar centros de custos:', error);
    }
};

// Filtros
const clearFilters = () => {
    filters.value = {
        partnerName: '',
        withdrawalDate: '',
        paymentMonthYear: ''
    };
    currentPage1.value = 1;
    currentPage2.value = 1;
};

// Tabelas
const toggleTable1 = () => {
    isTable1Expanded.value = !isTable1Expanded.value;
};

const toggleTable2 = () => {
    isTable2Expanded.value = !isTable2Expanded.value;
};

// Funções de ordenação
const toggleSort1 = (key: string) => {
    if (sortKey1.value === key) {
        sortOrder1.value = sortOrder1.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey1.value = key;
        sortOrder1.value = 'asc';
    }
    currentPage1.value = 1; // Resetar para primeira página ao ordenar
};

const toggleSort2 = (key: string) => {
    if (sortKey2.value === key) {
        sortOrder2.value = sortOrder2.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey2.value = key;
        sortOrder2.value = 'asc';
    }
    currentPage2.value = 1; // Resetar para primeira página ao ordenar
};

// Modais
const triggerImportCSV = () => {
    csvFileInput.value?.click();
};

const escapeCSVCell = (val: string | number | null | undefined): string => {
    const s = val === null || val === undefined ? '' : String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
};

const formatDateForCSV = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseExpectedPaymentMonth = (monthStr: string | null | undefined): { month: number; year: number } => {
    if (!monthStr) return { month: 1, year: new Date().getFullYear() };
    const parts = monthStr.split('-').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { year: parts[0], month: parts[1] };
    }
    return { month: 1, year: new Date().getFullYear() };
};

const exportToCSV = () => {
    const list = filteredItems.value;
    if (list.length === 0) {
        alert('Nao ha dados para exportar. Ajuste os filtros ou cadastre ordens.');
        return;
    }
    exportingCSV.value = true;
    try {
        const header = 'parceiroComercial,centroCusto,currency,invoiceAmount,taxPercentage,discountAmount,withdrawalDate,expectedPaymentMonth,expectedPaymentYear,effectivePaymentDate,status,paidValue,paymentMethod';
        const rows = list.map(item => {
            const taxPct = item.invoiceAmount ? (item.taxAmount || 0) / item.invoiceAmount * 100 : 0;
            const { month: expMonth, year: expYear } = parseExpectedPaymentMonth(item.expectedPaymentMonth);
            const cells = [
                escapeCSVCell(getPartnerName(item.commercialPartnerId) ?? ''),
                escapeCSVCell(getCostCenterName(item.costCenterId) ?? ''),
                escapeCSVCell(item.currency || 'BRL'),
                escapeCSVCell(item.invoiceAmount ?? ''),
                escapeCSVCell(taxPct.toFixed(2)),
                escapeCSVCell(item.discountAmount ?? 0),
                escapeCSVCell(formatDateForCSV(item.withdrawalDate)),
                escapeCSVCell(expMonth),
                escapeCSVCell(expYear),
                escapeCSVCell(formatDateForCSV(item.effectivePaymentDate)),
                escapeCSVCell(item.status || 'Pendente'),
                escapeCSVCell(item.paidValue ?? ''),
                escapeCSVCell(item.paymentMethod ?? '')
            ];
            return cells.join(',');
        });
        const csv = [header, ...rows].join('\r\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        a.download = `payment-orders-${dateStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err: any) {
        console.error('Erro ao exportar CSV:', err);
        alert('Erro ao exportar CSV: ' + (err?.message || String(err)));
    } finally {
        exportingCSV.value = false;
    }
};

const handleImportCSVFile = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Selecione um arquivo CSV.');
        target.value = '';
        return;
    }
    importingCSV.value = true;
    target.value = '';
    try {
        const text = await file.text();
        const res = await client.paymentOrders.importCSV(text);
        const data = res?.data ?? res?.result?.data ?? res;
        const imported = data?.imported ?? 0;
        const errors = data?.errors ?? [];
        await loadData();
        let msg = `Importacao concluida.\nOrdens criadas: ${imported}`;
        if (errors.length > 0) {
            msg += `\n\nErros (${errors.length}):\n${errors.slice(0, 10).join('\n')}`;
            if (errors.length > 10) msg += '\n...';
        }
        alert(msg);
    } catch (err: any) {
        console.error('Erro ao importar CSV:', err);
        alert('Erro ao importar CSV: ' + (err?.message || String(err)));
    } finally {
        importingCSV.value = false;
    }
};

const openAddDialog = () => {
    isEditing.value = false;
    editingItem.value = null;
    taxPercentage.value = 0;
    taxPercentageInput.value = '0';
    partnerSearchText.value = '';
    showPartnerDropdown.value = false;
    form.value = {
        commercialPartnerId: '',
        costCenterId: '',
        currency: 'BRL',
        invoiceAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        withdrawalDate: '',
        expectedPaymentMonth: new Date().getMonth() + 1,
        expectedPaymentYear: new Date().getFullYear(),
        effectivePaymentDate: '',
        status: 'Pendente',
        paidValue: null,
        paymentMethod: null,
        observations: null
    };
    showDialog.value = true;
};

const editItem = (item: any) => {
    isEditing.value = true;
    editingItem.value = item;
    
    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();
    if (item.expectedPaymentMonth) {
        const parts = item.expectedPaymentMonth.split('-');
        if (parts.length === 2) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
        }
    }
    
    const invoiceAmount = item.invoiceAmount || 0;
    const taxAmount = item.taxAmount || 0;
    taxPercentage.value = invoiceAmount > 0 ? (taxAmount / invoiceAmount) * 100 : 0;
    taxPercentageInput.value = taxPercentage.value.toFixed(2).replace('.', ',');
    
    const partnerId = item.commercialPartnerId || '';
    const selectedPartner = partners.value.find(p => p.id === partnerId);
    partnerSearchText.value = selectedPartner?.name || '';
    showPartnerDropdown.value = false;
    
    form.value = {
        commercialPartnerId: partnerId,
        costCenterId: item.costCenterId || '',
        currency: item.currency || 'BRL',
        invoiceAmount,
        taxAmount,
        discountAmount: item.discountAmount || 0,
        withdrawalDate: item.withdrawalDate ? (() => {
            const d = new Date(item.withdrawalDate);
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })() : '',
        expectedPaymentMonth: month,
        expectedPaymentYear: year,
        effectivePaymentDate: item.effectivePaymentDate ? (() => {
            const d = new Date(item.effectivePaymentDate);
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })() : '',
        status: item.status || 'Pendente',
        paidValue: item.paidValue || null,
        paymentMethod: item.paymentMethod || null,
        observations: item.observations || null
    };
    showDialog.value = true;
};

const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    editingItem.value = null;
    taxPercentage.value = 0;
    taxPercentageInput.value = '0';
    partnerSearchText.value = '';
    showPartnerDropdown.value = false;
    form.value = {
        commercialPartnerId: '',
        costCenterId: '',
        currency: 'BRL',
        invoiceAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        withdrawalDate: '',
        expectedPaymentMonth: new Date().getMonth() + 1,
        expectedPaymentYear: new Date().getFullYear(),
        effectivePaymentDate: '',
        status: 'Pendente',
        paidValue: null,
        paymentMethod: null,
        observations: null
    };
};

const markAsPaid = async (item: any) => {
    markAsPaidItem.value = item;
    
    // Calcular valor líquido padrão (fatura - imposto - desconto)
    const discountAmount = item.discountAmount || 0;
    const netValue = item.invoiceAmount - item.taxAmount - discountAmount;
    let defaultPaidValue = netValue;
    
    if (item.currency !== 'BRL') {
        const currencyPair = `${item.currency}-BRL`;
        // Tentar buscar taxa da data atual, senão usar a mais recente
        const rate = await getExchangeRate(currencyPair, new Date());
        if (rate) {
            defaultPaidValue = netValue * Number(rate.rate);
        } else {
            // Se não encontrou para hoje, buscar a mais recente
            const latestRate = await getExchangeRate(currencyPair);
            if (latestRate) {
                defaultPaidValue = netValue * Number(latestRate.rate);
            }
        }
    }
    
    // Usar UTC para criar a data de hoje
    const today = new Date();
    const todayYear = today.getUTCFullYear();
    const todayMonth = String(today.getUTCMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getUTCDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
    
    markAsPaidForm.value = {
        effectivePaymentDate: todayStr,
        paidValue: Number(defaultPaidValue.toFixed(2))
    };
    showMarkAsPaidModal.value = true;
};

const closeMarkAsPaidModal = () => {
    showMarkAsPaidModal.value = false;
    markAsPaidItem.value = null;
};

const viewObservations = (observations: string) => {
    observationsText.value = observations || '';
    showObservationsModal.value = true;
};

const closeObservationsModal = () => {
    showObservationsModal.value = false;
    observationsText.value = '';
};

const confirmMarkAsPaid = async () => {
    if (!markAsPaidItem.value) return;
    
    saving.value = true;
    try {
        await client.paymentOrders.updateStatus(markAsPaidItem.value.id, {
            status: 'Pago',
            effectivePaymentDate: markAsPaidForm.value.effectivePaymentDate,
            paidValue: markAsPaidForm.value.paidValue
        });
        await loadData();
        closeMarkAsPaidModal();
    } catch (error: any) {
        console.error('Erro ao marcar como pago:', error);
        alert(`Erro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        saving.value = false;
    }
};

// Função para obter opções de moeda baseado na moeda selecionada
const getCurrencyOptions = () => {
    const currency = form.value.currency;
    
    if (currency === 'BRL') {
        return {
            currency: 'BRL',
            locale: 'pt-BR',
            precision: 2,
            autoDecimalDigits: true,
            useGrouping: true,
            accountingSign: false,
            valueAsInteger: false
        };
    } else if (currency === 'USD') {
        return {
            currency: 'USD',
            locale: 'en-US',
            precision: 2,
            autoDecimalDigits: true,
            useGrouping: true,
            accountingSign: false,
            valueAsInteger: false
        };
    } else if (currency === 'EUR') {
        return {
            currency: 'EUR',
            locale: 'de-DE',
            precision: 2,
            autoDecimalDigits: true,
            useGrouping: true,
            accountingSign: false,
            valueAsInteger: false
        };
    }
    
    return {
        currency: 'BRL',
        locale: 'pt-BR',
        precision: 2,
        autoDecimalDigits: true,
        useGrouping: true,
        accountingSign: false,
        valueAsInteger: false
    };
};

// Handler para keydown no campo de moeda - bloqueia letras
const handleCurrencyKeydown = (event: KeyboardEvent) => {
    const key = event.key;
    const currency = form.value.currency;
    
    // Permitir teclas de controle (Backspace, Delete, Tab, Arrow keys, etc.)
    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
        return;
    }
    
    // Permitir Ctrl/Cmd + A, C, V, X (copiar, colar, selecionar tudo, cortar)
    if (event.ctrlKey || event.metaKey) {
        if (['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
            return;
        }
    }
    
    // Para BRL: permitir apenas números e vírgula
    if (currency === 'BRL') {
        if (!/[\d,]/.test(key)) {
            event.preventDefault();
            return;
        }
        // Se for vírgula, verificar se já existe uma no campo
        if (key === ',') {
            const input = event.target as HTMLInputElement;
            if (input.value.includes(',')) {
                event.preventDefault();
                return;
            }
        }
    } else {
        // Para USD/EUR: permitir apenas números e ponto
        if (!/[\d.]/.test(key)) {
            event.preventDefault();
            return;
        }
        // Se for ponto, verificar se já existe um no campo
        if (key === '.') {
            const input = event.target as HTMLInputElement;
            if (input.value.includes('.')) {
                event.preventDefault();
                return;
            }
        }
    }
};

// Handler para input no campo de moeda - apenas calcula o imposto
// O vue-currency-input já faz a formatação, então apenas validamos se há letras
const handleCurrencyInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Verificar se há letras no valor (após formatação do vue-currency-input)
    // Se houver, remover e atualizar
    const hasLetters = /[a-zA-Z]/.test(value);
    if (hasLetters) {
        // Remover letras e manter apenas números e separadores
        const currency = form.value.currency;
        let cleaned = value;
        
        if (currency === 'BRL') {
            cleaned = cleaned.replace(/[^\d,]/g, '');
        } else {
            cleaned = cleaned.replace(/[^\d.]/g, '');
        }
        
        // Se o valor foi alterado, atualizar
        if (cleaned !== value) {
            input.value = cleaned;
            // Forçar atualização do vue-currency-input
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    // Calcular imposto
    calculateTaxFromInvoice();
};

// Handler para paste no campo de moeda - filtra apenas números
const handleCurrencyPaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    
    // Remover todos os caracteres não numéricos exceto ponto e vírgula
    // Para BRL (pt-BR): aceita vírgula como separador decimal
    // Para USD/EUR: aceita ponto como separador decimal
    const currency = form.value.currency;
    let cleanedText = pastedText;
    
    if (currency === 'BRL') {
        // Para BRL: remover tudo exceto números e vírgula
        cleanedText = cleanedText.replace(/[^\d,]/g, '');
        // Garantir apenas uma vírgula
        const parts = cleanedText.split(',');
        if (parts.length > 2) {
            cleanedText = parts[0] + ',' + parts.slice(1).join('');
        }
        // Limitar a 2 casas decimais após a vírgula
        if (parts.length === 2 && parts[1].length > 2) {
            cleanedText = parts[0] + ',' + parts[1].substring(0, 2);
        }
    } else {
        // Para USD/EUR: remover tudo exceto números e ponto
        cleanedText = cleanedText.replace(/[^\d.]/g, '');
        // Garantir apenas um ponto
        const parts = cleanedText.split('.');
        if (parts.length > 2) {
            cleanedText = parts[0] + '.' + parts.slice(1).join('');
        }
        // Limitar a 2 casas decimais após o ponto
        if (parts.length === 2 && parts[1].length > 2) {
            cleanedText = parts[0] + '.' + parts[1].substring(0, 2);
        }
    }
    
    // Se não houver nada válido, não fazer nada
    if (!cleanedText || cleanedText === '' || cleanedText === ',' || cleanedText === '.') {
        return;
    }
    
    // Converter para número e atualizar o campo
    let numericValue: number;
    if (currency === 'BRL') {
        numericValue = parseFloat(cleanedText.replace(',', '.')) || 0;
    } else {
        numericValue = parseFloat(cleanedText) || 0;
    }
    
    // Atualizar o valor do formulário
    form.value.invoiceAmount = numericValue;
    
    // Disparar evento de input para atualizar a formatação
    const input = event.target as HTMLInputElement;
    if (input) {
        // Forçar atualização do vue-currency-input
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Calcular imposto se necessário
    calculateTaxFromInvoice();
};


// Função auxiliar para converter valor formatado para número
const parseCurrencyValue = (value: any): number => {
    // Se já for número, retornar diretamente
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
    }
    
    // Se for null, undefined ou vazio, retornar 0
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    
    // Se não for string, tentar converter
    if (typeof value !== 'string') {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }
    
    const currency = form.value.currency;
    
    // Remover símbolos de moeda e espaços
    let cleaned = value.replace(/[^\d,.-]/g, '');
    
    // Se não sobrou nada, retornar 0
    if (!cleaned || cleaned === '' || cleaned === ',' || cleaned === '.') {
        return 0;
    }
    
    if (currency === 'BRL') {
        // Para BRL: remover pontos (separadores de milhar) e substituir vírgula por ponto
        // Exemplo: "1.234,56" -> "1234.56"
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
        // Para USD/EUR: remover vírgulas (separadores de milhar) e manter ponto
        // Exemplo: "1,234.56" -> "1234.56"
        cleaned = cleaned.replace(/,/g, '');
    }
    
    const numValue = parseFloat(cleaned);
    return isNaN(numValue) ? 0 : numValue;
};

// Cálculos no formulário
const calculateTaxFromInvoice = () => {
    // Converter o valor formatado para número
    const invoiceAmount = parseCurrencyValue(form.value.invoiceAmount);
    
    if (invoiceAmount > 0 && taxPercentage.value) {
        form.value.taxAmount = (invoiceAmount * taxPercentage.value) / 100;
        // Atualizar o input formatado
        taxPercentageInput.value = taxPercentage.value.toFixed(2).replace('.', ',');
    } else {
        form.value.taxAmount = 0;
    }
};

// Calcular valor líquido (fatura - imposto - desconto)
const calculateNetAmount = (): number => {
    const invoiceAmount = parseCurrencyValue(form.value.invoiceAmount);
    const taxAmount = form.value.taxAmount || 0;
    const discountAmount = parseCurrencyValue(form.value.discountAmount);
    return Math.max(0, invoiceAmount - taxAmount - discountAmount);
};

// Handler para input no campo de desconto
const handleDiscountInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Verificar se há letras no valor (após formatação do vue-currency-input)
    const hasLetters = /[a-zA-Z]/.test(value);
    if (hasLetters) {
        // Remover letras e manter apenas números e separadores
        const currency = form.value.currency;
        let cleaned = value;
        
        if (currency === 'BRL') {
            cleaned = cleaned.replace(/[^\d,]/g, '');
        } else {
            cleaned = cleaned.replace(/[^\d.]/g, '');
        }
        
        // Se o valor foi alterado, atualizar
        if (cleaned !== value) {
            input.value = cleaned;
            // Forçar atualização do vue-currency-input
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
};

// Handler para paste no campo de desconto
const handleDiscountPaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    
    const currency = form.value.currency;
    let cleanedText = pastedText;
    
    if (currency === 'BRL') {
        cleanedText = cleanedText.replace(/[^\d,]/g, '');
        const parts = cleanedText.split(',');
        if (parts.length > 2) {
            cleanedText = parts[0] + ',' + parts.slice(1).join('');
        }
        if (parts.length === 2 && parts[1].length > 2) {
            cleanedText = parts[0] + ',' + parts[1].substring(0, 2);
        }
    } else {
        cleanedText = cleanedText.replace(/[^\d.]/g, '');
        const parts = cleanedText.split('.');
        if (parts.length > 2) {
            cleanedText = parts[0] + '.' + parts.slice(1).join('');
        }
        if (parts.length === 2 && parts[1].length > 2) {
            cleanedText = parts[0] + '.' + parts[1].substring(0, 2);
        }
    }
    
    if (!cleanedText || cleanedText === '' || cleanedText === ',' || cleanedText === '.') {
        return;
    }
    
    let numericValue: number;
    if (currency === 'BRL') {
        numericValue = parseFloat(cleanedText.replace(',', '.')) || 0;
    } else {
        numericValue = parseFloat(cleanedText) || 0;
    }
    
    form.value.discountAmount = numericValue;
    
    const input = event.target as HTMLInputElement;
    if (input) {
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

const handleTaxPercentageInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Substituir vírgula por ponto para processamento
    value = value.replace(',', '.');
    
    // Remover caracteres não numéricos exceto ponto
    value = value.replace(/[^\d.]/g, '');
    
    // Garantir apenas um ponto decimal
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limitar a 100
    const numValue = parseFloat(value) || 0;
    if (numValue > 100) {
        value = '100';
    }
    
    // Atualizar o valor numérico
    taxPercentage.value = parseFloat(value) || 0;
    
    // Atualizar o input com formatação (vírgula)
    const displayValue = value.replace('.', ',');
    taxPercentageInput.value = displayValue;
    
    // Calcular imposto
    const invoiceAmount = parseCurrencyValue(form.value.invoiceAmount);
    if (invoiceAmount > 0 && taxPercentage.value) {
        form.value.taxAmount = (invoiceAmount * taxPercentage.value) / 100;
    }
};

const calculateTaxFromPercentage = () => {
    const invoiceAmount = parseCurrencyValue(form.value.invoiceAmount);
    if (invoiceAmount > 0 && taxPercentage.value) {
        form.value.taxAmount = (invoiceAmount * taxPercentage.value) / 100;
    } else if (invoiceAmount > 0 && form.value.taxAmount) {
        taxPercentage.value = (form.value.taxAmount / invoiceAmount) * 100;
        taxPercentageInput.value = taxPercentage.value.toFixed(2).replace('.', ',');
    }
};

const saveOrder = async () => {
    // Validar parceiro selecionado
    if (!form.value.commercialPartnerId) {
        alert('Por favor, selecione um parceiro.');
        return;
    }
    
    saving.value = true;
    try {
        const payload: any = {
            commercialPartnerId: form.value.commercialPartnerId,
            costCenterId: form.value.costCenterId,
            currency: form.value.currency,
            invoiceAmount: parseCurrencyValue(form.value.invoiceAmount),
            taxPercentage: Number(taxPercentage.value) || 0,
            discountAmount: parseCurrencyValue(form.value.discountAmount),
            withdrawalDate: form.value.withdrawalDate || null,
            expectedPaymentMonth: Number(form.value.expectedPaymentMonth),
            expectedPaymentYear: Number(form.value.expectedPaymentYear),
            status: form.value.status
        };

        if (form.value.effectivePaymentDate) {
            payload.effectivePaymentDate = form.value.effectivePaymentDate;
        }

        if (form.value.paidValue !== null) {
            payload.paidValue = form.value.paidValue;
        }

        if (form.value.paymentMethod) {
            payload.paymentMethod = form.value.paymentMethod;
        }

        if (form.value.observations !== null && form.value.observations !== undefined) {
            payload.observations = form.value.observations || null;
        }

        if (isEditing.value && editingItem.value) {
            await client.paymentOrders.update(editingItem.value.id, payload);
        } else {
            await client.paymentOrders.insert(payload);
        }

        await loadData();
        closeDialog();
        clearFilters();
    } catch (error: any) {
        console.error('Erro ao salvar ordem:', error);
        alert(`Erro: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        saving.value = false;
    }
};

const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ordem de pagamento?')) return;
    try {
        await client.paymentOrders.delete(id);
        await loadData();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir ordem.');
    }
};

// Resetar paginação quando filtros mudarem
watch(() => filters.value.partnerName, () => {
    currentPage1.value = 1;
    currentPage2.value = 1;
});

watch(() => filters.value.withdrawalDate, () => {
    currentPage1.value = 1;
    currentPage2.value = 1;
});

watch(() => filters.value.paymentMonthYear, () => {
    currentPage1.value = 1;
    currentPage2.value = 1;
});

// Resetar método de pagamento quando centro de custos mudar
watch(() => form.value.costCenterId, () => {
    form.value.paymentMethod = null;
});

// O CurrencyInput atualiza automaticamente quando a moeda muda através das opções

// Sincronizar campo de busca e centro de custo quando o parceiro mudar
watch(() => form.value.commercialPartnerId, (newId) => {
    if (!newId) {
        if (partnerSearchText.value) partnerSearchText.value = '';
    } else {
        const partner = partners.value.find(p => p.id === newId);
        if (partner) {
            if (!partnerSearchText.value) partnerSearchText.value = partner.name;
            if (partner.costCenterId) form.value.costCenterId = partner.costCenterId;
        }
    }
});

onMounted(() => {
    loadData();
    loadPartners();
    loadCostCenters();
});
</script>
