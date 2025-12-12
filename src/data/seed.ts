import 'dotenv/config'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { formatInTimeZone } from 'date-fns-tz'

import { seedBoardIds } from '#src/data/board'
import { isApiTokenValid, fetchBoardGroups, fetchBoardGroupItems } from '#src/data/fetch'

import { joinDataDir } from '#src/util/path'
import { getAllAssets } from '#src/util/data'
import { promiseConcurrencyPool } from '#src/util/fetch'

import type { ReadableStream } from 'node:stream/web'
import type {
    BoardShape,
    AssetShape,
    ItemShape,
    CommentShape,
    ReplyShape,
    BaseItemShape,
} from '#src/type/data'
import type {
    Board,
    Item,
    Comment,
    Reply,
    Asset,
    BaseItem,
} from '#src/data/fetch'

type SeedResult = {
    boardId: string
    boardName?: string
    status: 'success' | 'failed'
    error?: string
    assets: {
        total: number
        existing: number
        downloaded: number
        failed: number
    }
}

const dev = process.argv.includes('--dev')
const clean = process.argv.includes('--clean')
const noFetch = process.argv.includes('--no-fetch')
const noDownload = process.argv.includes('--no-download')

const seedData = dev ? seedBoardIds.dev : seedBoardIds.prod
const allBoardIds = Object.values(seedData).flatMap(boardIds => boardIds)

seed()

/* MARK: Seed */
async function seed() {
    // Environment check
    if (!isApiTokenValid()) {
        console.error('Error: MONDAY_API_TOKEN environment variable is not set.')
        process.exit(1)
    }
    if (noFetch && noDownload) {
        console.error('Error: no-fetch and no-download options both enabled to not do anything.')
        process.exit(1)
    }

    printConfig()
    console.log('Starting seed script...')
    await setupDataDir()

    let results: SeedResult[] = []

    // Phase 1: Fetch data, transform, and save JSON
    if (!noFetch) {
        console.log('\n🔵 Phase 1: Fetching and saving board data...')
        results = await fetchAndSaveBoardData()
    } else {
        console.log('\n🔵 Phase 1: Data fetching skipped.')
        // When skipping fetch, if existing JSON files then mark as success, otherwise mark as failed
        for (const boardId of allBoardIds) {
            const result: SeedResult = {
                boardId,
                status: 'failed',
                error: 'JSON file not found',
                assets: { total: 0, existing: 0, downloaded: 0, failed: 0 }
            }

            try {
                const filePath = joinDataDir('board', `${boardId}.json`)
                await fs.access(filePath)
                result.status = 'success'
                result.error = undefined
            } catch { /* emptyg */ }

            results.push(result)
        }
    }

    // Phase 2: Download assets (if enabled)
    if (!noDownload) {
        console.log('\n🔵 Phase 2: Downloading assets...')
        results = await findAndDownloadAssets(results)
    } else {
        console.log('\n🔵 Phase 2: Asset download skipped.')
    }

    printSummary(results)
    process.exit(0)
}

/* MARK: Phase */
async function fetchAndSaveBoardData() {
    const results: SeedResult[] = []

    for (const boardId of allBoardIds) {
        console.log(`Processing board: ${boardId}`)

        try {
            // Fetch board groups
            const boardInfo = await fetchBoardGroups(boardId)
            if (!boardInfo) {
                console.warn(`Board ${boardId} not found.`)
                results.push({
                    boardId,
                    status: 'failed',
                    error: 'Board not found',
                    assets: { total: 0, existing: 0, downloaded: 0, failed: 0 }
                })
                continue
            }

            const targetBoard: BoardShape = {
                boardId: boardInfo.id,
                name: boardInfo.name,
                createdAt: boardInfo.created_at,
                groups: []
            }

            // Loop groups
            for (const group of boardInfo.groups) {
                console.log(`─ Processing group: ${group.title} (${group.id})`)

                const allItems: Item[] = []
                let cursor: string | null = null

                // Fetch group items until all items are fetched
                do {
                    const groupData = await fetchBoardGroupItems(boardId, group.id, cursor)
                    allItems.push(...groupData.items_page.items)
                    cursor = groupData.items_page.cursor
                } while (cursor)

                targetBoard.groups.push({
                    groupId: group.id,
                    name: group.title,
                    items: allItems.map(item => {
                        return {
                            ...transformBaseItem(boardId, item),
                            subitems: item.subitems.map(subitem => transformBaseItem(boardId, subitem))
                        }
                    })
                })
            }

            await createJsonFile(targetBoard)

            results.push({
                boardId,
                boardName: boardInfo.name,
                status: 'success',
                assets: { total: 0, existing: 0, downloaded: 0, failed: 0 }
            })

        } catch (error) {
            console.error(`Error processing board ${boardId}:`, error)
            results.push({
                boardId,
                status: 'failed',
                error: error instanceof Error
                    ? error.message
                    : String(error),
                assets: { total: 0, existing: 0, downloaded: 0, failed: 0 }
            })
        }
    }

    return results
}

