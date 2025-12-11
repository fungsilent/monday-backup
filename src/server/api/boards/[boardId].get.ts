import fs from 'node:fs/promises'

import { joinDataDir } from '#src/util/path'

export default defineEventHandler(async event => {
    const boardId = getRouterParam(event, 'boardId')
    const boardDir = joinDataDir('board')

    try {
        // Find file matching board ID
        const files = await fs.readdir(boardDir)
        const boardFile = files.find(f => f.startsWith(`${boardId}.json`))

        if (!boardFile) {
            throw createError({ statusCode: 404, statusMessage: 'Board not found' })
        }

        const filePath = joinDataDir('board', boardFile)
        const content = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(content)
    } catch (error) {
        console.error(`[${event.path}] Error reading board json:`, error)
        throw createError({ statusCode: 404, statusMessage: 'Board not found' })
    }
})

