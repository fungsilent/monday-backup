<script setup lang="ts">
import type { GroupShape, ItemShape } from '#src/type/data'

defineProps<{
    group: GroupShape
    columns: string[]
}>()

const emit = defineEmits<{
    (event: 'clickItem', item: ItemShape): void
}>()
</script>

<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <details
            class="group"
            open
        >
            <summary class="px-6 py-4 bg-gray-50/50 cursor-pointer flex items-center justify-between select-none hover:bg-gray-50 transition-colors border-b border-gray-100 list-none">
                <div class="flex items-center gap-3">
                    <span class="transform group-open:rotate-90 transition-transform duration-200 text-gray-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </span>
                    <h2
                        class="font-semibold text-lg"
                        :style="{ color: group.name === 'Closed' ? '#10B981' : '#3B82F6' }"
                    >
                        {{ group.name }}
                    </h2>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {{ group.items.length }} items
                </span>
            </summary>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-3 font-semibold sticky left-0 z-10 bg-gray-50">
                                Item
                            </th>
                            <th
                                v-for="colName in columns"
                                :key="colName"
                                class="px-6 py-3 font-medium whitespace-nowrap min-w-[150px]"
                            >
                                {{ colName }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr
                            v-for="item in group.items"
                            :key="item.itemId"
                            class="group/row hover:bg-blue-50 cursor-pointer transition-colors text-sm"
                            @click="emit('clickItem', item)"
                        >
                            <td class="px-6 py-4 font-medium text-gray-900 min-w-[400px] max-w-[600px] sticky left-0 z-10 bg-white group-hover/row:bg-blue-50 transition-colors shadow-[1px_0_0_0_#f3f4f6,inset_-1px_0_0_0_#f3f4f6]">
                                {{ item.title }}
                            </td>
                            <td
                                v-for="col in item.column"
                                :key="col.name"
                                class="px-6 py-4 whitespace-nowrap text-gray-600 max-w-[300px] border-r border-gray-100 last:border-r-0"
                            >
                                <div
                                    class="truncate"
                                    :title="col.value || ''"
                                >
                                    <span
                                        v-if="['Status', 'Priority', 'Category'].includes(col.name)"
                                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800"
                                    >
                                        {{ col.value || '-' }}
                                    </span>
                                    <span v-else>
                                        {{ col.value || '-' }}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    </div>
</template>
