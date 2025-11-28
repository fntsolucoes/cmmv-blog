<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-white">Dashboard</h1>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div class="bg-neutral-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-neutral-400 text-xs">Campanhas Ativas</p>
                        <h2 class="text-xl font-bold text-white mt-1">{{ sasData.totalActiveCampaigns || 0 }}</h2>
                    </div>
                    <div class="bg-blue-600/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-neutral-400 text-xs">Tags Ativas</p>
                        <h2 class="text-xl font-bold text-white mt-1">{{ sasData.activeTags || 0 }}</h2>
                    </div>
                    <div class="bg-purple-600/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-neutral-400 text-xs">Tags que Cairam</p>
                        <h2 class="text-xl font-bold text-white mt-1">{{ sasData.fallenTags || 0 }}</h2>
                    </div>
                    <div class="bg-red-600/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-neutral-400 text-xs">Tags Pendentes</p>
                        <h2 class="text-xl font-bold text-white mt-1">{{ sasData.pendingTags || 0 }}</h2>
                    </div>
                    <div class="bg-amber-600/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-neutral-400 text-xs">Notas Pagas (Mês)</p>
                        <h2 class="text-xl font-bold text-white mt-1">{{ sasData.paidThisMonth || 0 }}</h2>
                    </div>
                    <div class="bg-green-600/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-neutral-400 text-xs">Notas Pendentes</p>
                        <h2 class="text-xl font-bold text-white mt-1">{{ sasData.pendingOrders || 0 }}</h2>
                    </div>
                    <div class="bg-orange-600/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-neutral-400 text-xs">Valor Recebido (Mês)</p>
                        <h2 class="text-xl font-bold text-white mt-1">{{ formatCurrency(sasData.totalReceivedThisMonth || 0) }}</h2>
                    </div>
                    <div class="bg-emerald-600/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-neutral-400 text-xs">Valor Pendente</p>
                        <h2 class="text-xl font-bold text-white mt-1">{{ formatCurrency(sasData.totalPendingValue || 0) }}</h2>
                    </div>
                    <div class="bg-yellow-600/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="bg-neutral-800 rounded-lg shadow-md">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Notas de Pagamento</h3>
                </div>
                <div class="p-6">
                    <div class="h-72 bg-neutral-800 rounded-md">
                        <canvas ref="trafficChart" class="w-full h-full"></canvas>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Tags por Mês</h3>
                </div>
                <div class="p-6">
                    <div class="h-72 bg-neutral-800 rounded-md">
                        <canvas ref="tagsChart" class="w-full h-full"></canvas>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-800 rounded-lg shadow-md">
                <div class="p-6 border-b border-neutral-700">
                    <h3 class="text-lg font-medium text-white">Most Popular Posts This Week</h3>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div v-for="post in popularPosts" :key="post.id" class="flex items-start gap-4">
                            <div class="flex-shrink-0 h-16 w-24 bg-neutral-700 rounded-md overflow-hidden">
                                <img v-if="post.image" :src="post.image" class="h-full w-full object-cover"
                                    :alt="post.title">
                                <div v-else class="h-full w-full bg-gradient-to-br from-neutral-600 to-neutral-700">
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="text-base font-medium text-white truncate">{{ post.title }}</h4>
                                <div class="flex items-center mt-1">
                                    <span class="text-neutral-400 text-sm">Published on {{ formatDate(post.publishedAt)
                                    }}</span>
                                </div>
                                <div class="flex items-center mt-2 text-sm">
                                    <div class="flex items-center text-neutral-400 mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {{ formatNumber(post.views || 0) }}
                                    </div>
                                    <div class="flex items-center text-neutral-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        {{ post.comments || 0 }}
                                    </div>
                                </div>
                            </div>
                            <div class="flex-shrink-0 self-center" v-if="post.mainTag">
                                <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {{ post.mainTag }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="px-6 py-4 border-t border-neutral-700">
                    <a href="/posts" class="text-blue-500 hover:text-blue-400 text-sm font-medium">View all posts →</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';
import { useAdminClient } from '../client';

const adminAPI = useAdminClient();
const analytics = adminAPI.analytics;
const comments = adminAPI.comments;
const sasDashboard = adminAPI.sasDashboard;

const trafficChart = ref(null);
const tagsChart = ref(null);
let chart = null;
let notesChart = null;
let tagsChartInstance = null;

const summary = ref({
    posts: 0,
    postsGrowth: 0,
    comments: 0,
    commentsGrowth: 0,
    views: 0,
    viewsGrowth: 0,
    subscribers: 0,
    subscribersGrowth: 0,
    pendingComments: 0,
    totalVisitors: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgTime: 0,
    trafficData: []
});

const sasData = ref({
    totalActiveCampaigns: 0,
    activeTags: 0,
    fallenTags: 0,
    pendingTags: 0,
    paidThisMonth: 0,
    pendingOrders: 0,
    totalReceivedThisMonth: 0,
    totalPendingValue: 0,
    notesByMonth: [],
    tagsByMonth: []
});

const popularPosts = ref([]);
const pendingComments = ref([]);

const createNotesChart = () => {
    if (!trafficChart.value) return;

    const ctx = trafficChart.value.getContext('2d');

    if (notesChart)
        notesChart.destroy();

    const notesData = sasData.value.notesByMonth || [];

    if (notesData.length > 0) {
        const labels = notesData.map(item => {
            const [year, month] = item.month.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        });

        const paidData = notesData.map(item => item.paid || 0);
        const pendingData = notesData.map(item => item.pending || 0);

        notesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Notas Pagas',
                        data: paidData,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Notas Pendentes',
                        data: pendingData,
                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                family: 'system-ui'
                            },
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: 'rgba(255, 255, 255, 0.9)',
                        bodyColor: 'rgba(255, 255, 255, 0.7)',
                        borderColor: 'rgba(71, 85, 105, 0.5)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                family: 'system-ui',
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        stacked: false,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                family: 'system-ui',
                                size: 11
                            },
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } else {
        notesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sem Dados'],
                datasets: [{
                    data: [0],
                    backgroundColor: 'rgba(71, 85, 105, 0.3)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
};

const createTagsChart = () => {
    if (!tagsChart.value) return;

    const ctx = tagsChart.value.getContext('2d');

    if (tagsChartInstance)
        tagsChartInstance.destroy();

    const tagsData = sasData.value.tagsByMonth || [];

    if (tagsData.length > 0) {
        const labels = tagsData.map(item => {
            const [year, month] = item.month.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        });

        const implementedData = tagsData.map(item => item.implemented || 0);
        const pendingData = tagsData.map(item => item.pending || 0);
        const fallenData = tagsData.map(item => item.fallen || 0);

        tagsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Tags Implementadas',
                        data: implementedData,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Tags Pendentes',
                        data: pendingData,
                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Tags que Cairam',
                        data: fallenData,
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                family: 'system-ui'
                            },
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: 'rgba(255, 255, 255, 0.9)',
                        bodyColor: 'rgba(255, 255, 255, 0.7)',
                        borderColor: 'rgba(71, 85, 105, 0.5)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                family: 'system-ui',
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        stacked: false,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                family: 'system-ui',
                                size: 11
                            },
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } else {
        tagsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Sem Dados'],
                datasets: [{
                    data: [0],
                    backgroundColor: 'rgba(71, 85, 105, 0.3)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
};

const createTrafficChart = () => {
    if (!trafficChart.value) return;

    const ctx = trafficChart.value.getContext('2d');

    if (chart)
        chart.destroy();

    const trafficData = summary.value.trafficData || [];

    if (trafficData.length > 0) {
        trafficData.sort((a, b) => new Date(a.date) - new Date(b.date));

        const labels = trafficData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const visitorData = trafficData.map(item => item.uniqueAccess || 0);
        const pageViewData = trafficData.map(item => item.totalAccess || 0);

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Unique Visitors',
                        data: visitorData,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1,
                        pointRadius: 4,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Page Views',
                        data: pageViewData,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1,
                        pointRadius: 4,
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                family: 'system-ui'
                            },
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: 'rgba(255, 255, 255, 0.9)',
                        bodyColor: 'rgba(255, 255, 255, 0.7)',
                        borderColor: 'rgba(71, 85, 105, 0.5)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true,
                        boxWidth: 8,
                        boxHeight: 8,
                        titleFont: {
                            family: 'system-ui',
                            weight: 'bold',
                            size: 13
                        },
                        bodyFont: {
                            family: 'system-ui',
                            size: 12
                        },
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatNumber(context.parsed.y);
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(71, 85, 105, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                family: 'system-ui',
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(71, 85, 105, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                family: 'system-ui',
                                size: 11
                            },
                            callback: function (value) {
                                return formatNumber(value);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                hover: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    } else {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['No Data Available'],
                datasets: [
                    {
                        data: [0],
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: false,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
};

const approveComment = async (commentId) => {
    try {
        await comments.approveComment(commentId);
        pendingComments.value = pendingComments.value.filter(comment => comment.id !== commentId);
        summary.value.pendingComments = Math.max(0, summary.value.pendingComments - 1);
    } catch (error) {
        console.error('Error approving comment:', error);
    }
};

const rejectComment = async (commentId) => {
    try {
        await comments.rejectComment(commentId);
        pendingComments.value = pendingComments.value.filter(comment => comment.id !== commentId);
        summary.value.pendingComments = Math.max(0, summary.value.pendingComments - 1);
    } catch (error) {
        console.error('Error rejecting comment:', error);
    }
};

onMounted(async () => {
    try {
        // Carregar dados do dashboard SAS
        try {
            console.log('[HomeView] Carregando dados do dashboard SAS...');
            const sasDashboardData = await sasDashboard.getDashboard();
            console.log('[HomeView] Resposta do dashboard SAS:', sasDashboardData);
            
            // A resposta pode vir em diferentes formatos:
            // - { result: { data: {...} } } (formato do framework)
            // - { data: {...} } (formato do controller)
            // - {...} (diretamente)
            let dashboardData = {};
            if (sasDashboardData?.result?.data) {
                dashboardData = sasDashboardData.result.data;
            } else if (sasDashboardData?.data) {
                dashboardData = sasDashboardData.data;
            } else if (sasDashboardData) {
                dashboardData = sasDashboardData;
            }
            
            console.log('[HomeView] Dados extraídos:', dashboardData);
            
            sasData.value = {
                totalActiveCampaigns: dashboardData.totalActiveCampaigns || 0,
                activeTags: dashboardData.activeTags || 0,
                fallenTags: dashboardData.fallenTags || 0,
                pendingTags: dashboardData.pendingTags || 0,
                paidThisMonth: dashboardData.paidThisMonth || 0,
                pendingOrders: dashboardData.pendingOrders || 0,
                totalReceivedThisMonth: dashboardData.totalReceivedThisMonth || 0,
                totalPendingValue: dashboardData.totalPendingValue || 0,
                notesByMonth: dashboardData.notesByMonth || [],
                tagsByMonth: dashboardData.tagsByMonth || []
            };
            
            console.log('[HomeView] ✅ Dados do dashboard SAS carregados:', sasData.value);
            
            // Criar gráficos após carregar os dados
            setTimeout(() => {
                createNotesChart();
                createTagsChart();
            }, 100);
        } catch (error) {
            console.error('[HomeView] ❌ Erro ao carregar dados do dashboard SAS:', error);
        }

        const dashboardData = await analytics.getDashboard();
        const summaryData = await analytics.getSummary();

        try {
            const pendingCommentsData = await comments.getPending();
            pendingComments.value = pendingCommentsData.data || [];
        } catch (error) {
            console.error('Error fetching pending comments:', error);
            pendingComments.value = [];
        }

        if (dashboardData) {
            const postsGrowth = dashboardData.postsFromLastMonth > 0
                ? Math.round(((dashboardData.totalPosts - dashboardData.postsFromLastMonth) / dashboardData.postsFromLastMonth) * 100)
                : 0;

            const commentsGrowth = dashboardData.commentsFromLastMonth > 0
                ? Math.round(((dashboardData.totalComments - dashboardData.commentsFromLastMonth) / dashboardData.commentsFromLastMonth) * 100)
                : 0;

            let viewsGrowth = 0;
            let subscribersGrowth = 0;

            if (dashboardData.accessFromLastMonth !== undefined) {
                viewsGrowth = dashboardData.accessFromLastMonth > 0
                    ? Math.round(((dashboardData.totalAccess - dashboardData.accessFromLastMonth) / dashboardData.accessFromLastMonth) * 100)
                    : 0;
            }

            if (dashboardData.membersFromLastMonth !== undefined) {
                subscribersGrowth = dashboardData.membersFromLastMonth > 0
                    ? Math.round(((dashboardData.totalMembers - dashboardData.membersFromLastMonth) / dashboardData.membersFromLastMonth) * 100)
                    : 0;
            }

            const trafficData = summaryData?.trafficData || summaryData || [];

            if (Array.isArray(trafficData) && trafficData.length > 0) {
                const bounceRate = Math.round(
                    trafficData.reduce((sum, item, index, array) => {
                        return sum + (item.bounceRate || 0) * (item.totalAccess || 1) /
                            array.reduce((total, i) => total + (i.totalAccess || 1), 0);
                    }, 0)
                );

                const avgTime = Math.round(
                    trafficData.reduce((sum, item, index, array) => {
                        return sum + (item.avgTimeOnPage || 0) * (item.totalAccess || 1) /
                            array.reduce((total, i) => total + (i.totalAccess || 1), 0);
                    }, 0)
                );

                summary.value = {
                    posts: dashboardData.totalPosts || 0,
                    postsGrowth: postsGrowth,
                    comments: dashboardData.totalComments || 0,
                    commentsGrowth: commentsGrowth,
                    views: dashboardData.totalAccess || 0,
                    viewsGrowth: viewsGrowth,
                    subscribers: dashboardData.totalMembers || 0,
                    subscribersGrowth: subscribersGrowth,
                    totalVisitors: dashboardData.totalAccess || 0,
                    uniqueVisitors: dashboardData.uniqueAccess || 0,
                    bounceRate: bounceRate,
                    avgTime: avgTime,
                    trafficData: trafficData,
                    pendingComments: pendingComments.value.length || 0,
                };
            } else {
                summary.value = {
                    posts: dashboardData.totalPosts || 0,
                    postsGrowth: postsGrowth,
                    comments: dashboardData.totalComments || 0,
                    commentsGrowth: commentsGrowth,
                    views: dashboardData.totalAccess || 0,
                    viewsGrowth: viewsGrowth,
                    subscribers: dashboardData.totalMembers || 0,
                    subscribersGrowth: subscribersGrowth,
                    totalVisitors: dashboardData.totalAccess || 0,
                    uniqueVisitors: dashboardData.uniqueAccess || 0,
                    pendingComments: pendingComments.value.length || 0,
                    bounceRate: 0,
                    avgTime: 0,
                    trafficData: []
                };
            }
        }

        const postsData = await analytics.getPostsMostAccessed();

        if (postsData)
            popularPosts.value = postsData;

        createTrafficChart();
    } catch (error) {
        console.error('Error fetching analytics data:', error);
    }
});

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const formatNumber = (num) => {
    if (num >= 1000000)
        return (num / 1000000).toFixed(1) + 'M';
    else if (num >= 1000)
        return (num / 1000).toFixed(1) + 'k';

    return num.toString();
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
};

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
};
</script>
