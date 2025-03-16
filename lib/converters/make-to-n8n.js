"use strict";
/**
 * Make.com to n8n Converter
 *
 * This module converts Make.com workflows to n8n format
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeToN8n = makeToN8n;
const node_mapping_1 = require("../mappings/node-mapping");
const logger_1 = __importDefault(require("../logger"));
const node_mapper_1 = require("../node-mappings/node-mapper");
const node_mapping_loader_1 = require("../node-mappings/node-mapping-loader");
const workflow_converter_utils_1 = require("../utils/workflow-converter-utils");
/**
 * Helper function to generate a unique node ID
 */
function generateNodeId() {
    return Math.random().toString(36).substring(2, 15);
}
/**
 * Helper function to get node mapping
 */
function getNodeMapping(moduleType, direction) {
    const mappings = (0, node_mapping_1.getNodeMappings)();
    if (!moduleType || !mappings) {
        return null;
    }
    // Use type assertion to handle the indexing
    const directionMappings = mappings[direction];
    if (!directionMappings || !directionMappings[moduleType]) {
        return null;
    }
    return directionMappings[moduleType];
}
/**
 * Helper function to map Make module types to n8n node types
 */
function mapMakeModuleToN8nNodeType(moduleType) {
    if (!moduleType) return 'n8n-nodes-base.noOp';
    
    switch (moduleType.toLowerCase()) {
        case 'http':
            return 'n8n-nodes-base.httpRequest';
        case 'setVariable':
            return 'n8n-nodes-base.set';
        case 'json':
            return 'n8n-nodes-base.code';
        case 'router':
            return 'n8n-nodes-base.switch';
        case 'scheduler':
        case 'timer':
            return 'n8n-nodes-base.schedule';
        case 'webhook':
            return 'n8n-nodes-base.webhook';
        default:
            return 'n8n-nodes-base.noOp';
    }
}
/**
 * Helper function to get position from module
 */
function getPositionFromModule(module) {
    if (module.position && Array.isArray(module.position) && module.position.length === 2) {
        return module.position;
    }
    return [0, 0];
}
/**
 * Convert a Make.com workflow to n8n format
 *
 * @param makeWorkflow - The Make.com workflow to convert
 * @param debugTracker - Optional debug tracker
 * @param options - Conversion options
 * @returns A promise resolving to the conversion result
 */
