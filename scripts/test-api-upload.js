#!/usr/bin/env node

/**
 * Script to test API-based workflow conversion
 * 
 * This script tests the feature flag functionality by:
 * 1. Uploading a workflow file to the API
 * 2. Triggering the conversion with the feature flag enabled
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/convert';
const UPLOAD_ENDPOINT = '/api/upload';

// Save logs
const logFile = path.join(__dirname, 'api-test.log');
let logData = '';

function log(message) {
  console.log(message);
  logData += message + '\n';
}

// Create test files if they don't exist
const createTestFiles = () => {
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

  // Save workflows to files
  const n8nFilePath = path.join(__dirname, 'api-test-n8n-workflow.json');
  fs.writeFileSync(n8nFilePath, JSON.stringify(n8nWorkflow, null, 2));
  log(`Created test n8n workflow file at ${n8nFilePath}`);

  const makeFilePath = path.join(__dirname, 'api-test-make-workflow.json');
  fs.writeFileSync(makeFilePath, JSON.stringify(makeWorkflow, null, 2));
  log(`Created test Make workflow file at ${makeFilePath}`);

  return { n8nFilePath, makeFilePath };
};

// Upload a file and get the file ID
const uploadFile = async (filePath, sourceType) => {
  log(`Uploading file: ${filePath} as ${sourceType}`);
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('sourceType', sourceType);
  
  try {
    const response = await axios.post(`${BASE_URL}${UPLOAD_ENDPOINT}`, form, {
      headers: {
        ...form.getHeaders()
      }
    });
    
    log(`Upload successful. File ID: ${response.data.fileId}`);
    return response.data.fileId;
  } catch (error) {
    log(`Error uploading file: ${error.message}`);
    if (error.response) {
      log(`Response status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Convert a workflow
const convertWorkflow = async (fileId, sourcePlatform, targetPlatform, enableBypass = false) => {
  log(`Converting workflow. File ID: ${fileId}, Source: ${sourcePlatform}, Target: ${targetPlatform}, Bypass: ${enableBypass}`);
  
  try {
    const response = await axios.post(`${BASE_URL}${API_ENDPOINT}`, {
      fileId,
      sourcePlatform,
      targetPlatform,
      options: {
        bypassModuleAvailabilityChecks: enableBypass,
      },
    });
    
    log(`Conversion successful. Result: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    log(`Error converting workflow: ${error.message}`);
    if (error.response) {
      log(`Response status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Direct API test for frontend checking of conversion
const testDirectAPICall = async (workflow, sourcePlatform, targetPlatform, enableBypass = false) => {
  log(`\n=== Testing direct API call with ${sourcePlatform} workflow ===`);
  log(`Bypass flag: ${enableBypass}`);
  
  try {
    const response = await axios.post(`${BASE_URL}${API_ENDPOINT}/direct`, {
      workflow,
      sourcePlatform,
      targetPlatform,
      options: {
        bypassModuleAvailabilityChecks: enableBypass,
      },
    });
    
    log(`Direct API call successful. Result: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    log(`Error in direct API call: ${error.message}`);
    if (error.response) {
      log(`Response status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Check feature flag status
const checkFeatureFlag = async () => {
  log('\n=== Checking feature flag status ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/feature-flags`);
    
    log(`Feature flags: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    log(`Error checking feature flags: ${error.message}`);
    if (error.response) {
      log(`Response status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Set feature flag
const setFeatureFlag = async (flagName, value) => {
  log(`\n=== Setting feature flag ${flagName} to ${value} ===`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/feature-flags`, {
      flagName,
      value,
    });
    
    log(`Feature flag set: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    log(`Error setting feature flag: ${error.message}`);
    if (error.response) {
      log(`Response status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Create a curl command for testing
const createCurlCommand = (filePath, sourcePlatform, targetPlatform, enableBypass = false) => {
  const fileContent = JSON.stringify(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  
  const command = `curl -X POST ${BASE_URL}/api/convert/direct \\
  -H "Content-Type: application/json" \\
  -d '{"workflow": ${fileContent}, "sourcePlatform": "${sourcePlatform}", "targetPlatform": "${targetPlatform}", "options": {"bypassModuleAvailabilityChecks": ${enableBypass}}}'`;
  
  const scriptPath = path.join(__dirname, `curl-test-${sourcePlatform}-to-${targetPlatform}.sh`);
  fs.writeFileSync(scriptPath, command);
  fs.chmodSync(scriptPath, '755');
  
  log(`Created curl command script at ${scriptPath}`);
  return scriptPath;
};

// Main function
const main = async () => {
  log('Starting API Test Script');
  log(`Date: ${new Date().toISOString()}`);
  log(`Base URL: ${BASE_URL}`);
  
  try {
    // Create test files
    const { n8nFilePath, makeFilePath } = createTestFiles();
    
    // Create curl commands for manual testing
    createCurlCommand(n8nFilePath, 'n8n', 'make', true);
    createCurlCommand(makeFilePath, 'make', 'n8n', true);
    
    // We'll try API tests if available
    try {
      // Check current feature flag status
      await checkFeatureFlag();
      
      // Enable feature flag
      await setFeatureFlag('enableFullConversionInDevMode', true);
      
      // Test n8n to Make conversion with file upload
      log('\n=== Testing n8n to Make conversion with file upload ===');
      const n8nFileId = await uploadFile(n8nFilePath, 'n8n');
      const n8nToMakeResult = await convertWorkflow(n8nFileId, 'n8n', 'make', true);
      
      // Test Make to n8n conversion with file upload
      log('\n=== Testing Make to n8n conversion with file upload ===');
      const makeFileId = await uploadFile(makeFilePath, 'make');
      const makeToN8nResult = await convertWorkflow(makeFileId, 'make', 'n8n', true);
      
      // Direct API tests (no upload)
      await testDirectAPICall(
        JSON.parse(fs.readFileSync(n8nFilePath, 'utf8')),
        'n8n',
        'make',
        true
      );
      
      await testDirectAPICall(
        JSON.parse(fs.readFileSync(makeFilePath, 'utf8')),
        'make',
        'n8n',
        true
      );
      
      // Disable feature flag
      await setFeatureFlag('enableFullConversionInDevMode', false);
      
      // Verify flag was disabled
      await checkFeatureFlag();
    } catch (error) {
      log(`API testing failed: ${error.message}`);
      log('You can use the generated curl scripts for manual testing instead.');
    }
    
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