async function findAndDownloadAssets(results: SeedResult[]) {
    for (const result of results) {
        if (result.status !== 'success') continue

        try {
            // Read the JSON file
            const filePath = joinDataDir('board', `${result.boardId}.json`)
            const fileContent = await fs.readFile(filePath, 'utf-8')
            const board: BoardShape = JSON.parse(fileContent)

            const assetStats = await downloadAssets(board)
            result.assets = assetStats
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : String(error)
            console.error(`Error downloading assets for board ${result.boardId}:`, message)
            result.error = `Asset download failed: ${message}`
        }
    }

    return results
}

/* MARK: Flow */
function printConfig() {
    const length = 30
    const line = '─'.repeat(60)
    console.log(line)
    console.log('Environment'.padEnd(length), dev ? 'development' : 'production')
    console.log('Fetch data'.padEnd(length), noFetch ? 'skipped' : 'enabled')
    console.log('Download assets'.padEnd(length), noDownload ? 'skipped' : 'enabled')
    console.log(line)
}

async function setupDataDir() {
    try {
        // Setup data directory
        console.log('Setting up data directory...')
        await fs.mkdir(joinDataDir(), { recursive: true })
        await fs.mkdir(joinDataDir('board'), { recursive: true })
        await fs.mkdir(joinDataDir('asset'), { recursive: true })

        if (!clean) {
            console.log('Skipping clean...')
            return
        }

        // Clean board directory
        console.log('Cleaning board directory...')
        const jsonFiles = await fs.readdir(joinDataDir('board'))
        await Promise.all(jsonFiles.map(async jsonFile => {
            const boardId = jsonFile.split('.')[0]
            if (
                !boardId
                || !allBoardIds.includes(boardId)
            ) {
                console.log(`─ Deleted: ${jsonFile}`)
                await fs.rm(joinDataDir('board', jsonFile), { recursive: true, force: true })
            }
        }))
    } catch (error) {
        console.error('Error cleaning data directory:', error)
        throw error
    }
}

async function createJsonFile(board: BoardShape) {
    const filePath = joinDataDir('board', `${board.boardId}.json`)
    await fs.writeFile(filePath, JSON.stringify(board, null, 4))

    console.log(`─ Saved to ${filePath}`)
}

async function downloadAssets(board: BoardShape) {
    console.log(`─ Downloading assets for board ${board.boardId}...`)
    const assetDir = joinDataDir('asset', board.boardId)
    await fs.mkdir(assetDir, { recursive: true })

    const boardAssets = getAllAssets(board)
    const totalAssets = boardAssets.length

    // Sync assets: Remove local assets that are not in the new list
    const localAssets = await fs.readdir(assetDir).catch(() => [] as string[])
    const validAssetFilenames = new Set(boardAssets.map(asset => assetFileName(asset)))
    const deletedFiles = new Set<string>()

    await Promise.all(localAssets.map(async file => {
        if (!validAssetFilenames.has(file)) {
            await fs.unlink(joinDataDir('asset', board.boardId, file))
            console.log(`─── Deleted obsolete asset: ${file}`)
            deletedFiles.add(file)
        }
    }))

    // Summary assets
    const existingFiles = new Set(localAssets.filter(file => !deletedFiles.has(file)))
    const assetsToDownload = boardAssets.filter(asset => !existingFiles.has(assetFileName(asset)))

    const existingCount = totalAssets - assetsToDownload.length
    const toBeDownloadedCount = assetsToDownload.length

    console.log(`─── Found ${totalAssets} assets.`)
    console.log(`─── Existing: ${existingCount} (skipping)`)
    console.log(`─── To download: ${toBeDownloadedCount}`)

    // Download not existing assets
    let downloadedCount = 0
    let failedCount = 0

    if (toBeDownloadedCount > 0) {
        await promiseConcurrencyPool(assetsToDownload, 50, async asset => {
            const filename = assetFileName(asset)
            const dest = joinDataDir('asset', board.boardId, filename)

            try {
                await downloadFile(asset.publicUrl, dest)
                downloadedCount++
                process.stdout.write(`\r─── Progress: ${downloadedCount}/${toBeDownloadedCount} (${Math.round(downloadedCount / toBeDownloadedCount * 100)}%)`)
            } catch (error) {
                failedCount++
                console.error(`\n─── Failed to download asset ${asset.assetId} (${asset.fileName}):`, error)
            }
        })

        process.stdout.write('\n') // New line after progress bar
    }

    console.log(`─ Assets downloaded to ${assetDir}`)

    return {
        total: totalAssets,
        existing: existingCount,
        downloaded: downloadedCount,
        failed: failedCount
    }
}

