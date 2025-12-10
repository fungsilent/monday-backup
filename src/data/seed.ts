import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createWriteStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { formatInTimeZone } from 'date-fns-tz'

import { dataDirName } from '#root/config'
import { getAllAssets } from '#src/util/data'
import { seedBoardIds } from '#src/data/board'

import type { ReadableStream } from 'node:stream/web'
import type { BoardShape, AssetShape, ItemShape, CommentShape, ReplyShape } from '#src/type/data'

/* API */
type GraphQLResponse<T> = {
    data: T
    errors?: unknown[]
}

type GetAllGroupResponse = {
    boards: {
        id: string
        name: string
        groups: {
            id: string
            title: string
        }[]
    }[]
}

type GetBoardItemsResponse = {
    boards: {
        id: string
        name: string
        groups: {
            id: string
            title: string
            items_page: {
                cursor: string | null
                items: {
                    id: string
                    name: string
                    created_at: string
                    updated_at: string
                    creator: Creator
                    column_values: {
                        text: string | null
                        type: string
                        column: {
                            id: string
                            title: string
                        }
                    }[]
                    assets: Asset[]
                    updates: {
                        id: string
                        body: string
                        edited_at: string
                        created_at: string
                        updated_at: string
                        item_id: string
                        original_creation_date: string | null
                        text_body: string
                        creator: Creator
                        assets: Asset[]
                        replies: {
                            id: string
                            body: string
                            creator_id: string
                            edited_at: string
                            created_at: string
                            updated_at: string
                            text_body: string
                            creator: Creator
                            assets: Asset[]
                        }[]
                    }[]
                }[]
            }
        }[]
    }[]
}

type Board = GetBoardItemsResponse['boards'][number]
type Group = Board['groups'][number]
type Item = Group['items_page']['items'][number]
type Comment = Item['updates'][number]
type Reply = Comment['replies'][number]

type Creator = {
    id: string
    name: string
}

type Asset = {
    id: string
    created_at: string
    name: string
    file_extension: string
    file_size: number
    public_url: string
    url: string
}

// Environment check
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config = {
    mondayApiToken: process.env.MONDAY_API_TOKEN,
    mondayApiUrl: 'https://api.monday.com/v2',
    dataDir: path.join(__dirname, `../../${dataDirName}`), // #root/{dataDirName}
    downloadAsset: false,
    boardIds: selectSeedBoardIds(false),
}

/* Main: Seed */
seed()

