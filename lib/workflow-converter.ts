/**
 * @file workflow-converter.ts
 * @description Core module for converting workflows between n8n and Make.com platforms
 * @module workflow-converter
 * 
 * This module provides the central functionality for workflow conversion, integrating
 * the Node Mapping System and Expression Evaluator. It handles the transformation
 * of workflow structures, node mapping, parameter processing, and connection preservation
 * between the n8n and Make.com automation platforms.
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

// Import the compatibility layer
import {
  convertToLegacyResult,
  convertToModernResult,
  createErrorConversionResult
} from "./utils/compatibility-layer";

// Import the performance logger
import { PerformanceLogger } from "./performance-logger";

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
    logger.info('Starting Make to n8n workflow conversion');
    // Create logs array
    const logs: ConversionLog[] = [];

    // Initialize items to track workflow conversion
    const paramsNeedingReview: ParameterReview[] = [];
    const unmappedNodes: string[] = [];
    const debugInfo: WorkflowDebugInfo = {
      mappedModules: [],
      unmappedModules: [],
      mappedNodes: [],
      unmappedNodes: []
    };

    // Validate input unless we're skipping validation
    if (!options.skipValidation) {
      const validationResult = validateMakeWorkflow(makeWorkflow);
      
      if (!validationResult.valid) {
        const errorMessage = `Invalid Make.com workflow format - ${validationResult.errors ? validationResult.errors.join(", ") : "Unknown error"}`;
        this.debugTracker.addLog('error', errorMessage);
        
        logs.push({
          type: "error",
          message: errorMessage,
          timestamp: new Date().toISOString()
        });
        
        logger.error(`Make workflow validation failed: ${errorMessage}`);
        
        return {
          convertedWorkflow: {
            active: false,
            connections: {},
            name: "",
            nodes: []
          },
          logs,
          paramsNeedingReview: [],
          unmappedNodes: [],
          debug: debugInfo
        };
      }
      
      if (validationResult.workflow) {
        makeWorkflow = validationResult.workflow;
      }
    }

    // If validation is disabled or validation passes, proceed with conversion
    try {
      logger.info(`Make workflow name: "${makeWorkflow.name || 'Unnamed workflow'}"`);
      logger.debug(`Make workflow has ${makeWorkflow.flow?.length || 0} modules`);
      
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
      const moduleSource = makeWorkflow.flow || makeWorkflow.modules || [];
      logger.info(`Processing ${moduleSource.length} Make modules`);
      
      for (const module of moduleSource) {
        try {
          if (!module.type) {
            logger.warn(`Module ${module.id} is missing a type`);
            logs.push({
              type: "warning",
              message: `Module ${module.id} is missing a type`,
              timestamp: new Date().toISOString()
            });
            continue;
          }

          logger.debug(`Converting module ${String(module.id)} of type ${module.type}`);
          
          const nodeMapper = new NodeMapper();
          const mapResult = nodeMapper.getMappedNode(
            module.type,
            MappingDirection.MAKE_TO_N8N
          );

          if (mapResult.isValid && mapResult.mappedType) {
            logger.debug(`Found mapping for module type ${module.type} -> ${mapResult.mappedType}`);
            // Create n8n node
            const node = createSafeN8nNode(module, mapResult.mappedType);
            
            // Add the node to the workflow
            n8nWorkflow.nodes.push(node);
            
            // Add to the mapping
            if (module.id) {
              moduleIdToNodeIdMap[String(module.id)] = node.id;
            }
            
            // Track for debug info
            debugInfo.mappedModules.push({
              id: module.id,
              type: module.type,
              mappedType: mapResult.mappedType
            });
          } else {
            // Try to use the node mapper directly for conversion
            try {
              logger.debug(`Using NodeMapper to convert module ${module.id}`);
              const conversionResult = nodeMapper.convertMakeModuleToN8nNode(module);
              const n8nNode = conversionResult.node as N8nNode;
              
              // Add the node to the workflow
              n8nWorkflow.nodes.push(n8nNode);
              
              // Add to the mapping
              if (module.id) {
                moduleIdToNodeIdMap[String(module.id)] = n8nNode.id;
              }
              
              // Log the success
              logger.info(`Successfully converted module ${String(module.id)} to ${n8nNode.type}`);
              
              // If it's a special fallback conversion, track it for review
              if (conversionResult.debug?.usedFallback) {
                paramsNeedingReview.push({
                  nodeId: n8nNode.id,
                  parameters: ['all'],
                  reason: `Used fallback conversion for module type "${module.type}"`
                });
                
                logs.push({
                  type: "info",
                  message: `Used fallback conversion for module type "${module.type}"`,
                  timestamp: new Date().toISOString()
                });
              }
              
              // Track for debug info
              debugInfo.mappedModules.push({
                id: module.id,
                type: module.type,
                mappedType: n8nNode.type
              });
            } catch (error) {
              logger.error(`Failed to convert module ${String(module.id)}: ${error}`);
              
              // Track unmapped node
              unmappedNodes.push(module.type || 'unknown');
              
              // Create a placeholder node
              const placeholderNode: N8nNode = {
                id: module.id ? String(module.id) : generateNodeId(),
                name: module.name || `Unconverted Module ${String(module.id || '')}`,
                type: 'n8n-nodes-base.noOp',
                parameters: {
                  __stubInfo: {
                    originalModuleType: module.type,
                    moduleId: module.id,
                    originalName: module.name || '',
                    message: `No mapping found for module type: ${module.type}`,
                    moduleParameters: module.parameters || {}
                  },
                  displayName: `Placeholder for ${module.name || module.type}`,
                  notes: `This node represents an unmapped module of type "${module.type}" from the original Make.com workflow. Review and replace with appropriate n8n node.`
                },
                position: module.position ? [module.position[0] || 0, module.position[1] || 0] : [0, 0],
                typeVersion: 1
              };
              
              // Add the placeholder to the workflow
              n8nWorkflow.nodes.push(placeholderNode);
              
              // Add to the mapping
              if (module.id) {
                moduleIdToNodeIdMap[String(module.id)] = placeholderNode.id;
              }
              
              // Track for debug info
              debugInfo.unmappedModules.push({
                id: module.id,
                type: module.type
              });
              
              // Parameter needs review
              paramsNeedingReview.push({
                nodeId: placeholderNode.id,
                parameters: ['all'],
                reason: `No mapping found for module type "${module.type}"`
              });
              
              // Log warning for unmapped node
              logs.push({
                type: "warning",
                message: `No mapping found for module type "${module.type}"`,
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          logger.error(`Error processing module ${String(module.id)}: ${error}`);
          
          logs.push({
            type: "error",
            message: `Error processing module ${String(module.id)}: ${error}`,
            timestamp: new Date().toISOString()
          });
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

      // Add "Conversion complete" log message
      logs.push({
        type: "info",
        message: "Conversion complete",
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Conversion completed with ${n8nWorkflow.nodes.length} nodes created and ${unmappedNodes.length} unmapped nodes`);

      return {
        convertedWorkflow: n8nWorkflow,
        logs,
        paramsNeedingReview,
        unmappedNodes,
        debug: debugInfo
      };
    } catch (error) {
      logger.error(`Conversion failed: ${error}`);
      
      logs.push({
        type: "error",
        message: `Conversion failed: ${error}`,
        timestamp: new Date().toISOString()
      });

      return {
        convertedWorkflow: {
          active: false,
          connections: {},
          name: "",
          nodes: []
        },
        logs,
        paramsNeedingReview: [],
        unmappedNodes: [],
        debug: debugInfo
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
 * @returns Conversion result in legacy format for backward compatibility
 */
