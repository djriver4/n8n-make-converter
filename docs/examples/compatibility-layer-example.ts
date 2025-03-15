/**
 * Compatibility Layer Usage Examples
 * 
 * This file provides practical examples of how to use the compatibility layer
 * in real-world scenarios. It demonstrates both modern-to-legacy and legacy-to-modern
 * conversions, as well as error handling and edge cases.
 * 
 * NOTE: This is an example file intended for documentation and may not compile
 * perfectly with the actual project types. In a real implementation, you would
 * use the correct type definitions from the workflow-converter module.
 */

import { 
  convertToLegacyResult, 
  convertToModernResult,
  ensureValidLogEntry,
  paramReviewToString,
  stringToParamReview,
  createDefaultDebugInfo
} from '../../lib/utils/compatibility-layer';
import { 
  ConversionLog, 
  ConversionResult, 
  ParameterReview, 
  WorkflowConversionResult,
  WorkflowDebugInfo
} from '../../lib/workflow-converter';

/**
 * EXAMPLE 1: Public API Compatibility
 * 
 * In this example, we have an internal function that uses the modern interface,
 * but we need to expose a public API function that maintains backward compatibility.
 */

// Internal function using modern interface
function internalConvertWorkflow(workflowData: any): WorkflowConversionResult {
  // Internal processing logic here...
  
  // Return modern result
  const debugInfo = createDefaultDebugInfo();
  
  return {
    convertedWorkflow: { 
      name: 'Converted Workflow',
      nodes: [],
      // ... other properties
    },
    logs: [
      { type: 'info', message: 'Starting conversion', timestamp: new Date().toISOString() },
      { type: 'info', message: 'Conversion complete', timestamp: new Date().toISOString() }
    ],
    paramsNeedingReview: [
      { nodeId: 'HTTP Request', parameters: ['url'], reason: 'Complex expression' },
      { nodeId: 'Function', parameters: ['code'], reason: 'Contains JavaScript' }
    ],
    unmappedNodes: ['CustomNode'],
    debug: debugInfo
  };
}

