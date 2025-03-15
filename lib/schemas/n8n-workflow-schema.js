"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.n8nWorkflowSchema = void 0;
// Define a simpler schema for validation
exports.n8nWorkflowSchema = {
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
