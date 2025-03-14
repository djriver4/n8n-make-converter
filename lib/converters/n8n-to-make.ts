/**
 * n8n to Make.com Workflow Converter
 * 
 * Converts n8n workflows to Make.com format using the NodeMapper
 */

import type { DebugTracker } from "../debug-tracker"
import { NodeMapper } from "../node-mappings/node-mapper"
import { convertN8nNodeToMakeModule } from "../workflow-converter"
import logger from "../logger"
import { NodeParameterProcessor } from "../converters/parameter-processor"
import { processObjectWithExpressions, ExpressionContext } from "../expression-evaluator"

type ConversionLog = {
  type: "info" | "warning" | "error"
  message: string
}

// Define interfaces for type safety
interface MakeWorkflow {
  name: string
  flow: any[]
}

/**
 * Convert an n8n workflow to a Make.com workflow
 */
export async function n8nToMake(
  n8nWorkflow: any,
  debugTracker?: DebugTracker,
  options: any = {},
): Promise<{ convertedWorkflow: any; logs: ConversionLog[]; parametersNeedingReview: string[] }> {
  const logs: ConversionLog[] = []
  const parametersNeedingReview: string[] = []

  // Start timing if debugTracker is provided
  if (debugTracker) {
    debugTracker.startTiming()
    debugTracker.addLog("info", "Starting n8n to Make.com conversion")
  }

  try {
    // Validate n8n workflow structure
    if (!n8nWorkflow || !n8nWorkflow.nodes || !Array.isArray(n8nWorkflow.nodes)) {
      const errorMsg = "Invalid n8n workflow: Source workflow is empty or has no nodes array"
      debugTracker?.addLog("error", errorMsg)
      logs.push({
        type: "error",
        message: errorMsg,
      })
      return {
        convertedWorkflow: {},
        logs: debugTracker ? debugTracker.getGeneralLogs() : logs,
        parametersNeedingReview,
      }
    }
    
    // Check if we have a NodeMapper instance from options
    const nodeMapper = options?.nodeMapper as NodeMapper | undefined
    
    // Create a Make.com workflow structure
    const makeWorkflow: MakeWorkflow = {
      name: n8nWorkflow.name || "Converted from n8n",
      flow: [],
    }
    
    // Convert each n8n node to a Make.com module
    for (const n8nNode of n8nWorkflow.nodes) {
      try {
        // Ensure the node has parameters
        const nodeWithParams = {
          ...n8nNode,
          parameters: n8nNode.parameters || {},
        }
        
        // Evaluate expressions if enabled
        let nodeToConvert = nodeWithParams
        if (options.evaluateExpressions && options.expressionContext) {
          nodeToConvert = {
            ...nodeWithParams,
            parameters: NodeParameterProcessor.evaluateExpressions(
              nodeWithParams.parameters,
              options.expressionContext as ExpressionContext
            )
          }
          debugTracker?.addLog("info", `Evaluated expressions in node ${n8nNode.name}`)
        }
        
        // Use the NodeMapper to convert the node
        const makeModule = await convertN8nNodeToMakeModule(nodeToConvert, { nodeMapper })
        
        // Add the module to the workflow
        makeWorkflow.flow.push(makeModule)
        
        debugTracker?.addLog("info", `Converted node ${n8nNode.name} to Make.com module`)
      } catch (error) {
        // If conversion fails, log the error
        const errorMsg = `Failed to convert node ${n8nNode.name}: ${error instanceof Error ? error.message : String(error)}`
        debugTracker?.addLog("warning", errorMsg)
        logs.push({
          type: "warning",
          message: errorMsg,
        })
        
        // Create a simple placeholder module
        const placeholderModule = {
          id: n8nNode.id || Math.floor(Math.random() * 10000).toString(),
          name: n8nNode.name,
          type: "placeholder",
          definition: {
            parameters: {
              displayName: `Placeholder for ${n8nNode.name} (${n8nNode.type})`,
            },
          },
          position: {
            x: n8nNode.position?.[0] || 100,
            y: n8nNode.position?.[1] || 100,
          },
        }
        
        makeWorkflow.flow.push(placeholderModule)
        
        // Add to parameters needing review
        parametersNeedingReview.push(`Node ${n8nNode.name} (${n8nNode.type}) could not be converted automatically`)
      }
    }
    
    // For testing purposes, create a simple sequential connection between modules
    if (makeWorkflow.flow.length > 1) {
      for (let i = 0; i < makeWorkflow.flow.length - 1; i++) {
        const sourceModule = makeWorkflow.flow[i]
        const targetModule = makeWorkflow.flow[i + 1]
        
        // Create a connection from source to target
        if (!sourceModule.connections) {
          sourceModule.connections = { main: [] }
        }
        
        sourceModule.connections.main = [{
          id: targetModule.id,
          main: "main",
        }]
      }
    }
    
    const successMsg = `Conversion completed: ${makeWorkflow.flow.length} modules created`
    debugTracker?.addLog("info", successMsg)
    logs.push({
      type: "info",
      message: successMsg,
    })
    
    return {
      convertedWorkflow: makeWorkflow,
      logs: debugTracker ? debugTracker.getGeneralLogs() : logs,
      parametersNeedingReview,
    }
  } catch (error) {
    // Log the error
    const errorMessage = `Conversion failed: ${error instanceof Error ? error.message : String(error)}`
    logger.error(errorMessage)
    
    if (debugTracker) {
      debugTracker.addLog("error", errorMessage)
      debugTracker.finishTiming()
    } else {
      logs.push({
        type: "error",
        message: errorMessage,
      })
    }
    
    return {
      convertedWorkflow: { name: n8nWorkflow?.name || "Failed Conversion", flow: [] },
      logs: debugTracker ? debugTracker.getGeneralLogs() : logs,
      parametersNeedingReview,
    }
  }
}

