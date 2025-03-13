"use client"

import { FileUploader } from "@/components/file-uploader"
import { CodeEditor } from "@/components/code-editor"
import { FeatureHighlights } from "@/components/feature-highlights"
import { registerPlugins } from "@/lib/plugins/register-plugins"
import { useWorkflowStore } from "@/lib/store/store"
import { FileManager } from "@/components/file-manager"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"

// Register plugins on the client side
if (typeof window !== "undefined") {
  registerPlugins()
}

export default function Home() {
  const { sourceJson, convertedJson } = useWorkflowStore()
  const showFeatures = !sourceJson && !convertedJson

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center relative">
          <div className="absolute right-0 top-0">
            <Link href="/settings">
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Automation Workflow Converter
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Seamlessly convert your automation workflows between n8n and Make.com with our powerful conversion tool.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <FileUploader />
            <FileManager />
          </div>
          <div className="lg:col-span-9">
            <div className="h-[70vh]">
              <CodeEditor />
            </div>
          </div>
        </div>

        <FeatureHighlights show={showFeatures} />
      </div>
    </main>
  )
}

