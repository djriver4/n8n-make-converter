"use strict";
/**
 * Enhanced Workflow Converter
 *
 * This module provides an integration between the Node Mapping System
 * and Expression Evaluator for converting workflows between n8n and Make.com platforms.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowConverter = void 0;
exports.getWorkflowConverter = getWorkflowConverter;
exports.convertN8nToMake = convertN8nToMake;
exports.convertMakeToN8n = convertMakeToN8n;
exports.convertN8nNodeToMakeModule = convertN8nNodeToMakeModule;
exports.convertMakeModuleToN8nNode = convertMakeModuleToN8nNode;
const debug_tracker_1 = require("./debug-tracker");
const parameter_processor_1 = require("./converters/parameter-processor");
const logger_1 = __importDefault(require("./logger"));
// Import validation utilities
const validate_workflow_1 = require("./utils/validate-workflow");
const node_mapper_1 = require("./node-mappings/node-mapper");
const node_mapping_loader_1 = require("./node-mappings/node-mapping-loader");
// Import our new utility functions
const typescript_utils_1 = require("./utils/typescript-utils");
const workflow_converter_utils_1 = require("./utils/workflow-converter-utils");
// Import the compatibility layer
const compatibility_layer_1 = require("./utils/compatibility-layer");
// Import the performance logger
const performance_logger_1 = require("./performance-logger");
// Direction of node mapping conversion
var MappingDirection;
(function (MappingDirection) {
    MappingDirection["N8N_TO_MAKE"] = "n8n_to_make";
    MappingDirection["MAKE_TO_N8N"] = "make_to_n8n";
})(MappingDirection || (MappingDirection = {}));
/**
 * Main workflow converter class that handles conversion between n8n and Make.com
 */
