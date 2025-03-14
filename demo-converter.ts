/**
 * Demo script for n8n to Make.com workflow converter
 * Shows the expression evaluation capability
 */

import { convertWorkflow } from './lib/workflow-converter';
import { NodeMapper } from './lib/node-mappings/node-mapper';
import { NodeMappingDatabase } from './lib/node-mappings/schema';

async function runDemo() {
  console.log('=== n8n to Make.com Workflow Converter Demo ===');
  console.log('This demo shows the expression evaluation functionality');
  console.log('----------------------------------------------------\n');

  // Create a simple mock mapping database
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
  const nodeMapper = new NodeMapper(mockMappingDatabase);

  // Create a sample n8n workflow with expressions
  const n8nWorkflow = {
    name: "Demo Workflow with Expressions",
    nodes: [
      {
        id: "1",
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        position: [100, 200],
        parameters: {
          operation: "GET",
          url: "={{ \"https://api.example.com/users/\" + $json.userId }}",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "={{ \"Bearer \" + $json.token }}"
          }
        }
      }
    ],
    connections: {}
  };

  // Setup context for expression evaluation
  const expressionContext = {
    $json: {
      userId: "12345",
      token: "abcdef123456"
    }
  };

  console.log('Original n8n workflow:');
  console.log('Node name:', n8nWorkflow.nodes[0].name);
  console.log('URL expression:', n8nWorkflow.nodes[0].parameters.url);
  console.log('Auth expression:', n8nWorkflow.nodes[0].parameters.headers.Authorization);
  console.log('\nExpression context:');
  console.log(JSON.stringify(expressionContext, null, 2));
  console.log('\nConverting workflow with expression evaluation...');

  // Convert with expression evaluation enabled
  const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make', {
    evaluateExpressions: true,
    expressionContext,
    nodeMapper
  });

  console.log('\nConversion logs:');
  result.logs.forEach(log => console.log(`- [${log.type}] ${log.message}`));

  // Extract the Make.com module for display
  const makeModule = result.convertedWorkflow.flow[0];
  
  console.log('\nConverted Make.com module:');
  console.log('Name:', makeModule.name);
  console.log('Type:', makeModule.type);
  console.log('Operation:', makeModule.definition.type);
  
  console.log('\nConverted parameters with evaluated expressions:');
  console.log('URL:', makeModule.definition.parameters.url);
  console.log('Headers:', JSON.stringify(makeModule.definition.parameters.headers, null, 2));
  
  console.log('\n=== Demonstration Complete ===');
}

// Run the demo
runDemo().catch(error => {
  console.error('Error running demo:', error);
  process.exit(1);
}); 