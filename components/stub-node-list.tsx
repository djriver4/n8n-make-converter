"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, ExternalLink } from "lucide-react"
import { isStubNode, getStubInfo } from "@/lib/stubs/stub-generator"

type StubNodeListProps = {
  workflow: any
  platform: "n8n" | "make" | null
}

export function StubNodeList({ workflow, platform }: StubNodeListProps) {
  console.log("StubNodeList received workflow:", workflow)
  console.log("StubNodeList received platform:", platform)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [stubNodes, setStubNodes] = useState<any[]>([])

  useEffect(() => {
    const nodes = getStubNodes()
    setStubNodes(nodes)
    console.log("Stub nodes:", nodes) // Debug log
  }, [workflow, platform])

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }

  // Extract stub nodes from the workflow
  const getStubNodes = () => {
    if (!workflow || !platform) return []

    console.log("Workflow:", workflow) // Debug log
    console.log("Platform:", platform) // Debug log

    let nodes = []
    if (platform === "n8n") {
      nodes = workflow.nodes || []
    } else if (platform === "make") {
      nodes = workflow.flow || []
    }

    const stubs = nodes.filter((node: any) => isStubNode(node))
    console.log("Filtered stub nodes:", stubs) // Debug log
    return stubs
  }

  if (stubNodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stub Nodes</CardTitle>
          <CardDescription>No stub nodes found in this workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">All nodes were successfully mapped to the target platform.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stub Nodes</CardTitle>
        <CardDescription>
          {stubNodes.length === 0 ? "No stub nodes found in this workflow" : `${stubNodes.length} stub node(s) found`}
        </CardDescription>
        {/* Data for this panel is extracted from the 'workflow' prop */}
        <p className="text-sm text-muted-foreground mt-2">
          Stub node information is extracted from the converted workflow data passed to this component.
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {stubNodes.map((node: any, index: number) => {
              const stubInfo = getStubInfo(node)
              const nodeId = node.id || `stub-${index}`
              const isExpanded = expandedNodes[nodeId] || false

              return (
                <div
                  key={nodeId}
                  className="border border-orange-200 rounded-md overflow-hidden bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
                >
                  <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    onClick={() => toggleNode(nodeId)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                        STUB
                      </Badge>
                      <span className="font-medium">{platform === "n8n" ? node.name : `Module ${node.id}`}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>

                  {isExpanded && (
                    <div className="p-3 pt-0 border-t border-orange-200 dark:border-orange-800">
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Original Type</p>
                          <p className="font-mono">{stubInfo?.originalType || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Original ID</p>
                          <p className="font-mono">{stubInfo?.originalId || node.id}</p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 mb-3">
                        <p className="text-sm">{stubInfo?.note || "This node requires manual replacement."}</p>
                      </div>

                      <div className="flex justify-end">
                        {platform === "n8n" ? (
                          <Button variant="outline" size="sm" className="gap-1" asChild>
                            <a
                              href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.noop/"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                              n8n Documentation
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="gap-1" asChild>
                            <a href="https://www.make.com/en/help/modules" target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                              Make.com Documentation
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

