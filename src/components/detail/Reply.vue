<script setup lang="ts">
import { formatInTimeZone } from 'date-fns-tz'

import UserIcon from '#root/src/components/UserIcon.vue'
import Content from '#root/src/components/detail/Content.vue'

import type { ReplyShape } from '#src/type/data'

defineProps<{
    reply: ReplyShape
}>()

const formatDate = (dateInput: string, formatPattern = 'yyyy-MM-dd HH:mm') => {
    const date = new Date(dateInput)
    return formatInTimeZone(date, 'Asia/Hong_Kong', formatPattern)
}
</script>

<template>
    <div class="flex gap-3 relative">
        <div class="flex-shrink-0 relative">
            <UserIcon
                :name="reply.createdBy"
                class-name="w-8 h-8 text-xs"
            />
        </div>
        <div class="flex-grow bg-gray-50 rounded-lg p-4 border border-gray-100 hover:bg-white hover:shadow-sm transition-all duration-200">
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-gray-900">{{ reply.createdBy }}</span>
                <span class="text-sm text-gray-400 font-medium">{{ formatDate(reply.createdAt) }}</span>
            </div>

            <Content :html="reply.formattedBody" />

            <!-- Reply Assets -->
            <div
                v-if="reply.assets?.length"
                class="mt-3 flex flex-wrap gap-2"
            >
                <a
                    v-for="asset in reply.assets"
                    :key="asset.assetId"
                    :href="asset.localUrl"
                    :download="`${asset.fileName}.${asset.extension}`"
                    class="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3 mr-1"
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
                    {{ asset.fileName }}
                </a>
            </div>
        </div>
    </div>
</template>
