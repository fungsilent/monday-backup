import 'dotenv/config'
import fs from 'node:fs'

import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { formatInTimeZone } from 'date-fns-tz'

import { seedBoardIds } from '#src/data/board'
import { isApiTokenValid, fetchBoardGroups, fetchBoardGroupItems, fetchBoardItemComments } from '#src/data/fetch'
import { request } from '#src/util/fetch'

import { downloadAssetMaxConcurrency, fetchBoardMaxConcurrency } from '#root/config'
import { joinDataDir } from '#src/util/path'
import { assetFileName, getAllAssets } from '#src/util/data'
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
    status: 'init' | 'success' | 'fail' | 'exist'
    error?: string
    assets: {
        total: number
        skipped: number
        downloaded: number
        failed: number
    }
}

const dev = process.argv.includes('--dev')
const clean = process.argv.includes('--clean')
const noFetch = process.argv.includes('--no-fetch')
const noDownload = process.argv.includes('--no-download')

const seedData = dev ? seedBoardIds.dev : seedBoardIds.prod

const allBoardIds = Object.values(seedData).flatMap(workspace =>
    workspace.boardIds.map(boardId => ({
        boardId,
        token: workspace.token,
    }))
)

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
        for (const { boardId } of allBoardIds) {
            const result: SeedResult = {
                boardId,
                status: 'fail',
                error: 'JSON file not found',
                assets: { total: 0, skipped: 0, downloaded: 0, failed: 0 }
            }

            const filePath = joinDataDir('board', `${boardId}.json`)
            if (fs.existsSync(filePath)) {
                result.status = 'exist'
                result.error = undefined
            }

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

    // Loop boards
    for (const { boardId, token } of allBoardIds) {
        console.log(`Processing board: ${boardId}`)

        const result: SeedResult = {
            boardId,
            status: 'success',
            assets: { total: 0, skipped: 0, downloaded: 0, failed: 0 }
        }

        try {
            // Fetch board groups
            const boardInfo = await fetchBoardGroups(boardId, token)
            if (!boardInfo) {
                console.warn(`Board ${boardId} not found.`)
                result.status = 'fail'
                result.error = 'Board not found'
                results.push(result)
                continue
            }

            result.boardName = boardInfo.name

            const targetBoard: BoardShape = {
                boardId: boardInfo.id,
                name: boardInfo.name,
                createdAt: boardInfo.created_at,
                groups: []
            }

            // Loop groups
            for (const group of boardInfo.groups) {
                console.log(`─ Processing group: ${group.title} (${group.id})`)

                const allGroupItems: ItemShape[] = []
                let cursor: string | null = null

                // Fetch group items until all items are fetched
                do {
                    const groupData = await fetchBoardGroupItems(boardId, group.id, cursor, token)
                    groupData.items_page.items.forEach(item => {
                        allGroupItems.push({
                            ...transformBaseItem(boardId, item),
                            subItems: item.subitems.map(subitem => transformBaseItem(boardId, subitem))
                        })
                    })
                    cursor = groupData.items_page.cursor
                } while (cursor)

                // Fetch all comments
                await promiseConcurrencyPool(allGroupItems, fetchBoardMaxConcurrency, async item => {
                    try {
                        const itemComments = await fetchItemComments(item.itemId, token)
                        item.comments = transformComment(boardId, itemComments)
                    } catch (error) {
                        console.error(`Error fetching comments for item ${item.itemId}:`, error)
                        result.status = 'fail'
                        result.error = error instanceof Error
                            ? error.message
                            : String(error)
                    }

                    if (item.subItems) {
                        await Promise.all(item.subItems.map(async subItem => {
                            try {
                                const subItemComments = await fetchItemComments(subItem.itemId, token)
                                subItem.comments = transformComment(boardId, subItemComments)
                            } catch (error) {
                                console.error(`Error fetching comments for subitem ${item.itemId}-${subItem.itemId}:`, error)
                                result.status = 'fail'
                                result.error = error instanceof Error
                                    ? error.message
                                    : String(error)
                            }
                        }))
                    }
                })

                targetBoard.groups.push({
                    groupId: group.id,
                    name: group.title,
                    items: allGroupItems
                })
            }

            await createJsonFile(targetBoard)
        } catch (error) {
            console.error(`Error processing board ${boardId}:`, error)
            result.status = 'fail'
            result.error = error instanceof Error
                ? error.message
                : String(error)
        }

        results.push(result)
    }

    return results
}

async function fetchItemComments(itemId: Item['id'], token: string): Promise<Comment[]> {
    const comments: Comment[] = []
    const limit = 25
    let page = 1
    let hasMore = true

    while (hasMore) {
        const pageComments = await fetchBoardItemComments(itemId, page, token)

        if (pageComments.length < limit) {
            hasMore = false
        }

        comments.push(...pageComments)
        page++
    }

    return comments
}

