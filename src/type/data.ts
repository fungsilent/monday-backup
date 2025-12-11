/* Data shape */
export type BoardShape = {
    boardId: string
    name: string
    groups: {
        groupId: string
        name: string
        items: Array<BaseItemShape & { subitems: BaseItemShape[] }>
    }[]
}

export type BaseItemShape = {
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
    comments: CommentShape[]
}

export type CommentShape = {
    commentId: string
    body: string
    formattedBody: string
    edited_at: string
    created_at: string
    updated_at: string
    createdBy: string
    assets: AssetShape[]
    replies: ReplyShape[]
}

export type ReplyShape = {
    replyId: string
    body: string
    formattedBody: string
    createdBy: string
    createdAt: string
    updatedAt: string
    assets: AssetShape[]
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

export type WorkspaceShape = {
    name: BoardShape['name']
    boards: Pick<BoardShape, 'boardId' | 'name'>[]
}
export type GroupShape = BoardShape['groups'][number]
export type ItemShape = GroupShape['items'][number]
export type SubitemShape = ItemShape['subitems'][number]
