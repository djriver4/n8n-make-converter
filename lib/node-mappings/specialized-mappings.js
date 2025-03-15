"use strict";
/**
 * Specialized Node Mappings
 *
 * This file contains mappings for specialized node types that require custom handling
 * during the conversion process between n8n and Make.com.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.specializedMappings = void 0;
exports.registerSpecializedMappings = registerSpecializedMappings;
/**
 * Collection of specialized node mappings
 */
exports.specializedMappings = {
    /**
     * HTTP Request node mapping (n8n to Make)
     */
    'httpRequest': {
        n8nNodeType: 'n8n-nodes-base.httpRequest',
        makeModuleType: 'http',
        displayName: 'HTTP Request',
        description: 'Make HTTP requests to any API',
        category: 'Communication',
        version: '1.0',
        icon: 'http.svg',
        parameterMappings: [
            {
                sourcePath: 'url',
                targetPath: 'URL',
                required: true
            },
            {
                sourcePath: 'method',
                targetPath: 'method',
                required: true
            },
            {
                sourcePath: 'authentication',
                targetPath: 'authentication.type',
                transform: (value) => {
                    // Map n8n auth types to Make.com auth types
                    const authMap = {
                        'none': 'none',
                        'basicAuth': 'basic',
                        'headerAuth': 'custom',
                        'queryAuth': 'custom',
                        'oauth1': 'oauth1',
                        'oauth2': 'oauth2',
                        'digestAuth': 'digest'
                    };
                    return authMap[value] || 'none';
                }
            },
            {
                sourcePath: 'headers',
                targetPath: 'headers'
            },
            {
                sourcePath: 'queryParameters',
                targetPath: 'params'
            },
            {
                sourcePath: 'options.redirect.follow',
                targetPath: 'followRedirects',
                defaultValue: true
            },
            {
                sourcePath: 'options.timeout',
                targetPath: 'timeout',
                defaultValue: 5000
            },
            {
                sourcePath: 'options.responseFormat',
                targetPath: 'parseResponse',
                transform: (value) => value === 'json' || value === 'xml'
            }
        ],
        // Custom function to handle any special transformations
        customTransform: (sourceNode, context) => {
            // Additional custom transformations if needed
            return {};
        }
    },
    /**
     * MongoDB node mapping (n8n to Make)
     */
    'mongoDb': {
        n8nNodeType: 'n8n-nodes-base.mongoDb',
        makeModuleType: 'mongodb',
        displayName: 'MongoDB',
        description: 'Work with MongoDB databases',
        category: 'Database',
        version: '1.0',
        icon: 'mongodb.svg',
        parameterMappings: [
            {
                sourcePath: 'operation',
                targetPath: 'operation',
                transform: (value) => {
                    // Map n8n operations to Make operations
                    const operationMap = {
                        'delete': 'deleteOne',
                        'deleteMany': 'deleteMany',
                        'find': 'find',
                        'findOne': 'findOne',
                        'insert': 'insertOne',
                        'insertMany': 'insertMany',
                        'update': 'updateOne',
                        'updateMany': 'updateMany'
                    };
                    return operationMap[value] || value;
                }
            },
            {
                sourcePath: 'collection',
                targetPath: 'collection',
                required: true
            },
            {
                sourcePath: 'options.upsert',
                targetPath: 'options.upsert'
            },
            {
                sourcePath: 'options.limit',
                targetPath: 'limit'
            },
            {
                sourcePath: 'options.sort',
                targetPath: 'sort'
            }
        ]
    },
    /**
     * Filter node mapping (n8n to Make)
     */
    'filter': {
        n8nNodeType: 'n8n-nodes-base.filter',
        makeModuleType: 'filter',
        displayName: 'Filter',
        description: 'Filter data based on conditions',
        category: 'Flow Control',
        version: '1.0',
        icon: 'filter.svg',
        parameterMappings: [
            {
                sourcePath: 'conditions',
                targetPath: 'conditions',
                transform: (value) => {
                    if (!value || typeof value !== 'object')
                        return { mode: 'and', conditions: [] };
                    // Transform n8n filter conditions to Make.com format
                    const makeConditions = [];
                    const conditions = value;
                    // Process string conditions
                    if (conditions.string) {
                        for (const condition of conditions.string) {
                            makeConditions.push({
                                field1: condition.value1,
                                operation: mapFilterOperation(condition.operation),
                                field2: condition.value2
                            });
                        }
                    }
                    // Process number conditions
                    if (conditions.number) {
                        for (const condition of conditions.number) {
                            makeConditions.push({
                                field1: condition.value1,
                                operation: mapFilterOperation(condition.operation),
                                field2: condition.value2
                            });
                        }
                    }
                    // Process boolean conditions
                    if (conditions.boolean) {
                        for (const condition of conditions.boolean) {
                            makeConditions.push({
                                field1: condition.value1,
                                operation: mapFilterOperation(condition.operation),
                                field2: condition.value2
                            });
                        }
                    }
                    return {
                        mode: conditions.mode || 'and',
                        conditions: makeConditions
                    };
                }
            }
        ]
    },
    /**
     * Function node mapping (n8n to Make)
     */
    'function': {
        n8nNodeType: 'n8n-nodes-base.function',
        makeModuleType: 'code',
        displayName: 'Function',
        description: 'Execute custom JavaScript code',
        category: 'Development',
        version: '1.0',
        icon: 'function.svg',
        parameterMappings: [
            {
                sourcePath: 'functionCode',
                targetPath: 'code',
                transform: (value) => {
                    // Convert n8n function code to Make.com format
                    const code = value;
                    // Strip n8n-specific parts and adapt to Make.com format
                    const convertedCode = code
                        // Replace n8n items array reference with Make.com's item object
                        .replace(/for\s*\(\s*const\s+item\s+of\s+items\s*\)\s*{/g, 'const item = item;')
                        // Replace references to item.json with direct item references
                        .replace(/item\.json\./g, 'item.')
                        // Replace the return statement
                        .replace(/return\s+items\s*;/, 'return item;');
                    return convertedCode;
                }
            }
        ]
    },
    /**
     * Set node mapping (n8n to Make)
     */
    'set': {
        n8nNodeType: 'n8n-nodes-base.set',
        makeModuleType: 'setVariable',
        displayName: 'Set Variable',
        description: 'Set variables in the workflow',
        category: 'Flow Control',
        version: '1.0',
        icon: 'set.svg',
        parameterMappings: [
            {
                sourcePath: 'values',
                targetPath: 'variables',
                transform: (value) => {
                    if (!value || typeof value !== 'object')
                        return [];
                    const values = value;
                    const variables = [];
                    // Process string values
                    if (values.string) {
                        for (const item of values.string) {
                            variables.push({
                                name: item.name,
                                value: item.value
                            });
                        }
                    }
                    // Process number values
                    if (values.number) {
                        for (const item of values.number) {
                            variables.push({
                                name: item.name,
                                value: item.value
                            });
                        }
                    }
                    // Process boolean values
                    if (values.boolean) {
                        for (const item of values.boolean) {
                            variables.push({
                                name: item.name,
                                value: item.value
                            });
                        }
                    }
                    // Process object values
                    if (values.object) {
                        for (const item of values.object) {
                            variables.push({
                                name: item.name,
                                value: item.value
                            });
                        }
                    }
                    return variables;
                }
            }
        ]
    },
    /**
     * IF node mapping (n8n to Make)
     */
    'if': {
        n8nNodeType: 'n8n-nodes-base.if',
        makeModuleType: 'router',
        displayName: 'Router',
        description: 'Route execution based on conditions',
        category: 'Flow Control',
        version: '1.0',
        icon: 'router.svg',
        parameterMappings: [
            {
                sourcePath: 'conditions',
                targetPath: 'routes',
                transform: (value) => {
                    if (!value || typeof value !== 'object')
                        return [];
                    const conditions = value;
                    const routes = [
                        // True condition route
                        {
                            condition: {
                                field1: "", // This will be filled by the custom transform
                                operation: "true",
                                field2: ""
                            },
                            label: "True"
                        },
                        // False condition route
                        {
                            condition: {
                                field1: "",
                                operation: "false",
                                field2: ""
                            },
                            label: "False"
                        }
                    ];
                    return routes;
                }
            }
        ],
        // Custom function to handle any special transformations
        customTransform: (sourceNode, context) => {
            // Construct a condition from n8n IF node conditions
            if (sourceNode.parameters && sourceNode.parameters.conditions) {
                const conditions = sourceNode.parameters.conditions;
                let conditionField1 = "";
                if (conditions.string && conditions.string.length > 0) {
                    const condition = conditions.string[0];
                    conditionField1 = condition.value1;
                    const routes = [
                        {
                            condition: {
                                field1: condition.value1,
                                operation: mapFilterOperation(condition.operation),
                                field2: condition.value2
                            },
                            label: "True"
                        },
                        {
                            condition: {
                                field1: "", // This is an else route
                                operation: "else",
                                field2: ""
                            },
                            label: "False"
                        }
                    ];
                    return { parameters: { routes } };
                }
                else if (conditions.number && conditions.number.length > 0) {
                    const condition = conditions.number[0];
                    const routes = [
                        {
                            condition: {
                                field1: condition.value1,
                                operation: mapFilterOperation(condition.operation),
                                field2: condition.value2
                            },
                            label: "True"
                        },
                        {
                            condition: {
                                field1: "",
                                operation: "else",
                                field2: ""
                            },
                            label: "False"
                        }
                    ];
                    return { parameters: { routes } };
                }
                else if (conditions.boolean && conditions.boolean.length > 0) {
                    const condition = conditions.boolean[0];
                    const routes = [
                        {
                            condition: {
                                field1: condition.value1,
                                operation: mapFilterOperation(condition.operation),
                                field2: condition.value2
                            },
                            label: "True"
                        },
                        {
                            condition: {
                                field1: "",
                                operation: "else",
                                field2: ""
                            },
                            label: "False"
                        }
                    ];
                    return { parameters: { routes } };
                }
            }
            return {};
        }
    },
    /**
     * Merge node mapping (n8n to Make)
     */
    'merge': {
        n8nNodeType: 'n8n-nodes-base.merge',
        makeModuleType: 'aggregator',
        displayName: 'Aggregator',
        description: 'Aggregate data from multiple routes',
        category: 'Flow Control',
        version: '1.0',
        icon: 'merge.svg',
        parameterMappings: [
            {
                sourcePath: 'mode',
                targetPath: 'aggregationType',
                transform: (value) => {
                    // Map n8n merge modes to Make aggregator types
                    const modeMap = {
                        'append': 'append',
                        'merge': 'combine',
                        'multiplex': 'multiplex'
                    };
                    return modeMap[value] || 'append';
                }
            },
            {
                targetPath: 'targetData',
                defaultValue: 'combinedData'
            }
        ]
    },
    /**
     * Manual Trigger node mapping (n8n to Make)
     */
    'manualTrigger': {
        n8nNodeType: 'n8n-nodes-base.manualTrigger',
        makeModuleType: 'scheduler',
        displayName: 'Manual Trigger',
        description: 'Trigger workflow manually',
        category: 'Triggers',
        version: '1.0',
        icon: 'trigger.svg',
        parameterMappings: [
            {
                targetPath: 'interval',
                defaultValue: {
                    value: 1,
                    unit: 'days'
                }
            }
        ],
        // Custom function to add a note about manual trigger conversion
        customTransform: (sourceNode, context) => {
            return {
                notes: "Converted from n8n Manual Trigger. Make.com doesn't have a direct equivalent to n8n's manual trigger, so a Scheduler module is used as a placeholder. Consider replacing with a more appropriate trigger."
            };
        }
    }
};
/**
 * Helper function to map n8n filter operations to Make.com filter operations
 */
function mapFilterOperation(operation) {
    const operationMap = {
        'contains': 'contains',
        'notContains': 'notContains',
        'endsWith': 'endsWith',
        'startsWith': 'startsWith',
        'equal': 'equal',
        'notEqual': 'notEqual',
        'regex': 'regex',
        'larger': 'greaterThan',
        'largerEqual': 'greaterThanOrEqual',
        'smaller': 'lessThan',
        'smallerEqual': 'lessThanOrEqual',
        'isEmpty': 'isEmpty',
        'isNotEmpty': 'isNotEmpty',
        'true': 'true',
        'false': 'false'
    };
    return operationMap[operation] || operation;
}
/**
 * Register all specialized mappings
 * @param mappingLoader The mapping loader to register with
 */
function registerSpecializedMappings(mappingLoader) {
    for (const [key, mapping] of Object.entries(exports.specializedMappings)) {
        mappingLoader.registerMapping(key, mapping);
    }
}
exports.default = exports.specializedMappings;
