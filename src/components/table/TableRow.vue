<script setup lang="ts">
import type { BaseItemShape } from '#src/type/data'

defineProps<{
    item: BaseItemShape
    blank: boolean
}>()

const emit = defineEmits<{
    (event: 'click', item: BaseItemShape): void
}>()
</script>

<template>
    <tr
        :class="[
            'cursor-pointer transition-colors',
            blank
                ? 'hover:bg-blue-50 text-xs'
                : 'group/row hover:bg-blue-50 text-sm'
        ]"
        @click="emit('click', item)"
    >
        <!-- Title Column -->
        <td
            :class="[
                'font-medium transition-colors border-r border-gray-100 last:border-r-0',
                blank
                    ? 'px-4 py-2 text-gray-700 w-[300px]'
                    : 'px-6 py-4 text-gray-900 min-w-[400px] max-w-[600px] sticky left-0 z-10 bg-white group-hover/row:bg-blue-50 shadow-[1px_0_0_0_#f3f4f6,inset_-1px_0_0_0_#f3f4f6]'
            ]"
        >
            <div :class="blank ? 'flex items-center gap-2' : ''">
                {{ item.title }}
            </div>
        </td>

        <!-- Data Columns -->
        <td
            v-for="column in item.column"
            :key="column.name"
            :class="[
                'whitespace-nowrap border-r border-gray-100 last:border-r-0',
                blank
                    ? 'px-4 py-2 text-gray-600'
                    : 'px-6 py-4 text-gray-600 max-w-[300px]'
            ]"
        >
            <div :class="['truncate', blank ? 'max-w-[200px]' : '']">
                <span>
                    {{ column.value }}
                </span>
            </div>
        </td>
    </tr>
</template>