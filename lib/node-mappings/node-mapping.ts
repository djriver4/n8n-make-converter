/**
 * Node mapping utilities for retrieving and managing node mappings
 */

import { NodeMapping, ParameterMapping } from './schema';
import { baseMappings, BaseNodeMapping } from './base-mappings';

/**
 * Custom node mappings for specific integrations
 * These extend the base mappings with application-specific details
 */

export interface CustomNodeMapping extends BaseNodeMapping {
  // Source integration/app name
  sourceIntegration: string;
  // Target integration/app name
  targetIntegration: string;
  // Version of the mapping
  version: string;
  // Custom parameter mappings specific to this integration
  customParameters?: Record<string, ParameterMapping>;
}

// Example custom node mappings
export const customNodeMappings: CustomNodeMapping[] = [
  // Weather API mapping
  {
    sourceType: 'n8n-nodes-base.openWeatherMap',
    targetType: 'weather',
    sourceIntegration: 'OpenWeatherMap',
    targetIntegration: 'Weather API',
    version: '1.0.0',
    displayName: 'Weather',
    description: 'Get weather information',
    parameterMappings: {
      'parameters.location': {
        targetPath: 'location',
        description: 'Location to get weather for'
      },
      'parameters.units': {
        targetPath: 'units',
        description: 'Units for temperature (metric/imperial)'
      },
      'parameters.forecast': {
        targetPath: 'forecast',
        description: 'Whether to include forecast data'
      }
    }
  },
  
  // Slack mapping
  {
    sourceType: 'n8n-nodes-base.slack',
    targetType: 'slack',
    sourceIntegration: 'Slack',
    targetIntegration: 'Slack',
    version: '1.0.0',
    displayName: 'Slack',
    description: 'Send messages to Slack',
    parameterMappings: {
      'parameters.channel': {
        targetPath: 'channel',
        description: 'Slack channel to send message to'
      },
      'parameters.text': {
        targetPath: 'message',
        description: 'Message text to send'
      },
      'parameters.attachments': {
        targetPath: 'attachments',
        description: 'Message attachments'
      }
    }
  },
  
  // Google Sheets mapping
  {
    sourceType: 'n8n-nodes-base.googleSheets',
    targetType: 'googleSheets',
    sourceIntegration: 'Google Sheets',
    targetIntegration: 'Google Sheets',
    version: '1.0.0',
    displayName: 'Google Sheets',
    description: 'Read or write data to Google Sheets',
    parameterMappings: {
      'parameters.operation': {
        targetPath: 'operation',
        description: 'Operation to perform'
      },
      'parameters.sheetId': {
        targetPath: 'documentId',
        description: 'Google Sheet ID'
      },
      'parameters.range': {
        targetPath: 'range',
        description: 'Cell range in A1 notation'
      },
      'parameters.values': {
        targetPath: 'values',
        description: 'Values to write to the sheet'
      }
    }
  }
];

/**
 * Get all node mappings, combining base and custom mappings
 * 
 * @returns Array of all available mappings
 */
export function getAllMappings(): (BaseNodeMapping | CustomNodeMapping)[] {
  return [...baseMappings, ...customNodeMappings];
}

/**
 * Find a mapping by source node type
 * 
 * @param sourceType - Source node type to find mapping for
 * @returns Matching mapping or undefined if not found
 */
export function findMappingBySourceType(sourceType: string): (BaseNodeMapping | CustomNodeMapping) | undefined {
  return getAllMappings().find(mapping => mapping.sourceType === sourceType);
}

/**
 * Find a mapping by target node type
 * 
 * @param targetType - Target node type to find mapping for
 * @returns Matching mapping or undefined if not found
 */
export function findMappingByTargetType(targetType: string): (BaseNodeMapping | CustomNodeMapping) | undefined {
  return getAllMappings().find(mapping => mapping.targetType === targetType);
}

/**
 * Get node mappings for compatibility with existing code
 * 
 * @returns Combined mapping object with all available node mappings
 */
export function getNodeMappings(): Record<string, any> {
  const mappings = getAllMappings();
  const result: Record<string, any> = {};
  
  for (const mapping of mappings) {
    result[mapping.sourceType] = mapping;
  }
  
  return result;
}

// Extend the global Window interface to include our UserMappingStore
declare global {
  interface Window {
    UserMappingStore: {
      getMappings(direction: 'n8nToMake' | 'makeToN8n'): Record<string, any>;
      setMappings(direction: 'n8nToMake' | 'makeToN8n', mappings: Record<string, any>): void;
    };
  }
} 