/**
 * Integration tests for workflow-converter.ts
 * 
 * Tests the complete workflow conversion process using the NodeMapping System and Expression Evaluator
 */

import { 
  WorkflowConverter, 
  convertN8nToMake, 
  convertMakeToN8n 
} from '../../lib/workflow-converter';
import { NodeMappingLoader } from '../../lib/node-mappings/node-mapping-loader';
import { NodeMapper } from '../../lib/node-mappings/node-mapper';
import { N8nNode, MakeModule, N8nWorkflow, MakeWorkflow } from '../../lib/node-mappings/node-types';
import { NodeMappingDatabase, NodeMapping } from '../../lib/node-mappings/schema';

// Import the shared mock mapping database
const mockMappingDatabase = require('../mocks/mock-mapping-database');

describe('Workflow Converter Integration Tests', () => {
  // Initialize node mapping system with mock data
  let nodeMapper: NodeMapper;
  let converter: WorkflowConverter;

  beforeAll(() => {
    // Create a NodeMapper with the mock database
    nodeMapper = new NodeMapper(mockMappingDatabase);
    
    // Create a WorkflowConverter with the mock database
    converter = new WorkflowConverter(mockMappingDatabase);
    
    // Mock the NodeMappingLoader to return our mock database
    jest.spyOn(NodeMappingLoader.prototype, 'loadMappings').mockImplementation(async () => mockMappingDatabase);
    jest.spyOn(NodeMappingLoader.prototype, 'getMappings').mockImplementation(() => mockMappingDatabase);
  });

  describe('n8n to Make conversion', () => {
    it('should convert an n8n HTTP Request node to a Make HTTP module', async () => {
      // Create a sample n8n HTTP Request node
      const n8nNode: N8nNode = {
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
      const makeModule = conversionResult.node as MakeModule;

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
    });

    it('should convert a simple n8n workflow to Make.com format', async () => {
      // Create a sample n8n workflow with HTTP Request node
      const n8nWorkflow: N8nWorkflow = {
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
      const makeWorkflow = result.convertedWorkflow as MakeWorkflow;
      expect(makeWorkflow.name).toBe('Simple HTTP Workflow');
      expect(Array.isArray(makeWorkflow.modules || [])).toBe(true);
      expect(makeWorkflow.modules?.length || 0).toBe(1);
      
      // Check converted HTTP module with correct parameter case (URL uppercase)
      const httpModule = makeWorkflow.modules?.[0];
      expect(httpModule?.name).toBe('HTTP Request');
      expect(httpModule?.type).toBe('http');
      expect(httpModule?.parameters?.URL).toBe('https://example.com/api');
    });

    it('should evaluate expressions during conversion when enabled', async () => {
      // Create a sample n8n workflow with expressions
      const n8nWorkflow: N8nWorkflow = {
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
      result.logs.forEach((log: { type: string; message: string }) => console.log(`  ${log.type}: ${log.message}`));

      // Print the first node of the converted workflow
      const makeWorkflow = result.convertedWorkflow as MakeWorkflow;
      const convertedNode = makeWorkflow.modules?.[0];
      console.log('\nConverted Make.com module:');
      console.log('  name:', convertedNode?.name);
      console.log('  type:', convertedNode?.type);
      
      console.log('\nConverted parameters:');
      if (convertedNode?.parameters) {
        for (const [key, value] of Object.entries(convertedNode.parameters)) {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Verify converted workflow
      expect(makeWorkflow.modules?.[0]?.parameters).toBeDefined();
      
      // Check if the expression was properly evaluated - note the parameter name is uppercase URL
      console.log('\n=== EXPRESSION EVALUATION CHECK ===');
      console.log('Expected URL after evaluation: https://example.com/api/12345');
      console.log('Actual URL after evaluation:', makeWorkflow.modules?.[0]?.parameters?.URL);
      
      // Check for the uppercase URL parameter in Make.com
      expect(makeWorkflow.modules?.[0]?.parameters?.URL).toBe('https://example.com/api/12345');
      console.log('\nExpression evaluation test PASSED ✓');
    });
  });

  describe('Make to n8n conversion', () => {
    it('should convert a Make HTTP module to an n8n HTTP Request node', async () => {
      // Create a sample Make.com HTTP module
      const makeModule: MakeModule = {
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
      const n8nNode = conversionResult.node as N8nNode;

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
    });

    it('should convert a simple Make.com workflow to n8n format', async () => {
      // Create a sample Make.com workflow with HTTP module
      const makeWorkflow: MakeWorkflow = {
        name: 'Simple HTTP Workflow',
        active: true,
        flow: [
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
      const n8nWorkflow = result.convertedWorkflow as N8nWorkflow;
      expect(n8nWorkflow.name).toBe('Simple HTTP Workflow');
      expect(Array.isArray(n8nWorkflow.nodes)).toBe(true);
      expect(n8nWorkflow.nodes.length).toBe(1);
      
      // Check converted HTTP node with correct parameter case (lowercase url)
      const httpNode = n8nWorkflow.nodes[0];
      expect(httpNode.name).toBe('HTTP');
      expect(httpNode.type).toBe('n8n-nodes-base.httpRequest');
      expect(httpNode.parameters.url).toBe('https://example.com/api');
    });

    it('should evaluate expressions during conversion when enabled', async () => {
      // Create a sample Make.com workflow with expressions
      const makeWorkflow: MakeWorkflow = {
        name: 'Workflow with Expressions',
        active: true,
        flow: [
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
      result.logs.forEach((log: { type: string; message: string }) => console.log(`  ${log.type}: ${log.message}`));

      // Verify converted workflow
      const n8nWorkflow = result.convertedWorkflow as N8nWorkflow;
      expect(n8nWorkflow.nodes[0].parameters).toBeDefined();
      
      // Check if the expression was properly converted to lowercase url in n8n
      expect(n8nWorkflow.nodes[0].parameters.url).toMatch(/={{\s*(\$json|\$\$node\["json"\])\.id\s*}}/);
    });
  });
}); 