/**
 * Enhanced Workflow Converter
 * 
 * This module provides an integration between the Node Mapping System 
 * and Expression Evaluator for converting workflows between n8n and Make.com platforms.
 */

import { n8nToMake } from "./converters/n8n-to-make";
import { makeToN8n } from "./converters/make-to-n8n";
import { DebugTracker } from "./debug-tracker";
import { getPluginRegistry } from "./plugin-registry";
import { processObjectWithExpressions, ExpressionContext, convertExpressions } from "./expression-evaluator";
import { NodeParameterProcessor } from "./converters/parameter-processor";
import logger from "./logger";
import { 
  N8nNode, 
  MakeModule, 
  N8nWorkflow, 
  MakeWorkflow,
  N8nConnection,
  MakeRoute,
  ParameterValue
} from "./node-mappings/node-types";
// Import validation utilities
import { validateMakeWorkflow, validateN8nWorkflow } from "./utils/validate-workflow";
import { NodeMapper } from "./node-mappings/node-mapper";
import { NodeMappingLoader } from "./node-mappings/node-mapping-loader";
import { NodeMappingDatabase } from "./node-mappings/schema";

// Define log structure
export interface ConversionLog {
  type: "info" | "warning" | "error";
  message: string;
  details?: any;
  timestamp?: string;
}

// Define conversion result structure
export interface ConversionResult {
  convertedWorkflow: N8nWorkflow | MakeWorkflow;
  logs: ConversionLog[];
  parametersNeedingReview: string[];
  unmappedNodes?: string[];
  workflowHasFunction?: boolean;
  isValidInput?: boolean; // Added to track input validation status
  debug?: Record<string, any>; // Debug information
}

// Define conversion options structure
interface ConversionOptions {
  // Whether to evaluate expressions during conversion
  evaluateExpressions?: boolean;
  // Context for expression evaluation
  expressionContext?: ExpressionContext;
  // Whether to skip input validation
  skipValidation?: boolean;
  // Whether to transform parameter values during conversion
  transformParameterValues?: boolean;
  // Whether to include debug information
  debug?: boolean;
  // Whether to copy non-mapped parameters
  copyNonMappedParameters?: boolean;
  // Other options
  [key: string]: any;
}

interface ExpressionReviewInfo {
  nodeType: string;
  reason: string;
}

interface ConversionContext {
  mappingDatabase?: NodeMappingDatabase;
  evaluateExpressions?: boolean;
  expressionContext?: Record<string, any>;
}

/**
 * Main workflow converter class that handles conversion between n8n and Make.com
 */
export class WorkflowConverter {
  private nodeMapper: NodeMapper;
  private debugTracker: DebugTracker;
  
  /**
   * Create a new workflow converter
   * 
   * @param mappingDatabase - The node mapping database to use
   * @param debugTracker - Optional debug tracker
   */
  constructor(mappingDatabase: NodeMappingDatabase, debugTracker?: DebugTracker) {
    this.nodeMapper = new NodeMapper(mappingDatabase);
    this.debugTracker = debugTracker || new DebugTracker();
    logger.info('WorkflowConverter initialized');
  }
  
