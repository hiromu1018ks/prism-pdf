import { ThemeToggle } from "../ui/ThemeToggle"
import { Toaster } from "sonner"

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        Prism PDF
                    </h1>
                    <ThemeToggle />
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
            <Toaster />
        </div>
    )
}
