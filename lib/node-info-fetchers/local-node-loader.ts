/**
 * Local Node Loader Utility
 * 
 * Loads n8n node information from a local JSON file
 */

import { NodeInfo } from "../types/node-info"

// Only import fs and path in Node.js environment
let fs: any;
let path: any;
if (typeof window === 'undefined') {
  // We're in a Node.js environment
  fs = require('fs');
  path = require('path');
}

/**
 * Interface for GitHub directory listing entry
 */
interface NodeDirEntry {
  name: string;
  path: string;
  html_url: string;
  type: string;
}

/**
 * Loads node information from a local JSON file
 * 
 * @param filePath Path to the JSON file containing node information
 * @returns Record of NodeInfo objects
 */
export async function loadNodesFromFile(filePath: string): Promise<Record<string, NodeInfo>> {
  try {
    console.log(`Loading n8n nodes from local file: ${filePath}`)
    
    let nodeEntries: NodeDirEntry[];
    
    // Handle different environments (browser vs Node.js)
    if (typeof window !== 'undefined') {
      // Browser environment - fetch the file
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      nodeEntries = await response.json();
    } else {
      // Node.js environment - use fs
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      nodeEntries = JSON.parse(fileContent);
    }
    
    // Transform the entries into NodeInfo objects
    const nodeInfoMap: Record<string, NodeInfo> = {}
    
    nodeEntries.forEach((entry) => {
      // Skip non-directory entries
      if (entry.type !== 'dir') return
      
      // Create a basic NodeInfo object from the directory name
      const nodeInfo: NodeInfo = {
        name: entry.name,
        type: entry.name.toLowerCase().replace(/\s+/g, ''),
        displayName: entry.name,
        description: `${entry.name} node`,
        properties: {},
        inputs: [],
        outputs: [],
        directory: entry.name
      }
      
      const nodeType = `n8n-nodes-base.${nodeInfo.type}`
      nodeInfoMap[nodeType] = nodeInfo
    })
    
    console.log(`Transformed ${Object.keys(nodeInfoMap).length} nodes from local file`)
    return nodeInfoMap
    
  } catch (error) {
    console.error("Error loading nodes from file:", error)
    throw error
  }
} 