"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compatibility_layer_1 = require("../../lib/utils/compatibility-layer");
describe('Compatibility Layer', () => {
    // Verify that both naming conventions work
    it('should expose both old and new function names', () => {
        expect(compatibility_layer_1.toConversionResult).toBe(compatibility_layer_1.convertToLegacyResult);
        expect(compatibility_layer_1.toWorkflowConversionResult).toBe(compatibility_layer_1.convertToModernResult);
    });
    describe('Helper Functions', () => {
        it('should create a valid ISO timestamp', () => {
            const timestamp = (0, compatibility_layer_1.createTimestamp)();
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
        });
        it('should normalize log entries', () => {
            // String input
            const stringLog = (0, compatibility_layer_1.ensureValidLogEntry)('Test message');
            expect(stringLog.type).toBe('info');
            expect(stringLog.message).toBe('Test message');
            expect(stringLog.timestamp).toBeDefined();
            // Object with missing properties
            const incompleteLog = (0, compatibility_layer_1.ensureValidLogEntry)({ message: 'Missing type' });
            expect(incompleteLog.type).toBe('info');
            expect(incompleteLog.message).toBe('Missing type');
            expect(incompleteLog.timestamp).toBeDefined();
            // Object with invalid type
            const invalidTypeLog = (0, compatibility_layer_1.ensureValidLogEntry)({ type: 'not-valid', message: 'Test' });
            expect(invalidTypeLog.type).toBe('info');
            expect(invalidTypeLog.message).toBe('Test');
            // Null input
            const nullLog = (0, compatibility_layer_1.ensureValidLogEntry)(null);
            expect(nullLog.type).toBe('info');
            expect(nullLog.message).toBe('null');
        });
        describe('Parameter Review Conversion', () => {
            it('should convert parameter review to string', () => {
                const review = {
                    nodeId: 'HTTP Request',
                    parameters: ['url', 'method'],
                    reason: 'Complex expression'
                };
                const result = (0, compatibility_layer_1.paramReviewToString)(review);
                expect(result).toBe('HTTP Request - url, method: Complex expression');
            });
            it('should handle missing fields in parameter review', () => {
                const incompleteReview = {
                    nodeId: 'HTTP',
                    // Missing parameters
                    reason: 'Test'
                };
                const result = (0, compatibility_layer_1.paramReviewToString)(incompleteReview);
                expect(result).toBe('HTTP - unknown: Test');
            });
            it('should convert string to parameter review', () => {
                const str = 'HTTP Request - url, method: Complex expression';
                const result = (0, compatibility_layer_1.stringToParamReview)(str);
                expect(result.nodeId).toBe('HTTP Request');
                expect(result.parameters).toEqual(['url', 'method']);
                expect(result.reason).toBe('Complex expression');
            });
            it('should handle malformed strings when converting to parameter review', () => {
                // No separator between nodeId and parameters
                const badStr1 = 'HTTP Request url: Test';
                const result1 = (0, compatibility_layer_1.stringToParamReview)(badStr1);
                expect(result1.nodeId).toBe('unknown');
                expect(result1.parameters).toEqual(['unknown']);
                expect(result1.reason).toBe(badStr1);
                // No reason
                const badStr2 = 'HTTP Request - url';
                const result2 = (0, compatibility_layer_1.stringToParamReview)(badStr2);
                expect(result2.nodeId).toBe('HTTP Request');
                expect(result2.parameters).toEqual(['url']);
                expect(result2.reason).toBe('');
            });
        });
    });
    describe('convertToLegacyResult (Modern → Legacy)', () => {
        it('should convert a valid WorkflowConversionResult to ConversionResult', () => {
            const workflowResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [
                    { type: 'info', message: 'Converting node: HTTP Request', timestamp: '2023-01-01T00:00:00.000Z' },
                    { type: 'info', message: 'Conversion successful', timestamp: '2023-01-01T00:00:01.000Z' }
                ],
                paramsNeedingReview: [
                    { nodeId: 'HTTP Request', parameters: ['url'], reason: 'Complex expression' }
                ],
                unmappedNodes: ['CustomNode'],
                debug: {
                    mappedModules: [],
                    unmappedModules: [],
                    mappedNodes: [],
                    unmappedNodes: []
                }
            };
            const result = (0, compatibility_layer_1.convertToLegacyResult)(workflowResult);
            expect(result.convertedWorkflow).toBe(workflowResult.convertedWorkflow);
            expect(result.logs).toEqual(workflowResult.logs);
            expect(result.parametersNeedingReview).toEqual(['HTTP Request - url: Complex expression']);
            expect(result.unmappedNodes).toEqual(workflowResult.unmappedNodes);
            expect(result.isValidInput).toBe(true);
            expect(result.debug).toEqual(workflowResult.debug);
        });
        it('should handle multiple parameters in a review item', () => {
            const workflowResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [],
                paramsNeedingReview: [
                    { nodeId: 'HTTP Request', parameters: ['url', 'method', 'headers'], reason: 'Multiple issues' }
                ],
                unmappedNodes: [],
                debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
            };
            const result = (0, compatibility_layer_1.convertToLegacyResult)(workflowResult);
            expect(result.parametersNeedingReview).toEqual(['HTTP Request - url, method, headers: Multiple issues']);
        });
        it('should handle missing or malformed properties in the input', () => {
            const incompleteResult = {
                convertedWorkflow: { name: 'Incomplete', nodes: [] },
                logs: [{ type: 'info', message: 'Test', timestamp: '2023-01-01T00:00:00.000Z' }],
                // Missing paramsNeedingReview
                // Missing unmappedNodes 
                // Missing debug
            };
            const result = (0, compatibility_layer_1.convertToLegacyResult)(incompleteResult);
            expect(result.convertedWorkflow).toBe(incompleteResult.convertedWorkflow);
            expect(result.logs).toEqual(incompleteResult.logs);
            expect(result.parametersNeedingReview).toEqual([]);
            expect(result.unmappedNodes).toEqual([]);
            expect(result.isValidInput).toBe(true);
        });
        it('should handle completely invalid input', () => {
            const result = (0, compatibility_layer_1.convertToLegacyResult)(null);
            expect(result.convertedWorkflow).toHaveProperty('name', 'Error');
            expect(result.logs.length).toBe(1);
            expect(result.logs[0].type).toBe('error');
            expect(result.parametersNeedingReview).toEqual([]);
            expect(result.isValidInput).toBe(false);
        });
        it('should handle malformed log entries', () => {
            const workflowResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [
                    { type: 'info', message: 'String log entry instead of object', timestamp: '2023-01-01T00:00:00.000Z' },
                    { message: 'Missing type property' },
                    { type: 'info', message: 'Valid entry', timestamp: '2023-01-01T00:00:00.000Z' },
                    { type: 'unknown-type', message: 'Invalid type' }
                ],
                paramsNeedingReview: [],
                unmappedNodes: [],
                debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
            };
            const result = (0, compatibility_layer_1.convertToLegacyResult)(workflowResult);
            expect(result.logs.length).toBe(4);
            expect(result.logs[0].type).toBe('info');
            expect(result.logs[0].message).toBe('String log entry instead of object');
            expect(result.logs[1].type).toBe('info'); // Default type for missing type
            expect(result.logs[2].type).toBe('info'); // Valid entry preserved
            expect(result.logs[3].type).toBe('info'); // Invalid type fixed
        });
        it('should handle errors thrown during conversion', () => {
            // Create an object that will throw an error when accessed
            const badObject = {
                get convertedWorkflow() { return { name: 'Bad Object' }; },
                get logs() { return []; },
                get paramsNeedingReview() {
                    return [{
                            get nodeId() { throw new Error('Simulated error'); },
                            parameters: ['test'],
                            reason: 'Test'
                        }];
                },
                unmappedNodes: [],
                debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
            };
            const result = (0, compatibility_layer_1.convertToLegacyResult)(badObject);
            expect(result.parametersNeedingReview).toContain('unknown - unknown: Error in parameter format');
            expect(result.isValidInput).toBe(true); // Error in parameter conversion doesn't affect validation
        });
    });
    describe('convertToModernResult (Legacy → Modern)', () => {
        it('should convert a valid ConversionResult to WorkflowConversionResult', () => {
            const legacyResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [
                    { type: 'info', message: 'Converting node: HTTP Request', timestamp: '2023-01-01T00:00:00.000Z' },
                    { type: 'info', message: 'Conversion successful', timestamp: '2023-01-01T00:00:01.000Z' }
                ],
                parametersNeedingReview: ['HTTP Request - url: Complex expression'],
                unmappedNodes: ['CustomNode'],
                isValidInput: true,
                debug: {
                    mappedModules: [],
                    unmappedModules: [],
                    mappedNodes: [],
                    unmappedNodes: []
                }
            };
            const result = (0, compatibility_layer_1.convertToModernResult)(legacyResult);
            expect(result.convertedWorkflow).toBe(legacyResult.convertedWorkflow);
            expect(result.logs).toEqual(legacyResult.logs);
            expect(result.paramsNeedingReview).toEqual([
                { nodeId: 'HTTP Request', parameters: ['url'], reason: 'Complex expression' }
            ]);
            expect(result.unmappedNodes).toEqual(legacyResult.unmappedNodes);
            expect(result.debug).toEqual(legacyResult.debug);
        });
        it('should handle multiple parameters in a string review', () => {
            const legacyResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [],
                parametersNeedingReview: ['HTTP Request - url, method, headers: Multiple issues'],
                unmappedNodes: [],
                debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
            };
            const result = (0, compatibility_layer_1.convertToModernResult)(legacyResult);
            expect(result.paramsNeedingReview).toEqual([
                { nodeId: 'HTTP Request', parameters: ['url', 'method', 'headers'], reason: 'Multiple issues' }
            ]);
        });
        it('should handle missing or malformed properties in the input', () => {
            const incompleteResult = {
                convertedWorkflow: { name: 'Incomplete', nodes: [] },
                logs: [{ type: 'info', message: 'Test', timestamp: '2023-01-01T00:00:00.000Z' }],
                // Missing parametersNeedingReview
                // Missing unmappedNodes 
                // Missing debug
            };
            const result = (0, compatibility_layer_1.convertToModernResult)(incompleteResult);
            expect(result.convertedWorkflow).toBe(incompleteResult.convertedWorkflow);
            expect(result.logs).toEqual(incompleteResult.logs);
            expect(result.paramsNeedingReview).toEqual([]);
            expect(result.unmappedNodes).toEqual([]);
            expect(result.debug).toEqual({
                mappedModules: [],
                unmappedModules: [],
                mappedNodes: [],
                unmappedNodes: []
            });
        });
        it('should handle completely invalid input', () => {
            const result = (0, compatibility_layer_1.convertToModernResult)(null);
            expect(result.convertedWorkflow).toHaveProperty('name', 'Error');
            expect(result.logs.length).toBe(1);
            expect(result.logs[0].type).toBe('error');
            expect(result.paramsNeedingReview).toEqual([]);
            expect(result.debug).toEqual({
                mappedModules: [],
                unmappedModules: [],
                mappedNodes: [],
                unmappedNodes: []
            });
        });
        it('should handle malformed log entries', () => {
            const legacyResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [
                    { type: 'info', message: 'String log entry instead of object', timestamp: '2023-01-01T00:00:00.000Z' },
                    { message: 'Missing type property' },
                    { type: 'info', message: 'Valid entry', timestamp: '2023-01-01T00:00:00.000Z' },
                    { type: 'unknown-type', message: 'Invalid type' }
                ],
                parametersNeedingReview: [],
                unmappedNodes: [],
                debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
            };
            const result = (0, compatibility_layer_1.convertToModernResult)(legacyResult);
            expect(result.logs.length).toBe(4);
            expect(result.logs[0].type).toBe('info');
            expect(result.logs[0].message).toBe('String log entry instead of object');
            expect(result.logs[1].type).toBe('info'); // Default type for missing type
            expect(result.logs[2].type).toBe('info'); // Valid entry preserved
            expect(result.logs[3].type).toBe('info'); // Invalid type fixed
        });
        it('should handle malformed parameter review strings', () => {
            const legacyResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [],
                parametersNeedingReview: [
                    'HTTP Request - url: Valid format',
                    'Invalid format without separators',
                    'Too - Many - Separators: But still parse what we can',
                    '' // Empty string
                ],
                unmappedNodes: [],
                debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
            };
            const result = (0, compatibility_layer_1.convertToModernResult)(legacyResult);
            expect(result.paramsNeedingReview.length).toBe(4);
            expect(result.paramsNeedingReview[0]).toEqual({ nodeId: 'HTTP Request', parameters: ['url'], reason: 'Valid format' });
            expect(result.paramsNeedingReview[1]).toEqual({ nodeId: 'unknown', parameters: ['unknown'], reason: 'Invalid format without separators' });
            expect(result.paramsNeedingReview[2]).toEqual({ nodeId: 'Too', parameters: ['Many - Separators'], reason: 'But still parse what we can' });
            expect(result.paramsNeedingReview[3]).toEqual({ nodeId: 'unknown', parameters: ['unknown'], reason: '' });
        });
        it('should handle errors thrown during conversion', () => {
            // Create an object that will throw an error when accessed
            const badObject = {
                get convertedWorkflow() { return { name: 'Bad Object' }; },
                get logs() { return []; },
                get parametersNeedingReview() {
                    return ['Valid string', { toString: () => { throw new Error('Simulated error'); } }];
                },
                unmappedNodes: [],
                debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
            };
            const result = (0, compatibility_layer_1.convertToModernResult)(badObject);
            expect(result.paramsNeedingReview.length).toBe(2);
            expect(result.paramsNeedingReview[0].nodeId).toBe('unknown');
            expect(result.paramsNeedingReview[1].reason).toContain('Parse error:');
        });
        it('should handle malformed debug information', () => {
            const legacyResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [],
                parametersNeedingReview: [],
                unmappedNodes: [],
                debug: {
                    mappedModules: 'not an array',
                    unmappedModules: 123,
                    mappedNodes: undefined,
                    unmappedNodes: null
                }
            };
            const result = (0, compatibility_layer_1.convertToModernResult)(legacyResult);
            // Should create empty arrays for all properties
            expect(result.debug).toEqual({
                mappedModules: [],
                unmappedModules: [],
                mappedNodes: [],
                unmappedNodes: []
            });
        });
    });
});
