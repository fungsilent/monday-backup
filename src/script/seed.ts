import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createWriteStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

/* API */
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

type GraphQLResponse<T> = {
    data: T
    errors?: any[]
}

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

/* Data shape */
type BoardShape = {
    boardId: string
    name: string
    groups: {
        groupId: string
        name: string
        items: {
            itemId: string
            title: string
            createdBy: string
            createdAt: string
            updatedAt: string
            column: {
                name: string
                value: string | null
            }[]
            assets: AssetShape[]
            comments: {
                commentId: string
                body: string
                edited_at: string
                created_at: string
                updated_at: string
                createdBy: string
                assets: AssetShape[]
                replies: {
                    replyId: string
                    body: string
                    createdBy: string
                    createdAt: string
                    updatedAt: string
                    assets: AssetShape[]
                }[]
            }[]
        }[]
    }[]
}

type AssetShape = {
    assetId: string
    fileName: string
    extension: string
    size: number
    publicUrl: string
    url: string
    createdAt: string
}

// Environment check
const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN
const MONDAY_API_URL = 'https://api.monday.com/v2'

if (!MONDAY_API_TOKEN) {
    console.error('Error: MONDAY_API_TOKEN environment variable is not set.')
    process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../data')

const boardIds = [
    '8871724565',
]

seed()

async function seed() {
    console.log('Starting seed script...')
    
    // Clean data directory
    await cleanDataDir()

    // Loop boards
    for (const boardId of boardIds) {
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
                console.log(`  Processing group: ${group.title} (${group.id})`)
                
                const allItems: GetBoardItemsResponse['boards'][number]['groups'][number]['items_page']['items'] = []
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
                            column: item.column_values.map(cv => ({
                                name: cv.column.title,
                                value: cv.text
                            })),
                            assets: item.assets.map(asset => transformAsset(asset)),
                            comments: item.updates.map(update => ({
                                commentId: update.id,
                                body: update.body,
                                edited_at: update.edited_at,
                                created_at: update.created_at,
                                updated_at: update.updated_at,
                                createdBy: update.creator.name,
                                assets: (update.assets).map(asset => transformAsset(asset)),
                                replies: update.replies.map(reply => ({
                                    replyId: reply.id,
                                    body: reply.body,
                                    createdBy: reply.creator.name,
                                    createdAt: reply.created_at,
                                    updatedAt: reply.updated_at,
                                    assets: (reply.assets).map(asset => transformAsset(asset))
                                }))
                            }))
                        }
                    })
                })
            }

            // Create JSON file
            const fileName = `${boardId}.json`
            const filePath = path.join(DATA_DIR, fileName)
            await fs.writeFile(filePath, JSON.stringify(targetBoard, null, 4))
            console.log(`  Saved to ${fileName}`)

            // Download assets
            console.log(`  Downloading assets for board ${boardId}...`)
            const assetDir = path.join(DATA_DIR, 'asset', boardId)
            await fs.mkdir(assetDir, { recursive: true })

            const assets: AssetShape[] = []
            targetBoard.groups.forEach(group => {
                group.items.forEach(item => {
                    assets.push(...item.assets)

                    item.comments.forEach(comment => {
                        assets.push(...comment.assets)

                        comment.replies.forEach(reply => {
                            assets.push(...reply.assets)
                        })
                    })
                })
            })

            // Dedup assets by ID
            const uniqueAssets = [...new Map(assets.map(a => [a.assetId, a])).values()]
            const totalAssets = uniqueAssets.length
            
            // Sync assets: Remove local assets that are not in the new list
            const localAssets = await fs.readdir(assetDir).catch(() => [] as string[])
            const validAssetFilenames = new Set(uniqueAssets.map(a => `${a.assetId}.${a.extension}`))
            
            await Promise.all(localAssets.map(async file => {
                if (!validAssetFilenames.has(file)) {
                    await fs.unlink(path.join(assetDir, file))
                    console.log(`    Deleted obsolete asset: ${file}`)
                }
            }))

            let downloadedCount = 0
            
            console.log(`    Found ${totalAssets} assets to download.`)

            await processBatch(uniqueAssets, 50, async (asset) => {
                const filename = `${asset.assetId}.${asset.extension}`
                const dest = path.join(assetDir, filename)
                
                // Check if exists
                const exists = await fs.access(dest).then(() => true).catch(() => false)
                
                if (exists) {
                     // File exists, skip download
                     downloadedCount++
                     return
                }

                // File doesn't exist, download
                try {
                    await downloadFile(asset.publicUrl, dest)
                    downloadedCount++
                    process.stdout.write(`\r    Progress: ${downloadedCount}/${totalAssets} (${Math.round(downloadedCount / totalAssets * 100)}%)`)
                } catch (err) {
                    console.error(`\n    Failed to download asset ${asset.assetId} (${asset.fileName}):`, err)
                }
            })
            
            process.stdout.write('\n') // New line after progress bar
            console.log(`  Assets downloaded to ${assetDir}`)

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
        await fs.mkdir(DATA_DIR, { recursive: true })
        const files = await fs.readdir(DATA_DIR)
        for (const file of files) {
            const isBoardJson = boardIds.some(id => file === `${id}.json`)
            const isAssetDir = file === 'asset'
            
            if (!isBoardJson && !isAssetDir) {
                console.log(`Deleted: ${file}`)
                await fs.rm(path.join(DATA_DIR, file), { recursive: true, force: true })
            }
        }
    } catch (error) {
        console.error('Error cleaning data directory:', error)
        throw error
    }
}

async function downloadFile(url: string, destPath: string) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
    if (!res.body) throw new Error(`No body for ${url}`)

    const fileStream = createWriteStream(destPath)
    await pipeline(Readable.fromWeb(res.body as any), fileStream)
}

function transformAsset(asset: Asset): AssetShape {
    return {
        assetId: asset.id,
        fileName: asset.name,
        extension: asset.file_extension,
        size: asset.file_size,
        publicUrl: asset.public_url,
        url: asset.url,
        createdAt: asset.created_at
    }
}

async function fetchGraphQL<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const response = await fetch(MONDAY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': MONDAY_API_TOKEN!
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

async function getBoardGroups(boardId: string): Promise<GetAllGroupResponse['boards'][number]> {
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
    return data.boards[0]
}

async function getBoardGroupItems(
    boardId: string,
    groupId: string,
    cursor: string | null = null
): Promise<GetBoardItemsResponse['boards'][number]['groups'][number]> {
    const query = `
        query ($boardIds: [ID!], $groupIds: [String!], $cursor: String) {
            boards(ids: $boardIds) {
                groups(ids: $groupIds) {
                    id
                    title
                    items_page(limit: 100, cursor: $cursor) {
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
    return data.boards[0].groups[0]
}
