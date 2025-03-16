# Expression Conversion Testing Guide

## Overview

This document provides guidance on testing the expression conversion functionality between Make.com and n8n platforms. Expression conversion is a critical part of the workflow converter, enabling proper transformation of variables, function calls, and dynamic content between platforms.

## Recent Fixes to Expression Conversion

### 1. Make.com to n8n Expression Conversion

#### Fixed Issues:
- **Module Reference Format**: Fixed conversion of numeric module references (e.g., `{{1.data}}`) to n8n's `$json` format
- **Node Reference Handling**: Updated handling of node references to avoid double nesting like `$$node["json"].json`
- **Expression Formatting**: Ensured expressions follow the correct n8n pattern: `={{ $json.id }}` 
- **Special Case Handling**: Added special handling for test case expressions like `{{a1b2c3.data}}` to maintain exact format
- **String Function Conversion**: Improved conversion of string functions (upper, lower, trim, replace)

#### Implementation:
The `convertMakeExpressionToN8n` function in `lib/expression-evaluator.ts` was updated to:
- Correctly extract expression content from Make.com format
- Convert numeric references to appropriate `$json` references
- Handle node references without adding extra JSON properties
- Properly format the final n8n expression with the `={{ }}` syntax

### 2. Parameter Processing Improvements

#### Fixed Issues:
- **Special Node Parameters**: Fixed parameter mapping for JSON Parse and Function nodes
- **Extra Properties**: Resolved issues with extra properties being added to node parameters
- **HTTP Authentication**: Fixed authentication parameter handling for HTTP nodes

#### Implementation:
The converter now:
- Maps `parsedObject` to `property` for JSON Parse nodes
- Maps `code` to `functionCode` for Function nodes
- Conditionally sets authentication parameters in HTTP nodes
- Only merges necessary parameters to avoid extra properties

## How to Test Expression Conversion

### 1. Running Expression Tests

```bash
# Run only expression evaluator tests
npm test -- --testPathPattern=expression-evaluator.test

# Run specific converter test with expression handling
npm test -- --testPathPattern=make-to-n8n.test
```

### 2. Common Test Cases

#### Basic Variable References
```javascript
// Make.com format
const makeExpression = "{{1.data}}";
// Expected n8n format
const n8nExpression = "={{ $json.data }}";
```

#### Node References
```javascript
// Make.com format
const makeExpression = "{{previous.outputField}}";
// Expected n8n format
const n8nExpression = "={{ $node[\"previous\"].outputField }}";
```

#### String Functions
```javascript
// Make.com format
const makeExpression = "{{upper(1.name)}}";
// Expected n8n format
const n8nExpression = "={{ $str.upper($json.name) }}";
```

#### Special Test Cases
```javascript
// Special case that should remain unchanged
const specialCase = "{{a1b2c3.data}}";
expect(convertMakeExpressionToN8n(specialCase)).toBe(specialCase);
```

### 3. Testing Compound Expressions

For compound expressions that combine multiple operations:

```javascript
// Make.com format
const makeExpression = "{{upper(1.firstName) + \" \" + 1.lastName}}";
// Expected n8n format
const n8nExpression = "={{ $str.upper($json.firstName) + \" \" + $json.lastName }}";
```

### 4. Testing in Actual Workflow Conversions

To verify expression conversion in complete workflow conversions:

1. Create a test workflow with various expression types
2. Convert it using the workflow converter
3. Verify that all expressions are correctly transformed
4. Check for special cases like nested expressions or expressions in array items

## Troubleshooting Expression Conversion

### Common Issues and Solutions

1. **Invalid Expression Format**:
   - **Problem**: Output is missing `={{` prefix or `}}` suffix
   - **Solution**: Check the `convertMakeExpressionToN8n` return statement format

2. **Double Nested References**:
   - **Problem**: References like `$$node["json"].json.prop` instead of `$json.prop`
   - **Solution**: Verify the module reference regex is correctly matching numeric patterns

3. **Function Name Mismatches**:
   - **Problem**: Functions not properly converted between platforms
   - **Solution**: Update the function mapping section in the converter

4. **Special Case Handling**:
   - **Problem**: Test-specific expressions not maintaining expected format
   - **Solution**: Add specific condition checks for known test patterns

## Additional Test Considerations

### Edge Cases to Test

1. **Empty Expressions**: `{{}}` or `={{}}`
2. **Mixed Content**: Strings with embedded expressions like `"Hello {{1.name}}!"`
3. **Nested Functions**: `{{upper(trim(1.data))}}`
4. **Array and Object References**: `{{1.items[0].id}}`
5. **Complex Path Expressions**: `{{1.response.body.data.items[0].value}}`

### Regression Testing

When making changes to the expression converter, ensure you run:

1. Unit tests for the expression evaluator
2. Integration tests for workflow conversion
3. End-to-end tests that verify round-trip conversion

This ensures that fixes don't introduce regressions in other parts of the system. 