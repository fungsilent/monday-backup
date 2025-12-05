<script setup lang="ts">
import ItemDetail from '#root/src/components/ItemDetail.vue'

import type { BoardShape, ItemShape } from '#src/type/data'

const route = useRoute()
const boardId = route.params.id as string

const { data: board, pending, error } = await useFetch<BoardShape>(`/api/boards/${boardId}`)

const searchQuery = ref('')
const selectedItem = ref<ItemShape | null>(null)

// Filter items based on search query
const filteredGroups = computed(() => {
    if (!board.value) return []
    if (!searchQuery.value) return board.value.groups

    const query = searchQuery.value.toLowerCase()

    return board.value.groups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            // Search in title
            if (item.title.toLowerCase().includes(query)) return true

            // Search in columns
            return item.column.some(col =>
                col.value && col.value.toLowerCase().includes(query)
            )
        })
    })).filter(group => group.items.length > 0)
})

const openItemModal = (item: ItemShape) => {
    console.log('openItemModal', item)
    selectedItem.value = item
}

const closeModal = () => {
    selectedItem.value = null
}
</script>

<template>
  <div class="container mx-auto p-4">
    <div
      v-if="pending"
      class="text-center py-10"
    >
      Loading...
    </div>
    <div
      v-else-if="error"
      class="text-center py-10 text-red-500"
    >
      Error loading board: {{ error.message }}
    </div>
    <div v-else-if="board">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">
          <NuxtLink
            to="/"
            class="text-gray-500 hover:text-gray-700 mr-2"
          >
            ←
          </NuxtLink>
          {{ board.name }}
        </h1>

        <div class="w-64">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search items..."
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>
      </div>

      <div class="space-y-8">
        <div
          v-for="group in filteredGroups"
          :key="group.groupId"
          class="border rounded-lg overflow-hidden bg-white shadow"
        >
          <details
            class="group"
            open
          >
            <summary class="bg-gray-50 px-4 py-3 cursor-pointer font-semibold flex justify-between items-center select-none hover:bg-gray-100">
              <span>{{ group.name }}</span>
              <span class="text-gray-400 text-sm">{{ group.items.length }} items</span>
            </summary>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                    <th class="px-4 py-3 font-medium">
                      Item
                    </th>
                    <th
                      v-for="colName in board.groups[0]?.items[0]?.column.map(c => c.name) || []"
                      :key="colName"
                      class="px-4 py-3 font-medium whitespace-nowrap"
                    >
                      {{ colName }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-for="item in group.items"
                    :key="item.itemId"
                    class="hover:bg-blue-50 cursor-pointer transition-colors text-sm"
                    @click="openItemModal(item)"
                  >
                    <td class="px-4 py-3 font-medium text-gray-900 min-w-[200px] border-r">
                      {{ item.title }}
                    </td>
                    <td
                      v-for="col in item.column"
                      :key="col.name"
                      class="px-4 py-3 whitespace-nowrap text-gray-600 max-w-[200px] truncate border-r last:border-r-0"
                    >
                      {{ col.value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>

      <!-- Item Detail Modal -->
      <ItemDetail
        v-if="selectedItem"
        :item="selectedItem"
        @close="closeModal"
      />
    </div>
  </div>
</template>

