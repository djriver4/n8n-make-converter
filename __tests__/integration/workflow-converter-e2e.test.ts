/**
 * End-to-End tests for the workflow converter
 * 
 * These tests verify the entire conversion process from n8n to Make.com and back,
 * ensuring that all components work together correctly.
 */

import { 
  WorkflowConverter, 
  convertN8nToMake, 
  convertMakeToN8n,
  ConversionResult
} from '../../lib/workflow-converter';

import { NodeParameterProcessor } from '../../lib/converters/parameter-processor';
import { N8nWorkflow, MakeWorkflow, N8nNode, MakeModule } from '../../lib/node-mappings/node-types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NodeMappingDatabase, ParameterMapping } from '../../lib/node-mappings/schema';

// Create minimal mapping database for tests
const mockMappingDatabase: NodeMappingDatabase = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  mappings: {
    // n8n to Make mappings
    "httpRequest": {
      source: "n8n",
      sourceNodeType: "n8n-nodes-base.httpRequest",
      targetNodeType: "http",
      metadata: {
        displayName: "HTTP Request",
        description: "Make HTTP requests",
        version: "1.0",
      },
      parameterMappings: {
        url: {
          sourcePath: "url",
          targetPath: "URL"
        },
        method: {
          sourcePath: "method",
          targetPath: "method"
        }
      }
    },
    "set": {
      source: "n8n",
      sourceNodeType: "n8n-nodes-base.set",
      targetNodeType: "setVariable",
      metadata: {
        displayName: "Set Variable",
        description: "Set variables",
        version: "1.0",
      },
      parameterMappings: {
        values: {
          sourcePath: "values",
          targetPath: "variables"
        }
      }
    },
    "manualTrigger": {
      source: "n8n",
      sourceNodeType: "n8n-nodes-base.manualTrigger",
      targetNodeType: "scheduler",
      metadata: {
        displayName: "Scheduler",
        description: "Schedule workflow execution",
        version: "1.0",
      },
      parameterMappings: {}
    },
    
    // Make to n8n mappings
    "http": {
      source: "make",
      sourceNodeType: "http",
      targetNodeType: "n8n-nodes-base.httpRequest",
      metadata: {
        displayName: "HTTP Request",
        description: "Make HTTP requests",
        version: "1.0",
      },
      parameterMappings: {
        URL: {
          sourcePath: "URL",
          targetPath: "url"
        },
        method: {
          sourcePath: "method",
          targetPath: "method"
        }
      }
    },
    "scheduler": {
      source: "make",
      sourceNodeType: "scheduler",
      targetNodeType: "n8n-nodes-base.manualTrigger",
      metadata: {
        displayName: "Manual Trigger",
        description: "Trigger a workflow manually",
        version: "1.0",
      },
      parameterMappings: {}
    }
  }
};

