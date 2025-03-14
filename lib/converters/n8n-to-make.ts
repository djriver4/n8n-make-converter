/**
 * n8n to Make.com Converter
 * 
 * This module converts n8n workflows to Make.com format
 */

import { DebugTracker } from "../debug-tracker"
import { getNodeMappings } from "../mappings/node-mapping"
import logger from "../logger"
import { NodeMapper } from "../node-mappings/node-mapper"
import { NodeMappingLoader } from "../node-mappings/node-mapping-loader"

// Define interfaces for type safety
interface NodeMappingDefinition {
  type: string
  parameterMap: Record<string, string>
  description?: string
  userDefined?: boolean
  displayName?: string
}

interface NodeMappings {
  n8nToMake: Record<string, NodeMappingDefinition>
  makeToN8n: Record<string, NodeMappingDefinition>
}

interface RouteCondition {
  operator: string
  left: any
  right: any
}

interface Route {
  condition: RouteCondition
  flow: any[]
}

interface MakeModule {
  id: string | number
  module: string
  label: string
  mapper: Record<string, any>
  parameters: Record<string, any>
  routes?: Route[]
}

interface MakeWorkflow {
  name: string
  flow: MakeModule[]
  metadata: {
    instant: boolean
    version: number
    scenario: {
      roundtrips: number
      maxErrors: number
      autoCommit: boolean
      autoCommitTriggerLast: boolean
      sequential: boolean
      confidential: boolean
      dataloss: boolean
      dlq: boolean
      source: string
    }
    designer: {
      orphans: string[]
    }
  }
}

interface ConversionResult {
  convertedWorkflow: MakeWorkflow | Record<string, never>
  logs: Array<{
    type: "info" | "warning" | "error"
    message: string
  }>
  parametersNeedingReview: string[]
}

/**
 * Convert n8n expressions to Make.com format
 * 
 * @param expr n8n expression
 * @returns Make.com compatible expression
 */
function convertExpressionToMakeFormat(expr: string): string {
  if (!expr) return expr;
  
  // If it's an n8n expression with the {{ }} format, convert to Make.com format
  if (expr.startsWith('={{') && expr.endsWith('}}')) {
    // Extract the expression content
    const expressionContent = expr.substring(3, expr.length - 2).trim();
    
    // Replace $json references
    return expressionContent.replace(/\$json\.(\w+)/g, '{{$1}}');
  }
  
  return expr;
}

/**
 * Convert an n8n workflow to Make.com format
 * 
 * @param n8nWorkflow - The n8n workflow to convert
 * @param debugTracker - Optional debug tracker
 * @param options - Conversion options
 * @returns A promise resolving to the conversion result
 */