export function convertN8nToMake(
  n8nWorkflow: N8nWorkflow,
  options: ConversionOptions = {}
): ConversionResult {
  const performanceLogger = PerformanceLogger.getInstance();
  
  return performanceLogger.trackOperation(
    'convertN8nToMake',
    () => {
      const converter = getWorkflowConverter();
      
      try {
        // Call the internal implementation with performance tracking
        const result = performanceLogger.trackOperation(
          'internalConvertN8nToMake',
          () => converter.convertN8nToMake(n8nWorkflow, options),
          'conversion'
        );
        
        // Use the compatibility layer - with type assertion to work around type mismatch
        return performanceLogger.trackOperation(
          'convertToLegacyResult',
          () => convertToLegacyResult(result as any),
          'conversion'
        );
      } catch (error: any) {
        // Handle errors using the compatibility layer
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createErrorConversionResult(`Error converting workflow: ${errorMessage}`);
      }
    },
    'publicAPI'
  );
}

/**
 * Convert Make.com workflow to n8n using the default converter
 * 
 * @param makeWorkflow - The Make.com workflow to convert
 * @param options - Conversion options
 * @returns Conversion result in legacy format for backward compatibility
 */
export function convertMakeToN8n(
  makeWorkflow: MakeWorkflow,
  options: ConversionOptions = {}
): ConversionResult {
  const performanceLogger = PerformanceLogger.getInstance();
  
  return performanceLogger.trackOperation(
    'convertMakeToN8n',
    () => {
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
        // Call the internal implementation with performance tracking
        const result = performanceLogger.trackOperation(
          'internalConvertMakeToN8n',
          () => converter.convertMakeToN8n(makeWorkflow, options),
          'conversion'
        );
        
        // Use the compatibility layer - with type assertion to work around type mismatch
        return performanceLogger.trackOperation(
          'convertToLegacyResult',
          () => convertToLegacyResult(result as any),
          'conversion'
        );
      } catch (error: any) {
        // Handle errors using the compatibility layer
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createErrorConversionResult(`Error converting workflow: ${errorMessage}`);
      }
    },
    'publicAPI'
  );
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