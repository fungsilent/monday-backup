<script setup lang="ts">
import BoardGroup from '#root/src/components/BoardGroup.vue'
import Item from '#root/src/components/detail/Item.vue'

import type { BaseItemShape, BoardShape } from '#src/type/data'

const route = useRoute()
const boardId = route.params.boardId as string

const { data: board, pending, error } = await useFetch<BoardShape>(`/api/boards/${boardId}`)

const searchQuery = ref('')
const selectedItem = ref<BaseItemShape | null>(null)
const boardGroupsRef = ref<InstanceType<typeof BoardGroup>[] | null>(null)

// Filter items based on search query
const filteredGroups = computed(() => {
    if (!board.value) return []
    if (!searchQuery.value) return board.value.groups

    const query = searchQuery.value.toLowerCase()

    // Support search by ID (e.g., "id:123456")
    if (query.startsWith('id:')) {
        const id = query.slice(3).trim()
        if (!id) return board.value.groups

        return board.value.groups
            .map(group => ({
                ...group,
                items: group.items.filter(item => item.itemId.includes(id))
            }))
            .filter(group => !!group.items.length)
    }

    return board.value.groups
        .map(group => ({
            ...group,
            items: group.items.filter(item => {
            // Search in title
                if (item.title.toLowerCase().includes(query)) return true

                // Search in columns
                return item.column.some(col =>
                    col.value && col.value.toLowerCase().includes(query)
                )
            })
        }))
        .filter(group => !!group.items.length)
})

const selectItem = (item: BaseItemShape) => {
    selectedItem.value = item
}

const clearSelectedItem = () => {
    selectedItem.value = null
}

const expandAll = () => {
    boardGroupsRef.value?.forEach(group => group.open())
}

const collapseAll = () => {
    boardGroupsRef.value?.forEach(group => group.close())
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div
            v-if="pending"
            class="flex items-center justify-center min-h-[50vh]"
        >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>

        <div
            v-else-if="error"
            class="text-center py-20 bg-white rounded-3xl shadow-sm border border-red-100 max-w-2xl mx-auto mt-10"
        >
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-1">
                Error Loading Board
            </h3>
            <p class="text-gray-500">
                {{ error.message }}
            </p>
            <div class="mt-6">
                <NuxtLink
                    to="/"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Back to Dashboard
                </NuxtLink>
            </div>
        </div>

        <div v-else-if="board">
            <!-- Header -->
            <header class="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-3 mb-8 sticky top-0 z-30">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <NuxtLink
                            to="/"
                            class="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </NuxtLink>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {{ board.name }}
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                                    {{ board.boardId }}
                                </span>
                            </h1>
                            <p class="text-sm text-gray-500 mt-1">
                                {{ board.groups.length }} Groups • {{ board.groups.reduce((acc, g) => acc + g.items.length, 0) }} Items
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 w-full lg:w-auto">
                        <div class="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                type="button"
                                class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md transition-all shadow-sm hover:shadow"
                                title="Expand All"
                                @click="expandAll"
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
                            </button>
                            <div class="w-px h-4 bg-gray-300 mx-1" />
                            <button
                                type="button"
                                class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md transition-all shadow-sm hover:shadow"
                                title="Collapse All"
                                @click="collapseAll"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div class="relative flex-1 lg:w-96">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    class="h-5 w-5 text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </div>
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="Search items..."
                                class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
                            >
                        </div>
                    </div>
                </div>
            </header>

            <!-- Content -->
            <div class="space-y-6">
                <BoardGroup
                    v-for="group in filteredGroups"
                    :key="group.groupId"
                    ref="boardGroupsRef"
                    :group="group"
                    @select-item="selectItem"
                />
            </div>

            <!-- Item Detail Modal -->
            <Item
                v-if="selectedItem"
                :item="selectedItem"
                @close="clearSelectedItem"
            />
        </div>
    </div>
</template>
