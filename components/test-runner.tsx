"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CheckCircle, XCircle, ChevronRight, ChevronDown, Play } from "lucide-react"
import { ConverterTester, type TestResult } from "@/lib/testing/converter-test"

export function TestRunner() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")
  const [openTests, setOpenTests] = useState<Record<string, boolean>>({})

  // Count test results
  const passedCount = testResults.filter((result) => result.passed).length
  const failedCount = testResults.filter((result) => !result.passed).length
  const totalCount = testResults.length
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0

  // Toggle test expansion
  const toggleTest = (testName: string) => {
    setOpenTests((prev) => ({
      ...prev,
      [testName]: !prev[testName],
    }))
  }

  // Run all tests
  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])

    try {
      const tester = new ConverterTester()
      const results = await tester.runAllTests()

      setTestResults(results)

      // Initialize open state for failed tests
      const initialOpenState: Record<string, boolean> = {}
      results.forEach((result) => {
        initialOpenState[result.testName] = !result.passed
      })
      setOpenTests(initialOpenState)
    } catch (error) {
      console.error("Error running tests:", error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Converter Tests</CardTitle>
            <CardDescription>Run tests to verify converter functionality</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {testResults.length > 0 && (
              <div className="flex gap-2">
                <Badge variant={passRate >= 80 ? "default" : "destructive"}>{passRate}% Pass Rate</Badge>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                  {passedCount} Passed
                </Badge>
                {failedCount > 0 && <Badge variant="destructive">{failedCount} Failed</Badge>}
              </div>
            )}
            <Button size="sm" onClick={runTests} disabled={isRunning}>
              {isRunning ? (
                "Running Tests..."
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Run Tests
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b px-4">
            <TabsList className="h-10">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Test Details</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="summary" className="p-4">
            {testResults.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Tests Run</div>
                    <div className="text-2xl font-bold">{totalCount}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Pass Rate</div>
                    <div className="text-2xl font-bold">{passRate}%</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Passed</div>
                    <div className="text-2xl font-bold text-green-600">{passedCount}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Failed</div>
                    <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  </div>
                </div>

                {failedCount > 0 && (
                  <Alert variant="destructive">
                    <AlertTitle>Failed Tests</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 mt-2">
                        {testResults
                          .filter((result) => !result.passed)
                          .map((result, index) => (
                            <li key={index}>
                              {result.testName} - {result.error || "Test failed"}
                            </li>
                          ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isRunning ? <p>Running tests...</p> : <p>No tests have been run yet. Click "Run Tests" to start.</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="p-4">
            {testResults.length > 0 ? (
              <ScrollArea className="h-[calc(100%-2rem)] pr-4">
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <Collapsible
                      key={index}
                      open={openTests[result.testName]}
                      onOpenChange={() => toggleTest(result.testName)}
                      className={`border rounded-md overflow-hidden ${
                        result.passed
                          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                          : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
                      }`}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left">
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">{result.testName}</span>
                        </div>
                        <div>
                          {openTests[result.testName] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 pt-0">
                          {result.error && (
                            <Alert variant="destructive" className="mb-3">
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>{result.error}</AlertDescription>
                            </Alert>
                          )}

                          {result.details && (
                            <div className="text-sm">
                              <div className="font-medium mb-1">Test Details:</div>
                              <pre className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md overflow-x-auto text-xs">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isRunning ? <p>Running tests...</p> : <p>No tests have been run yet. Click "Run Tests" to start.</p>}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

