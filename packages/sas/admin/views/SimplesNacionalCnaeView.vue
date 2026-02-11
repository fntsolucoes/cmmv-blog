<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Cadastro de CNAEs (Simples Nacional)</h1>
            <button
                @click="openAdd"
                class="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Novo CNAE
            </button>
        </div>

        <p class="text-sm text-neutral-400">
            CNAEs permitidos no Simples Nacional. Estes itens sao utilizados no cadastro de centros de custo (CNAE principal e secundarios) e definem o anexo e se ha Fator R.
        </p>

        <div class="bg-neutral-800 rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-neutral-700">
                <thead class="bg-neutral-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Codigo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Denominacao</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Anexo</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Fator R</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Acoes</th>
                    </tr>
                </thead>
                <tbody class="bg-neutral-800 divide-y divide-neutral-700">
                    <tr v-if="loading">
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-neutral-400">Carregando...</td>
                    </tr>
                    <tr v-else-if="items.length === 0">
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-neutral-400">Nenhum CNAE cadastrado. Clique em Novo CNAE.</td>
                    </tr>
                    <tr v-for="row in items" :key="row.id" class="hover:bg-neutral-700">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-white">{{ row.code }}</td>
                        <td class="px-6 py-4 text-sm text-white">{{ row.denominacao }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{{ row.annex_code ? `Anexo ${row.annex_code}` : '-' }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="getFatorR(row) ? 'bg-amber-500' : 'bg-neutral-500'" class="px-2 py-1 text-xs rounded-full text-white">
                                {{ getFatorR(row) ? 'Sim' : 'Nao' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                                @click="openEdit(row)"
                                class="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-neutral-600 transition-colors mr-1"
                                title="Editar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                @click="deleteCnae(row.id)"
                                class="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-neutral-600 transition-colors"
                                title="Excluir"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal Novo/Editar CNAE -->
        <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" style="backdrop-filter: blur(4px);">
            <div class="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md">
                <div class="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-white">{{ editingItem ? 'Editar CNAE' : 'Novo CNAE' }}</h3>
                    <button @click="showDialog = false" class="text-neutral-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form @submit.prevent="saveCnae" class="p-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Codigo <span class="text-red-500">*</span></label>
                        <input
                            v-model="form.code"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 0111-3/01 ou 62.01-5-00"
                            required
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Denominacao <span class="text-red-500">*</span></label>
                        <input
                            v-model="form.denominacao"
                            type="text"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Cultivo de arroz"
                            required
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-300 mb-1">Anexo</label>
                        <select
                            v-model="form.annex_code"
                            class="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Nenhum</option>
                            <option value="I">Anexo I</option>
                            <option value="II">Anexo II</option>
                            <option value="III">Anexo III</option>
                            <option value="IV">Anexo IV</option>
                            <option value="V">Anexo V</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <input
                            v-model="form.fator_r"
                            type="checkbox"
                            id="fator-r"
                            class="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-blue-600 focus:ring-blue-500"
                        />
                        <label for="fator-r" class="text-sm font-medium text-neutral-300">Possui Fator R</label>
                    </div>
                    <p class="text-xs text-neutral-500">CNAEs com Fator R podem optar pelo Anexo III quando folha/receita for maior ou igual a 28%.</p>
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" @click="showDialog = false" class="px-3 py-1.5 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm">Cancelar</button>
                        <button type="submit" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();
const items = ref<any[]>([]);
const loading = ref(false);
const showDialog = ref(false);
const editingItem = ref<any>(null);
const saving = ref(false);

const form = ref({
    code: '',
    denominacao: '',
    annex_code: '' as string,
    fator_r: false
});

function getFatorR(row: any): boolean {
    return row.fator_r === true || row.fator_r === 1;
}

async function loadData() {
    loading.value = true;
    try {
        const res = await client.simplesNacionalCnae.get({});
        items.value = Array.isArray(res?.data) ? res.data : (res?.items ?? []) || [];
    } catch (_) {
        items.value = [];
    } finally {
        loading.value = false;
    }
}

const openAdd = () => {
    editingItem.value = null;
    form.value = { code: '', denominacao: '', annex_code: '', fator_r: false };
    showDialog.value = true;
};

const openEdit = (row: any) => {
    editingItem.value = row;
    form.value = {
        code: row.code || '',
        denominacao: row.denominacao || '',
        annex_code: row.annex_code || '',
        fator_r: getFatorR(row)
    };
    showDialog.value = true;
};

const saveCnae = async () => {
    if (saving.value) return;
    saving.value = true;
    try {
        const payload = {
            code: form.value.code.trim(),
            denominacao: form.value.denominacao.trim(),
            annex_code: form.value.annex_code || null,
            fator_r: form.value.fator_r
        };
        if (editingItem.value?.id) {
            await client.simplesNacionalCnae.update(editingItem.value.id, payload);
        } else {
            await client.simplesNacionalCnae.insert(payload);
        }
        showDialog.value = false;
        editingItem.value = null;
        await loadData();
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Erro ao salvar';
        alert(msg);
    } finally {
        saving.value = false;
    }
};

const deleteCnae = async (id: string) => {
    if (!confirm('Excluir este CNAE? Centros de custo que o utilizem poderao ficar inconsistentes.')) return;
    try {
        await client.simplesNacionalCnae.delete(id);
        await loadData();
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Erro ao excluir';
        alert(msg);
    }
};

onMounted(() => {
    loadData();
});
</script>
