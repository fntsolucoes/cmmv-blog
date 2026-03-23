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
                <template v-if="canBulkUpdate">
                    <button
                        type="button"
                        @click="triggerBulkUpdateCSV"
                        :disabled="updatingBulkCSV"
                        class="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {{ updatingBulkCSV ? 'Atualizando...' : 'Update em lote' }}
                    </button>
                    <input
                        ref="bulkUpdateFileInput"
                        type="file"
                        accept=".csv"
                        class="hidden"
                        @change="handleBulkUpdateCSVFile"
                    />
                    <button
                        type="button"
                        @click="recalculateAllTaxes"
                        :disabled="recalculatingTaxes"
                        class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {{ recalculatingTaxes ? 'Recalculando...' : 'Recalcular Impostos' }}
                    </button>
                </template>
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
                                <span :class="item.status === 'Pago' ? 'bg-green-500' : item.status === 'Em litígio' ? 'bg-red-500' : 'bg-yellow-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                    {{ item.status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(item.withdrawalDate) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(item.effectivePaymentDate) }}</td>
                            <td class="px-4 py-3 text-sm font-medium">
                                <div class="flex items-center gap-2">
                                    <a
                                        v-if="(item.invoice_attachment || item.invoiceAttachment)"
                                        :href="(item.invoice_attachment || item.invoiceAttachment)"
                                        target="_blank"
                                        rel="noopener"
                                        class="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                                        title="Abrir nota fiscal (PDF)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </a>
                                    <button
                                        v-else
                                        @click="openAttachPdfModal(item)"
                                        class="text-amber-400 hover:text-amber-300 transition-colors p-1 rounded hover:bg-amber-400/10"
                                        title="Upload pendente - anexar PDF"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </button>
                                    <button
                                        v-if="item.status === 'Pendente' || item.status === 'Em litígio'"
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
                                <span :class="item.status === 'Pago' ? 'bg-green-500' : item.status === 'Em litígio' ? 'bg-red-500' : 'bg-yellow-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                    {{ item.status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(item.withdrawalDate) }}</td>
                            <td class="px-4 py-3 text-sm text-white">{{ formatDate(item.effectivePaymentDate) }}</td>
                            <td class="px-4 py-3 text-sm font-medium">
                                <div class="flex items-center gap-2">
                                    <a
                                        v-if="(item.invoice_attachment || item.invoiceAttachment)"
                                        :href="(item.invoice_attachment || item.invoiceAttachment)"
                                        target="_blank"
                                        rel="noopener"
                                        class="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                                        title="Abrir nota fiscal (PDF)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </a>
                                    <button
                                        v-else
                                        @click="openAttachPdfModal(item)"
                                        class="text-amber-400 hover:text-amber-300 transition-colors p-1 rounded hover:bg-amber-400/10"
                                        title="Upload pendente - anexar PDF"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-xs mx-auto">
                <div class="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Marcar como Pago</h3>
                    <button @click="closeMarkAsPaidModal" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form @submit.prevent="confirmMarkAsPaid" class="p-4 space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">
                            Data de Pagamento <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="markAsPaidForm.effectivePaymentDate"
                            type="date"
                            required
                            :max="todayDate"
                            class="w-full max-w-[180px] px-2 py-1.5 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            @change="loadMarkAsPaidExchangeRate"
                        />
                        <p v-if="markAsPaidItem?.currency && markAsPaidItem.currency !== 'BRL'" class="mt-1 text-xs text-neutral-400">
                            <span v-if="markAsPaidRateLoading">Carregando cotação...</span>
                            <template v-else-if="markAsPaidExchangeRate">
                                Cotação {{ markAsPaidItem.currency }}-BRL {{ markAsPaidRateIsFromDate ? '(data do pagamento)' : '(última no sistema)' }}: 1 {{ markAsPaidItem.currency }} = R$ {{ formatRateNumber(markAsPaidExchangeRate.rate) }}
                            </template>
                            <span v-else class="text-yellow-500">Sem cotação cadastrada</span>
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Centro de custo da nota</label>
                        <select
                            v-model="markAsPaidForm.costCenterId"
                            required
                            class="w-full max-w-[180px] px-2 py-1.5 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Selecione</option>
                            <option v-for="cc in costCenters" :key="cc.id" :value="cc.id">{{ truncateCostCenterName(cc.name) }}</option>
                        </select>
                        <p class="mt-0.5 text-xs text-neutral-400">Confirme ou altere o centro de custo</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">CNAE da nota</label>
                        <select
                            v-model="markAsPaidForm.invoiceCnae"
                            class="w-full max-w-[180px] px-2 py-1.5 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Selecione (principal)</option>
                            <option v-for="c in cnaeList" :key="c.id" :value="c.code">{{ truncateCnaeLabel(c) }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">
                            Percentual de imposto (%) <span class="text-red-500">*</span>
                        </label>
                        <div class="flex items-center gap-2">
                            <input
                                v-model.number="markAsPaidForm.taxPercentage"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                required
                                placeholder="0"
                                :disabled="markAsPaidTaxLocked"
                                :class="markAsPaidTaxLocked ? 'bg-neutral-600 border-neutral-500 cursor-not-allowed opacity-70' : 'bg-neutral-700 border-neutral-600'"
                                class="w-full max-w-[180px] px-2 py-1.5 text-sm rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button
                                v-if="markAsPaidNeedsTaxRecalc"
                                type="button"
                                @click="runMarkAsPaidTaxCalc"
                                :disabled="markAsPaidTaxCalcLoading || !markAsPaidForm.costCenterId || (Number(markAsPaidForm.grossValue) || 0) <= 0"
                                class="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Recalcular imposto pelo motor tributário"
                            >
                                {{ markAsPaidTaxCalcLoading ? '...' : 'Recalcular' }}
                            </button>
                        </div>
                        <p v-if="markAsPaidTaxLocked" class="mt-0.5 text-xs text-amber-400">Imposto calculado pelo motor tributário.</p>
                        <p v-else class="mt-0.5 text-xs text-neutral-400">Confirme a % de imposto aplicada na nota</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">
                            Valor bruto da nota
                            <strong v-if="markAsPaidItem?.currency && markAsPaidItem.currency !== 'BRL'" class="text-white ml-1">({{ markAsPaidItem.currency }})</strong>
                            <span class="text-red-500"> *</span>
                        </label>
                        <input
                            v-model.number="markAsPaidForm.grossValue"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            class="w-full max-w-[180px] px-2 py-1.5 text-sm bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Valor líquido <span class="text-neutral-400 font-normal">(em Real)</span></label>
                        <div
                            class="w-full max-w-[180px] px-2 py-1.5 text-sm bg-neutral-600 border border-neutral-500 rounded-md text-white font-medium"
                        >
                            {{ formatMarkAsPaidNetValueInBRL(markAsPaidForm.grossValue, markAsPaidForm.taxPercentage, markAsPaidItem?.currency) }}
                        </div>
                        <p class="mt-0.5 text-xs text-neutral-400">Atualiza ao alterar imposto ou valor bruto</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Nota Fiscal (PDF)</label>
                        <input ref="invoicePdfFileInput" type="file" accept="application/pdf" class="hidden" @change="handleInvoicePdfFileChange" />
                        <div v-if="!markAsPaidForm.invoiceAttachment" class="border-2 border-dashed border-neutral-600 rounded-lg p-3 text-center hover:border-neutral-500 transition-colors">
                            <button type="button" @click="invoicePdfFileInput?.click()" :disabled="invoiceUploading" class="w-full flex flex-col items-center justify-center py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-neutral-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span class="text-xs text-neutral-400">{{ invoiceUploading ? 'Enviando...' : 'Clique para anexar (opcional)' }}</span>
                            </button>
                        </div>
                        <div v-else class="bg-neutral-700 rounded-lg p-2 flex items-center justify-between">
                            <div class="flex items-center min-w-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <div class="min-w-0">
                                    <p class="text-xs text-white truncate max-w-[160px]">{{ (markAsPaidForm.invoiceAttachment || '').split('/').pop() }}</p>
                                    <a :href="markAsPaidForm.invoiceAttachment" target="_blank" rel="noopener" class="text-xs text-blue-400 hover:text-blue-300">Abrir PDF</a>
                                </div>
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                                <button type="button" @click="invoicePdfFileInput?.click()" :disabled="invoiceUploading" class="p-1 text-neutral-400 hover:text-white" title="Trocar arquivo">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                                <button type="button" @click="removeInvoiceAttachment" class="p-1 text-red-400 hover:text-red-300" title="Remover">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-3 border-t border-neutral-700">
                        <button
                            type="button"
                            @click="closeMarkAsPaidModal"
                            class="px-3 py-1.5 text-sm font-medium text-neutral-300 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            :disabled="saving"
                            class="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

        <!-- Modal: Anexar PDF (upload pendente) -->
        <div v-if="showAttachPdfModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-sm">
                <div class="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Anexar nota fiscal (PDF)</h3>
                    <button @click="closeAttachPdfModal" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-4 space-y-3">
                    <input ref="attachPdfFileInput" type="file" accept="application/pdf" class="hidden" @change="handleAttachPdfFileChange" />
                    <div v-if="!attachPdfForm.invoiceAttachment" class="border-2 border-dashed border-neutral-600 rounded-lg p-4 text-center hover:border-neutral-500 transition-colors">
                        <button type="button" @click="attachPdfFileInput?.click()" :disabled="attachPdfUploading" class="w-full flex flex-col items-center justify-center py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span class="text-sm text-neutral-400">{{ attachPdfUploading ? 'Enviando...' : 'Clique para selecionar o PDF' }}</span>
                        </button>
                    </div>
                    <div v-else class="bg-neutral-700 rounded-lg p-3 flex items-center justify-between">
                        <div class="min-w-0">
                            <p class="text-sm text-white truncate max-w-[200px]">{{ (attachPdfForm.invoiceAttachment || '').split('/').pop() }}</p>
                            <a :href="attachPdfForm.invoiceAttachment" target="_blank" rel="noopener" class="text-xs text-blue-400 hover:text-blue-300">Abrir PDF</a>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button type="button" @click="attachPdfFileInput?.click()" :disabled="attachPdfUploading" class="p-1.5 text-neutral-400 hover:text-white" title="Trocar">&#8634;</button>
                            <button type="button" @click="attachPdfForm.invoiceAttachment = ''" class="p-1.5 text-red-400 hover:text-red-300" title="Remover">&#215;</button>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" @click="closeAttachPdfModal" class="px-3 py-1.5 text-sm font-medium text-neutral-300 bg-neutral-700 hover:bg-neutral-600 rounded-md">Cancelar</button>
                        <button type="button" @click="saveAttachPdf" :disabled="savingAttachPdf || !attachPdfForm.invoiceAttachment" class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ savingAttachPdf ? 'Salvando...' : 'Salvar' }}
                        </button>
                    </div>
                </div>
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
                            <label class="block text-sm font-medium text-neutral-300 mb-2">CNAE da nota</label>
                            <select
                                v-model="form.invoiceCnae"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecione (default: principal)</option>
                                <option v-for="c in cnaeList" :key="c.id" :value="c.code">{{ c.code }} - {{ c.denominacao }}</option>
                            </select>
                            <p class="mt-1 text-xs text-neutral-400">Default: CNAE principal da empresa. Altere se a nota for de outro CNAE.</p>
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
                                <option value="Em litígio">Em litígio</option>
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
                                Mês de referência da nota
                            </label>
                            <input
                                v-model="form.mes_referencia_nota"
                                type="month"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p class="mt-1 text-xs text-amber-400">Influencia o cálculo do IRPJ adicional (Lucro Presumido).</p>
                        </div>
                        <div class="col-span-2 p-3 bg-neutral-700/50 rounded-lg border border-neutral-600">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-neutral-300">Motor tributário</span>
                                <button
                                    type="button"
                                    :disabled="!form.costCenterId || taxCalcLoading || parseCurrencyValue(form.invoiceAmount) <= 0"
                                    @click="runTaxCalc"
                                    class="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {{ taxCalcLoading ? 'Calculando...' : 'Calcular impostos' }}
                                </button>
                            </div>
                            <p v-if="taxCalcResult" class="text-xs text-neutral-400 space-y-0.5">
                                <span class="block">Bruto: {{ formatCurrency(taxCalcResult.gross, form.currency) }}</span>
                                <span v-for="d in taxCalcResult.deductions" :key="d.name" class="block">- {{ d.name }}<template v-if="d.percent != null"> ({{ d.percent.toFixed(2).replace('.', ',') }}%)</template>: {{ formatCurrency(d.amount, form.currency) }}</span>
                                <span class="block font-medium text-white">Líquido: {{ formatCurrency(taxCalcResult.liquid, form.currency) }}</span>
                            </p>
                            <p v-else class="text-xs text-neutral-500">Selecione empresa e valor e clique em Calcular impostos.</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-300 mb-2">
                                Natureza do Rendimento (Reinf)
                            </label>
                            <input
                                v-model="form.natureza_rendimento"
                                type="text"
                                placeholder="Ex: 13001 (serviços TI)"
                                class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p class="mt-1 text-xs text-neutral-400">Código exigido pelo governo para envio Reinf.</p>
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
                            <label class="block text-sm font-medium text-neutral-300 mb-2">Nota Fiscal (PDF)</label>
                            <input ref="formInvoicePdfFileInput" type="file" accept="application/pdf" class="hidden" @change="handleFormInvoicePdfFileChange" />
                            <div v-if="!form.invoiceAttachment" class="border-2 border-dashed border-neutral-600 rounded-lg p-3 text-center hover:border-neutral-500 transition-colors">
                                <button type="button" @click="formInvoicePdfFileInput?.click()" :disabled="formInvoiceUploading" class="w-full flex flex-col items-center justify-center py-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-neutral-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span class="text-xs text-neutral-400">{{ formInvoiceUploading ? 'Enviando...' : 'Clique para anexar PDF (opcional)' }}</span>
                                </button>
                            </div>
                            <div v-else class="bg-neutral-700 rounded-lg p-3 flex items-center justify-between">
                                <div class="min-w-0">
                                    <p class="text-sm text-white truncate max-w-[220px]">{{ (form.invoiceAttachment || '').split('/').pop() }}</p>
                                    <a :href="form.invoiceAttachment" target="_blank" rel="noopener" class="text-xs text-blue-400 hover:text-blue-300">Abrir PDF</a>
                                </div>
                                <div class="flex items-center gap-1 shrink-0">
                                    <button type="button" @click="formInvoicePdfFileInput?.click()" :disabled="formInvoiceUploading" class="p-1.5 text-neutral-400 hover:text-white" title="Trocar">&#8634;</button>
                                    <button type="button" @click="form.invoiceAttachment = ''" class="p-1.5 text-red-400 hover:text-red-300" title="Remover">&#215;</button>
                                </div>
                            </div>
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
const cnaeList = ref<Array<{ id: string; code: string; denominacao: string; annex_code?: string }>>([]);
const exchangeRatesCache = ref<Map<string, any>>(new Map());

