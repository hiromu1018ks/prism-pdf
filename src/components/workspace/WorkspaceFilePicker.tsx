import { FileList } from "./FileList"
import { getFileContent, type StoredFile } from "../../lib/storage"
import { X } from "lucide-react"
import { toast } from "sonner"

interface WorkspaceFilePickerProps {
    isOpen: boolean
    onClose: () => void
    onFileSelect: (file: File) => void
}

export function WorkspaceFilePicker({ isOpen, onClose, onFileSelect }: WorkspaceFilePickerProps) {
    if (!isOpen) return null

    const handleSelect = async (storedFile: StoredFile) => {
        try {
            const content = await getFileContent(storedFile.id)
            if (!content) throw new Error('File not found')

            const file = new File([content], storedFile.name, { type: storedFile.type })
            onFileSelect(file)
            onClose()
        } catch (error) {
            console.error(error)
            toast.error('ファイルの読み込みに失敗しました')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold">ワークスペースから選択</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <FileList selectable onSelect={handleSelect} />
                </div>
            </div>
        </div>
    )
}
