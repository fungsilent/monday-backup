<script setup lang="ts">
import Workspace from '#root/src/components/Workspace.vue'

import type { WorkspaceShape } from '#src/type/data'

const { data: workspaces } = await useFetch<WorkspaceShape[]>('/api/boards')
</script>

<template>
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-6xl mx-auto">
            <header class="mb-12 text-center">
                <h1 class="font-extrabold text-gray-900 tracking-tight text-3xl mb-3">
                    Monday.com Backups
                </h1>
            </header>

            <div
                v-if="workspaces?.length"
                class="space-y-6"
            >
                <Workspace
                    v-for="workspace in workspaces"
                    :key="workspace.name"
                    :workspace="workspace"
                />
            </div>

            <div
                v-else
                class="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-200 mt-8"
            >
                <h3 class="text-lg font-medium text-gray-900 mb-1">
                    No backup boards found
                </h3>
                <p class="text-gray-500">
                    Run <code class="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">pnpm seed</code> to fetch data.
                </p>
            </div>
        </div>
    </div>
</template>
