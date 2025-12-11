import 'dotenv/config'

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
                items: Array<BaseItem & { subitems: BaseItem[] }>
            }
        }[]
    }[]
}

export type BaseItem = {
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
}

export type Board = GetBoardItemsResponse['boards'][number]
export type Group = Board['groups'][number]
export type Item = Group['items_page']['items'][number]
export type Comment = Item['updates'][number]
export type Reply = Comment['replies'][number]

export type Asset = {
    id: string
    created_at: string
    name: string
    file_extension: string
    file_size: number
    public_url: string
    url: string
}

type Creator = {
    id: string
    name: string
}

const MONDAY_API_URL = 'https://api.monday.com/v2'
const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN

export const isApiTokenValid = (): boolean => {
    return !!MONDAY_API_TOKEN
}

export const fetchGraphQL = async <T>(query: string, variables: Record<string, unknown> = {}): Promise<T> => {
    const response = await fetch(MONDAY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': MONDAY_API_TOKEN || ''
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

/* Monday API */
export const fetchBoardGroups = async (boardId: Board['id']): Promise<GetAllGroupResponse['boards'][number]> => {
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

export const fetchBoardGroupItems = async (
    boardId: Board['id'],
    groupId: Group['id'],
    cursor: Group['items_page']['cursor'] | null = null
): Promise<Group> => {
    const limit = 100
    const itemQuery = `
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
    `

    const query = `
        query ($boardIds: [ID!], $groupIds: [String!], $cursor: String) {
            boards(ids: $boardIds) {
                groups(ids: $groupIds) {
                    id
                    title
                    items_page(limit: ${limit}, cursor: $cursor) {
                        cursor
                        items {
                            ${itemQuery}
                            subitems {
                                ${itemQuery}
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
