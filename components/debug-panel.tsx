"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, X, AlertTriangle, ChevronRight, AlertCircle, Info } from "lucide-react"
import { getPluginRegistry } from "@/lib/plugin-registry"
import { ReactNode } from "react"

// Define more specific types for debug data
interface NodeMappingDetail {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  success: boolean;
  isStub: boolean;
  mappingStatus: 'full' | 'partial' | 'failed' | 'stub';
  warnings: string[];
  parameterMappings: {
    source: string;
    target: string;
    success: boolean;
  }[];
  unmappedParameters: string[];
  pluginSource?: string;
}

interface DebugSummary {
  nodeCount: number;
  successfulNodes: number;
  partialNodes: number;
  failedNodes: number;
  stubNodes: number;
  warningCount: number;
  unmappedParamsCount: number;
  successRate: number;
  conversionTime?: number;
  pluginUsage?: Record<string, number>;
}

interface ConversionLog {
  type: 'info' | 'warning' | 'error';
  message: string;
}

interface DebugData {
  summary: DebugSummary;
  nodes: Record<string, NodeMappingDetail>;
  logs: ConversionLog[];
}

type DebugPanelProps = {
  debugData: DebugData | null;
}

export function DebugPanel({ debugData }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState("summary")

  if (!debugData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No debug data available. Run a conversion to see detailed information.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { summary, nodes, logs } = debugData

  return (
    <Card className="w-full max-h-[90vh] overflow-auto">
      <CardHeader className="sticky top-0 bg-card z-10">
        <CardTitle className="flex items-center justify-between">
          <span>Conversion Debug</span>
          <Badge variant={summary.successRate > 80 ? "default" : summary.successRate > 50 ? "warning" : "destructive"}>
            {summary.successRate}% Success Rate
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-10">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="nodes">Node Mappings</TabsTrigger>
              <TabsTrigger value="plugins">Plugins</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="summary" className="flex-1 overflow-auto">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Conversion Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Nodes Processed</div>
                    <div className="text-2xl font-bold">{summary.nodeCount}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <div className="text-2xl font-bold">{summary.successRate}%</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Successful Nodes</div>
                    <div className="text-2xl font-bold text-green-600">{summary.successfulNodes}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Partial Mappings</div>
                    <div className="text-2xl font-bold text-amber-600">{summary.partialNodes}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <div className="text-sm text-muted-foreground">Failed Mappings</div>
                    <div className="text-2xl font-bold text-red-600">{summary.failedNodes || 0}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md col-span-2">
                    <div className="text-sm text-muted-foreground">Stub Nodes Created</div>
                    <div className="text-2xl font-bold text-orange-600">{summary.stubNodes || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Stub nodes require manual replacement with appropriate nodes in the target platform
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Conversion Quality</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Node Mapping Success</span>
                      <span className="text-sm font-medium">{summary.successRate}%</span>
                    </div>
                    <Progress value={summary.successRate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Parameter Mapping</span>
                      <span className="text-sm font-medium">
                        {summary.unmappedParamsCount > 0
                          ? `${summary.unmappedParamsCount} unmapped parameters`
                          : "All parameters mapped"}
                      </span>
                    </div>
                    <Progress
                      value={
                        summary.unmappedParamsCount > 0
                          ? 100 - (summary.unmappedParamsCount / (summary.nodeCount * 5)) * 100
                          : 100
                      }
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Warnings</span>
                      <span className="text-sm font-medium">
                        {summary.warningCount} {summary.warningCount === 1 ? "warning" : "warnings"}
                      </span>
                    </div>
                    <Progress
                      value={summary.warningCount > 0 ? 100 - (summary.warningCount / summary.nodeCount) * 100 : 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>

              {summary.conversionTime && (
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                  <div className="text-sm text-muted-foreground">Conversion Time</div>
                  <div className="text-2xl font-bold">{(summary.conversionTime / 1000).toFixed(2)}s</div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="nodes" className="p-4 overflow-auto max-h-[500px]">
            <Accordion type="multiple" className="space-y-2">
              {Object.values(nodes).map((node: NodeMappingDetail) => (
                <AccordionItem
                  key={node.sourceId}
                  value={node.sourceId}
                  className={`border rounded-md ${
                    node.mappingStatus === "stub"
                      ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-900/20"
                      : node.mappingStatus === "full"
                        ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                        : node.mappingStatus === "partial"
                          ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20"
                          : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
                  }`}
                >
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      {node.mappingStatus === "stub" ? (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      ) : node.mappingStatus === "full" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : node.mappingStatus === "partial" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{node.sourceName}</span>
                      <span className="text-sm text-muted-foreground">{node.sourceType}</span>
                      {node.targetType && (
                        <>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{node.targetType}</span>
                          {node.mappingStatus === "stub" && (
                            <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-200">
                              STUB
                            </Badge>
                          )}
                          {node.mappingStatus === "partial" && (
                            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                              PARTIAL
                            </Badge>
                          )}
                        </>
                      )}
                      {node.pluginSource && (
                        <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                          {node.pluginSource}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3 pt-1">
                    {node.warnings.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-1">Warnings</h4>
                        <ul className="text-sm space-y-1">
                          {node.warnings.map((warning: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <h4 className="text-sm font-medium mb-1">Parameter Mappings</h4>
                    <div className="space-y-1">
                      {node.parameterMappings.length > 0 ? (
                        node.parameterMappings.map((param: { source: string; target: string; success: boolean }, i: number) => (
                          <div key={i} className="text-sm flex items-start gap-2">
                            {param.success ? (
                              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{param.source}</span>
                                {param.target && (
                                  <>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <span>{param.target}</span>
                                  </>
                                )}
                              </div>
                              {param.reason && <p className="text-xs text-muted-foreground">{param.reason}</p>}
                              {param.value && typeof param.value === "string" && (
                                <p className="text-xs text-muted-foreground truncate max-w-md">Value: {param.value}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No parameter mappings found</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="plugins" className="p-4 overflow-auto max-h-[500px]">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Plugin Usage</h3>

              {summary.pluginUsage && Object.keys(summary.pluginUsage).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(summary.pluginUsage).map(([plugin, count]) => (
                    <div key={plugin} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{plugin}</div>
                          <div className="text-sm text-muted-foreground">
                            Used for {count} {count === 1 ? "node" : "nodes"}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          {String(count)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No plugins were used in this conversion.</p>
              )}

              <div className="mt-4">
                <h3 className="text-lg font-medium">Available Plugins</h3>
                <div className="mt-2 space-y-2">
                  {getPluginRegistry()
                    .getAllPlugins()
                    .map((plugin) => (
                      <div key={plugin.id} className="border p-3 rounded-md">
                        <div className="font-medium">{plugin.name}</div>
                        <div className="text-sm text-muted-foreground">{plugin.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">Version: {plugin.version}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="p-4 overflow-auto max-h-[500px]">
            <div className="space-y-2">
              {logs.map((log: ConversionLog, index: number) => (
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
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : log.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

