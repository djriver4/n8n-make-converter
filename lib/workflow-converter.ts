/**
 * Enhanced Workflow Converter
 * 
 * This module provides an integration between the Node Mapping System 
 * and Expression Evaluator for converting workflows between n8n and Make.com platforms.
 */

import { n8nToMake } from "./converters/n8n-to-make";
import { makeToN8n } from "./converters/make-to-n8n";
import { DebugTracker } from "./debug-tracker";
import { getPluginRegistry } from "./plugins/plugin-registry";
// Import the node mappings from the mappings directory
import { getNodeMappings } from "./mappings/node-mapping";
import { processObjectWithExpressions, ExpressionContext } from "./expression-evaluator";
import { NodeParameterProcessor } from "./converters/parameter-processor";
import logger from "./logger";
import { N8nNode, MakeModule } from "./node-mappings/node-types";

// Define log structure
interface ConversionLog {
  type: "info" | "warning" | "error";
  message: string;
}

// Define conversion result structure
interface ConversionResult {
  convertedWorkflow: any;
  logs: ConversionLog[];
  parametersNeedingReview: string[];
  workflowHasFunction?: boolean;
}

// Define conversion options structure
interface ConversionOptions {
  // Whether to evaluate expressions during conversion
  evaluateExpressions?: boolean;
  // Context for expression evaluation
  expressionContext?: ExpressionContext;
  // Other options
  [key: string]: any;
}

// Define interfaces for mapping structures
interface NodeMappingDefinition {
  type: string;
  parameterMap: Record<string, string>;
  description?: string;
  userDefined?: boolean;
  displayName?: string;
}

interface NodeMappings {
  n8nToMake: Record<string, NodeMappingDefinition>;
  makeToN8n: Record<string, NodeMappingDefinition>;
}

/**
 * Verify that mappings are available and log information about them
 * 
 * @param options Optional conversion options
 * @returns Boolean indicating if mappings are available
 */
async function verifyMappingsAvailable(options?: ConversionOptions): Promise<boolean> {
  try {
    // Get the mappings from lib/mappings/node-mapping.ts
    const mappings = getNodeMappings() as NodeMappings;
    
    // Log the mappings for debugging
    logger.info(`Mappings loaded from lib/mappings/node-mapping.ts`);
    logger.info(`Loaded ${Object.keys(mappings.n8nToMake || {}).length} n8n->make mappings and ${Object.keys(mappings.makeToN8n || {}).length} make->n8n mappings`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to verify mappings: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Convert a workflow from one platform to another,
 * using the enhanced Node Mapping System and Expression Evaluator
 */
export async function convertWorkflow(
  workflow: any,
  sourcePlatform: "n8n" | "make",
  targetPlatform: "n8n" | "make",
  options: ConversionOptions = {},
): Promise<ConversionResult> {
  const debugTracker = new DebugTracker().startTiming();
  debugTracker.addLog("info", `Starting ${targetPlatform} conversion`);

  try {
    // Verify mappings are available
    const mappingsAvailable = await verifyMappingsAvailable(options);
    if (!mappingsAvailable) {
      debugTracker.addLog("error", "Mappings are not available, conversion cannot proceed");
      return {
        convertedWorkflow: {},
        logs: debugTracker.getGeneralLogs(),
        parametersNeedingReview: []
      };
    }
    
    debugTracker.addLog("info", "Mappings verified, ready for workflow conversion");

    // Check if workflow is empty
    if (!workflow) {
      debugTracker.addLog("error", "Source workflow is empty");
      return {
        convertedWorkflow: {},
        logs: debugTracker.getGeneralLogs(),
        parametersNeedingReview: []
      };
    }

    // Call the appropriate converter based on source and target platforms
    if (sourcePlatform === "n8n" && targetPlatform === "make") {
      return await n8nToMake(workflow, debugTracker, options);
    } else if (sourcePlatform === "make" && targetPlatform === "n8n") {
      return await makeToN8n(workflow, debugTracker, options);
    } else {
      debugTracker.addLog("error", `Unsupported conversion: ${sourcePlatform} to ${targetPlatform}`);
      return {
        convertedWorkflow: {},
        logs: debugTracker.getGeneralLogs(),
        parametersNeedingReview: []
      };
    }
  } catch (error) {
    debugTracker.addLog("error", `Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      convertedWorkflow: {},
      logs: debugTracker.getGeneralLogs(),
      parametersNeedingReview: []
    };
  }
}

/**
 * Convert N8n node to Make module
 * 
 * @param node N8n node to convert
 * @param options Conversion options
 * @returns Converted Make module
 */
export async function convertN8nNodeToMakeModule(
  node: N8nNode,
  options: ConversionOptions = {}
): Promise<MakeModule> {
  const mapper = await initializeNodeMapper(options);
  
  // Convert the node using the NodeMapper
  const makeModule = mapper.mapN8nNodeToMake(node);
  
  // Process any expressions in the parameters if needed
  if (options.evaluateExpressions && options.expressionContext) {
    if (makeModule.definition && makeModule.definition.parameters) {
      makeModule.definition.parameters = NodeParameterProcessor.evaluateExpressions(
        makeModule.definition.parameters,
        options.expressionContext
      );
    }
  }
  
  return makeModule;
}

/**
 * Convert Make module to N8n node
 * 
 * @param module Make module to convert
 * @param options Conversion options
 * @returns Converted N8n node
 */
export async function convertMakeModuleToN8nNode(
  module: MakeModule,
  options: ConversionOptions = {}
): Promise<N8nNode> {
  const mapper = await initializeNodeMapper(options);
  
  // Convert the module using the NodeMapper
  const n8nNode = mapper.mapMakeNodeToN8n(module);
  
  // Process any expressions in the parameters if needed
  if (options.evaluateExpressions && options.expressionContext) {
    if (n8nNode.parameters) {
      n8nNode.parameters = NodeParameterProcessor.evaluateExpressions(
        n8nNode.parameters,
        options.expressionContext
      );
    }
  }
  
  return n8nNode;
} 