import { openDB, type DBSchema } from 'idb'

interface PrismPDFDB extends DBSchema {
    files: {
        key: string
        value: {
            id: string
            name: string
            type: string
            size: number
            createdAt: number
            content: Blob
        }
        indexes: { 'by-date': number }
    }
}

const DB_NAME = 'prism-pdf-db'
const DB_VERSION = 1

export interface StoredFile {
    id: string
    name: string
    type: string
    size: number
    createdAt: number
}

export const initDB = async () => {
    return openDB<PrismPDFDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            const store = db.createObjectStore('files', { keyPath: 'id' })
            store.createIndex('by-date', 'createdAt')
        },
    })
}

export const saveFileToWorkspace = async (file: File | Blob, name: string) => {
    const db = await initDB()
    const id = crypto.randomUUID()
    const storedFile = {
        id,
        name,
        type: file.type,
        size: file.size,
        createdAt: Date.now(),
        content: file instanceof File ? file : new Blob([file], { type: 'application/pdf' }) // Ensure Blob
    }
    await db.put('files', storedFile)
    return storedFile
}

export const getWorkspaceFiles = async (): Promise<StoredFile[]> => {
    const db = await initDB()
    const files = await db.getAllFromIndex('files', 'by-date')
    // Return metadata only (exclude heavy content)
    return files.map(({ id, name, type, size, createdAt }) => ({
        id,
        name,
        type,
        size,
        createdAt
    })).reverse() // Newest first
}

export const getFileContent = async (id: string): Promise<Blob | undefined> => {
    const db = await initDB()
    const file = await db.get('files', id)
    return file?.content
}

export const deleteFileFromWorkspace = async (id: string) => {
    const db = await initDB()
    await db.delete('files', id)
}
