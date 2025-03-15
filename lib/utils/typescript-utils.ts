/**
 * TypeScript Utility Functions
 * 
 * This module provides utility functions to improve type safety and handle
 * common operations consistently throughout the codebase.
 */

import { N8nNode, MakeModule, N8nWorkflow, MakeWorkflow, N8nConnection } from '../node-mappings/node-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique node ID
 * 
 * @returns A string ID in the format 'n_xxxxxxxx'
 */
export function generateNodeId(): string {
  return `n_${uuidv4().split('-')[0]}`;
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 * 
 * @param value The value to check
 * @returns True if the value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Type guard to check if a workflow is an n8n workflow
 * 
 * @param workflow The workflow to check
 * @returns True if the workflow is an n8n workflow
 */
export function isN8nWorkflow(workflow: any): workflow is N8nWorkflow {
  return isDefined(workflow) && 
         Array.isArray(workflow.nodes) && 
         isDefined(workflow.connections);
}

/**
 * Type guard to check if a workflow is a Make.com workflow
 * 
 * @param workflow The workflow to check
 * @returns True if the workflow is a Make.com workflow
 */
export function isMakeWorkflow(workflow: any): workflow is MakeWorkflow {
  return isDefined(workflow) && 
         (Array.isArray(workflow.modules) || Array.isArray(workflow.flow));
}

/**
 * Safely initialize the connections object for a source node
 * 
 * @param workflow The n8n workflow to modify
 * @param sourceNodeId The ID of the source node
 * @returns The updated workflow
 */
export function initializeConnectionsForNode(
  workflow: N8nWorkflow, 
  sourceNodeId: string
): N8nWorkflow {
  if (!workflow.connections[sourceNodeId]) {
    workflow.connections[sourceNodeId] = { main: {} };
  }
  
  if (!workflow.connections[sourceNodeId].main) {
    workflow.connections[sourceNodeId].main = {};
  }
  
  return workflow;
}

/**
 * Safely get or initialize an output array for a specific output index
 * 
 * @param workflow The n8n workflow to modify
 * @param sourceNodeId The ID of the source node
 * @param outputIndex The output index to initialize
 * @returns The connection array for the specified output
 */
export function getOrInitializeOutputConnections(
  workflow: N8nWorkflow,
  sourceNodeId: string,
  outputIndex: string | number
): N8nConnection[] {
  // Ensure we're using a string index
  const outputIndexStr = String(outputIndex);
  
  // Initialize the workflow connections if needed
  initializeConnectionsForNode(workflow, sourceNodeId);
  
  // Ensure the main object exists and is properly typed
  if (!workflow.connections[sourceNodeId].main) {
    workflow.connections[sourceNodeId].main = {};
  }
  
  // We now need to ensure we're working with the object format, not array
  const mainConnections = workflow.connections[sourceNodeId].main;
  
  // If it's not an object with string keys, convert it
  if (Array.isArray(mainConnections)) {
    // Convert array format to object format
    const objConnections: Record<string, N8nConnection[]> = {};
    
    mainConnections.forEach((connections, index) => {
      if (Array.isArray(connections)) {
        objConnections[String(index)] = connections;
      }
    });
    
    workflow.connections[sourceNodeId].main = objConnections;
  }
  
  // Now we can safely access and initialize the output array
  const typedMain = workflow.connections[sourceNodeId].main as Record<string, N8nConnection[]>;
  
  if (!typedMain[outputIndexStr]) {
    typedMain[outputIndexStr] = [];
  }
  
  return typedMain[outputIndexStr];
}

/**
 * Create a connection to a target node
 * 
 * @param targetNodeId The ID of the target node
 * @param inputIndex The input index of the target node (optional, defaults to 0)
 * @returns A new N8nConnection object
 */
export function createConnection(
  targetNodeId: string,
  inputIndex: number = 0
): N8nConnection {
  return {
    node: targetNodeId,
    type: 'main',
    index: inputIndex
  };
}

/**
 * Ensure a Make module has required properties
 * 
 * @param module The Make module to validate
 * @returns A validated Make module with defaults for missing properties
 */
export function ensureMakeModule(module: Partial<MakeModule>): MakeModule {
  return {
    id: module.id || 1,
    name: module.name || `Module ${module.id || ''}`,
    type: module.type || 'unknown',
    parameters: module.parameters || {},
    ...module
  };
}

/**
 * Ensure an n8n node has required properties
 * 
 * @param node The n8n node to validate
 * @returns A validated n8n node with defaults for missing properties
 */
export function ensureN8nNode(node: Partial<N8nNode>): N8nNode {
  return {
    id: node.id || generateNodeId(),
    name: node.name || `Node ${node.id || ''}`,
    type: node.type || 'n8n-nodes-base.noOp',
    parameters: node.parameters || {},
    position: node.position || [0, 0],
    ...node
  };
}

/**
 * Safely access a property that might be undefined
 * 
 * @param obj The object to access
 * @param key The key to access
 * @param defaultValue The default value to return if the property is undefined
 * @returns The property value or the default value
 */
export function safeGet<T extends object, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue: T[K]
): T[K] {
  return (obj !== undefined && obj !== null && key in obj) ? obj[key] : defaultValue;
} 