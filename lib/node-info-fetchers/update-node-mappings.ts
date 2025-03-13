/**
 * Mapping Enhancer Utility
 * 
 * Enhances the basic node mappings with detailed information from GitHub
 */

import { NodeInfoStore } from "./node-info-store"
import { NodeInfo } from "../types/node-info"
import { getNodeMappings } from "../mappings/node-mapping"

// Define interfaces for the mapping objects
interface ParameterMap {
  [key: string]: string;
}

interface NodeMapping {
  type: string;
  parameterMap: ParameterMap;
  description?: string;
  displayName?: string;
}

interface Mappings {
  n8nToMake: Record<string, NodeMapping>;
  makeToN8n: Record<string, NodeMapping>;
}

// Track if mappings have been enhanced
let mappingsEnhanced = false;

// Track which node types have been enhanced
const enhancedNodeTypes: Set<string> = new Set();

// Polyfill fetch if needed
let fetchFunc: any;
try {
  // Check if fetch is available
  fetchFunc = typeof fetch !== 'undefined' ? fetch : undefined;
} catch (e) {
  // If fetch is not defined, we're in a Node.js environment without fetch
  fetchFunc = undefined;
}

/**
 * Get the list of node types that have been enhanced
 */
export function getEnhancedNodeTypes(): string[] {
  return Array.from(enhancedNodeTypes);
}

/**
 * Check if node mappings have been enhanced
 */
export function areMappingsEnhanced(): boolean {
  return mappingsEnhanced;
}

/**
 * Ensure node mappings are enhanced before conversion
 * This should be called before any conversion operation
 */
export async function ensureMappingsEnhanced(): Promise<boolean> {
  if (mappingsEnhanced) {
    return true; // Already enhanced
  }
  
  try {
    // First try to use the local file
    await enhanceNodeMappings({
      useLocalFile: true,
      localFilePath: '/nodes-n8n.json'
    });
    
    mappingsEnhanced = true;
    return true;
  } catch (error) {
    console.warn("Could not enhance mappings with local file, trying GitHub:", error);
    
    try {
      // Fall back to GitHub
      await enhanceNodeMappings();
      mappingsEnhanced = true;
      return true;
    } catch (fallbackError) {
      console.error("Failed to enhance mappings:", fallbackError);
      return false;
    }
  }
}

/**
 * Enhances the basic node mappings with detailed information from GitHub or local file
 * This improves the conversion accuracy by having richer node information
 */
export async function enhanceNodeMappings(options: {
  forceUpdate?: boolean;
  useLocalFile?: boolean;
  localFilePath?: string;
} = {}): Promise<boolean> {
  try {
    // First try to load from local file if available
    try {
      const success = await NodeInfoStore.loadNodesFromFile(options.localFilePath);
      if (success) {
        console.log("Enhanced node mappings with node data");
        return true;
      }
    } catch (error) {
      console.warn("Could not enhance mappings with local file, trying GitHub:", error);
      
      // Skip GitHub fetch if fetch is not available
      if (!fetchFunc) {
        console.warn("Fetch API not available, skipping remote node data fetching");
        return false;
      }
      
      try {
        // Fall back to GitHub
        const success = await NodeInfoStore.fetchNodes(options.forceUpdate);
        if (success) {
          console.log("Enhanced node mappings with data from GitHub");
          return true;
        }
      } catch (fallbackError) {
        console.error("Failed to enhance mappings:", fallbackError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error enhancing node mappings:", error);
    throw error; // Re-throw to allow proper fallback handling
  }
  
  return false;
}

/**
 * Enhances an n8n-to-Make mapping with additional node information
 */
function enhanceN8nToMakeMapping(nodeType: string, nodeInfo: NodeInfo, mapping: NodeMapping): void {
  if (!mapping) return
  
  // Add description if not present
  if (nodeInfo.description && !mapping.description) {
    mapping.description = nodeInfo.description
  }
  
  // Add node displayName if not present
  if (nodeInfo.displayName && !mapping.displayName) {
    mapping.displayName = nodeInfo.displayName
  }
  
  // Enhance parameter mapping if properties are available
  if (nodeInfo.properties && Object.keys(nodeInfo.properties).length > 0) {
    if (!mapping.parameterMap) {
      mapping.parameterMap = {}
    }
    
    // For each property in the node, check if it's not already mapped
    // and try to find a reasonable mapping from the property name
    Object.keys(nodeInfo.properties).forEach(propName => {
      if (!Object.keys(mapping.parameterMap).includes(propName)) {
        // Simple heuristic: Try to map based on property name
        // In a real implementation, you'd use more sophisticated matching
        mapping.parameterMap[propName] = propName.toLowerCase()
      }
    })
  }
  
  // Track this node type as enhanced
  enhancedNodeTypes.add(nodeType);
}

/**
 * Enhances a Make-to-n8n mapping with additional node information
 */
function enhanceMakeToN8nMapping(moduleType: string, nodeInfo: NodeInfo, mapping: NodeMapping): void {
  if (!mapping) return
  
  // Add description if not present
  if (nodeInfo.description && !mapping.description) {
    mapping.description = nodeInfo.description
  }
  
  // Add node displayName if not present
  if (nodeInfo.displayName && !mapping.displayName) {
    mapping.displayName = nodeInfo.displayName
  }
  
  // Enhance parameter mapping if properties are available
  if (nodeInfo.properties && Object.keys(nodeInfo.properties).length > 0) {
    if (!mapping.parameterMap) {
      mapping.parameterMap = {}
    }
    
    // For each property in the node, check if it's not already mapped
    // and try to find a reasonable mapping from the property name
    Object.keys(nodeInfo.properties).forEach(propName => {
      const existingMappings = Object.values(mapping.parameterMap)
      if (!existingMappings.includes(propName)) {
        // Simple heuristic: Try to map based on property name
        // In a real implementation, you'd use more sophisticated matching
        mapping.parameterMap[propName.toLowerCase()] = propName
      }
    })
  }
  
  // Track the n8n node type as enhanced
  const nodeType = nodeInfo.type;
  if (nodeType) {
    enhancedNodeTypes.add(`n8n-nodes-base.${nodeType}`);
  }
}

/**
 * Finds the n8n node type that maps to a given Make module type
 */
function findN8nNodeTypeForModule(moduleType: string, mappings: Mappings): string | null {
  for (const [nodeType, mapping] of Object.entries(mappings.n8nToMake)) {
    if (mapping.type === moduleType) {
      return nodeType
    }
  }
  return null
} 