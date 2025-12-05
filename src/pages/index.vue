<script setup lang="ts">

import type { BoardShape } from '#src/type/data'

const { data: boards } = await useFetch<BoardShape[]>('/api/boards')
</script>

<template>
    <div class="container mx-auto p-4">
        <h1 class="text-3xl font-bold mb-6">
            Monday.com Board Backups
        </h1>

        <div
            v-if="boards && boards.length > 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <NuxtLink
                v-for="board in boards"
                :key="board.boardId"
                :to="`/boards/${board.boardId}`"
                class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow block"
            >
                <h2 class="text-xl font-semibold mb-2">
                    {{ board.name }}
                </h2>
                <p class="text-gray-600 text-sm mb-4">
                    ID: {{ board.boardId }}
                </p>
                <div class="text-xs text-gray-500">
                    File: {{ board.boardId }}
                </div>
            </NuxtLink>
        </div>

        <div
            v-else
            class="text-center text-gray-500 mt-10"
        >
            No backup boards found. Run <code class="bg-gray-200 px-1 rounded">pnpm seed</code> to fetch data.
        </div>
    </div>
</template>

