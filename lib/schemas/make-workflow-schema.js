"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeWorkflowSchema = void 0;
// Define a simpler schema for validation
exports.makeWorkflowSchema = {
    type: 'object',
    required: ['name', 'flow'],
    properties: {
        name: { type: 'string' },
        flow: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'name', 'type', 'parameters', 'metadata'],
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    parameters: {
                        type: 'object',
                        additionalProperties: true
                    },
                    metadata: {
                        type: 'object',
                        properties: {
                            designer: {
                                type: 'object',
                                properties: {
                                    x: { type: 'number' },
                                    y: { type: 'number' }
                                },
                                additionalProperties: true
                            }
                        },
                        additionalProperties: true
                    },
                    disabled: { type: 'boolean' }
                },
                additionalProperties: true
            }
        }
    },
    additionalProperties: true
};
