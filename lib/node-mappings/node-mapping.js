"use strict";
/**
 * Node mapping utilities for retrieving and managing node mappings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.customNodeMappings = void 0;
exports.getAllMappings = getAllMappings;
exports.findMappingBySourceType = findMappingBySourceType;
exports.findMappingByTargetType = findMappingByTargetType;
exports.getNodeMappings = getNodeMappings;
const base_mappings_1 = require("./base-mappings");
// Example custom node mappings
exports.customNodeMappings = [
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
function getAllMappings() {
    return [...base_mappings_1.baseMappings, ...exports.customNodeMappings];
}
/**
 * Find a mapping by source node type
 *
 * @param sourceType - Source node type to find mapping for
 * @returns Matching mapping or undefined if not found
 */
function findMappingBySourceType(sourceType) {
    return getAllMappings().find(mapping => mapping.sourceType === sourceType);
}
/**
 * Find a mapping by target node type
 *
 * @param targetType - Target node type to find mapping for
 * @returns Matching mapping or undefined if not found
 */
function findMappingByTargetType(targetType) {
    return getAllMappings().find(mapping => mapping.targetType === targetType);
}
/**
 * Get node mappings for compatibility with existing code
 *
 * @returns Combined mapping object with all available node mappings
 */
function getNodeMappings() {
    const mappings = getAllMappings();
    const result = {};
    for (const mapping of mappings) {
        result[mapping.sourceType] = mapping;
    }
    return result;
}
