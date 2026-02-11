<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Centros de Custos</h1>
            <button @click="openAddDialog" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar Centro de Custo
            </button>
        </div>

        <!-- Tabela de Centros de Custos -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Identificador</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Nome</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Métodos de Recebimento</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="items.length === 0">
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-neutral-400">
                            Nenhum centro de custo cadastrado
                        </td>
                    </tr>
                    <tr v-for="item in items" :key="item.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ formatIdentifier(item.identifier) }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ item.name }}</td>
                        <td class="px-6 py-4 text-sm text-white">
                            <div class="flex flex-wrap gap-2">
                                <span v-for="(method, index) in getPaymentMethods(item)" :key="index" class="px-2 py-1 bg-blue-600 rounded text-xs">
                                    {{ formatPaymentMethodLabel(method) }}
                                </span>
                                <span v-if="getPaymentMethods(item).length === 0" class="text-neutral-400 italic">Nenhum método cadastrado</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="item.active ? 'bg-green-500' : 'bg-red-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                {{ item.active ? 'Ativo' : 'Inativo' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                                @click="openHistoryModal(item)"
                                title="Historico de notas"
                                class="text-neutral-300 hover:text-white p-1.5 rounded hover:bg-neutral-600 transition-colors mr-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>
                            <button
                                @click="editItem(item)"
                                title="Alterar"
                                class="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-neutral-600 transition-colors mr-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                @click="deleteItem(item.id)"
                                title="Remover"
                                class="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-neutral-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal de Cadastro/Edição -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center sticky top-0 bg-neutral-800 z-10">
                    <h3 class="text-lg font-medium text-white">{{ isEditing ? 'Editar Centro de Custo' : 'Adicionar Centro de Custo' }}</h3>
                    <button @click="closeDialog" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="saveCostCenter" class="p-6 space-y-4">
                    <!-- ID para uso no CSV (visivel apenas ao editar) -->
                    <div v-if="isEditing && editingItem" class="p-3 bg-neutral-700/50 rounded-lg border border-neutral-600">
                        <label class="block text-sm font-medium text-neutral-300 mb-1">ID para uso no CSV (costCenterId)</label>
                        <div class="flex gap-2 items-center">
                            <input
                                :value="editingItem?.id"
                                type="text"
                                readonly
                                class="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm font-mono"
                            />
                            <button
                                type="button"
                                @click="copyIdToClipboard(editingItem?.id)"
                                class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                            >
                                Copiar
                            </button>
                        </div>
                        <p class="mt-1 text-xs text-neutral-400">Use este ID na coluna costCenterId ao importar ordens de pagamento via CSV.</p>
                    </div>

                    <!-- Identificador (CNPJ ou CPF) -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Identificador (CNPJ ou CPF) <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.identifier"
                            type="text"
                            placeholder="00.000.000/0000-00 ou 000.000.000-00"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.identifier }"
                            @input="formatIdentifierInput"
                            required
                        />
                        <p v-if="formErrors.identifier" class="mt-1 text-sm text-red-400">{{ formErrors.identifier }}</p>
                        <p class="mt-1 text-xs text-neutral-400">Digite apenas números, a formatação será aplicada automaticamente</p>
                    </div>

                    <!-- Nome da Empresa/Pessoa -->
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-2">
                            Nome da Empresa/Pessoa <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Nome completo ou razão social"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            :class="{ 'border-red-500': formErrors.name }"
                            required
                        />
                        <p v-if="formErrors.name" class="mt-1 text-sm text-red-400">{{ formErrors.name }}</p>
                    </div>

                    <!-- Perfil Fiscal (DNA tributario) - todos os centros -->
                    <div class="p-4 bg-neutral-700/50 rounded-lg border border-neutral-600 space-y-4">
                        <h4 class="text-sm font-medium text-white border-b border-neutral-600 pb-2">Perfil Fiscal</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-medium text-neutral-300 mb-1">Tipo de personalidade</label>
                                <select
                                    v-model="form.personType"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione</option>
                                    <option value="PF">Pessoa Fisica</option>
                                    <option value="PJ">Pessoa Juridica</option>
                                    <option value="EXTERIOR">Exterior</option>
                                </select>
                            </div>
                            <template v-if="form.personType === 'PJ'">
                                <div>
                                    <label class="block text-sm font-medium text-neutral-300 mb-1">Regime tributario</label>
                                    <select
                                        v-model="form.taxRegimeId"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecione</option>
                                        <option v-for="r in taxRegimesList" :key="r.id" :value="r.id">{{ r.name }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-neutral-300 mb-1">Optante MEI?</label>
                                    <select
                                        v-model="form.isMeiOptant"
                                        :disabled="meiOptantForcedToNo"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <option value="false">Nao</option>
                                        <option value="true">Sim</option>
                                    </select>
                                    <p v-if="meiOptantForcedToNo" class="mt-1 text-xs text-neutral-400">No Lucro Presumido ou Lucro Real o optante por MEI nao se aplica.</p>
                                </div>
                                <div v-if="selectedTaxRegime?.code === 'LUCRO_PRESUMIDO'" class="sm:col-span-2">
                                    <label class="block text-sm font-medium text-neutral-300 mb-1">Valor da presuncao (%)</label>
                                    <input
                                        v-model.number="form.presumptionRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        placeholder="32"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p class="mt-1 text-xs text-neutral-400">Percentual de presuncao de lucro sobre a receita (ex.: 32% para servicos). Usado no calculo de IRPJ e CSLL.</p>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="block text-sm font-medium text-neutral-300 mb-1">Indicador retencao ISS</label>
                                    <select
                                        v-model="form.issRetentionIndicator"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="RETEM_NA_FONTE">Retem na Fonte</option>
                                        <option value="NAO_RETEM">Nao Retem</option>
                                        <option value="ISENTO">Isento</option>
                                    </select>
                                    <p class="mt-1 text-xs text-neutral-400">Depende se o servico e no municipio do tomador ou do prestador.</p>
                                </div>
                            </template>
                            <template v-if="form.personType === 'PF'">
                                <div>
                                    <label class="block text-sm font-medium text-neutral-300 mb-1">Aliquota INSS (%)</label>
                                    <input
                                        v-model.number="form.inssRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="20"
                                        placeholder="11"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm"
                                    />
                                    <p class="mt-1 text-xs text-neutral-400">Ex.: 11% (limitado ao teto).</p>
                                </div>
                                <div class="flex items-center pt-6">
                                    <input v-model="form.irrfProgressiveTable" type="checkbox" id="irrfProgressive" class="w-4 h-4 text-blue-600 rounded" />
                                    <label for="irrfProgressive" class="ml-2 text-sm text-neutral-300">Aplicar tabela progressiva IRRF (Receita Federal)</label>
                                </div>
                            </template>
                            <template v-if="form.personType === 'EXTERIOR'">
                                <div>
                                    <label class="block text-sm font-medium text-neutral-300 mb-1">Invoice / Fatura</label>
                                    <input
                                        v-model="form.exteriorInvoice"
                                        type="text"
                                        placeholder="Referencia da invoice"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-neutral-300 mb-1">IOF (%)</label>
                                    <input
                                        v-model.number="form.exteriorIof"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm"
                                    />
                                </div>
                                <p class="sm:col-span-2 text-xs text-amber-400">Impostos nacionais desabilitados para centro no exterior.</p>
                            </template>
                        </div>
                    </div>

                    <!-- Informações tributárias (apenas CNPJ) -->
                    <div v-if="isCNPJ" class="p-4 bg-neutral-700/50 rounded-lg border border-neutral-600 space-y-4">
                        <h4 class="text-sm font-medium text-white border-b border-neutral-600 pb-2">Informacoes tributarias (CNPJ)</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <p v-if="form.personType === 'PJ'" class="sm:col-span-2 text-xs text-neutral-400">Regime tributario e optante MEI definidos no Perfil Fiscal acima.</p>
                            <template v-if="form.personType !== 'PJ'">
                                <div>
                                    <label class="block text-sm font-medium text-neutral-300 mb-1">Regime tributario</label>
                                    <select
                                        v-model="form.cnpjTaxRegime"
                                        @change="onCnpjTaxRegimeChange"
                                        class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Simples Nacional">Simples Nacional</option>
                                        <option value="Lucro Presumido">Lucro Presumido</option>
                                        <option value="Lucro Real">Lucro Real</option>
                                    </select>
                                </div>
                            </template>
                            <div>
                                <label class="block text-sm font-medium text-neutral-300 mb-1">Regime de apuracao</label>
                                <select
                                    v-model="form.cnpjAccrualRegime"
                                    :disabled="displayRegimeForCnpjSection === 'Simples Nacional'"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <option value="">Selecione</option>
                                    <option value="Caixa">Caixa</option>
                                    <option value="Competencia">Competencia</option>
                                </select>
                                <p v-if="displayRegimeForCnpjSection === 'Simples Nacional'" class="mt-1 text-xs text-neutral-400">No Simples Nacional o regime de apuracao e sempre Competencia.</p>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-medium text-neutral-300 mb-1">CNAE principal</label>
                                <select
                                    v-model="form.cnpjCnaePrincipal"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione um CNAE</option>
                                    <option v-for="c in cnaeList" :key="c.id" :value="c.code">{{ c.code }} - {{ c.denominacao }}</option>
                                </select>
                                <p v-if="cnaeList.length === 0" class="mt-1 text-xs text-amber-400">Lista de CNAEs do Simples Nacional nao carregada. Verifique a tabela sas_simples_nacional_cnae.</p>
                            </div>
                            <div class="sm:col-span-2">
                                <div class="flex justify-between items-center mb-1">
                                    <label class="block text-sm font-medium text-neutral-300">CNAEs secundarios</label>
                                    <button
                                        type="button"
                                        @click="addCnpjCnaeSecundario"
                                        class="px-2 py-1 bg-neutral-600 hover:bg-neutral-500 text-white text-xs rounded-md transition-colors"
                                    >
                                        + Adicionar CNAE
                                    </button>
                                </div>
                                <div v-for="(cnaeCode, idx) in form.cnpjCnaeSecundarios" :key="idx" class="flex gap-2 items-center mt-2">
                                    <select
                                        v-model="form.cnpjCnaeSecundarios[idx]"
                                        class="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecione um CNAE</option>
                                        <option v-for="c in cnaeList" :key="c.id" :value="c.code">{{ c.code }} - {{ c.denominacao }}</option>
                                    </select>
                                    <button
                                        type="button"
                                        @click="removeCnpjCnaeSecundario(idx)"
                                        class="text-red-400 hover:text-red-300 p-1.5"
                                        title="Remover"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <p v-if="form.cnpjCnaeSecundarios.length === 0" class="mt-1 text-xs text-neutral-500">Nenhum CNAE secundario. Clique em "Adicionar CNAE" se precisar.</p>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-sm font-medium text-neutral-300 mb-1">Municipio (com aliquota ISS na matriz tributaria)</label>
                                <select
                                    v-model="form.cnpjIssMunicipalityId"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione municipio</option>
                                    <option v-for="m in issMunicipalityList" :key="m.id" :value="m.id">{{ m.municipality }} - {{ m.uf }} (ISS {{ m.percent }}%)</option>
                                </select>
                                <p v-if="issMunicipalityList.length === 0" class="mt-1 text-xs text-amber-400">Cadastre municipios na pagina Matriz Tributaria para selecionar aqui.</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-neutral-300 mb-1">Data de inicio do regime</label>
                                <input
                                    v-model="form.cnpjRegimeStartDate"
                                    type="date"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div v-if="displayRegimeForCnpjSection === 'Simples Nacional'">
                                <label class="block text-sm font-medium text-neutral-300 mb-1">Anexo do Simples (se aplicavel)</label>
                                <select
                                    v-model="form.cnpjSimplesAnexo"
                                    class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione</option>
                                    <option value="Anexo I">Anexo I</option>
                                    <option value="Anexo II">Anexo II</option>
                                    <option value="Anexo III">Anexo III</option>
                                    <option value="Anexo IV">Anexo IV</option>
                                    <option value="Anexo V">Anexo V</option>
                                </select>
                            </div>
                            <div v-if="displayRegimeForCnpjSection && displayRegimeForCnpjSection !== 'Simples Nacional'" class="sm:col-span-2">
                                <label class="block text-sm font-medium text-neutral-300 mb-1">ISS (conforme matriz tributaria)</label>
                                <p v-if="selectedIssMunicipality" class="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm">
                                    {{ selectedIssMunicipality.percent }}%
                                </p>
                                <p v-else class="px-3 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-neutral-400 text-sm">Selecione o municipio acima para exibir a aliquota de ISS.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Métodos de Recebimento -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-sm font-medium text-neutral-300">
                                Métodos de Recebimento <span class="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                @click="addPaymentMethod"
                                class="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Adicionar Método
                            </button>
                        </div>

                        <div v-if="form.paymentMethods.length === 0" class="text-sm text-neutral-400 italic mb-2">
                            Nenhum método de recebimento cadastrado. Clique em "Adicionar Método" para começar.
                        </div>

                        <div v-for="(method, index) in form.paymentMethods" :key="index" class="mb-4 p-4 bg-neutral-700 rounded-lg border border-neutral-600">
                            <div class="flex justify-between items-start mb-3">
                                <span class="text-sm font-medium text-neutral-300">Método {{ index + 1 }}</span>
                                <button
                                    type="button"
                                    @click="removePaymentMethod(index)"
                                    class="text-red-400 hover:text-red-300"
                                    :disabled="form.paymentMethods.length === 1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            <div class="space-y-3">
                                <!-- Tipo de Método -->
                                <div>
                                    <label class="block text-xs font-medium text-neutral-400 mb-1">
                                        Tipo <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        v-model="method.method"
                                        class="w-full px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        :class="{ 'border-red-500': formErrors[`paymentMethod_${index}`] }"
                                        required
                                    >
                                        <option value="">Selecione uma opção</option>
                                        <option value="Wise">Wise</option>
                                        <option value="PIX">PIX</option>
                                        <option value="Crypto">Crypto</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                    <p v-if="formErrors[`paymentMethod_${index}`]" class="mt-1 text-xs text-red-400">{{ formErrors[`paymentMethod_${index}`] }}</p>
                                </div>

                                <!-- Crypto: Código da wallet e Sigla da moeda -->
                                <template v-if="method.method === 'Crypto'">
                                    <div>
                                        <label class="block text-xs font-medium text-neutral-400 mb-1">Codigo da wallet <span class="text-red-500">*</span></label>
                                        <input
                                            v-model="method.wallet"
                                            type="text"
                                            placeholder="Ex: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                                            class="w-full px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-md text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            :class="{ 'border-red-500': formErrors[`paymentWallet_${index}`] }"
                                        />
                                        <p v-if="formErrors[`paymentWallet_${index}`]" class="mt-1 text-xs text-red-400">{{ formErrors[`paymentWallet_${index}`] }}</p>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-neutral-400 mb-1">Sigla da moeda <span class="text-red-500">*</span></label>
                                        <input
                                            v-model="method.currency"
                                            type="text"
                                            placeholder="Ex: BTC, ETH, USDT"
                                            class="w-full px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-md text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                            maxlength="10"
                                            :class="{ 'border-red-500': formErrors[`paymentCurrency_${index}`] }"
                                            @input="method.currency = (method.currency || '').toUpperCase()"
                                        />
                                        <p v-if="formErrors[`paymentCurrency_${index}`]" class="mt-1 text-xs text-red-400">{{ formErrors[`paymentCurrency_${index}`] }}</p>
                                    </div>
                                </template>

                                <!-- Detalhes do Método (Wise, PIX, Outro) -->
                                <div v-else>
                                    <label class="block text-xs font-medium text-neutral-400 mb-1">
                                        Detalhes
                                        <span v-if="method.method === 'Outro'" class="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        v-model="method.details"
                                        :placeholder="getPaymentDetailsPlaceholder(method.method)"
                                        rows="3"
                                        class="w-full px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-md text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        :class="{ 'border-red-500': formErrors[`paymentDetails_${index}`] }"
                                        :required="method.method === 'Outro'"
                                    ></textarea>
                                    <p v-if="formErrors[`paymentDetails_${index}`]" class="mt-1 text-xs text-red-400">{{ formErrors[`paymentDetails_${index}`] }}</p>
                                    <p class="mt-1 text-xs text-neutral-500">
                                        <span v-if="method.method === 'Wise'">Ex: email@exemplo.com</span>
                                        <span v-else-if="method.method === 'PIX'">Ex: Chave PIX (CPF, CNPJ, Email, Telefone ou Chave Aleatória)</span>
                                        <span v-else-if="method.method === 'Outro'">Especifique os detalhes (ex: dados bancários, conta, agência, etc.)</span>
                                        <span v-else>Preencha os detalhes conforme o método selecionado</span>
                                    </p>
                                </div>
                            </div>
                        </div>
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
                            Centro de custo ativo
                        </label>
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

        <!-- Modal Historico de Notas -->
        <div v-if="showHistoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
                <div class="p-6 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">Historico de notas - {{ historyCostCenter?.name }}</h3>
                    <button @click="closeHistoryModal" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto flex-1">
                    <div v-if="historyLoading" class="text-center text-neutral-400 py-8">Carregando notas...</div>
                    <div v-else-if="historyOrders.length === 0" class="text-center text-neutral-400 py-8">Nenhuma nota emitida para este centro de custo.</div>
                    <div v-else>
                        <table class="min-w-full divide-y divide-neutral-700">
                            <thead class="bg-neutral-700 sticky top-0">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Parceiro</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Moeda</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Valor</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Data criacao</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Status</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Data de pagamento</th>
                                </tr>
                            </thead>
                            <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                                <tr v-for="order in paginatedHistoryOrders" :key="order.id" class="hover:bg-neutral-700">
                                    <td class="px-4 py-3 text-sm text-white">{{ getHistoryPartnerName(order.commercialPartnerId) }}</td>
                                    <td class="px-4 py-3 text-sm text-white">{{ order.currency || 'BRL' }}</td>
                                    <td class="px-4 py-3 text-sm text-white">{{ formatHistoryAmount(order.invoiceAmount, order.currency) }}</td>
                                    <td class="px-4 py-3 text-sm text-white">{{ formatHistoryDate(order.createdAt) }}</td>
                                    <td class="px-4 py-3 text-sm">
                                        <span :class="order.status === 'Pago' ? 'bg-green-500' : 'bg-yellow-500'" class="px-2 py-1 text-xs rounded-full text-white">{{ order.status || 'Pendente' }}</span>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-white">{{ formatHistoryDate(order.effectivePaymentDate) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="totalHistoryPages > 1" class="mt-4 flex items-center justify-between text-sm text-neutral-400">
                            <span>Mostrando {{ (historyPage - 1) * 50 + 1 }} a {{ Math.min(historyPage * 50, historyOrders.length) }} de {{ historyOrders.length }}</span>
                            <div class="flex gap-2">
                                <button
                                    @click="historyPage = Math.max(1, historyPage - 1)"
                                    :disabled="historyPage === 1"
                                    class="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded disabled:opacity-50"
                                >Anterior</button>
                                <span class="px-2 py-1.5">Pagina {{ historyPage }} de {{ totalHistoryPages }}</span>
                                <button
                                    @click="historyPage = Math.min(totalHistoryPages, historyPage + 1)"
                                    :disabled="historyPage === totalHistoryPages"
                                    class="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded disabled:opacity-50"
                                >Proxima</button>
                            </div>
                        </div>
                    </div>
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
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const editingItem = ref<any>(null);
const formErrors = ref<Record<string, string>>({});

// Historico de notas
const showHistoryModal = ref(false);
const historyCostCenter = ref<any>(null);
const historyOrders = ref<any[]>([]);
const historyPartners = ref<any[]>([]);
const historyLoading = ref(false);
const historyPage = ref(1);
const HISTORY_PAGE_SIZE = 50;

const ufList = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const taxRegimesList = ref<any[]>([]);
const issMunicipalityList = ref<any[]>([]);
const cnaeList = ref<Array<{ id: string; code: string; denominacao: string; annex_code?: string }>>([]);

const getEmptyFiscalFields = () => ({
    personType: '' as string,
    taxRegimeId: '' as string,
    isMeiOptant: 'false' as string,
    issRetentionIndicator: '' as string,
    presumptionRate: null as number | null,
    inssRate: null as number | null,
    irrfProgressiveTable: false as boolean,
    exteriorInvoice: '' as string,
    exteriorIof: null as number | null
});

const form = ref({
    identifier: '',
    name: '',
    paymentMethods: [] as Array<{ method: string; details: string; wallet?: string; currency?: string }>,
    active: true,
    ...getEmptyFiscalFields(),
    cnpjTaxRegime: '',
    cnpjAccrualRegime: '',
    cnpjCnaePrincipal: '',
    cnpjCnaeSecundarios: [] as string[],
    cnpjMunicipio: '',
    cnpjEstado: '',
    cnpjIssMunicipalityId: '',
    cnpjRegimeStartDate: '',
    cnpjSimplesAnexo: '',
    cnpjMeiOptant: ''
});

const isCNPJ = computed(() => (form.value.identifier || '').replace(/\D/g, '').length === 14);

// Regime tributario selecionado (perfil fiscal): quando for Presumido ou Real, MEI deve ser Nao
const selectedTaxRegime = computed(() => {
    const id = form.value.taxRegimeId;
    if (!id) return null;
    return taxRegimesList.value.find((r: any) => r.id === id) ?? null;
});
const meiOptantForcedToNo = computed(() => {
    const code = selectedTaxRegime.value?.code;
    return code === 'LUCRO_PRESUMIDO' || code === 'LUCRO_REAL';
});

// Regime exibido na secao CNPJ: quando PJ usa o Perfil Fiscal (evita duplicacao)
const cnpjTaxRegimeFromProfile = computed(() => selectedTaxRegime.value?.name ?? '');
const displayRegimeForCnpjSection = computed(() =>
    form.value.personType === 'PJ' ? cnpjTaxRegimeFromProfile.value : form.value.cnpjTaxRegime
);

// Municipio selecionado da matriz de ISS: preenche municipio/UF e exibe aliquota
const selectedIssMunicipality = computed(() => {
    const id = form.value.cnpjIssMunicipalityId;
    if (!id) return null;
    return issMunicipalityList.value.find((m: any) => m.id === id) ?? null;
});

// Forcar Optante MEI = Nao quando regime for Presumido ou Real (perfil fiscal)
watch(() => form.value.taxRegimeId, () => {
    if (meiOptantForcedToNo.value) form.value.isMeiOptant = 'false';
    if (selectedTaxRegime.value?.code === 'SIMPLES_NACIONAL') form.value.cnpjAccrualRegime = 'Competencia';
});
watch(() => form.value.cnpjIssMunicipalityId, (id) => {
    const m = issMunicipalityList.value.find((x: any) => x.id === id);
    if (m) {
        form.value.cnpjMunicipio = m.municipality ?? '';
        form.value.cnpjEstado = m.uf ?? '';
    }
});

// Ao selecionar CNAE principal (Simples Nacional), preencher anexo automaticamente
watch(() => form.value.cnpjCnaePrincipal, (code) => {
    if (displayRegimeForCnpjSection.value !== 'Simples Nacional' || !code) return;
    const cnae = cnaeList.value.find((c: any) => (c.code || '') === code);
    if (cnae?.annex_code) form.value.cnpjSimplesAnexo = `Anexo ${cnae.annex_code}`;
});

// Função para formatar CNPJ ou CPF
const formatIdentifier = (identifier: string): string => {
    if (!identifier) return '';
    const numbers = identifier.replace(/\D/g, '');
    
    if (numbers.length === 11) {
        // CPF: 000.000.000-00
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
        // CNPJ: 00.000.000/0000-00
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return identifier;
};

// Função para formatar input em tempo real
const formatIdentifierInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const numbers = target.value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
        // CPF
        target.value = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
        // CNPJ
        target.value = numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    form.value.identifier = target.value;
};

// Função para validar CNPJ ou CPF
const validateIdentifier = (identifier: string): boolean => {
    const numbers = identifier.replace(/\D/g, '');
    return numbers.length === 11 || numbers.length === 14;
};

// Função para obter placeholder dos detalhes
const getPaymentDetailsPlaceholder = (method: string): string => {
    if (method === 'Wise') {
        return 'Digite o email da conta Wise';
    } else if (method === 'PIX') {
        return 'Digite a chave PIX (CPF, CNPJ, Email, Telefone ou Chave Aleatória)';
    } else if (method === 'Crypto') {
        return 'Use os campos Código da wallet e Sigla da moeda acima';
    } else if (method === 'Outro') {
        return 'Especifique os detalhes (ex: dados bancários, conta, agência, etc.)';
    }
    return 'Preencha os detalhes conforme o método selecionado';
};

// Função para obter métodos de pagamento do item (method, details?, wallet?, currency?)
const getPaymentMethods = (item: any): Array<{ method: string; details?: string; wallet?: string; currency?: string }> => {
    if (!item.paymentMethods) return [];
    try {
        const parsed = typeof item.paymentMethods === 'string' ? JSON.parse(item.paymentMethods) : item.paymentMethods;
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const formatPaymentMethodLabel = (method: { method: string; details?: string; wallet?: string; currency?: string }): string => {
    if (method.method === 'Crypto' && (method.currency || method.wallet)) {
        const c = (method.currency || '').trim();
        const w = (method.wallet || '').trim();
        if (c && w) return `Crypto (${c})`;
        if (c) return `Crypto (${c})`;
        return 'Crypto';
    }
    return method.method || '';
};

// Adicionar método de pagamento (permite mais de 20 wallets/métodos)
const addPaymentMethod = () => {
    form.value.paymentMethods.push({
        method: '',
        details: '',
        wallet: '',
        currency: ''
    });
};

// Remover método de pagamento
const removePaymentMethod = (index: number) => {
    if (form.value.paymentMethods.length > 1) {
        form.value.paymentMethods.splice(index, 1);
    }
};

// Carregar dados
const loadData = async () => {
    try {
        const response = await client.costCenters.get({});
        items.value = response.data || [];
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar centros de custos. Verifique o console para mais detalhes.');
    }
};

// Historico de notas
const openHistoryModal = async (item: any) => {
    historyCostCenter.value = item;
    historyPage.value = 1;
    historyOrders.value = [];
    historyPartners.value = [];
    showHistoryModal.value = true;
    historyLoading.value = true;
    try {
        const [ordersRes, partnersRes] = await Promise.all([
            client.paymentOrders.get({ costCenterId: item.id, limit: '5000' }),
            client.commercialPartners.getAll()
        ]);
        let data: any[] = [];
        if (Array.isArray(ordersRes.data)) {
            data = ordersRes.data;
        } else if (ordersRes.data?.data) {
            data = Array.isArray(ordersRes.data.data) ? ordersRes.data.data : [];
        }
        historyOrders.value = data
            .slice()
            .sort((a: any, b: any) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return db - da;
            });
        const partnersList = partnersRes?.data || (Array.isArray(partnersRes) ? partnersRes : []);
        historyPartners.value = Array.isArray(partnersList) ? partnersList : [];
    } catch (e) {
        console.error('Erro ao carregar historico de notas:', e);
        historyOrders.value = [];
    } finally {
        historyLoading.value = false;
    }
};

const getHistoryPartnerName = (partnerId: string | undefined): string => {
    if (!partnerId) return '-';
    const partner = historyPartners.value.find((p: any) => p.id === partnerId);
    return partner?.name || partnerId;
};

const closeHistoryModal = () => {
    showHistoryModal.value = false;
    historyCostCenter.value = null;
    historyOrders.value = [];
    historyPartners.value = [];
    historyPage.value = 1;
};

const paginatedHistoryOrders = computed(() => {
    const start = (historyPage.value - 1) * HISTORY_PAGE_SIZE;
    return historyOrders.value.slice(start, start + HISTORY_PAGE_SIZE);
});

const totalHistoryPages = computed(() => Math.ceil(historyOrders.value.length / HISTORY_PAGE_SIZE));

const formatHistoryAmount = (value: number | undefined, currency: string) => {
    if (value == null) return '-';
    const c = (currency || 'BRL').toUpperCase();
    if (c === 'BRL') return 'R$ ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${c} ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatHistoryDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getEmptyCnpjFields = () => ({
    cnpjTaxRegime: '',
    cnpjAccrualRegime: '',
    cnpjCnaePrincipal: '',
    cnpjCnaeSecundarios: [] as string[],
    cnpjMunicipio: '',
    cnpjEstado: '',
    cnpjIssMunicipalityId: '',
    cnpjRegimeStartDate: '',
    cnpjSimplesAnexo: '',
    cnpjMeiOptant: ''
});

const onCnpjTaxRegimeChange = () => {
    if (form.value.cnpjTaxRegime === 'Simples Nacional') {
        form.value.cnpjAccrualRegime = 'Competencia';
    }
};

const addCnpjCnaeSecundario = () => {
    form.value.cnpjCnaeSecundarios.push('');
};

const removeCnpjCnaeSecundario = (index: number) => {
    form.value.cnpjCnaeSecundarios.splice(index, 1);
};

// Abrir dialog de adicionar
const openAddDialog = () => {
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        identifier: '',
        name: '',
        paymentMethods: [{ method: '', details: '', wallet: '', currency: '' }],
        active: true,
        ...getEmptyFiscalFields(),
        ...getEmptyCnpjFields()
    };
    formErrors.value = {};
    showDialog.value = true;
};

