import { useState } from 'react'
import { FileUpload } from "../ui/FileUpload"
import { getPDFPageCount, renderPageToDataURL } from '../../lib/pdf-render'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import { Loader2, Download, Check, HardDrive } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { WorkspaceFilePicker } from '../workspace/WorkspaceFilePicker'
import { saveFileToWorkspace } from '../../lib/storage'

export function SplitFeature() {
    const [file, setFile] = useState<File | null>(null)
    const [pageCount, setPageCount] = useState(0)
    const [thumbnails, setThumbnails] = useState<string[]>([])
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    const handleUpload = async (files: File[]) => {
        if (files.length === 0) return
        const uploadedFile = files[0]
        setFile(uploadedFile)
        setIsLoading(true)
        setThumbnails([])
        setSelectedPages(new Set())

        try {
            const count = await getPDFPageCount(uploadedFile)
            setPageCount(count)

            const newThumbnails: string[] = []
            for (let i = 1; i <= count; i++) {
                const url = await renderPageToDataURL(uploadedFile, i, 0.5)
                newThumbnails.push(url)
            }
            setThumbnails(newThumbnails)
        } catch (error) {
            console.error(error)
            toast.error('PDFの読み込みに失敗しました')
            setFile(null)
        } finally {
            setIsLoading(false)
        }
    }

    const togglePageSelection = (pageIndex: number) => {
        const newSelected = new Set(selectedPages)
        if (newSelected.has(pageIndex)) {
            newSelected.delete(pageIndex)
        } else {
            newSelected.add(pageIndex)
        }
        setSelectedPages(newSelected)
    }

    const handleExtractSelected = async (saveToWorkspace = false) => {
        if (!file || selectedPages.size === 0) return
        setIsProcessing(true)
        try {
            const fileBuffer = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(fileBuffer)
            const newPdf = await PDFDocument.create()

            const pages = Array.from(selectedPages).sort((a, b) => a - b)
            const copiedPages = await newPdf.copyPages(pdfDoc, pages)
            copiedPages.forEach(page => newPdf.addPage(page))

            const pdfBytes = await newPdf.save()

            if (saveToWorkspace) {
                await saveFileToWorkspace(pdfBytes, 'extracted.pdf')
                toast.success('ワークスペースに保存しました')
            } else {
                downloadBlob(pdfBytes, 'extracted.pdf', 'application/pdf')
                toast.success('ページが正常に抽出されました！')
            }
        } catch (error) {
            console.error(error)
            toast.error('ページの抽出に失敗しました')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSplitAll = async (saveToWorkspace = false) => {
        if (!file) return
        setIsProcessing(true)
        try {
            const fileBuffer = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(fileBuffer)
            const zip = new JSZip()

            for (let i = 0; i < pdfDoc.getPageCount(); i++) {
                const newPdf = await PDFDocument.create()
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [i])
                newPdf.addPage(copiedPage)
                const pdfBytes = await newPdf.save()
                zip.file(`page - ${i + 1}.pdf`, pdfBytes)
            }

            const content = await zip.generateAsync({ type: 'blob' })

            if (saveToWorkspace) {
                await saveFileToWorkspace(content, 'split-pages.zip')
                toast.success('ワークスペースに保存しました')
            } else {
                downloadBlob(content, 'split-pages.zip', 'application/zip')
                toast.success('全ページが正常に分割されました！')
            }
        } catch (error) {
            console.error(error)
            toast.error('PDFの分割に失敗しました')
        } finally {
            setIsProcessing(false)
        }
    }

    const downloadBlob = (data: Uint8Array | Blob, filename: string, type: string) => {
        const blob = data instanceof Blob ? data : new Blob([data as any], { type })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">PDF分割</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    特定のページを抽出するか、ドキュメント全体を分割します。
                </p>
            </div>

            {!file ? (
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
                    <WorkspaceFilePicker
                        isOpen={isPickerOpen}
                        onClose={() => setIsPickerOpen(false)}
                        onFileSelect={(file) => handleUpload([file])}
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <Loader2 className={cn("w-6 h-6 text-red-500", isLoading && "animate-spin")} />
                            </div>
                            <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">{pageCount} ページ</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setFile(null)
                                setThumbnails([])
                                setSelectedPages(new Set())
                            }}
                            className="text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                            ファイルを変更
                        </button>
                    </div>

                    {isLoading && thumbnails.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {thumbnails.map((src, index) => (
                                <div
                                    key={index}
                                    onClick={() => togglePageSelection(index)}
                                    className={cn(
                                        "relative aspect-[1/1.4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                                        selectedPages.has(index)
                                            ? "border-blue-500 ring-2 ring-blue-500/20"
                                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                    )}
                                >
                                    <img src={src} alt={`Page ${index + 1} `} className="w-full h-full object-cover" />
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center transition-colors",
                                        selectedPages.has(index) ? "bg-blue-500/20" : "group-hover:bg-black/5"
                                    )}>
                                        <div className={cn(
                                            "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border transition-colors",
                                            selectedPages.has(index)
                                                ? "bg-blue-500 border-blue-500 text-white"
                                                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-transparent group-hover:text-gray-300"
                                        )}>
                                            <Check className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center">
                                        ページ {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 sticky bottom-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                        <button
                            onClick={() => handleSplitAll(true)} // Modified to save to workspace
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                        >
                            <HardDrive className="w-4 h-4" />
                            全ページを保存 (ZIP)
                        </button>
                        <button
                            onClick={() => handleSplitAll(false)} // Added for direct download
                            disabled={isProcessing}
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                        >
                            全ページをDL (ZIP)
                        </button>
                        <button
                            onClick={() => handleExtractSelected(true)} // Added for saving selected to workspace
                            disabled={isProcessing || selectedPages.size === 0}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-all",
                                isProcessing || selectedPages.size === 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
                            )}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <HardDrive className="w-4 h-4" />
                            )}
                            選択したページを保存 ({selectedPages.size})
                        </button>
                        <button
                            onClick={() => handleExtractSelected(false)} // Modified for direct download
                            disabled={isProcessing || selectedPages.size === 0}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-all",
                                isProcessing || selectedPages.size === 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
                            )}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            選択したページを抽出 ({selectedPages.size})
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
