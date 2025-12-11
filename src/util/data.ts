import type { BoardShape, AssetShape } from '../type/data.js'

export const getAllAssets = (board: BoardShape): AssetShape[] => {
    const allAssets: AssetShape[] = []

    board.groups.forEach(group => {
        group.items.forEach(item => {
            allAssets.push(...item.assets)

            item.comments.forEach(comment => {
                allAssets.push(...comment.assets)

                comment.replies.forEach(reply => {
                    allAssets.push(...reply.assets)
                })
            })
        })
    })

    // Dedup based on assetId
    return [...new Map(allAssets.map(a => [a.assetId, a])).values()]
}

