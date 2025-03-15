"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverageValidator = void 0;
const node_mapping_1 = require("../mappings/node-mapping");
const plugin_registry_1 = require("../plugins/plugin-registry");
const n8n_to_make_1 = require("../converters/n8n-to-make");
const make_to_n8n_1 = require("../converters/make-to-n8n");
const debug_tracker_1 = require("../debug-tracker");
class CoverageValidator {
    /**
     * Validates the coverage of n8n node types
     */
    static validateN8nCoverage() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all node mappings
            const nodeMappings = (0, node_mapping_1.getNodeMappings)().n8nToMake;
            const pluginMappings = (0, plugin_registry_1.getPluginRegistry)().getNodeMappings().n8nToMake;
            // Combine mappings
            const allMappings = Object.assign(Object.assign({}, nodeMappings), pluginMappings);
            // Define a list of common n8n node types to test
            const commonNodeTypes = [
                "n8n-nodes-base.httpRequest",
                "n8n-nodes-base.set",
                "n8n-nodes-base.function",
                "n8n-nodes-base.if",
                "n8n-nodes-base.switch",
                "n8n-nodes-base.gmail",
                "n8n-nodes-base.googleSheets",
                "n8n-nodes-base.slack",
                "n8n-nodes-base.webhook",
                "n8n-nodes-base.emailSend",
                "n8n-nodes-base.noOp",
                "n8n-nodes-base.merge",
                "n8n-nodes-base.splitInBatches",
                "n8n-nodes-base.openWeatherMap",
                "n8n-nodes-base.notion",
                "n8n-nodes-base.airtable",
                "n8n-nodes-base.trello",
                "n8n-nodes-base.github",
                "n8n-nodes-base.jira",
                "n8n-nodes-base.salesforce",
            ];
            // Check which node types are mapped
            const mappedNodes = [];
            const unmappedNodes = [];
            for (const nodeType of commonNodeTypes) {
                if (allMappings[nodeType]) {
                    mappedNodes.push(nodeType);
                }
                else {
                    unmappedNodes.push(nodeType);
                }
            }
            // Calculate coverage
            const totalNodeTypes = commonNodeTypes.length;
            const mappedNodeTypes = mappedNodes.length;
            const coveragePercentage = Math.round((mappedNodeTypes / totalNodeTypes) * 100);
            return {
                totalNodeTypes,
                mappedNodeTypes,
                unmappedNodeTypes: unmappedNodes.length,
                coveragePercentage,
                unmappedNodes,
            };
        });
    }
    /**
     * Validates the coverage of Make.com module types
     */
    static validateMakeCoverage() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all node mappings
            const nodeMappings = (0, node_mapping_1.getNodeMappings)().makeToN8n;
            const pluginMappings = (0, plugin_registry_1.getPluginRegistry)().getNodeMappings().makeToN8n;
            // Combine mappings
            const allMappings = Object.assign(Object.assign({}, nodeMappings), pluginMappings);
            // Define a list of common Make.com module types to test
            const commonModuleTypes = [
                "http:ActionSendData",
                "gmail:ActionSendEmail",
                "google-sheets:addRow",
                "builtin:BasicRouter",
                "webhook:CustomWebhook",
                "helper:Note",
                "helper:TriggerApp",
                "weather:ActionGetCurrentWeather",
                "slack:ActionSendMessage",
                "notion:ActionCreatePage",
                "airtable:ActionCreateRecord",
                "trello:ActionCreateCard",
                "github:ActionCreateIssue",
                "jira:ActionCreateIssue",
                "salesforce:ActionCreateRecord",
            ];
            // Check which module types are mapped
            const mappedModules = [];
            const unmappedModules = [];
            for (const moduleType of commonModuleTypes) {
                if (allMappings[moduleType]) {
                    mappedModules.push(moduleType);
                }
                else {
                    unmappedModules.push(moduleType);
                }
            }
            // Calculate coverage
            const totalNodeTypes = commonModuleTypes.length;
            const mappedNodeTypes = mappedModules.length;
            const coveragePercentage = Math.round((mappedNodeTypes / totalNodeTypes) * 100);
            return {
                totalNodeTypes,
                mappedNodeTypes,
                unmappedNodeTypes: unmappedModules.length,
                coveragePercentage,
                unmappedNodes: unmappedModules,
            };
        });
    }
    /**
     * Tests a conversion with a sample workflow to validate node mapping
     */
    static testConversion(direction) {
        return __awaiter(this, void 0, void 0, function* () {
            const debugTracker = new debug_tracker_1.DebugTracker();
            if (direction === "n8nToMake") {
                // Create a sample n8n workflow with various node types
                const sampleWorkflow = {
                    name: "Test Workflow",
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
                                url: "https://example.com",
                                method: "GET",
                            },
                        },
                        {
                            id: "3",
                            name: "Switch",
                            type: "n8n-nodes-base.switch",
                            position: [500, 300],
                            parameters: {
                                rules: {
                                    conditions: [
                                        {
                                            value1: "={{ $json.status }}",
                                            operation: "equal",
                                            value2: "success",
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            id: "4",
                            name: "Weather",
                            type: "n8n-nodes-base.openWeatherMap",
                            position: [700, 300],
                            parameters: {
                                cityName: "New York",
                                units: "metric",
                            },
                        },
                        {
                            id: "5",
                            name: "Custom Node",
                            type: "custom-nodes-base.customAction",
                            position: [900, 300],
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
                                        node: "HTTP Request",
                                        type: "main",
                                        index: 0,
                                    },
                                ],
                            ],
                        },
                        "HTTP Request": {
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
                                        node: "Weather",
                                        type: "main",
                                        index: 0,
                                    },
                                ],
                            ],
                        },
                        Weather: {
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
                // Convert the workflow
                const result = yield (0, n8n_to_make_1.n8nToMake)(sampleWorkflow, debugTracker);
                // Return the debug report
                return debugTracker.getDebugReport();
            }
            else {
                // Create a sample Make.com workflow with various module types
                const sampleWorkflow = {
                    name: "Test Workflow",
                    flow: [
                        {
                            id: 1,
                            module: "webhook:CustomWebhook",
                            version: 1,
                            parameters: {},
                            mapper: {
                                path: "webhook",
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
                            module: "http:ActionSendData",
                            version: 1,
                            parameters: {},
                            mapper: {
                                url: "https://example.com",
                                method: "GET",
                            },
                            metadata: {
                                designer: {
                                    x: 300,
                                    y: 0,
                                },
                            },
                        },
                        {
                            id: 3,
                            module: "builtin:BasicRouter",
                            version: 1,
                            mapper: null,
                            metadata: {
                                designer: {
                                    x: 600,
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
                                            id: 4,
                                            module: "weather:ActionGetCurrentWeather",
                                            version: 1,
                                            parameters: {},
                                            mapper: {
                                                city: "New York",
                                                units: "metric",
                                            },
                                            metadata: {
                                                designer: {
                                                    x: 900,
                                                    y: 0,
                                                },
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            id: 5,
                            module: "custom:CustomModule",
                            version: 1,
                            parameters: {},
                            mapper: {
                                customField: "custom value",
                            },
                            metadata: {
                                designer: {
                                    x: 1200,
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
                // Convert the workflow
                const result = yield (0, make_to_n8n_1.makeToN8n)(sampleWorkflow, debugTracker);
                // Return the debug report
                return debugTracker.getDebugReport();
            }
        });
    }
}
exports.CoverageValidator = CoverageValidator;