// Editar item
const editItem = (item: any) => {
    isEditing.value = true;
    editingItem.value = item;
    
    const paymentMethods = getPaymentMethods(item);
    let cnpjFields = getEmptyCnpjFields();
    if (item.cnpjDetails) {
        try {
            const d = typeof item.cnpjDetails === 'string' ? JSON.parse(item.cnpjDetails) : item.cnpjDetails;
            const taxRegime = d.taxRegime ?? '';
            cnpjFields = {
                cnpjTaxRegime: taxRegime,
                cnpjAccrualRegime: taxRegime === 'Simples Nacional' ? 'Competencia' : (d.accrualRegime ?? ''),
                cnpjCnaePrincipal: d.cnaePrincipal ?? '',
                cnpjCnaeSecundarios: Array.isArray(d.cnaeSecundarios) ? d.cnaeSecundarios : [],
                cnpjMunicipio: d.municipality ?? '',
                cnpjEstado: d.state ?? '',
                cnpjIssMunicipalityId: '',
                cnpjRegimeStartDate: d.regimeStartDate ?? '',
                cnpjSimplesAnexo: d.simplesAnexo ?? '',
                cnpjMeiOptant: d.meiOptant ?? ''
            };
        } catch (_) {}
    }
    
    let fiscalFields = getEmptyFiscalFields();
    if (item.tax_regime_id) fiscalFields.taxRegimeId = String(item.tax_regime_id);
    fiscalFields.isMeiOptant = item.is_mei_optant === true || item.is_mei_optant === 1 ? 'true' : 'false';
    if (item.fiscal_profile) {
        try {
            const fp = typeof item.fiscal_profile === 'string' ? JSON.parse(item.fiscal_profile) : item.fiscal_profile;
            fiscalFields = {
                ...fiscalFields,
                personType: fp.personType ?? '',
                issRetentionIndicator: fp.issRetentionIndicator ?? '',
                presumptionRate: fp.presumptionRate != null ? fp.presumptionRate : null,
                inssRate: fp.inssRate != null ? fp.inssRate : null,
                irrfProgressiveTable: fp.irrfProgressiveTable === true,
                exteriorInvoice: fp.exteriorInvoice ?? '',
                exteriorIof: fp.exteriorIof != null ? fp.exteriorIof : null
            };
            if (fp.taxRegimeId) fiscalFields.taxRegimeId = String(fp.taxRegimeId);
            if (item.tax_regime_id) fiscalFields.taxRegimeId = String(item.tax_regime_id);
        } catch (_) {}
    }
    
    form.value = {
        identifier: item.identifier || '',
        name: item.name || '',
        paymentMethods: paymentMethods.length > 0 ? paymentMethods.map((m: any) => ({
            method: m.method || '',
            details: m.details ?? '',
            wallet: m.wallet ?? '',
            currency: m.currency ?? ''
        })) : [{ method: '', details: '', wallet: '', currency: '' }],
        active: item.active !== undefined ? item.active : true,
        ...fiscalFields,
        ...cnpjFields
    };
    const mun = (form.value.cnpjMunicipio || '').trim();
    const uf = (form.value.cnpjEstado || '').trim();
    if (mun && uf) {
        const found = issMunicipalityList.value.find((m: any) => (m.municipality || '').trim() === mun && (m.uf || '').trim() === uf);
        if (found) form.value.cnpjIssMunicipalityId = found.id;
    }
    // Forcar MEI = Nao quando regime for Presumido ou Real (ao abrir edicao)
    const regime = taxRegimesList.value.find((r: any) => r.id === form.value.taxRegimeId);
    if (regime?.code === 'LUCRO_PRESUMIDO' || regime?.code === 'LUCRO_REAL') form.value.isMeiOptant = 'false';
    formErrors.value = {};
    showDialog.value = true;
};

