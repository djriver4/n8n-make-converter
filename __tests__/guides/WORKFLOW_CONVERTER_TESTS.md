# Workflow Converter Test Guide

This guide provides detailed information on working with the workflow converter tests in the n8n-make-converter project, focusing on the specific tests that verify the conversion between n8n and Make.com formats.

## Overview

The workflow converter is a core component of the n8n-make-converter project, responsible for translating workflows between n8n and Make.com platforms. The tests for this component ensure that:

1. Nodes are correctly mapped between platforms
2. Parameters are properly converted
3. Expressions are transformed correctly
4. Workflow structure is preserved
5. Error handling is robust

## Key Test Files

### Integration Tests

- `__tests__/integration/workflow-converter.test.ts`: Tests for the `WorkflowConverter` class, focusing on the conversion methods.
- `__tests__/integration/workflow-conversion.test.ts`: Tests for full workflow conversion between platforms.
- `__tests__/integration/workflow-converter-e2e.test.ts`: End-to-end tests for the complete conversion process.

### Unit Tests

- `__tests__/unit/converters/parameter-processor.test.ts`: Tests for parameter conversion, including expressions.
- `__tests__/unit/converters/make-to-n8n.test.ts`: Tests for Make.com to n8n conversion.
- `__tests__/unit/converters/n8n-to-make.test.ts`: Tests for n8n to Make.com conversion.
- `__tests__/unit/node-mappings/node-mapper.test.ts`: Tests for the node mapping system.

## Running the Tests

To run only the workflow converter tests:

```bash
# Run the workflow converter integration tests
npm test __tests__/integration/workflow-converter.test.ts

# Run with verbose output to see detailed logs
npm test __tests__/integration/workflow-converter.test.ts -- --verbose

# Run specific tests by matching the test description
npm test __tests__/integration/workflow-converter.test.ts -- -t "should evaluate expressions"
```

## Common Test Issues and Solutions

### 1. HTTP Node Mapping Issues

The HTTP node is one of the most common nodes used in tests. Issues with HTTP node mapping typically involve:

- **URL parameter case sensitivity**: Make.com uses `URL` (uppercase) while n8n uses `url` (lowercase)
- **Parameter mismatch**: Different parameter structures between platforms
- **Missing mappings**: No mapping defined for HTTP modules

**Solution**: 
- Ensure the NodeMapper properly handles URL case conversion
- Add default fallback for HTTP modules in `convertMakeModuleToN8nNode`
- Use the NodeParameterProcessor to correctly convert parameters

### 2. Expression Evaluation Issues

Tests involving expression evaluation often fail because of:

- **Expression format differences**: `{{1.id}}` (Make) vs `={{ $json.id }}` (n8n)
- **Context not provided**: Missing context for expression evaluation
- **Transformation errors**: Errors in the expression transformation logic

**Solution**:
- Use the correct regular expressions for transformation (e.g., `/(\d+)\.(\w+)/g` to match numeric references)
- Ensure expression context is provided via options
- Use the NodeParameterProcessor for parameter conversions

### 3. Parameter Mapping Issues

Issues with parameter mapping include:

- **Missing parameterMappings**: The `parameterMappings` property is undefined
- **Type errors**: TypeScript type errors related to parameter types
- **Nested parameter access**: Issues accessing deeply nested parameters

**Solution**:
- Check if `parameterMappings` exists before using it
- Use proper TypeScript interfaces
- Use `getNestedValue` and `setNestedValue` for deep parameter access

## Test Data Overview

### Sample n8n Workflow

The n8n workflow test fixtures typically include:

- HTTP Request nodes
- Set nodes for variable manipulation
- Trigger nodes (manual, webhook)
- Various other node types

### Sample Make.com Workflow

The Make.com workflow test fixtures typically include:

- HTTP modules
- Router modules
- Set variable modules
- Various other module types

## How to Update Tests After Code Changes

When making changes to the workflow converter code, you may need to update tests:

1. **Check test expectations**: Ensure the test expectations match the new behavior
2. **Update mock data**: If you've changed the structure of objects, update the mocks
3. **Consider regression tests**: Update expected outputs in regression tests
4. **Add new tests**: For new features or edge cases

## Testing Expression Conversion

Expression conversion is a critical part of the workflow converter. Here's how to test it:

1. **Create a test workflow** with expressions in parameters
2. **Set up an expression context** with test data
3. **Convert the workflow** with `evaluateExpressions: true`
4. **Verify** that expressions are correctly transformed and evaluated

Example test for expression conversion:

```typescript
it('should evaluate expressions during conversion', async () => {
  // Create a test workflow with expressions
  const makeWorkflow = {
    name: 'Test Workflow',
    flow: [{
      id: '1',
      name: 'HTTP',
      type: 'http',
      parameters: {
        URL: '{{1.id}}', // Make.com expression format
      }
    }]
  };
  
  // Set up expression context
  const expressionContext = {
    $json: {
      id: 'https://example.com/api/12345'
    }
  };
  
  // Convert with expression evaluation enabled
  const result = converter.convertMakeToN8n(makeWorkflow, {
    evaluateExpressions: true,
    expressionContext
  });
  
  // Verify conversion result
  expect(result.convertedWorkflow.nodes[0].parameters.url)
    .toMatch(/={{\s*(\$json|\$\$node\["json"\])\.id\s*}}/);
});
```

## Advanced Testing Topics

### Testing Error Handling

To test error handling, create test cases with invalid input:

```typescript
it('should handle invalid workflow gracefully', async () => {
  const invalidWorkflow = { /* missing required properties */ };
  const result = converter.convertMakeToN8n(invalidWorkflow);
  
  expect(result.logs).toContainEqual({
    type: 'error',
    message: expect.stringContaining('Invalid')
  });
});
```

### Testing Edge Cases

Important edge cases to test include:

- Empty workflows
- Workflows with circular references
- Very large workflows
- Workflows with unsupported node types
- Workflows with complex expressions

### Performance Testing

For performance testing, use the benchmark tests:

```bash
# Run benchmark tests
npm test __tests__/benchmarks/
```

## Debugging Failed Tests

When a test fails, check:

1. **Test output**: Look for error messages in the test output
2. **Debug logs**: Enable debug logs with console statements
3. **Actual vs Expected**: Compare the actual and expected values
4. **Code changes**: Review recent code changes that might affect the test

## Additional Resources

- Jest documentation: https://jestjs.io/docs/getting-started
- n8n API documentation: https://docs.n8n.io/api/
- Make.com API documentation: https://www.make.com/en/api-documentation 