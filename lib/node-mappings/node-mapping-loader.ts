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
      logger.info('Loading node mappings from database');
      
      // For now, hardcode a basic mapping database with essential mappings
      const basicMappings: NodeMappingDatabase = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        mappings: {
          // HTTP node mapping (both directions)
          httpRequest: {
            sourceNodeType: 'n8n-nodes-base.httpRequest',
            targetNodeType: 'http',
            sourceParameterPaths: {
              url: ['url'],
              method: ['method'],
              authentication: ['authentication'],
              headers: ['headers'],
              queryParameters: ['query'],
              body: ['body']
            },
            targetParameterPaths: {
              URL: ['url'],
              method: ['method'],
              headers: ['headers']
            }
          },
          http: {
            sourceNodeType: 'http',
            targetNodeType: 'n8n-nodes-base.httpRequest',
            sourceParameterPaths: {
              URL: ['url'],
              method: ['method'],
              headers: ['headers']
            },
            targetParameterPaths: {
              url: ['URL'],
              method: ['method'],
              headers: ['headers']
            }
          },
          // Set node mapping (both directions)
          set: {
            sourceNodeType: 'n8n-nodes-base.set',
            targetNodeType: 'setVariable',
            sourceParameterPaths: {
              values: ['values']
            },
            targetParameterPaths: {
              values: ['values']
            }
          },
          setVariable: {
            sourceNodeType: 'setVariable',
            targetNodeType: 'n8n-nodes-base.set',
            sourceParameterPaths: {
              values: ['values']
            },
            targetParameterPaths: {
              values: ['values']
            }
          },
          // Manual trigger to webhook/http
          manualTrigger: {
            sourceNodeType: 'n8n-nodes-base.manualTrigger',
            targetNodeType: 'webhook',
            sourceParameterPaths: {},
            targetParameterPaths: {}
          },
          // Scheduler/timer
          scheduler: {
            sourceNodeType: 'scheduler',
            targetNodeType: 'n8n-nodes-base.schedule',
            sourceParameterPaths: {},
            targetParameterPaths: {}
          },
          // JSON/code
          json: {
            sourceNodeType: 'json',
            targetNodeType: 'n8n-nodes-base.code',
            sourceParameterPaths: {
              code: ['functionCode']
            },
            targetParameterPaths: {
              functionCode: ['code']
            }
          },
          // Generic placeholder for unmapped nodes
          placeholder: {
            sourceNodeType: 'placeholder',
            targetNodeType: 'n8n-nodes-base.noOp',
            sourceParameterPaths: {},
            targetParameterPaths: {}
          }
        }
      };
      
      // Log available mappings
      logger.debug(`Loaded ${Object.keys(basicMappings.mappings).length} node mappings`);
      logger.debug(`Available mappings: ${Object.keys(basicMappings.mappings).join(', ')}`);
      
      // Update our instance mappings
      this.mappingDatabase = basicMappings;
      
      try {
        // In a browser environment, try to load mappings via fetch
        // This replaces the file system approach for a web application
        if (typeof window !== 'undefined') {
          const mappingUrl = this.getMappingUrl();
          logger.info(`Attempting to load additional mappings from ${mappingUrl}`);
          
          try {
            const response = await fetch(mappingUrl);
            if (response.ok) {
              const additionalMappings = await response.json();
              
              // Merge with our basic mappings
              this.mappingDatabase = {
                ...basicMappings,
                mappings: {
                  ...basicMappings.mappings,
                  ...additionalMappings.mappings
                }
              };
              
              logger.info(`Successfully loaded additional mappings`);
            }
          } catch (fetchError) {
            logger.warn(`Could not fetch additional mappings: ${fetchError}`);
            // Fall back to the hardcoded mappings
          }
        }
      } catch (error) {
        logger.error(`Error loading mappings: ${error}`);
        // We still have the hardcoded basic mappings, so continue
      }
      
      return this.mappingDatabase;
    } catch (error) {
      logger.error(`Failed to load node mappings: ${error}`);
      throw error;
    }
  }

  /**
   * Get the loaded mappings
   */
  public getMappings(): NodeMappingDatabase {
    return this.mappingDatabase;
  }

  /**
   * Get the URL for mapping data
   */
  public getMappingUrl(): string {
    // In a real implementation, this might be configurable or environment specific
    return '/api/node-mappings';
  }
} 