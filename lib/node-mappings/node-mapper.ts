/**
 * Node Mapper Utility
 * 
 * Provides functionality to convert nodes between n8n and Make.com formats
 * using a mapping database.
 */

import { NodeMapping, NodeMappingDatabase } from './schema';
import { N8nNode, MakeModule } from './node-types';
import logger from '../logger';

export class NodeMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NodeMappingError';
  }
}

export class NodeMapper {
  private mappingDatabase: NodeMappingDatabase;
  
  /**
   * Create a new NodeMapper instance
   * 
   * @param mappingDatabase - The mapping database to use for node conversions
   */
  constructor(mappingDatabase: NodeMappingDatabase) {
    this.mappingDatabase = mappingDatabase;
    logger.info(`NodeMapper initialized with ${Object.keys(this.mappingDatabase.mappings || {}).length} mappings`);
  }
  
  /**
   * Get a node mapping by n8n node type
   * 
   * @param n8nNodeType - The n8n node type to find mapping for
   * @returns The node mapping or undefined if not found
   */
  getNodeMappingByN8nType(n8nNodeType: string): NodeMapping | undefined {
    // Check if mappings exist
    if (!this.mappingDatabase.mappings) {
      logger.warn('No mappings available in the mapping database');
      return undefined;
    }
    
    // Find the mapping by n8nNodeType
    return Object.values(this.mappingDatabase.mappings).find(
      (mapping) => mapping.n8nNodeType === n8nNodeType
    );
  }
  
  /**
   * Get a node mapping by Make.com module ID
   * 
   * @param makeModuleId - The Make.com module ID to find mapping for
   * @returns The node mapping or undefined if not found
   */
  getNodeMappingByMakeId(makeModuleId: string): NodeMapping | undefined {
    // Check if mappings exist
    if (!this.mappingDatabase.mappings) {
      logger.warn('No mappings available in the mapping database');
      return undefined;
    }
    
    // Find the mapping by makeModuleId
    return Object.values(this.mappingDatabase.mappings).find(
      (mapping) => mapping.makeModuleId === makeModuleId
    );
  }
  
  /**
   * Convert an n8n node to a Make.com module
   * 
   * @param n8nNode - The n8n node to convert
   * @returns The converted Make.com module
   * @throws NodeMappingError if the node cannot be converted
   */
  mapN8nNodeToMake(n8nNode: N8nNode): MakeModule {
    try {
      // Find the mapping for this node type
      const mapping = this.getNodeMappingByN8nType(n8nNode.type);
      
      if (!mapping) {
        throw new NodeMappingError(`No mapping found for n8n node type: ${n8nNode.type}`);
      }
      
      // Extract the operation from the node parameters
      const operation = n8nNode.parameters?.operation || 'default';
      
      // Find the operation mapping
      const operationMapping = mapping.operations.find((op) => op.n8nName === operation);
      
      if (!operationMapping) {
        throw new NodeMappingError(
          `No operation mapping found for n8n node type: ${n8nNode.type} and operation: ${operation}`
        );
      }
      
      // Convert parameters
      const makeParameters: Record<string, any> = {};
      
      if (n8nNode.parameters) {
        for (const paramMapping of operationMapping.parameters) {
          if (n8nNode.parameters[paramMapping.n8nName] !== undefined) {
            makeParameters[paramMapping.makeName] = n8nNode.parameters[paramMapping.n8nName];
          } else if (paramMapping.required) {
            // If parameter is required but not provided, use default if available
            if (paramMapping.default !== undefined) {
              makeParameters[paramMapping.makeName] = paramMapping.default;
            } else {
              throw new NodeMappingError(
                `Required parameter ${paramMapping.n8nName} missing for node: ${n8nNode.name}`
              );
            }
          }
        }
      }
      
      // Create the Make.com module
      const makeModule: MakeModule = {
        id: parseInt(n8nNode.id, 10) || Math.floor(Math.random() * 1000),
        name: n8nNode.name,
        type: mapping.makeModuleId,
        bundleId: mapping.makeModuleId.split(':')[0],
        metadata: {
          name: mapping.makeModuleName,
          label: n8nNode.name,
        },
        definition: {
          type: operationMapping.makeName,
          parameters: makeParameters,
        },
        configuration: {},
      };
      
      // Handle credentials if present
      if (n8nNode.credentials && mapping.credentials) {
        const credentialMapping = mapping.credentials[0];
        makeModule.configuration = {
          auth: this.mapN8nCredentialsToMake(n8nNode.credentials, credentialMapping),
        };
      }
      
      return makeModule;
    } catch (error) {
      if (error instanceof NodeMappingError) {
        throw error;
      }
      throw new NodeMappingError(`Failed to map n8n node to Make.com: ${(error as Error).message}`);
    }
  }
  
