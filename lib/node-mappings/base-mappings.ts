/**
 * Base mappings between n8n nodes and Make.com modules
 * This file provides the default mapping configuration that can be extended with user mappings.
 */

import { NodeMapping, SchemaParameterMapping } from './schema';

/**
 * Base mappings for common node types between n8n and Make.com
 * This provides the foundation for mapping common node types across platforms
 */

export interface BaseNodeMapping {
  // Source node type (n8n or Make.com)
  sourceType: string;
  // Target node type (Make.com or n8n)
  targetType: string;
  // A mapping of source parameter paths to target parameter paths
  parameterMappings: Record<string, SchemaParameterMapping>;
  // Display name for the node
  displayName?: string;
  // Description for the node
  description?: string;
}

/**
 * Base node mapping database
 * Contains mappings for common n8n nodes to Make.com modules
 */
export const baseNodeMapping: Record<string, any> = {
  // Email nodes
  'n8n-nodes-base.emailSend': {
    n8nNodeType: 'n8n-nodes-base.emailSend',
    makeModuleId: 'email:ActionSendEmail',
    parameterMappings: {
      n8nToMake: {
        'to': { targetPath: 'to' },
        'subject': { targetPath: 'subject' },
        'text': { targetPath: 'text' },
        'html': { targetPath: 'html' },
        'attachments': { targetPath: 'attachments' }
      },
      makeToN8n: {
        'to': { targetPath: 'to' },
        'subject': { targetPath: 'subject' },
        'text': { targetPath: 'text' },
        'html': { targetPath: 'html' },
        'attachments': { targetPath: 'attachments' }
      }
    }
  },
  
  // HTTP nodes
  'n8n-nodes-base.httpRequest': {
    n8nNodeType: 'n8n-nodes-base.httpRequest',
    makeModuleId: 'http:ActionSendRequest',
    parameterMappings: {
      n8nToMake: {
        'url': { targetPath: 'url' },
        'method': { targetPath: 'method' },
        'authentication': { targetPath: 'authentication' },
        'headers': { targetPath: 'headers' },
        'queryParameters': { targetPath: 'queryParameters' },
        'body': { targetPath: 'body' }
      },
      makeToN8n: {
        'url': { targetPath: 'url' },
        'method': { targetPath: 'method' },
        'authentication': { targetPath: 'authentication' },
        'headers': { targetPath: 'headers' },
        'queryParameters': { targetPath: 'queryParameters' },
        'body': { targetPath: 'body' }
      }
    }
  },
  
  // Webhook nodes
  'n8n-nodes-base.webhook': {
    n8nNodeType: 'n8n-nodes-base.webhook',
    makeModuleId: 'webhooks:CustomWebhook',
    parameterMappings: {
      n8nToMake: {
        'path': { targetPath: 'url' },
        'httpMethod': { targetPath: 'method' },
        'responseMode': { targetPath: 'responseType' },
        'responseData': { targetPath: 'responseData' }
      },
      makeToN8n: {
        'url': { targetPath: 'path' },
        'method': { targetPath: 'httpMethod' },
        'responseType': { targetPath: 'responseMode' },
        'responseData': { targetPath: 'responseData' }
      }
    }
  },
  
  // Function nodes
  'n8n-nodes-base.function': {
    n8nNodeType: 'n8n-nodes-base.function',
    makeModuleId: 'tools:ActionRunJavascript',
    parameterMappings: {
      n8nToMake: {
        'functionCode': { targetPath: 'code', transform: 'adaptFunctionCode' }
      },
      makeToN8n: {
        'code': { targetPath: 'functionCode', transform: 'adaptMakeCode' }
      }
    }
  },
  
  // Custom node mapping
  'custom-nodes-base.customNode': {
    n8nNodeType: 'custom-nodes-base.customNode',
    makeModuleId: 'custom:WeatherModule',
    parameterMappings: {
      n8nToMake: {
        'location': { targetPath: 'city' },
        'units': { targetPath: 'units' },
        'includeAlerts': { targetPath: 'includeAlerts', transform: 'booleanToString' }
      },
      makeToN8n: {
        'city': { targetPath: 'location' },
        'units': { targetPath: 'units' },
        'includeAlerts': { targetPath: 'includeAlerts', transform: 'stringToBoolean' }
      }
    }
  }
}; 

