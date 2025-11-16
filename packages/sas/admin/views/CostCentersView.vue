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
                                    {{ method.method }}
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
                            <button @click="editItem(item)" class="text-blue-400 hover:text-blue-300 mr-3">Editar</button>
                            <button @click="deleteItem(item.id)" class="text-red-400 hover:text-red-300">Excluir</button>
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
                                        <option value="Outro">Outro</option>
                                    </select>
                                    <p v-if="formErrors[`paymentMethod_${index}`]" class="mt-1 text-xs text-red-400">{{ formErrors[`paymentMethod_${index}`] }}</p>
                                </div>

                                <!-- Detalhes do Método -->
                                <div>
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
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSasClient } from '../client';

const client = useSasClient();
const items = ref<any[]>([]);
const showDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const editingItem = ref<any>(null);
const formErrors = ref<Record<string, string>>({});

const form = ref({
    identifier: '',
    name: '',
    paymentMethods: [] as Array<{ method: string; details: string }>,
    active: true
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
    } else if (method === 'Outro') {
        return 'Especifique os detalhes (ex: dados bancários, conta, agência, etc.)';
    }
    return 'Preencha os detalhes conforme o método selecionado';
};

// Função para obter métodos de pagamento do item
const getPaymentMethods = (item: any): Array<{ method: string; details: string }> => {
    if (!item.paymentMethods) return [];
    try {
        if (typeof item.paymentMethods === 'string') {
            return JSON.parse(item.paymentMethods);
        }
        return item.paymentMethods;
    } catch (error) {
        return [];
    }
};

// Adicionar método de pagamento
const addPaymentMethod = () => {
    form.value.paymentMethods.push({
        method: '',
        details: ''
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

// Abrir dialog de adicionar
const openAddDialog = () => {
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        identifier: '',
        name: '',
        paymentMethods: [{ method: '', details: '' }],
        active: true
    };
    formErrors.value = {};
    showDialog.value = true;
};

// Editar item
const editItem = (item: any) => {
    isEditing.value = true;
    editingItem.value = item;
    
    const paymentMethods = getPaymentMethods(item);
    
    form.value = {
        identifier: item.identifier || '',
        name: item.name || '',
        paymentMethods: paymentMethods.length > 0 ? paymentMethods : [{ method: '', details: '' }],
        active: item.active !== undefined ? item.active : true
    };
    formErrors.value = {};
    showDialog.value = true;
};

// Fechar dialog
const closeDialog = () => {
    showDialog.value = false;
    isEditing.value = false;
    editingItem.value = null;
    form.value = {
        identifier: '',
        name: '',
        paymentMethods: [{ method: '', details: '' }],
        active: true
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
        });
    }

    if (Object.keys(formErrors.value).length > 0) {
        return;
    }

    saving.value = true;

    try {
        const data = {
            identifier: form.value.identifier.replace(/\D/g, ''), // Salvar apenas números
            name: form.value.name.trim(),
            paymentMethods: JSON.stringify(form.value.paymentMethods),
            active: form.value.active
        };

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

onMounted(() => {
    loadData();
});
</script>
