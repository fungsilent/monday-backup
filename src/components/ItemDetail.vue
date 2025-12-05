<script setup lang="ts">
import type { ItemShape } from '#src/type/data'

defineProps<{
    item: ItemShape
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()
</script>

<template>
    <Teleport to="body">
        <div
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-6 py-4 z-50"
            @click.self="emit('close')"
        >
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-[1600px] h-[90vh] flex flex-col overflow-hidden">
                <!-- Header -->
                <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">
                            {{ item.title }}
                        </h2>
                        <div class="text-xs text-gray-500 mt-1">
                            Created by {{ item.createdBy }} on {{ item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '' }}
                        </div>
                    </div>
                    <button
                        class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200"
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
                <div class="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    <!-- Left: Columns & Assets -->
                    <div class="lg:w-1/3 border-r overflow-y-auto bg-gray-50 p-6">
                        <h3 class="font-semibold text-gray-700 mb-4 flex items-center">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">INFO</span>
                            Columns
                        </h3>
                        <div class="space-y-4">
                            <div
                                v-for="col in item.column"
                                :key="col.name"
                                class="bg-white p-3 rounded border shadow-sm"
                            >
                                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                    {{ col.name }}
                                </div>
                                <div class="text-gray-800 font-medium break-words">
                                    {{ col.value || '-' }}
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="item.assets?.length"
                            class="mt-8"
                        >
                            <h3 class="font-semibold text-gray-700 mb-4 flex items-center">
                                <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-2">FILES</span>
                                Assets
                            </h3>
                            <div class="space-y-2">
                                <a
                                    v-for="asset in item.assets"
                                    :key="asset.assetId"
                                    :href="asset.localUrl"
                                    :download="`${asset.fileName}.${asset.extension}`"
                                    class="flex items-center p-2 bg-white rounded border hover:bg-gray-50 text-blue-600 hover:underline truncate"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4 mr-2 flex-shrink-0"
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
                                    <span class="truncate">{{ asset.fileName }}</span>
                                    <span class="ml-auto text-xs text-gray-400 pl-2">{{ (asset.size / 1024).toFixed(1) }} KB</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Comments (Updates) -->
                    <div class="lg:w-2/3 overflow-y-auto bg-white">
                        <h3 class="font-semibold text-gray-700 flex items-center sticky top-0 bg-white px-6 py-2 z-10 border-b">
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">UPDATES</span>
                            Comments
                        </h3>

                        <div
                            v-if="!item.comments?.length"
                            class="text-center text-gray-400 py-10"
                        >
                            No comments found.
                        </div>

                        <div
                            v-else
                            class="space-y-8 p-6"
                        >
                            <div
                                v-for="comment in item.comments"
                                :key="comment.commentId"
                                class="flex gap-4"
                            >
                                <div class="flex-shrink-0">
                                    <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                        {{ comment.createdBy.charAt(0).toUpperCase() }}
                                    </div>
                                </div>
                                <div class="flex-grow">
                                    <div class="bg-gray-50 rounded-lg p-4 border relative group-hover:shadow-md transition-shadow">
                                        <div class="flex justify-between items-start mb-2">
                                            <span class="font-bold text-gray-900">{{ comment.createdBy }}</span>
                                            <span class="text-xs text-gray-500">{{ new Date(comment.created_at).toLocaleString() }}</span>
                                        </div>
                                        <div
                                            class="prose prose-sm max-w-none text-gray-800"
                                            v-html="comment.formattedBody"
                                        />

                                        <!-- Comment Assets -->
                                        <div
                                            v-if="comment.assets?.length"
                                            class="mt-3 flex flex-wrap gap-2"
                                        >
                                            <a
                                                v-for="asset in comment.assets"
                                                :key="asset.assetId"
                                                :href="asset.localUrl"
                                                :download="`${asset.fileName}.${asset.extension}`"
                                                class="inline-flex items-center px-3 py-1 bg-white border rounded-full text-xs text-blue-600 hover:bg-blue-50"
                                            >
                                                📎 {{ asset.fileName }}
                                            </a>
                                        </div>
                                    </div>

                                    <!-- Replies -->
                                    <div
                                        v-if="comment.replies?.length"
                                        class="mt-4 space-y-4 pl-4 border-l-2 border-gray-200 ml-4"
                                    >
                                        <div
                                            v-for="reply in comment.replies"
                                            :key="reply.replyId"
                                            class="flex gap-3"
                                        >
                                            <div class="flex-shrink-0">
                                                <div class="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-bold">
                                                    {{ reply.createdBy.charAt(0).toUpperCase() }}
                                                </div>
                                            </div>
                                            <div class="flex-grow bg-white p-3 rounded border shadow-sm">
                                                <div class="flex justify-between items-start mb-1">
                                                    <span class="font-bold text-gray-800 text-sm">{{ reply.createdBy }}</span>
                                                    <span class="text-xs text-gray-400">{{ new Date(reply.createdAt).toLocaleString() }}</span>
                                                </div>
                                                <div
                                                    class="text-sm text-gray-700"
                                                    v-html="reply.formattedBody"
                                                />

                                                <!-- Reply Assets -->
                                                <div
                                                    v-if="reply.assets?.length"
                                                    class="mt-2 flex flex-wrap gap-2"
                                                >
                                                    <a
                                                        v-for="asset in reply.assets"
                                                        :key="asset.assetId"
                                                        :href="asset.localUrl"
                                                        :download="`${asset.fileName}.${asset.extension}`"
                                                        class="inline-flex items-center px-2 py-1 bg-gray-50 border rounded text-xs text-blue-600 hover:underline"
                                                    >
                                                        📎 {{ asset.fileName }}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style>
.prose p {
    margin-bottom: 0.5em;
}
.prose ul {
    list-style-type: disc;
    padding-left: 1.5em;
    margin-bottom: 0.5em;
}
.prose ol {
    list-style-type: decimal;
    padding-left: 1.5em;
    margin-bottom: 0.5em;
}
.prose [data-body-type="user-mention"] {
    color: #007bff;
    font-weight: bold;
}
.prose [data-body-type="asset"] {
    color: #007bff;
    font-weight: bold;
}
.prose [data-body-type="asset"]::before {
    content: '';
    display: inline-block;
    width: 1em;
    height: 1em;
    margin-right: 4px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23007bff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    vertical-align: -2px;
}
</style>
