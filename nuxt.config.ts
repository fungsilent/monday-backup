import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    srcDir: 'src/',
    serverDir: 'src/server',
    devtools: { enabled: true },
    modules: ['@nuxtjs/tailwindcss'],
    typescript: {
        typeCheck: true,
    },
    alias: {
        '#root': fileURLToPath(new URL('.', import.meta.url)),
        '#src': fileURLToPath(new URL('./src', import.meta.url)),
    },
})
