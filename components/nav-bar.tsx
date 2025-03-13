"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Settings, Home } from "lucide-react"

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold text-lg">
              n8n ⟷ Make.com
            </Link>

            <div className="flex items-center gap-1">
              <Link href="/">
                <Button variant={pathname === "/" ? "default" : "ghost"} size="sm" className="gap-1">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
              <Link href="/advanced">
                <Button variant={pathname === "/advanced" ? "default" : "ghost"} size="sm" className="gap-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Advanced</span>
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <a href="https://github.com/yourusername/n8n-make-converter" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

