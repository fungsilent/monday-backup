import fs from 'node:fs'
import path from 'node:path'

import { joinDataDir } from '#src/util/path'

export default defineEventHandler(async event => {
    const boardId = getRouterParam(event, 'boardId')
    const assetId = getRouterParam(event, 'assetId')

    if (!boardId) {
        throw createError({ statusCode: 404, statusMessage: 'Board ID not found' })
    }
    if (!assetId) {
        throw createError({ statusCode: 404, statusMessage: 'Asset ID not found' })
    }

    const filePath = joinDataDir('asset', boardId, assetId)
    if (!fs.existsSync(filePath)) {
        throw createError({ statusCode: 404, statusMessage: 'Asset not found' })
    }

    const ext = path.extname(filePath)
    const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.svg': 'image/svg+xml'
    }

    if (mimeTypes[ext]) {
        setHeader(event, 'Content-Type', mimeTypes[ext])
    }

    return sendStream(event, fs.createReadStream(filePath))
})
