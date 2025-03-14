// Simple test script to manually test the workflow converter
import { convertWorkflow } from './lib/workflow-converter.js';
import { NodeMapper } from './lib/node-mappings/node-mapper.js';

// Create a mock mapping database
const mockMappingDatabase = {
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

// Create a NodeMapper instance with the mock database
const nodeMapper = new NodeMapper(mockMappingDatabase);

// Sample n8n workflow
const n8nWorkflow = {
  name: 'Sample Workflow',
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

// Context for expression evaluation
const expressionContext = {
  $json: {
    id: '12345'
  }
};

// Test n8n to Make.com conversion with expression evaluation
async function testN8nToMakeConversion() {
  console.log('Testing n8n to Make.com conversion with expression evaluation...');
  
  try {
    const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make', {
      evaluateExpressions: true,
      expressionContext,
      nodeMapper
    });
    
    console.log('Conversion result:');
    console.log(JSON.stringify(result.convertedWorkflow, null, 2));
    
    // Check if the expression was evaluated correctly
    const makeModule = result.convertedWorkflow.flow[0];
    console.log('\nExpression evaluation check:');
    console.log(`Original URL: ${"https://example.com/api/" + expressionContext.$json.id}`);
    console.log(`Evaluated URL: ${makeModule.definition.parameters.url}`);
    
    console.log('\nLogs:');
    result.logs.forEach(log => console.log(`- ${log.type}: ${log.message}`));
    
    console.log('\nParameters needing review:');
    if (result.parametersNeedingReview.length === 0) {
      console.log('- None');
    } else {
      result.parametersNeedingReview.forEach(param => console.log(`- ${param}`));
    }
  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

// Run the test
testN8nToMakeConversion().catch(console.error); 