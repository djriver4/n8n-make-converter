/**
 * Node mapping loader
 * 
 * Utility to load node mappings from the JSON file and make them available to the application
 */

import fs from 'fs';
import path from 'path';
import { NodeMappingDatabase } from './schema';
import logger from '../logger';

export class NodeMappingLoader {
  private static instance: NodeMappingLoader;
  private mappingDatabase: NodeMappingDatabase | null = null;
  private readonly mappingFilePath = path.join(__dirname, 'nodes-mapping.json');
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get the singleton instance of the NodeMappingLoader
   * 
   * @returns The NodeMappingLoader instance
   */
  public static getInstance(): NodeMappingLoader {
    if (!NodeMappingLoader.instance) {
      NodeMappingLoader.instance = new NodeMappingLoader();
    }
    return NodeMappingLoader.instance;
  }
  
  /**
   * Load the node mappings from the JSON file
   * 
   * @returns The loaded node mapping database
   */
  public loadMappings(): NodeMappingDatabase {
    try {
      if (this.mappingDatabase) {
        return this.mappingDatabase;
      }
      
      logger.info(`Loading node mappings from ${this.mappingFilePath}`);
      
      if (!fs.existsSync(this.mappingFilePath)) {
        throw new Error(`Node mapping file not found at ${this.mappingFilePath}`);
      }
      
      const mappingData = fs.readFileSync(this.mappingFilePath, 'utf-8');
      this.mappingDatabase = JSON.parse(mappingData) as NodeMappingDatabase;
      
      logger.info(`Loaded ${Object.keys(this.mappingDatabase.mappings).length} node mappings`);
      
      return this.mappingDatabase;
    } catch (error) {
      logger.error(`Failed to load node mappings: ${(error as Error).message}`);
      throw error;
    }
  }
  
  /**
   * Get the currently loaded mapping database
   * 
   * @returns The currently loaded mapping database or null if not loaded
   */
  public getMappingDatabase(): NodeMappingDatabase | null {
    return this.mappingDatabase;
  }
  
  /**
   * Reload the node mappings from the JSON file
   * 
   * @returns The reloaded node mapping database
   */
  public reloadMappings(): NodeMappingDatabase {
    this.mappingDatabase = null;
    return this.loadMappings();
  }
} 