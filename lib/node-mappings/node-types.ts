/**
 * Type definitions for n8n and Make.com node structures
 */

/**
 * Simplified representation of an n8n node
 */
export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
  parameters?: Record<string, any>;
  credentials?: Record<string, any>;
  continueOnFail?: boolean;
  alwaysOutputData?: boolean;
  webhookId?: string;
  retryOnFail?: boolean;
  executeOnce?: boolean;
}

/**
 * Simplified representation of an n8n connection
 */
export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

/**
 * Simplified representation of an n8n workflow
 */
export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: Record<string, { main: N8nConnection[][] }>;
  settings?: Record<string, any>;
  tags?: string[];
  pinData?: Record<string, any>;
  versionId?: string;
  staticData?: Record<string, any>;
}

/**
 * Simplified representation of a Make.com module (node)
 */
export interface MakeModule {
  id: number;
  name: string;
  type: string;
  bundleId: string;
  metadata?: {
    name: string;
    label: string;
  };
  definition: {
    type: string;
    parameters?: Record<string, any>;
    expect?: Record<string, any>;
    interface?: Array<any>;
  };
  configuration?: Record<string, any>;
  webhook?: Record<string, any>;
}

/**
 * Simplified representation of a Make.com route (connection)
 */
export interface MakeRoute {
  id: number;
  outgoing: number;
  incoming: number;
  type?: string;
  filter?: Record<string, any>;
}

/**
 * Simplified representation of a Make.com scenario (workflow)
 */
export interface MakeScenario {
  name: string;
  flow: {
    modules: MakeModule[];
    routes: MakeRoute[];
  };
  blueprint?: Record<string, any>;
  metadata?: Record<string, any>;
  datastores?: Array<any>;
  constants?: Record<string, any>;
  settings?: Record<string, any>;
  version?: string;
} 