/**
 * Node information interface
 * 
 * Represents the extracted details of an n8n node from GitHub
 */

export interface NodeInfo {
  /**
   * Internal name of the node
   */
  name: string;
  
  /**
   * Node type identifier
   */
  type: string;
  
  /**
   * Display name for the node in the UI
   */
  displayName: string;
  
  /**
   * Description of the node's functionality
   */
  description: string;
  
  /**
   * Properties/parameters for this node
   */
  properties: Record<string, any>;
  
  /**
   * Input operations for this node
   */
  inputs: string[];
  
  /**
   * Output operations for this node
   */
  outputs: string[];
  
  /**
   * The directory name in the n8n repository
   */
  directory: string;
} 