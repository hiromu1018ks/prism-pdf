import { useState } from 'react'
import { FileUpload } from "../ui/FileUpload"
import { PDFDocument } from 'pdf-lib'
import { Loader2, Minimize2, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'

export function CompressFeature() {
    const [file, setFile] = useState<File | null>(null)
    const [isCompressing, setIsCompressing] = useState(false)
    const [result, setResult] = useState<{ size: number; url: string } | null>(null)

    const handleUpload = (files: File[]) => {
        if (files.length === 0) return
        setFile(files[0])
        setResult(null)
    }

    const handleCompress = async () => {
        if (!file) return
        setIsCompressing(true)
        try {
            const fileBuffer = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(fileBuffer)

            // pdf-lib automatically removes unused objects when saving
            // We can try to use object streams to compress
            const pdfBytes = await pdfDoc.save({ useObjectStreams: true })

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)

            setResult({
                size: blob.size,
                url
            })

            toast.success('PDFが正常に最適化されました！')
        } catch (error) {
            console.error(error)
            toast.error('PDFの最適化に失敗しました')
        } finally {
            setIsCompressing(false)
        }
    }

    const formatSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB'
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">PDF圧縮</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    PDFを最適化してファイルサイズを削減します。
                </p>
            </div>

            {!file ? (
                <FileUpload onUpload={handleUpload} />
            ) : (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <FileText className="w-8 h-8 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">{file.name}</h3>
                                    <p className="text-gray-500">元のサイズ: {formatSize(file.size)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setFile(null)
                                    setResult(null)
                                }}
                                className="text-sm text-red-500 hover:text-red-600"
                            >
                                ファイルを変更
                            </button>
                        </div>

                        {result ? (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-100 dark:border-green-900/30">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <Minimize2 className="w-5 h-5" />
                                        <span className="font-medium">最適化完了</span>
                                    </div>
                                    <div className="text-sm font-medium text-green-700 dark:text-green-400">
                                        {formatSize(result.size)}
                                        <span className="ml-2 text-xs opacity-75">
                                            ({Math.round((1 - result.size / file.size) * 100)}% 削減)
                                        </span>
                                    </div>
                                </div>

                                <a
                                    href={result.url}
                                    download={`optimized-${file.name}`}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    最適化されたPDFをダウンロード
                                </a>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <button
                                    onClick={handleCompress}
                                    disabled={isCompressing}
                                    className={cn(
                                        "flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white transition-all shadow-lg",
                                        isCompressing
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30"
                                    )}
                                >
                                    {isCompressing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            最適化中...
                                        </>
                                    ) : (
                                        <>
                                            <Minimize2 className="w-5 h-5" />
                                            PDFを最適化
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
