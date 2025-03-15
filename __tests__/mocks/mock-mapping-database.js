/**
 * Mock Node Mapping Database for Testing
 * 
 * This file provides a consistent mapping database that can be used across all tests.
 * It includes mappings in both directions (n8n to Make and Make to n8n) with proper
 * parameter mappings and case sensitivity handling.
 */

const mockMappingDatabase = {
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
  mappings: {
    // n8n to Make mappings
    "httpRequest": {
      source: "n8n",
      sourceNodeType: "n8n-nodes-base.httpRequest",
      targetNodeType: "http",
      metadata: {
        displayName: "HTTP Request",
        description: "Make HTTP requests",
        version: "1.0",
      },
      parameterMappings: {
        url: {
          sourcePath: "url",
          targetPath: "URL"  // Note the uppercase URL for Make.com
        },
        method: {
          sourcePath: "method",
          targetPath: "method"
        },
        headers: {
          sourcePath: "headers",
          targetPath: "headers"
        },
        authentication: {
          sourcePath: "authentication",
          targetPath: "authentication"
        }
      }
    },
    "set": {
      source: "n8n",
      sourceNodeType: "n8n-nodes-base.set",
      targetNodeType: "setVariable",
      metadata: {
        displayName: "Set Variable",
        description: "Set variables",
        version: "1.0",
      },
      parameterMappings: {
        values: {
          sourcePath: "values",
          targetPath: "variables"
        }
      }
    },
    "manualTrigger": {
      source: "n8n",
      sourceNodeType: "n8n-nodes-base.manualTrigger",
      targetNodeType: "scheduler",
      metadata: {
        displayName: "Scheduler",
        description: "Schedule workflow execution",
        version: "1.0",
      },
      parameterMappings: {}
    },
    
    // Make to n8n mappings
    "http": {
      source: "make",
      sourceNodeType: "http",
      targetNodeType: "n8n-nodes-base.httpRequest",
      metadata: {
        displayName: "HTTP Request",
        description: "Make HTTP requests",
        version: "1.0",
      },
      parameterMappings: {
        URL: {  // Note the uppercase URL from Make.com
          sourcePath: "URL",
          targetPath: "url"  // lowercase url for n8n
        },
        url: {  // Alternative lowercase mapping for flexibility
          sourcePath: "url",
          targetPath: "url"
        },
        method: {
          sourcePath: "method",
          targetPath: "method"
        },
        headers: {
          sourcePath: "headers",
          targetPath: "headers"
        }
      }
    },
    "scheduler": {
      source: "make",
      sourceNodeType: "scheduler",
      targetNodeType: "n8n-nodes-base.manualTrigger",
      metadata: {
        displayName: "Manual Trigger",
        description: "Trigger a workflow manually",
        version: "1.0",
      },
      parameterMappings: {}
    },
    "setVariable": {
      source: "make",
      sourceNodeType: "setVariable", 
      targetNodeType: "n8n-nodes-base.set",
      metadata: {
        displayName: "Set",
        description: "Set variables in n8n",
        version: "1.0",
      },
      parameterMappings: {
        variables: {
          sourcePath: "variables",
          targetPath: "values"
        }
      }
    },
    "json": {
      source: "make",
      sourceNodeType: "json",
      targetNodeType: "n8n-nodes-base.json",
      metadata: {
        displayName: "JSON",
        description: "Work with JSON data",
        version: "1.0",
      },
      parameterMappings: {}
    },
    "placeholder": {
      source: "both",
      sourceNodeType: "placeholder",
      targetNodeType: "placeholder",
      metadata: {
        displayName: "Placeholder",
        description: "Placeholder for unmapped nodes",
        version: "1.0",
      },
      parameterMappings: {}
    }
  }
};

module.exports = mockMappingDatabase; 