const csvFileInput = ref<HTMLInputElement | null>(null);
const importingCSV = ref(false);
const exportingCSV = ref(false);
const canBulkUpdate = ref(false);
const updatingBulkCSV = ref(false);
const recalculatingTaxes = ref(false);
const bulkUpdateFileInput = ref<HTMLInputElement | null>(null);

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
    observations: '' as string | null,
    natureza_rendimento: '' as string | null,
    mes_referencia_nota: '' as string | null,
    invoiceCnae: '' as string,
    invoiceAttachment: '' as string
});
const formInvoicePdfFileInput = ref<HTMLInputElement | null>(null);
const formInvoiceUploading = ref(false);

const taxCalcResult = ref<{ gross: number; deductions: Array<{ name: string; amount: number; percent?: number }>; totalDeductions: number; liquid: number } | null>(null);
const taxCalcLoading = ref(false);

const markAsPaidForm = ref({
    effectivePaymentDate: (() => {
        const today = new Date();
        const year = today.getUTCFullYear();
        const month = String(today.getUTCMonth() + 1).padStart(2, '0');
        const day = String(today.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })(),
    costCenterId: '',
    invoiceCnae: '' as string,
    taxPercentage: 0,
    grossValue: 0 as number,
    invoiceAttachment: '' as string
});

const invoicePdfFileInput = ref<HTMLInputElement | null>(null);
const invoiceUploading = ref(false);

const showAttachPdfModal = ref(false);
const attachPdfItem = ref<any>(null);
const attachPdfForm = ref({ invoiceAttachment: '' as string });
const attachPdfFileInput = ref<HTMLInputElement | null>(null);
const attachPdfUploading = ref(false);
const savingAttachPdf = ref(false);

const markAsPaidTaxLocked = computed(() => {
    const engineUsed = markAsPaidItem.value?.tax_engine_used === true || markAsPaidItem.value?.tax_engine_used === 1;
    if (!engineUsed) return false;
    // Destrava se o usuario escolheu outro centro de custo
    const originalCc = markAsPaidItem.value?.costCenterId || '';
    const currentCc = markAsPaidForm.value.costCenterId || '';
    return currentCc === originalCc;
});

const markAsPaidOriginal = ref({
    costCenterId: '',
    invoiceCnae: '' as string
});

const markAsPaidNeedsTaxRecalc = computed(() => {
    if (!showMarkAsPaidModal.value) return false;
    const originalCc = markAsPaidOriginal.value.costCenterId || '';
    const currentCc = markAsPaidForm.value.costCenterId || '';
    const originalCnae = (markAsPaidOriginal.value.invoiceCnae || '').trim();
    const currentCnae = (markAsPaidForm.value.invoiceCnae || '').trim();
    return originalCc !== currentCc || originalCnae !== currentCnae;
});

const markAsPaidTaxCalcLoading = ref(false);

const markAsPaidExchangeRate = ref<{ rate: number } | null>(null);
const markAsPaidRateIsFromDate = ref(false);
const markAsPaidRateLoading = ref(false);

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
        if (item.status === 'Em litígio') return true; // Em litígio sempre fica nas notas abertas
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

const loadCnaeList = async () => {
    try {
        const res = await client.simplesNacionalCnae.get({});
        cnaeList.value = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
    } catch (_) {
        cnaeList.value = [];
    }
};

const getCnaePrincipalFromCostCenter = (cc: any): string => {
    if (!cc?.cnpjDetails) return '';
    try {
        const d = typeof cc.cnpjDetails === 'string' ? JSON.parse(cc.cnpjDetails) : cc.cnpjDetails;
        return (d?.cnaePrincipal ?? '').trim();
    } catch (_) {
        return '';
    }
};

const MAX_CNAE_LABEL_LENGTH = 32;
const truncateCnaeLabel = (c: { code: string; denominacao: string }, maxLen: number = MAX_CNAE_LABEL_LENGTH): string => {
    const part = `${c.code} - ${c.denominacao || ''}`.trim();
    if (part.length <= maxLen) return part;
    return part.slice(0, maxLen - 3) + '...';
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

const DB_EXPORT_COLUMNS = [
    'id', 'commercialPartnerId', 'currency', 'costCenterId', 'invoiceAmount', 'taxAmount', 'discountAmount',
    'withdrawalDate', 'expectedPaymentMonth', 'effectivePaymentDate', 'paidValue', 'status', 'paymentMethod',
    'finalizedForProfitSharingAt', 'createdAt', 'updatedAt'
] as const;

const formatValueForDBExport = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

const exportToCSV = () => {
    const list = filteredItems.value;
    if (list.length === 0) {
        alert('Não há dados para exportar. Ajuste os filtros ou carregue as ordens.');
        return;
    }
    exportingCSV.value = true;
    try {
        const header = DB_EXPORT_COLUMNS.join(',');
        const rows = list.map((item: any) => {
            const cells = DB_EXPORT_COLUMNS.map(col => {
                const raw = item[col];
                const str = formatValueForDBExport(raw);
                return escapeCSVCell(str);
            });
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

const triggerBulkUpdateCSV = () => {
    bulkUpdateFileInput.value?.click();
};

const handleBulkUpdateCSVFile = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Selecione um arquivo CSV no formato do export.');
        target.value = '';
        return;
    }
    updatingBulkCSV.value = true;
    target.value = '';
    try {
        const text = await file.text();
        const res = await client.paymentOrders.updateBulkCSV(text);
        const data = res?.data ?? res?.result?.data ?? res;
        const updated = data?.updated ?? 0;
        const errors = data?.errors ?? [];
        await loadData();
        let msg = `Atualização em lote concluída.\nRegistros atualizados: ${updated}`;
        if (errors.length > 0) {
            msg += `\n\nErros (${errors.length}):\n${errors.slice(0, 10).join('\n')}`;
            if (errors.length > 10) msg += '\n...';
        }
        alert(msg);
    } catch (err: any) {
        console.error('Erro no update em lote:', err);
        alert('Erro na atualização em lote: ' + (err?.message || String(err)) + '\nApenas usuário root pode executar.');
    } finally {
        updatingBulkCSV.value = false;
    }
};

const recalculateAllTaxes = async () => {
    if (!confirm('Deseja recalcular os impostos de todas as ordens em aberto que utilizam o motor tributário?')) return;
    recalculatingTaxes.value = true;
    try {
        const res = await client.paymentOrders.recalculateTaxes();
        const data = res?.data ?? res?.result ?? res;
        const recalculated = data?.recalculated ?? 0;
        const errors = data?.errors ?? [];
        await loadData();
        let msg = `Recálculo concluído.\nOrdens recalculadas: ${recalculated}`;
        if (errors.length > 0) {
            msg += `\n\nErros (${errors.length}):\n${errors.slice(0, 10).join('\n')}`;
            if (errors.length > 10) msg += '\n...';
        }
        alert(msg);
    } catch (err: any) {
        console.error('Erro ao recalcular impostos:', err);
        alert('Erro ao recalcular impostos: ' + (err?.message || String(err)));
    } finally {
        recalculatingTaxes.value = false;
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
        let msg = `Importação concluída.\nOrdens criadas: ${imported}`;
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
        observations: null,
        natureza_rendimento: null,
        mes_referencia_nota: null,
        invoiceCnae: '',
        invoiceAttachment: ''
    };
    taxCalcResult.value = null;
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
        paymentMethod: (item.paymentMethod ?? item.payment_method ?? null) || null,
        observations: item.observations || null,
        natureza_rendimento: item.natureza_rendimento ?? null,
        mes_referencia_nota: item.mes_referencia_nota ?? item.mesReferenciaNota ?? null,
        invoiceCnae: (item.invoice_cnae && String(item.invoice_cnae).trim()) || getCnaePrincipalFromCostCenter(costCenters.value.find((c: any) => c.id === (item.costCenterId || ''))) || '',
        invoiceAttachment: (item.invoice_attachment || item.invoiceAttachment || '').trim()
    };

    // Restaurar dados do motor tributario se existirem
    if (item.tax_calc_details) {
        try {
            const parsed = typeof item.tax_calc_details === 'string'
                ? JSON.parse(item.tax_calc_details)
                : item.tax_calc_details;
            if (parsed && typeof parsed.gross === 'number') {
                taxCalcResult.value = parsed;
            } else {
                taxCalcResult.value = null;
            }
        } catch (_) {
            taxCalcResult.value = null;
        }
    } else {
        taxCalcResult.value = null;
    }

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
        observations: null,
        natureza_rendimento: null,
        mes_referencia_nota: null,
        invoiceCnae: '',
        invoiceAttachment: ''
    };
    taxCalcResult.value = null;
};

const loadMarkAsPaidExchangeRate = async () => {
    const item = markAsPaidItem.value;
    const currency = item?.currency;
    if (!currency || currency === 'BRL') {
        markAsPaidExchangeRate.value = null;
        markAsPaidRateIsFromDate.value = false;
        return;
    }
    markAsPaidRateLoading.value = true;
    markAsPaidExchangeRate.value = null;
    try {
        const dateStr = markAsPaidForm.value.effectivePaymentDate;
        const dateKey = dateStr ? dateStr : null;
        const currencyPair = `${currency}-BRL`;
        let rate = null;
        let isFromDate = false;
        if (dateKey) {
            try {
                const res = await client.exchangeRates.getByDate(currencyPair, dateKey);
                rate = res?.data;
                if (rate) isFromDate = true;
            } catch (_) {}
        }
        if (!rate) {
            const latestRes = await client.exchangeRates.getLatest(currencyPair);
            rate = latestRes?.data;
        }
        markAsPaidExchangeRate.value = rate && typeof rate.rate !== 'undefined' ? { rate: Number(rate.rate) } : null;
        markAsPaidRateIsFromDate.value = isFromDate;
    } catch (e) {
        console.error('Erro ao carregar cotacao:', e);
        markAsPaidExchangeRate.value = null;
    } finally {
        markAsPaidRateLoading.value = false;
    }
};

const getMarkAsPaidReferenceMonth = () => {
    const item = markAsPaidItem.value;
    const y = Number(item?.expectedPaymentYear) || 0;
    const m = Number(item?.expectedPaymentMonth) || 0;
    if (y > 0 && m >= 1 && m <= 12) {
        return `${y}-${String(m).padStart(2, '0')}`;
    }
    const dateStr = String(markAsPaidForm.value.effectivePaymentDate || '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr.slice(0, 7);
    }
    const today = new Date();
    const todayYear = today.getUTCFullYear();
    const todayMonth = String(today.getUTCMonth() + 1).padStart(2, '0');
    return `${todayYear}-${todayMonth}`;
};

const runMarkAsPaidTaxCalc = async () => {
    if (!markAsPaidItem.value) return;
    const costCenterId = markAsPaidForm.value.costCenterId;
    const gross = Number(markAsPaidForm.value.grossValue) || 0;
    if (!costCenterId || gross <= 0) return;

    markAsPaidTaxCalcLoading.value = true;
    try {
        const referenceMonth = getMarkAsPaidReferenceMonth();
        const itemMesRef = markAsPaidItem.value?.mes_referencia_nota || markAsPaidItem.value?.mesReferenciaNota || undefined;
        const res = await client.taxCalc.calculate({
            costCenterId,
            grossAmount: gross,
            referenceMonth,
            orderId: markAsPaidItem.value.id,
            invoiceCnae: (markAsPaidForm.value.invoiceCnae && String(markAsPaidForm.value.invoiceCnae).trim()) || undefined,
            mesReferenciaNota: itemMesRef
        });
        const data = res?.data ?? res;
        if (data && typeof data.totalDeductions === 'number') {
            const pct = gross > 0 ? ((Number(data.totalDeductions) || 0) / gross) * 100 : 0;
            markAsPaidForm.value.taxPercentage = Number(pct.toFixed(2));
            markAsPaidOriginal.value = {
                costCenterId: costCenterId || '',
                invoiceCnae: (markAsPaidForm.value.invoiceCnae || '').trim()
            };
        } else {
            alert('Não foi possível recalcular os impostos. Tente novamente.');
        }
    } catch (e: any) {
        console.error('Erro ao recalcular impostos (marcar como pago):', e);
        alert(e?.response?.data?.message || e?.message || 'Erro ao recalcular impostos.');
    } finally {
        markAsPaidTaxCalcLoading.value = false;
    }
};

const markAsPaid = async (item: any) => {
    markAsPaidItem.value = item;
    
    const invoiceAmount = Number(item.invoiceAmount) || 0;
    const taxAmount = Number(item.taxAmount) || 0;
    const taxPct = invoiceAmount > 0 ? (taxAmount / invoiceAmount) * 100 : 0;
    
    const today = new Date();
    const todayYear = today.getUTCFullYear();
    const todayMonth = String(today.getUTCMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getUTCDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
    
    const ccId = item.costCenterId || '';
    const cc = costCenters.value.find(c => c.id === ccId);
    const defaultCnae = (item.invoice_cnae && String(item.invoice_cnae).trim()) || getCnaePrincipalFromCostCenter(cc) || '';
    
    markAsPaidForm.value = {
        effectivePaymentDate: todayStr,
        costCenterId: ccId,
        invoiceCnae: defaultCnae,
        taxPercentage: Number(taxPct.toFixed(2)),
        grossValue: invoiceAmount,
        invoiceAttachment: (item.invoice_attachment || item.invoiceAttachment || '').trim()
    };
    markAsPaidOriginal.value = {
        costCenterId: ccId,
        invoiceCnae: defaultCnae
    };
    markAsPaidExchangeRate.value = null;
    markAsPaidRateIsFromDate.value = false;
    showMarkAsPaidModal.value = true;
    loadMarkAsPaidExchangeRate();
};

const closeMarkAsPaidModal = () => {
    showMarkAsPaidModal.value = false;
    markAsPaidItem.value = null;
    markAsPaidOriginal.value = { costCenterId: '', invoiceCnae: '' };
    markAsPaidExchangeRate.value = null;
    markAsPaidRateIsFromDate.value = false;
    markAsPaidForm.value.invoiceAttachment = '';
};

const handleInvoicePdfFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.type !== 'application/pdf') {
        input.value = '';
        return;
    }
    invoiceUploading.value = true;
    try {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const res = await client.medias.uploadPdf({ pdf: base64, alt: file.name });
        const data = res?.data ?? res;
        if (data?.url) {
            markAsPaidForm.value.invoiceAttachment = data.url;
        } else {
            alert('Falha ao enviar PDF. Tente novamente.');
        }
    } catch (e: any) {
        console.error('Erro ao enviar PDF:', e);
        alert(e?.response?.data?.message || e?.message || 'Erro ao enviar PDF.');
    } finally {
        invoiceUploading.value = false;
        input.value = '';
    }
};

const removeInvoiceAttachment = () => {
    markAsPaidForm.value.invoiceAttachment = '';
};

const openAttachPdfModal = (item: any) => {
    attachPdfItem.value = item;
    attachPdfForm.value.invoiceAttachment = (item.invoice_attachment || item.invoiceAttachment || '').trim();
    showAttachPdfModal.value = true;
};

const closeAttachPdfModal = () => {
    showAttachPdfModal.value = false;
    attachPdfItem.value = null;
    attachPdfForm.value.invoiceAttachment = '';
};

const handleAttachPdfFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.type !== 'application/pdf') {
        input.value = '';
        return;
    }
    attachPdfUploading.value = true;
    try {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const res = await client.medias.uploadPdf({ pdf: base64, alt: file.name });
        const data = res?.data ?? res;
        if (data?.url) {
            attachPdfForm.value.invoiceAttachment = data.url;
        } else {
            alert('Falha ao enviar PDF. Tente novamente.');
        }
    } catch (e: any) {
        console.error('Erro ao enviar PDF:', e);
        alert(e?.response?.data?.message || e?.message || 'Erro ao enviar PDF.');
    } finally {
        attachPdfUploading.value = false;
        input.value = '';
    }
};

const handleFormInvoicePdfFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.type !== 'application/pdf') {
        input.value = '';
        return;
    }
    formInvoiceUploading.value = true;
    try {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const res = await client.medias.uploadPdf({ pdf: base64, alt: file.name });
        const data = res?.data ?? res;
        if (data?.url) {
            form.value.invoiceAttachment = data.url;
        } else {
            alert('Falha ao enviar PDF. Tente novamente.');
        }
    } catch (e: any) {
        console.error('Erro ao enviar PDF:', e);
        alert(e?.response?.data?.message || e?.message || 'Erro ao enviar PDF.');
    } finally {
        formInvoiceUploading.value = false;
        input.value = '';
    }
};

const saveAttachPdf = async () => {
    if (!attachPdfItem.value?.id || !attachPdfForm.value.invoiceAttachment) return;
    savingAttachPdf.value = true;
    try {
        await client.paymentOrders.update(attachPdfItem.value.id, { invoice_attachment: attachPdfForm.value.invoiceAttachment });
        await loadData();
        closeAttachPdfModal();
    } catch (e: any) {
        console.error('Erro ao salvar PDF:', e);
        alert(e?.response?.data?.message || e?.message || 'Erro ao salvar.');
    } finally {
        savingAttachPdf.value = false;
    }
};

