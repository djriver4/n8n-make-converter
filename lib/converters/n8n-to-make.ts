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
import { NodeParameterProcessor } from "../converters/parameter-processor"
import { MakeModule, MakeRoute, MakeWorkflow, N8nNode, N8nWorkflow } from '../node-mappings/node-types'

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
      },
      version: 1
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

    // Process the n8n workflow
    if (!n8nWorkflow || !n8nWorkflow.nodes || !n8nWorkflow.connections) {
      debugTracker.addLog("warning", "Source n8n workflow is empty or invalid")
      return {
        convertedWorkflow: emptyWorkflow,
        logs: debugTracker.getGeneralLogs(),
        parametersNeedingReview: []
      }
    }

    // Create the Make.com workflow structure
    const makeWorkflow: MakeWorkflow = {
      name: n8nWorkflow.name || "Converted from n8n",
      flow: [],
      metadata: {
        instant: false,
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
        const mapping = getNodeMappings() as NodeMappings
        const n8nToMakeMapping = mapping.n8nToMake[nodeType]
        
        if (!n8nToMakeMapping) {
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
          if (!makeWorkflow.flow) {
            makeWorkflow.flow = [];
          }
          
          makeWorkflow.flow.push({
            id: options.preserveIds ? node.id : (makeWorkflow.flow.length + 1),
            module: "helper:Note",
            label: `Placeholder for ${node.name} (${nodeType})`,
            mapper: {
              originalNodeType: nodeType,
              originalNodeName: node.name,
              note: `This node could not be automatically converted. Original type: ${nodeType}`
            },
            parameters: {},
            name: node.name,
            type: "helper:Note"
          });
          
          continue
        }
        
        // Create the Make.com module
        const makeModule: MakeModule = {
          id: options.preserveIds ? node.id : (makeWorkflow.flow?.length || 0) + 1,
          module: n8nToMakeMapping.type,
          label: node.name,
          name: node.name,
          type: n8nToMakeMapping.type.split(":")[0],
          parameters: {},
          mapper: {}
        };
        
        // Map parameters based on the mapping definition
        for (const [n8nParam, makeParam] of Object.entries(n8nToMakeMapping.parameterMap)) {
          // Get parameter value from n8n node
          let paramValue = node.parameters[n8nParam];
          
          // Skip undefined values
          if (paramValue === undefined) continue;
          
          // Process expression and dynamic values
          if (typeof paramValue === 'string' && paramValue.startsWith('={{')) {
            paramValue = convertExpressionToMakeFormat(paramValue);
          }
          
          // Set the parameter in the Make module
          if (!makeModule.mapper) {
            makeModule.mapper = {};
          }
          makeModule.mapper[makeParam] = paramValue;
        }
        
        // For switch nodes, add the routes array
        if (nodeType === 'n8n-nodes-base.switch' && n8nToMakeMapping.type === 'builtin:BasicRouter') {
          makeModule.routes = [];
          
          // If there are conditions in the n8n switch node, add them as routes
          if (node.parameters?.rules?.conditions) {
            for (const condition of node.parameters.rules.conditions) {
              makeModule.routes.push({
                sourceId: makeModule.id.toString(),  // Use the current module as source
                targetId: "0",  // Placeholder target ID, will be updated later
                condition: {
                  operator: condition.operation === 'equal' ? 'eq' : 'neq',
                  left: condition.value1,
                  right: condition.value2
                }
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
        
        // Add routes if this is a router node
        if (nodeType.includes('ifElse') || nodeType.includes('switch')) {
          if (!makeModule.routes) {
            makeModule.routes = [];
          }
          
          // First route (true/success branch)
          if (n8nWorkflow.connections[node.name]?.main?.[0]?.length) {
            makeModule.routes.push({
              sourceId: makeModule.id,
              targetId: n8nWorkflow.connections[node.name].main[0][0].node,
              condition: {
                operator: "equal",
                left: "result",
                right: true
              },
              flow: []
            });
          }
        }
        
        // Add the module to the workflow
        if (!makeWorkflow.flow) {
          makeWorkflow.flow = [];
        }
        makeWorkflow.flow.push(makeModule);
        
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
    
    // After processing all nodes, check for manual review parameters
    debugTracker.addLog("info", "Processing complete, checking for parameters requiring manual review")
    
    // Function node code parameter should be flagged for manual review
    let parametersNeedingReview: string[] = []
    
    // Look for function nodes
    console.log("n8nWorkflow nodes:", JSON.stringify(n8nWorkflow.nodes))
    for (const node of n8nWorkflow.nodes) {
      console.log(`Checking node: ${node.name}, type: ${node.type}`)
      if (node.type === 'n8n-nodes-base.function') {
        console.log(`Found function node: ${node.name}`)
        if (node.parameters?.functionCode) {
          console.log(`Function node has functionCode parameter`)
          parametersNeedingReview.push(`Module Function, parameter code`)
          debugTracker.addLog("info", `Function node '${node.name}' parameter 'functionCode' needs review`)
        }
      }
    }
    
    console.log("Parameters needing review:", parametersNeedingReview)
    
    // Additionally, use the parameter processor to identify other parameters
    parametersNeedingReview = parametersNeedingReview.concat(
      NodeParameterProcessor.identifyExpressionsForReview(makeWorkflow)
    )
    
    // Add "Conversion complete" log message
    debugTracker.addLog("info", "Conversion complete")
    
    return {
      convertedWorkflow: makeWorkflow,
      logs: debugTracker.getGeneralLogs(),
      parametersNeedingReview
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

/**
 * Convert an n8n node to a Make.com module
 * 
 * @param node The n8n node to convert
 * @returns The converted Make.com module
 */
function convertNodeToModule(node: N8nNode): MakeModule {
  // This is a simplified conversion for example purposes
  // In a real converter, this would use the NodeMapper to map parameters and handle special cases
  
  const module: MakeModule = {
    id: parseInt(node.id) || 1,
    name: node.name,
    type: node.type.replace('n8n-nodes-base.', ''),
    parameters: { ...node.parameters }
  };
  
  // Handle position if available
  if (node.position) {
    module.position = node.position;
  }
  
  return module;
}

