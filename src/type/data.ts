/* Data shape */
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
                formattedBody: string
                edited_at: string
                created_at: string
                updated_at: string
                createdBy: string
                assets: AssetShape[]
                replies: {
                    replyId: string
                    body: string
                    formattedBody: string
                    createdBy: string
                    createdAt: string
                    updatedAt: string
                    assets: AssetShape[]
                }[]
            }[]
        }[]
    }[]
}

export type AssetShape = {
    assetId: string
    fileName: string
    extension: string
    size: number
    publicUrl: string
    url: string
    localUrl: string
    createdAt: string
}

export type GroupShape = BoardShape['groups'][number]
export type ItemShape = GroupShape['items'][number]
export type CommentShape = ItemShape['comments'][number]
export type ReplyShape = CommentShape['replies'][number]