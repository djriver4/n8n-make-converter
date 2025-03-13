import { n8nToMake } from '../../../lib/converters/n8n-to-make';
import { loadFixture, compareWorkflows, validateParameterConversion } from '../../utils/test-helpers';
import { DebugTracker } from '../../../lib/debug-tracker';

describe('n8n to Make Converter', () => {
  let sourceWorkflow: any;
  let expectedWorkflow: any;
  
  beforeAll(() => {
    // Load test fixtures
    sourceWorkflow = loadFixture('n8n', 'sample-workflow');
    expectedWorkflow = loadFixture('make', 'expected-workflow');
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