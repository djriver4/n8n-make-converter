import * as fs from 'fs';
import * as path from 'path';
import { convertWorkflow } from '../../lib/workflow-converter';
import { validateMakeWorkflow, validateN8nWorkflow } from '../../lib/utils/validate-workflow';

describe('Workflow Validation Integration Tests', () => {
  // Create valid workflow examples for testing
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
    test('should validate input and output formats during conversion', async () => {
      // Validate that our sample n8n workflow is valid before conversion
      const inputValidation = validateN8nWorkflow(validN8nWorkflow);
      expect(inputValidation.valid).toBe(true);
      
      // Perform the conversion with validation enabled (default)
      const result = await convertWorkflow(
        validN8nWorkflow,
        'n8n',
        'make'
      );
      
      // Check that the conversion was successful
      expect(result.convertedWorkflow).not.toBeNull();
      
      // For now, we'll just check that the conversion produced something
      // In a real implementation, we would validate the output more thoroughly
      expect(result.convertedWorkflow).toBeDefined();
      expect(typeof result.convertedWorkflow).toBe('object');
    });
    
    test('should reject invalid input format', async () => {
      // Create an invalid n8n workflow by removing required properties
      const invalidWorkflow = {
        connections: {}
      };
      
      // Perform the conversion with validation enabled
      const result = await convertWorkflow(
        invalidWorkflow,
        'n8n',
        'make'
      );
      
      // Check that conversion was rejected due to invalid input
      expect(result.isValidInput).toBe(false);
      expect(result.convertedWorkflow).toBeNull();
      
      // Check that there's an error log message
      const hasValidationError = result.logs.some(log => 
        log.type === 'error' && log.message.includes('validation')
      );
      expect(hasValidationError).toBe(true);
    });
    
    test('should bypass validation when skipValidation option is true', async () => {
      // Create an invalid n8n workflow by removing required properties
      const invalidWorkflow = {
        connections: {}
      };
      
      // Perform the conversion with validation disabled
      const result = await convertWorkflow(
        invalidWorkflow,
        'n8n',
        'make',
        { skipValidation: true }
      );
      
      // Check that conversion proceeded despite invalid input
      expect(result.convertedWorkflow).not.toBeNull();
    });
  });

  describe('Convert Make.com to n8n with validation', () => {
    test('should validate input and output formats during conversion', async () => {
      // Validate that our sample Make workflow is valid before conversion
      const inputValidation = validateMakeWorkflow(validMakeWorkflow);
      expect(inputValidation.valid).toBe(true);
      
      // Perform the conversion with validation enabled (default)
      const result = await convertWorkflow(
        validMakeWorkflow,
        'make',
        'n8n'
      );
      
      // Check that the conversion was successful
      expect(result.convertedWorkflow).not.toBeNull();
      
      // For now, we'll just check that the conversion produced something
      // In a real implementation, we would validate the output more thoroughly
      expect(result.convertedWorkflow).toBeDefined();
      expect(typeof result.convertedWorkflow).toBe('object');
    });
    
    test('should reject invalid input format', async () => {
      // Create an invalid Make workflow by removing required properties
      const invalidWorkflow = {
        name: "Invalid Workflow"
      };
      
      // Perform the conversion with validation enabled
      const result = await convertWorkflow(
        invalidWorkflow,
        'make',
        'n8n'
      );
      
      // Check that conversion was rejected due to invalid input
      expect(result.isValidInput).toBe(false);
      expect(result.convertedWorkflow).toBeNull();
      
      // Check that there's an error log message
      const hasValidationError = result.logs.some(log => 
        log.type === 'error' && log.message.includes('validation')
      );
      expect(hasValidationError).toBe(true);
    });
  });
}); 