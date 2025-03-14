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