"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interface_adapters_1 = require("../../lib/utils/interface-adapters");
describe('Interface Adapters', () => {
    describe('toConversionResult', () => {
        it('should convert WorkflowConversionResult to ConversionResult', () => {
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
            const result = (0, interface_adapters_1.toConversionResult)(workflowResult);
            expect(result.convertedWorkflow).toBe(workflowResult.convertedWorkflow);
            expect(result.logs).toEqual(workflowResult.logs);
            expect(result.parametersNeedingReview).toEqual(['HTTP Request - url: Complex expression']);
            expect(result.unmappedNodes).toEqual(workflowResult.unmappedNodes);
            expect(result.isValidInput).toBe(true);
            expect(result.debug).toEqual(workflowResult.debug);
        });
        it('should handle missing properties', () => {
            const workflowResult = {
                convertedWorkflow: { name: 'Test Workflow', nodes: [] },
                logs: [
                    { type: 'info', message: 'Converting node: HTTP Request', timestamp: '2023-01-01T00:00:00.000Z' },
                    { type: 'info', message: 'Conversion successful', timestamp: '2023-01-01T00:00:01.000Z' }
                ],
                paramsNeedingReview: [],
                unmappedNodes: [],
                debug: {
                    mappedModules: [],
                    unmappedModules: [],
                    mappedNodes: [],
                    unmappedNodes: []
                }
            };
            const result = (0, interface_adapters_1.toConversionResult)(workflowResult);
            expect(result.convertedWorkflow).toBe(workflowResult.convertedWorkflow);
            expect(result.logs).toEqual(workflowResult.logs);
            expect(result.parametersNeedingReview).toEqual([]);
            expect(result.unmappedNodes).toEqual([]);
            expect(result.isValidInput).toBe(true);
            expect(result.debug).toEqual(workflowResult.debug);
        });
    });
    describe('toWorkflowConversionResult', () => {
        it('should convert ConversionResult to WorkflowConversionResult', () => {
            const conversionResult = {
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
            const result = (0, interface_adapters_1.toWorkflowConversionResult)(conversionResult);
            expect(result.convertedWorkflow).toBe(conversionResult.convertedWorkflow);
            expect(result.logs).toEqual(conversionResult.logs);
            expect(result.paramsNeedingReview).toEqual([
                { nodeId: 'HTTP Request', parameters: ['url'], reason: 'Complex expression' }
            ]);
            expect(result.unmappedNodes).toEqual(conversionResult.unmappedNodes);
            expect(result.debug).toEqual(conversionResult.debug);
        });
    });
});