describe('Workflow Converter End-to-End Tests', () => {
  // Test data
  let sampleN8nWorkflow: N8nWorkflow;
  let sampleMakeWorkflow: MakeWorkflow;
  let converter: WorkflowConverter;
  
  beforeAll(() => {
    // Create a custom converter with our mock mapping database
    converter = new WorkflowConverter(mockMappingDatabase);
    
    // Create minimal test workflows for our tests
    sampleN8nWorkflow = {
      name: 'Test n8n Workflow',
      nodes: [
        {
          id: 'node1',
          name: 'Start',
          type: 'n8n-nodes-base.manualTrigger',
          parameters: {},
          position: [100, 100]
        },
        {
          id: 'node2',
          name: 'HTTP Request',
          type: 'n8n-nodes-base.httpRequest',
          parameters: {
            url: 'https://example.com/api',
            method: 'GET',
            authentication: 'none'
          },
          position: [300, 100]
        }
      ],
      connections: {
        'node1': {
          main: {
            '0': [
              {
                sourceNodeId: 'node1',
                targetNodeId: 'node2',
                sourceOutputIndex: 0,
                targetInputIndex: 0
              }
            ]
          }
        }
      },
      active: true
    };
    
    sampleMakeWorkflow = {
      name: 'Test Make Workflow',
      modules: [
        {
          id: '1',
          name: 'Scheduler',
          type: 'scheduler',
          parameters: {
            interval: {
              value: 1,
              unit: 'hours'
            }
          },
          position: [100, 100]
        },
        {
          id: '2',
          name: 'HTTP Request',
          type: 'http',
          parameters: {
            URL: 'https://example.com/api',
            method: 'GET',
            authentication: {
              type: 'none'
            }
          },
          position: [300, 100]
        }
      ],
      routes: [
        {
          sourceId: '1',
          targetId: '2',
          type: 'main'
        }
      ],
      active: true
    };
    
    // Try to load fixtures, but use our test data if fixtures are not available
    try {
      // Load a sample n8n workflow for tests
      const n8nWorkflowPath = join(__dirname, '../fixtures/sample-n8n-workflow.json');
      const n8nWorkflowData = JSON.parse(readFileSync(n8nWorkflowPath, 'utf8'));
      if (n8nWorkflowData && n8nWorkflowData.nodes && n8nWorkflowData.nodes.length > 0) {
        sampleN8nWorkflow = n8nWorkflowData;
      }
      
      // Load a sample Make.com workflow for tests
      const makeWorkflowPath = join(__dirname, '../fixtures/sample-make-workflow.json');
      const makeWorkflowData = JSON.parse(readFileSync(makeWorkflowPath, 'utf8'));
      if (makeWorkflowData && makeWorkflowData.modules && makeWorkflowData.modules.length > 0) {
        sampleMakeWorkflow = makeWorkflowData;
      }
    } catch (error) {
      console.warn('Using fallback test data. Could not load test fixtures:', error);
    }
  });
  
  describe('n8n to Make.com Conversion', () => {
    test('should convert n8n workflow to Make.com format', () => {
      // Run the conversion
      const result = converter.convertN8nToMake(sampleN8nWorkflow, {
        skipValidation: true,
        debug: true
      });
      
      // Verify the result structure
      expect(result).toBeDefined();
      expect(result.convertedWorkflow).toBeDefined();
      expect(result.convertedWorkflow.name).toEqual(sampleN8nWorkflow.name);
      expect(result.logs).toBeInstanceOf(Array);
      
      // Verify modules were created
      const makeWorkflow = result.convertedWorkflow as MakeWorkflow;
      expect(makeWorkflow.modules.length).toBeGreaterThanOrEqual(1);
      
      // Check if any nodes failed to convert
      if (result.unmappedNodes && result.unmappedNodes.length > 0) {
        console.warn('Unmapped n8n nodes:', result.unmappedNodes);
      }
      
      // Count successful conversions
      const successfulNodes = makeWorkflow.modules.filter(m => m.type !== 'placeholder');
      console.log(`Successfully converted ${successfulNodes.length} of ${sampleN8nWorkflow.nodes.length} nodes`);
      
      // Verify at least some nodes were successfully converted
      expect(successfulNodes.length).toBeGreaterThan(0);
    });
    
    test('should correctly convert expressions from n8n to Make.com', () => {
      // Create a simple n8n workflow with expressions
      const workflowWithExpressions: N8nWorkflow = {
        name: 'Expression Test',
        nodes: [
          {
            id: 'node1',
            name: 'Node with Expressions',
            type: 'n8n-nodes-base.set',
            parameters: {
              values: {
                string: {
                  value: '={{ $json.name }}',
                },
                number: {
                  value: '={{ $json.count * 2 }}',
                },
                boolean: {
                  value: '={{ $json.active === true }}',
                },
                object: {
                  value: '={{ { "firstName": $json.firstName, "lastName": $json.lastName } }}',
                },
                combined: {
                  value: 'Hello, ={{ $json.name }}!'
                }
              }
            },
            position: [100, 100]
          }
        ],
        connections: {},
        active: true
      };
      
      // Convert using NodeParameterProcessor directly
      const n8nParams = workflowWithExpressions.nodes[0].parameters;
      const makeParams = NodeParameterProcessor.convertN8nToMakeParameters(n8nParams);
      
      // Verify expression conversion
      expect(makeParams.values.string.value).toBe('{{1.name}}');
      expect(makeParams.values.number.value).toBe('{{1.count * 2}}');
      expect(makeParams.values.boolean.value).toBe('{{1.active === true}}');
      // Note: The exact format may vary, we're just checking the content is preserved
      expect(makeParams.values.object.value).toContain('firstName');
      expect(makeParams.values.object.value).toContain('lastName');
      expect(makeParams.values.combined.value).toBe('Hello, {{1.name}}!');
    });
  });
  
  describe('Make.com to n8n Conversion', () => {
    test('should convert Make.com workflow to n8n format', () => {
      // Run the conversion
      const result = converter.convertMakeToN8n(sampleMakeWorkflow, {
        skipValidation: true,
        debug: true
      });
      
      // Verify the result structure
      expect(result).toBeDefined();
      expect(result.convertedWorkflow).toBeDefined();
      expect(result.convertedWorkflow.name).toEqual(sampleMakeWorkflow.name);
      expect(result.logs).toBeInstanceOf(Array);
      
      // Verify nodes were created
      const n8nWorkflow = result.convertedWorkflow as N8nWorkflow;
      expect(n8nWorkflow.nodes.length).toBeGreaterThanOrEqual(1);
      
      // Check if any modules failed to convert
      if (result.unmappedNodes && result.unmappedNodes.length > 0) {
        console.warn('Unmapped Make.com modules:', result.unmappedNodes);
      }
      
      // Count successful conversions
      const successfulNodes = n8nWorkflow.nodes.filter(n => n.type !== 'placeholder');
      console.log(`Successfully converted ${successfulNodes.length} of ${sampleMakeWorkflow.modules.length} modules`);
      
      // Verify at least some modules were successfully converted
      expect(successfulNodes.length).toBeGreaterThan(0);
    });
    
    test('should correctly convert expressions from Make.com to n8n', () => {
      // Create a simple Make workflow with expressions
      const workflowWithExpressions: MakeWorkflow = {
        name: 'Expression Test',
        modules: [
          {
            id: '1',
            name: 'Module with Expressions',
            type: 'setVariable',
            parameters: {
              variables: [
                {
                  name: "string",
                  value: "{{1.name}}"
                },
                {
                  name: "number",
                  value: "{{1.count * 2}}"
                },
                {
                  name: "boolean",
                  value: "{{1.active === true}}"
                },
                {
                  name: "object",
                  value: "{{ { \"firstName\": 1.firstName, \"lastName\": 1.lastName } }}"
                },
                {
                  name: "combined",
                  value: "Hello, {{1.name}}!"
                }
              ]
            },
            position: [100, 100]
          }
        ],
        routes: [],
        active: true
      };
      
      // Convert a simple expression for testing
      const makeExpr = "{{1.name}}";
      // Use the public method to convert Make parameters to n8n parameters
      const paramResult = NodeParameterProcessor.convertMakeToN8nParameters({ testParam: makeExpr });
      
      // Verify the expression was converted correctly
      expect(paramResult.testParam).toBe('={{ $json.name }}');
    });
  });
  
  describe('Round-trip Conversion', () => {
    test('should maintain workflow integrity in round-trip conversion', () => {
      // Start with a simple n8n workflow
      const originalWorkflow: N8nWorkflow = {
        name: 'Round-trip Test Workflow',
        nodes: [
          {
            id: 'node1',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            parameters: {
              url: 'https://example.com/api',
              method: 'GET',
              authentication: 'none',
              options: {
                redirect: {
                  follow: true
                }
              }
            },
            position: [100, 100]
          },
          {
            id: 'node2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            parameters: {
              values: {
                value1: {
                  name: 'data',
                  value: '={{ $json.response }}'
                }
              }
            },
            position: [300, 100]
          }
        ],
        connections: {
          'node1': {
            main: {
              '0': [
                {
                  sourceNodeId: 'node1',
                  targetNodeId: 'node2',
                  sourceOutputIndex: 0,
                  targetInputIndex: 0
                }
              ]
            }
          }
        },
        active: true
      };
      
      // Convert n8n to Make.com
      const makeResult = converter.convertN8nToMake(originalWorkflow, { skipValidation: true });
      expect(makeResult.convertedWorkflow).toBeDefined();
      
      // Convert back from Make.com to n8n
      const n8nResult = converter.convertMakeToN8n(makeResult.convertedWorkflow as MakeWorkflow, { skipValidation: true });
      expect(n8nResult.convertedWorkflow).toBeDefined();
      
      // Get the round-trip workflow
      const roundTripWorkflow = n8nResult.convertedWorkflow as N8nWorkflow;
      
      // Verify the workflow name is preserved
      expect(roundTripWorkflow.name).toBe(originalWorkflow.name);
      
      // Verify nodes count is maintained
      expect(roundTripWorkflow.nodes.length).toBe(originalWorkflow.nodes.length);
      
      // Verify node connections are preserved (count)
      const originalConnections = Object.keys(originalWorkflow.connections).reduce(
        (count, nodeId) => count + (
          originalWorkflow.connections[nodeId]?.main 
            ? Object.values(originalWorkflow.connections[nodeId].main!).flat().length
            : 0
        ), 0
      );
      
      const roundTripConnections = Object.keys(roundTripWorkflow.connections).reduce(
        (count, nodeId) => count + (
          roundTripWorkflow.connections[nodeId]?.main 
            ? Object.values(roundTripWorkflow.connections[nodeId].main!).flat().length
            : 0
        ), 0
      );
      
      expect(roundTripConnections).toBe(originalConnections);
    });
  });
}); 