import { FileList } from "../workspace/FileList"

export function WorkspaceFeature() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">ワークスペース</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    保存されたファイルを管理します。
                </p>
            </div>

            <FileList />
        </div>
    )
}
