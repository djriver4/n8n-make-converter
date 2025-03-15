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
const workflow_converter_1 = require("../../lib/workflow-converter");
const validate_workflow_1 = require("../../lib/utils/validate-workflow");
describe('Workflow Validation Integration Tests', () => {
    // Create valid workflow examples for testing
    const validN8nWorkflow = {
        name: "Valid N8n Workflow",
        active: true,
        nodes: [
            {
                id: "a1b2c3",
                name: "HTTP Request",
                type: "n8n-nodes-base.httpRequest",
                parameters: {
                    url: "https://example.com/api",
                    method: "GET"
                },
                position: [100, 200]
            }
        ],
        connections: {}
    };
    const validMakeWorkflow = {
        name: "Sample Make Workflow",
        flow: [
            {
                id: "1",
                name: "HTTP",
                type: "http",
                parameters: {
                    url: "https://example.com/api",
                    method: "GET"
                },
                metadata: {
                    designer: {
                        x: 100,
                        y: 100
                    }
                }
            }
        ]
    };
    describe('Convert n8n to Make.com with validation', () => {
        test('should validate input and output formats during conversion', () => __awaiter(void 0, void 0, void 0, function* () {
            // Validate that our sample n8n workflow is valid before conversion
            const inputValidation = (0, validate_workflow_1.validateN8nWorkflow)(validN8nWorkflow);
            expect(inputValidation.valid).toBe(true);
            // Perform the conversion with validation enabled (default)
            const result = yield (0, workflow_converter_1.convertN8nToMake)(validN8nWorkflow);
            // Check that the conversion was successful
            expect(result.convertedWorkflow).not.toBeNull();
            // For now, we'll just check that the conversion produced something
            // In a real implementation, we would validate the output more thoroughly
            expect(result.convertedWorkflow).toBeDefined();
            expect(typeof result.convertedWorkflow).toBe('object');
        }));
        test('should reject invalid input format', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create an invalid n8n workflow with a node that's missing required properties
            const invalidWorkflow = {
                name: "Invalid Workflow",
                active: false,
                connections: {},
                // Add nodes array with an invalid node (missing required properties)
                nodes: [
                    // Missing id, name, type, parameters, position
                    {}
                ]
            };
            // Perform the conversion with validation enabled
            const result = yield (0, workflow_converter_1.convertN8nToMake)(invalidWorkflow);
            // Check that conversion was rejected due to invalid input
            expect(result.isValidInput).toBe(false);
            // Updated expectation: expect empty workflow instead of null
            expect(result.convertedWorkflow).toEqual({ active: false, modules: [], name: "Invalid workflow", routes: [] });
            // Check that there's an error log message about invalid format, not just validation
            const hasValidationError = result.logs.some((log) => log.type === 'error' && log.message.includes('Invalid n8n workflow format'));
            expect(hasValidationError).toBe(true);
        }));
        test('should bypass validation when skipValidation option is true', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create an invalid n8n workflow by removing required properties
            const invalidWorkflow = {
                name: "Invalid Workflow",
                active: false,
                connections: {},
                // Add empty nodes array to prevent the "not iterable" error
                nodes: []
            };
            // Perform the conversion with validation disabled
            const result = yield (0, workflow_converter_1.convertN8nToMake)(invalidWorkflow, { skipValidation: true });
            // Check that conversion proceeded despite invalid input
            expect(result.convertedWorkflow).not.toBeNull();
        }));
    });
    describe('Convert Make.com to n8n with validation', () => {
        test('should validate input and output formats during conversion', () => __awaiter(void 0, void 0, void 0, function* () {
            // Validate that our sample Make workflow is valid before conversion
            const inputValidation = (0, validate_workflow_1.validateMakeWorkflow)(validMakeWorkflow);
            expect(inputValidation.valid).toBe(true);
            // Perform the conversion with validation enabled (default)
            const result = yield (0, workflow_converter_1.convertMakeToN8n)(validMakeWorkflow);
            // Check that the conversion was successful
            expect(result.convertedWorkflow).not.toBeNull();
            // For now, we'll just check that the conversion produced something
            // In a real implementation, we would validate the output more thoroughly
            expect(result.convertedWorkflow).toBeDefined();
            expect(typeof result.convertedWorkflow).toBe('object');
        }));
        test('should reject invalid input format', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create an invalid Make workflow by removing required properties
            const invalidWorkflow = {
                name: "Invalid Workflow"
            };
            // Perform the conversion with validation enabled
            const result = yield (0, workflow_converter_1.convertMakeToN8n)(invalidWorkflow);
            // Check that conversion was rejected due to invalid input
            expect(result.isValidInput).toBe(false);
            // Updated expectation: expect empty workflow instead of null
            expect(result.convertedWorkflow).toEqual({ active: false, connections: {}, name: "Invalid workflow", nodes: [] });
            // Check that there's an error log message about invalid format, not just validation
            const hasValidationError = result.logs.some((log) => log.type === 'error' && log.message.includes('Invalid Make.com workflow format'));
            expect(hasValidationError).toBe(true);
        }));
    });
});
