"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { CoverageValidator, type CoverageResult } from "@/lib/testing/coverage-validator"

export function CoverageDisplay() {
  const [n8nCoverage, setN8nCoverage] = useState<CoverageResult | null>(null)
  const [makeCoverage, setMakeCoverage] = useState<CoverageResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("n8n")
  const [testResults, setTestResults] = useState<any>(null)
  const [isTestRunning, setIsTestRunning] = useState(false)

  // Run coverage validation
  const runCoverageValidation = async () => {
    setIsLoading(true)
    try {
      const n8nResult = await CoverageValidator.validateN8nCoverage()
      const makeResult = await CoverageValidator.validateMakeCoverage()

      setN8nCoverage(n8nResult)
      setMakeCoverage(makeResult)
    } catch (error) {
      console.error("Error validating coverage:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Run test conversion
  const runTestConversion = async () => {
    setIsTestRunning(true)
    try {
      const results = await CoverageValidator.testConversion(activeTab === "n8n" ? "n8nToMake" : "makeToN8n")
      setTestResults(results)
    } catch (error) {
      console.error("Error running test conversion:", error)
    } finally {
      setIsTestRunning(false)
    }
  }

  // Run coverage validation on mount
  useEffect(() => {
    runCoverageValidation()
  }, [])

  const coverage = activeTab === "n8n" ? n8nCoverage : makeCoverage

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Node Mapping Coverage</CardTitle>
            <CardDescription>Check the coverage of node mappings between n8n and Make.com</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={runCoverageValidation} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="n8n">n8n → Make.com</TabsTrigger>
            <TabsTrigger value="make">Make.com → n8n</TabsTrigger>
          </TabsList>

          <TabsContent value="n8n">
            {n8nCoverage ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">n8n Node Coverage</h3>
                    <p className="text-sm text-muted-foreground">
                      {n8nCoverage.mappedNodeTypes} of {n8nCoverage.totalNodeTypes} common node types are mapped
                    </p>
                  </div>
                  <Badge
                    variant={n8nCoverage.coveragePercentage > 80 ? "default" : "warning"}
                    className="text-lg px-3 py-1"
                  >
                    {n8nCoverage.coveragePercentage}%
                  </Badge>
                </div>

                <Progress value={n8nCoverage.coveragePercentage} className="h-2" />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Mapped Node Types
                    </h4>
                    <p className="text-2xl font-bold">{n8nCoverage.mappedNodeTypes}</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Unmapped Node Types
                    </h4>
                    <p className="text-2xl font-bold">{n8nCoverage.unmappedNodeTypes}</p>
                  </div>
                </div>

                {n8nCoverage.unmappedNodes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Unmapped Node Types</h4>
                    <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                      <ul className="list-disc pl-5 space-y-1">
                        {n8nCoverage.unmappedNodes.map((node) => (
                          <li key={node} className="text-sm">
                            {node}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button onClick={runTestConversion} disabled={isTestRunning}>
                    {isTestRunning ? "Running Test..." : "Run Test Conversion"}
                  </Button>

                  {testResults && (
                    <div className="mt-4 border rounded-md p-4">
                      <h4 className="font-medium mb-2">Test Results</h4>
                      <pre className="text-xs overflow-auto bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                        {JSON.stringify(testResults, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading coverage data...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="make">
            {makeCoverage ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Make.com Module Coverage</h3>
                    <p className="text-sm text-muted-foreground">
                      {makeCoverage.mappedNodeTypes} of {makeCoverage.totalNodeTypes} common module types are mapped
                    </p>
                  </div>
                  <Badge
                    variant={makeCoverage.coveragePercentage > 80 ? "default" : "warning"}
                    className="text-lg px-3 py-1"
                  >
                    {makeCoverage.coveragePercentage}%
                  </Badge>
                </div>

                <Progress value={makeCoverage.coveragePercentage} className="h-2" />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Mapped Module Types
                    </h4>
                    <p className="text-2xl font-bold">{makeCoverage.mappedNodeTypes}</p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Unmapped Module Types
                    </h4>
                    <p className="text-2xl font-bold">{makeCoverage.unmappedNodeTypes}</p>
                  </div>
                </div>

                {makeCoverage.unmappedNodes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Unmapped Module Types</h4>
                    <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                      <ul className="list-disc pl-5 space-y-1">
                        {makeCoverage.unmappedNodes.map((node) => (
                          <li key={node} className="text-sm">
                            {node}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button onClick={runTestConversion} disabled={isTestRunning}>
                    {isTestRunning ? "Running Test..." : "Run Test Conversion"}
                  </Button>

                  {testResults && (
                    <div className="mt-4 border rounded-md p-4">
                      <h4 className="font-medium mb-2">Test Results</h4>
                      <pre className="text-xs overflow-auto bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                        {JSON.stringify(testResults, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading coverage data...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