async function seed() {
    // Environment check
    if (!config.mondayApiToken) {
        console.error('Error: MONDAY_API_TOKEN environment variable is not set.')
        process.exit(1)
    }

    console.log('Starting seed script...')

    // Clean data directory
    await cleanDataDir()

    // Loop boards
    for (const boardId of config.boardIds) {
        console.log(`Processing board: ${boardId}`)

        try {
            // Fetch board groups
            const boardInfo = await getBoardGroups(boardId)
            if (!boardInfo) {
                console.warn(`Board ${boardId} not found.`)
                continue
            }

            const targetBoard: BoardShape = {
                boardId: boardInfo.id,
                name: boardInfo.name,
                groups: []
            }

            // Loop groups
            for (const group of boardInfo.groups) {
                console.log(`─ Processing group: ${group.title} (${group.id})`)

                const allItems: Item[] = []
                let cursor: string | null = null

                do {
                    // Fetch group items
                    const groupData = await getBoardGroupItems(boardId, group.id, cursor)
                    allItems.push(...groupData.items_page.items)
                    cursor = groupData.items_page.cursor
                } while (cursor)

                targetBoard.groups.push({
                    groupId: group.id,
                    name: group.title,
                    items: allItems.map(item => {
                        return {
                            itemId: item.id,
                            title: item.name,
                            createdBy: item.creator.name,
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
                                createdBy: update.creator.name,
                                assets: update.assets.map(asset => transformAsset(boardId, asset)),
                                replies: update.replies.map(reply => ({
                                    replyId: reply.id,
                                    body: reply.body,
                                    formattedBody: transformBody(boardId, reply),
                                    createdBy: reply.creator.name,
                                    createdAt: reply.created_at,
                                    updatedAt: reply.updated_at,
                                    assets: reply.assets.map(asset => transformAsset(boardId, asset))
                                }))
                            }))
                        }
                    })
                })
            }

            // Create JSON file
            const fileName = `${boardId}.json`
            const boardDir = path.join(config.dataDir, 'board')
            await fs.mkdir(boardDir, { recursive: true })
            const filePath = path.join(boardDir, fileName)
            await fs.writeFile(filePath, JSON.stringify(targetBoard, null, 4))
            console.log(`─ Saved to ${filePath}`)

            if (!config.downloadAsset) {
                // Skip asset download
                continue
            }

            // Download assets
            console.log(`─ Downloading assets for board ${boardId}...`)
            const assetDir = path.join(config.dataDir, 'asset', boardId)
            await fs.mkdir(assetDir, { recursive: true })

            const boardAssets = getAllAssets(targetBoard)
            const totalAssets = boardAssets.length

            // Sync assets: Remove local assets that are not in the new list
            const localAssets = await fs.readdir(assetDir).catch(() => [] as string[])
            const validAssetFilenames = new Set(boardAssets.map(asset => assetFileName(asset)))
            const deletedFiles = new Set<string>()

            await Promise.all(localAssets.map(async file => {
                if (!validAssetFilenames.has(file)) {
                    await fs.unlink(path.join(assetDir, file))
                    console.log(`─── Deleted obsolete asset: ${file}`)
                    deletedFiles.add(file)
                }
            }))

            const existingFiles = new Set(localAssets.filter(file => !deletedFiles.has(file)))
            const assetsToDownload = boardAssets.filter(asset => !existingFiles.has(assetFileName(asset)))

            const existingCount = totalAssets - assetsToDownload.length
            const toBeDownloadedCount = assetsToDownload.length

            console.log(`─── Found ${totalAssets} assets.`)
            console.log(`─── Existing: ${existingCount} (skipping)`)
            console.log(`─── To download: ${toBeDownloadedCount}`)

            let downloadedCount = 0

            if (toBeDownloadedCount > 0) {
                await processBatch(assetsToDownload, 50, async asset => {
                    const filename = assetFileName(asset)
                    const dest = path.join(assetDir, filename)

                    try {
                        await downloadFile(asset.publicUrl, dest)
                        downloadedCount++
                        process.stdout.write(`\r─── Progress: ${downloadedCount}/${toBeDownloadedCount} (${Math.round(downloadedCount / toBeDownloadedCount * 100)}%)`)
                    } catch (err) {
                        console.error(`\n─── Failed to download asset ${asset.assetId} (${asset.fileName}):`, err)
                    }
                })
                process.stdout.write('\n') // New line after progress bar
            }

            console.log(`─ Assets downloaded to ${assetDir}`)
        } catch (error) {
            console.error(`Error processing board ${boardId}:`, error)
        }
    }

    console.log('Seed script completed.')
}

async function processBatch<T>(items: T[], batchSize: number, task: (item: T) => Promise<void>) {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        await Promise.all(batch.map(task))
    }
}

async function cleanDataDir() {
    try {
        await fs.mkdir(config.dataDir, { recursive: true })
        const files = await fs.readdir(config.dataDir)
        for (const file of files) {
            const isBoardDir = file === 'board'
            const isAssetDir = file === 'asset'

            if (!isBoardDir && !isAssetDir) {
                console.log(`Deleted: ${file}`)
                await fs.rm(path.join(config.dataDir, file), { recursive: true, force: true })
            }
        }
    } catch (error) {
        console.error('Error cleaning data directory:', error)
        throw error
    }
}

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

