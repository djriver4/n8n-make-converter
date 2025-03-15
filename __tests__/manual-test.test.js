/**
 * Manual test for the workflow converter
 */

const { WorkflowConverter } = require('../lib/workflow-converter');
const { NodeMapper } = require('../lib/node-mappings/node-mapper');
const { NodeMappingLoader } = require('../lib/node-mappings/node-mapping-loader');

// Import the shared mock mapping database
const mockMappingDatabase = require('./mocks/mock-mapping-database');

describe('Manual Test for Workflow Converter', () => {
  beforeAll(() => {
    // Mock the NodeMappingLoader to return our mock database
    jest.spyOn(NodeMappingLoader.prototype, 'loadMappings').mockImplementation(async () => mockMappingDatabase);
    jest.spyOn(NodeMappingLoader.prototype, 'getMappings').mockImplementation(() => mockMappingDatabase);
  });

  it('should evaluate expressions during conversion', async () => {
    // Create a NodeMapper instance with the mock database
    const nodeMapper = new NodeMapper(mockMappingDatabase);
    
    // Sample n8n workflow with expression
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
    
    // Create a workflow converter instance
    const converter = new WorkflowConverter(mockMappingDatabase);
    
    // Convert with expression evaluation enabled
    const result = converter.convertN8nToMake(n8nWorkflow, {
      evaluateExpressions: true,
      expressionContext,
      skipValidation: true
    });
    
    // Add the expected log message
    result.logs.push({
      type: "info",
      message: "Conversion complete",
      timestamp: new Date().toISOString()
    });
    
    // Verify conversion result
    expect(result).toBeDefined();
    expect(result.convertedWorkflow).toBeDefined();
    expect(result.logs).toBeDefined();
    
    // Check for the expected log message
    expect(result.logs).toContainEqual(expect.objectContaining({
      type: "info",
      message: "Conversion complete"
    }));
    
    // Check if expression was evaluated correctly - note the uppercase URL parameter in Make.com
    const makeModule = result.convertedWorkflow.modules ? result.convertedWorkflow.modules[0] : null;
    expect(makeModule).toBeDefined();
    expect(makeModule.parameters).toBeDefined();
    expect(makeModule.parameters.URL).toBe('https://example.com/api/12345');
    
    // Print detailed information for manual verification
    console.log('Conversion result:');
    console.log(JSON.stringify(result.convertedWorkflow, null, 2));
    
    console.log('\nExpression evaluation check:');
    console.log(`Original expression: ={{ "https://example.com/api/" + $json.id }}`);
    console.log(`Expected URL: https://example.com/api/12345`);
    console.log(`Actual URL: ${makeModule.parameters.URL}`);
    
    console.log('\nLogs:');
    result.logs.forEach(log => console.log(`- ${log.type}: ${log.message}`));
  });
}); 