watch(() => markAsPaidForm.value.costCenterId, (newVal) => {
    if (!showMarkAsPaidModal.value) return;
    const cc = costCenters.value.find(c => c.id === newVal);
    if (cc) {
        const principal = getCnaePrincipalFromCostCenter(cc);
        if (principal) markAsPaidForm.value.invoiceCnae = principal;
    }
});

const viewObservations = (observations: string) => {
    observationsText.value = observations || '';
    showObservationsModal.value = true;
};

const closeObservationsModal = () => {
    showObservationsModal.value = false;
    observationsText.value = '';
};

const MAX_COST_CENTER_DISPLAY_LENGTH = 40;
const truncateCostCenterName = (name: string | undefined): string => {
    if (!name || !name.trim()) return '-';
    const s = name.trim();
    if (s.length <= MAX_COST_CENTER_DISPLAY_LENGTH) return s;
    return s.slice(0, MAX_COST_CENTER_DISPLAY_LENGTH - 3) + '...';
};

const formatRateNumber = (rate: number): string => {
    return Number(rate).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
};

const formatMarkAsPaidNetValue = (gross: number, taxPct: number, currency?: string): string => {
    const g = Number(gross) || 0;
    const p = Number(taxPct) || 0;
    const net = g - (g * (p / 100));
    const num = Number(net).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const c = (currency || 'BRL').toUpperCase();
    if (c === 'BRL') return 'R$ ' + num;
    return c + ' ' + num;
};