async function findAndDownloadAssets(results: SeedResult[]) {
    for (const result of results) {
        if (result.status === 'fail') continue

        try {
            // Read the JSON file
            const filePath = joinDataDir('board', `${result.boardId}.json`)
            const fileContent = fs.readFileSync(filePath, 'utf-8')
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
        fs.mkdirSync(joinDataDir(), { recursive: true })
        fs.mkdirSync(joinDataDir('board'), { recursive: true })
        fs.mkdirSync(joinDataDir('asset'), { recursive: true })

        if (!clean) {
            console.log('Skipping clean...')
            return
        }

        // Clean board directory
        console.log('Cleaning board directory...')
        const jsonFiles = fs.readdirSync(joinDataDir('board'))
        const validBoardIds = allBoardIds.map(b => b.boardId)

        await Promise.allSettled(jsonFiles.map(async jsonFile => {
            const boardId = jsonFile.split('.')[0]
            if (
                !boardId
                || !validBoardIds.includes(boardId)
            ) {
                console.log(`─ Deleted: ${jsonFile}`)
                fs.rmSync(joinDataDir('board', jsonFile), { recursive: true, force: true })
            }
        }))
    } catch (error) {
        console.error('Error cleaning data directory:', error)
        throw error
    }
}

async function createJsonFile(board: BoardShape) {
    const filePath = joinDataDir('board', `${board.boardId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(board, null, 4))

    console.log(`─ Saved to ${filePath}`)
}

async function downloadAssets(board: BoardShape) {
    console.log(`─ Downloading assets for board ${board.boardId}...`)
    const assetDir = joinDataDir('asset', board.boardId)
    fs.mkdirSync(assetDir, { recursive: true })

    const boardAssets = getAllAssets(board)
    const totalAssets = boardAssets.length

    // Sync assets: Remove local assets that are not in the new list
    const localAssets = fs.readdirSync(assetDir)
    const validAssetFilenames = new Set(boardAssets.map(asset => assetFileName(asset)))

    // Cleanup obsolete files
    await Promise.allSettled(localAssets.map(async file => {
        if (!validAssetFilenames.has(file)) {
            fs.unlinkSync(joinDataDir('asset', board.boardId, file))
            console.log(`─── Deleted obsolete asset: ${file}`)
        }
    }))

    console.log(`─── Found ${totalAssets} assets.`)

    const count = {
        skipped: 0,
        downloaded: 0,
        failed: 0,
    }

    if (totalAssets) {
        await promiseConcurrencyPool(boardAssets, downloadAssetMaxConcurrency, async asset => {
            const dest = joinDataDir('asset', board.boardId, assetFileName(asset))

            if (fs.existsSync(dest)) {
                count.skipped++
                return
            }

            try {
                await downloadFile(asset.publicUrl, dest)
                count.downloaded++

                // Only show progress for actual downloads
                const progress = count.skipped + count.downloaded + count.failed
                process.stdout.write(`\r─── Progress: ${progress} / ${totalAssets} (${Math.round(progress / totalAssets * 100)}%)`)
            } catch (error) {
                count.failed++
                console.error(`\n─── Failed to download asset ${asset.assetId} (${asset.fileName}):`, error)
            }
        })

        process.stdout.write('\n') // New line after progress bar
    }

    console.log(`─ Assets downloaded to ${assetDir}`)

    return {
        total: totalAssets,
        skipped: count.skipped,
        downloaded: count.downloaded,
        failed: count.failed
    }
}

function printSummary(results: SeedResult[]) {
    console.log('\n\nSummary:')
    console.log('='.repeat(100))
    console.log(
        'Board ID'.padEnd(15) +
        'Status'.padEnd(12) +
        'Assets (Total / Success / Fail)'.padEnd(40) +
        'Note'
    )
    console.log('─'.repeat(100))

    for (const res of results) {
        let status = '❌ Failed'
        if (res.status === 'success') status = '✅ Success'
        if (res.status === 'exist') status = '📁 Exist'

        const assets = `${res.assets.total} / ${res.assets.downloaded + res.assets.skipped} / ${res.assets.failed}`
        const note = res.error || res.boardName || ''

        console.log(
            res.boardId.padEnd(15) +
            status.padEnd(12) +
            assets.padEnd(40) +
            note
        )
    }
    console.log('='.repeat(100))
}

/* MARK: Util */
async function downloadFile(publicUrl: Asset['public_url'], destPath: string) {
    const res = await request({
        url: publicUrl,
        timeout: 10 * 60 * 1000 // 10 minutes
    })
    if (!res.ok) throw new Error(`Failed to fetch ${publicUrl}: ${res.statusText}`)
    if (!res.body) throw new Error(`No body for ${publicUrl}`)

    const fileStream = createWriteStream(destPath)
    await pipeline(Readable.fromWeb(res.body as ReadableStream), fileStream)
}

/* MARK: Data */
function transformBaseItem(boardId: Board['id'], item: BaseItem): BaseItemShape {
    return {
        itemId: item.id,
        title: item.name,
        createdBy: item.creator?.name ?? 'Unknown',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        column: transformColumnValue(item.column_values),
        assets: item.assets.map(asset => transformAsset(boardId, asset)),
        comments: [],
    }
}

function transformComment(boardId: Board['id'], updates: Comment[]): CommentShape[] {
    return updates.map(update => ({
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
    }))
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
