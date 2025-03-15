"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFixture = loadFixture;
exports.compareWorkflows = compareWorkflows;
exports.toMatchWorkflowStructure = toMatchWorkflowStructure;
exports.validateParameterConversion = validateParameterConversion;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Default fallback data for n8n workflows when fixtures aren't available
 */
const DEFAULT_N8N_WORKFLOW = {
    "name": "Default n8n Test Workflow",
    "nodes": [
        {
            "id": "a1b2c3",
            "name": "HTTP Request",
            "type": "n8n-nodes-base.httpRequest",
            "parameters": {
                "url": "https://example.com/api",
                "method": "GET",
                "authentication": "none",
                "options": {
                    "timeout": 5000
                }
            },
            "position": [100, 200],
            "typeVersion": 1
        },
        {
            "id": "d4e5f6",
            "name": "JSON Parse",
            "type": "n8n-nodes-base.jsonParse",
            "parameters": {
                "property": "data",
                "options": {}
            },
            "position": [300, 200],
            "typeVersion": 1
        },
        {
            "id": "g7h8i9",
            "name": "Function",
            "type": "n8n-nodes-base.function",
            "parameters": {
                "functionCode": "// Code that contains complex expressions\nreturn {\n  result: $input.first().json.data.map(item => item.value * 2)\n};"
            },
            "position": [500, 200],
            "typeVersion": 1
        }
    ],
    "connections": {
        "HTTP Request": {
            "main": [
                [
                    {
                        "node": "JSON Parse",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "JSON Parse": {
            "main": [
                [
                    {
                        "node": "Function",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        }
    },
    "active": true,
    "settings": {
        "executionOrder": "v1"
    }
};
/**
 * Default fallback data for Make workflows when fixtures aren't available
 */
const DEFAULT_MAKE_WORKFLOW = {
    "name": "Default Make Test Workflow",
    "flow": [
        {
            "id": "a1b2c3",
            "module": "http:ActionSendData",
            "label": "HTTP Request",
            "mapper": {
                "url": "https://example.com/api",
                "method": "GET"
            },
            "parameters": {}
        },
        {
            "id": "d4e5f6",
            "module": "json",
            "label": "JSON Parse",
            "mapper": {
                "parsedObject": "{{a1b2c3.data}}"
            },
            "parameters": {}
        },
        {
            "id": "g7h8i9",
            "module": "tools",
            "label": "Function",
            "mapper": {
                "code": "// Code that contains complex expressions\nreturn {\n  result: items[0].data.map(function(item) {\n    return item.value * 2;\n  })\n};"
            },
            "parameters": {}
        }
    ],
    "metadata": {
        "instant": false,
        "version": 1,
        "scenario": {
            "roundtrips": 1,
            "maxErrors": 3,
            "autoCommit": true,
            "autoCommitTriggerLast": true,
            "sequential": false,
            "confidential": false,
            "dataloss": false,
            "dlq": false,
            "source": "n8n-converter"
        },
        "designer": {
            "orphans": []
        }
    }
};
/**
 * A better fixture loading function with validation and fallback mechanisms
 *
 * @param platform The platform ('n8n' or 'make')
 * @param name The name of the fixture file without extension
 * @param options Additional options for loading
 * @returns The loaded fixture data
 */
function loadFixture(platform, name, options = { useFallback: true, validateStructure: true, logWarnings: true }) {
    const fixturePath = path_1.default.join(__dirname, '..', 'fixtures', `${platform}`, `${name}.json`);
    try {
        // Check if file exists
        if (!fs_1.default.existsSync(fixturePath)) {
            throw new Error(`Fixture file not found: ${fixturePath}`);
        }
        // Try to read and parse the file
        const fileContents = fs_1.default.readFileSync(fixturePath, 'utf8');
        const fixtureData = JSON.parse(fileContents);
        // Basic validation of the structure
        if (options.validateStructure) {
            if (platform === 'n8n') {
                if (!fixtureData.nodes || !Array.isArray(fixtureData.nodes)) {
                    throw new Error(`Invalid n8n workflow structure - nodes array missing`);
                }
                if (!fixtureData.connections) {
                    throw new Error(`Invalid n8n workflow structure - connections object missing`);
                }
            }
            else if (platform === 'make') {
                // Make.com workflow can have modules or flow array
                if ((!fixtureData.modules && !fixtureData.flow) ||
                    (fixtureData.modules && !Array.isArray(fixtureData.modules)) ||
                    (fixtureData.flow && !Array.isArray(fixtureData.flow))) {
                    throw new Error(`Invalid Make workflow structure - modules/flow array missing`);
                }
            }
        }
        // Add a source attribute to track where this data came from
        fixtureData.__source = { type: 'fixture', path: fixturePath };
        return fixtureData;
    }
    catch (error) {
        // Handle error based on options
        const errorMessage = `Failed to load fixture: ${fixturePath} - ${error instanceof Error ? error.message : String(error)}`;
        if (options.logWarnings) {
            console.warn(errorMessage);
            console.warn('Using fallback test data instead.');
        }
        if (options.useFallback) {
            // Return fallback data
            const fallbackData = platform === 'n8n' ? Object.assign({}, DEFAULT_N8N_WORKFLOW) : Object.assign({}, DEFAULT_MAKE_WORKFLOW);
            // Add a source attribute to track where this data came from
            fallbackData.__source = { type: 'fallback', original: errorMessage };
            return fallbackData;
        }
        else {
            throw new Error(errorMessage);
        }
    }
}
/**
 * Compare two workflows and return whether they match and any differences found
 */
function compareWorkflows(actual, expected, options = {}) {
    const differences = [];
    const currentPath = options.path || '';
    const ignoreFields = options.ignoreFields || ['id', 'position', 'createdAt', 'updatedAt', '__source'];
    // If one is null/undefined and the other isn't
    if ((actual === null || actual === undefined) !== (expected === null || expected === undefined)) {
        differences.push(`${currentPath}: One value is ${actual === null ? 'null' : 'undefined'} while the other is defined`);
        return { matches: false, differences };
    }
    // Both null or undefined - considered equal
    if (actual === null || actual === undefined) {
        return { matches: true, differences };
    }
    // Different types
    if (typeof actual !== typeof expected) {
        differences.push(`${currentPath}: Type mismatch - ${typeof actual} vs ${typeof expected}`);
        return { matches: false, differences };
    }
    // Handle arrays
    if (Array.isArray(actual) && Array.isArray(expected)) {
        // Different array lengths
        if (actual.length !== expected.length) {
            differences.push(`${currentPath}: Array length mismatch - ${actual.length} vs ${expected.length}`);
        }
        // Compare each element
        const minLength = Math.min(actual.length, expected.length);
        for (let i = 0; i < minLength; i++) {
            const { matches: elementMatches, differences: elementDifferences } = compareWorkflows(actual[i], expected[i], {
                ignoreFields,
                path: `${currentPath}[${i}]`
            });
            if (!elementMatches) {
                differences.push(...elementDifferences);
            }
        }
        return { matches: differences.length === 0, differences };
    }
    // Handle objects (other than arrays)
    if (typeof actual === 'object' && typeof expected === 'object') {
        // Special handling for workflow structures
        if (!currentPath) {
            // Check n8n workflow
            if ('nodes' in expected) {
                if (!('nodes' in actual)) {
                    differences.push("Expected n8n workflow with 'nodes' property but it's missing");
                }
                if (!('connections' in actual)) {
                    differences.push("Expected n8n workflow with 'connections' property but it's missing");
                }
            }
            // Check Make workflow
            if ('flow' in expected) {
                if (!('flow' in actual)) {
                    differences.push("Expected Make workflow with 'flow' property but it's missing");
                }
            }
        }
        // Compare all keys in expected object
        for (const key of Object.keys(expected)) {
            // Skip ignored fields
            if (ignoreFields.includes(key)) {
                continue;
            }
            // Get new path
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            // Skip fields that don't exist in the actual object
            if (!(key in actual)) {
                differences.push(`${newPath}: Missing property in actual object`);
                continue;
            }
            // Check for value differences
            const { matches: valueMatches, differences: valueDifferences } = compareWorkflows(actual[key], expected[key], {
                ignoreFields,
                path: newPath
            });
            if (!valueMatches) {
                differences.push(...valueDifferences);
            }
        }
        // Check for extra keys in actual object
        for (const key of Object.keys(actual)) {
            if (ignoreFields.includes(key) || key in expected) {
                continue;
            }
            // Log extra keys as differences
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            differences.push(`${newPath}: Extra property in actual object`);
        }
        return { matches: differences.length === 0, differences };
    }
    // Handle primitive values (strings, numbers, booleans)
    if (actual !== expected) {
        differences.push(`${currentPath}: Value mismatch - ${JSON.stringify(actual)} vs ${JSON.stringify(expected)}`);
    }
    return {
        matches: differences.length === 0,
        differences
    };
}
/**
 * Custom matcher for comparing workflow structures
 */
function toMatchWorkflowStructure(received, expected, options = {}) {
    // First check basic structure type (n8n or Make)
    let structureType = 'unknown';
    if ('nodes' in expected) {
        structureType = 'n8n';
    }
    else if ('flow' in expected) {
        structureType = 'make';
    }
    const structureMatches = (structureType === 'n8n' && 'nodes' in received) ||
        (structureType === 'make' && 'flow' in received);
    if (!structureMatches) {
        return {
            message: () => {
                let message = `Expected workflow structure to match. 
              Received: ${structureType === 'n8n' ? 'Missing nodes property' : 'Missing flow property'}
              Expected: ${structureType === 'n8n' ? 'n8n structure' : 'Make structure'}`;
                if (structureType === 'n8n' && !('nodes' in received)) {
                    message += `\nReceived structure has: ${Object.keys(received).join(', ')}`;
                }
                else if (structureType === 'make' && !('flow' in received)) {
                    message += `\nReceived structure has: ${Object.keys(received).join(', ')}`;
                }
                return message;
            },
            pass: false
        };
    }
    // More detailed comparison
    const { matches, differences } = compareWorkflows(received, expected, options);
    if (matches) {
        return {
            message: () => 'Workflow structures match',
            pass: true
        };
    }
    else {
        return {
            message: () => `Workflow structures don't match:\n${differences.map(d => `- ${d}`).join('\n')}`,
            pass: false
        };
    }
}
/**
 * Validates parameter conversion between platforms
 * Returns information about parameters that need manual adjustment
 */
function validateParameterConversion(workflow, options = { platform: 'n8n' }) {
    const manualAdjustments = {};
    let totalParams = 0;
    let manualCount = 0;
    if (options.platform === 'n8n') {
        // For n8n workflows, check nodes with __stubInfo
        if (workflow.nodes && Array.isArray(workflow.nodes)) {
            workflow.nodes.forEach((node) => {
                if (node.parameters && node.parameters.__stubInfo) {
                    manualAdjustments[node.name] = {
                        nodeType: node.type,
                        originalType: node.parameters.__stubInfo.originalModuleType,
                        reason: 'Unsupported module type',
                    };
                    manualCount++;
                }
            });
            totalParams = workflow.nodes.length;
        }
    }
    else {
        // For Make.com workflows
        if (workflow.flow && Array.isArray(workflow.flow)) {
            workflow.flow.forEach((module) => {
                if (module.mapper && module.mapper.__stubInfo) {
                    manualAdjustments[module.name] = {
                        moduleType: module.module,
                        originalType: module.mapper.__stubInfo.originalNodeType,
                        reason: 'Unsupported node type',
                    };
                    manualCount++;
                }
            });
            totalParams = workflow.flow.length;
        }
    }
    return {
        valid: manualCount === 0,
        manualAdjustments,
        conversionRate: totalParams > 0 ? ((totalParams - manualCount) / totalParams) * 100 : 100,
    };
}
