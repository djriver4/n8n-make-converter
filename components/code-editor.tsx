"use client"

import { useCallback, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Code, Download, Copy, Check, AlertTriangle, RefreshCw } from "lucide-react"
import { ConversionResults } from "./conversion-results"
import { DebugPanel } from "./debug-panel"
import { WorkflowAnalyzer } from "./workflow-analyzer"
import { useWorkflowStore } from "@/lib/store/store"
import { useResizeObserver } from "@/hooks/use-resize-observer"
import dynamic from "next/dynamic"
import { ConversionResultPopup } from "./conversion-result-popup"
import { ParameterReview } from "./parameter-review"

// Dynamically import the Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400">Loading editor...</div>
  ),
})

export function CodeEditor() {
  const {
    sourceJson,
    convertedJson,
    sourcePlatform,
    targetPlatform,
    conversionLogs,
    debugData,
    showResults,
    activeTab,
    parsedWorkflow,
    setSourceJson,
    setActiveTab,
    setShowResults,
    resetWorkflow,
    parseWorkflow,
    convertWorkflow,
    settings,
    setConversionLogs,
    setIsConverting,
    setConvertedJson,
    parameterReviewData,
    isReviewing,
    setParameterReviewData,
    setIsReviewing,
    updateParameterReviewData,
  } = useWorkflowStore()

  const [editorReady, setEditorReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const { ref: containerRef, width: containerWidth, height: containerHeight } = useResizeObserver<HTMLDivElement>()

  const handleSourceEditorMount = useCallback((editor: any) => {
    setEditorReady(true)
  }, [])

  const handleSourceChange = useCallback(
    (value: string | undefined) => {
      if (!value) return
      setSourceJson(value)
      parseWorkflow(value)
    },
    [setSourceJson, parseWorkflow],
  )

  const handleCopy = useCallback(() => {
    if (!convertedJson) return
    navigator.clipboard
      .writeText(convertedJson)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => console.error("Failed to copy:", err))
  }, [convertedJson])

  const handleDownload = useCallback(() => {
    if (!convertedJson || !targetPlatform) return
    const blob = new Blob([convertedJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `converted-workflow-${targetPlatform}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [convertedJson, targetPlatform])

  const handleCloseResults = useCallback(() => {
    setShowResults(false)
  }, [setShowResults])

  const handleShowResultPopup = useCallback(() => {
    setShowResultPopup(true)
  }, [])

  const handleCloseResultPopup = useCallback(() => {
    setShowResultPopup(false)
  }, [])

  const handleConvert = useCallback(async () => {
    if (!sourceJson || !sourcePlatform || !targetPlatform) {
      console.error("Missing source JSON, source platform, or target platform")
      return
    }

    setIsConverting(true)
    setActiveTab("logs")

    try {
      const { convertedWorkflow, logs, parameterReviewData } = await convertWorkflow()

      setConversionLogs(logs)
      setParameterReviewData(parameterReviewData)
      setIsReviewing(Object.keys(parameterReviewData).length > 0)

      if (Object.keys(parameterReviewData).length > 0) {
        setActiveTab("review")
      } else {
        setShowResults(true)
      }

      setConvertedJson(JSON.stringify(convertedWorkflow, null, 2))
    } catch (error) {
      console.error("Conversion failed:", error)
      setConversionLogs([{ type: "error", message: `Conversion failed: ${error}` }])
    } finally {
      setIsConverting(false)
    }
  }, [
    sourceJson,
    sourcePlatform,
    targetPlatform,
    convertWorkflow,
    setConversionLogs,
    setIsConverting,
    setActiveTab,
    setParameterReviewData,
    setIsReviewing,
    setConvertedJson,
    setShowResults,
  ])

  const handleParameterUpdate = (
    nodeId: string,
    paramKey: string,
    value: any,
    action: "accept" | "reject" | "edit",
  ) => {
    console.log("CodeEditor: handleParameterUpdate", { nodeId, paramKey, value, action })
    updateParameterReviewData(nodeId, paramKey, value, action)

    setConvertedJson((prevJson) => {
      if (!prevJson) return prevJson
      try {
        const workflow = JSON.parse(prevJson)
        const node = workflow.nodes.find((n) => n.id === nodeId)
        if (node && node.parameters) {
          if (action === "reject") {
            delete node.parameters[paramKey]
          } else {
            node.parameters[paramKey] = value
          }
        }
        return JSON.stringify(workflow, null, 2)
      } catch (error) {
        console.error("Error updating parameter:", error)
        return prevJson
      }
    })

    // Recalculate dependencies
    recalculateDependencies(nodeId, paramKey, value, action)
  }

  const recalculateDependencies = (
    nodeId: string,
    paramKey: string,
    value: any,
    action: "accept" | "reject" | "edit",
  ) => {
    // This is where you would add logic to handle parameter dependencies
    // For example, you might need to update other parameters based on this change
    // or show/hide certain fields based on the new value

    setConvertedJson((prevJson) => {
      if (!prevJson) return prevJson
      try {
        const workflow = JSON.parse(prevJson)
        const node = workflow.nodes.find((n) => n.id === nodeId)
        if (node && node.parameters) {
          // Example: If a checkbox is checked, show an additional field
          if (paramKey === "enableFeature" && value === true) {
            node.parameters.additionalField = "Default Value"
          } else if (paramKey === "enableFeature" && value === false) {
            delete node.parameters.additionalField
          }

          // Example: Update a calculated field based on other values
          if (paramKey === "width" || paramKey === "height") {
            const width = node.parameters.width || 0
            const height = node.parameters.height || 0
            node.parameters.area = width * height
          }
        }
        return JSON.stringify(workflow, null, 2)
      } catch (error) {
        console.error("Error recalculating dependencies:", error)
        return prevJson
      }
    })

    // Update parameterReviewData if needed
    setParameterReviewData((prevData) => {
      const updatedData = { ...prevData }
      // Add logic here to update related parameters in the review data
      return updatedData
    })
  }

  const handleReviewComplete = useCallback(() => {
    setIsReviewing(false)
    setShowResults(true)
    setActiveTab("editor")
  }, [setIsReviewing, setShowResults, setActiveTab])

  const editorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    automaticLayout: true,
    scrollbar: { alwaysConsumeMouseWheel: false },
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      <Card className="flex-grow flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5" />
              Workflow Editor
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetWorkflow} title="Reset editor">
                <RefreshCw className="h-4 w-4" />
              </Button>
              {convertedJson && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {!showResults && (
                    <Button variant="default" size="sm" onClick={handleShowResultPopup}>
                      View Result JSON
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow flex flex-col overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "editor" | "logs" | "debug" | "analyze" | "review")}
            className="flex-grow flex flex-col overflow-hidden"
          >
            <TabsList className="flex-shrink-0 px-4 border-b">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="logs">Conversion Logs</TabsTrigger>
              <TabsTrigger value="debug">Debug</TabsTrigger>
              <TabsTrigger value="analyze">Analyze</TabsTrigger>
              {isReviewing && <TabsTrigger value="review">Parameter Review</TabsTrigger>}
            </TabsList>

            <TabsContent value="editor" className="flex-grow flex overflow-hidden m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full">
                <div className="border-r flex flex-col overflow-hidden">
                  <div className="p-2 bg-slate-800 text-slate-300 text-xs font-mono border-b flex justify-between items-center">
                    <span>{sourcePlatform ? `Source: ${sourcePlatform}` : "Source JSON"}</span>
                    {!editorReady && <span className="text-slate-400">Loading editor...</span>}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <MonacoEditor
                      height="100%"
                      language="json"
                      theme="vs-dark"
                      value={sourceJson}
                      options={editorOptions}
                      onChange={handleSourceChange}
                      onMount={handleSourceEditorMount}
                    />
                  </div>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <div className="p-2 bg-slate-800 text-slate-300 text-xs font-mono border-b">
                    {targetPlatform ? `Target: ${targetPlatform}` : "Converted JSON"}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <MonacoEditor
                      height="100%"
                      language="json"
                      theme="vs-dark"
                      value={convertedJson}
                      options={{ ...editorOptions, readOnly: true }}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="flex-grow overflow-auto m-0 p-4">
              {conversionLogs.length > 0 ? (
                <div className="space-y-2">
                  {conversionLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md text-sm flex items-start gap-2 ${
                        log.type === "error"
                          ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                          : log.type === "warning"
                            ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                            : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {log.type === "error" ? (
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : log.type === "warning" ? (
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Code className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No conversion logs yet. Convert a workflow to see logs.
                </div>
              )}
            </TabsContent>

            <TabsContent value="debug" className="flex-grow overflow-auto m-0">
              <DebugPanel debugData={debugData} />
            </TabsContent>

            <TabsContent value="analyze" className="flex-grow overflow-auto m-0">
              <WorkflowAnalyzer workflow={parsedWorkflow} />
            </TabsContent>

            <TabsContent value="review" className="flex-grow overflow-auto m-0">
              <ParameterReview
                parameterReviewData={parameterReviewData || {}}
                onParameterUpdate={handleParameterUpdate}
                onReviewComplete={handleReviewComplete}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConversionResultPopup
        isOpen={showResultPopup}
        onClose={handleCloseResultPopup}
        convertedJson={convertedJson}
        sourcePlatform={sourcePlatform}
        targetPlatform={targetPlatform}
        conversionTime={debugData?.summary?.conversionTime}
        nodeCount={debugData?.summary?.nodeCount}
      />

      {showResults && convertedJson && (
        <ConversionResults
          sourceJson={sourceJson}
          convertedJson={convertedJson}
          sourcePlatform={sourcePlatform}
          targetPlatform={targetPlatform}
          logs={conversionLogs}
          debugData={debugData}
          onClose={handleCloseResults}
        />
      )}
    </div>
  )
}

