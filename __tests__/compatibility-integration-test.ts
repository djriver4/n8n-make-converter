import { 
  convertN8nToMake,
  convertMakeToN8n,
  ConversionResult
} from '../lib/workflow-converter';

import {
  N8nWorkflow,
  MakeWorkflow
} from '../lib/node-mappings/node-types';

// Simple test workflow
const testN8nWorkflow: N8nWorkflow = {
  name: "Test Workflow",
  nodes: [
    {
      id: "1",
      name: "Node 1",
      type: "test.node",
      parameters: { test: "value" },
      position: [100, 100]
    }
  ],
  connections: {},
  active: true
};

console.log("Running integration test for compatibility layer...");

// Test n8n to Make conversion
const makeResult = convertN8nToMake(testN8nWorkflow);
console.log("N8n to Make conversion successful:", !!makeResult);
console.log("Result type matches expected ConversionResult:", 
  makeResult && 
  'convertedWorkflow' in makeResult && 
  'logs' in makeResult && 
  'parametersNeedingReview' in makeResult
);

// Test Make to N8n conversion with the converted workflow from previous step
const makeWorkflow = makeResult.convertedWorkflow as MakeWorkflow;
const n8nResult = convertMakeToN8n(makeWorkflow);
console.log("Make to N8n conversion successful:", !!n8nResult);
console.log("Result type matches expected ConversionResult:", 
  n8nResult && 
  'convertedWorkflow' in n8nResult && 
  'logs' in n8nResult && 
  'parametersNeedingReview' in n8nResult
);

console.log("Integration test complete!"); 