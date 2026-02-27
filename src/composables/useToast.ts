export interface Toast {
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    duration?: number
}

export const useToast = () => {
    const toasts = useState<Toast[]>('toasts', () => [])

    const showToast = (type: Toast['type'], message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9)
        const toast: Toast = { id, message, type, duration }

        toasts.value.push(toast)

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }

    const removeToast = (id: string) => {
        toasts.value = toasts.value.filter(t => t.id !== id)
    }

    return {
        toasts,
        showToast,
        removeToast
    }
}
