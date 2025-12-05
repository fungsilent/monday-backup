import fs from 'node:fs/promises'
import path from 'node:path'

export default defineEventHandler(async event => {
    const id = getRouterParam(event, 'id')
    const dataDir = path.join(process.cwd(), 'public/board')

    try {
        // Find file matching board ID
        const files = await fs.readdir(dataDir)
        const boardFile = files.find(f => f.startsWith(id + '.json'))

        if (!boardFile) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Board not found'
            })
        }

        const content = await fs.readFile(path.join(dataDir, boardFile), 'utf-8')
        return JSON.parse(content)
    } catch {
        throw createError({
            statusCode: 404,
            statusMessage: 'Board not found'
        })
    }
})

