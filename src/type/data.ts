export type AssetShape = {
    assetId: string
    fileName: string
    extension: string
    size: number
    publicUrl: string
    url: string
    createdAt: string
}

export type BoardShape = {
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