// Public API that maintains backward compatibility
export function convertWorkflow(workflowData: any): ConversionResult {
  try {
    // Call internal function with modern interface
    const modernResult = internalConvertWorkflow(workflowData);
    
    // Convert to legacy format for external consumers
    return convertToLegacyResult(modernResult);
  }
  catch (error) {
    // Handle any errors that might occur
    const errorDebug = createDefaultDebugInfo();
    // Add custom error info if needed
    (errorDebug as any).error = error;
    
    return {
      convertedWorkflow: { name: 'Error', nodes: [] },
      logs: [{ 
        type: 'error', 
        message: `Error in workflow conversion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }],
      parametersNeedingReview: [],
      unmappedNodes: [],
      isValidInput: false,
      debug: errorDebug
    };
  }
}

/**
 * EXAMPLE 2: Integrating with Legacy Components
 * 
 * In this example, we have a legacy function that returns the old interface,
 * but we need to use it with a modern component that expects the new interface.
 */

// Legacy function from an older part of the codebase
function legacyConvertWorkflow(workflowData: any): ConversionResult {
  // Legacy processing logic...
  
  // Create a valid debug info object
  const debugInfo = createDefaultDebugInfo();
  
  // Return legacy result
  return {
    convertedWorkflow: { 
      name: 'Legacy Converted Workflow',
      nodes: [],
      // ... other properties
    },
    logs: [
      { type: 'info', message: 'Legacy conversion complete', timestamp: new Date().toISOString() }
    ],
    parametersNeedingReview: [
      'HTTP Request - url: Contains complex expression',
      'Function - code: Contains JavaScript code'
    ],
    unmappedNodes: ['OldCustomNode'],
    isValidInput: true,
    debug: debugInfo
  };
}

// Modern component that requires the new interface
class ModernWorkflowProcessor {
  process(workflowResult: WorkflowConversionResult) {
    console.log('Processing modern workflow result:');
    console.log(`- Workflow name: ${workflowResult.convertedWorkflow.name}`);
    console.log(`- Log entries: ${workflowResult.logs.length}`);
    
    // Access structured parameter reviews
    for (const review of workflowResult.paramsNeedingReview) {
      console.log(`- Parameter review: ${review.nodeId} needs attention on ${review.parameters.join(', ')}`);
      console.log(`  Reason: ${review.reason}`);
    }
    
    // Do more processing...
  }
}

// Integration function that connects legacy code with modern components
export function processWithModernComponent(workflowData: any) {
  // Get result from legacy function
  const legacyResult = legacyConvertWorkflow(workflowData);
  
  // Convert to modern format for the new component
  const modernResult = convertToModernResult(legacyResult);
  
  // Process with modern component
  const processor = new ModernWorkflowProcessor();
  processor.process(modernResult);
  
  return modernResult;
}

/**
 * EXAMPLE 3: Handling Edge Cases
 * 
 * This example demonstrates how the compatibility layer handles various edge cases,
 * such as malformed input, missing properties, and unexpected data types.
 */

// Note: In a real implementation, you would use proper type casting and interfaces
export function demonstrateEdgeCases() {
  console.log('=== Edge Case Handling ===');
  
  // Case 1: Null input
  console.log('\n1. Handling null input:');
  const nullResult = convertToLegacyResult(null as any);
  console.log(`- isValidInput: ${nullResult.isValidInput}`);
  console.log(`- Error message: ${nullResult.logs[0].message}`);
  
  // Case 2: Missing properties
  console.log('\n2. Handling missing properties:');
  const incompleteResult = {
    convertedWorkflow: { name: 'Incomplete' },
    // Missing logs, paramsNeedingReview, unmappedNodes, and debug
  } as WorkflowConversionResult;
  
  const fixedIncomplete = convertToLegacyResult(incompleteResult);
  console.log(`- logs array created: ${Array.isArray(fixedIncomplete.logs)}`);
  console.log(`- parametersNeedingReview created: ${Array.isArray(fixedIncomplete.parametersNeedingReview)}`);
  
  // Case 3: Malformed logs
  console.log('\n3. Handling malformed logs:');
  const malformedLogs = {
    convertedWorkflow: { name: 'Malformed Logs' },
    logs: [
      'String instead of object',
      { message: 'Missing type' },
      { type: 'invalid-type', message: 'Invalid type' }
    ] as any,
    paramsNeedingReview: [],
    unmappedNodes: [],
    debug: createDefaultDebugInfo()
  } as WorkflowConversionResult;
  
  const fixedLogs = convertToLegacyResult(malformedLogs);
  console.log(`- First log fixed: ${JSON.stringify(fixedLogs.logs[0])}`);
  console.log(`- Second log fixed: ${fixedLogs.logs[1].type}`);
  console.log(`- Third log fixed: ${fixedLogs.logs[2].type}`);
  
  // Case 4: Malformed parameter reviews
  console.log('\n4. Handling malformed parameter reviews:');
  const malformedParams = {
    convertedWorkflow: { name: 'Malformed Parameters' },
    logs: [],
    parametersNeedingReview: [
      'No separator format',
      'Too - Many - Separators: But still works',
      ''
    ],
    unmappedNodes: [],
    debug: createDefaultDebugInfo()
  } as unknown as ConversionResult;
  
  const fixedParams = convertToModernResult(malformedParams);
  console.log(`- First param fixed: ${JSON.stringify(fixedParams.paramsNeedingReview[0])}`);
  console.log(`- Second param fixed: ${JSON.stringify(fixedParams.paramsNeedingReview[1])}`);
  console.log(`- Empty param fixed: ${JSON.stringify(fixedParams.paramsNeedingReview[2])}`);
}

/**
 * EXAMPLE 4: Utility Functions
 * 
 * This example shows how to use the utility functions provided by the compatibility layer
 * for individual transformations.
 */

export function demonstrateUtilityFunctions() {
  console.log('=== Utility Functions ===');
  
  // Using ensureValidLogEntry
  console.log('\n1. Normalizing log entries:');
  const stringLog = ensureValidLogEntry('Just a string');
  console.log(`- String normalized: ${JSON.stringify(stringLog)}`);
  
  const objectLog = ensureValidLogEntry({ type: 'warning', message: 'Warning message' });
  console.log(`- Object preserved: ${JSON.stringify(objectLog)}`);
  
  // Using paramReviewToString and stringToParamReview
  console.log('\n2. Converting parameter reviews:');
  
  const structuredReview: ParameterReview = {
    nodeId: 'HTTP Request',
    parameters: ['url', 'method'],
    reason: 'Complex expressions'
  };
  
  // Convert to string format
  const reviewString = paramReviewToString(structuredReview);
  console.log(`- To string: ${reviewString}`);
  
  // Convert back to structured format
  const parsedReview = stringToParamReview(reviewString);
  console.log(`- Back to structured: ${JSON.stringify(parsedReview)}`);
  console.log(`- Original and parsed match: ${
    structuredReview.nodeId === parsedReview.nodeId &&
    structuredReview.parameters.join() === parsedReview.parameters.join() &&
    structuredReview.reason === parsedReview.reason
  }`);
}

// Example of running the demonstrations
if (require.main === module) {
  console.log('=== COMPATIBILITY LAYER EXAMPLES ===\n');
  
  // Note: These functions would actually be run by a test framework
  // or in response to API calls in a real application
  
  // For demonstration purposes only
  console.log('Example calls:');
  console.log('- convertWorkflow(workflowData)');
  console.log('- processWithModernComponent(workflowData)');
  console.log('- demonstrateEdgeCases()');
  console.log('- demonstrateUtilityFunctions()');
} 