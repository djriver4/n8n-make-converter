import Ajv, { ErrorObject } from 'ajv';
import { 
  MakeWorkflow, 
  makeWorkflowSchema, 
  N8nWorkflow, 
  n8nWorkflowSchema 
} from '../schemas';

const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strictRequired: false, // To allow additional properties not in the schema
});

/**
 * Validates a Make.com workflow against the schema
 * @param workflow The workflow to validate
 * @returns An object containing validation result and any errors
 */
export function validateMakeWorkflow(workflow: any): { 
  valid: boolean;
  errors: ErrorObject[] | null;
  workflow: MakeWorkflow | null;
} {
  const validate = ajv.compile<MakeWorkflow>(makeWorkflowSchema);
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
        } as unknown as ErrorObject],
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
          } as unknown as ErrorObject],
          workflow: null,
        };
      }
    }
  }
  
  return {
    valid,
    errors: validate.errors || null,
    workflow: valid ? workflow as MakeWorkflow : null,
  };
}

/**
 * Validates an n8n workflow against the schema
 * @param workflow The workflow to validate
 * @returns An object containing validation result and any errors
 */
export function validateN8nWorkflow(workflow: any): { 
  valid: boolean;
  errors: ErrorObject[] | null;
  workflow: N8nWorkflow | null;
} {
  const validate = ajv.compile<N8nWorkflow>(n8nWorkflowSchema);
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
        } as unknown as ErrorObject],
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
          } as unknown as ErrorObject],
          workflow: null,
        };
      }
    }
  }
  
  return {
    valid,
    errors: validate.errors || null,
    workflow: valid ? workflow as N8nWorkflow : null,
  };
}

/**
 * Formats validation errors to a more readable format
 * @param errors The errors from AJV validation
 * @returns Formatted error messages
 */
export function formatValidationErrors(errors: ErrorObject[]): string[] {
  if (!errors) return [];
  
  return errors.map(error => {
    const { instancePath, keyword, message, params } = error;
    let errorMessage = `${instancePath} ${message}`;
    
    if (keyword === 'required') {
      errorMessage = `Missing required property: ${params.missingProperty}`;
    }
    
    return errorMessage;
  });
}

export default {
  validateMakeWorkflow,
  validateN8nWorkflow,
  formatValidationErrors,
}; 