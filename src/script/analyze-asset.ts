import fs from 'node:fs'

import { dataDirName } from '#root/config'
import { getAllAssets } from '#src/util/data'
import { joinDataDir } from '#src/util/path'

import type { BoardShape } from '#src/type/data'

type BoardStats = {
    name: string
    count: number
    size: number
}

/* Main: Analyze Assets */
analyze()

async function analyze() {
    const dataDir = joinDataDir('board')
    const files = fs.readdirSync(dataDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    if (!jsonFiles.length) {
        console.log(`No board JSON files found in ${dataDirName}`)
        return
    }

    const stats = new Map<string, BoardStats>()

    console.log('Analyzing assets...')

    await Promise.all(jsonFiles.map(async file => {
        const filePath = joinDataDir('board', file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const board: BoardShape = JSON.parse(content)

        const boardAssets = getAllAssets(board)
        const totalSize = boardAssets.reduce((sum, asset) => sum + asset.size, 0)

        stats.set(board.boardId, {
            name: board.name,
            count: boardAssets.length,
            size: totalSize
        })
    }))

    printSummary(stats)
}

function printSummary(stats: Map<string, BoardStats>) {
    console.log('\nSummary')
    console.log('='.repeat(80))
    console.log(
        'Board ID'.padEnd(15) +
        'Board Name'.padEnd(30) +
        'Count'.padEnd(10) +
        'Total Size'
    )
    console.log('─'.repeat(80))

    let totalCount = 0
    let totalSize = 0

    stats.forEach((stat, boardId) => {
        totalCount += stat.count
        totalSize += stat.size

        console.log(
            boardId.padEnd(15) +
            stat.name.slice(0, 29).padEnd(30) +
            stat.count.toString().padEnd(10) +
            formatBytes(stat.size)
        )
    })

    console.log('─'.repeat(80))
    console.log(
        'TOTAL'.padEnd(45) +
        totalCount.toString().padEnd(10) +
        formatBytes(totalSize)
    )
    console.log('='.repeat(80))
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
