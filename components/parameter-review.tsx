"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, X, Edit2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ParameterReviewProps {
  parameterReviewData: Record<string, any>
  onParameterUpdate: (nodeId: string, paramKey: string, value: any, action: "accept" | "reject" | "edit") => void
  onReviewComplete: () => void
}

export function ParameterReview({ parameterReviewData, onParameterUpdate, onReviewComplete }: ParameterReviewProps) {
  const [reviewedData, setReviewedData] = useState<Record<string, any>>({})
  const [editMode, setEditMode] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    console.log("ParameterReview: Received parameterReviewData", parameterReviewData)
    if (parameterReviewData && typeof parameterReviewData === "object") {
      setReviewedData(parameterReviewData)

      const initialEditMode = Object.keys(parameterReviewData).reduce((acc, nodeId) => {
        if (parameterReviewData[nodeId] && parameterReviewData[nodeId].questionableParameters) {
          acc[nodeId] = Object.keys(parameterReviewData[nodeId].questionableParameters).reduce((paramAcc, paramKey) => {
            paramAcc[paramKey] = false
            return paramAcc
          }, {})
        }
        return acc
      }, {})
      setEditMode(initialEditMode)
    }
  }, [parameterReviewData])

  const handleParameterChange = (nodeId: string, paramKey: string, value: any) => {
    console.log("ParameterReview: handleParameterChange", { nodeId, paramKey, value })
    setReviewedData((prevData) => ({
      ...prevData,
      [nodeId]: {
        ...prevData[nodeId],
        questionableParameters: {
          ...prevData[nodeId]?.questionableParameters,
          [paramKey]: {
            ...prevData[nodeId]?.questionableParameters?.[paramKey],
            value,
          },
        },
      },
    }))
  }

  const handleAcceptParameter = (nodeId: string, paramKey: string) => {
    console.log("ParameterReview: handleAcceptParameter", { nodeId, paramKey })
    const value = reviewedData[nodeId]?.questionableParameters?.[paramKey]?.value
    onParameterUpdate(nodeId, paramKey, value, "accept")
  }

  const handleRejectParameter = (nodeId: string, paramKey: string) => {
    console.log("ParameterReview: handleRejectParameter", { nodeId, paramKey })
    onParameterUpdate(nodeId, paramKey, undefined, "reject")
  }

  const toggleEditMode = (nodeId: string, paramKey: string) => {
    console.log("ParameterReview: toggleEditMode", { nodeId, paramKey })
    setEditMode((prevMode) => ({
      ...prevMode,
      [nodeId]: {
        ...prevMode[nodeId],
        [paramKey]: !prevMode[nodeId]?.[paramKey],
      },
    }))
  }

  const handleEditComplete = (nodeId: string, paramKey: string) => {
    console.log("ParameterReview: handleEditComplete", { nodeId, paramKey })
    const value = reviewedData[nodeId]?.questionableParameters?.[paramKey]?.value
    onParameterUpdate(nodeId, paramKey, value, "edit")
    toggleEditMode(nodeId, paramKey)
  }

  if (!reviewedData || Object.keys(reviewedData).length === 0) {
    console.log("ParameterReview: No parameters to review")
    return (
      <div className="p-4">
        <p>No parameters to review.</p>
        <Button onClick={onReviewComplete}>Complete Review</Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Parameter Review</h2>
      <p className="text-sm text-muted-foreground">
        Review and adjust the parameters that require attention before finalizing the conversion.
      </p>
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(reviewedData).map(([nodeId, nodeData]) => (
          <AccordionItem key={nodeId} value={nodeId}>
            <AccordionTrigger>
              {nodeData.nodeName || nodeData.moduleName} ({nodeData.nodeType || nodeData.moduleType})
              {nodeData.isStub && (
                <Badge variant="outline" className="ml-2">
                  Stub
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              {nodeData.isStub ? (
                <div>
                  <p>This is a stub node/module. Original parameters:</p>
                  <pre className="bg-slate-100 p-2 rounded-md mt-2 text-sm overflow-auto">
                    {JSON.stringify(nodeData.originalParameters, null, 2)}
                  </pre>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-medium mb-2">Questionable Parameters</h4>
                  {nodeData.questionableParameters &&
                    Object.entries(nodeData.questionableParameters).map(([paramKey, paramData]: [string, any]) => (
                      <div key={paramKey} className="mb-4 p-2 border rounded">
                        <Label htmlFor={`${nodeId}-${paramKey}`}>{paramKey}</Label>
                        {editMode[nodeId]?.[paramKey] ? (
                          <Input
                            id={`${nodeId}-${paramKey}`}
                            value={paramData.value}
                            onChange={(e) => handleParameterChange(nodeId, paramKey, e.target.value)}
                          />
                        ) : (
                          <div className="bg-slate-100 p-2 rounded-md mt-1 text-sm">{paramData.value}</div>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{paramData.reason}</p>
                        <div className="flex gap-2 mt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAcceptParameter(nodeId, paramKey)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Accept parameter</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectParameter(nodeId, paramKey)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reject/Remove parameter</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {editMode[nodeId]?.[paramKey] ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditComplete(nodeId, paramKey)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => toggleEditMode(nodeId, paramKey)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{editMode[nodeId]?.[paramKey] ? "Complete edit" : "Edit parameter"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button onClick={onReviewComplete}>Complete Review</Button>
    </div>
  )
}

