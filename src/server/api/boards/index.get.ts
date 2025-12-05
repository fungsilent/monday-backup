import fs from 'node:fs/promises'
import path from 'node:path'

export default defineEventHandler(async () => {
    const dataDir = path.join(process.cwd(), 'public/board')

    try {
        const files = await fs.readdir(dataDir)
        const boardFiles = files.filter(f => f.endsWith('.json'))

        const boards = await Promise.all(boardFiles.map(async f => {
            const content = await fs.readFile(path.join(dataDir, f), 'utf-8')
            return JSON.parse(content)
        }))

        return boards
    } catch (error) {
        console.error('Error reading boards:', error)
        return []
    }
})
