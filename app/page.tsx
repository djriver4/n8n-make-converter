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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DebugPanel } from "@/components/debug-panel"
import { WorkflowAnalyzer } from "@/components/workflow-analyzer"
import { useState } from "react"

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

  const handleAnalysisComplete = (results: AnalysisResult[]) => {
    setAnalysisResults(results)
  }

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

