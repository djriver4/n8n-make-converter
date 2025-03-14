/**
 * Integration tests for workflow-converter.ts
 * 
 * Tests the complete workflow conversion process using the NodeMapping System and Expression Evaluator
 */

import { convertWorkflow, convertN8nNodeToMakeModule, convertMakeModuleToN8nNode } from '../../lib/workflow-converter';
import { NodeMappingLoader } from '../../lib/node-mappings/node-mapping-loader';
import { NodeMapper } from '../../lib/node-mappings/node-mapper';
import { N8nNode } from '../../lib/node-mappings/node-types';
import { NodeMappingDatabase } from '../../lib/node-mappings/schema';

describe('Workflow Converter Integration Tests', () => {
  // Initialize node mapping system with mock data
  let nodeMapper: NodeMapper;

  beforeAll(() => {
    // Create a mock mapping database for testing
    const mockMappingDatabase: NodeMappingDatabase = {
      version: "1.0.0",
      lastUpdated: "2023-11-15",
      mappings: {
        "httpRequest": {
          "n8nNodeType": "n8n-nodes-base.httpRequest",
          "n8nDisplayName": "HTTP Request",
          "makeModuleId": "http",
          "makeModuleName": "HTTP",
          "n8nTypeCategory": "Action",
          "makeTypeCategory": "App",
          "description": "Make a HTTP request and receive the response",
          "documentationUrl": {
            "n8n": "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/",
            "make": "https://www.make.com/en/help/tools/http"
          },
          "operations": [
            {
              "n8nName": "GET",
              "makeName": "get",
              "description": "Make a GET request",
              "parameters": [
                {
                  "n8nName": "url",
                  "makeName": "url",
                  "type": "string",
                  "required": true,
                  "description": "The URL to make the request to"
                },
                {
                  "n8nName": "headers",
                  "makeName": "headers",
                  "type": "object",
                  "required": false,
                  "description": "Request headers"
                }
              ]
            }
          ],
          "credentials": []
        }
      }
    };
    
    // Create a NodeMapper with the mock database
    nodeMapper = new NodeMapper(mockMappingDatabase);
    
    // Mock the NodeMappingLoader to return our mock database
    jest.spyOn(NodeMappingLoader.prototype, 'loadMappings').mockImplementation(() => mockMappingDatabase);
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

      // Convert a single node
      const makeModule = convertN8nNodeToMakeModule(n8nNode, { nodeMapper });

      // Verify conversion
      expect(makeModule).toBeDefined();
      expect(makeModule.id).toBeDefined();
      expect(makeModule.name).toBe('HTTP Request');
      expect(makeModule.type).toBe('http');
      expect(makeModule.definition.type).toBe('get');
      expect(makeModule.definition.parameters).toBeDefined();
      expect(makeModule.definition.parameters?.url).toBe('https://example.com/api');
      expect(makeModule.definition.parameters?.headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    it('should convert a simple n8n workflow to Make.com format', async () => {
      // Create a sample n8n workflow with HTTP Request node
      const n8nWorkflow = {
        name: 'Simple HTTP Workflow',
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

      // Convert the workflow
      const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make', { nodeMapper });

      // Verify conversion result
      expect(result).toBeDefined();
      expect(result.convertedWorkflow).toBeDefined();
      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      
      // Check converted workflow structure
      const makeWorkflow = result.convertedWorkflow;
      expect(makeWorkflow.name).toBe('Simple HTTP Workflow');
      expect(Array.isArray(makeWorkflow.flow)).toBe(true);
      expect(makeWorkflow.flow.length).toBe(1);
      
      // Check converted HTTP module
      const httpModule = makeWorkflow.flow[0];
      expect(httpModule.name).toBe('HTTP Request');
      expect(httpModule.type).toBe('http');
    });

    it('should evaluate expressions during conversion when enabled', async () => {
      // Create a sample n8n workflow with expressions
      const n8nWorkflow = {
        name: 'Workflow with Expressions',
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
      const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make', {
        evaluateExpressions: true,
        expressionContext,
        nodeMapper
      });

      // Log detailed conversion results for debugging
      console.log('\n=== CONVERSION RESULT ===');
      console.log('Logs from conversion:');
      result.logs.forEach(log => console.log(`  ${log.type}: ${log.message}`));

      // Print the first node of the converted workflow
      const convertedNode = result.convertedWorkflow.flow[0];
      console.log('\nConverted Make.com module:');
      console.log('  name:', convertedNode.name);
      console.log('  type:', convertedNode.type);
      console.log('  definition.type:', convertedNode.definition.type);
      
      console.log('\nConverted parameters:');
      if (convertedNode.definition && convertedNode.definition.parameters) {
        for (const [key, value] of Object.entries(convertedNode.definition.parameters)) {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Verify converted workflow
      const makeWorkflow = result.convertedWorkflow;
      expect(makeWorkflow.flow[0].definition.parameters).toBeDefined();
      
      // Check if the expression was properly evaluated
      console.log('\n=== EXPRESSION EVALUATION CHECK ===');
      console.log('Expected URL after evaluation: https://example.com/api/12345');
      console.log('Actual URL after evaluation:', makeWorkflow.flow[0].definition.parameters?.url);
      
      expect(makeWorkflow.flow[0].definition.parameters?.url).toBe('https://example.com/api/12345');
      console.log('\nExpression evaluation test PASSED ✓');
    });
  });

  describe('Make to n8n conversion', () => {
    it('should convert a Make HTTP module to an n8n HTTP Request node', async () => {
      // Create a sample Make.com HTTP module
      const makeModule = {
        id: 1,
        name: 'HTTP',
        type: 'http',
        bundleId: 'http',
        definition: {
          type: 'get',
          parameters: {
            url: 'https://example.com/api',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }
      };

      // Convert a single module
      const n8nNode = convertMakeModuleToN8nNode(makeModule, { nodeMapper });

      // Verify conversion
      expect(n8nNode).toBeDefined();
      expect(n8nNode.id).toBeDefined();
      expect(n8nNode.name).toBe('HTTP');
      expect(n8nNode.type).toBe('n8n-nodes-base.httpRequest');
      expect(n8nNode.parameters).toBeDefined();
      expect(n8nNode.parameters?.operation).toBe('GET');
      expect(n8nNode.parameters?.url).toBe('https://example.com/api');
      expect(n8nNode.parameters?.headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    it('should convert a simple Make.com workflow to n8n format', async () => {
      // Create a sample Make.com workflow with HTTP module
      const makeWorkflow = {
        name: 'Simple HTTP Workflow',
        flow: [
          {
            id: 1,
            name: 'HTTP',
            type: 'http',
            bundleId: 'http',
            definition: {
              type: 'get',
              parameters: {
                url: 'https://example.com/api',
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            }
          }
        ]
      };

      // Convert the workflow
      const result = await convertWorkflow(makeWorkflow, 'make', 'n8n', { nodeMapper });

      // Verify conversion result
      expect(result).toBeDefined();
      expect(result.convertedWorkflow).toBeDefined();
      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      
      // Check converted workflow structure
      const n8nWorkflow = result.convertedWorkflow;
      expect(n8nWorkflow.name).toBe('Simple HTTP Workflow');
      expect(Array.isArray(n8nWorkflow.nodes)).toBe(true);
      expect(n8nWorkflow.nodes.length).toBe(1);
      
      // Check converted HTTP node
      const httpNode = n8nWorkflow.nodes[0];
      expect(httpNode.name).toBe('HTTP');
      expect(httpNode.type).toBe('n8n-nodes-base.httpRequest');
    });

    it('should evaluate expressions during conversion when enabled', async () => {
      // Create a sample Make.com workflow with expressions
      const makeWorkflow = {
        name: 'Workflow with Expressions',
        flow: [
          {
            id: 1,
            name: 'HTTP',
            type: 'http',
            bundleId: 'http',
            definition: {
              type: 'get',
              parameters: {
                url: '{{1 + 2}}',
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            }
          }
        ]
      };

      console.log('\n=== TESTING MAKE EXPRESSION EVALUATION ===');
      console.log('Original URL expression:', makeWorkflow.flow[0].definition.parameters.url);

      // Set options with expression evaluation enabled
      const options = {
        evaluateExpressions: true,
        expressionContext: {},
        nodeMapper
      };

      // Convert with expression evaluation
      const result = await convertWorkflow(makeWorkflow, 'make', 'n8n', options);

      // Log detailed conversion results for debugging
      console.log('\n=== CONVERSION RESULT ===');
      console.log('Logs from conversion:');
      result.logs.forEach(log => console.log(`  ${log.type}: ${log.message}`));

      // Print the first node of the converted workflow
      const convertedNode = result.convertedWorkflow.nodes[0];
      console.log('\nConverted n8n node:');
      console.log('  name:', convertedNode.name);
      console.log('  type:', convertedNode.type);
      
      console.log('\nConverted parameters:');
      if (convertedNode.parameters) {
        for (const [key, value] of Object.entries(convertedNode.parameters)) {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Verify converted workflow
      const n8nWorkflow = result.convertedWorkflow;
      // In this case, we expect the expression to be evaluated to 3
      expect(n8nWorkflow.nodes[0].parameters).toBeDefined();
      
      // Check if the expression was properly evaluated
      console.log('\n=== EXPRESSION EVALUATION CHECK ===');
      console.log('Expected URL after evaluation: 3');
      console.log('Actual URL after evaluation:', n8nWorkflow.nodes[0].parameters?.url);
      
      expect(n8nWorkflow.nodes[0].parameters?.url).toBe(3);
      console.log('\nExpression evaluation test PASSED ✓');
    });
  });
}); 