  /**
   * Convert a Make.com module to an n8n node
   * 
   * @param makeModule - The Make.com module to convert
   * @returns The converted n8n node
   * @throws NodeMappingError if the module cannot be converted
   */
  mapMakeNodeToN8n(makeModule: MakeModule): N8nNode {
    try {
      // Find the mapping for this module type
      const mapping = this.getNodeMappingByMakeId(makeModule.type);
      
      if (!mapping) {
        throw new NodeMappingError(`No mapping found for Make.com module type: ${makeModule.type}`);
      }
      
      // Extract the operation from the module definition
      const operation = makeModule.definition.type;
      
      // Find the operation mapping
      const operationMapping = mapping.operations.find((op) => op.makeName === operation);
      
      if (!operationMapping) {
        throw new NodeMappingError(
          `No operation mapping found for Make.com module type: ${makeModule.type} and operation: ${operation}`
        );
      }
      
      // Convert parameters
      const n8nParameters: Record<string, any> = {
        operation: operationMapping.n8nName,
      };
      
      if (makeModule.definition.parameters) {
        for (const paramMapping of operationMapping.parameters) {
          if (makeModule.definition.parameters[paramMapping.makeName] !== undefined) {
            n8nParameters[paramMapping.n8nName] = makeModule.definition.parameters[paramMapping.makeName];
          }
        }
      }
      
      // Create the n8n node
      const n8nNode: N8nNode = {
        id: makeModule.id.toString(),
        name: makeModule.name,
        type: mapping.n8nNodeType,
        typeVersion: 1,
        position: [100, 100], // Default position, will need to be adjusted
        parameters: n8nParameters,
      };
      
      // Handle credentials if present
      if (makeModule.configuration?.auth && mapping.credentials) {
        const credentialMapping = mapping.credentials[0];
        n8nNode.credentials = this.mapMakeCredentialsToN8n(
          makeModule.configuration.auth,
          credentialMapping
        );
      }
      
      return n8nNode;
    } catch (error) {
      if (error instanceof NodeMappingError) {
        throw error;
      }
      throw new NodeMappingError(`Failed to map Make.com module to n8n: ${(error as Error).message}`);
    }
  }
  
  /**
   * Map n8n credentials to Make.com format
   * 
   * @param n8nCredentials - The n8n credentials
   * @param credentialMapping - The credential mapping to use
   * @returns The mapped Make.com credentials
   * @private
   */
  private mapN8nCredentialsToMake(
    n8nCredentials: Record<string, any>,
    credentialMapping: any
  ): Record<string, any> {
    const makeCredentials: Record<string, any> = {
      type: credentialMapping.makeType,
    };
    
    for (const field of credentialMapping.fields) {
      const credentialType = Object.keys(n8nCredentials)[0];
      if (n8nCredentials[credentialType]?.[field.n8nName] !== undefined) {
        makeCredentials[field.makeName] = n8nCredentials[credentialType][field.n8nName];
      }
    }
    
    return makeCredentials;
  }
  
  /**
   * Map Make.com credentials to n8n format
   * 
   * @param makeCredentials - The Make.com credentials
   * @param credentialMapping - The credential mapping to use
   * @returns The mapped n8n credentials
   * @private
   */
  private mapMakeCredentialsToN8n(
    makeCredentials: Record<string, any>,
    credentialMapping: any
  ): Record<string, any> {
    const n8nCredentials: Record<string, any> = {};
    const credentialType = credentialMapping.n8nType;
    
    n8nCredentials[credentialType] = {};
    
    for (const field of credentialMapping.fields) {
      if (makeCredentials[field.makeName] !== undefined) {
        n8nCredentials[credentialType][field.n8nName] = makeCredentials[field.makeName];
      }
    }
    
    return n8nCredentials;
  }
} 