  /**
   * Convert an n8n workflow to Make.com format
   * 
   * @param n8nWorkflow - n8n workflow to convert
   * @param options - Conversion options
   * @returns Conversion result
   */
  convertN8nToMake(n8nWorkflow: N8nWorkflow, options: ConversionOptions = {}): ConversionResult {
    const logs: ConversionLog[] = [];
    const parametersNeedingReview: string[] = [];
    const unmappedNodes: string[] = [];
    const debug: Record<string, any> = {};
    
    // Validate input if not skipped
    let isValidInput = true;
    if (!options.skipValidation) {
      try {
        const validationResult = validateN8nWorkflow(n8nWorkflow);
        isValidInput = validationResult.valid;
        if (!isValidInput) {
          logs.push({
            type: "error",
            message: "Invalid n8n workflow format",
            timestamp: new Date().toISOString()
          });
          return {
            convertedWorkflow: { name: "Invalid workflow", modules: [], routes: [], active: false } as MakeWorkflow,
            logs,
            parametersNeedingReview,
            unmappedNodes,
            isValidInput: false
          };
        }
      } catch (error: any) {
        logs.push({
          type: "error",
          message: `Error validating n8n workflow: ${error instanceof Error ? error.message : String(error)}`,
          details: error,
          timestamp: new Date().toISOString()
        });
        isValidInput = false;
      }
    }
    
    if (!isValidInput && !options.skipValidation) {
      return {
        convertedWorkflow: { name: "Invalid workflow", modules: [], routes: [], active: false } as MakeWorkflow,
        logs,
        parametersNeedingReview,
        unmappedNodes,
        isValidInput: false
      };
    }
    
    // Start creating Make workflow
    const makeWorkflow: MakeWorkflow = {
      name: n8nWorkflow.name,
      modules: [],
      routes: [],
      active: n8nWorkflow.active,
      settings: n8nWorkflow.settings || {},
      labels: n8nWorkflow.tags || [],
      version: n8nWorkflow.version || 1
    };
    
    // Maps for node correlations
    const nodeIdMap: Record<string, string> = {};
    
    // Process each n8n node
    for (const n8nNode of n8nWorkflow.nodes) {
      try {
        // Use NodeMapper to convert the node
        const conversionResult = this.nodeMapper.convertN8nNodeToMakeModule(n8nNode, {
          evaluateExpressions: options.evaluateExpressions,
          expressionContext: options.expressionContext,
          transformParameterValues: options.transformParameterValues !== false,
          debug: options.debug,
          copyNonMappedParameters: options.copyNonMappedParameters
        });
        
        const makeModule = conversionResult.node as MakeModule;
        
        // Add to modules array
        makeWorkflow.modules.push(makeModule);
        
        // Store the correlation between n8n and Make IDs
        nodeIdMap[n8nNode.id] = makeModule.id.toString();
        
        // Store debug information if requested
        if (options.debug && conversionResult.debug) {
          debug[`node-${n8nNode.id}`] = conversionResult.debug;
        }
      } catch (error: any) {
        if (error.name === 'NodeMappingError') {
          // No mapping found for this node type
          unmappedNodes.push(n8nNode.type);
          logs.push({
            type: "warning",
            message: `No mapping found for n8n node type: ${n8nNode.type}`,
            details: { nodeId: n8nNode.id, nodeName: n8nNode.name },
            timestamp: new Date().toISOString()
          });
          
          // Create a placeholder module
          const placeholderModule: MakeModule = {
            id: n8nNode.id,
            name: `[UNMAPPED] ${n8nNode.name}`,
            type: "placeholder",
            parameters: { originalType: n8nNode.type },
            notes: `This module represents an unmapped n8n node of type: ${n8nNode.type}`
          };
          
          if (n8nNode.position) {
            placeholderModule.position = n8nNode.position;
          }
          
          makeWorkflow.modules.push(placeholderModule);
          nodeIdMap[n8nNode.id] = placeholderModule.id.toString();
        } else {
          // Other conversion error
          logs.push({
            type: "error",
            message: `Error converting n8n node '${n8nNode.name}' (${n8nNode.type}): ${error instanceof Error ? error.message : String(error)}`,
            details: { error, nodeId: n8nNode.id, nodeName: n8nNode.name, nodeType: n8nNode.type },
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Process connections to create routes
    for (const [sourceNodeId, connections] of Object.entries(n8nWorkflow.connections)) {
      if (!connections.main) continue;
      
      for (const [outputIndex, targetConnections] of Object.entries(connections.main)) {
        for (const connection of targetConnections) {
          try {
            const route: MakeRoute = {
              sourceId: nodeIdMap[sourceNodeId],
              targetId: nodeIdMap[connection.targetNodeId]
            };
            
            // Add output label if needed
            if (parseInt(outputIndex) > 0) {
              route.label = `Output ${parseInt(outputIndex) + 1}`;
            }
            
            makeWorkflow.routes.push(route);
          } catch (error: any) {
            logs.push({
              type: "error",
              message: `Error creating route from node ${sourceNodeId} to ${connection.targetNodeId}: ${error instanceof Error ? error.message : String(error)}`,
              details: { sourceNodeId, targetNodeId: connection.targetNodeId, outputIndex },
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
    
    // Identify parameters that may need manual review
    const expressionsForReview = NodeParameterProcessor.identifyExpressionsForReview(n8nWorkflow);
    for (const [path, info] of Object.entries(expressionsForReview)) {
      const reviewInfo = info as unknown as ExpressionReviewInfo;
      parametersNeedingReview.push(`${reviewInfo.nodeType} - ${path}: ${reviewInfo.reason}`);
    }
    
    return {
      convertedWorkflow: makeWorkflow,
      logs,
      parametersNeedingReview,
      unmappedNodes,
      workflowHasFunction: parametersNeedingReview.length > 0,
      isValidInput,
      debug: options.debug ? debug : undefined
    };
  }
  
  /**
   * Convert a Make.com workflow to n8n format
   * 
   * @param makeWorkflow - Make.com workflow to convert
   * @param options - Conversion options
   * @returns Conversion result
   */
  convertMakeToN8n(makeWorkflow: MakeWorkflow, options: ConversionOptions = {}): ConversionResult {
    const logs: ConversionLog[] = [];
    const parametersNeedingReview: string[] = [];
    const unmappedNodes: string[] = [];
    const debug: Record<string, any> = {};
    
    // Validate input if not skipped
    let isValidInput = true;
    if (!options.skipValidation) {
      try {
        const validationResult = validateMakeWorkflow(makeWorkflow);
        isValidInput = validationResult.valid;
        if (!isValidInput) {
          logs.push({
            type: "error",
            message: "Invalid Make.com workflow format",
            timestamp: new Date().toISOString()
          });
          return {
            convertedWorkflow: { name: "Invalid workflow", nodes: [], connections: {}, active: false } as N8nWorkflow,
            logs,
            parametersNeedingReview,
            unmappedNodes,
            isValidInput: false
          };
        }
      } catch (error: any) {
        logs.push({
          type: "error",
          message: `Error validating Make.com workflow: ${error instanceof Error ? error.message : String(error)}`,
          details: error,
          timestamp: new Date().toISOString()
        });
        isValidInput = false;
      }
    }
    
    if (!isValidInput && !options.skipValidation) {
      return {
        convertedWorkflow: { name: "Invalid workflow", nodes: [], connections: {}, active: false } as N8nWorkflow,
        logs,
        parametersNeedingReview,
        unmappedNodes,
        isValidInput: false
      };
    }
    
    // Start creating n8n workflow
    const n8nWorkflow: N8nWorkflow = {
      name: makeWorkflow.name,
      nodes: [],
      connections: {},
      active: makeWorkflow.active,
      settings: makeWorkflow.settings || {},
      tags: makeWorkflow.labels || [],
      version: makeWorkflow.version || 1
    };
    
    // Maps for module correlations
    const moduleIdMap: Record<string, string> = {};
    
    // Process each Make module
    for (const makeModule of makeWorkflow.modules) {
      try {
        // Use NodeMapper to convert the module
        const conversionResult = this.nodeMapper.convertMakeModuleToN8nNode(makeModule, {
          evaluateExpressions: options.evaluateExpressions,
          expressionContext: options.expressionContext,
          transformParameterValues: options.transformParameterValues !== false,
          debug: options.debug,
          copyNonMappedParameters: options.copyNonMappedParameters
        });
        
        const n8nNode = conversionResult.node as N8nNode;
        
        // Add to nodes array
        n8nWorkflow.nodes.push(n8nNode);
        
        // Store the correlation between Make and n8n IDs
        moduleIdMap[makeModule.id.toString()] = n8nNode.id;
        
        // Store debug information if requested
        if (options.debug && conversionResult.debug) {
          debug[`module-${makeModule.id}`] = conversionResult.debug;
        }
      } catch (error: any) {
        if (error.name === 'NodeMappingError') {
          // No mapping found for this module type
          unmappedNodes.push(makeModule.type);
          logs.push({
            type: "warning",
            message: `No mapping found for Make.com module type: ${makeModule.type}`,
            details: { moduleId: makeModule.id, moduleName: makeModule.name },
            timestamp: new Date().toISOString()
          });
          
          // Create a placeholder node
          const placeholderNode: N8nNode = {
            id: makeModule.id.toString(),
            name: `[UNMAPPED] ${makeModule.name}`,
            type: "placeholder",
            parameters: { originalType: makeModule.type },
            notes: `This node represents an unmapped Make.com module of type: ${makeModule.type}`
          };
          
          if (makeModule.position) {
            placeholderNode.position = makeModule.position;
          }
          
          n8nWorkflow.nodes.push(placeholderNode);
          moduleIdMap[makeModule.id.toString()] = placeholderNode.id;
        } else {
          // Other conversion error
          logs.push({
            type: "error",
            message: `Error converting Make module '${makeModule.name}' (${makeModule.type}): ${error instanceof Error ? error.message : String(error)}`,
            details: { error, moduleId: makeModule.id, moduleName: makeModule.name, moduleType: makeModule.type },
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Process routes to create connections
    for (const route of makeWorkflow.routes) {
      try {
        const sourceNodeId = moduleIdMap[route.sourceId.toString()];
        const targetNodeId = moduleIdMap[route.targetId.toString()];
        
        if (!sourceNodeId || !targetNodeId) {
          logs.push({
            type: "warning",
            message: `Skipping route - missing node mapping for source or target`,
            details: { sourceId: route.sourceId, targetId: route.targetId },
            timestamp: new Date().toISOString()
          });
          continue;
        }
        
        // Initialize connections object structure if needed
        if (!n8nWorkflow.connections[sourceNodeId]) {
          n8nWorkflow.connections[sourceNodeId] = { main: {} };
        }
        if (!n8nWorkflow.connections[sourceNodeId].main) {
          n8nWorkflow.connections[sourceNodeId].main = {};
        }
        
        // Determine output index based on route label
        let outputIndex = 0;
        if (route.label && route.label.startsWith('Output ')) {
          const match = route.label.match(/Output (\d+)/);
          if (match && match[1]) {
            outputIndex = parseInt(match[1]) - 1;
          }
        }
        
        // Initialize the output index array if needed
        if (!n8nWorkflow.connections[sourceNodeId].main[outputIndex]) {
          n8nWorkflow.connections[sourceNodeId].main[outputIndex] = [];
        }
        
        // Add the connection
        n8nWorkflow.connections[sourceNodeId].main[outputIndex].push({
          sourceNodeId,
          targetNodeId,
          sourceOutputIndex: outputIndex,
          targetInputIndex: 0
        });
      } catch (error: any) {
        logs.push({
          type: "error",
          message: `Error creating connection from module ${route.sourceId} to ${route.targetId}: ${error instanceof Error ? error.message : String(error)}`,
          details: { sourceId: route.sourceId, targetId: route.targetId },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Identify parameters that may need manual review
    const expressionsForReview = NodeParameterProcessor.identifyExpressionsForReview(makeWorkflow);
    for (const [path, info] of Object.entries(expressionsForReview)) {
      const reviewInfo = info as unknown as ExpressionReviewInfo;
      parametersNeedingReview.push(`${reviewInfo.nodeType} - ${path}: ${reviewInfo.reason}`);
    }
    
    return {
      convertedWorkflow: n8nWorkflow,
      logs,
      parametersNeedingReview,
      unmappedNodes,
      workflowHasFunction: parametersNeedingReview.length > 0,
      isValidInput,
      debug: options.debug ? debug : undefined
    };
  }

  private convertN8nNodeToMakeModule(n8nNode: N8nNode, context: ConversionContext): MakeModule {
    // Process any expressions in the parameters if needed
    if (context.evaluateExpressions && context.expressionContext && n8nNode.parameters) {
      n8nNode.parameters = NodeParameterProcessor.evaluateExpressions(
        n8nNode.parameters,
        context.expressionContext
      );
    }
    
    try {
      // Load the mapping database if not already passed in context
      const mappingDatabase = context.mappingDatabase || NodeMappingLoader.getInstance().getMappings();
      
      // Create a NodeMapper instance
      const nodeMapper = new NodeMapper(mappingDatabase);
      
      // Use the NodeMapper to convert the node
      const result = nodeMapper.convertN8nNodeToMakeModule(n8nNode);
      const makeModule = result.node as MakeModule;
      
      // Convert parameters
      const convertedParams = NodeParameterProcessor.convertN8nToMakeParameters(n8nNode.parameters);
      makeModule.parameters = convertedParams;
      
      return makeModule;
    } catch (error) {
      logger.error(`Error converting n8n node to Make module: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return a minimal Make module as a fallback
      return {
        id: parseInt(n8nNode.id, 10) || 1, // Convert string id to number
        name: n8nNode.name,
        type: n8nNode.type,
        parameters: n8nNode.parameters || {}
      };
    }
  }

  private convertMakeModuleToN8nNode(makeModule: MakeModule, context: ConversionContext): N8nNode {
    try {
      // Load the mapping database if not already passed in context
      const mappingDatabase = context.mappingDatabase || NodeMappingLoader.getInstance().getMappings();
      
      // Create a NodeMapper instance
      const nodeMapper = new NodeMapper(mappingDatabase);
      
      // Use the NodeMapper to convert the module
      const result = nodeMapper.convertMakeModuleToN8nNode(makeModule);
      const n8nNode = result.node as N8nNode;
      
      // Convert parameters
      const convertedParams = NodeParameterProcessor.convertMakeToN8nParameters(makeModule.parameters);
      n8nNode.parameters = convertedParams;
      
      return n8nNode;
    } catch (error) {
      logger.error(`Error converting Make module to n8n node: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return a minimal n8n node as a fallback
      return {
        id: String(makeModule.id),
        name: makeModule.name,
        type: makeModule.type,
        position: [0, 0],
        parameters: makeModule.parameters || {}
      };
    }
  }

  private ensureValidParameters(params: Record<string, any>): Record<string, any> {
    const validParams: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        validParams[key] = null;
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        validParams[key] = value;
      } else if (Array.isArray(value)) {
        validParams[key] = value.map(item => 
          this.ensureValidParameterValue(item)
        );
      } else if (typeof value === 'object') {
        validParams[key] = this.ensureValidParameters(value);
      } else {
        validParams[key] = String(value);
      }
    }

    return validParams;
  }

  private ensureValidParameterValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.ensureValidParameterValue(item));
    }

    if (typeof value === 'object') {
      return this.ensureValidParameters(value);
    }

    return String(value);
  }
}

// Export a singleton instance for convenience
let defaultMappingDatabase: NodeMappingDatabase | undefined;
let defaultConverter: WorkflowConverter | undefined;

/**
 * Get a default workflow converter instance
 * 
 * @returns The default workflow converter
 */
export function getWorkflowConverter(): WorkflowConverter {
  if (!defaultConverter) {
    if (!defaultMappingDatabase) {
      // Initialize mapping database from a file
      defaultMappingDatabase = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        mappings: {}
      };
      
      // In a real implementation, this would load mappings from a file or API
      try {
        // Here we would typically load from a file or API
        // For now, we'll just use an empty database
        logger.info('Initializing default mapping database');
      } catch (error) {
        logger.error('Failed to load default mappings', error);
      }
    }
    defaultConverter = new WorkflowConverter(defaultMappingDatabase);
  }
  return defaultConverter;
}

/**
 * Convert n8n workflow to Make.com using the default converter
 * 
 * @param n8nWorkflow - The n8n workflow to convert
 * @param options - Conversion options
 * @returns Conversion result
 */
export function convertN8nToMake(n8nWorkflow: N8nWorkflow, options: ConversionOptions = {}): ConversionResult {
  return getWorkflowConverter().convertN8nToMake(n8nWorkflow, options);
}

/**
 * Convert Make.com workflow to n8n using the default converter
 * 
 * @param makeWorkflow - The Make.com workflow to convert
 * @param options - Conversion options
 * @returns Conversion result
 */
export function convertMakeToN8n(makeWorkflow: MakeWorkflow, options: ConversionOptions = {}): ConversionResult {
  return getWorkflowConverter().convertMakeToN8n(makeWorkflow, options);
}

/**
 * Convert N8n node to Make module
 * 
 * @param node N8n node to convert
 * @param options Conversion options
 * @returns Converted Make module
 */
export function convertN8nNodeToMakeModule(
  node: N8nNode,
  options: ConversionOptions = {}
): MakeModule {
  // Process any expressions in the parameters if needed
  if (options.evaluateExpressions && options.expressionContext && node.parameters) {
    node.parameters = NodeParameterProcessor.evaluateExpressions(
      node.parameters,
      options.expressionContext
    );
  }
  
  try {
    // Load the mapping database if not already passed in options
    const mappingDatabase = options.mappingDatabase || NodeMappingLoader.getInstance().getMappings();
    
    // Create a NodeMapper instance
    const nodeMapper = new NodeMapper(mappingDatabase);
    
    // Use the NodeMapper to convert the node
    const result = nodeMapper.convertN8nNodeToMakeModule(node);
    const makeModule = result.node as MakeModule;
    
    // Apply any additional parameter conversions
    makeModule.parameters = NodeParameterProcessor.convertN8nToMakeParameters(
      makeModule.parameters,
      options.expressionContext
    );
    
    return makeModule;
  } catch (error) {
    logger.error(`Error converting n8n node to Make module: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return a minimal Make module as a fallback
    return {
      id: parseInt(node.id, 10) || 1, // Convert string id to number
      name: node.name,
      type: node.type,
      parameters: node.parameters || {}
    };
  }
}

/**
 * Convert Make module to N8n node
 * 
 * @param module Make module to convert
 * @param options Conversion options
 * @returns Converted N8n node
 */
export function convertMakeModuleToN8nNode(
  module: MakeModule,
  options: ConversionOptions = {}
): N8nNode {
  try {
    // Load the mapping database if not already passed in options
    const mappingDatabase = options.mappingDatabase || NodeMappingLoader.getInstance().getMappings();
    
    // Create a NodeMapper instance
    const nodeMapper = new NodeMapper(mappingDatabase);
    
    // Use the NodeMapper to convert the module
    const result = nodeMapper.convertMakeModuleToN8nNode(module);
    const n8nNode = result.node as N8nNode;
    
    // Process any expressions in the parameters if needed
    if (options.evaluateExpressions && options.expressionContext && n8nNode.parameters) {
      n8nNode.parameters = NodeParameterProcessor.convertMakeToN8nParameters(
        n8nNode.parameters,
        options.expressionContext
      );
    }
    
    return n8nNode;
  } catch (error) {
    logger.error(`Error converting Make module to n8n node: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return a minimal n8n node as a fallback
    return {
      id: String(module.id),
      name: module.name,
      type: module.type,
      position: [0, 0],
      parameters: module.parameters || {}
    };
  }
} 