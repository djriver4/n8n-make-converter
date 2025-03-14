/**
 * Schema definitions for node mappings between n8n and Make.com
 */

/**
 * Represents a parameter mapping between n8n and Make.com
 */
export interface ParameterMapping {
  n8nName: string;
  makeName: string;
  type: string;
  default?: any;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: string }>;
  displayOptions?: any;
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
 * Represents a complete node mapping between n8n and Make.com
 */
export interface NodeMapping {
  // Basic node information
  n8nNodeType: string;
  n8nDisplayName: string;
  makeModuleId: string;
  makeModuleName: string;
  
  // Node type categorization (e.g., "Action", "Trigger")
  n8nTypeCategory?: string;
  makeTypeCategory?: string;
  
  // Description and documentation
  description?: string;
  documentationUrl?: {
    n8n?: string;
    make?: string;
  };
  
  // Icon information
  iconUrl?: {
    n8n?: string;
    make?: string;
  };
  
  // Operations mapping (actions/methods the node can perform)
  operations: OperationMapping[];
  
  // Credential mapping
  credentials?: CredentialMapping[];
  
  // Additional metadata specific to each platform
  n8nMetadata?: Record<string, any>;
  makeMetadata?: Record<string, any>;
}

/**
 * Mapping database interface
 */
export interface NodeMappingDatabase {
  version: string;
  lastUpdated: string;
  mappings: Record<string, NodeMapping>;
} 