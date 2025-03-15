/**
 * Type definitions for node structures in n8n and Make.com
 * 
 * This file defines the core data structures for nodes, connections, and workflows
 * used in the conversion process between n8n and Make.com platforms.
 */

/**
 * Generic parameter value that can be found in both n8n and Make.com
 */
export type ParameterValue = string | number | boolean | null | ParameterValue[] | { [key: string]: ParameterValue };

/**
 * Basic node structure for n8n
 */
export interface N8nNode {
  // Unique identifier for the node
  id: string;
  // Display name of the node
  name: string;
  // Node type (e.g., 'n8n-nodes-base.httpRequest')
  type: string;
  // Node parameters
  parameters: Record<string, ParameterValue>;
  // Position in the workflow canvas [x, y]
  position?: [number, number];
  // Disable the node execution
  disabled?: boolean;
  // Node notes
  notes?: string;
  // Node webhooks
  webhookId?: string;
  // Node credentials
  credentials?: Record<string, any>;
  // Continue workflow execution even when node errors
  continueOnFail?: boolean;
  // Retry options
  retryOnFail?: boolean;
  // Maximum number of retries
  maxTries?: number;
  // Retry wait time in milliseconds
  waitBetweenTries?: number;
  // Always output data from node
  alwaysOutputData?: boolean;
  // Execution order in the workflow
  executeOnce?: boolean;
  // Custom properties specific to n8n nodes
  typeVersion?: number;
  // For triggers, when to execute
  executionMode?: string;
}

/**
 * Basic module structure for Make.com
 */
export interface MakeModule {
  // Unique identifier for the module
  id: string | number;
  // Display name of the module
  name?: string;
  // Module type (e.g., 'http', 'gmail', 'slack')
  type?: string;
  // Module parameters
  parameters: Record<string, ParameterValue>;
  // Position in the workflow canvas [x, y]
  position?: [number, number];
  // Disable the module execution
  disabled?: boolean;
  // Module notes
  notes?: string;
  // Module action (function the module performs)
  action?: string;
  // Connection identifier
  connectionId?: string | number;
  // Connection name for reference
  connectionName?: string;
  // Timeout in milliseconds
  timeout?: number;
  // Retry options
  retry?: {
    enabled: boolean;
    maxRetries: number;
    delay: number;
  };
  // Custom properties specific to Make modules
  dontMapOutputs?: boolean;
  // Module order in scenario execution
  order?: number;
  // For iterators/aggregators
  collectionName?: string;
  // For filters/routers
  filter?: Record<string, any>;
  // MODULE ID STRING - Used in tests and API responses
  module?: string;
  // PARAMETER MAPPING - Used for parameter transformations
  mapper?: Record<string, any>;
  // Child routes for router/filter modules
  routes?: MakeRoute[];
  // Module label (display name in Make.com UI)
  label?: string;
}

/**
 * Basic connection structure for n8n
 */
export interface N8nConnection {
  // Source node ID (optional in implementation as source is determined by connections object)
  sourceNodeId?: string;
  // Target node ID (in implementation, this is often referred to as 'node')
  targetNodeId?: string;
  // Target node name (used in implementation)
  node?: string;
  // Source output index (0-based)
  sourceOutputIndex?: number;
  // Target input index (0-based, often referred to as 'index')
  targetInputIndex?: number;
  index?: number;
  // Connection type (main, trigger, etc.)
  type?: string;
}

/**
 * Basic route structure for Make.com
 */
export interface MakeRoute {
  // Source module ID
  sourceId: string | number;
  // Target module ID
  targetId: string | number;
  // Source output label (optional)
  label?: string;
  // Condition for this route
  condition?: any;
  // Type of route (default, error, etc.)
  type?: string;
  // Sort order for routes
  order?: number;
  // Flow of modules within this route
  flow?: MakeModule[];
}

/**
 * Basic workflow structure for n8n
 */
export interface N8nWorkflow {
  // Workflow properties
  id?: string;
  name: string;
  nodes: N8nNode[];
  connections: {
    [nodeId: string]: {
      main?: {
        [outputIndex: string]: N8nConnection[];
      } | N8nConnection[][];
    };
  };
  // Active status
  active: boolean;
  // Workflow settings
  settings?: Record<string, any>;
  // Workflow tags
  tags?: string[];
  // Workflow version
  version?: number;
  // Pinned data for nodes (test data)
  pinData?: Record<string, any>;
  // Workflow variables
  variables?: Record<string, any>;
  // Webhook settings if any
  webhookSetup?: Record<string, any>;
  // Creation timestamp
  createdAt?: string;
  // Last update timestamp
  updatedAt?: string;
}

/**
 * Basic workflow structure for Make.com
 */
export interface MakeWorkflow {
  // Workflow properties
  id?: string | number;
  name: string;
  // Array of modules (used in original implementation)
  modules?: MakeModule[];
  // Array of modules (used in tests and API responses)
  flow?: MakeModule[];
  // Connection routes
  routes?: MakeRoute[];
  // Active status
  active?: boolean;
  // Workflow settings
  settings?: Record<string, any>;
  // Workflow labels (tags)
  labels?: string[];
  // Workflow version
  version?: number;
  // Metadata for the workflow
  metadata?: {
    blueprint?: boolean;
    instant?: boolean;
    folderName?: string;
    color?: string;
    scenario?: Record<string, any>;
    designer?: Record<string, any>;
    version?: number; // Adding version to metadata as it's used in n8n-to-make.ts
  };
  // Creation timestamp
  createdAt?: string;
  // Last update timestamp
  updatedAt?: string;
}

/**
 * Represents a mapping between n8n and Make.com node types
 */
export interface NodeTypeMapping {
  // n8n node type
  n8nType: string;
  // Make.com module type
  makeType: string;
  // Display name for documentation
  displayName?: string;
  // Description of the node/module
  description?: string;
  // Category for the node/module
  category?: string;
  // Icon/logo reference
  icon?: string;
}

/**
 * Function execution context for parameter transformation
 */
export interface TransformContext {
  // Source node/module
  source: N8nNode | MakeModule;
  // Target node/module (partially constructed)
  target: Partial<N8nNode | MakeModule>;
  // Direction of conversion
  direction: 'n8nToMake' | 'makeToN8n';
  // Additional context data
  data?: Record<string, any>;
} 