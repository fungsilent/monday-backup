import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import readline from 'node:readline'

import { seedBoardIds } from '#src/data/board'
import { joinDataDir } from '#src/util/path'
import { isDev } from '#root/src/util/env'

import type { WorkspaceShape } from '#root/src/type/data'

export default defineEventHandler(async event => {
    const boardDir = joinDataDir('board')

    try {
        const files = await fs.readdir(boardDir)
        const boardFiles = files.filter(f => f.endsWith('.json'))

        const allBoards = await Promise.all(boardFiles.map(async f => {
            return readBoardMetadata(joinDataDir('board', f))
        }))

        const workspaceIds = isDev()
            ? seedBoardIds.dev
            : seedBoardIds.prod

        const workspaces: WorkspaceShape[] = []
        const assignedBoardIds = new Set<string>()

        Object.entries(workspaceIds).forEach(([workspaceName, ids]) => {
            const boardsInWorkspace = allBoards.filter(b => ids.boardIds.includes(b.boardId))
            if (boardsInWorkspace.length) {
                boardsInWorkspace.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                workspaces.push({
                    name: workspaceName.toUpperCase(),
                    boards: boardsInWorkspace,
                })
                boardsInWorkspace.forEach(b => assignedBoardIds.add(b.boardId))
            }
        })

        const otherBoards = allBoards.filter(b => !assignedBoardIds.has(b.boardId))
        if (otherBoards.length > 0) {
            otherBoards.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            workspaces.push({
                name: 'other',
                boards: otherBoards,
            })
        }

        return workspaces
    } catch (error) {
        console.error(`[${event.path}] Error reading boards list:`, error)
        return []
    }
})

async function readBoardMetadata(filePath: string) {
    const fileStream = createReadStream(filePath)
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })

    const metadata = {
        boardId: '',
        name: '',
        createdAt: '',
    }

    for await (const line of rl) {
        if (!metadata.boardId) {
            const match = line.match(/"boardId":\s*"([^"]+)"/)
            if (match && match[1]) {
                metadata.boardId = match[1]
            }
        }

        if (!metadata.name) {
            const match = line.match(/"name":\s*"([^"]+)"/)
            if (match && match[1]) {
                metadata.name = match[1]
            }
        }

        if (!metadata.createdAt) {
            const match = line.match(/"createdAt":\s*"([^"]+)"/)
            if (match && match[1]) {
                metadata.createdAt = match[1]
            }
        }

        if (Object.values(metadata).every(v => !!v)) {
            fileStream.destroy()
            break
        }
    }

    return metadata
}
