"use client"

import { FileUploader } from "@/components/file-uploader"
import { CodeEditor } from "@/components/code-editor"
import { FeatureHighlights } from "@/components/feature-highlights"
import { DevModeControls } from "@/components/dev-mode-controls"
import { registerPlugins } from "@/lib/plugins/register-plugins"
import { useWorkflowStore } from "@/lib/store/store"
import { FileManager } from "@/components/file-manager"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DebugPanel } from "@/components/debug-panel"
import { WorkflowAnalyzer } from "@/components/workflow-analyzer"
import { useState, useEffect } from "react"
import { isDevelopmentMode } from "@/lib/utils/environment"

// Define a simple interface for analysis results if we can't import it
interface AnalysisResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  issues: Array<{
    ruleId: string;
    ruleName: string;
    suggestion: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

// Register plugins on the client side
if (typeof window !== "undefined") {
  registerPlugins()
}

export default function Home() {
  const { sourceJson, convertedJson, parsedWorkflow, debugData, activeTab, setActiveTab, stubNodes } = useWorkflowStore()
  const showFeatures = !sourceJson && !convertedJson
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [sidebarTab, setSidebarTab] = useState<string>("fileManagement")
  const [isDevMode, setIsDevMode] = useState(false)

  // Check if in development mode on mount
  useEffect(() => {
    setIsDevMode(isDevelopmentMode())
  }, [])

  const handleAnalysisComplete = (results: AnalysisResult[]) => {
    setAnalysisResults(results)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Dev mode indicator - will be very obvious if changes are applied */}
        {isDevMode && (
          <div className="bg-amber-500 text-black p-4 mb-8 rounded-lg text-center text-lg font-bold">
            DEVELOPMENT MODE ACTIVE - Feature Flag Controls Enabled
          </div>
        )}

        <header className="mb-8 text-center relative">
          <div className="absolute right-0 top-0">
            <Link href="/settings">
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">n8n ↔ Make.com Converter</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-2">
            Convert workflows between n8n and Make.com platforms with precision and ease
          </p>
        </header>

        {/* Development Mode Controls - will only render in dev mode */}
        <div className="mb-8">
          <DevModeControls />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="fileManagement" value={sidebarTab} onValueChange={setSidebarTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fileManagement">Files</TabsTrigger>
                <TabsTrigger value="debug">Debug</TabsTrigger>
              </TabsList>
              <TabsContent value="fileManagement" className="space-y-4 mt-2">
                <FileUploader />
                <FileManager />
              </TabsContent>
              <TabsContent value="debug" className="space-y-4 mt-2">
                <DebugPanel debugData={debugData} />
              </TabsContent>
            </Tabs>
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

