"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressionsN8nWorkflow = exports.unsupportedNodeN8nWorkflow = exports.credentialsN8nWorkflow = exports.complexN8nWorkflow = exports.basicN8nWorkflow = void 0;
// Basic n8n workflow with HTTP Request node
exports.basicN8nWorkflow = {
    name: "Basic HTTP Workflow",
    nodes: [
        {
            id: "1",
            name: "Start",
            type: "n8n-nodes-base.start",
            position: [100, 300],
            parameters: {},
        },
        {
            id: "2",
            name: "HTTP Request",
            type: "n8n-nodes-base.httpRequest",
            position: [300, 300],
            parameters: {
                url: "https://example.com/api",
                method: "GET",
                authentication: "none",
                options: {},
            },
        },
    ],
    connections: {
        Start: {
            main: [
                [
                    {
                        node: "HTTP Request",
                        type: "main",
                        index: 0,
                    },
                ],
            ],
        },
    },
};
// Complex n8n workflow with multiple nodes and connections
exports.complexN8nWorkflow = {
    name: "Complex Workflow",
    nodes: [
        {
            id: "1",
            name: "Webhook",
            type: "n8n-nodes-base.webhook",
            position: [100, 300],
            parameters: {
                path: "incoming-webhook",
                responseMode: "lastNode",
            },
        },
        {
            id: "2",
            name: "Switch",
            type: "n8n-nodes-base.switch",
            position: [300, 300],
            parameters: {
                rules: {
                    conditions: [
                        {
                            value1: "={{ $json.status }}",
                            operation: "equal",
                            value2: "success",
                        },
                        {
                            value1: "={{ $json.status }}",
                            operation: "equal",
                            value2: "error",
                        },
                    ],
                },
            },
        },
        {
            id: "3",
            name: "HTTP Success",
            type: "n8n-nodes-base.httpRequest",
            position: [500, 200],
            parameters: {
                url: "https://example.com/api/success",
                method: "POST",
                body: "={{ $json }}",
            },
        },
        {
            id: "4",
            name: "HTTP Error",
            type: "n8n-nodes-base.httpRequest",
            position: [500, 400],
            parameters: {
                url: "https://example.com/api/error",
                method: "POST",
                body: "={{ $json }}",
            },
        },
    ],
    connections: {
        Webhook: {
            main: [
                [
                    {
                        node: "Switch",
                        type: "main",
                        index: 0,
                    },
                ],
            ],
        },
        Switch: {
            main: [
                [
                    {
                        node: "HTTP Success",
                        type: "main",
                        index: 0,
                    },
                ],
                [
                    {
                        node: "HTTP Error",
                        type: "main",
                        index: 0,
                    },
                ],
            ],
        },
    },
};
// n8n workflow with credentials
exports.credentialsN8nWorkflow = {
    name: "Workflow with Credentials",
    nodes: [
        {
            id: "1",
            name: "Start",
            type: "n8n-nodes-base.start",
            position: [100, 300],
            parameters: {},
        },
        {
            id: "2",
            name: "HTTP Request",
            type: "n8n-nodes-base.httpRequest",
            position: [300, 300],
            parameters: {
                url: "https://api.example.com/data",
                method: "GET",
                authentication: "basicAuth",
            },
            credentials: {
                httpBasicAuth: {
                    id: "123",
                    name: "Example API Credentials",
                },
            },
        },
    ],
    connections: {
        Start: {
            main: [
                [
                    {
                        node: "HTTP Request",
                        type: "main",
                        index: 0,
                    },
                ],
            ],
        },
    },
};
// n8n workflow with unsupported node type
exports.unsupportedNodeN8nWorkflow = {
    name: "Workflow with Unsupported Node",
    nodes: [
        {
            id: "1",
            name: "Start",
            type: "n8n-nodes-base.start",
            position: [100, 300],
            parameters: {},
        },
        {
            id: "2",
            name: "Custom Node",
            type: "custom-nodes-base.customAction",
            position: [300, 300],
            parameters: {
                customField: "custom value",
            },
        },
    ],
    connections: {
        Start: {
            main: [
                [
                    {
                        node: "Custom Node",
                        type: "main",
                        index: 0,
                    },
                ],
            ],
        },
    },
};
// n8n workflow with complex expressions
exports.expressionsN8nWorkflow = {
    name: "Workflow with Expressions",
    nodes: [
        {
            id: "1",
            name: "Start",
            type: "n8n-nodes-base.start",
            position: [100, 300],
            parameters: {},
        },
        {
            id: "2",
            name: "Set",
            type: "n8n-nodes-base.set",
            position: [300, 300],
            parameters: {
                values: {
                    number: [
                        {
                            name: "count",
                            value: 1,
                        },
                    ],
                    string: [
                        {
                            name: "message",
                            value: "={{ $json.data.map(item => item.name).join(', ') }}",
                        },
                    ],
                },
            },
        },
        {
            id: "3",
            name: "HTTP Request",
            type: "n8n-nodes-base.httpRequest",
            position: [500, 300],
            parameters: {
                url: "={{ 'https://example.com/api/' + $json.id }}",
                method: "GET",
            },
        },
    ],
    connections: {
        Start: {
            main: [
                [
                    {
                        node: "Set",
                        type: "main",
                        index: 0,
                    },
                ],
            ],
        },
        Set: {
            main: [
                [
                    {
                        node: "HTTP Request",
                        type: "main",
                        index: 0,
                    },
                ],
            ],
        },
    },
};
