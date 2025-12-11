<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { formatInTimeZone } from 'date-fns-tz'

import UserIcon from '#root/src/components/UserIcon.vue'
import Comment from '#root/src/components/detail/Comment.vue'

import type { BaseItemShape } from '#src/type/data'

defineProps<{
    item: BaseItemShape
}>()

const emit = defineEmits<{
    (event: 'close'): void
}>()

const formatDate = (dateInput: string, formatPattern = 'yyyy-MM-dd HH:mm') => {
    const date = new Date(dateInput)
    return formatInTimeZone(date, 'Asia/Hong_Kong', formatPattern)
}

onMounted(() => {
    document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
    document.body.style.overflow = ''
})
</script>

<template>
    <Teleport to="body">
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center px-20 py-4 z-50 transition-opacity duration-300"
            @click.self="emit('close')"
        >
            <!-- Modal Container -->
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-8xl h-[90vh] flex flex-col overflow-hidden border border-gray-100">
                <!-- Header -->
                <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white sticky top-0 z-20">
                    <div class="pr-8">
                        <h2 class="text-2xl font-bold text-gray-900 leading-tight">
                            {{ item.title }}
                        </h2>
                        <div class="flex items-center mt-3 text-sm text-gray-500 space-x-3">
                            <span class="flex items-center">
                                <UserIcon
                                    :name="item.createdBy"
                                    class-name="w-6 h-6 text-xs mr-2"
                                />
                                {{ item.createdBy }}
                            </span>
                            <span class="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{{ formatDate(item.createdAt) }}</span>
                        </div>
                    </div>
                    <button
                        class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        @click="emit('close')"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                    <!-- Left: Info Panel (Columns & Assets) -->
                    <div class="lg:w-[350px] flex-shrink-0 overflow-y-auto bg-gray-50 p-6 space-y-8">
                        <!-- Columns Section -->
                        <div>
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4 mr-1.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                Item Details
                            </h3>
                            <div class="space-y-3">
                                <div
                                    v-for="col in item.column"
                                    :key="col.name"
                                    class="group bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200"
                                >
                                    <div class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                        {{ col.name }}
                                    </div>
                                    <div class="text-sm text-gray-800 font-medium break-words leading-relaxed">
                                        {{ col.value || '-' }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Assets Section -->
                        <div v-if="item.assets?.length">
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4 mr-1.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                </svg>
                                Files
                            </h3>
                            <div class="space-y-2">
                                <a
                                    v-for="asset in item.assets"
                                    :key="asset.assetId"
                                    :href="asset.localUrl"
                                    :download="`${asset.fileName}.${asset.extension}`"
                                    class="flex items-center p-2.5 bg-white rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group text-sm"
                                >
                                    <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mr-3 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-gray-700 truncate group-hover:text-blue-700">
                                            {{ asset.fileName }}
                                        </div>
                                        <div class="text-xs text-gray-400">
                                            {{ (asset.size / 1024).toFixed(1) }} KB
                                        </div>
                                    </div>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4 text-gray-300 group-hover:text-blue-500 ml-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Updates Panel -->
                    <div class="flex-1 overflow-y-auto bg-white">
                        <div class="sticky top-0 bg-white px-8 py-4 z-10 border-b border-gray-100 flex items-center justify-between">
                            <h3 class="font-bold text-gray-800 flex items-center text-lg">
                                Updates
                                <span class="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {{ item.comments?.length || 0 }}
                                </span>
                            </h3>
                        </div>

                        <div class="p-8">
                            <div
                                v-if="!item.comments?.length"
                                class="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-8 w-8 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                </div>
                                <h4 class="text-gray-900 font-medium mb-1">
                                    No updates yet
                                </h4>
                                <p class="text-gray-500 text-sm">
                                    There are no comments or updates for this item.
                                </p>
                            </div>

                            <div
                                v-else
                                class="space-y-8"
                            >
                                <Comment
                                    v-for="comment in item.comments"
                                    :key="comment.commentId"
                                    :comment="comment"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
