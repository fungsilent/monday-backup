import type { Asset } from '#src/data/fetch'
import type { BoardShape, AssetShape, SubitemShape, ItemShape } from '../type/data.js'

export function assetFileName(asset: Asset | AssetShape): string {
    return 'assetId' in asset
        ? `${asset.assetId}${asset.extension}`
        : `${asset.id}${asset.file_extension}`
}

export const getAllAssets = (board: BoardShape): AssetShape[] => {
    const allAssets: AssetShape[] = []

    board.groups.forEach(group => {
        group.items.forEach(item => {
            allAssets.push(...item.assets)

            allAssets.push(...getItemAssets(item))

            item.subItems.forEach(subItem => {
                allAssets.push(...getItemAssets(subItem))
            })
        })
    })

    // Dedup based on assetId
    return [...new Map(allAssets.map(a => [a.assetId, a])).values()]
}

function getItemAssets(item: ItemShape | SubitemShape): AssetShape[] {
    const assets: AssetShape[] = []

    assets.push(...item.assets)

    item.comments.forEach(comment => {
        assets.push(...comment.assets)

        comment.replies.forEach(reply => {
            assets.push(...reply.assets)
        })
    })

    return assets
}