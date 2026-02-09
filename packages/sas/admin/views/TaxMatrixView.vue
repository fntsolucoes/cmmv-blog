<template>
    <div class="space-y-8">
        <h1 class="text-2xl font-bold text-white">Matriz de Configuracao de Impostos</h1>

        <!-- Retencoes Federais -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <h2 class="px-6 py-3 bg-neutral-700 text-sm font-medium text-white border-b border-neutral-600">Tabela de Retencoes Federais</h2>
            <p class="px-6 py-2 text-xs text-neutral-400">Gatilho de valor: R$ 215,05 (retencao 4,65% aplicada quando a ordem ultrapassar este valor no mes).</p>
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Imposto</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Aliquota (%)</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Valor minimo (R$)</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Ativo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Acoes</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="generalRules.length === 0">
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-neutral-400">Nenhuma regra cadastrada</td>
                    </tr>
                    <tr v-for="r in generalRules" :key="r.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-3 text-sm text-white">{{ r.tax_name }}</td>
                        <td class="px-6 py-3 text-sm text-neutral-300">{{ formatNum(r.percentage) }}</td>
                        <td class="px-6 py-3 text-sm text-neutral-300">{{ r.min_threshold != null ? formatNum(r.min_threshold) : '-' }}</td>
                        <td class="px-6 py-3">
                            <span :class="r.active ? 'bg-green-500' : 'bg-neutral-500'" class="px-2 py-1 text-xs rounded-full text-white">{{ r.active ? 'Sim' : 'Nao' }}</span>
                        </td>
                        <td class="px-6 py-3">
                            <button @click="openEditRule(r)" class="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Adicional IRPJ (Lucro Presumido) -->
        <div v-if="adicionalIrpjRule" class="bg-neutral-800 rounded-lg overflow-hidden">
            <h2 class="px-6 py-3 bg-neutral-700 text-sm font-medium text-white border-b border-neutral-600">Adicional IRPJ (Lucro Presumido)</h2>
            <p class="px-6 py-2 text-xs text-neutral-400">Incide sobre a parcela da base presumida que exceder o limite mensal. Usado no calculo do Lucro Presumido (Base_IR &gt; limite).</p>
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Imposto</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Aliquota (%)</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Limite mensal (R$)</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Ativo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Acoes</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr class="hover:bg-neutral-700">
                        <td class="px-6 py-3 text-sm text-white">{{ adicionalIrpjRule.tax_name }}</td>
                        <td class="px-6 py-3 text-sm text-neutral-300">{{ formatNum(adicionalIrpjRule.percentage) }}</td>
                        <td class="px-6 py-3 text-sm text-neutral-300">{{ adicionalIrpjRule.min_threshold != null ? formatCurrency(adicionalIrpjRule.min_threshold) : '-' }}</td>
                        <td class="px-6 py-3">
                            <span :class="adicionalIrpjRule.active ? 'bg-green-500' : 'bg-neutral-500'" class="px-2 py-1 text-xs rounded-full text-white">{{ adicionalIrpjRule.active ? 'Sim' : 'Nao' }}</span>
                        </td>
                        <td class="px-6 py-3">
                            <button @click="openEditRule(adicionalIrpjRule)" class="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p class="px-6 py-2 text-xs text-neutral-500">Formula: SE(Base_IR &gt; Limite, (Base_IR - Limite) x Aliquota, 0). Ex.: Base_IR = R$ 128.000, Limite = R$ 20.000, Adicional = (128.000 - 20.000) x 10% = R$ 10.800.</p>
        </div>

        <!-- ISS por Municipio -->
        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <div class="px-6 py-3 bg-neutral-700 flex flex-wrap items-center justify-between gap-2">
                <h2 class="text-sm font-medium text-white">Aliquotas de ISS por Municipio</h2>
                <button @click="openAddIss" class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md">Novo Municipio</button>
            </div>
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Municipio</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">UF</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">ISS (%)</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Acoes</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="issList.length === 0">
                        <td colspan="4" class="px-6 py-4 text-center text-sm text-neutral-400">Nenhum municipio cadastrado. Adicione para sugerir aliquota ao selecionar centro de custo.</td>
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

        <!-- Modal Editar Regra Federal -->
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
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Aliquota (%)</label>
                        <input v-model.number="ruleForm.percentage" type="number" step="0.01" min="0" max="100" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Valor minimo para aplicar (R$)</label>
                        <input v-model.number="ruleForm.min_threshold" type="number" step="0.01" min="0" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="215.05" />
                        <p class="mt-1 text-xs text-neutral-400">Deixe vazio se nao houver minimo.</p>
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
                    <h3 class="text-lg font-medium text-white">{{ editingIss ? 'Editar municipio' : 'Novo municipio' }}</h3>
                    <button @click="showIssDialog = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form @submit.prevent="saveIss" class="p-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Municipio <span class="text-red-500">*</span></label>
                        <input v-model="issForm.municipality" type="text" class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" placeholder="Sao Paulo" required />
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
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();
const federalRules = ref<any[]>([]);
const issList = ref<any[]>([]);

const generalRules = computed(() => federalRules.value.filter((r: any) => r.tax_name !== 'ADICIONAL_IRPJ'));
const adicionalIrpjRule = computed(() => federalRules.value.find((r: any) => r.tax_name === 'ADICIONAL_IRPJ') ?? null);
const showRuleDialog = ref(false);
const showIssDialog = ref(false);
const editingRule = ref<any>(null);
const editingIss = ref<any>(null);

const ruleForm = ref({ percentage: 0, min_threshold: null as number | null });
const issForm = ref({ municipality: '', uf: '', percent: 5 });

const ufList = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const formatNum = (n: number) => (n != null ? Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-');
const formatCurrency = (n: number) => (n != null ? 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-');

const loadFederalRules = async () => {
    try {
        const res = await client.taxRules.get({});
        federalRules.value = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
    } catch (_) {
        federalRules.value = [];
    }
};

const loadIss = async () => {
    try {
        const res = await client.taxIssMunicipality.get({});
        issList.value = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
    } catch (_) {
        issList.value = [];
    }
};

const openEditRule = (r: any) => {
    editingRule.value = r;
    ruleForm.value = { percentage: r.percentage ?? 0, min_threshold: r.min_threshold != null ? r.min_threshold : null };
    showRuleDialog.value = true;
};

const saveRule = async () => {
    if (!editingRule.value?.id) return;
    try {
        await client.taxRules.update(editingRule.value.id, {
            percentage: ruleForm.value.percentage,
            min_threshold: ruleForm.value.min_threshold ?? undefined
        });
        await loadFederalRules();
        showRuleDialog.value = false;
        editingRule.value = null;
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar regra.');
    }
};

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
        alert('Erro ao salvar municipio.');
    }
};

const deleteIss = async (id: string) => {
    if (!confirm('Excluir este municipio da tabela de ISS?')) return;
    try {
        await client.taxIssMunicipality.delete(id);
        await loadIss();
    } catch (e) {
        console.error(e);
        alert('Erro ao excluir.');
    }
};

onMounted(() => {
    loadFederalRules();
    loadIss();
});
</script>
