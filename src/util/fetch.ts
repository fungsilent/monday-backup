import axios from 'axios'

import type { AxiosRequestConfig } from 'axios'

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

export const request = async <T>({ url, timeout, ...options }: AxiosRequestConfig) => {
    let retry = 3
    while (retry > 0) {
        try {
            const response = await axios<T>({
                url,
                timeout: timeout ?? 3 * 60 * 1000, // 3 minutes
                validateStatus: () => true, // Don't throw on error status codes automatically
                ...options
            })

            if (response.status !== 200) {
                if (response.status === 403) {
                    throw new Error('Forbidden')
                }
                throw new Error(`${response.status} ${response.statusText}`)
            }

            return response.data
        } catch (error) {
            retry--

            // Skip retry for 403 forbidden error
            if (error instanceof Error && error.message === 'Forbidden') {
                throw new Error('Forbidden')
            }

            if (retry === 0) {
                const message = axios.isAxiosError(error)
                    ? error.message
                    : error instanceof Error
                        ? error.message
                        : String(error)
                console.warn('[Request] Failed', url, message)
                throw error
            }
        }
    }

    throw new Error('Unreachable')
}
