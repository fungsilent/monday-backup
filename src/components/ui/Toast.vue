<script setup lang="ts">
import { useToast } from '#src/composables/useToast'

const { toasts, removeToast } = useToast()

const getToastClasses = (type: string) => {
    switch (type) {
        case 'success':
            return 'bg-green-50 text-green-800 border-green-200'
        case 'error':
            return 'bg-red-50 text-red-800 border-red-200'
        case 'warning':
            return 'bg-yellow-50 text-yellow-800 border-yellow-200'
        default:
            return 'bg-blue-50 text-blue-800 border-blue-200'
    }
}
</script>

<template>
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <TransitionGroup
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="transform translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform translate-y-2 opacity-0"
        >
            <div
                v-for="toast in toasts"
                :key="toast.id"
                class="pointer-events-auto min-w-[300px] max-w-md rounded-lg border p-4 shadow-lg flex items-start justify-between gap-3"
                :class="getToastClasses(toast.type)"
            >
                <div class="flex-1 text-sm font-medium">
                    {{ toast.message }}
                </div>
                <button
                    class="text-current opacity-60 hover:opacity-100 transition-opacity"
                    @click="removeToast(toast.id)"
                >
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
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>
