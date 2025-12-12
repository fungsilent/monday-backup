<script setup lang="ts">
import TableHeader from '#src/components/table/TableHeader.vue'
import TableRow from '#root/src/components/table/TableRow.vue'

import type { GroupShape, ItemShape, SubitemShape } from '#src/type/data'

defineExpose({
    open,
    close
})

const props = defineProps<{
    group: GroupShape
}>()

const columns = computed(() => {
    const firstItem = props.group.items[0]
    if (!firstItem) return []
    return firstItem.column.map(c => c.name)
})

const detailsRef = ref<HTMLDetailsElement>()

const emit = defineEmits<{
    (event: 'select-item', item: ItemShape | SubitemShape): void
}>()

const getSubitemColumns = (item: ItemShape) => {
    const firstSubitem = item.subitems?.[0]
    if (!firstSubitem) return []
    return firstSubitem.column.map(c => c.name)
}

function open() {
    if (detailsRef.value) detailsRef.value.open = true
}

function close() {
    if (detailsRef.value) detailsRef.value.open = false
}
</script>

<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <details
            ref="detailsRef"
            class="group"
            open
        >
            <summary class="px-6 py-4 bg-gray-50 cursor-pointer flex items-center justify-between select-none hover:bg-gray-50 transition-colors border-b border-gray-100 list-none">
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
                    <TableHeader
                        :first-column="'Item'"
                        :columns="columns"
                    />
                    <tbody class="divide-y divide-gray-100">
                        <template
                            v-for="item in group.items"
                            :key="item.itemId"
                        >
                            <!-- Item Row -->
                            <TableRow
                                :item="item"
                                :blank="false"
                                :columns="columns"
                                @click="emit('select-item', $event)"
                            />

                            <!-- Subitem Row -->
                            <tr
                                v-if="item.subitems.length"
                                class="bg-gray-100"
                            >
                                <td
                                    :colspan="1 + columns.length"
                                    class="p-0 border-b border-gray-100"
                                >
                                    <div class="p-3 overflow-x-auto">
                                        <table class="text-left text-xs bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <TableHeader
                                                :first-column="'Subitem'"
                                                :columns="getSubitemColumns(item)"
                                            />
                                            <tbody class="divide-y divide-gray-100">
                                                <TableRow
                                                    v-for="subitem in item.subitems"
                                                    :key="subitem.itemId"
                                                    :blank="false"
                                                    :item="subitem"
                                                    @click="emit('select-item', $event)"
                                                />
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                            <!-- End of Subitem Row -->
                        </template>
                    </tbody>
                </table>
            </div>
        </details>
    </div>
</template>
