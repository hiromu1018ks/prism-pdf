import { useEffect, useState } from 'react'
import { getWorkspaceFiles, deleteFileFromWorkspace, type StoredFile, getFileContent } from '../../lib/storage'
import { FileText, Trash2, Download, Clock, HardDrive } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'

interface FileListProps {
    onSelect?: (file: StoredFile) => void
    selectable?: boolean
}

export function FileList({ onSelect, selectable }: FileListProps) {
    const [files, setFiles] = useState<StoredFile[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadFiles = async () => {
        try {
            const data = await getWorkspaceFiles()
            setFiles(data)
        } catch (error) {
            console.error(error)
            toast.error('ファイルの読み込みに失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadFiles()
    }, [])

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('本当にこのファイルを削除しますか？')) return

        try {
            await deleteFileFromWorkspace(id)
            toast.success('ファイルを削除しました')
            loadFiles()
        } catch (error) {
            console.error(error)
            toast.error('削除に失敗しました')
        }
    }

    const handleDownload = async (e: React.MouseEvent, file: StoredFile) => {
        e.stopPropagation()
        try {
            const content = await getFileContent(file.id)
            if (!content) throw new Error('File not found')

            const url = URL.createObjectURL(content)
            const link = document.createElement('a')
            link.href = url
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error(error)
            toast.error('ダウンロードに失敗しました')
        }
    }

    const formatSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB'
    }

    const formatDate = (ms: number) => {
        return new Date(ms).toLocaleString('ja-JP')
    }

    if (isLoading) {
        return <div className="text-center py-12 text-gray-500">読み込み中...</div>
    }

    if (files.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <HardDrive className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                    ワークスペースは空です。<br />
                    処理したファイルをここに保存して再利用できます。
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
                <div
                    key={file.id}
                    onClick={() => selectable && onSelect?.(file)}
                    className={cn(
                        "group relative bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all",
                        selectable ? "cursor-pointer hover:ring-2 hover:ring-blue-500 hover:border-transparent" : "hover:shadow-md"
                    )}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => handleDownload(e, file)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="ダウンロード"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => handleDelete(e, file.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="削除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate mb-1" title={file.name}>
                        {file.name}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {formatSize(file.size)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(file.createdAt)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}
