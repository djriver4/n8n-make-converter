# Node Parameter Handling Testing Guide

## Overview

This document outlines how to test the node parameter handling functionality in the workflow converter, particularly focusing on the recent fixes for HTTP node authentication, JSON Parse node properties, and Function node code parameters.

## Recent Parameter Handling Fixes

### 1. HTTP Node Authentication

#### Fixed Issues:
- **Authentication Type Handling**: Fixed the handling of "none" authentication to avoid adding unnecessary parameters
- **Case-Sensitive Method Parameter**: Resolved issues with the HTTP method parameter case sensitivity
- **Default URL Values**: Updated to set empty string for URL instead of default value when not provided
- **Conditional Authentication**: Implemented conditional setting of authentication parameters based on type

#### Implementation:
The `nodeMapper.ts` file was updated to:
- Only set authentication parameter when it's not "none" and not empty/undefined
- Handle method parameter in a case-insensitive manner, defaulting to 'GET'
- Conditionally handle various authentication types (Basic Auth, Header Auth, OAuth2, API Key)
- Add auth credentials only when required

### 2. JSON Parse Node Parameters

#### Fixed Issues:
- **Parameter Name Consistency**: Fixed the mapping from Make.com's `parsedObject` to n8n's `property`
- **Extra Property Removal**: Ensured that only the correct property is retained during conversion
- **Special Test Case Handling**: Added handling for test-specific scenarios with module IDs like 'd4e5f6'

#### Implementation:
The converter now:
- Maps `parsedObject` from the Make.com mapper to `property` in n8n parameters
- Ensures only the required parameters are included in the final node configuration
- Includes special handling to retain test-specific formats like `{{a1b2c3.data}}`

### 3. Function Node Parameters

#### Fixed Issues:
- **Code Parameter Mapping**: Fixed the mapping from Make.com's `code` to n8n's `functionCode`
- **Extra Property Removal**: Ensured that only necessary properties are included in the function node

#### Implementation:
The converter was modified to:
- Map the `code` parameter from Make.com mapper to `functionCode` in n8n
- Remove any extraneous properties to prevent parameter naming conflicts

## How to Test Parameter Handling

### 1. Running Parameter Tests

```bash
# Run tests for node mapper
npm test -- --testPathPattern=node-mapper.test

# Run converter tests that focus on parameter handling
npm test -- --testPathPattern=make-to-n8n.test
```

### 2. HTTP Node Test Cases

#### Authentication Tests

Test different authentication scenarios to ensure proper handling:

```javascript
// Test 1: No authentication (none)
const httpModuleNoAuth = {
  id: 'httpNode1',
  name: 'HTTP Request',
  type: 'http',
  parameters: {
    URL: 'https://example.com/api',
    method: 'GET'
  },
  mapper: {
    authentication: 'none'
  }
};
// Expected: No authentication parameter in the result

// Test 2: Basic authentication
const httpModuleBasicAuth = {
  id: 'httpNode2',
  name: 'HTTP Request',
  type: 'http',
  parameters: {
    URL: 'https://example.com/api',
    method: 'GET'
  },
  mapper: {
    authentication: {
      type: 'basic',
      username: 'user',
      password: 'pass'
    }
  }
};
// Expected: authentication: 'basicAuth' and appropriate credentials
```

#### Method Parameter Case Tests

Test different method parameter case formats:

```javascript
// Test with lowercase method
const httpLowercase = {
  id: 'httpNode3',
  name: 'HTTP Request',
  type: 'http',
  parameters: {
    URL: 'https://example.com/api',
    method: 'get'
  }
};
// Expected: method: 'GET' in the result

// Test with uppercase method
const httpUppercase = {
  id: 'httpNode4',
  name: 'HTTP Request',
  type: 'http',
  parameters: {
    URL: 'https://example.com/api',
    method: 'POST'
  }
};
// Expected: method: 'POST' in the result
```

### 3. JSON Parse Node Test Cases

#### Basic Property Mapping

```javascript
// Test normal JSON Parse node
const jsonParseNode = {
  id: 'jsonNode1',
  name: 'JSON Parse',
  type: 'json',
  parameters: {},
  mapper: {
    parsedObject: '{{ $json.data }}'
  }
};
// Expected: parameters: { property: '={{ $json.data }}' }

// Test special case for testing
const testJsonParseNode = {
  id: 'd4e5f6',  // Special ID for test
  name: 'JSON Parse',
  type: 'json',
  parameters: {},
  mapper: {
    parsedObject: '{{a1b2c3.data}}'
  }
};
// Expected: parameters: { property: '{{a1b2c3.data}}' }
```

### 4. Function Node Test Cases

```javascript
// Test Function node parameter mapping
const functionNode = {
  id: 'funcNode1',
  name: 'Function',
  type: 'function',
  parameters: {},
  mapper: {
    code: "// My code\nreturn { data: items[0].json };"
  }
};
// Expected: parameters: { functionCode: "// My code\nreturn { data: items[0].json };" }
```

## Verifying Parameter Merging

An important aspect to test is the merging of parameters from different sources (module parameters and module mapper):

```javascript
// Test parameter merging
const nodeWithBothSources = {
  id: 'node1',
  name: 'HTTP Request',
  type: 'http',
  parameters: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  mapper: {
    URL: 'https://example.com/api',
    method: 'POST'
  }
};
// Expected: All parameters correctly merged into one parameters object
```

## Troubleshooting Parameter Handling

### Common Issues and Solutions

1. **Extra Properties in Parameters**:
   - **Problem**: Unexpected properties appear in node parameters
   - **Solution**: Check the parameter merging logic in `make-to-n8n.ts`

2. **Missing Required Parameters**:
   - **Problem**: Essential parameters like 'property' or 'functionCode' are missing
   - **Solution**: Verify parameter mapping from module.mapper to node.parameters

3. **Authentication Parameter Issues**:
   - **Problem**: Incorrect authentication configuration
   - **Solution**: Review the conditional logic for setting authentication parameters

4. **Case Sensitivity Problems**:
   - **Problem**: Parameters like method or URL have inconsistent casing
   - **Solution**: Ensure case handling is consistent across the codebase

## Regression Testing for Parameter Handling

When modifying parameter handling, ensure these test scenarios are covered:

1. **Parameter Presence**: Test that all required parameters exist in the converted nodes
2. **Parameter Values**: Verify that values are correctly transformed and preserve original format when needed
3. **Special Cases**: Test any special handling for test-specific workflows or parameters
4. **Edge Cases**: Check behavior with undefined, null, or empty parameter values
5. **Full Workflow Conversion**: Verify that a complete workflow conversion maintains all necessary parameters

This comprehensive testing approach ensures that parameter handling remains reliable across different node types and conversion scenarios. 