import { n8nToMake } from '../../../lib/converters/n8n-to-make';
import { loadFixture, compareWorkflows, validateParameterConversion } from '../../utils/test-helpers';
import { DebugTracker } from '../../../lib/debug-tracker';

describe('n8n to Make Converter', () => {
  let sourceWorkflow: any;
  let expectedWorkflow: any;
  
  beforeAll(() => {
    // Use hardcoded test data instead of fixtures
    sourceWorkflow = {
      "nodes": [
        {
          "id": "a1b2c3",
          "name": "HTTP Request",
          "type": "n8n-nodes-base.httpRequest",
          "parameters": {
            "url": "https://example.com/api",
            "method": "GET",
            "authentication": "none",
            "options": {
              "timeout": 5000
            }
          },
          "position": [100, 200]
        },
        {
          "id": "d4e5f6",
          "name": "JSON Parse",
          "type": "n8n-nodes-base.jsonParse",
          "parameters": {
            "property": "data",
            "options": {}
          },
          "position": [300, 200]
        },
        {
          "id": "g7h8i9",
          "name": "Function",
          "type": "n8n-nodes-base.function",
          "parameters": {
            "functionCode": "// Code that contains complex expressions\nreturn {\n  result: $input.first().json.data.map(item => item.value * 2)\n};"
          },
          "position": [500, 200]
        }
      ],
      "connections": {
        "HTTP Request": {
          "main": [
            [
              {
                "node": "JSON Parse",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "JSON Parse": {
          "main": [
            [
              {
                "node": "Function",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      }
    };
    
    expectedWorkflow = {
      "name": "Converted from n8n",
      "flow": [
        {
          "id": "a1b2c3",
          "module": "http:ActionSendData",
          "label": "HTTP Request",
          "mapper": {
            "url": "https://example.com/api",
            "method": "GET"
          },
          "parameters": {}
        },
        {
          "id": "d4e5f6",
          "module": "json",
          "label": "JSON Parse",
          "mapper": {
            "parsedObject": "data"
          },
          "parameters": {}
        },
        {
          "id": "g7h8i9",
          "module": "tools",
          "label": "Function",
          "mapper": {
            "code": "// Code that contains complex expressions\nreturn {\n  result: $input.first().json.data.map(item => item.value * 2)\n};"
          },
          "parameters": {}
        }
      ],
      "metadata": {
        "instant": false,
        "version": 1,
        "scenario": {
          "roundtrips": 1,
          "maxErrors": 3,
          "autoCommit": true,
          "autoCommitTriggerLast": true,
          "sequential": false,
          "confidential": false,
          "dataloss": false,
          "dlq": false,
          "source": "n8n-converter"
        },
        "designer": {
          "orphans": []
        }
      }
    };
    
    // Debug the loaded fixtures
    console.log('Source workflow nodes:', sourceWorkflow?.nodes?.length);
    console.log('Expected workflow flow:', expectedWorkflow?.flow?.length);
  });
  
  test('should convert an n8n workflow to a Make workflow', async () => {
    // Create debug tracker to capture conversion details
    const debugTracker = new DebugTracker();
    
    // Perform the conversion
    const result = await n8nToMake(sourceWorkflow, debugTracker);
    
    // Verify structure
    expect(result.convertedWorkflow).toMatchWorkflowStructure(expectedWorkflow);
    
    // Detailed comparison of the result
    const { matches, differences } = compareWorkflows(
      result.convertedWorkflow, 
      expectedWorkflow
    );
    
    // Log differences for debugging
    if (!matches) {
      console.log('Workflow differences:', differences);
    }
    
    expect(matches).toBe(true);
    
    // Verify that conversion logs were generated
    expect(result.logs).toBeDefined();
    expect(Array.isArray(result.logs)).toBe(true);
  });
  
  test('should identify parameters that require manual adjustment', async () => {
    const debugTracker = new DebugTracker();
    
    // Perform the conversion
    const result = await n8nToMake(sourceWorkflow, debugTracker);
    
    // Check the parametersNeedingReview directly from the result
    expect(result.parametersNeedingReview).toBeDefined();
    expect(Array.isArray(result.parametersNeedingReview)).toBe(true);
    
    // Log parameters needing review
    console.log('Parameters requiring manual adjustment:', result.parametersNeedingReview);
    
    // We expect the Function node's code parameter to need review
    expect(result.parametersNeedingReview).toContain('Module Function, parameter code');
  });
  
  test('should handle empty workflow gracefully', async () => {
    const emptyWorkflow = { nodes: [], connections: {} };
    const debugTracker = new DebugTracker();
    
    // Perform the conversion with empty workflow
    const result = await n8nToMake(emptyWorkflow, debugTracker);
    
    // Basic verification of the result structure
    expect(result.convertedWorkflow).toBeDefined();
    expect(result.convertedWorkflow.flow).toBeDefined();
    expect(Array.isArray(result.convertedWorkflow.flow)).toBe(true);
    expect(result.convertedWorkflow.flow.length).toBe(0);
  });
}); 