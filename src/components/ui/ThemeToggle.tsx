import { Moon, Sun } from "lucide-react"
import { useTheme } from "../../lib/useTheme"
import { cn } from "../../lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
                "p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                className
            )}
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            ) : (
                <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            )}
        </button>
    )
}
