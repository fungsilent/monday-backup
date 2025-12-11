<script setup lang="ts">
defineProps<{
    name: string
    className?: string
}>()
</script>

<template>
    <div
        class="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white"
        :class="className"
    >
        {{ name.charAt(0).toUpperCase() }}
    </div>
</template>
