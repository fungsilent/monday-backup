import fs from 'node:fs'


import { seedBoardIds } from '#src/data/board'
import { assetFileName } from '#src/util/data'
import { joinDataDir } from '#src/util/path'

import type { BoardShape, AssetShape, BaseItemShape } from '#src/type/data'

type AssetError = {
    type: 'missing_file' | 'size_mismatch'
    boardId: string
    boardName: string
    itemId: string
    itemName: string
    assetId: string
    assetName: string
    expectedSize: number
    actualSize: number
    path: string
}

type BoardError = {
    type: 'missing_json'
    boardId: string
}

type BoardStats = {
    name: string
    status: 'success' | 'missing_json'
    totalAssets: number
    errorCount: number
}

const dev = process.argv.includes('--dev')
const showDetail = process.argv.includes('--detail')

const seedData = dev ? seedBoardIds.dev : seedBoardIds.prod

validate()

async function validate() {
    console.log('Starting validation...')

    const stats = new Map<string, BoardStats>()
    const errors: (AssetError | BoardError)[] = []

    const allBoardIds = Object.values(seedData).flatMap(workspace =>
        workspace.boardIds.map(boardId => boardId)
    )

    await Promise.all(allBoardIds.map(async boardId => {
        const boardJsonPath = joinDataDir('board', `${boardId}.json`)

        // Check board JSON existence
        if (!fs.existsSync(boardJsonPath)) {
            stats.set(boardId, {
                name: '',
                status: 'missing_json',
                totalAssets: 0,
                errorCount: 1
            })
            errors.push({ type: 'missing_json', boardId })
            return
        }

        const json = fs.readFileSync(boardJsonPath, 'utf-8')
        const board: BoardShape = JSON.parse(json)

        // Traverse to find all assets with context
        const assetsWithContext = getAssetsWithContext(board)

        stats.set(boardId, {
            name: board.name,
            status: 'success',
            totalAssets: assetsWithContext.length,
            errorCount: 0
        })
        const currentStats = stats.get(boardId)!

        await Promise.allSettled(assetsWithContext.map(async ({ asset, item }) => {
            const assetPath = joinDataDir('asset', boardId, assetFileName(asset))

            // Check asset existence
            if (!fs.existsSync(assetPath)) {
                currentStats.errorCount++
                errors.push({
                    type: 'missing_file',
                    boardId,
                    boardName: board.name,
                    itemId: item.itemId,
                    itemName: item.title,
                    assetId: asset.assetId,
                    assetName: asset.fileName,
                    expectedSize: asset.size,
                    actualSize: 0,
                    path: assetPath
                })
                return
            }

            // Check file size matches with JSON data
            const stat = fs.statSync(assetPath)
            if (stat.size !== asset.size) {
                currentStats.errorCount++
                errors.push({
                    type: 'size_mismatch',
                    boardId,
                    boardName: board.name,
                    itemId: item.itemId,
                    itemName: item.title,
                    assetId: asset.assetId,
                    assetName: asset.fileName,
                    expectedSize: asset.size,
                    actualSize: stat.size,
                    path: assetPath
                })
            }
        }))
    }))

    printSummary(stats)

    if (showDetail) {
        printErrors(errors)
    }

    process.exit(1)
}

