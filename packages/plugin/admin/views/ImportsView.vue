<template>
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Imports</h1>
        </div>

        <div v-if="activeImports.length > 0 || selectedImportId" class="bg-neutral-800 rounded-lg shadow-md mb-6">
            <div class="p-6 border-b border-neutral-700">
                <h2 class="text-lg font-medium text-white">Active Imports</h2>
                <p class="text-sm text-neutral-400 mt-1">View the progress of your content imports</p>
            </div>

            <div class="p-6 space-y-6">
                <div v-if="!selectedImportId" class="grid grid-cols-1 gap-4">
                    <div v-for="importItem in activeImports" :key="importItem.id"
                         class="bg-neutral-700 rounded-lg p-4 hover:bg-neutral-600 cursor-pointer transition-colors"
                         @click="viewImportDetails(importItem.id)">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-2">
                                <span class="text-lg font-medium text-white capitalize">{{ importItem.platform }} Import</span>
                                <span :class="{
                                    'bg-blue-500': importItem.status === 'pending',
                                    'bg-yellow-500': importItem.status === 'processing',
                                    'bg-green-500': importItem.status === 'completed',
                                    'bg-red-500': importItem.status === 'failed'
                                }" class="px-2 py-0.5 text-xs rounded-full text-white">
                                    {{ importItem.status }}
                                </span>
                            </div>
                            <span class="text-sm text-neutral-400">
                                {{ new Date(importItem.startTime).toLocaleString() }}
                            </span>
                        </div>
                        <div class="w-full bg-neutral-800 rounded-full h-2.5 mb-2">
                            <div class="h-2.5 rounded-full"
                                :style="{width: `${Math.round((importItem.processedItems / importItem.totalItems) * 100)}%`}"
                                :class="{
                                    'bg-blue-500': importItem.status === 'pending',
                                    'bg-yellow-500': importItem.status === 'processing',
                                    'bg-green-500': importItem.status === 'completed',
                                    'bg-red-500': importItem.status === 'failed'
                                }">
                            </div>
                        </div>
                        <div class="flex justify-between text-sm text-neutral-400">
                            <span>{{ importItem.processedItems }} / {{ importItem.totalItems }} items</span>
                            <span>{{ Math.round((importItem.processedItems / importItem.totalItems) * 100) }}% complete</span>
                        </div>
                    </div>
                </div>

                <div v-else>
                    <div class="flex justify-between mb-4">
                        <button @click="selectedImportId = null" class="text-blue-400 hover:text-blue-300 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            Back to imports
                        </button>
                        <div class="text-sm">
                            <span class="text-neutral-400">Started: </span>
                            <span class="text-white">{{ selectedImport?.startTime ? new Date(selectedImport.startTime).toLocaleString() : '' }}</span>
                            <span v-if="selectedImport?.endTime" class="ml-4 text-neutral-400">Ended: </span>
                            <span v-if="selectedImport?.endTime" class="text-white">{{ new Date(selectedImport.endTime).toLocaleString() }}</span>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-2">
                                <span class="text-lg font-medium text-white capitalize">{{ selectedImport?.platform }} Import</span>
                                <span :class="{
                                    'bg-blue-500': selectedImport?.status === 'pending',
                                    'bg-yellow-500': selectedImport?.status === 'processing',
                                    'bg-green-500': selectedImport?.status === 'completed',
                                    'bg-red-500': selectedImport?.status === 'failed'
                                }" class="px-2 py-0.5 text-xs rounded-full text-white">
                                    {{ selectedImport?.status }}
                                </span>
                            </div>
                            <span class="text-sm">
                                <span class="text-neutral-400">ID: </span>
                                <span class="text-white">{{ selectedImport?.id }}</span>
                            </span>
                        </div>
                        <div class="w-full bg-neutral-800 rounded-full h-2.5 mb-2">
                            <div class="h-2.5 rounded-full"
                                :style="{width: selectedImport ? `${Math.round((selectedImport.processedItems / selectedImport.totalItems) * 100)}%` : '0%'}"
                                :class="{
                                    'bg-blue-500': selectedImport?.status === 'pending',
                                    'bg-yellow-500': selectedImport?.status === 'processing',
                                    'bg-green-500': selectedImport?.status === 'completed',
                                    'bg-red-500': selectedImport?.status === 'failed'
                                }">
                            </div>
                        </div>
                        <div class="flex justify-between text-sm text-neutral-400">
                            <span>{{ selectedImport?.processedItems || 0 }} / {{ selectedImport?.totalItems || 0 }} items</span>
                            <span>{{ selectedImport ? Math.round((selectedImport.processedItems / selectedImport.totalItems) * 100) : 0 }}% complete</span>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h3 class="text-md font-medium text-white mb-2">Import Logs</h3>
                        <div class="bg-neutral-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                            <div v-for="(log, index) in selectedImport?.logs" :key="index" class="mb-2">
                                <div class="flex">
                                    <span class="text-neutral-500 mr-2">{{ new Date(log.timestamp).toLocaleTimeString() }}</span>
                                    <span :class="{
                                        'text-white': log.type === 'info',
                                        'text-yellow-400': log.type === 'warning',
                                        'text-red-400': log.type === 'error'
                                    }">{{ log.message }}</span>
                                </div>
                            </div>
                            <div v-if="!selectedImport?.logs?.length" class="text-neutral-500 text-center py-4">
                                No logs available
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-end">
                        <span class="text-sm text-neutral-400 mr-2">Auto-refresh</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" v-model="autoRefresh" class="sr-only peer">
                            <div class="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-neutral-800 rounded-lg shadow-md">
            <div class="p-6 border-b border-neutral-700">
                <h2 class="text-lg font-medium text-white">Import Content</h2>
                <p class="text-sm text-neutral-400 mt-1">Import your content from other platforms to CMMV Blog</p>
            </div>

            <div class="p-6 space-y-8">
                <div class="border-b border-neutral-700 pb-8">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full flex items-center justify-center bg-white" style="width: 56px; height: 56px;">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Wordpress-Logo.svg/512px-Wordpress-Logo.svg.png?20210511042647"
                                    alt="WordPress Logo"
                                    class="h-8 w-auto text-white"
                                />
                            </div>
                            <div class="ml-4">
                                <h3 class="text-lg font-medium text-white">WordPress</h3>
                                <p class="text-sm text-neutral-400">Import content from your WordPress site</p>
                            </div>
                        </div>
                        <button @click="importFrom('wordpress')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200">Import</button>
                    </div>
                    <div v-if="activeImporter === 'wordpress'" class="mt-6 bg-neutral-700/30 p-4 rounded-lg">
                        <p class="text-sm text-neutral-300 mb-4">
                            Export your WordPress content using the WordPress export tool, then upload the XML file below.
                        </p>
                        <div class="flex items-start space-x-4">
                            <div class="flex-grow">
                                <div class="flex items-center justify-center w-full">
                                    <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-600 border-dashed rounded-lg cursor-pointer bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                        <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg class="w-8 h-8 mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                            </svg>
                                            <p class="mb-2 text-sm text-neutral-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p class="text-xs text-neutral-500">WordPress XML export file (MAX. 10MB)</p>
                                        </div>
                                        <input
                                            type="file"
                                            class="hidden"
                                            accept=".xml"
                                            ref="wordpressFileInput"
                                            @change="handleFileUpload('wordpress')"
                                        />
                                    </label>
                                </div>
                                <div v-if="files.wordpress" class="flex items-center mt-2">
                                    <div class="text-sm text-neutral-400">{{ files.wordpress.name }}</div>
                                    <button @click="removeFile('wordpress')" class="ml-2 text-red-400 hover:text-red-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <button
                                @click="uploadFile('wordpress')"
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex-shrink-0 self-end"
                                :disabled="!files.wordpress || importing.wordpress"
                                :class="{ 'opacity-50 cursor-not-allowed': !files.wordpress || importing.wordpress }"
                            >
                                <span v-if="!importing.wordpress">Start Import</span>
                                <span v-else class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Importing...
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Ghost Import -->
                <!--div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="bg-white p-3 rounded-full flex items-center justify-center" style="width: 56px; height: 56px;">
                                <img
                                    src="https://ghost.org/images/logos/ghost-logo-orb.png"
                                    alt="Ghost Logo"
                                    class="h-8 w-auto"
                                />
                            </div>
                            <div class="ml-4">
                                <h3 class="text-lg font-medium text-white">Ghost</h3>
                                <p class="text-sm text-neutral-400">Import content from your Ghost site</p>
                            </div>
                        </div>
                        <button @click="importFrom('ghost')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200">Import</button>
                    </div>
                    <div v-if="activeImporter === 'ghost'" class="mt-6 bg-neutral-700/30 p-4 rounded-lg">
                        <p class="text-sm text-neutral-300 mb-4">
                            Export your Ghost content using the Ghost export tool, then upload the JSON file below.
                        </p>
                        <div class="flex items-start space-x-4">
                            <div class="flex-grow">
                                <div class="flex items-center justify-center w-full">
                                    <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-600 border-dashed rounded-lg cursor-pointer bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                        <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg class="w-8 h-8 mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                            </svg>
                                            <p class="mb-2 text-sm text-neutral-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p class="text-xs text-neutral-500">Ghost JSON export file (MAX. 10MB)</p>
                                        </div>
                                        <input
                                            type="file"
                                            class="hidden"
                                            accept=".json"
                                            ref="ghostFileInput"
                                            @change="handleFileUpload('ghost')"
                                        />
                                    </label>
                                </div>
                                <div v-if="files.ghost" class="flex items-center mt-2">
                                    <div class="text-sm text-neutral-400">{{ files.ghost.name }}</div>
                                    <button @click="removeFile('ghost')" class="ml-2 text-red-400 hover:text-red-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <button
                                @click="uploadFile('ghost')"
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex-shrink-0 self-end"
                                :disabled="!files.ghost || importing.ghost"
                                :class="{ 'opacity-50 cursor-not-allowed': !files.ghost || importing.ghost }"
                            >
                                <span v-if="!importing.ghost">Start Import</span>
                                <span v-else class="flex items-center">
                                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Importing...
                                </span>
                            </button>
                        </div>
                    </div>
                </div>-->
            </div>
        </div>
    </div>

    <ToastNotification
        :show="notification.show"
        :message="notification.message"
        :type="notification.type"
        :duration="notification.duration"
        @close="notification.show = false"
    />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useAdminClient } from '@cmmv/blog/admin/client';
