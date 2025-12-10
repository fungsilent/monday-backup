import fs from 'node:fs/promises'
import path from 'node:path'

import { dataDirName } from '#root/config'

export default defineEventHandler(async event => {
    const boardId = getRouterParam(event, 'boardId')
    const dataDir = path.join(process.cwd(), `${dataDirName}/board`)

    try {
        // Find file matching board ID
        const files = await fs.readdir(dataDir)
        const boardFile = files.find(f => f.startsWith(`${boardId}.json`))

        if (!boardFile) {
            throw createError({ statusCode: 404, statusMessage: 'Board not found' })
        }

        const content = await fs.readFile(path.join(dataDir, boardFile), 'utf-8')
        return JSON.parse(content)
    } catch {
        throw createError({ statusCode: 404, statusMessage: 'Board not found' })
    }
})