export async function n8nToMake(
  n8nWorkflow: any,
  debugTracker: DebugTracker,
  options: any = {}
): Promise<ConversionResult> {
  debugTracker.addLog("info", "Starting n8n to Make.com conversion")
  
  // Create default empty workflow structure
  const emptyWorkflow: MakeWorkflow = {
    name: "Empty Workflow",
    flow: [],
    metadata: {
      instant: false,
      version: 1,
      scenario: {
        roundtrips: 1,
        maxErrors: 3,
        autoCommit: true,
        autoCommitTriggerLast: true,
        sequential: false,
        confidential: false,
        dataloss: false,
        dlq: false,
        source: "n8n-converter"
      },
      designer: {
        orphans: []
      }
    }
  }
  
  try {
    // Initialize the node mapper if needed
    if (options.useEnhancedMapper) {
      const mappingLoader = NodeMappingLoader.getInstance();
      await mappingLoader.loadMappings();
      const mappingDatabase = mappingLoader.getMappings();
      const nodeMapper = new NodeMapper(mappingDatabase);
      
      // Here we could use the enhanced mapper for better conversion
      logger.info('Using enhanced node mapper for conversion');
    } else {
      // Use the simpler mapping approach from node-mapping.ts
      logger.info('Using basic node mapper for conversion');
    }

    // Validate the n8n workflow
    if (!n8nWorkflow) {
      debugTracker.addLog("error", "Invalid n8n workflow: Source workflow is empty");
      return {
        convertedWorkflow: {},
        logs: debugTracker.getGeneralLogs(),
        parametersNeedingReview: []
      }
    }
    
    // Validate the n8n workflow has a nodes array
    if (!n8nWorkflow.nodes || !Array.isArray(n8nWorkflow.nodes)) {
      debugTracker.addLog("error", "Invalid n8n workflow: Missing or invalid nodes array")
      return {
        convertedWorkflow: {},
        logs: debugTracker.getGeneralLogs(),
        parametersNeedingReview: []
      }
    }
    
    // Get the node mappings
    const mappings = getNodeMappings() as NodeMappings
    
    // Create the Make.com workflow structure
    const makeWorkflow: MakeWorkflow = {
      name: n8nWorkflow.name || "Converted from n8n",
      flow: [] as MakeModule[],
      metadata: {
        instant: false,
        version: 1,
        scenario: {
          roundtrips: 1,
          maxErrors: 3,
          autoCommit: true,
          autoCommitTriggerLast: true,
          sequential: false,
          confidential: false,
          dataloss: false,
          dlq: false,
          source: "n8n-converter"
        },
        designer: {
          orphans: []
        }
      }
    }
    
    // Track nodes that couldn't be converted
    const unconvertedNodes: string[] = []
    
    // Convert each n8n node to a Make.com module
    for (const node of n8nWorkflow.nodes) {
      try {
        // Skip disabled nodes if specified in options
        if (options.skipDisabled && node.disabled) {
          debugTracker.addLog("info", `Skipping disabled node: ${node.name}`)
          continue
        }
        
        // Get the node type
        const nodeType = node.type as string
        
        // Find the mapping for this node type
        const mapping = mappings.n8nToMake[nodeType]
        
        if (!mapping) {
          // If strict mode is enabled, fail the conversion
          if (options.strictMode) {
            debugTracker.addLog("error", `Strict mode enabled: Could not find direct mapping for node type: ${nodeType}`)
            return {
              convertedWorkflow: {},
              logs: debugTracker.getGeneralLogs(),
              parametersNeedingReview: []
            }
          }
          
          // Otherwise, create a stub module
          debugTracker.addLog("warning", `Could not find direct mapping for node type: ${nodeType}`)
          unconvertedNodes.push(node.name)
          
          // Add a placeholder module
          makeWorkflow.flow.push({
            id: options.preserveIds ? node.id : makeWorkflow.flow.length + 1,
            module: "helper:Note",
            label: `Placeholder for ${node.name} (${nodeType})`,
            mapper: {
              originalNodeType: nodeType,
              originalNodeName: node.name,
              note: `This node could not be automatically converted. Original type: ${nodeType}`
            },
            parameters: {}
          })
          
          continue
        }
        
        // Create the Make.com module
        const makeModule: MakeModule = {
          id: options.preserveIds ? node.id : makeWorkflow.flow.length + 1,
          module: mapping.type,
          label: node.name,
          mapper: {} as Record<string, any>,
          parameters: {} as Record<string, any>
        }
        
        // Map the parameters
        if (node.parameters && mapping.parameterMap) {
          for (const [n8nParam, makeParam] of Object.entries(mapping.parameterMap)) {
            if (node.parameters[n8nParam] !== undefined) {
              let paramValue = node.parameters[n8nParam];
              
              // If the parameter is a string that contains an n8n expression, convert it
              if (typeof paramValue === 'string') {
                paramValue = convertExpressionToMakeFormat(paramValue);
              }
              
              makeModule.mapper[makeParam] = paramValue;
            }
          }
        }
        
        // For switch nodes, add the routes array
        if (nodeType === 'n8n-nodes-base.switch' && mapping.type === 'builtin:BasicRouter') {
          makeModule.routes = [];
          
          // If there are conditions in the n8n switch node, add them as routes
          if (node.parameters?.rules?.conditions) {
            for (const condition of node.parameters.rules.conditions) {
              makeModule.routes.push({
                condition: {
                  operator: condition.operation === 'equal' ? 'eq' : 'neq',
                  left: condition.value1,
                  right: condition.value2
                },
                flow: []
              });
            }
          }
        }
        
        // Handle credentials
        if (node.credentials) {
          for (const [credName, credValue] of Object.entries(node.credentials as Record<string, any>)) {
            makeModule.parameters[`__IMTCONN__${credName}`] = credValue
          }
        }
        
        // Add the module to the workflow
        makeWorkflow.flow.push(makeModule)
        
      } catch (error) {
        debugTracker.addLog("error", `Error converting node ${node.name}: ${error instanceof Error ? error.message : String(error)}`)
        unconvertedNodes.push(node.name)
      }
    }
    
    // Add connections between modules based on n8n connections
    if (n8nWorkflow.connections && Object.keys(n8nWorkflow.connections).length > 0) {
      // TODO: Implement connection mapping
      debugTracker.addLog("info", "Connection mapping not yet implemented")
    }
    
    debugTracker.addLog("info", `Conversion completed: ${makeWorkflow.flow.length} modules created`)
    
    return {
      convertedWorkflow: makeWorkflow,
      logs: debugTracker.getGeneralLogs(),
      parametersNeedingReview: unconvertedNodes
    }
  } catch (error) {
    debugTracker.addLog("error", `Conversion failed: ${error instanceof Error ? error.message : String(error)}`)
    return {
      convertedWorkflow: {},
      logs: debugTracker.getGeneralLogs(),
      parametersNeedingReview: []
    }
  }
}

