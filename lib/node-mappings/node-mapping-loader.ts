/**
 * Node mapping loader
 * 
 * Utility to load node mappings from the JSON file and make them available to the application
 */

import { NodeMappingDatabase } from './schema';
import logger from '../logger';

// Default mappings as a fallback
const defaultMappings: NodeMappingDatabase = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  mappings: {}
};

export class NodeMappingLoader {
  private static instance: NodeMappingLoader;
  private mappingDatabase: NodeMappingDatabase = defaultMappings;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get the singleton instance of the NodeMappingLoader
   */
  public static getInstance(): NodeMappingLoader {
    if (!NodeMappingLoader.instance) {
      NodeMappingLoader.instance = new NodeMappingLoader();
    }
    return NodeMappingLoader.instance;
  }

  /**
   * Load the node mappings from the appropriate source
   */
  public async loadMappings(): Promise<NodeMappingDatabase> {
    try {
      if (this.mappingDatabase !== defaultMappings) {
        return this.mappingDatabase;
      }

      // In browser or development environment
      const response = await fetch('/data/nodes-mapping.json');
      if (!response.ok) {
        throw new Error(`Failed to load mappings: ${response.statusText}`);
      }
      
      const data = await response.json() as NodeMappingDatabase;
      this.mappingDatabase = data;
      
      logger.info(`Loaded ${Object.keys(this.mappingDatabase?.mappings || {}).length} mappings`);
      
      return this.mappingDatabase;
    } catch (error) {
      logger.error(`Error loading mappings: ${error instanceof Error ? error.message : String(error)}`);
      return defaultMappings;
    }
  }

  /**
   * Get the loaded mappings
   */
  public getMappings(): NodeMappingDatabase {
    return this.mappingDatabase;
  }
} 