function makeToN8n(makeWorkflow_1, debugTracker_1) {
    return __awaiter(this, arguments, void 0, function* (makeWorkflow, debugTracker, options = {}) {
        var _a, _b;
        debugTracker.addLog("info", "Starting Make.com to n8n conversion");
        // Create default empty workflow structure
        const emptyWorkflow = {
            name: "Empty Workflow",
            nodes: [],
            connections: {},
            active: true,
            settings: {
                executionOrder: "v1",
            }
        };
        try {
            // Initialize the node mapper
            const mappingLoader = node_mapping_loader_1.NodeMappingLoader.getInstance();
            yield mappingLoader.loadMappings();
            const mappingDatabase = mappingLoader.getMappings();
            const nodeMapper = new node_mapper_1.NodeMapper(mappingDatabase);
            
            // Log that we're using the NodeMapper
            if (options.useEnhancedMapper) {
                logger_1.default.info('Using enhanced node mapper for conversion');
            }
            else {
                logger_1.default.info('Using basic node mapper for conversion');
            }
            debugTracker.addLog("info", "NodeMapper initialized with mapping database");
            
            // Validate the Make.com workflow
            if (!makeWorkflow) {
                debugTracker.addLog("error", "Invalid Make.com workflow: Source workflow is empty");
                return {
                    convertedWorkflow: {},
                    logs: debugTracker.getGeneralLogs(),
                    parametersNeedingReview: []
                };
            }
            // Handle legacy format
            if (makeWorkflow.blueprint && makeWorkflow.modules) {
                debugTracker.addLog("info", "Converting legacy Make.com workflow format");
                makeWorkflow = {
                    name: makeWorkflow.blueprint.name || "Legacy Workflow",
                    flow: makeWorkflow.modules
                };
            }
            // Validate the Make.com workflow has a flow array
            if (!makeWorkflow.flow || !Array.isArray(makeWorkflow.flow)) {
                debugTracker.addLog("error", "Invalid Make.com workflow format: Missing or invalid flow array");
                return {
                    convertedWorkflow: {},
                    logs: debugTracker.getGeneralLogs(),
                    parametersNeedingReview: []
                };
            }
            // Get the node mappings
            const mappings = (0, node_mapping_1.getNodeMappings)();
            // Create the n8n workflow structure
            const n8nWorkflow = {
                name: makeWorkflow.name || "Converted from Make.com",
                nodes: [],
                connections: {},
                active: true,
                settings: {
                    executionOrder: "v1",
                },
            };
            // Track modules that couldn't be converted
            const unconvertedModules = [];
            // Special handling for specific node types that need manual review
            const nodesToReview = [];
            const parametersNeedingReview = {};
            // Look for specific module types that likely need manual adjustment
            for (const module of (makeWorkflow.flow || [])) {
                if (module.type === 'tools' && ((_a = module.parameters) === null || _a === void 0 ? void 0 : _a.code)) {
                    // Function/code modules often need review
                    parametersNeedingReview[`Node Tools, parameter functionCode`] = {
                        nodeType: 'n8n-nodes-base.function',
                        reason: 'Complex expression needs review'
                    };
                }
            }
            // Convert each Make.com module to an n8n node
            const moduleToNodeMap = {};
            for (const module of makeWorkflow.flow) {
                try {
                    // Skip disabled modules if specified in options
                    if (options.skipDisabled && module.disabled) {
                        debugTracker.addLog("info", `Skipping disabled module: ${module.label || module.name}`);
                        continue;
                    }
                    
                    // Use the NodeMapper to convert the module
                    try {
                        debugTracker.addLog("info", `Converting module ${module.id} using NodeMapper`);
                        const conversionResult = nodeMapper.convertMakeModuleToN8nNode(module);
                        const n8nNode = conversionResult.node;
                        
                        // Ensure we have an ID and position
                        n8nNode.id = options.preserveIds ? String(module.id) : String(n8nWorkflow.nodes.length + 1);
                        n8nNode.position = n8nNode.position || [
                            (n8nWorkflow.nodes.length * 200),
                            0
                        ];
                        
                        // Add the node to the workflow
                        n8nWorkflow.nodes.push(n8nNode);
                        
                        // Map module ID to n8n node for connection processing
                        moduleToNodeMap[module.id] = n8nNode;
                        
                        debugTracker.addLog("info", `Converted module ${module.id} to node type ${n8nNode.type}`);
                    } catch (error) {
                        // Log the error and create a placeholder node instead
                        debugTracker.addLog("error", `Failed to convert module ${module.id}: ${error instanceof Error ? error.message : String(error)}`);
                        
                        // Create a placeholder node using the imported function
                        const placeholderNode = (0, workflow_converter_utils_1.createPlaceholderNode)(module);
                        
                        // Preserve ID if requested
                        if (options.preserveIds && module.id) {
                            placeholderNode.id = String(module.id);
                        }
                        
                        // Properly position the node
                        placeholderNode.position = [
                            (n8nWorkflow.nodes.length * 200),
                            0
                        ];
                        
                        n8nWorkflow.nodes.push(placeholderNode);
                        moduleToNodeMap[module.id] = placeholderNode;
                    }
                }
                catch (error) {
                    debugTracker.addLog("error", `Error converting module ${module.label || module.name}: ${error instanceof Error ? error.message : String(error)}`);
                    unconvertedModules.push(module.label || module.name);
                }
            }
            // Process connections between modules (routes)
            if (makeWorkflow.routes && makeWorkflow.routes.length > 0) {
                debugTracker.addLog("info", `Processing ${makeWorkflow.routes.length} routes`);
                
                for (const route of makeWorkflow.routes) {
                    if (!route.sourceId || !route.targetId) {
                        debugTracker.addLog("warning", "Skipping invalid route: Missing source or target ID");
                        continue;
                    }
                    
                    // Get source and target nodes from the map
                    const sourceNode = moduleToNodeMap[route.sourceId];
                    const targetNode = moduleToNodeMap[route.targetId];
                    
                    if (!sourceNode || !targetNode) {
                        debugTracker.addLog("warning", `Skipping route: Could not find source or target node (source: ${route.sourceId}, target: ${route.targetId})`);
                        continue;
                    }
                    
                    // Initialize connections for this source node if it doesn't exist
                    if (!n8nWorkflow.connections[sourceNode.name]) {
                        n8nWorkflow.connections[sourceNode.name] = { main: {} };
                    }
                    
                    // Initialize the main output connections if it doesn't exist or is empty
                    if (!n8nWorkflow.connections[sourceNode.name].main) {
                        n8nWorkflow.connections[sourceNode.name].main = {};
                    }
                    
                    // Ensure we're working with a Record<string, N8nConnection[]> for type safety
                    const mainConnections = n8nWorkflow.connections[sourceNode.name].main;
                    
                    // Use the output index from the route or default to "0"
                    const outputIndex = route.sourcePort || "0";
                    
                    // Initialize the array for this output if it doesn't exist
                    if (!mainConnections[outputIndex]) {
                        mainConnections[outputIndex] = [];
                    }
                    
                    // Add the connection
                    mainConnections[outputIndex].push({
                        node: targetNode.name,
                        type: 'main',
                        index: 0
                    });
                    
                    debugTracker.addLog("info", `Added connection from ${sourceNode.name} to ${targetNode.name}`);
                }
            }
            // If there are no explicit routes, create sequential connections as a fallback
            else if (makeWorkflow.flow.length > 1) {
                // Create connections for regular flow (sequential)
                for (let i = 0; i < makeWorkflow.flow.length - 1; i++) {
                    const sourceModule = makeWorkflow.flow[i];
                    const targetModule = makeWorkflow.flow[i + 1];
                    
                    // Get source and target nodes from the map
                    const sourceNode = moduleToNodeMap[sourceModule.id];
                    const targetNode = moduleToNodeMap[targetModule.id];
                    
                    if (!sourceNode || !targetNode) {
                        debugTracker.addLog("warning", `Skipping sequential connection: Could not find source or target node (source: ${sourceModule.id}, target: ${targetModule.id})`);
                        continue;
                    }
                    
                    // Initialize the connections object for the source node
                    if (!n8nWorkflow.connections[sourceNode.name]) {
                        n8nWorkflow.connections[sourceNode.name] = {
                            main: { "0": [] }
                        };
                    }
                    
                    // Initialize the main output connections if it doesn't exist or is empty
                    if (!n8nWorkflow.connections[sourceNode.name].main) {
                        n8nWorkflow.connections[sourceNode.name].main = {};
                    }
                    
                    // Ensure we're working with a Record<string, N8nConnection[]> for type safety
                    const mainConnections = n8nWorkflow.connections[sourceNode.name].main;
                    
                    // Use the output index "0" as a string key
                    const outputIndex = "0";
                    
                    // Initialize the array for this output if it doesn't exist
                    if (!mainConnections[outputIndex]) {
                        mainConnections[outputIndex] = [];
                    }
                    
                    // Add the connection
                    mainConnections[outputIndex].push({
                        node: targetNode.name,
                        type: 'main',
                        index: 0
                    });
                    
                    debugTracker.addLog("info", `Added sequential connection from ${sourceNode.name} to ${targetNode.name}`);
                }
                // Handle router/switch nodes separately
                for (const node of n8nWorkflow.nodes) {
                    if (node.type === 'n8n-nodes-base.switch' && ((_b = node.parameters) === null || _b === void 0 ? void 0 : _b.rules)) {
                        // Safely cast to a known type with the expected structure
                        const rules = node.parameters.rules;
                        // Check if conditions exists and is an array
                        if (rules.conditions && Array.isArray(rules.conditions)) {
                            // Process switch node conditions
                            const sourceNode = node;
                            // Initialize connections for this source node if it doesn't exist
                            if (!n8nWorkflow.connections[sourceNode.name]) {
                                n8nWorkflow.connections[sourceNode.name] = { main: {} };
                            }
                            // Initialize the main output connections if it doesn't exist or is empty
                            if (!n8nWorkflow.connections[sourceNode.name].main) {
                                n8nWorkflow.connections[sourceNode.name].main = {};
                            }
                            // Cast to Record for type safety
                            const mainConnections = n8nWorkflow.connections[sourceNode.name].main;
                            // Process each condition to create a connection
                            for (let i = 0; i < rules.conditions.length; i++) {
                                // Initialize array for this output
                                if (!mainConnections[i.toString()]) {
                                    mainConnections[i.toString()] = [];
                                }
                                // Find a target node to connect to (this is simplified - in a real implementation,
                                // you'd need to determine the actual target based on the workflow structure)
                                const targetNode = n8nWorkflow.nodes.find(n => n.id !== sourceNode.id);
                                if (targetNode) {
                                    mainConnections[i.toString()].push({
                                        node: targetNode.name,
                                        type: 'main',
                                        index: 0
                                    });
                                }
                            }
                        }
                    }
                }
            }
            debugTracker.addLog("info", `Conversion completed: ${n8nWorkflow.nodes.length} nodes created`);
            // Add "Conversion complete" log message
            debugTracker.addLog("info", "Conversion complete");
            return {
                convertedWorkflow: n8nWorkflow,
                logs: debugTracker.getGeneralLogs(),
                parametersNeedingReview: Object.keys(parametersNeedingReview)
            };
        }
        catch (error) {
            debugTracker.addLog("error", `Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
            return {
                convertedWorkflow: {},
                logs: debugTracker.getGeneralLogs(),
                parametersNeedingReview: []
            };
        }
    });
}
// Convert a Make module to an n8n node
function convertModuleToNode(module, options = {}) {
    try {
        // Get the mapping for this module type
        const mapping = getNodeMapping(module.type, 'make_to_n8n');
        // Create the n8n node with the mapped type
        const n8nNode = {
            // Convert module ID to string explicitly to ensure consistent type
            id: options.preserveIds ? String(module.id) : `${generateNodeId()}`,
            name: module.name || 'Unnamed Node',
            type: (mapping === null || mapping === void 0 ? void 0 : mapping.n8nType) || mapMakeModuleToN8nNodeType(module.type),
            parameters: module.parameters || {},
            position: getPositionFromModule(module),
        };
        // Map parameters if needed
        if (mapping === null || mapping === void 0 ? void 0 : mapping.parameterMap) {
            // Convert parameters according to the mapping
            for (const [makeKey, n8nKey] of Object.entries(mapping.parameterMap)) {
                if (module.parameters && makeKey in module.parameters) {
                    n8nNode.parameters[n8nKey] = module.parameters[makeKey];
                }
            }
        }
        return n8nNode;
    }
    catch (error) {
        // If there's an error during conversion, use the enhanced placeholder node generation
        const placeholderNode = (0, workflow_converter_utils_1.createPlaceholderNode)(module);
        
        // Preserve ID if needed
        if (options.preserveIds && module.id) {
            placeholderNode.id = String(module.id);
        }
        
        return placeholderNode;
    }
}
// Now let's fix the connections handling
function processRoutes(makeWorkflow, n8nWorkflow, moduleToNodeMap) {
    // If the Make workflow has no routes, nothing to process
    if (!makeWorkflow.routes || !makeWorkflow.routes.length) {
        return;
    }
    for (const route of makeWorkflow.routes) {
        // Skip if source or target is missing
        if (!route.sourceId || !route.targetId) {
            continue;
        }
        // Find the source and target nodes
        const sourceNode = Object.values(moduleToNodeMap).find(node => String(node.id) === String(route.sourceId));
        const targetNode = Object.values(moduleToNodeMap).find(node => String(node.id) === String(route.targetId));
        // Skip if either node is not found
        if (!sourceNode || !targetNode) {
            continue;
        }
        // Initialize connections for this source node if it doesn't exist
        if (!n8nWorkflow.connections[sourceNode.name]) {
            n8nWorkflow.connections[sourceNode.name] = { main: {} };
        }
        // Initialize the main output connections if it doesn't exist or is empty
        if (!n8nWorkflow.connections[sourceNode.name].main) {
            n8nWorkflow.connections[sourceNode.name].main = {};
        }
        // Ensure we're working with a Record<string, N8nConnection[]> for type safety
        const mainConnections = n8nWorkflow.connections[sourceNode.name].main;
        // Use the output index "0" as a string key
        const outputIndex = "0";
        // Initialize the array for this output if it doesn't exist
        if (!mainConnections[outputIndex]) {
            mainConnections[outputIndex] = [];
        }
        // Add the connection to the output
        mainConnections[outputIndex].push({
            node: targetNode.name,
            type: 'main',
            index: 0
        });
    }
}
// Fix the Switch node handling
function processSwitchNodes(makeWorkflow, n8nWorkflow, moduleToNodeMap) {
    var _a, _b;
    for (const node of Object.values(moduleToNodeMap)) {
        if (node.type === 'n8n-nodes-base.switch' && ((_a = node.parameters) === null || _a === void 0 ? void 0 : _a.rules)) {
            // Safely cast to a known type with the expected structure
            const rules = node.parameters.rules;
            // Check if conditions exists and is an array
            if (rules.conditions && Array.isArray(rules.conditions)) {
                // Process switch node conditions
                const sourceNode = node;
                // Initialize connections for this source node if it doesn't exist
                if (!n8nWorkflow.connections[sourceNode.name]) {
                    n8nWorkflow.connections[sourceNode.name] = { main: {} };
                }
                // Initialize the main output connections if it doesn't exist or is empty
                if (!n8nWorkflow.connections[sourceNode.name].main) {
                    n8nWorkflow.connections[sourceNode.name].main = {};
                }
                // Cast to Record for type safety
                const mainConnections = n8nWorkflow.connections[sourceNode.name].main;
                // Process each condition to create a connection
                for (let i = 0; i < rules.conditions.length; i++) {
                    // Initialize array for this output
                    if (!mainConnections[i.toString()]) {
                        mainConnections[i.toString()] = [];
                    }
                    // Find the target module for this condition
                    const targetRoutes = (_b = makeWorkflow.routes) === null || _b === void 0 ? void 0 : _b.filter(route => String(route.sourceId) === String(node.id) && route.label === `Condition ${i + 1}`);
                    if (!targetRoutes || targetRoutes.length === 0) {
                        continue;
                    }
                    // Add a connection for each target route
                    for (const targetRoute of targetRoutes) {
                        const targetNode = Object.values(moduleToNodeMap).find(node => String(node.id) === String(targetRoute.targetId));
                        if (targetNode) {
                            mainConnections[i.toString()].push({
                                node: targetNode.name,
                                type: 'main',
                                index: 0,
                            });
                        }
                    }
                }
            }
        }
    }
}
