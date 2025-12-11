import fs from 'node:fs/promises'
import path from 'node:path'

import { getAllAssets } from '#src/util/data'
import { joinDataDir } from '#src/util/path'

import type { BoardShape } from '#src/type/data'

/* Main: Analyze Assets */
analyze()

async function analyze() {
    try {
        const dataDir = joinDataDir()
        const files = await fs.readdir(dataDir)
        const jsonFiles = files.filter(f => f.endsWith('.json'))

        if (jsonFiles.length === 0) {
            console.log('No board JSON files found in src/data')
            return
        }

        for (const file of jsonFiles) {
            const filePath = path.join(dataDir, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const board: BoardShape = JSON.parse(content)

            console.log(`\nBoard: ${board.name} (${board.boardId})`)
            console.log('='.repeat(50))

            const boardAssets = getAllAssets(board)
            const totalSize = boardAssets.reduce((sum, asset) => sum + asset.size, 0)

            console.log(`Total Assets: ${boardAssets.length}`)
            console.log(`Total Size: ${formatBytes(totalSize)}`)
            console.log('-'.repeat(30))

            const stats = new Map<string, { count: number, size: number }>()

            boardAssets.forEach(asset => {
                const ext = asset.extension
                const current = stats.get(ext) || { count: 0, size: 0 }
                stats.set(ext, {
                    count: current.count + 1,
                    size: current.size + asset.size
                })
            })

            // Sort by count desc
            const sortedStats = [...stats.entries()].sort((a, b) => b[1].count - a[1].count)

            console.log(`${'Extension'.padEnd(10)} | ${'Count'.padEnd(8)} | ${'Total Size'}`)
            console.log('-'.repeat(40))

            sortedStats.forEach(([ext, stat]) => {
                console.log(`${ext.padEnd(10)} | ${stat.count.toString().padEnd(8)} | ${formatBytes(stat.size)}`)
            })
        }

    } catch (error) {
        console.error('Error analyzing assets:', error)
    }
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
