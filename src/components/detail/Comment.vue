<script setup lang="ts">
import { formatInTimeZone } from 'date-fns-tz'

import UserIcon from '#root/src/components/UserIcon.vue'
import Reply from '#root/src/components/detail/Reply.vue'
import Content from '#root/src/components/detail/Content.vue'

import type { CommentShape } from '#src/type/data'

defineProps<{
    comment: CommentShape
}>()

const formatDate = (dateInput: string, formatPattern = 'yyyy-MM-dd HH:mm') => {
    const date = new Date(dateInput)
    return formatInTimeZone(date, 'Asia/Hong_Kong', formatPattern)
}
</script>

<template>
    <div class="relative pl-4">
        <div class="flex gap-4 group">
            <div class="flex-shrink-0">
                <UserIcon
                    :name="comment.createdBy"
                    class-name="w-10 h-10 text-md"
                />
            </div>
            <div class="flex-grow min-w-0">
                <div class="bg-white rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow duration-200 overflow-hidden">
                    <div class="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span class="font-bold text-gray-900">{{ comment.createdBy }}</span>
                        <span class="text-sm text-gray-500">{{ formatDate(comment.created_at) }}</span>
                    </div>

                    <div class="p-5">
                        <Content
                            class="text-sm"
                            :html="comment.formattedBody"
                        />

                        <!-- Comment Assets -->
                        <div
                            v-if="comment.assets?.length"
                            class="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                            <a
                                v-for="asset in comment.assets"
                                :key="asset.assetId"
                                :href="asset.localUrl"
                                :download="`${asset.fileName}.${asset.extension}`"
                                class="flex items-center p-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors group/asset"
                            >
                                <span class="p-1.5 bg-white rounded shadow-sm text-gray-400 group-hover/asset:text-blue-500 mr-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4"
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
                                </span>
                                <span class="text-xs font-medium text-gray-600 group-hover/asset:text-blue-700 truncate">
                                    {{ asset.fileName }}
                                </span>
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Replies -->
                <div
                    v-if="comment.replies?.length"
                    class="mt-4 space-y-4"
                >
                    <Reply
                        v-for="reply in comment.replies"
                        :key="reply.replyId"
                        :reply="reply"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
