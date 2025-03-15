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
import { NodeMapper, NodeMappingError } from "./node-mappings/node-mapper";
import { NodeMappingLoader } from "./node-mappings/node-mapping-loader";
import { NodeMappingDatabase } from "./node-mappings/schema";
// Import our new utility functions
import {
  generateNodeId,
  isDefined,
  isN8nWorkflow,
  isMakeWorkflow,
  initializeConnectionsForNode,
  getOrInitializeOutputConnections,
  createConnection,
  ensureMakeModule,
  ensureN8nNode,
  safeGet
} from "./utils/typescript-utils";
import {
  createPlaceholderNode,
  createPlaceholderModule,
  createSafeN8nNode,
  addToUnmappedNodes,
  createRouteFromNodeConnection,
  createSafeMakeRoute,
  safeMapNodeId
} from "./utils/workflow-converter-utils";
import {
  toConversionResult,
  toWorkflowConversionResult
} from "./utils/interface-adapters";

// Direction of node mapping conversion
enum MappingDirection {
  N8N_TO_MAKE = 'n8n_to_make',
  MAKE_TO_N8N = 'make_to_n8n'
}

// Define log structure
export interface ConversionLog {
  type: "info" | "warning" | "error";
  message: string;
  details?: any;
  timestamp?: string;
}

// Define parameter review structure
export interface ParameterReview {
  nodeId: string;
  parameters: string[];
  reason: string;
}

// Define workflow debug info structure
export interface WorkflowDebugInfo {
  mappedModules: Array<{id?: string | number, type?: string, mappedType?: string}>;
  unmappedModules: Array<{id?: string | number, type?: string}>;
  mappedNodes: Array<{id?: string, type?: string, mappedType?: string}>;
  unmappedNodes: Array<{id?: string, type?: string}>;
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

// Define workflow conversion result structure
export interface WorkflowConversionResult {
  convertedWorkflow: N8nWorkflow | MakeWorkflow;
  logs: ConversionLog[];
  paramsNeedingReview: ParameterReview[];
  unmappedNodes: string[];
  debug: WorkflowDebugInfo;
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

// Define workflow conversion options structure
export interface WorkflowConversionOptions {
  skipValidation?: boolean;
  debug?: boolean;
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
        (makeWorkflow.modules || []).push(makeModule);
        
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
          
          (makeWorkflow.modules || []).push(placeholderModule);
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
            // Skip if target node is undefined
            if (!connection.node && !connection.targetNodeId) {
              logger.warn(`Skipping connection with missing target node (source: ${sourceNodeId})`);
              continue;
            }
            
            // Safely get the target node ID from either property
            const targetNodeId = connection.targetNodeId || connection.node || '';
            
            // Skip if source or target node ID is not in the map
            if (!nodeIdMap[sourceNodeId] || !nodeIdMap[targetNodeId]) {
              logger.warn(`Skipping connection due to missing node mapping (source: ${sourceNodeId}, target: ${targetNodeId})`);
              continue;
            }
            
            const route: MakeRoute = {
              sourceId: nodeIdMap[sourceNodeId],
              targetId: nodeIdMap[targetNodeId]
            };
            
            // Add output label if needed
            if (parseInt(outputIndex) > 0) {
              route.label = `Output ${parseInt(outputIndex) + 1}`;
            }
            
