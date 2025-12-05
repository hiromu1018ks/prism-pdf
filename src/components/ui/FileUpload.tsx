import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File as FileIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FileUploadProps {
    onUpload: (files: File[]) => void
    className?: string
}

export function FileUpload({ onUpload, className }: FileUploadProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onUpload(acceptedFiles)
        }
    }, [onUpload])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        multiple: true
    })

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ease-in-out",
                isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                    : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                className
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
                <div className={cn(
                    "p-4 rounded-full transition-colors",
                    isDragActive ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-800"
                )}>
                    {isDragActive ? (
                        <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <FileIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {isDragActive ? "PDFをドロップ" : "PDFをドラッグ＆ドロップ"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        またはクリックしてファイルを選択
                    </p>
                </div>
            </div>
        </div>
    )
}
