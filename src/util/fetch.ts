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
    await Promise.all(pool)
}

type RequestOptions = RequestInit & {
    url: string
    timeout?: number
}

export const request = async ({ url, timeout, ...options }: RequestOptions) => {
    const controller = new AbortController()

    if (timeout) {
        setTimeout(() => {
            controller.abort()
        }, timeout)
    }

    return await fetch(url, {
        ...options,
        signal: controller.signal
    })
}