            (makeWorkflow.routes || []).push(route);
          } catch (error: any) {
            const targetNodeIdForLogging = connection.targetNodeId || connection.node || 'unknown';
            logs.push({
              type: "error",
              message: `Error creating route from node ${sourceNodeId} to ${targetNodeIdForLogging}: ${error instanceof Error ? error.message : String(error)}`,
              details: { sourceNodeId, targetNodeId: targetNodeIdForLogging, outputIndex },
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
  convertMakeToN8n(
    makeWorkflow: MakeWorkflow,
    options: WorkflowConversionOptions = {}
  ): WorkflowConversionResult {
    const logs: ConversionLog[] = [];
    const paramsNeedingReview: ParameterReview[] = [];
    const unmappedNodes: string[] = [];
    const debug: WorkflowDebugInfo = {
      mappedModules: [],
      unmappedModules: [],
      mappedNodes: [],
      unmappedNodes: []
    };

    // First validate the input if not skipped
    if (!options.skipValidation) {
      const validationResult = validateMakeWorkflow(makeWorkflow);
      if (!validationResult.valid) {
        logs.push({
          type: "error",
          message: `Invalid Make.com workflow format - ${validationResult.errors ? validationResult.errors.join(", ") : "Unknown error"}`,
          timestamp: new Date().toISOString()
        });
        return {
          convertedWorkflow: {
            active: false,
            connections: {},
            name: "Invalid workflow",
            nodes: []
          },
          logs,
          paramsNeedingReview,
          unmappedNodes,
          debug
        };
      }
      
      // Use the validated workflow for further processing
      if (validationResult.workflow) {
        makeWorkflow = validationResult.workflow;
      }
    }

    // If validation is disabled or validation passes, proceed with conversion
    try {
      // Initialize n8n workflow object
      const n8nWorkflow: N8nWorkflow = {
        active: makeWorkflow.active ?? false,
        connections: {},
        name: makeWorkflow.name || "Converted from Make.com",
        nodes: []
      };

      // Map to correlate make module ids with n8n node ids
      const moduleIdToNodeIdMap: Record<string, string> = {};

      // Process each module
      for (const module of makeWorkflow.modules || []) {
        try {
          if (!module.type) {
            logs.push({
              type: "warning",
              message: `Module ${module.id} is missing a type`,
              timestamp: new Date().toISOString()
            });
            continue;
          }

          const nodeMapper = new NodeMapper();
          const mapResult = nodeMapper.getMappedNode(
            module.type,
            MappingDirection.MAKE_TO_N8N
          );

          if (mapResult.isValid && mapResult.mappedType) {
            // Create n8n node
            const node = createSafeN8nNode(module, mapResult.mappedType);
            
            // Add to nodes array
            n8nWorkflow.nodes.push(node);

            // Store correlation
            if (isDefined(module.id) && isDefined(node.id)) {
              moduleIdToNodeIdMap[String(module.id)] = node.id;
            }

            debug.mappedModules.push({
              id: module.id,
              type: module.type,
              mappedType: mapResult.mappedType
            });
          } else {
            // Handle unmapped node
            addToUnmappedNodes(module.type, unmappedNodes);
            logs.push({
              type: "warning",
              message: `No mapping found for module type "${module.type}"`,
              timestamp: new Date().toISOString()
            });

            // Create a placeholder node
            const placeholderNode = createPlaceholderNode(module);
            n8nWorkflow.nodes.push(placeholderNode);

            // Store correlation
            if (isDefined(module.id) && isDefined(placeholderNode.id)) {
              moduleIdToNodeIdMap[String(module.id)] = placeholderNode.id;
            }

            paramsNeedingReview.push({
              nodeId: placeholderNode.id,
              parameters: ["all"],
              reason: `No mapping found for module type "${module.type}"`
            });
          }
        } catch (err) {
          if (err instanceof NodeMappingError) {
            logs.push({
              type: "warning",
              message: `Warning: ${err.message}`,
              timestamp: new Date().toISOString()
            });
          } else {
            logs.push({
              type: "error",
              message: `Error processing module ${module.id}: ${err}`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      // Process routes to create connections
      if (makeWorkflow.routes) {
        for (const route of makeWorkflow.routes) {
          // Skip if source or target IDs are missing
          if (!isDefined(route.sourceId) || !isDefined(route.targetId)) {
            logs.push({
              type: "warning",
              message: `Route missing source or target ID: ${JSON.stringify(route)}`,
              timestamp: new Date().toISOString()
            });
            continue;
          }

          // Get source and target node IDs from the map
          const sourceIdStr = String(route.sourceId);
          const targetIdStr = String(route.targetId);
          
          const sourceNodeId = moduleIdToNodeIdMap[sourceIdStr];
          const targetNodeId = moduleIdToNodeIdMap[targetIdStr];

          // Skip if source or target node not found
          if (!isDefined(sourceNodeId) || !isDefined(targetNodeId)) {
            logs.push({
              type: "warning",
              message: `Could not map route - missing node ID mapping for: sourceId=${route.sourceId}, targetId=${route.targetId}`,
              timestamp: new Date().toISOString()
            });
            continue;
          }

          // Initialize connections object for source node if not exists
          if (!n8nWorkflow.connections[sourceNodeId]) {
            n8nWorkflow.connections[sourceNodeId] = { main: {} };
          }
          
          // Get or initialize the output connections array
          if (!n8nWorkflow.connections[sourceNodeId].main) {
            n8nWorkflow.connections[sourceNodeId].main = {};
          }
          
          // Ensure the main object is properly initialized as a record
          const main = n8nWorkflow.connections[sourceNodeId].main as Record<string, N8nConnection[]>;
          if (!main["0"]) {
            main["0"] = [];
          }
          
          // Create the connection and add it
          main["0"].push(createConnection(targetNodeId));
        }
      }

      return {
        convertedWorkflow: n8nWorkflow,
        logs,
        paramsNeedingReview,
        unmappedNodes,
        debug
      };
    } catch (err) {
      logs.push({
        type: "error",
        message: `Error during conversion: ${err}`,
        timestamp: new Date().toISOString()
      });
      return {
        convertedWorkflow: {
          active: false,
          connections: {},
          name: "Error during conversion",
          nodes: []
        },
        logs,
        paramsNeedingReview,
        unmappedNodes,
        debug
      };
    }
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
        id: String(makeModule.id || ''),
        name: makeModule.name || 'Converted Module',
        type: makeModule.type || 'unknown',
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
export function convertN8nToMake(
  n8nWorkflow: N8nWorkflow,
  options: ConversionOptions = {}
): ConversionResult {
  const converter = getWorkflowConverter();
  
  try {
    // Call the internal implementation
    const result = converter.convertN8nToMake(n8nWorkflow, options);
    
    // Create a properly formatted ConversionResult using string params from ParameterReview objects
    const formattedParamReviews: string[] = [];
    
    // Safely access and process parameter reviews
    const paramReviews = (result as any).paramsNeedingReview;
    if (Array.isArray(paramReviews)) {
      for (const param of paramReviews) {
        if (param && typeof param === 'object' && 'nodeId' in param && 'parameters' in param && 'reason' in param) {
          formattedParamReviews.push(`${param.nodeId} - ${param.parameters.join(', ')}: ${param.reason}`);
        }
      }
    }
    
    // Check for validation errors in the logs
    const hasValidationErrors = result.logs.some((log: any) => {
      // Only process string logs
      if (typeof log === 'string') {
        return log.includes('Invalid');
      } 
      // For object logs, check the message property
      else if (log && typeof log === 'object' && typeof log.message === 'string') {
        return log.message.includes('Invalid');
      }
      return false;
    });
    
    // Return a properly formatted ConversionResult
    return {
      convertedWorkflow: result.convertedWorkflow,
      logs: result.logs.map(log => typeof log === 'string' 
        ? { type: 'info', message: log, timestamp: new Date().toISOString() } as ConversionLog
        : log as unknown as ConversionLog
      ),
      parametersNeedingReview: formattedParamReviews,
      unmappedNodes: result.unmappedNodes || [],
      isValidInput: !hasValidationErrors,
      debug: options.debug ? result.debug : undefined
    };
  } catch (error: any) {
    // Handle errors and return a minimal result
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      convertedWorkflow: { 
        name: "Error", 
        modules: [], 
        routes: [],
        active: false
      } as MakeWorkflow,
      logs: [{ type: 'error', message: `Error converting workflow: ${errorMessage}`, timestamp: new Date().toISOString() }],
      parametersNeedingReview: [],
      unmappedNodes: [],
      isValidInput: false
    };
  }
}

/**
 * Convert Make.com workflow to n8n using the default converter
 * 
 * @param makeWorkflow - The Make.com workflow to convert
 * @param options - Conversion options
 * @returns Conversion result
 */
export function convertMakeToN8n(
  makeWorkflow: MakeWorkflow,
  options: ConversionOptions = {}
): ConversionResult {
  // First validate the input if not skipped
  if (!options.skipValidation) {
    try {
      const validationResult = validateMakeWorkflow(makeWorkflow);
      if (!validationResult.valid) {
        // Return an invalid result with the specific error message the tests expect
        return {
          convertedWorkflow: { 
            name: "Invalid workflow", 
            nodes: [], 
            connections: {},
            active: false
          } as N8nWorkflow,
          logs: [{ 
            type: 'error', 
            message: 'Invalid Make.com workflow format', 
            timestamp: new Date().toISOString() 
          }],
          parametersNeedingReview: [],
          unmappedNodes: [],
          isValidInput: false
        };
      }
      
      // Use the validated workflow for further processing
      if (validationResult.workflow) {
        makeWorkflow = validationResult.workflow;
      }
    } catch (error) {
      // Handle validation errors
      return {
        convertedWorkflow: { 
          name: "Invalid workflow", 
          nodes: [], 
          connections: {},
          active: false
        } as N8nWorkflow,
        logs: [{ 
          type: 'error', 
          message: `Error validating workflow: ${error instanceof Error ? error.message : String(error)}`, 
          timestamp: new Date().toISOString() 
        }],
        parametersNeedingReview: [],
        unmappedNodes: [],
        isValidInput: false
      };
    }
  }
  
  const converter = getWorkflowConverter();
  
  try {
    // Call the internal implementation
    const result = converter.convertMakeToN8n(makeWorkflow, options);
    
    // Create a properly formatted ConversionResult using string params from ParameterReview objects
    const formattedParamReviews: string[] = [];
    
    // Safely access and process parameter reviews
    const paramReviews = (result as any).paramsNeedingReview;
    if (Array.isArray(paramReviews)) {
      for (const param of paramReviews) {
        if (param && typeof param === 'object' && 'nodeId' in param && 'parameters' in param && 'reason' in param) {
          formattedParamReviews.push(`${param.nodeId} - ${param.parameters.join(', ')}: ${param.reason}`);
        }
      }
    }
    
    // Return a properly formatted ConversionResult
    return {
      convertedWorkflow: result.convertedWorkflow,
      logs: result.logs.map(log => typeof log === 'string' 
        ? { type: 'info', message: log, timestamp: new Date().toISOString() } as ConversionLog
        : log as unknown as ConversionLog
      ),
      parametersNeedingReview: formattedParamReviews,
      unmappedNodes: result.unmappedNodes || [],
      isValidInput: true,
      debug: options.debug ? result.debug : undefined
    };
  } catch (error: any) {
    // Handle errors and return a minimal result
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      convertedWorkflow: { 
        name: "Error", 
        nodes: [], 
        connections: {},
        active: false
      } as N8nWorkflow,
      logs: [{ type: 'error', message: `Error converting workflow: ${errorMessage}`, timestamp: new Date().toISOString() }],
      parametersNeedingReview: [],
      unmappedNodes: [],
      isValidInput: false
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
      id: String(module.id || ''),
      name: module.name || 'Converted Module',
      type: module.type || 'unknown',
      position: [0, 0],
      parameters: module.parameters || {}
    };
  }
} 