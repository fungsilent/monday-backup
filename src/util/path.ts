import path from 'node:path'

import { dataDirName } from '#root/config'

const rootPath = process.cwd()

export const joinRoot = (...paths: string[]): string => {
    return path.join(rootPath, ...paths)
}

export const joinDataDir = (...paths: string[]): string => {
    return joinRoot(dataDirName, ...paths)
}