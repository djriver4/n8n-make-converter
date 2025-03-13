"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AlertCircle, AlertTriangle, Info, ChevronRight, ChevronDown } from "lucide-react"
import { NodeAnalyzer, type NodeAnalysisResult } from "@/lib/rule-engine/node-analyzer"
import { useWorkflowStore } from "@/lib/store/store"
import { hasCredentials } from "@/lib/security/credential-handler"

type WorkflowAnalyzerProps = {
  workflow?: any
  onAnalysisComplete?: (results: NodeAnalysisResult[]) => void
}

export function WorkflowAnalyzer({ workflow, onAnalysisComplete }: WorkflowAnalyzerProps) {
  const [analysisResults, setAnalysisResults] = useState<NodeAnalysisResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({})
  const [securityWarning, setSecurityWarning] = useState<string | null>(null)

  // Get workflow from store if not provided as prop
  const { parsedWorkflow } = useWorkflowStore()
  const workflowToAnalyze = workflow || parsedWorkflow

  // Count issues by severity
  const errorCount = analysisResults.reduce(
    (count, node) => count + node.issues.filter((issue) => issue.severity === "error").length,
    0,
  )

  const warningCount = analysisResults.reduce(
    (count, node) => count + node.issues.filter((issue) => issue.severity === "warning").length,
    0,
  )

  const infoCount = analysisResults.reduce(
    (count, node) => count + node.issues.filter((issue) => issue.severity === "info").length,
    0,
  )

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setOpenNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }

  // Run analysis
  const runAnalysis = () => {
    if (!workflowToAnalyze) {
      setAnalysisResults([])
      setSecurityWarning(null)
      return
    }

    setIsAnalyzing(true)

    try {
      // Determine workflow type
      let workflowType = "Unknown";
      if (workflowToAnalyze.nodes && Array.isArray(workflowToAnalyze.nodes)) {
        workflowType = "n8n";
      } else if (workflowToAnalyze.flow && Array.isArray(workflowToAnalyze.flow)) {
        workflowType = "Make.com";
      }

      // Create analyzer with default rules
      const analyzer = new NodeAnalyzer()

      // Run analysis
      const results = analyzer.analyzeWorkflow(workflowToAnalyze)

      // Add workflow type info
      if (results.length === 0) {
        setAnalysisResults([{
          nodeId: "workflow-info",
          nodeName: "Workflow Info",
          nodeType: workflowType,
          issues: [{
            ruleId: "workflow-type",
            ruleName: "Workflow Type",
            suggestion: `This is a ${workflowType} workflow ${workflowType === "Unknown" ? "(no nodes detected)" : ""}`,
            severity: "info"
          }]
        }]);
      } else {
        // Filter out nodes with no issues
        const filteredResults = results.filter((result) => result.issues.length > 0)
        setAnalysisResults(filteredResults)
      }

      // Check for credentials
      if (hasCredentials(workflowToAnalyze)) {
        setSecurityWarning(
          "This workflow contains credentials that will be sanitized during conversion. You will need to reconfigure credentials in the target platform.",
        )
      } else {
        setSecurityWarning(null)
      }
    } catch (error) {
      console.error("Error analyzing workflow:", error);
      setAnalysisResults([{
        nodeId: "error",
        nodeName: "Analysis Error",
        nodeType: "error",
        issues: [{
          ruleId: "analysis-error",
          ruleName: "Analysis Error",
          suggestion: `An error occurred while analyzing the workflow: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error"
        }]
      }]);
    } finally {
      setIsAnalyzing(false)

      // Initialize open state for nodes with issues
      const initialOpenState: Record<string, boolean> = {}
      setAnalysisResults(prevResults => {
        prevResults.forEach((result) => {
          initialOpenState[result.nodeId] = true
        })
        
        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(prevResults)
        }
        
        return prevResults
      })
      
      setOpenNodes(initialOpenState)
    }
  }

  // Run analysis when workflow changes
  useEffect(() => {
    if (workflowToAnalyze) {
      runAnalysis()
    }
  }, [workflowToAnalyze])

  // Get icon for severity
  const getSeverityIcon = (severity: "info" | "warning" | "error") => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  // Get color for severity
  const getSeverityColor = (severity: "info" | "warning" | "error") => {
    switch (severity) {
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
      case "warning":
        return "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
      case "info":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
    }
  }

  return (
    <div className="h-full flex flex-col p-4 bg-background">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Workflow Analysis</h3>
          <p className="text-sm text-muted-foreground">Analyze your workflow for potential conversion issues</p>
        </div>
        <div className="flex gap-2 items-center">
          {analysisResults.length > 0 && (
            <div className="flex gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} {errorCount === 1 ? "Error" : "Errors"}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                  {warningCount} {warningCount === 1 ? "Warning" : "Warnings"}
                </Badge>
              )}
              {infoCount > 0 && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
                  {infoCount} {infoCount === 1 ? "Info" : "Infos"}
                </Badge>
              )}
            </div>
          )}
          <Button size="sm" onClick={runAnalysis} disabled={isAnalyzing || !workflowToAnalyze}>
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="h-full">
          {securityWarning && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Security Warning</AlertTitle>
              <AlertDescription>{securityWarning}</AlertDescription>
            </Alert>
          )}

          {analysisResults.length > 0 ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {analysisResults.map((result) => (
                  <Collapsible
                    key={result.nodeId}
                    open={openNodes[result.nodeId]}
                    onOpenChange={() => toggleNode(result.nodeId)}
                    className="border rounded-md overflow-hidden"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {result.nodeType.split(".").pop()}
                        </Badge>
                        <span className="font-medium">{result.nodeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {result.issues.some((issue) => issue.severity === "error") && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {result.issues.some((issue) => issue.severity === "warning") && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          {result.issues.some((issue) => issue.severity === "info") && (
                            <Info className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        {openNodes[result.nodeId] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-0 space-y-2">
                        {result.issues.map((issue, index) => (
                          <Alert key={index} className={getSeverityColor(issue.severity)}>
                            <div className="flex gap-2">
                              {getSeverityIcon(issue.severity)}
                              <div>
                                <AlertTitle>{issue.ruleName}</AlertTitle>
                                <AlertDescription>{issue.suggestion}</AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                {isAnalyzing ? (
                  <p>Analyzing workflow...</p>
                ) : workflowToAnalyze ? (
                  <p>No issues detected in your workflow.</p>
                ) : (
                  <p>Upload or paste a workflow to analyze potential conversion issues.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

