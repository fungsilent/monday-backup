<script setup lang="ts">
defineProps<{
    firstColumn: string
    columns: string[]
}>()
</script>

<template>
    <thead>
        <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
            <th class="px-6 py-3 font-semibold sticky left-0 z-10 bg-gray-50">
                {{ firstColumn }}
            </th>
            <th
                v-for="colName in columns"
                :key="colName"
                class="px-6 py-3 font-medium whitespace-nowrap"
            >
                {{ colName }}
            </th>
        </tr>
    </thead>
</template>
