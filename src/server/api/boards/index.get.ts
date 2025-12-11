import fs from 'node:fs/promises'
import path from 'node:path'

import { joinDataDir } from '#src/util/path'

export default defineEventHandler(async event => {
    const boardDir = joinDataDir('board')

    try {
        const files = await fs.readdir(boardDir)
        const boardFiles = files.filter(f => f.endsWith('.json'))

        const boards = await Promise.all(boardFiles.map(async f => {
            // TODO: read title and boardId only from the file
            const content = await fs.readFile(path.join(boardDir, f), 'utf-8')
            return JSON.parse(content)
        }))

        return boards
    } catch (error) {
        console.error(`[${event.path}] Error reading boards list:`, error)
        return []
    }
})
