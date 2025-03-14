/**
 * Schema definitions for node mappings between n8n and Make.com
 */

/**
 * Basic parameter mapping between source and target platforms
 */
export interface ParameterMapping {
  // Source parameter path in the original node
  sourcePath?: string;
  // Target parameter path in the mapped node
  targetPath: string;
  // Description of the parameter mapping
  description?: string;
  // Optional transformation function for the parameter value
  transform?: (value: any) => any;
  // Default value if no source value exists
  defaultValue?: any;
  // Whether this is a required parameter
  required?: boolean;
}

/**
 * Extended parameter mapping with additional schema information
 */
export interface SchemaParameterMapping extends ParameterMapping {
  // Parameter type (string, number, boolean, array, object)
  type?: string;
  // Format for specialized data types (e.g., date-time, email, uri)
  format?: string;
  // For enum parameters, the list of allowed values
  enum?: string[];
  // Validation rules
  validation?: {
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
  };
  // For array parameters, the schema of each item
  items?: SchemaParameterMapping;
  // For object parameters, the schema of each property
  properties?: Record<string, SchemaParameterMapping>;
}

/**
 * Represents an operation mapping between n8n and Make.com
 */
export interface OperationMapping {
  n8nName: string;
  makeName: string;
  description?: string;
  parameters: ParameterMapping[];
}

/**
 * Represents authentication/credential mapping between n8n and Make.com
 */
export interface CredentialMapping {
  n8nType: string;
  makeType: string;
  fields: ParameterMapping[];
}

/**
 * Node mapping definition between platforms
 */
export interface NodeMapping {
  // Source platform (n8n or Make)
  source: 'n8n' | 'make';
  // Source node type
  sourceNodeType: string;
  // Target node type in the destination platform
  targetNodeType: string;
  // Mapping for node parameters
  parameterMappings: Record<string, ParameterMapping>;
  // Mapping for input connections
  inputMappings?: Record<string, string>;
  // Mapping for output connections
  outputMappings?: Record<string, string>;
  // Custom transformation logic for this node type
  customTransform?: (sourceNode: any, context?: any) => any;
  // Metadata
  metadata?: {
    displayName?: string;
    description?: string;
    version?: string;
    author?: string;
    tags?: string[];
  };
}

/**
 * Collection of node mappings with utility functions
 */
export interface NodeMappingCollection {
  // Node mappings by source node type
  mappings: Record<string, NodeMapping>;
  // Get a mapping by source node type
  getMapping: (sourceNodeType: string) => NodeMapping | undefined;
  // Add a new mapping to the collection
  addMapping: (mapping: NodeMapping) => void;
  // Remove a mapping from the collection
  removeMapping: (sourceNodeType: string) => void;
}

/**
 * Mapping database interface
 */
export interface NodeMappingDatabase {
  version: string;
  lastUpdated: string;
  mappings: Record<string, NodeMapping>;
} 