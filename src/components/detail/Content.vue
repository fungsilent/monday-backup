<script setup lang="ts">
defineProps<{
    html: string
}>()

const handleBodyClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement
        if (img.src) {
            event.preventDefault()
            event.stopPropagation()
            window.open(img.src, '_blank')
        }
    }
}
</script>

<template>
    <div
        class="prose text-gray-700"
        @click="handleBodyClick"
        v-html="html"
    />
</template>

<style>
/* Prose styles for rendered HTML content */
.prose p {
    margin-bottom: 0.75em;
    line-height: 1.5;
}
.prose ul {
    list-style-type: disc;
    padding-left: 1.2em;
    margin-bottom: 0.75em;
}
.prose ol {
    list-style-type: decimal;
    padding-left: 1.2em;
    margin-bottom: 0.75em;
}
.prose a:not([data-body-type="asset"]) {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
}
.prose a:not([data-body-type="asset"]):hover {
    text-decoration: underline;
}
.prose img {
    cursor: zoom-in;
    border-radius: 0.5rem;
    border: 1px solid #f3f4f6;
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    max-width: 100%;
}
.prose [data-body-type="user-mention"] {
    color: #2563eb;
    font-weight: 600;
    background-color: #eff6ff;
    padding: 0.1em 0.3em;
    border-radius: 0.25em;
}
.prose [data-body-type="asset"] {
    display: inline-flex;
    align-items: center;
    color: #4b5563;
    font-weight: 500;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 0.2em 0.6em;
    border-radius: 0.375rem;
    margin: 0.2em 0;
    font-size: 0.9em;
    transition: all 0.2s;
}
.prose [data-body-type="asset"]:hover {
    background-color: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
}
</style>

