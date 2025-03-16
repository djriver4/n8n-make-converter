#!/usr/bin/env node

/**
 * Test script for feature flag bypass functionality
 * 
 * This script tests the bypass module availability feature flag
 * by directly calling the conversion functions with workflows
 * containing unsupported nodes.
 */

const fs = require('fs');
const path = require('path');
const { convertWorkflow } = require('../lib/converter');
const { FeatureFlags } = require('../lib/feature-management/feature-flags');
const { WorkflowConverter } = require('../lib/workflow-converter');

// Make sure development mode is set
process.env.NODE_ENV = 'development';

// Test data - n8n workflow with an unsupported node
const n8nWorkflowWithUnsupportedNode = {
  "name": "Test n8n Workflow with Unsupported Node",
  "active": true,
  "nodes": [
    {
      "id": "a1b2c3",
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://example.com/api",
        "method": "GET"
      },
      "position": [100, 200]
    },
    {
      "id": "d4e5f6",
      "name": "UnsupportedNode",
      "type": "n8n-nodes-base.unsupportedNodeType",
      "parameters": {
        "property": "data"
      },
      "position": [300, 200]
    }
  ],
  "connections": {
    "HTTP Request": {
      "main": [
        [
          {
            "node": "UnsupportedNode",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
};

// Make workflow with an unsupported module
const makeWorkflowWithUnsupportedModule = {
  "name": "Test Make Workflow with Unsupported Module",
  "flow": [
    {
      "id": "1",
      "module": "http:ActionSendData",
      "label": "HTTP Request",
      "mapper": {
        "url": "https://example.com/api",
        "method": "GET"
      }
    },
    {
      "id": "2",
      "module": "unsupported:UnknownModule",
      "label": "Unsupported Module",
      "mapper": {
        "someProperty": "value"
      }
    }
  ],
  "metadata": {
    "instant": false,
    "version": 1
  }
};

// Save logs of the test run
const logFile = path.join(__dirname, 'feature-flag-test.log');
let logData = '';

function log(message) {
  console.log(message);
  logData += message + '\n';
}

// Helper function to save a workflow to file
function saveWorkflow(workflow, filename) {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
  log(`Saved workflow to ${filePath}`);
  return filePath;
}

// Force enable the feature flag
async function testWithFeatureFlagEnabled() {
  log('=== Testing with Feature Flag ENABLED ===');
  
  // Enable the feature flag
  FeatureFlags.setFlag('enableFullConversionInDevMode', true);
  log('Feature flag enableFullConversionInDevMode is now ENABLED');
  
  // Test n8n to Make conversion
  log('\n--- Testing n8n to Make conversion ---');
  try {
    const result = await convertWorkflow(
      n8nWorkflowWithUnsupportedNode,
      'n8n',
      'make',
      { bypassModuleAvailabilityChecks: true }
    );
    
    log(`Conversion successful: ${result.convertedWorkflow !== null}`);
    log(`Logs: ${JSON.stringify(result.logs)}`);
    log(`Unmapped nodes: ${result.unmappedNodes ? result.unmappedNodes.join(', ') : 'none'}`);
    
    // Save the converted workflow
    saveWorkflow(result.convertedWorkflow, 'converted-make-workflow-enabled.json');
  } catch (error) {
    log(`Error during n8n to Make conversion: ${error.message}`);
  }
  
  // Test Make to n8n conversion
  log('\n--- Testing Make to n8n conversion ---');
  try {
    const result = await convertWorkflow(
      makeWorkflowWithUnsupportedModule,
      'make',
      'n8n',
      { bypassModuleAvailabilityChecks: true }
    );
    
    log(`Conversion successful: ${result.convertedWorkflow !== null}`);
    log(`Logs: ${JSON.stringify(result.logs)}`);
    log(`Parameters needing review: ${result.paramsNeedingReview ? result.paramsNeedingReview.length : 0}`);
    
    // Save the converted workflow
    saveWorkflow(result.convertedWorkflow, 'converted-n8n-workflow-enabled.json');
  } catch (error) {
    log(`Error during Make to n8n conversion: ${error.message}`);
  }
}

// Test with feature flag disabled
async function testWithFeatureFlagDisabled() {
  log('\n\n=== Testing with Feature Flag DISABLED ===');
  
  // Disable the feature flag
  FeatureFlags.setFlag('enableFullConversionInDevMode', false);
  log('Feature flag enableFullConversionInDevMode is now DISABLED');
  
  // Test n8n to Make conversion
  log('\n--- Testing n8n to Make conversion ---');
  try {
    const result = await convertWorkflow(
      n8nWorkflowWithUnsupportedNode,
      'n8n',
      'make',
      { bypassModuleAvailabilityChecks: false }
    );
    
    log(`Conversion result: ${result.convertedWorkflow !== null ? 'workflow returned' : 'no workflow'}`);
    log(`Logs: ${JSON.stringify(result.logs)}`);
    log(`Unmapped nodes: ${result.unmappedNodes ? result.unmappedNodes.join(', ') : 'none'}`);
    
    // Save the converted workflow
    saveWorkflow(result.convertedWorkflow, 'converted-make-workflow-disabled.json');
  } catch (error) {
    log(`Error during n8n to Make conversion: ${error.message}`);
  }
  
  // Test Make to n8n conversion
  log('\n--- Testing Make to n8n conversion ---');
  try {
    const result = await convertWorkflow(
      makeWorkflowWithUnsupportedModule,
      'make',
      'n8n',
      { bypassModuleAvailabilityChecks: false }
    );
    
    log(`Conversion result: ${result.convertedWorkflow !== null ? 'workflow returned' : 'no workflow'}`);
    log(`Logs: ${JSON.stringify(result.logs)}`);
    
    // Save the converted workflow
    saveWorkflow(result.convertedWorkflow, 'converted-n8n-workflow-disabled.json');
  } catch (error) {
    log(`Error during Make to n8n conversion: ${error.message}`);
  }
}

// Test with direct WorkflowConverter instantiation
async function testWithDirectConverterInstantiation() {
  log('\n\n=== Testing with Direct WorkflowConverter Instantiation ===');
  
  // Enable the feature flag
  FeatureFlags.setFlag('enableFullConversionInDevMode', true);
  log('Feature flag enableFullConversionInDevMode is now ENABLED');
  
  // Create WorkflowConverter instance
  const converter = new WorkflowConverter({});
  
  // Test n8n to Make conversion
  log('\n--- Testing n8n to Make conversion with direct converter ---');
  try {
    const result = converter.convertN8nToMake(n8nWorkflowWithUnsupportedNode, {
      bypassModuleAvailabilityChecks: true
    });
    
    log(`Direct conversion successful: ${result.convertedWorkflow !== null}`);
    log(`Direct conversion logs: ${JSON.stringify(result.logs)}`);
    
    // Save the converted workflow
    saveWorkflow(result.convertedWorkflow, 'direct-converted-make-workflow.json');
  } catch (error) {
    log(`Error during direct n8n to Make conversion: ${error.message}`);
  }
  
  // Test Make to n8n conversion
  log('\n--- Testing Make to n8n conversion with direct converter ---');
  try {
    const result = converter.convertMakeToN8n(makeWorkflowWithUnsupportedModule, {
      bypassModuleAvailabilityChecks: true
    });
    
    log(`Direct conversion successful: ${result.convertedWorkflow !== null}`);
    log(`Direct conversion logs: ${JSON.stringify(result.logs)}`);
    
    // Save the converted workflow
    saveWorkflow(result.convertedWorkflow, 'direct-converted-n8n-workflow.json');
  } catch (error) {
    log(`Error during direct Make to n8n conversion: ${error.message}`);
  }
}

// Main function
async function main() {
  log('Starting Feature Flag Test Script');
  log(`Date: ${new Date().toISOString()}`);
  log(`Node.js version: ${process.version}`);
  log(`Environment: ${process.env.NODE_ENV}`);
  
  // Save the test workflows
  saveWorkflow(n8nWorkflowWithUnsupportedNode, 'test-n8n-workflow.json');
  saveWorkflow(makeWorkflowWithUnsupportedModule, 'test-make-workflow.json');
  
  // Run the tests
  await testWithFeatureFlagEnabled();
  await testWithFeatureFlagDisabled();
  await testWithDirectConverterInstantiation();
  
  // Save the log file
  fs.writeFileSync(logFile, logData);
  log(`\nTest completed. Log saved to ${logFile}`);
}

// Run the main function
main().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 