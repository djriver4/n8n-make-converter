"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMakeWorkflow = validateMakeWorkflow;
exports.validateN8nWorkflow = validateN8nWorkflow;
exports.formatValidationErrors = formatValidationErrors;
const ajv_1 = __importDefault(require("ajv"));
const schemas_1 = require("../schemas");
const ajv = new ajv_1.default({
    allErrors: true,
    verbose: true,
    strictRequired: false, // To allow additional properties not in the schema
});
/**
 * Validates a Make.com workflow against the schema
 * @param workflow The workflow to validate
 * @returns An object containing validation result and any errors
 */
function validateMakeWorkflow(workflow) {
    const validate = ajv.compile(schemas_1.makeWorkflowSchema);
    const valid = validate(workflow);
    
    // Add additional validation that checks if flow array is empty or has invalid modules
    if (valid && workflow) {
        const flow = workflow.flow || workflow.modules || [];
        
        // Check if flow/modules array exists and is not empty
        if (!Array.isArray(flow) || flow.length === 0) {
            return {
                valid: false,
                errors: [{
                    keyword: 'custom',
                    message: 'Flow/modules array must not be empty',
                    params: { workflow }
                }],
                workflow: null,
            };
        }
        
        // Check if any module is missing required properties
        for (const module of flow) {
            if (!module.id || !module.name || !module.type || !module.parameters) {
                return {
                    valid: false,
                    errors: [{
                        keyword: 'custom',
                        message: 'Module is missing required properties',
                        params: { module }
                    }],
                    workflow: null,
                };
            }
        }
    }
    
    return {
        valid,
        errors: validate.errors || null,
        workflow: valid ? workflow : null,
    };
}
/**
 * Validates an n8n workflow against the schema
 * @param workflow The workflow to validate
 * @returns An object containing validation result and any errors
 */
function validateN8nWorkflow(workflow) {
    const validate = ajv.compile(schemas_1.n8nWorkflowSchema);
    const valid = validate(workflow);
    
    // Add additional validation that checks if nodes array is empty or has invalid nodes
    if (valid && workflow) {
        // Check if nodes array exists and is not empty
        if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
            return {
                valid: false,
                errors: [{
                    keyword: 'custom',
                    message: 'Nodes array must not be empty',
                    params: { workflow }
                }],
                workflow: null,
            };
        }
        
        // Check if any node is missing required properties
        for (const node of workflow.nodes) {
            if (!node.id || !node.name || !node.type || !node.parameters || !node.position) {
                return {
                    valid: false,
                    errors: [{
                        keyword: 'custom',
                        message: 'Node is missing required properties',
                        params: { node }
                    }],
                    workflow: null,
                };
            }
        }
    }
    
    return {
        valid,
        errors: validate.errors || null,
        workflow: valid ? workflow : null,
    };
}
/**
 * Formats validation errors to a more readable format
 * @param errors The errors from AJV validation
 * @returns Formatted error messages
 */
function formatValidationErrors(errors) {
    if (!errors)
        return [];
    return errors.map(error => {
        const { instancePath, keyword, message, params } = error;
        let errorMessage = `${instancePath} ${message}`;
        if (keyword === 'required') {
            errorMessage = `Missing required property: ${params.missingProperty}`;
        }
        return errorMessage;
    });
}
exports.default = {
    validateMakeWorkflow,
    validateN8nWorkflow,
    formatValidationErrors,
};
