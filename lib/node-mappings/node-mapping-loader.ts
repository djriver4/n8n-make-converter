/**
 * Node mapping loader
 * 
 * Utility to load node mappings from the JSON file and make them available to the application
 */

// Import fs and path conditionally based on environment
const isServer = typeof window === 'undefined';

// We'll use dynamic imports for server-only modules
let fs: any;
let path: any;
import { NodeMappingDatabase } from './schema';
import logger from '../logger';

// Use a simple object for client-side
let defaultMappings: NodeMappingDatabase = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  mappings: {}
};

// If we're in a server environment, import the modules
if (isServer) {
  import('fs').then(fsModule => { fs = fsModule.default; });
  import('path').then(pathModule => { path = pathModule.default; });
}

export class NodeMappingLoader {
  private static instance: NodeMappingLoader;
  private mappingDatabase: NodeMappingDatabase | null = null;
  private mappingFilePath: string = '';
  
  private constructor() {
    // Private constructor for singleton pattern
    if (isServer && path) {
      this.mappingFilePath = path.resolve(process.cwd(), 'lib/node-mappings/nodes-mapping.json');
    }
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
  public async loadMappings(): Promise<NodeMappingDatabase> {
    try {
      if (this.mappingDatabase) {
        logger.info('Using cached node mappings');
        return this.mappingDatabase;
      }
      
      // If we're in the browser, use the default mappings or fetch from API
      if (!isServer) {
        logger.info('Running in browser environment, using default mappings');
        // In a production app, you would fetch mappings from an API endpoint here
        this.mappingDatabase = defaultMappings;
        return this.mappingDatabase;
      }
      
      // Dynamic import for server-side only
      if (!fs || !path) {
        const [fsModule, pathModule] = await Promise.all([
          import('fs'),
          import('path')
        ]);
        fs = fsModule.default;
        path = pathModule.default;
        this.mappingFilePath = path.resolve(process.cwd(), 'lib/node-mappings/nodes-mapping.json');
      }
      
      logger.info(`Loading node mappings from ${this.mappingFilePath}`);
      
      if (!fs.existsSync(this.mappingFilePath)) {
        logger.error(`Node mapping file not found at ${this.mappingFilePath}`);
        // Return a default empty mapping database instead of throwing
        this.mappingDatabase = {
          version: '1.0.0',
          lastUpdated: new Date().toISOString().split('T')[0],
          mappings: {}
        };
        return this.mappingDatabase;
      }
      
      const mappingData = fs.readFileSync(this.mappingFilePath, 'utf-8');
      logger.info(`Read ${mappingData.length} bytes from mapping file`);
      
      try {
        this.mappingDatabase = JSON.parse(mappingData) as NodeMappingDatabase;
        logger.info(`Successfully parsed mapping file as JSON`);
      } catch (parseError) {
        logger.error(`Failed to parse mapping file as JSON: ${(parseError as Error).message}`);
        this.mappingDatabase = {
          version: '1.0.0',
          lastUpdated: new Date().toISOString().split('T')[0],
          mappings: {}
        };
        return this.mappingDatabase;
      }
      
      // Validate the structure
      if (!this.mappingDatabase || !this.mappingDatabase.mappings) {
        logger.warn('Loaded node mappings file has invalid structure, using empty mappings');
        this.mappingDatabase = {
          version: '1.0.0',
          lastUpdated: new Date().toISOString().split('T')[0],
          mappings: {}
        };
      } else {
        // Log some details about the mappings
        const mappingKeys = Object.keys(this.mappingDatabase.mappings);
        logger.info(`Loaded ${mappingKeys.length} node mappings: ${mappingKeys.join(', ')}`);
        
        // Log details of the first mapping if available
        if (mappingKeys.length > 0) {
          const firstMapping = this.mappingDatabase.mappings[mappingKeys[0]];
          logger.info(`First mapping: ${mappingKeys[0]} -> n8n: ${firstMapping.n8nNodeType}, make: ${firstMapping.makeModuleId}`);
        }
      }
      
      return this.mappingDatabase;
    } catch (error) {
      logger.error(`Failed to load node mappings: ${(error as Error).message}`);
      
      // Return a default empty mapping database instead of throwing
      this.mappingDatabase = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        mappings: {}
      };
      
      return this.mappingDatabase;
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
  public async reloadMappings(): Promise<NodeMappingDatabase> {
    this.mappingDatabase = null;
    return this.loadMappings();
  }
} 