function printSummary(results: SeedResult[]) {
    console.log('\n\nSummary:')
    console.log('='.repeat(100))
    console.log(
        'Board ID'.padEnd(15) +
        'Status'.padEnd(12) +
        'Assets (Success/Fail/Total)'.padEnd(30) +
        'Note'
    )
    console.log('─'.repeat(100))

    for (const res of results) {
        const status = res.status === 'success' ? '✅ Success' : '❌ Failed'
        const assets = `${res.assets.downloaded}/${res.assets.failed}/${res.assets.total}`
        const note = res.error || res.boardName || ''

        console.log(
            res.boardId.padEnd(15) +
            status.padEnd(12) +
            assets.padEnd(30) +
            note
        )
    }
    console.log('='.repeat(100))
}

/* MARK: Util */
async function downloadFile(publicUrl: Asset['public_url'], destPath: string) {
    const res = await fetch(publicUrl)
    if (!res.ok) throw new Error(`Failed to fetch ${publicUrl}: ${res.statusText}`)
    if (!res.body) throw new Error(`No body for ${publicUrl}`)

    const fileStream = createWriteStream(destPath)
    await pipeline(Readable.fromWeb(res.body as ReadableStream), fileStream)
}

/* MARK: Data */
function assetFileName(asset: Asset | AssetShape): string {
    return 'assetId' in asset
        ? `${asset.assetId}${asset.extension}`
        : `${asset.id}${asset.file_extension}`
}

function transformBaseItem(boardId: Board['id'], item: BaseItem): BaseItemShape {
    return {
        itemId: item.id,
        title: item.name,
        createdBy: item.creator?.name ?? 'Unknown',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        column: transformColumnValue(item.column_values),
        assets: item.assets.map(asset => transformAsset(boardId, asset)),
        comments: item.updates.map(update => ({
            commentId: update.id,
            body: update.body,
            formattedBody: transformBody(boardId, update),
            edited_at: update.edited_at,
            created_at: update.created_at,
            updated_at: update.updated_at,
            createdBy: update.creator?.name ?? 'Unknown',
            assets: update.assets.map(asset => transformAsset(boardId, asset)),
            replies: update.replies.map(reply => ({
                replyId: reply.id,
                body: reply.body,
                formattedBody: transformBody(boardId, reply),
                createdBy: reply.creator?.name ?? 'Unknown',
                createdAt: reply.created_at,
                updatedAt: reply.updated_at,
                assets: reply.assets.map(asset => transformAsset(boardId, asset))
            }))
        })),
    }
}

function transformBody(
    boardId: Board['id'],
    commentOrReply: Comment | Reply,
): CommentShape['formattedBody'] | ReplyShape['formattedBody'] {
    let body = commentOrReply.body
    if (!body) return body

    // Remove <a> tag for user mention
    const userMentionRegex = new RegExp('<a[^>]*data-mention-id="[^"]*"[^>]*>(.*?)</a>', 'g')
    body = body.replace(
        userMentionRegex,
        '<span data-body-type="user-mention">$1</span>'
    )

    commentOrReply.assets.forEach(asset => {
        // Replace asset <a> tag link to local file
        const { assetId, localUrl, url } = transformAsset(boardId, asset)
        const fileRegex = new RegExp(`<a[^>]*href="${url}"[^>]*>(.*?)</a>`, 'g')
        const downloadName = `${asset.name}${asset.file_extension}`
        body = body.replace(
            fileRegex,
            `<a href="${localUrl}" download="${downloadName}" data-body-type="asset">${asset.name}</a>`
        )

        // Replace asset <img> tag to local file
        const imageRegex = new RegExp(`<img[^>]*data-asset_id="${assetId}"[^>]*>`, 'g')
        body = body.replace(
            imageRegex,
            `<img src="${localUrl}">`
        )
    })

    return body
}

function transformColumnValue(columnValues: Item['column_values']): ItemShape['column'] {
    const columns: ItemShape['column'] = []

    columnValues.forEach(({ text, column }) => {
        const name = column.title
        let value = text

        switch (name) {
            case 'Subitems': {
                return // skip subitems column
            }
            case 'Last Updated':
            case 'Creation Log': {
                if (!value) break
                const date = new Date(value)
                value = formatInTimeZone(date, 'Asia/Hong_Kong', 'yyyy-MM-dd HH:mm:ss')
                break
            }
        }

        columns.push({
            name,
            value
        })
    })
    return columns
}

function transformAsset(boardId: Board['id'], asset: Asset): AssetShape {
    return {
        assetId: asset.id,
        fileName: asset.name,
        extension: asset.file_extension,
        size: asset.file_size,
        publicUrl: asset.public_url,
        url: asset.url,
        localUrl: `/asset/${boardId}/${assetFileName(asset)}`,
        createdAt: asset.created_at
    }
}
