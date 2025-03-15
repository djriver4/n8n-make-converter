"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate_workflow_1 = require("../../lib/utils/validate-workflow");
describe('Schema Validation Tests', () => {
    describe('Make.com Workflow Schema', () => {
        // Create a valid Make.com workflow for testing
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
        test('should validate a correct Make.com workflow', () => {
            const result = (0, validate_workflow_1.validateMakeWorkflow)(validMakeWorkflow);
            if (!result.valid) {
                console.error('Validation errors:', (0, validate_workflow_1.formatValidationErrors)(result.errors || []));
            }
            expect(result.valid).toBe(true);
            expect(result.errors).toBeNull();
            expect(result.workflow).not.toBeNull();
        });
        test('should detect missing required fields in Make.com workflow', () => {
            // Create a copy without the required 'flow' property
            const invalidWorkflow = {
                name: validMakeWorkflow.name
            };
            const result = (0, validate_workflow_1.validateMakeWorkflow)(invalidWorkflow);
            expect(result.valid).toBe(false);
            expect(result.errors).not.toBeNull();
            expect(result.workflow).toBeNull();
            const formattedErrors = (0, validate_workflow_1.formatValidationErrors)(result.errors || []);
            expect(formattedErrors.some(error => error.includes('flow'))).toBe(true);
        });
    });
    describe('n8n Workflow Schema', () => {
        // Create a valid n8n workflow for testing
        const validN8nWorkflow = {
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
        test('should validate a correct n8n workflow', () => {
            const result = (0, validate_workflow_1.validateN8nWorkflow)(validN8nWorkflow);
            if (!result.valid) {
                console.error('Validation errors:', (0, validate_workflow_1.formatValidationErrors)(result.errors || []));
            }
            expect(result.valid).toBe(true);
            expect(result.errors).toBeNull();
            expect(result.workflow).not.toBeNull();
        });
        test('should detect missing required fields in n8n workflow', () => {
            // Create a copy without the required 'nodes' property
            const invalidWorkflow = {
                connections: validN8nWorkflow.connections
            };
            const result = (0, validate_workflow_1.validateN8nWorkflow)(invalidWorkflow);
            expect(result.valid).toBe(false);
            expect(result.errors).not.toBeNull();
            expect(result.workflow).toBeNull();
            const formattedErrors = (0, validate_workflow_1.formatValidationErrors)(result.errors || []);
            expect(formattedErrors.some(error => error.includes('nodes'))).toBe(true);
        });
    });
});
