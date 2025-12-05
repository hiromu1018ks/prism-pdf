import { useState } from 'react'
import { FileUpload } from "../ui/FileUpload"
import { getPDFPageCount, renderPageToDataURL } from '../../lib/pdf-render'
import { PDFDocument, degrees } from 'pdf-lib'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Loader2, Download, RotateCw, Trash2, Grip } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'

interface PageItem {
    id: string
    originalIndex: number
    rotation: number
    thumbnail: string
}

function SortablePageItem({ item, onRotate, onRemove }: { item: PageItem, onRotate: (id: string) => void, onRemove: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
            <div className="aspect-[1/1.4] relative bg-gray-100 dark:bg-gray-900">
                <img
                    src={item.thumbnail}
                    alt={`Page ${item.originalIndex + 1}`}
                    className="w-full h-full object-contain transition-transform duration-300"
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-md shadow-sm opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                >
                    <Grip className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onRotate(item.id)}
                        className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-md shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Rotate 90°"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onRemove(item.id)}
                        className="p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-md shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                        title="Remove Page"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center">
                    ページ {item.originalIndex + 1}
                </div>
            </div>
        </div>
    )
}

export function ReorderFeature() {
    const [file, setFile] = useState<File | null>(null)
    const [pages, setPages] = useState<PageItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleUpload = async (files: File[]) => {
        if (files.length === 0) return
        const uploadedFile = files[0]
        setFile(uploadedFile)
        setIsLoading(true)
        setPages([])

        try {
            const count = await getPDFPageCount(uploadedFile)

            const newPages: PageItem[] = []
            for (let i = 1; i <= count; i++) {
                const url = await renderPageToDataURL(uploadedFile, i, 0.4)
                newPages.push({
                    id: Math.random().toString(36).substring(7),
                    originalIndex: i - 1, // 0-based index for pdf-lib
                    rotation: 0,
                    thumbnail: url
                })
            }
            setPages(newPages)
        } catch (error) {
            console.error(error)
            toast.error('PDFの読み込みに失敗しました')
            setFile(null)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const handleRotate = (id: string) => {
        setPages(prev => prev.map(page =>
            page.id === id ? { ...page, rotation: (page.rotation + 90) % 360 } : page
        ))
    }

    const handleRemove = (id: string) => {
        setPages(prev => prev.filter(page => page.id !== id))
    }

    const handleSave = async () => {
        if (!file || pages.length === 0) return
        setIsSaving(true)
        try {
            const fileBuffer = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(fileBuffer)
            const newPdf = await PDFDocument.create()

            // We need to copy pages one by one because they might be reordered and rotated
            // Actually copyPages can take array of indices, but we need to apply rotation
            // So we copy them, add them, and then rotate the added page.

            const indices = pages.map(p => p.originalIndex)
            // Copy all needed pages at once for efficiency?
            // But we need to map back to our pages array to apply rotation.
            // If we copy [0, 0, 1], we get 3 pages.
            // Let's do it one by one or batch if possible.
            // pdf-lib copyPages returns array of PDFPage.

            // Optimization: Copy all unique pages once, then add them?
            // But simpler is just copy what we need.

            const copiedPages = await newPdf.copyPages(pdfDoc, indices)

            // copiedPages array matches the order of indices passed.
            // So copiedPages[i] corresponds to pages[i].

            pages.forEach((pageItem, index) => {
                const page = copiedPages[index]
                const existingRotation = page.getRotation().angle
                page.setRotation(degrees(existingRotation + pageItem.rotation))
                newPdf.addPage(page)
            })

            const pdfBytes = await newPdf.save()

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'organized.pdf'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success('PDFが正常に保存されました！')
        } catch (error) {
            console.error(error)
            toast.error('PDFの保存に失敗しました')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">PDF並べ替え</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    ページの並べ替え、回転、削除を行います。
                </p>
            </div>

            {!file ? (
                <FileUpload onUpload={handleUpload} />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <Loader2 className={cn("w-6 h-6 text-red-500", isLoading && "animate-spin")} />
                            </div>
                            <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">{pages.length} ページ</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setFile(null)
                                setPages([])
                            }}
                            className="text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                            ファイルを変更
                        </button>
                    </div>

                    {isLoading && pages.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={pages.map(p => p.id)}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {pages.map((item) => (
                                        <SortablePageItem
                                            key={item.id}
                                            item={item}
                                            onRotate={handleRotate}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    <div className="flex justify-end pt-4 sticky bottom-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || pages.length === 0}
                            className={cn(
                                "flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white transition-all shadow-lg",
                                isSaving || pages.length === 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30"
                            )}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    保存中...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    PDFを保存
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
