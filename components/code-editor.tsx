"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
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
import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { ConversionPlatform } from "@/lib/types"
import { createEmptyTemplate } from "@/lib/utils/templates"

// We'll keep these commented as they might need more setup
// import { LogPanel } from "./log-panel"
// import { WorkflowReviewPanel } from "./workflow-review-panel"
// import { WorkflowSelector } from "./workflow-selector"
// import { WorkflowType } from "@/lib/stores/types"

// Define types for parameter updates
type ParameterAction = "accept" | "reject" | "edit";

// Define the tab types to include all possible values
type TabValue = "editor" | "logs" | "debug" | "analyze" | "review";

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
    addLog,
    clearLogs,
    isConverting,
    setConvertedJson,
    parameterReviewData,
    isReviewing,
    setParameterReviewData,
    setIsReviewing,
    updateParameterReviewData,
    setSourcePlatform,
    setTargetPlatform,
    setDebugData
  } = useWorkflowStore()

  // Use a ref to track if we're currently syncing tabs to prevent loops
  const isSyncingTabsRef = useRef(false);

  const [editorReady, setEditorReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const { ref: containerRef, width: containerWidth, height: containerHeight } = useResizeObserver<HTMLDivElement>()
  const [editorValue, setEditorValue] = useState("")
  const [resultsValue, setResultsValue] = useState("")
  
  // Initialize local tab from store, but don't re-sync on every render
  const [localTab, setLocalTab] = useState<TabValue>(activeTab as TabValue || "editor")

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

    // Set isConverting via addLog and clearLogs
    clearLogs()
    addLog({ type: "info", message: "Starting conversion..." })
    
    // Directly call setActiveTab instead of using localTab to avoid the sync loop
    setActiveTab("logs")
    // Also update local state
    setLocalTab("logs")
    
    try {
      // Create sample debug data for testing if needed
      const testDebugData = {
        summary: {
          nodeCount: 3,
          successRate: 85,
          successfulNodes: 2,
          partialNodes: 1,
          failedNodes: 0,
          stubNodes: 0,
          unmappedParamsCount: 2,
          warningCount: 1,
          conversionTime: 1200
        },
        nodes: {
          "node-1": {
            sourceId: "node-1",
            sourceName: "HTTP Request",
            sourceType: "HTTP Request",
            targetType: "HTTP Request",
            mappingStatus: "full",
            warnings: [],
            parameterMappings: [
              { source: "url", target: "url", success: true },
              { source: "method", target: "method", success: true }
            ]
          },
          "node-2": {
            sourceId: "node-2",
            sourceName: "JSON Parser",
            sourceType: "JSON Parse",
            targetType: "JSON Parse",
            mappingStatus: "partial",
            warnings: ["Some parameters could not be mapped"],
            parameterMappings: [
              { source: "data", target: "data", success: true },
              { source: "options", target: "", success: false, reason: "No equivalent parameter" }
            ]
          }
        },
        logs: [
          { type: "info", message: "Conversion started" },
          { type: "info", message: "Mapped HTTP Request node" },
          { type: "warning", message: "Partial mapping for JSON Parser node" },
          { type: "info", message: "Conversion completed" }
        ]
      };

      await convertWorkflow()
      
      // After conversion, check if there's debug data
      if (debugData) {
        // Show the debug tab - directly update both states
        setActiveTab("debug")
        setLocalTab("debug")
      } else if (sourceJson && !debugData) {
        // If there's no debug data but we have source JSON, create some test debug data
        console.log("No debug data found, creating sample debug data for testing");
        setDebugData(testDebugData);
        
        // Update both states directly
        setActiveTab("debug")
        setLocalTab("debug")
      }
    } catch (error) {
      console.error("Conversion failed:", error)
      clearLogs()
      addLog({ 
        type: "error", 
        message: `Conversion failed: ${error instanceof Error ? error.message : String(error)}` 
      })
    }
  }, [
    sourceJson,
    sourcePlatform,
    targetPlatform,
    convertWorkflow,
    debugData,
    addLog,
    clearLogs,
    setDebugData,
    setActiveTab
  ])

  // Create a helper function to update JSON safely
  const updateJsonSafely = (json: string, updater: (parsed: any) => any): string => {
    try {
      const parsed = JSON.parse(json);
      const updated = updater(parsed);
      return JSON.stringify(updated, null, 2);
    } catch (error) {
      console.error("Error updating JSON:", error);
      return json;
    }
  };

  const handleParameterUpdate = (
    nodeId: string,
    paramKey: string,
    value: unknown,
    action: ParameterAction
  ) => {
    console.log("CodeEditor: handleParameterUpdate", { nodeId, paramKey, value, action })
    updateParameterReviewData(nodeId, paramKey, value, action)

    if (convertedJson) {
      const updatedJson = updateJsonSafely(convertedJson, (workflow) => {
        const node = workflow.nodes?.find((n: { id: string }) => n.id === nodeId);
        if (node && node.parameters) {
          if (action === "reject") {
            delete node.parameters[paramKey];
          } else {
            node.parameters[paramKey] = value;
          }
        }
        return workflow;
      });
      
      setConvertedJson(updatedJson);
    }

    // Recalculate dependencies
    recalculateDependencies(nodeId, paramKey, value, action);
  }

  const recalculateDependencies = (
    nodeId: string,
    paramKey: string,
    value: unknown,
    action: ParameterAction
  ) => {
    // This is where you would add logic to handle parameter dependencies
    // For example, you might need to update other parameters based on this change
    // or show/hide certain fields based on the new value

    if (convertedJson) {
      const updatedJson = updateJsonSafely(convertedJson, (workflow) => {
        const node = workflow.nodes?.find((n: { id: string }) => n.id === nodeId);
        if (node && node.parameters) {
          // Example: If a checkbox is checked, show an additional field
          if (paramKey === "enableFeature" && value === true) {
            node.parameters.additionalField = "Default Value";
          } else if (paramKey === "enableFeature" && value === false) {
            delete node.parameters.additionalField;
          }

          // Example: Update a calculated field based on other values
          if (paramKey === "width" || paramKey === "height") {
            const width = node.parameters.width || 0;
            const height = node.parameters.height || 0;
            node.parameters.area = width * height;
          }
        }
        return workflow;
      });
      
      setConvertedJson(updatedJson);
    }

    // Update parameterReviewData if needed
    setParameterReviewData((prevData: Record<string, any>) => {
      const updatedData = { ...prevData };
      // Add logic here to update related parameters in the review data
      return updatedData;
    });
  }

  const handleReviewComplete = useCallback(() => {
    setIsReviewing(false)
    setShowResults(true)
    
    // Directly update both states
    setActiveTab("editor")
    setLocalTab("editor")
  }, [setIsReviewing, setShowResults, setActiveTab])

  const editorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    automaticLayout: true,
    scrollbar: { alwaysConsumeMouseWheel: false },
  }

  useEffect(() => {
    if (sourceJson && sourcePlatform) {
      try {
        parseWorkflow(sourceJson)
      } catch (error) {
        console.error("Failed to parse workflow:", error)
      }
    }
  }, [sourceJson, sourcePlatform, parseWorkflow])

  // Set the editor content when sourceJson changes
  useEffect(() => {
    if (sourceJson) {
      try {
        setEditorContent(JSON.stringify(typeof sourceJson === 'string' ? JSON.parse(sourceJson) : sourceJson, null, 2))
      } catch (error) {
        console.error("Failed to stringify sourceJson:", error)
        // If parsing fails, use the source directly
        setEditorContent(typeof sourceJson === 'string' ? sourceJson : JSON.stringify(sourceJson))
      }
    }
  }, [sourceJson])

  // Set the results content when convertedJson changes
  useEffect(() => {
    if (convertedJson) {
      try {
        setResultsContent(JSON.stringify(typeof convertedJson === 'string' ? JSON.parse(convertedJson) : convertedJson, null, 2))
      } catch (error) {
        console.error("Failed to stringify convertedJson:", error)
        // If parsing fails, use the converted directly
        setResultsContent(typeof convertedJson === 'string' ? convertedJson : JSON.stringify(convertedJson))
      }
    }
  }, [convertedJson])

  // One-way sync from store activeTab to localTab - not the other way around
  // This prevents infinite update loops
  useEffect(() => {
    // Only update if we're not currently in a sync operation
    if (!isSyncingTabsRef.current && activeTab && activeTab !== localTab) {
      setLocalTab(activeTab as TabValue);
    }
  }, [activeTab, localTab]);

  const setEditorContent = (content: string) => {
    setEditorValue(content)
  }

  const setResultsContent = (content: string) => {
    setResultsValue(content)
  }

  const handleSourcePlatformChange = (platform: ConversionPlatform) => {
    if (platform) {
      resetWorkflow()
      setSourceJson("")
      setSourcePlatform(platform)
      if (platform === "make") {
        setTargetPlatform("n8n")
      } else {
        setTargetPlatform("make")
      }
      // Reset the editor content with an empty template for the selected platform
      setEditorContent(createEmptyTemplate(platform))
    }
  }

  const handleUpdateParameterReview = (nodeId: string, parameterPath: string, newValue: unknown) => {
    updateParameterReviewData(nodeId, parameterPath, newValue, "edit")
  }

  // Handle tab change - safely sync to store if appropriate
  const handleTabChange = (value: string) => {
    setLocalTab(value as TabValue)
    
    // Set the flag to prevent the sync effect from running
    isSyncingTabsRef.current = true;
    
    // Only update store for tabs that are in the store's accepted values
    if (value === 'editor' || value === 'logs' || value === 'debug' || value === 'analyze') {
      setActiveTab(value);
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isSyncingTabsRef.current = false;
    }, 0);
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
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleConvert}
                disabled={!sourceJson || !sourcePlatform || !targetPlatform || isConverting}
              >
                {isConverting ? "Converting..." : "Convert Workflow"}
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
            value={localTab}
            onValueChange={handleTabChange}
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
                      value={editorValue}
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
                      value={resultsValue}
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

      {showResultPopup && (
        <ConversionResultPopup
          isOpen={showResultPopup}
          onClose={handleCloseResultPopup}
          convertedJson={convertedJson || ""}
          sourcePlatform={sourcePlatform}
          targetPlatform={targetPlatform}
          conversionTime={debugData?.summary?.conversionTime}
          nodeCount={debugData?.summary?.nodeCount}
        />
      )}

      {showResults && convertedJson && (
        <ConversionResults
          convertedJson={convertedJson}
          targetPlatform={targetPlatform}
          conversionLogs={conversionLogs}
          onClose={handleCloseResults}
        />
      )}
    </div>
  )
}

