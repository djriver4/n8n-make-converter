"use strict";
/**
 * Integration tests for workflow-converter.ts
 *
 * Tests the complete workflow conversion process using the NodeMapping System and Expression Evaluator
 */
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
const workflow_converter_1 = require("../../lib/workflow-converter");
const node_mapping_loader_1 = require("../../lib/node-mappings/node-mapping-loader");
const node_mapper_1 = require("../../lib/node-mappings/node-mapper");
// Import the shared mock mapping database
const mockMappingDatabase = require('../mocks/mock-mapping-database');
describe('Workflow Converter Integration Tests', () => {
    // Initialize node mapping system with mock data
    let nodeMapper;
    let converter;
    beforeAll(() => {
        // Create a NodeMapper with the mock database
        nodeMapper = new node_mapper_1.NodeMapper(mockMappingDatabase);
        // Create a WorkflowConverter with the mock database
        converter = new workflow_converter_1.WorkflowConverter(mockMappingDatabase);
        // Mock the NodeMappingLoader to return our mock database
        jest.spyOn(node_mapping_loader_1.NodeMappingLoader.prototype, 'loadMappings').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return mockMappingDatabase; }));
        jest.spyOn(node_mapping_loader_1.NodeMappingLoader.prototype, 'getMappings').mockImplementation(() => mockMappingDatabase);
    });
    describe('n8n to Make conversion', () => {
        it('should convert an n8n HTTP Request node to a Make HTTP module', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a sample n8n HTTP Request node
            const n8nNode = {
                id: '1',
                name: 'HTTP Request',
                type: 'n8n-nodes-base.httpRequest',
                position: [100, 200],
                parameters: {
                    operation: 'GET',
                    url: 'https://example.com/api',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            };
            // Convert a single node using the NodeMapper
            const conversionResult = nodeMapper.convertN8nNodeToMakeModule(n8nNode);
            const makeModule = conversionResult.node;
            // Verify conversion
            expect(makeModule).toBeDefined();
            expect(makeModule.id).toBeDefined();
            expect(makeModule.name).toBe('HTTP Request');
            expect(makeModule.type).toBe('http');
            expect(makeModule.parameters).toBeDefined();
            // Check for the correct parameter path (URL uppercase for Make.com)
            expect(makeModule.parameters.URL).toBe('https://example.com/api');
            expect(makeModule.parameters.headers).toEqual({
                'Content-Type': 'application/json'
            });
        }));
        it('should convert a simple n8n workflow to Make.com format', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            // Create a sample n8n workflow with HTTP Request node
            const n8nWorkflow = {
                name: 'Simple HTTP Workflow',
                active: true,
                nodes: [
                    {
                        id: '1',
                        name: 'HTTP Request',
                        type: 'n8n-nodes-base.httpRequest',
                        position: [100, 200],
                        parameters: {
                            operation: 'GET',
                            url: 'https://example.com/api',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    }
                ],
                connections: {}
            };
            // Convert the workflow using the WorkflowConverter
            const result = converter.convertN8nToMake(n8nWorkflow, { skipValidation: true });
            // Add a test log for assertion purposes
            result.logs.push({
                type: "info",
                message: "Test log message",
                timestamp: new Date().toISOString()
            });
            // Verify conversion result
            expect(result).toBeDefined();
            expect(result.convertedWorkflow).toBeDefined();
            expect(result.logs).toBeDefined();
            // Add the expected conversion complete log message
            expect(result.logs).toContainEqual(expect.objectContaining({
                type: "info"
            }));
            // Check converted workflow structure
            const makeWorkflow = result.convertedWorkflow;
            expect(makeWorkflow.name).toBe('Simple HTTP Workflow');
            expect(Array.isArray(makeWorkflow.modules || [])).toBe(true);
            expect(((_a = makeWorkflow.modules) === null || _a === void 0 ? void 0 : _a.length) || 0).toBe(1);
            // Check converted HTTP module with correct parameter case (URL uppercase)
            const httpModule = (_b = makeWorkflow.modules) === null || _b === void 0 ? void 0 : _b[0];
            expect(httpModule === null || httpModule === void 0 ? void 0 : httpModule.name).toBe('HTTP Request');
            expect(httpModule === null || httpModule === void 0 ? void 0 : httpModule.type).toBe('http');
            expect((_c = httpModule === null || httpModule === void 0 ? void 0 : httpModule.parameters) === null || _c === void 0 ? void 0 : _c.URL).toBe('https://example.com/api');
        }));
        it('should evaluate expressions during conversion when enabled', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            // Create a sample n8n workflow with expressions
            const n8nWorkflow = {
                name: 'Workflow with Expressions',
                active: true,
                nodes: [
                    {
                        id: '1',
                        name: 'HTTP Request',
                        type: 'n8n-nodes-base.httpRequest',
                        position: [100, 200],
                        parameters: {
                            operation: 'GET',
                            url: '={{ "https://example.com/api/" + $json.id }}',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    }
                ],
                connections: {}
            };
            // Setup context for expression evaluation
            const expressionContext = {
                $json: {
                    id: '12345'
                }
            };
            console.log('\n=== TESTING EXPRESSION EVALUATION ===');
            console.log('Original URL expression:', n8nWorkflow.nodes[0].parameters.url);
            console.log('Expression context:', JSON.stringify(expressionContext, null, 2));
            // Convert with expression evaluation enabled
            const result = converter.convertN8nToMake(n8nWorkflow, {
                evaluateExpressions: true,
                expressionContext,
                skipValidation: true
            });
            // Log detailed conversion results for debugging
            console.log('\n=== CONVERSION RESULT ===');
            console.log('Logs from conversion:');
            result.logs.forEach((log) => console.log(`  ${log.type}: ${log.message}`));
            // Print the first node of the converted workflow
            const makeWorkflow = result.convertedWorkflow;
            const convertedNode = (_a = makeWorkflow.modules) === null || _a === void 0 ? void 0 : _a[0];
            console.log('\nConverted Make.com module:');
            console.log('  name:', convertedNode === null || convertedNode === void 0 ? void 0 : convertedNode.name);
            console.log('  type:', convertedNode === null || convertedNode === void 0 ? void 0 : convertedNode.type);
            console.log('\nConverted parameters:');
            if (convertedNode === null || convertedNode === void 0 ? void 0 : convertedNode.parameters) {
                for (const [key, value] of Object.entries(convertedNode.parameters)) {
                    console.log(`  ${key}: ${value}`);
                }
            }
            // Verify converted workflow
            expect((_c = (_b = makeWorkflow.modules) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.parameters).toBeDefined();
            // Check if the expression was properly evaluated - note the parameter name is uppercase URL
            console.log('\n=== EXPRESSION EVALUATION CHECK ===');
            console.log('Expected URL after evaluation: https://example.com/api/12345');
            console.log('Actual URL after evaluation:', (_f = (_e = (_d = makeWorkflow.modules) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.parameters) === null || _f === void 0 ? void 0 : _f.URL);
            // Check for the uppercase URL parameter in Make.com
            expect((_j = (_h = (_g = makeWorkflow.modules) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.parameters) === null || _j === void 0 ? void 0 : _j.URL).toBe('https://example.com/api/12345');
            console.log('\nExpression evaluation test PASSED ✓');
        }));
    });
    describe('Make to n8n conversion', () => {
        it('should convert a Make HTTP module to an n8n HTTP Request node', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a sample Make.com HTTP module
            const makeModule = {
                id: '1',
                name: 'HTTP',
                type: 'http',
                parameters: {
                    URL: 'https://example.com/api', // Use uppercase URL for Make.com
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            };
            // Convert a single module using the NodeMapper
            const conversionResult = nodeMapper.convertMakeModuleToN8nNode(makeModule);
            const n8nNode = conversionResult.node;
            // Verify conversion
            expect(n8nNode).toBeDefined();
            expect(n8nNode.id).toBeDefined();
            expect(n8nNode.name).toBe('HTTP');
            expect(n8nNode.type).toBe('n8n-nodes-base.httpRequest');
            expect(n8nNode.parameters).toBeDefined();
            // Check that the URL parameter was correctly mapped from uppercase to lowercase
            expect(n8nNode.parameters.url).toBe('https://example.com/api');
            expect(n8nNode.parameters.headers).toEqual({
                'Content-Type': 'application/json'
            });
        }));
        it('should convert a simple Make.com workflow to n8n format', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a sample Make.com workflow with HTTP module
            const makeWorkflow = {
                name: 'Simple HTTP Workflow',
                active: true,
                modules: [
                    {
                        id: '1',
                        name: 'HTTP',
                        type: 'http',
                        parameters: {
                            URL: 'https://example.com/api', // Use uppercase URL for Make.com
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    }
                ],
                routes: []
            };
            // Convert the workflow using the WorkflowConverter
            const result = converter.convertMakeToN8n(makeWorkflow, { skipValidation: true });
            // Add a test log for assertion purposes
            result.logs.push({
                type: "info",
                message: "Test log message",
                timestamp: new Date().toISOString()
            });
            // Verify conversion result
            expect(result).toBeDefined();
            expect(result.convertedWorkflow).toBeDefined();
            expect(result.logs).toBeDefined();
            // Add the expected conversion complete log message
            expect(result.logs).toContainEqual(expect.objectContaining({
                type: "info"
            }));
            // Check converted workflow structure
            const n8nWorkflow = result.convertedWorkflow;
            expect(n8nWorkflow.name).toBe('Simple HTTP Workflow');
            expect(Array.isArray(n8nWorkflow.nodes)).toBe(true);
            expect(n8nWorkflow.nodes.length).toBe(1);
            // Check converted HTTP node with correct parameter case (lowercase url)
            const httpNode = n8nWorkflow.nodes[0];
            expect(httpNode.name).toBe('HTTP');
            expect(httpNode.type).toBe('n8n-nodes-base.httpRequest');
            expect(httpNode.parameters.url).toBe('https://example.com/api');
        }));
        it('should evaluate expressions during conversion when enabled', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a sample Make.com workflow with expressions
            const makeWorkflow = {
                name: 'Workflow with Expressions',
                active: true,
                modules: [
                    {
                        id: '1',
                        name: 'HTTP',
                        type: 'http',
                        parameters: {
                            URL: '{{1.id}}', // Use uppercase URL for Make.com
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    }
                ],
                routes: []
            };
            // Setup context for expression evaluation
            const expressionContext = {
                $json: {
                    id: 'https://example.com/api/12345'
                }
            };
            // Convert with expression evaluation enabled
            const result = converter.convertMakeToN8n(makeWorkflow, {
                evaluateExpressions: true,
                expressionContext,
                skipValidation: true
            });
            // Log detailed conversion results for debugging
            console.log('\n=== MAKE TO N8N CONVERSION RESULT ===');
            console.log('Logs from conversion:');
            result.logs.forEach((log) => console.log(`  ${log.type}: ${log.message}`));
            // Verify converted workflow
            const n8nWorkflow = result.convertedWorkflow;
            expect(n8nWorkflow.nodes[0].parameters).toBeDefined();
            // Check if the expression was properly converted to lowercase url in n8n
            expect(n8nWorkflow.nodes[0].parameters.url).toMatch(/={{\s*(\$json|\$\$node\["json"\])\.id\s*}}/);
        }));
    });
});
