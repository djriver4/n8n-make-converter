/**
 * Workflow Converter Utility Functions
 * 
 * This module provides specialized utility functions for workflow conversion operations
 * that require additional type handling.
 */

import { 
  N8nNode, 
  MakeModule, 
  N8nWorkflow, 
  MakeWorkflow,
  N8nConnection,
  MakeRoute
} from "../node-mappings/node-types";
import { generateNodeId, ensureN8nNode, ensureMakeModule } from "./typescript-utils";

/**
 * Safely map a node ID when converting from n8n to Make
 * 
 * @param nodeId The node ID to map
 * @param nodeIdMap The mapping of node IDs
 * @returns The mapped node ID or a placeholder
 */
export function safeMapNodeId(
  nodeId: string | undefined, 
  nodeIdMap: Record<string, string>
): string | number {
  if (!nodeId) return generateNodeId();
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
export function createSafeMakeRoute(
  sourceId: string | number | undefined,
  targetId: string | number | undefined,
  label?: string
): MakeRoute {
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
export function createRouteFromNodeConnection(
  sourceNodeId: string,
  connection: N8nConnection,
  nodeIdMap: Record<string, string>,
  outputIndex: string | number
): MakeRoute {
  const route: MakeRoute = {
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
export function addToUnmappedNodes(
  nodeType: string | undefined, 
  unmappedNodes: string[]
): void {
  if (nodeType) {
    unmappedNodes.push(nodeType);
  } else {
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
export function createSafeN8nNode(
  makeModule: MakeModule,
  mapType: string
): N8nNode {
  return ensureN8nNode({
    id: makeModule.id ? String(makeModule.id) : generateNodeId(),
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
export function createPlaceholderNode(makeModule: MakeModule): N8nNode {
  return ensureN8nNode({
    id: generateNodeId(),
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
export function createPlaceholderModule(n8nNode: N8nNode): MakeModule {
  return ensureMakeModule({
    id: n8nNode.id || generateNodeId(),
    name: `[UNMAPPED] ${n8nNode.name || 'Unknown'}`,
    type: "placeholder",
    parameters: { originalType: n8nNode.type || 'unknown' },
    notes: `This module represents an unmapped n8n node of type: ${n8nNode.type || 'unknown'}`
  });
} 