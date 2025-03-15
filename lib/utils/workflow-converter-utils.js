"use strict";
/**
 * Workflow Converter Utility Functions
 *
 * This module provides specialized utility functions for workflow conversion operations
 * that require additional type handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeMapNodeId = safeMapNodeId;
exports.createSafeMakeRoute = createSafeMakeRoute;
exports.createRouteFromNodeConnection = createRouteFromNodeConnection;
exports.addToUnmappedNodes = addToUnmappedNodes;
exports.createSafeN8nNode = createSafeN8nNode;
exports.createPlaceholderNode = createPlaceholderNode;
exports.createPlaceholderModule = createPlaceholderModule;
const typescript_utils_1 = require("./typescript-utils");
/**
 * Safely map a node ID when converting from n8n to Make
 *
 * @param nodeId The node ID to map
 * @param nodeIdMap The mapping of node IDs
 * @returns The mapped node ID or a placeholder
 */
function safeMapNodeId(nodeId, nodeIdMap) {
    if (!nodeId)
        return (0, typescript_utils_1.generateNodeId)();
    return nodeIdMap[nodeId] || nodeId;
}
/**
 * Create a safe Make route with fallbacks for missing values
 *
 * @param sourceId Source module ID
 * @param targetId Target module ID
 * @param label Optional route label
 * @returns A safely constructed MakeRoute
 */
function createSafeMakeRoute(sourceId, targetId, label) {
    return {
        sourceId: sourceId || 0,
        targetId: targetId || 0,
        label: label
    };
}
/**
 * Create a safe route for a node connection
 *
 * @param sourceNodeId Source node ID
 * @param connection The connection to process
 * @param nodeIdMap The mapping of node IDs
 * @param outputIndex The output index
 * @returns A safely constructed MakeRoute
 */
function createRouteFromNodeConnection(sourceNodeId, connection, nodeIdMap, outputIndex) {
    const route = {
        sourceId: nodeIdMap[sourceNodeId] || sourceNodeId,
        targetId: nodeIdMap[connection.targetNodeId || (connection.node || '')] || ''
    };
    // Add output label if needed
    if (parseInt(String(outputIndex)) > 0) {
        route.label = `Output ${parseInt(String(outputIndex)) + 1}`;
    }
    return route;
}
/**
 * Safely add a node type to unmapped nodes list
 *
 * @param nodeType The node type to add
 * @param unmappedNodes The array of unmapped nodes
 */
function addToUnmappedNodes(nodeType, unmappedNodes) {
    if (nodeType) {
        unmappedNodes.push(nodeType);
    }
    else {
        unmappedNodes.push('unknown');
    }
}
/**
 * Create an n8n node from a Make module with safe type handling
 *
 * @param makeModule The Make module to convert
 * @param mapType The mapped n8n type or fallback
 * @returns A safely constructed N8nNode
 */
function createSafeN8nNode(makeModule, mapType) {
    return (0, typescript_utils_1.ensureN8nNode)({
        id: makeModule.id ? String(makeModule.id) : (0, typescript_utils_1.generateNodeId)(),
        name: makeModule.name || `Module ${makeModule.id || ''}`,
        type: mapType,
        parameters: {},
        typeVersion: 1,
        position: makeModule.position || [0, 0]
    });
}
/**
 * Create a placeholder node for an unmapped Make module
 *
 * @param makeModule The Make module that couldn't be mapped
 * @returns A placeholder N8nNode
 */
function createPlaceholderNode(makeModule) {
    return (0, typescript_utils_1.ensureN8nNode)({
        id: (0, typescript_utils_1.generateNodeId)(),
        name: makeModule.name ? String(makeModule.name) : `Unmapped ${makeModule.type || 'Unknown'}`,
        type: 'n8n-nodes-base.noOp',
        parameters: {
            originalType: makeModule.type || 'unknown',
            displayName: `Placeholder for ${makeModule.name || makeModule.type || 'unknown'}`
        },
        position: makeModule.position || [0, 0]
    });
}
/**
 * Create a placeholder module for an unmapped n8n node
 *
 * @param n8nNode The n8n node that couldn't be mapped
 * @returns A placeholder MakeModule
 */
function createPlaceholderModule(n8nNode) {
    return (0, typescript_utils_1.ensureMakeModule)({
        id: n8nNode.id || (0, typescript_utils_1.generateNodeId)(),
        name: `[UNMAPPED] ${n8nNode.name || 'Unknown'}`,
        type: "placeholder",
        parameters: { originalType: n8nNode.type || 'unknown' },
        notes: `This module represents an unmapped n8n node of type: ${n8nNode.type || 'unknown'}`
    });
}