function transformBody(
    boardId: Board['id'],
    commentOrReply: Comment | Reply,
): CommentShape['formattedBody'] | ReplyShape['formattedBody'] {
    let body = commentOrReply.body
    if (!body) return body

    // Remove <a> tag from user mention
    const userMentionRegex = new RegExp('<a[^>]*class="[^"]*user_mention_editor[^"]*"[^>]*>(.*?)</a>', 'g')
    body = body.replace(
        userMentionRegex,
        '<span data-body-type="user-mention">$1</span>'
    )

    commentOrReply.assets.forEach(asset => {
        // Replace <a> tag by asset ID
        const { assetId, localUrl } = transformAsset(boardId, asset)
        const fileRegex = new RegExp(`<a[^>]*data-asset_id="${assetId}"[^>]*>(.*?)</a>`, 'g')
        const downloadName = `${asset.name}${asset.file_extension}`
        body = body.replace(
            fileRegex,
            `<a href="${localUrl}" download="${downloadName}" data-body-type="asset">${asset.name}</a>`
        )

        // Replace <img> tag by asset ID
        const imageRegex = new RegExp(`<img[^>]*data-asset_id="${assetId}"[^>]*>`, 'g')
        body = body.replace(
            imageRegex,
            `<img src="${localUrl}">`
        )
    })

    return body
}

function transformColumnValue(columnValues: Item['column_values']): ItemShape['column'] {
    return columnValues.map(column => {
        const name = column.column.title
        let value = column.text

        if (value) {
            switch (name) {
                case 'Last Updated':
                case 'Creation Log': {
                    const date = new Date(value)
                    value = formatInTimeZone(date, 'Asia/Hong_Kong', 'yyyy-MM-dd HH:mm:ss')
                    break
                }
            }
        }

        return {
            name: column.column.title,
            value: value
        }
    })
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

/* MARK: GraphQL */
async function fetchGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(config.mondayApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': config.mondayApiToken!
        },
        body: JSON.stringify({ query, variables })
    })

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json() as GraphQLResponse<T>
    if (json.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`)
    }
    return json.data
}

async function getBoardGroups(boardId: Board['id']): Promise<GetAllGroupResponse['boards'][number]> {
    const query = `
        query ($boardIds: [ID!]) {
            boards(ids: $boardIds) {
                id
                name
                groups {
                    id
                    title
                }
            }
        }
    `
    const data = await fetchGraphQL<GetAllGroupResponse>(query, { boardIds: [boardId] })
    const board = data.boards?.[0]
    if (!board) {
        throw new Error(`Board ${boardId} not found.`)
    }
    return board
}

async function getBoardGroupItems(
    boardId: Board['id'],
    groupId: Group['id'],
    cursor: Group['items_page']['cursor'] | null = null
): Promise<Group> {
    const limit = 100
    const query = `
        query ($boardIds: [ID!], $groupIds: [String!], $cursor: String) {
            boards(ids: $boardIds) {
                groups(ids: $groupIds) {
                    id
                    title
                    items_page(limit: ${limit}, cursor: $cursor) {
                        cursor
                        items {
                            id
                            name
                            created_at
                            updated_at
                            creator {
                                id
                                name
                            }
                            column_values {
                                text
                                type
                                column {
                                    id
                                    title
                                }
                            }
                            assets {
                                id
                                created_at
                                file_extension
                                file_size
                                name
                                public_url
                                url
                            }
                            updates {
                                id
                                body
                                edited_at
                                created_at
                                updated_at
                                item_id
                                original_creation_date
                                text_body
                                creator {
                                    id
                                    name
                                }
                                assets {
                                    id
                                    created_at
                                    file_extension
                                    file_size
                                    name
                                    public_url
                                    url
                                }
                                replies {
                                    id
                                    body
                                    creator_id
                                    edited_at
                                    created_at
                                    updated_at
                                    text_body
                                    creator {
                                        id
                                        name
                                    }
                                    assets {
                                        id
                                        created_at
                                        file_extension
                                        file_size
                                        name
                                        public_url
                                        url
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `
    const data = await fetchGraphQL<GetBoardItemsResponse>(query, { boardIds: [boardId], groupIds: [groupId], cursor })
    const groups = data.boards?.[0]?.groups?.[0]
    if (!groups) {
        throw new Error(`Group ${groupId} not found.`)
    }
    return groups
}

/* Utils */
function selectSeedBoardIds(dev: boolean): Board['id'][] {
    const seedData = dev ? seedBoardIds.dev : seedBoardIds.prod
    return Object.values(seedData).flatMap(boardIds => boardIds)
}