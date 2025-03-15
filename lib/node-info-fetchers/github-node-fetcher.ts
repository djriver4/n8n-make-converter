/**
 * GitHub Node Fetcher
 * 
 * This module fetches node information from the n8n GitHub repository.
 */

import { NodeInfo as BaseNodeInfo } from '../types/node-info';

// Extended NodeInfo interface with additional properties
interface NodeInfo extends BaseNodeInfo {
  nodeName?: string;
  version?: string;
}

// GitHub repository details
const N8N_REPO = 'n8n-io/n8n';
const N8N_BRANCH = 'master';

// Paths to node packages in the n8n repository
const NODE_PATHS = [
  'packages/nodes-base/nodes',
  'packages/nodes-base/credentials'
];

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
 * Fetches node information from the n8n GitHub repository
 */
export async function fetchNodesFromGitHub(): Promise<Record<string, NodeInfo>> {
  console.log("Fetching n8n nodes from GitHub...");
  
  // If fetch is not available, return empty object
  if (!fetchFunc) {
    console.warn("Fetch API not available, cannot fetch nodes from GitHub");
    return {};
  }

  try {
    const nodes: Record<string, NodeInfo> = {};

    // Fetch content of node directories
    for (const path of NODE_PATHS) {
      const url = `https://api.github.com/repos/${N8N_REPO}/contents/${path}?ref=${N8N_BRANCH}`;
      
      const response = await fetchFunc(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from GitHub: ${response.status} ${response.statusText}`);
      }
      
      const files = await response.json();
      
      // Process each file/directory in the node package
      for (const file of files) {
        if (file.type === 'dir' && !file.name.startsWith('.')) {
          // This is a node directory, fetch the node info
          const nodeInfo = await fetchNodeInfo(file.name, path);
          if (nodeInfo) {
            nodes[`n8n-nodes-base.${nodeInfo.nodeName || file.name}`] = nodeInfo;
          }
        }
      }
    }
    
    return nodes;
  } catch (error) {
    console.error("Error fetching nodes from GitHub:", error);
    throw error;
  }
}

/**
 * Fetches information about a specific node
 */
async function fetchNodeInfo(nodeName: string, basePath: string): Promise<NodeInfo | null> {
  if (!fetchFunc) {
    return null;
  }
  
  try {
    // Check for node.json file first
    const nodeJsonUrl = `https://raw.githubusercontent.com/${N8N_REPO}/${N8N_BRANCH}/${basePath}/${nodeName}/node.json`;
    const response = await fetchFunc(nodeJsonUrl);
    
    if (response.ok) {
      const nodeJson = await response.json();
      
      return {
        name: nodeJson.name || nodeName,
        type: nodeJson.type || 'unknown',
        displayName: nodeJson.displayName || nodeName,
        description: nodeJson.description || '',
        version: nodeJson.version || '1.0',
        properties: nodeJson.properties || [],
        inputs: nodeJson.inputs || [],
        outputs: nodeJson.outputs || [],
        nodeName: nodeJson.name || nodeName,
        directory: nodeName
      };
    }
    
    // If no node.json, fallback to checking the Typescript file
    const nodeClassUrl = `https://raw.githubusercontent.com/${N8N_REPO}/${N8N_BRANCH}/${basePath}/${nodeName}/${nodeName}.node.ts`;
    const classResponse = await fetchFunc(nodeClassUrl);
    
    if (classResponse.ok) {
      const nodeClass = await classResponse.text();
      
      // Extract information from the class definition
      const displayNameMatch = nodeClass.match(/displayName\s*=\s*['"]([^'"]+)['"]/);
      const descriptionMatch = nodeClass.match(/description\s*=\s*['"]([^'"]+)['"]/);
      
      return {
        name: nodeName,
        type: 'unknown',
        displayName: displayNameMatch ? displayNameMatch[1] : nodeName,
        description: descriptionMatch ? descriptionMatch[1] : '',
        version: '1.0',
        properties: [],
        inputs: [],
        outputs: [],
        nodeName: nodeName,
        directory: nodeName
      };
    }
    
    return null;
  } catch (error) {
    console.warn(`Error fetching node info for ${nodeName}:`, error);
    return null;
  }
}