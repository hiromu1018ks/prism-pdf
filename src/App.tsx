import { useState } from "react"
import { Layout } from "./components/layout/Layout"
import { MergeFeature } from "./components/features/MergeFeature"
import { SplitFeature } from "./components/features/SplitFeature"
import { ReorderFeature } from "./components/features/ReorderFeature"
import { CompressFeature } from "./components/features/CompressFeature"
import { cn } from "./lib/utils"
import { Files, Scissors, Grid, Minimize2 } from "lucide-react"

type Feature = "merge" | "split" | "reorder" | "compress"

export default function App() {
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null)

  const features = [
    { id: "merge", name: "結合", icon: Files, component: MergeFeature },
    { id: "split", name: "分割", icon: Scissors, component: SplitFeature },
    { id: "reorder", name: "並べ替え", icon: Grid, component: ReorderFeature },
    { id: "compress", name: "圧縮", icon: Minimize2, component: CompressFeature },
  ] as const

  return (
    <Layout>
      {activeFeature ? (
        <div className="space-y-6">
          <button
            onClick={() => setActiveFeature(null)}
            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
          >
            ← メニューに戻る
          </button>
          {features.map((feature) => {
            if (feature.id === activeFeature) {
              const Component = feature.component
              return <Component key={feature.id} />
            }
            return null
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              あなたのローカルPDFパートナー
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              セキュアにPDFの結合、分割、並べ替え、圧縮をブラウザ上で実行します。
              ファイルがデバイスから外部に送信されることはありません。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200",
                  "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50",
                  "hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-1",
                  "group"
                )}
              >
                <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">{feature.name}</h3>
              </button>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
