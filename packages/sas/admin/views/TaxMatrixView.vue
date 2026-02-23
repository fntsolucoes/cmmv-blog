<template>
    <div class="space-y-8">
        <h1 class="text-2xl font-bold text-white">Matriz de Configuração de Impostos</h1>

        <!-- ISS por Municipio (fora do agrupamento por CC) -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="px-6 py-3 bg-neutral-700 flex flex-wrap items-center justify-between gap-2">
                <h2 class="text-sm font-medium text-white">Alíquotas de ISS por Município</h2>
                <button @click="openAddIss" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md">Novo Município</button>
            </div>
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Município</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">UF</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">ISS (%)</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="issList.length === 0">
                        <td colspan="4" class="px-6 py-4 text-center text-sm text-neutral-400">Nenhum município cadastrado.</td>
                    </tr>
                    <tr v-for="m in issList" :key="m.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-3 text-sm text-white">{{ m.municipality }}</td>
                        <td class="px-6 py-3 text-sm text-neutral-300">{{ m.uf }}</td>
                        <td class="px-6 py-3 text-sm text-neutral-300">{{ formatNum(m.percent) }}</td>
                        <td class="px-6 py-3">
                            <button @click="openEditIss(m)" class="text-blue-400 hover:text-blue-300 text-sm mr-2">Editar</button>
                            <button @click="deleteIss(m.id)" class="text-red-400 hover:text-red-300 text-sm">Excluir</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Impostos por Centro de Custo -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="px-6 py-3 bg-neutral-700 border-b border-neutral-600">
                <h2 class="text-sm font-medium text-white">Impostos por Centro de Custo</h2>
                <p class="text-xs text-neutral-400 mt-1">Cada centro de custo possui suas próprias alíquotas de impostos, configuradas de acordo com o regime tributário.</p>
            </div>

            <div v-if="activeCostCenters.length === 0" class="px-6 py-4 text-center text-sm text-neutral-400">
                Nenhum centro de custo ativo cadastrado.
            </div>

            <div v-for="cc in activeCostCenters" :key="cc.id" class="border-b border-neutral-700 last:border-b-0">
                <!-- Header do CC (clicavel) -->
                <button
                    @click="toggleCostCenter(cc.id)"
                    class="w-full px-6 py-3 flex items-center justify-between hover:bg-neutral-700/50 transition-colors text-left"
                >
                    <div class="flex items-center gap-3 min-w-0">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200"
                            :class="{ 'rotate-90': expandedCostCenter === cc.id }"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <div class="min-w-0">
                            <span class="text-sm font-medium text-white block truncate">{{ cc.name }}</span>
                            <span class="text-xs text-neutral-500">{{ cc.identifier }}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 ml-3">
                        <span class="px-2 py-0.5 text-xs rounded-full bg-neutral-600 text-neutral-300">{{ getRegimeName(cc) }}</span>
                    </div>
                </button>

                <!-- Conteudo expandido -->
                <div v-if="expandedCostCenter === cc.id" class="px-6 pb-4 space-y-4">
                    <p v-if="ccRulesLoading[cc.id]" class="text-xs text-neutral-500 py-2">Carregando regras...</p>

                    <!-- Resumo dos impostos aplicaveis (read-only) -->
                    <div>
                        <h4 class="text-xs font-medium text-neutral-400 uppercase mb-2">Impostos aplicáveis</h4>
                        <table class="min-w-full divide-y divide-neutral-700 rounded overflow-hidden">
                            <thead class="bg-neutral-700/50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Imposto</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Alíquota</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Observação</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-700/50">
                                <tr v-for="(tax, idx) in getTaxSummary(cc)" :key="idx" class="hover:bg-neutral-700/30">
                                    <td class="px-4 py-2 text-sm text-white">{{ tax.name || '-' }}</td>
                                    <td class="px-4 py-2 text-sm text-neutral-300">{{ tax.percent || '-' }}</td>
                                    <td class="px-4 py-2 text-xs text-neutral-500">{{ tax.obs }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Regras editaveis deste CC -->
                    <div v-if="getApplicableRules(cc).length > 0">
                        <h4 class="text-xs font-medium text-neutral-400 uppercase mb-2">Regras de impostos (editável)</h4>
                        <p class="text-xs text-neutral-500 mb-2">Alterações aqui afetam somente este centro de custo.</p>
                        <table class="min-w-full divide-y divide-neutral-700 rounded overflow-hidden">
                            <thead class="bg-neutral-700/50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Regra</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Alíquota (%)</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Valor mínimo / Limite (R$)</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Ativo</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-700/50">
                                <tr v-for="r in getApplicableRules(cc)" :key="r.id" class="hover:bg-neutral-700/30">
                                    <td class="px-4 py-2 text-sm text-white">{{ r.tax_name }}</td>
                                    <td class="px-4 py-2 text-sm text-neutral-300">{{ formatNum(r.percentage) }}</td>
                                    <td class="px-4 py-2 text-sm text-neutral-300">{{ r.min_threshold != null ? formatCurrency(r.min_threshold) : '-' }}</td>
                                    <td class="px-4 py-2">
                                        <span :class="r.active ? 'bg-green-500' : 'bg-neutral-500'" class="px-2 py-0.5 text-xs rounded-full text-white">{{ r.active ? 'Sim' : 'Não' }}</span>
                                    </td>
                                    <td class="px-4 py-2">
                                        <button @click="openEditRule(r)" class="text-blue-400 hover:text-blue-300 text-xs">Editar</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Simples Nacional: Faturamento mensal e Fator R -->
                    <template v-if="getRegimeCode(cc) === 'SIMPLES_NACIONAL'">
                        <div>
                            <div class="flex items-center justify-between gap-2 mb-2">
                                <div>
                                    <h4 class="text-xs font-medium text-neutral-400 uppercase">Faturamento mensal bruto (RBT12)</h4>
                                    <p class="text-xs text-neutral-500 mt-0.5">RBT12 = soma dos últimos 12 meses (excl. mês atual). Empresa nova: média x 12.</p>
                                </div>
                                <button type="button" @click="openAddRevenueModal(cc.id)" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md shrink-0">Adicionar valor</button>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-neutral-700 rounded overflow-hidden">
                                    <thead class="bg-neutral-700/50">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Mês</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Faturamento (R$)</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-700/50">
                                        <tr v-for="row in getRevenueRowsPaginated(cc.id)" :key="row.id" class="hover:bg-neutral-700/30">
                                            <td class="px-4 py-2 text-sm text-white">{{ monthLabel(row.year, row.month) }}</td>
                                            <td class="px-4 py-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    :value="row.gross_revenue"
                                                    @blur="saveRevenueRow(cc.id, row.id, row.year, row.month, ($event.target as HTMLInputElement).value)"
                                                    class="w-32 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm"
                                                />
                                            </td>
                                        </tr>
                                        <tr v-if="getRevenueRows(cc.id).length === 0">
                                            <td colspan="2" class="px-4 py-3 text-center text-sm text-neutral-500">Nenhum mês cadastrado. Clique em Adicionar valor.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-if="totalRevenuePages(cc.id) > 1" class="flex items-center justify-between mt-2 px-1 text-sm text-neutral-400">
                                <button type="button" @click="revenuePage = Math.max(1, revenuePage - 1)" :disabled="revenuePage <= 1" class="px-2 py-1 rounded hover:bg-neutral-700 disabled:opacity-50">Anterior</button>
                                <span>Página {{ revenuePage }} de {{ totalRevenuePages(cc.id) }}</span>
                                <button type="button" @click="revenuePage = Math.min(totalRevenuePages(cc.id), revenuePage + 1)" :disabled="revenuePage >= totalRevenuePages(cc.id)" class="px-2 py-1 rounded hover:bg-neutral-700 disabled:opacity-50">Próximo</button>
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center justify-between gap-2 mb-2">
                                <div>
                                    <h4 class="text-xs font-medium text-neutral-400 uppercase">Fator R mensal</h4>
                                    <p class="text-xs text-neutral-500 mt-0.5">Folha / receita. Acima de 28% pode optar pelo Anexo III.</p>
                                </div>
                                <button type="button" @click="openAddFatorRModal(cc.id)" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md shrink-0">Adicionar valor</button>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-neutral-700 rounded overflow-hidden">
                                    <thead class="bg-neutral-700/50">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Mês</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Fator R (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-700/50">
                                        <tr v-for="row in getFatorRRowsPaginated(cc.id)" :key="row.id" class="hover:bg-neutral-700/30">
                                            <td class="px-4 py-2 text-sm text-white">{{ monthLabel(row.year, row.month) }}</td>
                                            <td class="px-4 py-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    :value="formatFatorRPercent(row.fator_r)"
                                                    @blur="saveFatorRRow(cc.id, row.id, row.year, row.month, ($event.target as HTMLInputElement).value)"
                                                    class="w-24 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm"
                                                />
                                            </td>
                                        </tr>
                                        <tr v-if="getFatorRRows(cc.id).length === 0">
                                            <td colspan="2" class="px-4 py-3 text-center text-sm text-neutral-500">Nenhum mês cadastrado. Clique em Adicionar valor.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-if="totalFatorRPages(cc.id) > 1" class="flex items-center justify-between mt-2 px-1 text-sm text-neutral-400">
                                <button type="button" @click="fatorRPage = Math.max(1, fatorRPage - 1)" :disabled="fatorRPage <= 1" class="px-2 py-1 rounded hover:bg-neutral-700 disabled:opacity-50">Anterior</button>
                                <span>Página {{ fatorRPage }} de {{ totalFatorRPages(cc.id) }}</span>
                                <button type="button" @click="fatorRPage = Math.min(totalFatorRPages(cc.id), fatorRPage + 1)" :disabled="fatorRPage >= totalFatorRPages(cc.id)" class="px-2 py-1 rounded hover:bg-neutral-700 disabled:opacity-50">Próximo</button>
                            </div>
                        </div>
                    </template>

                    <!-- ISS do municipio (se houver) -->
                    <div v-if="getIssMunicipalityForCostCenter(cc)">
                        <h4 class="text-xs font-medium text-neutral-400 uppercase mb-2">ISS municipal</h4>
                        <table class="min-w-full divide-y divide-neutral-700 rounded overflow-hidden">
                            <thead class="bg-neutral-700/50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">Município</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">UF</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">ISS (%)</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-700/50">
                                <tr class="hover:bg-neutral-700/30">
                                    <td class="px-4 py-2 text-sm text-white">{{ getIssMunicipalityForCostCenter(cc).municipality }}</td>
                                    <td class="px-4 py-2 text-sm text-neutral-300">{{ getIssMunicipalityForCostCenter(cc).uf }}</td>
                                    <td class="px-4 py-2 text-sm text-neutral-300">{{ formatNum(getIssMunicipalityForCostCenter(cc).percent) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Editar Regra por CC -->
        <div v-if="showRuleDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md">
                <div class="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Editar regra: {{ editingRule?.tax_name }}</h3>
                    <button @click="showRuleDialog = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form @submit.prevent="saveRule" class="p-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Alíquota (%)</label>
                        <input v-model.number="ruleForm.percentage" type="number" step="0.01" min="0" max="100" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Valor mínimo / Limite (R$)</label>
                        <input v-model.number="ruleForm.min_threshold" type="number" step="0.01" min="0" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="215.05" />
                        <p class="mt-1 text-xs text-neutral-400">Deixe vazio se não houver mínimo.</p>
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" @click="showRuleDialog = false" class="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Cancelar</button>
                        <button type="submit" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal ISS (novo/editar) -->
        <div v-if="showIssDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md">
                <div class="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ editingIss ? 'Editar município' : 'Novo município' }}</h3>
                    <button @click="showIssDialog = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form @submit.prevent="saveIss" class="p-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Município <span class="text-red-500">*</span></label>
                        <input v-model="issForm.municipality" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="São Paulo" required />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">UF <span class="text-red-500">*</span></label>
                        <select v-model="issForm.uf" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                            <option value="">Selecione</option>
                            <option v-for="u in ufList" :key="u" :value="u">{{ u }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">ISS (%) <span class="text-red-500">*</span></label>
                        <input v-model.number="issForm.percent" type="number" step="0.01" min="0" max="10" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="5" required />
                        <p class="mt-1 text-xs text-neutral-400">Geralmente entre 2% e 5%.</p>
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" @click="showIssDialog = false" class="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Cancelar</button>
                        <button type="submit" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal Adicionar Faturamento (Simples) -->
        <div v-if="showAddRevenueModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-sm">
                <div class="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Adicionar faturamento</h3>
                    <button type="button" @click="showAddRevenueModal = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form @submit.prevent="submitAddRevenue" class="p-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Ano</label>
                        <select v-model.number="addRevenueForm.year" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Mês</label>
                        <select v-model.number="addRevenueForm.month" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                            <option v-for="m in 12" :key="m" :value="m">{{ MONTH_LABELS[m - 1] }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Faturamento (R$)</label>
                        <input v-model.number="addRevenueForm.gross_revenue" type="number" step="0.01" min="0" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required />
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" @click="showAddRevenueModal = false" class="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Cancelar</button>
                        <button type="submit" class="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-sm">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal Adicionar Fator R (Simples) -->
        <div v-if="showAddFatorRModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-sm">
                <div class="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Adicionar Fator R</h3>
                    <button type="button" @click="showAddFatorRModal = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form @submit.prevent="submitAddFatorR" class="p-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Ano</label>
                        <select v-model.number="addFatorRForm.year" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Mês</label>
                        <select v-model.number="addFatorRForm.month" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required>
                            <option v-for="m in 12" :key="m" :value="m">{{ MONTH_LABELS[m - 1] }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Fator R (%)</label>
                        <input v-model.number="addFatorRForm.fator_r_percent" type="number" step="0.01" min="0" max="100" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="28" required />
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" @click="showAddFatorRModal = false" class="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Cancelar</button>
                        <button type="submit" class="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-sm">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();
const issList = ref<any[]>([]);
const costCentersList = ref<any[]>([]);
const taxRegimesList = ref<any[]>([]);
const expandedCostCenter = ref<string | null>(null);

// Regras independentes por centro de custo: { [costCenterId]: rule[] }
const ccRulesMap = ref<Record<string, any[]>>({});
const ccRulesLoading = ref<Record<string, boolean>>({});

// Simples Nacional: listas por CC (ordenadas por ano/mes decrescente)
interface RevenueRow { id: string; year: number; month: number; gross_revenue: number }
interface FatorRRow { id: string; year: number; month: number; fator_r: number }
const monthlyRevenueList = ref<Record<string, RevenueRow[]>>({});
const monthlyFatorRList = ref<Record<string, FatorRRow[]>>({});
const revenuePage = ref(1);
const fatorRPage = ref(1);
const showAddRevenueModal = ref(false);
const showAddFatorRModal = ref(false);
const addRevenueCcId = ref<string | null>(null);
const addFatorRCcId = ref<string | null>(null);
const addRevenueForm = ref({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, gross_revenue: 0 });
const addFatorRForm = ref({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, fator_r_percent: 0 });
const SIMPLES_PAGE_SIZE = 10;
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

const showRuleDialog = ref(false);
const showIssDialog = ref(false);
const editingRule = ref<any>(null);
const editingIss = ref<any>(null);

const ruleForm = ref({ percentage: 0, min_threshold: null as number | null });
const issForm = ref({ municipality: '', uf: '', percent: 5 });

const ufList = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const formatNum = (n: number) => (n != null ? Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-');
const formatCurrency = (n: number) => (n != null ? 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-');

// ---- Carregamento de dados ----

const loadIss = async () => {
    try {
        const res = await client.taxIssMunicipality.get({});
        issList.value = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
    } catch (_) {
        issList.value = [];
    }
};

const loadCostCenters = async () => {
    try {
        const res = await client.costCenters.get({});
        costCentersList.value = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
    } catch (_) {
        costCentersList.value = [];
    }
};

const loadTaxRegimes = async () => {
    try {
        const res = await client.taxRegimes.get({});
        taxRegimesList.value = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
    } catch (_) {
        taxRegimesList.value = [];
    }
};

const loadCcRules = async (costCenterId: string) => {
    if (ccRulesLoading.value[costCenterId]) return;
    ccRulesLoading.value[costCenterId] = true;
    try {
        // Inicializar (copia das globais se nao existem ainda)
        const initRes = await client.costCenterTaxRules.initForCostCenter(costCenterId);
        const initData = initRes?.data ?? [];

        if (Array.isArray(initData) && initData.length > 0) {
            ccRulesMap.value[costCenterId] = initData;
        } else {
            const res = await client.costCenterTaxRules.get({ cost_center_id: costCenterId });
            const items = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
            ccRulesMap.value[costCenterId] = items;
        }
    } catch (_) {
        ccRulesMap.value[costCenterId] = [];
    } finally {
        ccRulesLoading.value[costCenterId] = false;
    }
};

// ---- Helpers de centro de custo ----

const activeCostCenters = computed(() => costCentersList.value.filter((cc: any) => cc.active !== false));

const getRegimeForCostCenter = (cc: any) => {
    if (!cc.tax_regime_id) return null;
    return taxRegimesList.value.find((r: any) => r.id === cc.tax_regime_id) ?? null;
};

const getRegimeName = (cc: any) => {
    const r = getRegimeForCostCenter(cc);
    return r?.name || '-';
};

const getRegimeCode = (cc: any) => {
    const r = getRegimeForCostCenter(cc);
    return r?.code || '';
};

const parseFiscalProfile = (cc: any) => {
    if (!cc.fiscal_profile) return {};
    try {
        return typeof cc.fiscal_profile === 'string' ? JSON.parse(cc.fiscal_profile) : cc.fiscal_profile;
    } catch (_) { return {}; }
};

const parseCnpjDetails = (cc: any) => {
    if (!cc.cnpjDetails) return {};
    try {
        return typeof cc.cnpjDetails === 'string' ? JSON.parse(cc.cnpjDetails) : cc.cnpjDetails;
    } catch (_) { return {}; }
};

const getIssMunicipalityForCostCenter = (cc: any) => {
    const d = parseCnpjDetails(cc);
    const mun = (d.municipality || '').trim();
    const uf = (d.state || '').trim();
    if (!mun || !uf) return null;
    return issList.value.find((m: any) => m.municipality === mun && m.uf === uf) ?? null;
};

// ---- Resumo de impostos (read-only) ----

interface TaxSummaryItem { name: string; percent: string; obs: string; }

const getCcRule = (ccId: string, taxName: string) => {
    const rules = ccRulesMap.value[ccId] || [];
    return rules.find((r: any) => r.tax_name === taxName) ?? null;
};

const getTaxSummary = (cc: any): TaxSummaryItem[] => {
    const fp = parseFiscalProfile(cc);
    const personType = fp.personType || 'PJ';
    const regimeCode = getRegimeCode(cc);
    const isMei = cc.is_mei_optant === true || cc.is_mei_optant === 1;
    const taxes: TaxSummaryItem[] = [];

    if (personType === 'EXTERIOR') {
        const iof = fp.exteriorIof != null ? Number(fp.exteriorIof) : 0;
        if (iof > 0) taxes.push({ name: 'IOF', percent: formatNum(iof) + '%', obs: 'Sobre remessa' });
        if (taxes.length === 0) taxes.push({ name: '-', percent: '-', obs: 'Nenhum imposto configurado.' });
        return taxes;
    }

    if (personType === 'PF') {
        const inssRate = fp.inssRate != null ? Number(fp.inssRate) : 11;
        taxes.push({ name: 'INSS', percent: formatNum(inssRate) + '%', obs: 'Teto R$ 7.786,02' });
        const useProg = fp.irrfProgressiveTable === true;
        taxes.push({ name: 'IRRF', percent: useProg ? 'Progressiva' : '1,50%', obs: useProg ? 'Tabela progressiva' : 'Alíquota fixa' });
        return taxes;
    }

    // PJ
    if (isMei || regimeCode === 'MEI') {
        taxes.push({ name: '-', percent: '-', obs: 'MEI - sem retenções' });
        return taxes;
    }

    if (regimeCode === 'SIMPLES_NACIONAL') {
        taxes.push({ name: 'DAS', percent: 'Efetiva', obs: 'Conforme RBT12 e anexo (cadastre faturamento mensal abaixo)' });
        const issRetention = fp.issRetentionIndicator || '';
        if (issRetention === 'RETEM_NA_FONTE') {
            const issM = getIssMunicipalityForCostCenter(cc);
            if (issM) taxes.push({ name: 'ISS', percent: formatNum(issM.percent) + '%', obs: issM.municipality + '/' + issM.uf });
        }
        return taxes;
    }

    if (regimeCode === 'LUCRO_PRESUMIDO') {
        const presRate = fp.presumptionRate != null ? Number(fp.presumptionRate) : 32;
        const pisRule = getCcRule(cc.id, 'PIS');
        const cofinsRule = getCcRule(cc.id, 'COFINS');
        const adicRule = getCcRule(cc.id, 'ADICIONAL_IRPJ');

        const pisPct = pisRule ? Number(pisRule.percentage) : 0.65;
        taxes.push({ name: 'PIS', percent: formatNum(pisPct) + '%', obs: 'Sobre receita' });

        const cofinsPct = cofinsRule ? Number(cofinsRule.percentage) : 3;
        taxes.push({ name: 'COFINS', percent: formatNum(cofinsPct) + '%', obs: 'Sobre receita' });

        const csllPct = (presRate / 100) * 0.09 * 100;
        taxes.push({ name: 'CSLL', percent: formatNum(csllPct) + '%', obs: 'Base presumida x 9%' });

        const irpjPct = (presRate / 100) * 0.15 * 100;
        taxes.push({ name: 'IRPJ', percent: formatNum(irpjPct) + '%', obs: 'Base presumida x 15%' });

        if (adicRule && adicRule.active) {
            taxes.push({
                name: 'IRPJ Adicional',
                percent: formatNum(Number(adicRule.percentage)) + '%',
                obs: 'Excedente > ' + formatCurrency(adicRule.min_threshold)
            });
        }

        const issM = getIssMunicipalityForCostCenter(cc);
        if (issM) taxes.push({ name: 'ISS', percent: formatNum(issM.percent) + '%', obs: issM.municipality + '/' + issM.uf });
        taxes.push({ name: '', percent: '', obs: 'Presunção: ' + formatNum(presRate) + '%' });
        return taxes;
    }

    if (regimeCode === 'LUCRO_REAL') {
        const csrfRule = getCcRule(cc.id, 'CSRF');
        const irrfRule = getCcRule(cc.id, 'IRRF_SERVICOS');
        const csrfPct = csrfRule ? Number(csrfRule.percentage) : 4.65;
        const csrfThreshold = csrfRule && csrfRule.min_threshold != null ? Number(csrfRule.min_threshold) : 215.05;
        taxes.push({ name: 'CSRF (PIS/COFINS/CSLL)', percent: formatNum(csrfPct) + '%', obs: 'Gatilho ' + formatCurrency(csrfThreshold) + '/mes' });
        const irrfPct = irrfRule ? Number(irrfRule.percentage) : 1.5;
        taxes.push({ name: 'IRRF (servicos)', percent: formatNum(irrfPct) + '%', obs: 'Retenção na fonte' });
        const issRetention = fp.issRetentionIndicator || '';
        if (issRetention === 'RETEM_NA_FONTE') {
            const issM = getIssMunicipalityForCostCenter(cc);
            if (issM) taxes.push({ name: 'ISS', percent: formatNum(issM.percent) + '%', obs: issM.municipality + '/' + issM.uf });
        }
        return taxes;
    }

    taxes.push({ name: '-', percent: '-', obs: 'Regime não configurado' });
    return taxes;
};

// ---- Regras editaveis por CC (filtradas pelo regime) ----

const RULES_LUCRO_PRESUMIDO = ['PIS', 'COFINS', 'CSLL', 'ADICIONAL_IRPJ'];
const RULES_LUCRO_REAL = ['CSRF', 'IRRF_SERVICOS', 'PIS', 'COFINS', 'CSLL'];

const getApplicableRules = (cc: any): any[] => {
    const fp = parseFiscalProfile(cc);
    const personType = fp.personType || 'PJ';
    const regimeCode = getRegimeCode(cc);
    const isMei = cc.is_mei_optant === true || cc.is_mei_optant === 1;
    const rules = ccRulesMap.value[cc.id] || [];

    if (personType !== 'PJ' || isMei || regimeCode === 'MEI' || regimeCode === 'SIMPLES_NACIONAL') {
        return [];
    }

    let relevantNames: string[] = [];
    if (regimeCode === 'LUCRO_PRESUMIDO') {
        relevantNames = RULES_LUCRO_PRESUMIDO;
    } else if (regimeCode === 'LUCRO_REAL') {
        relevantNames = RULES_LUCRO_REAL;
    } else {
        return rules;
    }

    return rules.filter((r: any) => relevantNames.includes(r.tax_name));
};

// ---- Accordion toggle ----

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const toggleCostCenter = async (id: string) => {
    if (expandedCostCenter.value === id) {
        expandedCostCenter.value = null;
        return;
    }
    expandedCostCenter.value = id;
    revenuePage.value = 1;
    fatorRPage.value = 1;
    if (!ccRulesMap.value[id]) {
        await loadCcRules(id);
    }
    const cc = activeCostCenters.value.find((c: any) => c.id === id);
    if (cc && getRegimeCode(cc) === 'SIMPLES_NACIONAL') {
        await loadSimplesData(id);
    }
};

function monthLabel(year: number, month: number): string {
    return `${MONTH_LABELS[month - 1]}/${year}`;
}

function formatFatorRPercent(fatorR: number): string {
    if (fatorR == null) return '';
    const pct = Math.round(Number(fatorR) * 10000) / 100;
    return pct === 0 ? '' : String(pct);
}

function getRevenueRows(ccId: string): RevenueRow[] {
    const list = monthlyRevenueList.value[ccId] ?? [];
    return [...list].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
}

function getRevenueRowsPaginated(ccId: string): RevenueRow[] {
    const rows = getRevenueRows(ccId);
    const start = (revenuePage.value - 1) * SIMPLES_PAGE_SIZE;
    return rows.slice(start, start + SIMPLES_PAGE_SIZE);
}

function totalRevenuePages(ccId: string): number {
    const n = getRevenueRows(ccId).length;
    return Math.max(1, Math.ceil(n / SIMPLES_PAGE_SIZE));
}

function getFatorRRows(ccId: string): FatorRRow[] {
    const list = monthlyFatorRList.value[ccId] ?? [];
    return [...list].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
}

function getFatorRRowsPaginated(ccId: string): FatorRRow[] {
    const rows = getFatorRRows(ccId);
    const start = (fatorRPage.value - 1) * SIMPLES_PAGE_SIZE;
    return rows.slice(start, start + SIMPLES_PAGE_SIZE);
}

function totalFatorRPages(ccId: string): number {
    const n = getFatorRRows(ccId).length;
    return Math.max(1, Math.ceil(n / SIMPLES_PAGE_SIZE));
}

async function loadSimplesData(costCenterId: string) {
    try {
        const [revRes, frRes] = await Promise.all([
            client.costCenterMonthlyRevenue.get({ cost_center_id: costCenterId }),
            client.costCenterMonthlyFatorR.get({ cost_center_id: costCenterId })
        ]);
        const revList = Array.isArray(revRes?.data) ? revRes.data : revRes?.items ?? [];
        const frList = Array.isArray(frRes?.data) ? frRes.data : frRes?.items ?? [];
        monthlyRevenueList.value[costCenterId] = revList.map((r: any) => ({
            id: r.id,
            year: Number(r.year),
            month: Number(r.month),
            gross_revenue: Number(r.gross_revenue) || 0
        }));
        monthlyFatorRList.value[costCenterId] = frList.map((f: any) => ({
            id: f.id,
            year: Number(f.year),
            month: Number(f.month),
            fator_r: Number(f.fator_r) ?? 0
        }));
    } catch (_) {
        monthlyRevenueList.value[costCenterId] = [];
        monthlyFatorRList.value[costCenterId] = [];
    }
}

async function saveRevenueRow(ccId: string, id: string, year: number, month: number, value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    try {
        await client.costCenterMonthlyRevenue.update(id, { gross_revenue: num });
        const list = monthlyRevenueList.value[ccId] ?? [];
        const idx = list.findIndex((r) => r.id === id);
        if (idx >= 0) list[idx].gross_revenue = num;
    } catch (e) {
        console.error(e);
    }
}

async function saveFatorRRow(ccId: string, id: string, year: number, month: number, value: string) {
    const numPct = parseFloat(value);
    const num = isNaN(numPct) ? 0 : Math.min(1, Math.max(0, numPct / 100));
    try {
        await client.costCenterMonthlyFatorR.update(id, { fator_r: num });
        const list = monthlyFatorRList.value[ccId] ?? [];
        const idx = list.findIndex((r) => r.id === id);
        if (idx >= 0) list[idx].fator_r = num;
    } catch (e) {
        console.error(e);
    }
}

function openAddRevenueModal(ccId: string) {
    addRevenueCcId.value = ccId;
    const now = new Date();
    addRevenueForm.value = { year: now.getFullYear(), month: now.getMonth() + 1, gross_revenue: 0 };
    showAddRevenueModal.value = true;
}

function openAddFatorRModal(ccId: string) {
    addFatorRCcId.value = ccId;
    const now = new Date();
    addFatorRForm.value = { year: now.getFullYear(), month: now.getMonth() + 1, fator_r_percent: 0 };
    showAddFatorRModal.value = true;
}

async function submitAddRevenue() {
    const ccId = addRevenueCcId.value;
    if (!ccId) return;
    const { year, month, gross_revenue } = addRevenueForm.value;
    try {
        await client.costCenterMonthlyRevenue.upsertMonth({
            cost_center_id: ccId,
            year,
            month,
            gross_revenue: Number(gross_revenue) || 0
        });
        await loadSimplesData(ccId);
        showAddRevenueModal.value = false;
        addRevenueCcId.value = null;
    } catch (e) {
        console.error(e);
    }
}

async function submitAddFatorR() {
    const ccId = addFatorRCcId.value;
    if (!ccId) return;
    const { year, month, fator_r_percent } = addFatorRForm.value;
    const fatorR = Math.min(1, Math.max(0, Number(fator_r_percent) || 0) / 100);
    try {
        await client.costCenterMonthlyFatorR.upsertMonth({
            cost_center_id: ccId,
            year,
            month,
            fator_r: fatorR
        });
        await loadSimplesData(ccId);
        showAddFatorRModal.value = false;
        addFatorRCcId.value = null;
    } catch (e) {
        console.error(e);
    }
}

// ---- Editar regra por CC ----

const openEditRule = (r: any) => {
    editingRule.value = r;
    ruleForm.value = { percentage: r.percentage ?? 0, min_threshold: r.min_threshold != null ? r.min_threshold : null };
    showRuleDialog.value = true;
};

const saveRule = async () => {
    if (!editingRule.value?.id) return;
    const ccId = editingRule.value.cost_center_id;
    try {
        await client.costCenterTaxRules.update(editingRule.value.id, {
            percentage: ruleForm.value.percentage,
            min_threshold: ruleForm.value.min_threshold ?? undefined
        });
        if (ccId) {
            delete ccRulesMap.value[ccId];
            await loadCcRules(ccId);
        }
        showRuleDialog.value = false;
        editingRule.value = null;
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar regra.');
    }
};

// ---- ISS (crud separado) ----

const openAddIss = () => {
    editingIss.value = null;
    issForm.value = { municipality: '', uf: '', percent: 5 };
    showIssDialog.value = true;
};

const openEditIss = (m: any) => {
    editingIss.value = m;
    issForm.value = { municipality: m.municipality || '', uf: m.uf || '', percent: m.percent ?? 5 };
    showIssDialog.value = true;
};

const saveIss = async () => {
    try {
        if (editingIss.value?.id) {
            await client.taxIssMunicipality.update(editingIss.value.id, issForm.value);
        } else {
            await client.taxIssMunicipality.insert(issForm.value);
        }
        await loadIss();
        showIssDialog.value = false;
        editingIss.value = null;
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar município.');
    }
};

const deleteIss = async (id: string) => {
    if (!confirm('Excluir este município da tabela de ISS?')) return;
    try {
        await client.taxIssMunicipality.delete(id);
        await loadIss();
    } catch (e) {
        console.error(e);
        alert('Erro ao excluir.');
    }
};

// ---- Init ----

onMounted(() => {
    loadIss();
    loadCostCenters();
    loadTaxRegimes();
});
</script>
