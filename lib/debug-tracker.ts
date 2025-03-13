export type NodeMappingDetail = {
  sourceId: string
  sourceName: string
  sourceType: string
  targetId?: string
  targetName?: string
  targetType?: string
  success: boolean
  isStub?: boolean
  mappingStatus: "full" | "partial" | "failed" | "stub" // Add this field
  parameterMappings: ParameterMappingDetail[]
  warnings: string[]
  unmappedParameters: string[]
  pluginSource?: string // Add this to track which plugin provided the mapping
}

export type ParameterMappingDetail = {
  source: string
  target?: string
  value?: any
  success: boolean
  reason?: string
}

export class DebugTracker {
  private mappingDetails: Record<string, NodeMappingDetail> = {}
  private generalLogs: Array<{ type: "info" | "warning" | "error"; message: string }> = []
  private startTime?: number

  trackNodeMapping(sourceNode: any, targetNode: any | null, success: boolean, isStub = false, pluginSource?: string) {
    const nodeId = sourceNode.id || sourceNode.name

    // Determine mapping status
    let mappingStatus: "full" | "partial" | "failed" | "stub" = "failed"
    if (isStub) {
      mappingStatus = "stub"
    } else if (success) {
      mappingStatus = "full"
    } else if (targetNode) {
      mappingStatus = "partial"
    }

    this.mappingDetails[nodeId] = {
      sourceId: sourceNode.id,
      sourceName: sourceNode.name || `Node ${sourceNode.id}`,
      sourceType: sourceNode.type || sourceNode.module,
      targetId: targetNode?.id,
      targetName: targetNode?.name || targetNode?.id ? `Module ${targetNode.id}` : undefined,
      targetType: targetNode?.type || targetNode?.module,
      success,
      isStub,
      mappingStatus,
      parameterMappings: [],
      warnings: [],
      unmappedParameters: [],
      pluginSource,
    }
    return this
  }

  trackParameterMapping(
    nodeId: string,
    sourceName: string,
    targetName: string | undefined,
    value: any,
    success: boolean,
    reason?: string,
  ) {
    if (!this.mappingDetails[nodeId]) {
      this.mappingDetails[nodeId] = {
        sourceId: nodeId,
        sourceName: `Node ${nodeId}`,
        sourceType: "unknown",
        success: false,
        parameterMappings: [],
        warnings: [],
        unmappedParameters: [],
        mappingStatus: "failed",
      }
    }

    this.mappingDetails[nodeId].parameterMappings.push({
      source: sourceName,
      target: targetName,
      value,
      success,
      reason,
    })

    if (!success && !targetName) {
      this.mappingDetails[nodeId].unmappedParameters.push(sourceName)
    }

    return this
  }

  addWarning(nodeId: string, message: string) {
    if (this.mappingDetails[nodeId]) {
      this.mappingDetails[nodeId].warnings.push(message)
    }
    return this
  }

  addLog(type: "info" | "warning" | "error", message: string) {
    this.generalLogs.push({ type, message })
    return this
  }

  getNodeMappingDetails() {
    return this.mappingDetails
  }

  getGeneralLogs() {
    return this.generalLogs
  }

  getDebugReport() {
    return {
      nodes: this.mappingDetails,
      logs: this.generalLogs,
      summary: this.generateSummary(),
    }
  }

  private generateSummary() {
    const nodeCount = Object.keys(this.mappingDetails).length
    const successfulNodes = Object.values(this.mappingDetails).filter((n) => n.success).length
    const stubNodes = Object.values(this.mappingDetails).filter((n) => n.isStub).length
    const partialNodes = Object.values(this.mappingDetails).filter((n) => n.mappingStatus === "partial").length
    const failedNodes = Object.values(this.mappingDetails).filter((n) => n.mappingStatus === "failed").length
    const warningCount = Object.values(this.mappingDetails).reduce((count, node) => count + node.warnings.length, 0)
    const unmappedParamsCount = Object.values(this.mappingDetails).reduce(
      (count, node) => count + node.unmappedParameters.length,
      0,
    )

    // Track which plugins provided mappings
    const pluginUsage = Object.values(this.mappingDetails).reduce(
      (acc, node) => {
        if (node.pluginSource) {
          acc[node.pluginSource] = (acc[node.pluginSource] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      nodeCount,
      successfulNodes,
      partialNodes,
      failedNodes,
      stubNodes,
      warningCount,
      unmappedParamsCount,
      pluginUsage,
      successRate: nodeCount > 0 ? Math.round((successfulNodes / nodeCount) * 100) : 0,
      conversionTime: this.startTime ? Date.now() - this.startTime : undefined,
    }
  }

  // Add a method to start timing the conversion
  startTiming() {
    this.startTime = Date.now()
    return this
  }

  // Add a method to finish timing the conversion
  finishTiming() {
    // If startTime is not set, do nothing
    if (!this.startTime) {
      return this
    }
    
    // Calculate the conversion time and add it to the summary
    const conversionTime = Date.now() - this.startTime
    this.addLog("info", `Conversion completed in ${conversionTime}ms`)
    return this
  }
}