class WorkflowConverter {
    /**
     * Create a new workflow converter
     *
     * @param mappingDatabase - The node mapping database to use
     * @param debugTracker - Optional debug tracker
     */
    constructor(mappingDatabase, debugTracker) {
        this.nodeMapper = new node_mapper_1.NodeMapper(mappingDatabase);
        this.debugTracker = debugTracker || new debug_tracker_1.DebugTracker();
        logger_1.default.info('WorkflowConverter initialized');
    }
    /**
     * Convert an n8n workflow to Make.com format
     *
     * @param n8nWorkflow - n8n workflow to convert
     * @param options - Conversion options
     * @returns Conversion result
     */
    convertN8nToMake(n8nWorkflow, options = {}) {
        const logs = [];
        const parametersNeedingReview = [];
        const unmappedNodes = [];
        const debug = {};
        // Validate input if not skipped
        let isValidInput = true;
        if (!options.skipValidation) {
            try {
                const validationResult = (0, validate_workflow_1.validateN8nWorkflow)(n8nWorkflow);
                isValidInput = validationResult.valid;
                if (!isValidInput) {
                    logs.push({
                        type: "error",
                        message: "Invalid n8n workflow format",
                        timestamp: new Date().toISOString()
                    });
                    return {
                        convertedWorkflow: { name: "Invalid workflow", modules: [], routes: [], active: false },
                        logs,
                        parametersNeedingReview,
                        unmappedNodes,
                        isValidInput: false
                    };
                }
            }
            catch (error) {
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
                convertedWorkflow: { name: "Invalid workflow", modules: [], routes: [], active: false },
                logs,
                parametersNeedingReview,
                unmappedNodes,
                isValidInput: false
            };
        }
        // Start creating Make workflow
        const makeWorkflow = {
            name: n8nWorkflow.name,
            modules: [],
            routes: [],
            active: n8nWorkflow.active,
            settings: n8nWorkflow.settings || {},
            labels: n8nWorkflow.tags || [],
            version: n8nWorkflow.version || 1
        };
        // Maps for node correlations
        const nodeIdMap = {};
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
                const makeModule = conversionResult.node;
                // Add to modules array
                (makeWorkflow.modules || []).push(makeModule);
                // Store the correlation between n8n and Make IDs
                nodeIdMap[n8nNode.id] = makeModule.id.toString();
                // Store debug information if requested
                if (options.debug && conversionResult.debug) {
                    debug[`node-${n8nNode.id}`] = conversionResult.debug;
                }
            }
            catch (error) {
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
                    const placeholderModule = {
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
                }
                else {
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
            if (!connections.main)
                continue;
            for (const [outputIndex, targetConnections] of Object.entries(connections.main)) {
                for (const connection of targetConnections) {
                    try {
                        // Skip if target node is undefined
                        if (!connection.node && !connection.targetNodeId) {
                            logger_1.default.warn(`Skipping connection with missing target node (source: ${sourceNodeId})`);
                            continue;
                        }
                        // Safely get the target node ID from either property
                        const targetNodeId = connection.targetNodeId || connection.node || '';
                        // Skip if source or target node ID is not in the map
                        if (!nodeIdMap[sourceNodeId] || !nodeIdMap[targetNodeId]) {
                            logger_1.default.warn(`Skipping connection due to missing node mapping (source: ${sourceNodeId}, target: ${targetNodeId})`);
                            continue;
                        }
                        const route = {
                            sourceId: nodeIdMap[sourceNodeId],
                            targetId: nodeIdMap[targetNodeId]
                        };
                        // Add output label if needed
                        if (parseInt(outputIndex) > 0) {
                            route.label = `Output ${parseInt(outputIndex) + 1}`;
                        }
                        (makeWorkflow.routes || []).push(route);
                    }
                    catch (error) {
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
        const expressionsForReview = parameter_processor_1.NodeParameterProcessor.identifyExpressionsForReview(n8nWorkflow);
        for (const [path, info] of Object.entries(expressionsForReview)) {
            const reviewInfo = info;
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
    convertMakeToN8n(makeWorkflow, options = {}) {
        var _a;
        const logs = [];
        const paramsNeedingReview = [];
        const unmappedNodes = [];
        const debug = {
            mappedModules: [],
            unmappedModules: [],
            mappedNodes: [],
            unmappedNodes: []
        };
        // First validate the input if not skipped
        if (!options.skipValidation) {
            const validationResult = (0, validate_workflow_1.validateMakeWorkflow)(makeWorkflow);
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
            const n8nWorkflow = {
                active: (_a = makeWorkflow.active) !== null && _a !== void 0 ? _a : false,
                connections: {},
                name: makeWorkflow.name || "Converted from Make.com",
                nodes: []
            };
            // Map to correlate make module ids with n8n node ids
            const moduleIdToNodeIdMap = {};
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
                    const nodeMapper = new node_mapper_1.NodeMapper();
                    const mapResult = nodeMapper.getMappedNode(module.type, MappingDirection.MAKE_TO_N8N);
                    if (mapResult.isValid && mapResult.mappedType) {
                        // Create n8n node
                        const node = (0, workflow_converter_utils_1.createSafeN8nNode)(module, mapResult.mappedType);
                        // Add to nodes array
                        n8nWorkflow.nodes.push(node);
                        // Store correlation
                        if ((0, typescript_utils_1.isDefined)(module.id) && (0, typescript_utils_1.isDefined)(node.id)) {
                            moduleIdToNodeIdMap[String(module.id)] = node.id;
                        }
                        debug.mappedModules.push({
                            id: module.id,
                            type: module.type,
                            mappedType: mapResult.mappedType
                        });
                    }
                    else {
                        // Handle unmapped node
                        (0, workflow_converter_utils_1.addToUnmappedNodes)(module.type, unmappedNodes);
                        logs.push({
                            type: "warning",
                            message: `No mapping found for module type "${module.type}"`,
                            timestamp: new Date().toISOString()
                        });
                        // Create a placeholder node
                        const placeholderNode = (0, workflow_converter_utils_1.createPlaceholderNode)(module);
                        n8nWorkflow.nodes.push(placeholderNode);
                        // Store correlation
                        if ((0, typescript_utils_1.isDefined)(module.id) && (0, typescript_utils_1.isDefined)(placeholderNode.id)) {
                            moduleIdToNodeIdMap[String(module.id)] = placeholderNode.id;
                        }
                        paramsNeedingReview.push({
                            nodeId: placeholderNode.id,
                            parameters: ["all"],
                            reason: `No mapping found for module type "${module.type}"`
                        });
                    }
                }
                catch (err) {
                    if (err instanceof node_mapper_1.NodeMappingError) {
                        logs.push({
                            type: "warning",
                            message: `Warning: ${err.message}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                    else {
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
                    if (!(0, typescript_utils_1.isDefined)(route.sourceId) || !(0, typescript_utils_1.isDefined)(route.targetId)) {
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
                    if (!(0, typescript_utils_1.isDefined)(sourceNodeId) || !(0, typescript_utils_1.isDefined)(targetNodeId)) {
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
                    const main = n8nWorkflow.connections[sourceNodeId].main;
                    if (!main["0"]) {
                        main["0"] = [];
                    }
                    // Create the connection and add it
                    main["0"].push((0, typescript_utils_1.createConnection)(targetNodeId));
                }
            }
            return {
                convertedWorkflow: n8nWorkflow,
                logs,
                paramsNeedingReview,
                unmappedNodes,
                debug
            };
        }
        catch (err) {
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
    convertN8nNodeToMakeModule(n8nNode, context) {
        // Process any expressions in the parameters if needed
        if (context.evaluateExpressions && context.expressionContext && n8nNode.parameters) {
            n8nNode.parameters = parameter_processor_1.NodeParameterProcessor.evaluateExpressions(n8nNode.parameters, context.expressionContext);
        }
        try {
            // Load the mapping database if not already passed in context
            const mappingDatabase = context.mappingDatabase || node_mapping_loader_1.NodeMappingLoader.getInstance().getMappings();
            // Create a NodeMapper instance
            const nodeMapper = new node_mapper_1.NodeMapper(mappingDatabase);
            // Use the NodeMapper to convert the node
            const result = nodeMapper.convertN8nNodeToMakeModule(n8nNode);
            const makeModule = result.node;
            // Convert parameters
            const convertedParams = parameter_processor_1.NodeParameterProcessor.convertN8nToMakeParameters(n8nNode.parameters);
            makeModule.parameters = convertedParams;
            return makeModule;
        }
        catch (error) {
            logger_1.default.error(`Error converting n8n node to Make module: ${error instanceof Error ? error.message : String(error)}`);
            // Return a minimal Make module as a fallback
            return {
                id: parseInt(n8nNode.id, 10) || 1, // Convert string id to number
                name: n8nNode.name,
                type: n8nNode.type,
                parameters: n8nNode.parameters || {}
            };
        }
    }
    convertMakeModuleToN8nNode(makeModule, context) {
        try {
            // Load the mapping database if not already passed in context
            const mappingDatabase = context.mappingDatabase || node_mapping_loader_1.NodeMappingLoader.getInstance().getMappings();
            // Create a NodeMapper instance
            const nodeMapper = new node_mapper_1.NodeMapper(mappingDatabase);
            // Use the NodeMapper to convert the module
            const result = nodeMapper.convertMakeModuleToN8nNode(makeModule);
            const n8nNode = result.node;
            // Convert parameters
            const convertedParams = parameter_processor_1.NodeParameterProcessor.convertMakeToN8nParameters(makeModule.parameters);
            n8nNode.parameters = convertedParams;
            return n8nNode;
        }
        catch (error) {
            logger_1.default.error(`Error converting Make module to n8n node: ${error instanceof Error ? error.message : String(error)}`);
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
    ensureValidParameters(params) {
        const validParams = {};
        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined) {
                validParams[key] = null;
            }
            else if (typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean') {
                validParams[key] = value;
            }
            else if (Array.isArray(value)) {
                validParams[key] = value.map(item => this.ensureValidParameterValue(item));
            }
            else if (typeof value === 'object') {
                validParams[key] = this.ensureValidParameters(value);
            }
            else {
                validParams[key] = String(value);
            }
        }
        return validParams;
    }
    ensureValidParameterValue(value) {
        if (value === null || value === undefined) {
            return null;
        }
        if (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean') {
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
exports.WorkflowConverter = WorkflowConverter;
// Export a singleton instance for convenience
let defaultMappingDatabase;
let defaultConverter;
/**
 * Get a default workflow converter instance
 *
 * @returns The default workflow converter
 */
function getWorkflowConverter() {
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
                logger_1.default.info('Initializing default mapping database');
            }
            catch (error) {
                logger_1.default.error('Failed to load default mappings', error);
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
function convertN8nToMake(n8nWorkflow, options = {}) {
    const performanceLogger = performance_logger_1.PerformanceLogger.getInstance();
    return performanceLogger.trackOperation('convertN8nToMake', () => {
        const converter = getWorkflowConverter();
        try {
            // Call the internal implementation with performance tracking
            const result = performanceLogger.trackOperation('internalConvertN8nToMake', () => converter.convertN8nToMake(n8nWorkflow, options), 'conversion');
            // Use the compatibility layer - with type assertion to work around type mismatch
            return performanceLogger.trackOperation('convertToLegacyResult', () => (0, compatibility_layer_1.convertToLegacyResult)(result), 'conversion');
        }
        catch (error) {
            // Handle errors using the compatibility layer
            const errorMessage = error instanceof Error ? error.message : String(error);
            return (0, compatibility_layer_1.createErrorConversionResult)(`Error converting workflow: ${errorMessage}`);
        }
    }, 'publicAPI');
}
/**
 * Convert Make.com workflow to n8n using the default converter
 *
 * @param makeWorkflow - The Make.com workflow to convert
 * @param options - Conversion options
 * @returns Conversion result in legacy format for backward compatibility
 */
function convertMakeToN8n(makeWorkflow, options = {}) {
    const performanceLogger = performance_logger_1.PerformanceLogger.getInstance();
    return performanceLogger.trackOperation('convertMakeToN8n', () => {
        // First validate the input if not skipped
        if (!options.skipValidation) {
            try {
                const validationResult = (0, validate_workflow_1.validateMakeWorkflow)(makeWorkflow);
                if (!validationResult.valid) {
                    // Return an invalid result with the specific error message the tests expect
                    return {
                        convertedWorkflow: {
                            name: "Invalid workflow",
                            nodes: [],
                            connections: {},
                            active: false
                        },
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
            }
            catch (error) {
                // Handle validation errors
                return {
                    convertedWorkflow: {
                        name: "Invalid workflow",
                        nodes: [],
                        connections: {},
                        active: false
                    },
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
            const result = performanceLogger.trackOperation('internalConvertMakeToN8n', () => converter.convertMakeToN8n(makeWorkflow, options), 'conversion');
            // Use the compatibility layer - with type assertion to work around type mismatch
            return performanceLogger.trackOperation('convertToLegacyResult', () => (0, compatibility_layer_1.convertToLegacyResult)(result), 'conversion');
        }
        catch (error) {
            // Handle errors using the compatibility layer
            const errorMessage = error instanceof Error ? error.message : String(error);
            return (0, compatibility_layer_1.createErrorConversionResult)(`Error converting workflow: ${errorMessage}`);
        }
    }, 'publicAPI');
}
/**
 * Convert N8n node to Make module
 *
 * @param node N8n node to convert
 * @param options Conversion options
 * @returns Converted Make module
 */
function convertN8nNodeToMakeModule(node, options = {}) {
    // Process any expressions in the parameters if needed
    if (options.evaluateExpressions && options.expressionContext && node.parameters) {
        node.parameters = parameter_processor_1.NodeParameterProcessor.evaluateExpressions(node.parameters, options.expressionContext);
    }
    try {
        // Load the mapping database if not already passed in options
        const mappingDatabase = options.mappingDatabase || node_mapping_loader_1.NodeMappingLoader.getInstance().getMappings();
        // Create a NodeMapper instance
        const nodeMapper = new node_mapper_1.NodeMapper(mappingDatabase);
        // Use the NodeMapper to convert the node
        const result = nodeMapper.convertN8nNodeToMakeModule(node);
        const makeModule = result.node;
        // Apply any additional parameter conversions
        makeModule.parameters = parameter_processor_1.NodeParameterProcessor.convertN8nToMakeParameters(makeModule.parameters, options.expressionContext);
        return makeModule;
    }
    catch (error) {
        logger_1.default.error(`Error converting n8n node to Make module: ${error instanceof Error ? error.message : String(error)}`);
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
function convertMakeModuleToN8nNode(module, options = {}) {
    try {
        // Load the mapping database if not already passed in options
        const mappingDatabase = options.mappingDatabase || node_mapping_loader_1.NodeMappingLoader.getInstance().getMappings();
        // Create a NodeMapper instance
        const nodeMapper = new node_mapper_1.NodeMapper(mappingDatabase);
        // Use the NodeMapper to convert the module
        const result = nodeMapper.convertMakeModuleToN8nNode(module);
        const n8nNode = result.node;
        // Process any expressions in the parameters if needed
        if (options.evaluateExpressions && options.expressionContext && n8nNode.parameters) {
            n8nNode.parameters = parameter_processor_1.NodeParameterProcessor.convertMakeToN8nParameters(n8nNode.parameters, options.expressionContext);
        }
        return n8nNode;
    }
    catch (error) {
        logger_1.default.error(`Error converting Make module to n8n node: ${error instanceof Error ? error.message : String(error)}`);
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
