"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressionsMakeWorkflow = exports.unsupportedModuleMakeWorkflow = exports.credentialsMakeWorkflow = exports.complexMakeWorkflow = exports.basicMakeWorkflow = void 0;
// Basic Make.com workflow with HTTP module
exports.basicMakeWorkflow = {
    name: "Basic HTTP Workflow",
    flow: [
        {
            id: 1,
            module: "http:ActionSendData",
            version: 1,
            parameters: {},
            mapper: {
                url: "https://example.com/api",
                method: "GET",
            },
            metadata: {
                designer: {
                    x: 0,
                    y: 0,
                },
            },
        },
    ],
    metadata: {
        instant: false,
        version: 1,
        scenario: {
            roundtrips: 1,
            maxErrors: 3,
            autoCommit: true,
            autoCommitTriggerLast: true,
            sequential: false,
            confidential: false,
            dataloss: false,
            dlq: false,
            freshVariables: false,
        },
        designer: {
            orphans: [],
        },
        zone: "us1.make.com",
    },
};
// Complex Make.com workflow with router
exports.complexMakeWorkflow = {
    name: "Complex Workflow",
    flow: [
        {
            id: 1,
            module: "webhook:CustomWebhook",
            version: 1,
            parameters: {},
            mapper: {
                path: "incoming-webhook",
            },
            metadata: {
                designer: {
                    x: 0,
                    y: 0,
                },
            },
        },
        {
            id: 2,
            module: "builtin:BasicRouter",
            version: 1,
            mapper: null,
            metadata: {
                designer: {
                    x: 300,
                    y: 0,
                },
            },
            routes: [
                {
                    condition: {
                        left: "{{1.status}}",
                        operator: "eq",
                        right: "success",
                    },
                    flow: [
                        {
                            id: 3,
                            module: "http:ActionSendData",
                            version: 1,
                            parameters: {},
                            mapper: {
                                url: "https://example.com/api/success",
                                method: "POST",
                                data: "{{1}}",
                            },
                            metadata: {
                                designer: {
                                    x: 600,
                                    y: -100,
                                },
                            },
                        },
                    ],
                },
                {
                    condition: {
                        left: "{{1.status}}",
                        operator: "eq",
                        right: "error",
                    },
                    flow: [
                        {
                            id: 4,
                            module: "http:ActionSendData",
                            version: 1,
                            parameters: {},
                            mapper: {
                                url: "https://example.com/api/error",
                                method: "POST",
                                data: "{{1}}",
                            },
                            metadata: {
                                designer: {
                                    x: 600,
                                    y: 100,
                                },
                            },
                        },
                    ],
                },
            ],
        },
    ],
    metadata: {
        instant: false,
        version: 1,
        scenario: {
            roundtrips: 1,
            maxErrors: 3,
            autoCommit: true,
            autoCommitTriggerLast: true,
            sequential: false,
            confidential: false,
            dataloss: false,
            dlq: false,
            freshVariables: false,
        },
        designer: {
            orphans: [],
        },
        zone: "us1.make.com",
    },
};
// Make.com workflow with credentials
exports.credentialsMakeWorkflow = {
    name: "Workflow with Credentials",
    flow: [
        {
            id: 1,
            module: "http:ActionSendData",
            version: 1,
            parameters: {
                __IMTCONN__: "123456",
            },
            mapper: {
                url: "https://api.example.com/data",
                method: "GET",
                authentication: {
                    type: "basic",
                    username: "user",
                    password: "pass",
                },
            },
            metadata: {
                designer: {
                    x: 0,
                    y: 0,
                },
            },
        },
    ],
    metadata: {
        instant: false,
        version: 1,
        scenario: {
            roundtrips: 1,
            maxErrors: 3,
            autoCommit: true,
            autoCommitTriggerLast: true,
            sequential: false,
            confidential: false,
            dataloss: false,
            dlq: false,
            freshVariables: false,
        },
        designer: {
            orphans: [],
        },
        zone: "us1.make.com",
    },
};
// Make.com workflow with unsupported module
exports.unsupportedModuleMakeWorkflow = {
    name: "Workflow with Unsupported Module",
    flow: [
        {
            id: 1,
            module: "custom:CustomAction",
            version: 1,
            parameters: {},
            mapper: {
                customField: "custom value",
            },
            metadata: {
                designer: {
                    x: 0,
                    y: 0,
                },
            },
        },
    ],
    metadata: {
        instant: false,
        version: 1,
        scenario: {
            roundtrips: 1,
            maxErrors: 3,
            autoCommit: true,
            autoCommitTriggerLast: true,
            sequential: false,
            confidential: false,
            dataloss: false,
            dlq: false,
            freshVariables: false,
        },
        designer: {
            orphans: [],
        },
        zone: "us1.make.com",
    },
};
// Make.com workflow with expressions
exports.expressionsMakeWorkflow = {
    name: "Workflow with Expressions",
    flow: [
        {
            id: 1,
            module: "http:ActionSendData",
            version: 1,
            parameters: {},
            mapper: {
                url: "{{1.id}}",
                method: "GET",
            },
            metadata: {
                designer: {
                    x: 0,
                    y: 0,
                },
            },
        },
        {
            id: 2,
            module: "tools:ActionRunJavascript",
            version: 1,
            parameters: {},
            mapper: {
                code: `
                    // Function code with complex expressions
                    return {
                        processedData: items[0].data.map(item => {
                            return {
                                id: item.id,
                                value: item.value * 2
                            };
                        })
                    };
                `
            },
            metadata: {
                designer: {
                    x: 300,
                    y: 0,
                },
            },
        }
    ],
    metadata: {
        instant: false,
        version: 1,
        scenario: {
            roundtrips: 1,
            maxErrors: 3,
            autoCommit: true,
            autoCommitTriggerLast: true,
            sequential: false,
            confidential: false,
            dataloss: false,
            dlq: false,
            freshVariables: false,
        },
        designer: {
            orphans: [],
        },
        zone: "us1.make.com",
    },
};