const copyIdToClipboard = async (id: string | undefined) => {
    if (!id) return;
    try {
        await navigator.clipboard.writeText(id);
        alert('ID copiado para a area de transferencia.');
    } catch {
        alert('Nao foi possivel copiar. Copie o ID manualmente.');
    }
};

// Fechar dialog
const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        identifier: '',
        name: '',
        paymentMethods: [{ method: '', details: '', wallet: '', currency: '' }],
        active: true,
        ...getEmptyFiscalFields(),
        ...getEmptyCnpjFields()
    };
    formErrors.value = {};
};

// Salvar centro de custo
const saveCostCenter = async () => {
    formErrors.value = {};

    // Validações
    if (!form.value.identifier) {
        formErrors.value.identifier = 'Identificador é obrigatório';
    } else if (!validateIdentifier(form.value.identifier)) {
        formErrors.value.identifier = 'CNPJ deve ter 14 dígitos ou CPF deve ter 11 dígitos';
    }

    if (!form.value.name || form.value.name.trim() === '') {
        formErrors.value.name = 'Nome é obrigatório';
    }

    // Validar métodos de pagamento
    if (form.value.paymentMethods.length === 0) {
        formErrors.value.paymentMethods = 'É necessário pelo menos um método de recebimento';
    } else {
        form.value.paymentMethods.forEach((method, index) => {
            if (!method.method || method.method.trim() === '') {
                formErrors.value[`paymentMethod_${index}`] = 'Tipo de método é obrigatório';
            }
            if (method.method === 'Outro' && (!method.details || method.details.trim() === '')) {
                formErrors.value[`paymentDetails_${index}`] = 'Detalhes são obrigatórios quando o método é "Outro"';
            }
            if (method.method === 'Crypto') {
                if (!method.wallet || !method.wallet.trim()) {
                    formErrors.value[`paymentWallet_${index}`] = 'Código da wallet é obrigatório para Crypto';
                }
                if (!method.currency || !method.currency.trim()) {
                    formErrors.value[`paymentCurrency_${index}`] = 'Sigla da moeda é obrigatória para Crypto';
                }
            }
        });
    }

    if (Object.keys(formErrors.value).length > 0) {
        return;
    }

    saving.value = true;

    try {
        const serializedMethods = form.value.paymentMethods.map((m) => {
            if (m.method === 'Crypto') {
                return { method: 'Crypto', wallet: (m.wallet || '').trim(), currency: (m.currency || '').trim().toUpperCase() };
            }
            return { method: m.method, details: (m.details || '').trim() };
        });
        const data: Record<string, unknown> = {
            identifier: form.value.identifier.replace(/\D/g, ''),
            name: form.value.name.trim(),
            paymentMethods: JSON.stringify(serializedMethods),
            active: form.value.active
        };
        if (form.value.taxRegimeId) data.tax_regime_id = form.value.taxRegimeId;
        data.is_mei_optant = form.value.isMeiOptant === 'true';
        data.fiscal_profile = JSON.stringify({
            personType: form.value.personType || null,
            issRetentionIndicator: form.value.issRetentionIndicator || null,
            presumptionRate: form.value.presumptionRate != null ? form.value.presumptionRate : null,
            inssRate: form.value.inssRate != null ? form.value.inssRate : null,
            irrfProgressiveTable: form.value.irrfProgressiveTable === true,
            exteriorInvoice: form.value.exteriorInvoice?.trim() || null,
            exteriorIof: form.value.exteriorIof != null ? form.value.exteriorIof : null
        });
        if (isCNPJ.value) {
            const taxRegimeForCnpj = form.value.personType === 'PJ' && selectedTaxRegime.value
                ? selectedTaxRegime.value.name
                : form.value.cnpjTaxRegime || null;
            const meiOptantForCnpj = form.value.personType === 'PJ'
                ? (form.value.isMeiOptant === 'true' ? 'Sim' : 'Nao')
                : (form.value.cnpjMeiOptant || null);
            const issPct = selectedIssMunicipality.value?.percent != null ? selectedIssMunicipality.value.percent : null;
            data.cnpjDetails = JSON.stringify({
                taxRegime: taxRegimeForCnpj,
                accrualRegime: form.value.cnpjAccrualRegime || null,
                cnaePrincipal: form.value.cnpjCnaePrincipal?.trim() || null,
                cnaeSecundarios: (form.value.cnpjCnaeSecundarios || []).map((c: string) => (c || '').trim()).filter(Boolean),
                municipality: form.value.cnpjMunicipio?.trim() || null,
                state: form.value.cnpjEstado || null,
                regimeStartDate: form.value.cnpjRegimeStartDate || null,
                simplesAnexo: form.value.cnpjSimplesAnexo || null,
                issPercentage: issPct,
                meiOptant: meiOptantForCnpj
            });
        }

        if (isEditing.value && editingItem.value) {
            await client.costCenters.update(editingItem.value.id, data);
        } else {
            await client.costCenters.insert(data);
        }

        await loadData();
        closeDialog();
    } catch (error: any) {
        console.error('Erro ao salvar centro de custo:', error);
        
        // Tratar erros específicos
        if (error.response?.data?.message) {
            const errorMessage = error.response.data.message;
            if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
                formErrors.value.identifier = 'Este identificador já está cadastrado';
            } else {
                alert(`Erro ao salvar: ${errorMessage}`);
            }
        } else {
            alert('Erro ao salvar centro de custo. Verifique o console para mais detalhes.');
        }
    } finally {
        saving.value = false;
    }
};

// Excluir item
const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este centro de custo?')) {
        return;
    }

    try {
        await client.costCenters.delete(id);
        await loadData();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir centro de custo. Verifique o console para mais detalhes.');
    }
};

onMounted(async () => {
    loadData();
    try {
        const res = await client.taxRegimes.get({});
        taxRegimesList.value = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
    } catch (_) {
        taxRegimesList.value = [];
    }
    try {
        const issRes = await client.taxIssMunicipality.get({});
        issMunicipalityList.value = Array.isArray(issRes?.data) ? issRes.data : (issRes?.items ?? []) || [];
    } catch (_) {
        issMunicipalityList.value = [];
    }
    try {
        const cnaeRes = await client.simplesNacionalCnae.get({});
        cnaeList.value = Array.isArray(cnaeRes?.data) ? cnaeRes.data : (cnaeRes?.items ?? []) || [];
    } catch (_) {
        cnaeList.value = [];
    }
});
</script>
