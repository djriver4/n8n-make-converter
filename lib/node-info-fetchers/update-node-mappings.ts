/**
 * Mapping Enhancer Utility
 * 
 * Enhances the basic node mappings with detailed information from GitHub
 */

import { NodeInfoStore } from "./node-info-store"
import { NodeInfo } from "../types/node-info"
import { getNodeMappings, baseNodeMapping } from "../mappings/node-mapping"

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

// Ensure mappings are enhanced with node information
let enhancedMappings = false;

export async function ensureMappingsEnhanced(): Promise<boolean> {
  if (enhancedMappings) {
    return true;
  }

  try {
    const enhanced = await enhanceNodeMappings();
    enhancedMappings = enhanced;
    return enhanced;
  } catch (error) {
    console.warn("Error enhancing node mappings:", error);
    console.log("Continuing with base mappings only...");
    return false;
  }
}

// Helper function to update mappings with node info
function updateMappingsWithNodeInfo(nodeInfo: any): void {
  if (!nodeInfo) return;
  
  // Update n8n to Make mappings with additional node info
  Object.keys(nodeInfo).forEach(nodeType => {
    const info = nodeInfo[nodeType];
    // Use type assertion to tell TypeScript this is a valid key
    if (nodeType in baseNodeMapping.n8nToMake) {
      // Use type assertion to treat the mapping as NodeMapping
      const mapping = baseNodeMapping.n8nToMake[nodeType as keyof typeof baseNodeMapping.n8nToMake] as NodeMapping;
      mapping.description = info.description || '';
      mapping.displayName = info.displayName || '';
    }
  });
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
    // First, try to load from local file
    try {
      const localFilePath = options.localFilePath || "/nodes-n8n.json";
      const nodeInfo = await NodeInfoStore.loadNodesFromFile(localFilePath);
      if (nodeInfo && Object.keys(nodeInfo).length > 0) {
        updateMappingsWithNodeInfo(nodeInfo);
        return true;
      }
    } catch (error) {
      console.warn("Could not enhance mappings with local file, trying GitHub:", error);
      
      // Skip GitHub fetch if fetch is not available
      if (!fetchFunc) {
        console.warn("Fetch API not available, skipping remote node data fetching");
        return false;
      }
      
      // If local file fails, try fetching from GitHub
      const nodes = await NodeInfoStore.fetchNodes(options.forceUpdate);
      if (nodes && Object.keys(nodes).length > 0) {
        updateMappingsWithNodeInfo(nodes);
        console.log("Enhanced node mappings with data from GitHub");
        return true;
      }
    }
    
    // If both methods fail
    console.warn("Could not enhance node mappings from any source, using base mappings only.");
    return false;
  } catch (error) {
    console.error("Error enhancing node mappings:", error);
    return false;
  }
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
    enhancedNodeTypes.add(nodeType);
  }
}

/**
 * Helper function to find the n8n node type for a given Make module type
 */
function findN8nNodeTypeForModule(moduleType: string, mappings: Mappings): string | null {
  const makeToN8n = mappings.makeToN8n;
  if (makeToN8n[moduleType]) {
    return makeToN8n[moduleType].type;
  }
  return null;
}