#!/usr/bin/env node

/**
 * Direct test script for testing the workflow converter functions
 * without going through the API layer
 */

// Import the converter functions directly
const { convertN8nToMake, convertMakeToN8n } = require('../lib/workflow-converter');
const fs = require('fs');
const path = require('path');
const { FeatureFlags } = require('../lib/feature-management/feature-flags');

// Set up logging
const logFile = path.join(__dirname, 'direct-test.log');
let logData = '';

function log(message) {
  const formattedMessage = typeof message === 'object' 
    ? JSON.stringify(message, null, 2) 
    : message;
  console.log(formattedMessage);
  logData += formattedMessage + '\n';
}

// Set development mode for testing
log('\n=== Setting development mode ===');
log(`NODE_ENV before: ${process.env.NODE_ENV || 'undefined'}`);
process.env.NODE_ENV = 'development';
log(`NODE_ENV after: ${process.env.NODE_ENV}`);

// Create test workflows with unsupported nodes
const createTestWorkflows = () => {
  // n8n workflow with unsupported node
  const n8nWorkflow = {
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

  // Make workflow with unsupported module
  const makeWorkflow = {
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

  // Save workflows to files for reference
  const n8nFilePath = path.join(__dirname, 'direct-test-n8n-workflow.json');
  fs.writeFileSync(n8nFilePath, JSON.stringify(n8nWorkflow, null, 2));
  log(`Created test n8n workflow file at ${n8nFilePath}`);

  const makeFilePath = path.join(__dirname, 'direct-test-make-workflow.json');
  fs.writeFileSync(makeFilePath, JSON.stringify(makeWorkflow, null, 2));
  log(`Created test Make workflow file at ${makeFilePath}`);

  return { n8nWorkflow, makeWorkflow, n8nFilePath, makeFilePath };
};

// Check feature flag status
const checkFeatureFlags = () => {
  log('\n=== Checking feature flag status ===');
  const enableFullConversionInDevMode = FeatureFlags.getFlag('enableFullConversionInDevMode');
  log(`enableFullConversionInDevMode: ${enableFullConversionInDevMode}`);
  return enableFullConversionInDevMode;
};

// Set feature flag
const setFeatureFlag = (flagName, value) => {
  log(`\n=== Setting feature flag ${flagName} to ${value} ===`);
  FeatureFlags.setFlag(flagName, value);
  const updatedValue = FeatureFlags.getFlag(flagName);
  log(`Updated flag value: ${updatedValue}`);
  return updatedValue;
};

// Test n8n to Make conversion
const testN8nToMake = (n8nWorkflow, bypassChecks = false) => {
  log(`\n=== Testing n8n to Make conversion${bypassChecks ? ' with bypass' : ''} ===`);
  
  // Log the bypass flag value
  log(`Direct check - bypassChecks: ${bypassChecks}`);
  log(`Direct check - featureFlag: ${FeatureFlags.getFlag('enableFullConversionInDevMode')}`);
  log(`Direct check - isDev: ${process.env.NODE_ENV === 'development'}`);
  
  try {
    const result = convertN8nToMake(n8nWorkflow, {
      bypassModuleAvailabilityChecks: bypassChecks
    });
    
    // Save converted workflow
    const outputPath = path.join(
      __dirname, 
      `direct-test-n8n-to-make${bypassChecks ? '-bypassed' : ''}.json`
    );
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    log(`Conversion successful. Result saved to ${outputPath}`);
    
    // Check for bypass message in logs
    const bypassLog = result.logs.find(log => 
      log.message && log.message.includes('Bypassing module availability checks')
    );
    
    if (bypassLog) {
      log(`\n✅ BYPASS MODE DETECTED: "${bypassLog.message}"`);
    } else {
      log(`\n❌ BYPASS MODE NOT DETECTED in logs`);
    }
    
    // Log conversion logs
    log('Conversion logs:');
    if (result.logs && result.logs.length > 0) {
      result.logs.forEach(logEntry => {
        log(`[${logEntry.type}] ${logEntry.message}`);
      });
    } else {
      log('No logs found in result');
    }
    
    return result;
  } catch (error) {
    log(`Error converting n8n to Make: ${error.message}`);
    return null;
  }
};

// Test Make to n8n conversion
const testMakeToN8n = (makeWorkflow, bypassChecks = false) => {
  log(`\n=== Testing Make to n8n conversion${bypassChecks ? ' with bypass' : ''} ===`);
  try {
    const result = convertMakeToN8n(makeWorkflow, {
      bypassModuleAvailabilityChecks: bypassChecks
    });
    
    // Save converted workflow
    const outputPath = path.join(
      __dirname, 
      `direct-test-make-to-n8n${bypassChecks ? '-bypassed' : ''}.json`
    );
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    log(`Conversion successful. Result saved to ${outputPath}`);
    
    // Check for bypass message in logs
    const bypassLog = result.logs.find(log => 
      log.message && log.message.includes('Bypassing module availability checks')
    );
    
    if (bypassLog) {
      log(`\n✅ BYPASS MODE DETECTED: "${bypassLog.message}"`);
    } else {
      log(`\n❌ BYPASS MODE NOT DETECTED in logs`);
    }
    
    // Log conversion logs
    log('Conversion logs:');
    if (result.logs && result.logs.length > 0) {
      result.logs.forEach(logEntry => {
        log(`[${logEntry.type}] ${logEntry.message}`);
      });
    } else {
      log('No logs found in result');
    }
    
    return result;
  } catch (error) {
    log(`Error converting Make to n8n: ${error.message}`);
    return null;
  }
};

// Main function
const main = async () => {
  log('Starting Direct Test Script');
  log(`Date: ${new Date().toISOString()}`);
  
  try {
    // Create test workflows
    const { n8nWorkflow, makeWorkflow } = createTestWorkflows();
    
    // Check current feature flag status
    checkFeatureFlags();
    
    // Run tests with feature flag disabled
    log('\n=== Running tests with feature flag disabled ===');
    testN8nToMake(n8nWorkflow, false);
    testMakeToN8n(makeWorkflow, false);
    
    // Run tests with explicit bypass parameter
    log('\n=== Running tests with explicit bypass parameter ===');
    testN8nToMake(n8nWorkflow, true);
    testMakeToN8n(makeWorkflow, true);
    
    // Enable feature flag
    setFeatureFlag('enableFullConversionInDevMode', true);
    
    // Run tests with feature flag enabled
    log('\n=== Running tests with feature flag enabled ===');
    testN8nToMake(n8nWorkflow, false); // Should use the flag value
    testMakeToN8n(makeWorkflow, false); // Should use the flag value
    
    // Disable feature flag
    setFeatureFlag('enableFullConversionInDevMode', false);
    
    // Verify flag was disabled
    checkFeatureFlags();
    
    // Save log file
    fs.writeFileSync(logFile, logData);
    log(`\nTest completed. Log saved to ${logFile}`);
  } catch (error) {
    log(`Error in main execution: ${error.message}`);
    // Save log file even if there was an error
    fs.writeFileSync(logFile, logData);
  }
};

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 