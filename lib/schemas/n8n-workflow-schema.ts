import { JSONSchemaType } from 'ajv';

// Define the n8n workflow schema types
export interface N8nNodeParameters {
  [key: string]: any;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  parameters: N8nNodeParameters;
  position: [number, number];
  typeVersion?: number;
  disabled?: boolean;
  continueOnFail?: boolean;
  alwaysOutputData?: boolean;
  retryOnFail?: boolean;
  [key: string]: any;
}

export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

export interface N8nConnections {
  [key: string]: {
    main?: Array<Array<N8nConnection>>;
    [key: string]: any;
  };
}

export interface N8nWorkflow {
  nodes: N8nNode[];
  connections: N8nConnections;
  name?: string;
  active?: boolean;
  settings?: {
    [key: string]: any;
  };
  [key: string]: any;
}

// Define a simpler schema for validation
export const n8nWorkflowSchema = {
  type: 'object',
  required: ['nodes', 'connections'],
  properties: {
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'type', 'parameters', 'position'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          parameters: {
            type: 'object',
            additionalProperties: true
          },
          position: {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 2
          },
          typeVersion: { type: 'number' },
          disabled: { type: 'boolean' },
          continueOnFail: { type: 'boolean' },
          alwaysOutputData: { type: 'boolean' },
          retryOnFail: { type: 'boolean' }
        },
        additionalProperties: true
      }
    },
    connections: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          main: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['node', 'type', 'index'],
                properties: {
                  node: { type: 'string' },
                  type: { type: 'string' },
                  index: { type: 'number' }
                },
                additionalProperties: true
              }
            }
          }
        },
        additionalProperties: true
      }
    },
    name: { type: 'string' },
    active: { type: 'boolean' },
    settings: {
      type: 'object',
      additionalProperties: true
    }
  },
  additionalProperties: true
}; 