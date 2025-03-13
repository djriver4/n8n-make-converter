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

// Import isomorphic-fetch for environments without native fetch
require('isomorphic-fetch');

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
export async function loadNodesFromFile(filePath: string): Promise<any> {
  console.log("Loading n8n nodes from local file:", filePath)
  
  try {
    let resolvedPath = filePath;
    
    // In browser environment, we can't use path.isAbsolute
    if (typeof window === 'undefined' && path) {
      // Check if path is relative, and resolve it
      if (!path.isAbsolute(filePath)) {
        resolvedPath = path.resolve(process.cwd(), filePath);
      }
      
      // Read file directly using fs instead of fetch for local files
      if (fs && fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        return JSON.parse(fileContent);
      } else {
        throw new Error(`File not found: ${resolvedPath}`);
      }
    } else {
      // In browser environment, we need to use fetch
      // Assuming the file is hosted and accessible via fetch
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (fetchError) {
        console.error("Error fetching nodes file:", fetchError);
        throw fetchError;
      }
    }
  } catch (error) {
    console.error("Error loading nodes from file:", error)
    throw error
  }
} 