const formatMarkAsPaidNetValueInBRL = (gross: number, taxPct: number, currency?: string): string => {
    const g = Number(gross) || 0;
    const p = Number(taxPct) || 0;
    const net = g - (g * (p / 100));
    const c = (currency || 'BRL').toUpperCase();
    if (c === 'BRL') {
        return 'R$ ' + Number(net).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (markAsPaidRateLoading.value) return 'Carregando...';
    if (!markAsPaidExchangeRate.value) return formatMarkAsPaidNetValue(g, p, c) + ' (sem cotação para R$)';
    const netBRL = net * Number(markAsPaidExchangeRate.value.rate);
    return 'R$ ' + Number(netBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const confirmMarkAsPaid = async () => {
    if (!markAsPaidItem.value) return;
    
    const currency = (markAsPaidItem.value.currency || 'BRL').toUpperCase();
    if (currency !== 'BRL' && !markAsPaidExchangeRate.value) {
        alert('Para moeda estrangeira é necessário ter cotação carregada. Altere a data de pagamento ou cadastre a cotação.');
        return;
    }
    
    const gross = Number(markAsPaidForm.value.grossValue) || 0;
    const taxPct = Number(markAsPaidForm.value.taxPercentage) || 0;
    let paidValue = gross - (gross * (taxPct / 100));
    if (currency !== 'BRL' && markAsPaidExchangeRate.value) {
        paidValue = paidValue * Number(markAsPaidExchangeRate.value.rate);
    }
    const orderId = markAsPaidItem.value.id;
    
    saving.value = true;
    try {
        const updates: Record<string, any> = {};
        if (markAsPaidForm.value.costCenterId && markAsPaidForm.value.costCenterId !== markAsPaidItem.value.costCenterId) {
            updates.costCenterId = markAsPaidForm.value.costCenterId;
        }
        const newCnae = (markAsPaidForm.value.invoiceCnae || '').trim() || null;
        const oldCnae = (markAsPaidItem.value.invoice_cnae || '').trim() || null;
        if (newCnae !== oldCnae) {
            updates.invoice_cnae = newCnae;
        }
        if (Object.keys(updates).length > 0) {
            await client.paymentOrders.update(orderId, updates);
        }
        await client.paymentOrders.updateStatus(orderId, {
            status: 'Pago',
            effectivePaymentDate: markAsPaidForm.value.effectivePaymentDate,
            paidValue: Number(paidValue.toFixed(2)),
            invoiceAttachment: (markAsPaidForm.value.invoiceAttachment || '').trim() || undefined
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
    
    if (form.value.withdrawalDate) {
        const wd = new Date(form.value.withdrawalDate + 'T12:00:00Z');
        const now = new Date();
        const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        if (wd.getTime() > todayEnd.getTime()) {
            alert('A Data de Saque não pode ser uma data futura.');
            return;
        }
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
            status: form.value.status,
            tax_engine_used: taxCalcResult.value != null ? 1 : 0,
            tax_calc_details: taxCalcResult.value != null ? JSON.stringify(taxCalcResult.value) : null
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

        if (form.value.natureza_rendimento != null && form.value.natureza_rendimento !== '') {
            payload.natureza_rendimento = form.value.natureza_rendimento.trim() || null;
        }
        if (form.value.mes_referencia_nota != null && form.value.mes_referencia_nota !== '') {
            payload.mes_referencia_nota = form.value.mes_referencia_nota || null;
        }
        if (form.value.invoiceCnae != null && form.value.invoiceCnae !== '') {
            payload.invoice_cnae = form.value.invoiceCnae.trim() || null;
        }
        if (form.value.invoiceAttachment) {
            payload.invoice_attachment = form.value.invoiceAttachment.trim() || null;
        }

        if (isEditing.value && editingItem.value) {
            await client.paymentOrders.update(editingItem.value.id, payload);
        } else {
            await client.paymentOrders.insert(payload);
        }

        await loadData();
        closeDialog();
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

// Resetar método de pagamento e default CNAE só quando o usuario trocar de empresa (nao ao abrir edicao/criar)
watch(() => form.value.costCenterId, (newVal, oldVal) => {
    const userSwitchedCc = oldVal && newVal && oldVal !== newVal;
    if (userSwitchedCc) {
        form.value.paymentMethod = null;
        taxCalcResult.value = null;
        const cc = costCenters.value.find(c => c.id === newVal);
        if (cc) {
            const principal = getCnaePrincipalFromCostCenter(cc);
            if (principal) form.value.invoiceCnae = principal;
        }
    }
});

const runTaxCalc = async () => {
    const costCenterId = form.value.costCenterId;
    const gross = parseCurrencyValue(form.value.invoiceAmount);
    if (!costCenterId || gross <= 0) return;
    taxCalcLoading.value = true;
    taxCalcResult.value = null;
    try {
        const refMonth = `${form.value.expectedPaymentYear}-${String(form.value.expectedPaymentMonth).padStart(2, '0')}`;
        const res = await client.taxCalc.calculate({
            costCenterId,
            grossAmount: gross,
            referenceMonth: refMonth,
            orderId: isEditing.value && editingItem.value ? editingItem.value.id : undefined,
            invoiceCnae: (form.value.invoiceCnae && String(form.value.invoiceCnae).trim()) || undefined,
            mesReferenciaNota: form.value.mes_referencia_nota || undefined
        });
        const data = res?.data ?? res;
        if (data && typeof data.gross === 'number') {
            taxCalcResult.value = data;
            form.value.taxAmount = data.totalDeductions ?? 0;
            taxPercentage.value = gross > 0 ? ((data.totalDeductions ?? 0) / gross) * 100 : 0;
            taxPercentageInput.value = taxPercentage.value.toFixed(2).replace('.', ',');
        }
    } catch (e) {
        console.error('Erro ao calcular impostos:', e);
        taxCalcResult.value = null;
    } finally {
        taxCalcLoading.value = false;
    }
};

// O CurrencyInput atualiza automaticamente quando a moeda muda através das opções

// Sincronizar campo de busca quando o parceiro mudar; preencher empresa so quando estiver vazia (nao sobrescrever escolha manual ou ordem em edicao)
watch(() => form.value.commercialPartnerId, (newId) => {
    if (!newId) {
        if (partnerSearchText.value) partnerSearchText.value = '';
    } else {
        const partner = partners.value.find(p => p.id === newId);
        if (partner) {
            if (!partnerSearchText.value) partnerSearchText.value = partner.name;
            if (partner.costCenterId && !form.value.costCenterId) form.value.costCenterId = partner.costCenterId;
        }
    }
});

onMounted(async () => {
    loadData();
    loadPartners();
    loadCostCenters();
    loadCnaeList();
    try {
        const res = await client.paymentOrders.canBulkUpdate();
        const data = res?.data ?? res?.result ?? res;
        canBulkUpdate.value = !!(data?.canBulkUpdate === true || (res?.status === 200 && data?.canBulkUpdate !== false));
    } catch {
        canBulkUpdate.value = false;
    }
});
</script>
