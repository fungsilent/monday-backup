<script setup lang="ts">
import type { WorkspaceShape } from '#src/type/data'

defineProps<{
    workspace: WorkspaceShape
}>()

const isCollapsed = ref(false)

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}
</script>

<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        <button
            class="w-full flex items-center justify-between px-6 py-5 bg-white hover:bg-gray-50 transition-colors duration-200 group"
            @click="toggleCollapse"
        >
            <div class="flex items-center space-x-4">
                <span
                    class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 transform transition-transform duration-300 group-hover:bg-blue-100"
                    :class="{ '-rotate-90': isCollapsed }"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </span>
                <div class="flex items-center space-x-3">
                    <h2 class="text-xl font-bold text-gray-900 capitalize">
                        {{ workspace.name }}
                    </h2>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {{ workspace.boards.length }} boards
                    </span>
                </div>
            </div>
        </button>

        <div
            v-show="!isCollapsed"
            class="border-t border-gray-100 bg-gray-50/50 p-6"
        >
            <div class="flex flex-col space-y-3">
                <NuxtLink
                    v-for="board in workspace.boards"
                    :key="board.boardId"
                    :to="`/boards/${board.boardId}`"
                    class="group relative flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-4 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <div class="flex items-center space-x-4 min-w-0">
                        <div class="flex-shrink-0 p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                />
                            </svg>
                        </div>
                        <div class="flex flex-col min-w-0">
                            <h3 class="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {{ board.name }}
                            </h3>
                            <span class="text-xs text-gray-500 font-mono">
                                ID: {{ board.boardId }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center text-sm text-gray-400 group-hover:text-blue-500 font-medium transition-colors ml-4 flex-shrink-0">
                        <span class="hidden sm:inline mr-2">View Board</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </div>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

