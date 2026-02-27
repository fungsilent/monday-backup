<script setup lang="ts">
import { useCopy } from '#src/composables/useCopy'

defineProps<{
    id: string
}>()

const { copyText } = useCopy()
</script>

<template>
    <span
        class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 font-mono cursor-pointer"
        @click="copyText($event, id)"
    >
        {{ id }}
    </span>
</template>
