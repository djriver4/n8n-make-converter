#!/usr/bin/env node

/**
 * Simple script to test the bypass flag
 */

// Import the converter functions
const { convertN8nToMake, convertMakeToN8n } = require('../lib/workflow-converter');
const fs = require('fs');
const path = require('path');

// Set NODE_ENV to development
process.env.NODE_ENV = 'development';
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Create a simple n8n workflow with an unsupported node
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

// Create a simple Make workflow with an unsupported module
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

// Test n8n to Make conversion with bypass flag
console.log('\n=== Testing n8n to Make conversion with bypass flag ===');
const n8nToMakeResult = convertN8nToMake(n8nWorkflow, {
  bypassModuleAvailabilityChecks: true,
  skipValidation: true
});

// Save the result
fs.writeFileSync(
  path.join(__dirname, 'test-bypass-n8n-to-make.json'),
  JSON.stringify(n8nToMakeResult, null, 2)
);

// Check for bypass message in logs
const n8nBypassLog = n8nToMakeResult.logs.find(log => 
  log.message && log.message.includes('Bypassing module availability checks')
);

if (n8nBypassLog) {
  console.log(`\n✅ BYPASS MODE DETECTED in n8n to Make conversion: "${n8nBypassLog.message}"`);
} else {
  console.log('\n❌ BYPASS MODE NOT DETECTED in n8n to Make conversion logs');
}

// Test Make to n8n conversion with bypass flag
console.log('\n=== Testing Make to n8n conversion with bypass flag ===');
const makeToN8nResult = convertMakeToN8n(makeWorkflow, {
  bypassModuleAvailabilityChecks: true,
  skipValidation: true
});

// Save the result
fs.writeFileSync(
  path.join(__dirname, 'test-bypass-make-to-n8n.json'),
  JSON.stringify(makeToN8nResult, null, 2)
);

// Check for bypass message in logs
const makeBypassLog = makeToN8nResult.logs.find(log => 
  log.message && log.message.includes('Bypassing module availability checks')
);

if (makeBypassLog) {
  console.log(`\n✅ BYPASS MODE DETECTED in Make to n8n conversion: "${makeBypassLog.message}"`);
} else {
  console.log('\n❌ BYPASS MODE NOT DETECTED in Make to n8n conversion logs');
}

// Print all logs
console.log('\n=== All logs from n8n to Make conversion ===');
n8nToMakeResult.logs.forEach(log => {
  console.log(`[${log.type}] ${log.message}`);
});

console.log('\n=== All logs from Make to n8n conversion ===');
makeToN8nResult.logs.forEach(log => {
  console.log(`[${log.type}] ${log.message}`);
}); 