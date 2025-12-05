import { useState } from 'react'
import { FileUpload } from "../ui/FileUpload"
import { mergePDFs } from '../../lib/pdf-utils'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, FileText, Download, Loader2, HardDrive } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { WorkspaceFilePicker } from '../workspace/WorkspaceFilePicker'
import { saveFileToWorkspace } from '../../lib/storage'

interface SortableFileItemProps {
    id: string
    file: File
    onRemove: (id: string) => void
}

function SortableFileItem({ id, file, onRemove }: SortableFileItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm group"
        >
            <button
                {...attributes}
                {...listeners}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="w-5 h-5" />
            </button>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <FileText className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
            </div>
            <button
                onClick={() => onRemove(id)}
                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    )
}

type PDFFile = { id: string; file: File };

export function MergeFeature() {
    const [files, setFiles] = useState<PDFFile[]>([])
    const [isMerging, setIsMerging] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleUpload = (newFiles: File[]) => {
        const newFileItems = newFiles.map(file => ({
            id: Math.random().toString(36).substring(7),
            file
        }))
        setFiles(prev => [...prev, ...newFileItems])
    }

    const handleRemove = (id: string) => {
        setFiles(prev => prev.filter(item => item.id !== id))
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const handleMerge = async (saveToWorkspace = false) => {
        if (files.length < 2) return
        setIsMerging(true)
        try {
            const mergedPdfBytes = await mergePDFs(files.map(f => f.file))
            // Save to workspace logic
            if (saveToWorkspace) {
                await saveFileToWorkspace(mergedPdfBytes, 'merged.pdf')
                toast.success('ワークスペースに保存しました')
            } else {
                const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'merged.pdf'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                toast.success('PDFが正常に結合されました！')
            }
        } catch (error) {
            console.error(error)
            toast.error('PDFの結合に失敗しました')
        } finally {
            setIsMerging(false)
        }
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">PDF結合</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    PDFをドラッグ＆ドロップして1つのドキュメントに結合します。
                </p>
            </div>

            <div className="space-y-4">
                <FileUpload onUpload={handleUpload} />
                <div className="flex justify-center">
                    <button
                        onClick={() => setIsPickerOpen(true)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                        <HardDrive className="w-4 h-4" />
                        ワークスペースから追加
                    </button>
                </div>
            </div>

            <WorkspaceFilePicker
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onFileSelect={(file) => handleUpload([file])}
            />

            {files.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                            {files.length} ファイル選択中
                        </h3>
                        <button
                            onClick={() => setFiles([])}
                            className="text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                            すべてクリア
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={files.map(f => f.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {files.map((item) => (
                                    <SortableFileItem
                                        key={item.id}
                                        id={item.id}
                                        file={item.file}
                                        onRemove={handleRemove}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => handleMerge(true)}
                            disabled={isMerging || files.length < 2}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all",
                                isMerging || files.length < 2 ? "opacity-50 cursor-not-allowed" : ""
                            )}
                        >
                            {isMerging ? <Loader2 className="w-5 h-5 animate-spin" /> : <HardDrive className="w-5 h-5" />}
                            ワークスペースに保存
                        </button>
                        <button
                            onClick={() => handleMerge(false)}
                            disabled={isMerging || files.length < 2}
                            className={cn(
                                "flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white transition-all",
                                isMerging || files.length < 2
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
                            )}
                        >
                            {isMerging ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    結合中...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    ダウンロード
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
