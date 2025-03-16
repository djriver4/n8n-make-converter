"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_mapper_1 = require("../../../lib/node-mappings/node-mapper");
const globals_1 = require("@jest/globals");
// Sample mapping database for testing
const testMappingDatabase = {
    version: '1.0.0',
    lastUpdated: '2023-11-15',
    mappings: {
        httpRequest: {
            source: 'n8n',
            sourceNodeType: 'n8n-nodes-base.httpRequest',
            targetNodeType: 'http',
            parameterMappings: {
                'url': {
                    targetPath: 'url',
                    description: 'URL to make the request to'
                },
                'method': {
                    targetPath: 'method',
                    description: 'HTTP method'
                },
                'headers': {
                    targetPath: 'headers',
                    description: 'HTTP headers'
                }
            },
            metadata: {
                displayName: 'HTTP Request',
                description: 'Make a HTTP request and receive the response'
            }
        },
        http: {
            source: 'make',
            sourceNodeType: 'http',
            targetNodeType: 'n8n-nodes-base.httpRequest',
            parameterMappings: {
                'url': {
                    targetPath: 'url',
                    description: 'URL to make the request to'
                },
                'method': {
                    targetPath: 'method',
                    description: 'HTTP method'
                },
                'headers': {
                    targetPath: 'headers',
                    description: 'HTTP headers'
                }
            },
            metadata: {
                displayName: 'HTTP',
                description: 'Make a HTTP request'
            }
        }
    }
};
// Mock the node-mapping module
jest.mock('../../../lib/node-mappings/node-mapping', () => {
    return {
        getNodeMappings: jest.fn().mockReturnValue({
            n8nToMake: {
                'n8n.weather': {
                    targetType: 'weather:ActionGetCurrentWeather',
                    parameterMappings: {
                        n8nToMake: {
                            'location': { targetPath: 'city' },
                            'units': { targetPath: 'units' },
                            'includeAlerts': { targetPath: 'includeAlerts', transform: 'booleanToString' }
                        },
                        makeToN8n: {}
                    }
                },
                'n8n.email': {
                    targetType: 'email:ActionSendEmail',
                    parameterMappings: {
                        n8nToMake: {
                            'to': { targetPath: 'recipients' },
                            'subject': { targetPath: 'subject' },
                            'body': { targetPath: 'content' },
                            'attachments': { targetPath: 'files' }
                        },
                        makeToN8n: {}
                    }
                }
            },
            makeToN8n: {
                'weather:ActionGetCurrentWeather': {
                    targetType: 'n8n.weather',
                    parameterMappings: {
                        makeToN8n: {
                            'city': { targetPath: 'location' },
                            'units': { targetPath: 'units' },
                            'includeAlerts': { targetPath: 'includeAlerts', transform: 'stringToBoolean' }
                        },
                        n8nToMake: {}
                    }
                },
                'email:ActionSendEmail': {
                    targetType: 'n8n.email',
                    parameterMappings: {
                        makeToN8n: {
                            'recipients': { targetPath: 'to' },
                            'subject': { targetPath: 'subject' },
                            'content': { targetPath: 'body' },
                            'files': { targetPath: 'attachments' }
                        },
                        n8nToMake: {}
                    }
                }
            }
        })
    };
});
// Mock the logger
jest.mock('console', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));
(0, globals_1.describe)('NodeMapper', () => {
    let nodeMapper;
    (0, globals_1.beforeEach)(() => {
        // Reset mocks
        jest.clearAllMocks();
        nodeMapper = new node_mapper_1.NodeMapper(testMappingDatabase);
    });
    (0, globals_1.describe)('getNodeMappingByN8nType', () => {
        (0, globals_1.it)('should return the correct mapping for a valid n8n node type', () => {
            var _a;
            const mapping = nodeMapper.getNodeMappingByN8nType('n8n-nodes-base.httpRequest');
            (0, globals_1.expect)(mapping).toBeDefined();
            (0, globals_1.expect)((_a = mapping === null || mapping === void 0 ? void 0 : mapping.metadata) === null || _a === void 0 ? void 0 : _a.displayName).toBe('HTTP Request');
        });
        (0, globals_1.it)('should return undefined for an invalid n8n node type', () => {
            const mapping = nodeMapper.getNodeMappingByN8nType('n8n-nodes-base.nonExistentNode');
            (0, globals_1.expect)(mapping).toBeUndefined();
        });
    });
    (0, globals_1.describe)('getNodeMappingByMakeId', () => {
        (0, globals_1.it)('should return the correct mapping for a valid Make.com module ID', () => {
            var _a;
            const mapping = nodeMapper.getNodeMappingByMakeId('http');
            (0, globals_1.expect)(mapping).toBeDefined();
            (0, globals_1.expect)((_a = mapping === null || mapping === void 0 ? void 0 : mapping.metadata) === null || _a === void 0 ? void 0 : _a.displayName).toBe('HTTP');
        });
        (0, globals_1.it)('should return undefined for an invalid Make.com module ID', () => {
            const mapping = nodeMapper.getNodeMappingByMakeId('nonExistentModule');
            (0, globals_1.expect)(mapping).toBeUndefined();
        });
    });
    (0, globals_1.describe)('convertN8nNodeToMakeModule', () => {
        (0, globals_1.it)('should convert an n8n HTTP node to a Make HTTP module', () => {
            const n8nNode = {
                id: 'test-id',
                name: 'HTTP Request',
                type: 'n8n-nodes-base.httpRequest',
                parameters: {
                    url: 'https://example.com/api',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                position: [100, 200]
            };
            const result = nodeMapper.convertN8nNodeToMakeModule(n8nNode);
            const makeModule = result.node;
            (0, globals_1.expect)(makeModule).toEqual({
                id: 'test-id',
                name: 'HTTP Request',
                type: 'http',
                parameters: {
                    url: 'https://example.com/api',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                position: [100, 200]
            });
        });
        (0, globals_1.it)('should handle missing parameters', () => {
            const n8nNode = {
                id: 'test-id',
                name: 'HTTP Request',
                type: 'n8n-nodes-base.httpRequest',
                parameters: {
                    url: 'https://example.com/api'
                },
                position: [100, 200]
            };
            const result = nodeMapper.convertN8nNodeToMakeModule(n8nNode);
            const makeModule = result.node;
            (0, globals_1.expect)(makeModule).toEqual({
                id: 'test-id',
                name: 'HTTP Request',
                type: 'http',
                parameters: {
                    url: 'https://example.com/api'
                },
                position: [100, 200]
            });
        });
        (0, globals_1.it)('should throw an error for unknown node types', () => {
            const n8nNode = {
                id: 'test-id',
                name: 'Unknown Node',
                type: 'n8n-nodes-base.unknown',
                parameters: {},
                position: [100, 200]
            };
            // It should throw an error for unknown node types
            (0, globals_1.expect)(() => {
                nodeMapper.convertN8nNodeToMakeModule(n8nNode);
            }).toThrow('No mapping found for n8n node type: n8n-nodes-base.unknown');
        });
    });
    (0, globals_1.describe)('convertMakeModuleToN8nNode', () => {
        (0, globals_1.it)('should convert a Make HTTP module to an n8n HTTP node', () => {
            const makeModule = {
                id: 'test-id',
                name: 'HTTP',
                type: 'http',
                parameters: {
                    url: 'https://example.com/api',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                position: [100, 200]
            };
            const result = nodeMapper.convertMakeModuleToN8nNode(makeModule);
            const n8nNode = result.node;
            (0, globals_1.expect)(n8nNode).toEqual({
                id: 'test-id',
                name: 'HTTP',
                type: 'n8n-nodes-base.httpRequest',
                parameters: {
                    url: 'https://example.com/api',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                position: [100, 200],
                typeVersion: 1
            });
        });
        (0, globals_1.it)('should handle missing parameters', () => {
            const makeModule = {
                id: 'test-id',
                name: 'HTTP',
                type: 'http',
                parameters: {
                    url: 'https://example.com/api'
                },
                position: [100, 200]
            };
            const result = nodeMapper.convertMakeModuleToN8nNode(makeModule);
            const n8nNode = result.node;
            (0, globals_1.expect)(n8nNode).toEqual({
                id: 'test-id',
                name: 'HTTP',
                type: 'n8n-nodes-base.httpRequest',
                parameters: {
                    url: 'https://example.com/api'
                },
                position: [100, 200],
                typeVersion: 1
            });
        });
        (0, globals_1.it)('should create a placeholder node for unknown module types', () => {
            const makeModule = {
                id: 'test-id',
                name: 'Unknown Module',
                type: 'unknown',
                parameters: {},
                position: [100, 200]
            };
            
            const result = nodeMapper.convertMakeModuleToN8nNode(makeModule);
            
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.node).toBeDefined();
            (0, globals_1.expect)(result.node.type).toBe('n8n-nodes-base.noOp');
            (0, globals_1.expect)(result.node.name).toContain('[Unmapped]');
            (0, globals_1.expect)(result.node.parameters.__stubInfo).toBeDefined();
            (0, globals_1.expect)(result.node.parameters.__stubInfo.originalModuleType).toBe('unknown');
        });
    });
    (0, globals_1.describe)('transformParameterValue', () => {
        (0, globals_1.it)('should transform boolean values correctly', () => {
            const value = true;
            const transformed = nodeMapper.transformParameterValue(value, 'n8n', 'make');
            (0, globals_1.expect)(transformed).toBe('1');
        });
        (0, globals_1.it)('should handle string representation of booleans', () => {
            const value = '1';
            const transformed = nodeMapper.transformParameterValue(value, 'make', 'n8n');
            (0, globals_1.expect)(transformed).toBe(true);
        });
        (0, globals_1.it)('should return unmodified value for unknown types', () => {
            const value = { complex: 'object' };
            const transformed = nodeMapper.transformParameterValue(value, 'n8n', 'make');
            (0, globals_1.expect)(transformed).toEqual(value);
        });
    });
});
