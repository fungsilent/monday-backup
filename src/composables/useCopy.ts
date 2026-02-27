export const useCopy = () => {
    const { showToast } = useToast()

    const copyText = (event: Event, text: string | null) => {
        if (!text) return
        event.stopPropagation()
        navigator.clipboard.writeText(text)
        showToast('success', 'Copied to clipboard')
    }

    return {
        copyText,
    }
}
