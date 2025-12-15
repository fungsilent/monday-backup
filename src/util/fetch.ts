export async function promiseConcurrencyPool<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
    const pool = new Set<Promise<void>>()

    // Active tasks and push them to the concurrency pool
    for (const item of items) {
        // If active promises in the pool exceed the limit, wait one of promise to complete
        if (pool.size >= limit) {
            await Promise.race(pool)
        }

        // Add the promise to the pool
        const promise = task(item)
        const wrappedPromise = promise.finally(() => pool.delete(wrappedPromise))
        pool.add(wrappedPromise)
    }

    // After all tasks are added to the pool, wait for all promises in the pool to complete
    await Promise.allSettled(pool)
}

type RequestOptions = RequestInit & {
    url: string
    timeout?: number
}

export const request = async ({ url, timeout, ...options }: RequestOptions) => {
    let retry = 3
    while (retry > 0) {
        const controller = new AbortController()
        let timeoutId: NodeJS.Timeout | undefined

        if (timeout) {
            timeoutId = setTimeout(() => {
                controller.abort()
            }, timeout)
        }

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            })
            return response
        } catch (error) {
            retry--
            if (retry === 0) throw error
            console.warn(`Request failed, retrying (${3 - retry}/3)... Error: ${error}`)
        } finally {
            if (timeout) {
                clearTimeout(timeoutId)
            }
        }
    }
    throw new Error('Unreachable')
}