/* MARK: Flow */
function printSummary(stats: Map<string, BoardStats>) {
    console.log('\nSummary')
    console.log('='.repeat(100))
    console.log(
        'Board ID'.padEnd(15) +
        'Board Name'.padEnd(30) +
        'Total'.padEnd(10) +
        'Errors'.padEnd(10) +
        'Rate'
    )
    console.log('─'.repeat(100))

    let totalAssets = 0
    let totalErrors = 0

    stats.forEach((stat, boardId) => {
        if (stat.status === 'success') {
            totalAssets += stat.totalAssets
            totalErrors += stat.errorCount
        }

        const summary = stat.status === 'missing_json'
            ? {
                name: '** Missing JSON **',
                totalAssets: '-',
                errorCount: '-',
                rate: '-',
            }
            : {
                name: stat.name,
                totalAssets: stat.totalAssets.toString(),
                errorCount: stat.errorCount,
                rate: `${Math.round((stat.errorCount / stat.totalAssets) * 100)}%`,
            }

        console.log(
            boardId.padEnd(15) +
            summary.name.slice(0, 25).padEnd(30) +
            summary.totalAssets.toString().padEnd(10) +
            summary.errorCount.toString().padEnd(10) +
            summary.rate.padEnd(10)
        )
    })

    let totalRate = 0
    if (totalAssets > 0) {
        totalRate = Math.round((totalErrors / totalAssets) * 100)
    } else if (totalErrors > 0) {
        totalRate = 100
    }

    console.log('─'.repeat(100))
    console.log(
        'TOTAL'.padEnd(45) +
        totalAssets.toString().padEnd(10) +
        totalErrors.toString().padEnd(10) +
        `${totalRate}%`.padEnd(10)
    )
    console.log('='.repeat(100))
}

function printErrors(errors: (AssetError | BoardError)[]) {
    console.log('\nAsset Errors Details:')
    console.log('='.repeat(150))
    console.log(
        'Type'.padEnd(20) +
        'Board ID'.padEnd(15) +
        'Board Name'.padEnd(30) +
        'Item ID'.padEnd(15) +
        'Item Name'.padEnd(30) +
        'Asset ID'.padEnd(15) +
        'Expected Size'.padEnd(15) +
        'Actual Size'.padEnd(15)
    )
    console.log('─'.repeat(150))

    const missingBoards = errors.filter((e): e is BoardError => e.type === 'missing_json')
    const assetErrors = errors.filter((e): e is AssetError => e.type !== 'missing_json')

    if (missingBoards.length) {
        missingBoards.forEach(e => {
            console.log(
                'No board JSON found'.padEnd(20) +
                `${e.boardId}`.padEnd(15)
            )
        })
    }

    if (assetErrors.length) {
        assetErrors.forEach(e => {
            const type = e.type === 'missing_file'
                ? 'Missing file'
                : 'Size mismatch'

            console.log(
                type.padEnd(20) +
                `${e.boardId}`.padEnd(15) +
                `${e.boardName.slice(0, 25)}`.padEnd(30) +
                `${e.itemId}`.padEnd(15) +
                `${e.itemName.slice(0, 25)}`.padEnd(30) +
                `${e.assetId}`.padEnd(15) +
                `${e.expectedSize}`.padEnd(15) +
                `${e.actualSize}`.padEnd(15)
            )
        })
    }

    if (
        !missingBoards.length
        && !assetErrors.length
    ) {
        console.log('✅ No errors found')
    }

    console.log('='.repeat(150))
}

/* MARK: Helpers */
function getAssetsWithContext(board: BoardShape) {
    const assets: { asset: AssetShape, item: Pick<BaseItemShape, 'itemId' | 'title'> }[] = []

    board.groups.forEach(group => {
        group.items.forEach(item => {
            const itemContext = {
                itemId: item.itemId,
                title: item.title
            }

            // Item assets
            item.assets.forEach(asset => {
                assets.push({
                    item: itemContext,
                    asset,
                })
            })

            // Subitems assets
            if (item.subItems) {
                item.subItems.forEach(subItem => {
                    const subItemContext = {
                        itemId: subItem.itemId,
                        title: subItem.title
                    }
                    subItem.assets.forEach(asset => {
                        assets.push({
                            item: subItemContext,
                            asset,
                        })
                    })
                })
            }

            // Comment assets
            item.comments.forEach(comment => {
                comment.assets.forEach(asset => {
                    assets.push({
                        item: itemContext,
                        asset,
                    })
                })

                comment.replies.forEach(reply => {
                    reply.assets.forEach(asset => {
                        assets.push({
                            item: itemContext,
                            asset,
                        })
                    })
                })
            })
        })
    })

    return assets
}