import ToastNotification from '../components/ToastNotification.vue';

const adminClient = useAdminClient();

const activeImporter = ref(null);
const files = ref({
    wordpress: null,
    ghost: null
});
const importing = ref({
    wordpress: false,
    ghost: false
});

const wordpressFileInput = ref(null);
const ghostFileInput = ref(null);
const activeImports = ref([]);
const selectedImportId = ref(null);
const lastImportId = ref(null);
const pollingInterval = ref(null);
const autoRefresh = ref(true);

const selectedImport = computed(() => {
    if (!selectedImportId.value) return null;
    return activeImports.value.find(imp => imp.id === selectedImportId.value);
});

const fetchActiveImports = async () => {
    try {
        const response = await adminClient.imports.progress();

        if (response.data) {
            activeImports.value = response.data;

            if (lastImportId.value && !selectedImportId.value) {
                const foundImport = activeImports.value.find(imp => imp.id === lastImportId.value);
                if (foundImport) {
                    selectedImportId.value = lastImportId.value;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching active imports:', error);
        showNotification('error', `Error fetching import progress: ${error.message}`);
    }
};

const fetchImportProgress = async (importId) => {
    try {
        const response = await adminClient.imports.progressById(importId);

        if (response.data) {
            const index = activeImports.value.findIndex(imp => imp.id === importId);

            if (index !== -1)
                activeImports.value[index] = response.data;
            else
                activeImports.value.push(response.data);

            if (selectedImportId.value === importId) {
                selectedImportId.value = null;
                setTimeout(() => {
                    selectedImportId.value = importId;
                }, 0);
            }

            if (['completed', 'failed'].includes(response.data.status) && response.data.id === lastImportId.value) {
                const type = response.data.status === 'completed' ? 'success' : 'error';
                const message = response.data.status === 'completed'
                    ? `Import completed successfully!`
                    : `Import failed: ${response.data.error}`;
                showNotification(type, message);
            }
        }
    } catch (error) {
        console.error(`Error fetching import progress for ${importId}:`, error);
    }
};

const startPolling = () => {
    if (pollingInterval.value)
        clearInterval(pollingInterval.value);

    fetchActiveImports();

    pollingInterval.value = setInterval(() => {
        if (autoRefresh.value) {
            if (selectedImportId.value) {
                fetchImportProgress(selectedImportId.value);
            } else {
                fetchActiveImports();
            }
        }
    }, 3000);
};

const stopPolling = () => {
    if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
    }
};

const viewImportDetails = (importId) => {
    selectedImportId.value = importId;
    fetchImportProgress(importId);
};

watch(autoRefresh, (newValue) => {
    if (newValue && !pollingInterval.value) {
        startPolling();
    } else if (!newValue && pollingInterval.value) {
        stopPolling();
    }
});

const notification = ref({
    show: false,
    type: 'success',
    message: '',
    duration: 5000
});

const showNotification = (type, message) => {
    notification.value = {
        show: true,
        type,
        message,
        duration: 5000
    };

    setTimeout(() => {
        notification.value.show = false;
    }, notification.value.duration);
};

const importFrom = (type) => {
    if (activeImporter.value === type) {
        activeImporter.value = null;
    } else {
        activeImporter.value = type;

        setTimeout(() => {
            if (type === 'wordpress' && wordpressFileInput.value) {
                wordpressFileInput.value.click();
            } else if (type === 'ghost' && ghostFileInput.value) {
                ghostFileInput.value.click();
            }
        }, 100);
    }
};

const handleFileUpload = (type) => {
    const fileInput = type === 'wordpress' ? wordpressFileInput.value : ghostFileInput.value;
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const maxSize = 100 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
        showNotification('error', `File is too large. Maximum size is 100MB.`);
        fileInput.value = '';
        return;
    }

    files.value[type] = file;
};

const removeFile = (type) => {
    files.value[type] = null;
    if (type === 'wordpress' && wordpressFileInput.value) {
        wordpressFileInput.value.value = '';
    } else if (type === 'ghost' && ghostFileInput.value) {
        ghostFileInput.value.value = '';
    }
};

const uploadFile = async (type) => {
    if (!files.value[type]) return;

    importing.value[type] = true;

    try {
        const formData = new FormData();
        formData.append('file', files.value[type]);
        const token = localStorage.getItem('token')

        let response;

        // Direct API calls to the correct endpoints
        if (type === 'wordpress') {
            // WordPress uses XML format
            response = await fetch('/api/imports/wordpress', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    // DO NOT set Content-Type for FormData - browser will set it with proper boundary
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${await response.text()}`);
            }

            const result = await response.json();
            if (result.importId) {
                lastImportId.value = result.importId;
                // Start polling
                startPolling();
            }
        } else if (type === 'ghost') {
            // Ghost uses JSON format
            response = await fetch('/api/imports/ghost', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${await response.text()}`);
            }

            const result = await response.json();
            if (result.importId) {
                lastImportId.value = result.importId;
                // Start polling
                startPolling();
            }
        }

        showNotification('success', `${type === 'wordpress' ? 'WordPress' : 'Ghost'} import started successfully! You can monitor progress in the Active Imports section.`);

        // Reset the file input
        removeFile(type);
        activeImporter.value = null;
    } catch (error) {
        console.error(`Error importing from ${type}:`, error);
        showNotification('error', `Error importing from ${type}: ${error.message || 'Unknown error'}`);
    } finally {
        importing.value[type] = false;
    }
};

// Lifecycle hooks
onMounted(() => {
    startPolling();
});

onBeforeUnmount(() => {
    stopPolling();
});
</script>