// Base mappings for HTTP node
export const HttpNodeMapping: BaseNodeMapping = {
  sourceType: 'n8n-nodes-base.httpRequest',
  targetType: 'http',
  displayName: 'HTTP Request',
  description: 'Make HTTP requests to any API',
  parameterMappings: {
    'parameters.url': {
      targetPath: 'url',
      description: 'URL to make the request to'
    },
    'parameters.method': {
      targetPath: 'method',
      description: 'HTTP method to use',
      transform: (value) => value.toUpperCase() // Ensure method is uppercase
    },
    'parameters.headers': {
      targetPath: 'headers',
      description: 'HTTP headers to send with the request'
    },
    'parameters.body': {
      targetPath: 'body',
      description: 'Request body'
    }
  }
};

// Base mappings for Email node
export const EmailNodeMapping: BaseNodeMapping = {
  sourceType: 'n8n-nodes-base.emailSend',
  targetType: 'email',
  displayName: 'Email',
  description: 'Send emails',
  parameterMappings: {
    'parameters.to': {
      targetPath: 'to',
      description: 'Email recipient'
    },
    'parameters.subject': {
      targetPath: 'subject',
      description: 'Email subject'
    },
    'parameters.text': {
      targetPath: 'body',
      description: 'Email body text'
    },
    'parameters.cc': {
      targetPath: 'cc',
      description: 'CC recipients'
    },
    'parameters.bcc': {
      targetPath: 'bcc',
      description: 'BCC recipients'
    },
    'parameters.attachments': {
      targetPath: 'attachments',
      description: 'Email attachments'
    }
  }
};

// Base mappings for Webhook node
export const WebhookNodeMapping: BaseNodeMapping = {
  sourceType: 'n8n-nodes-base.webhook',
  targetType: 'webhook',
  displayName: 'Webhook',
  description: 'Receive data via webhooks',
  parameterMappings: {
    'parameters.path': {
      targetPath: 'path',
      description: 'Webhook path'
    },
    'parameters.responseCode': {
      targetPath: 'responseCode',
      description: 'HTTP response code',
      transform: (value) => parseInt(value, 10) // Ensure it's a number
    },
    'parameters.responseData': {
      targetPath: 'responseData',
      description: 'Response data to send back'
    }
  }
};

// Base mappings for Function node
export const FunctionNodeMapping: BaseNodeMapping = {
  sourceType: 'n8n-nodes-base.function',
  targetType: 'code',
  displayName: 'Function',
  description: 'Run custom JavaScript code',
  parameterMappings: {
    'parameters.functionCode': {
      targetPath: 'code',
      description: 'JavaScript code to execute'
    }
  }
};

// Export all base mappings
export const baseMappings: BaseNodeMapping[] = [
  HttpNodeMapping,
  EmailNodeMapping,
  WebhookNodeMapping,
  FunctionNodeMapping
];

/**
 * Get a base mapping by source type
 * 
 * @param sourceType - The source node type to look up
 * @returns The matching base mapping or undefined if not found
 */
export function getBaseMappingBySourceType(sourceType: string): BaseNodeMapping | undefined {
  return baseMappings.find(mapping => mapping.sourceType === sourceType);
}

/**
 * Get a base mapping by target type
 * 
 * @param targetType - The target node type to look up
 * @returns The matching base mapping or undefined if not found
 */
export function getBaseMappingByTargetType(targetType: string): BaseNodeMapping | undefined {
  return baseMappings.find(mapping => mapping.targetType === targetType);
} 