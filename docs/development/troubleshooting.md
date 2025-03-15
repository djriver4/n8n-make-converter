# Troubleshooting Guide

This guide addresses common issues that developers and users might encounter when working with the n8n-Make Converter, along with solutions and workarounds.

## Common Conversion Issues

### Missing Node Mappings

**Issue:** The conversion fails with messages about missing node mappings.

**Error:** `No mapping found for node type: [node-type-name]`

**Solution:**
1. Check if the node type is supported in the latest version (see [Implementation Status](../implementation/status.md))
2. For unsupported nodes, consider:
   - Creating a custom node mapping (see [Contributing Guide](./contributing.md))
   - Using a supported alternative node in your original workflow
   - Filing an issue to request support for the node type

### Expression Conversion Failures

**Issue:** Expressions fail to convert correctly between platforms.

**Symptoms:** 
- Converted workflow has `[ERROR]` placeholders in expressions
- Parameters contain malformed expressions

**Solution:**
1. Check if your expressions use supported syntax
2. For complex expressions:
   - Break them down into simpler parts
   - Use intermediate variables to store partial results
   - Consider using built-in functions of the target platform instead

### String Concatenation Issues

**Issue:** String concatenation expressions (e.g., `{{ "prefix" + variable }}`) don't work as expected.

**Solution:**
1. Ensure you're using the latest version of the converter
2. For n8n expressions, use proper syntax: `={{ "prefix" + $json.variable }}`
3. For Make expressions, use string interpolation: `{{1.variable}}`
4. If still having issues, try alternative approaches:
   - Use string interpolation instead of concatenation
   - Split complex concatenations into multiple simpler operations

## Development Issues

### TypeScript Compilation Errors

**Issue:** TypeScript errors when building from source.

**Common Errors:**
- `Property 'X' does not exist on type 'Y'`
- `Type 'X' is not assignable to type 'Y'`
- `Cannot find name 'X'`

**Solution:**
1. Ensure you have TypeScript 4.9+ installed
2. Run `npm install` to ensure all dependencies are installed
3. Check for type mismatches between interfaces and implementations
4. Use proper type assertions and type guards:

```typescript
// Common type assertion pattern for handling uncertain types
const result = someFunction() as unknown as ExpectedType;

// Type guard example
function isNodeWithParameters(node: Node): node is NodeWithParameters {
  return 'parameters' in node && node.parameters !== undefined;
}
```

### Test Failures

**Issue:** Tests fail with various errors.

**Common Test Failures:**
- Expression evaluation errors
- Log message assertion failures
- Parameter structure mismatches
- Type errors in tests

**Solution:**
1. Check [Testing Guide](./testing.md) for common test issues and solutions
2. Ensure your test expectations match the actual implementation:
   ```typescript
   // More flexible log assertions
   expect(result.logs.some(log => log.message.includes('Conversion complete'))).toBe(true);
   
   // Use optional chaining for potentially undefined properties
   expect(result.node.parameters?.URL).toBe('https://example.com');
   ```
3. Update test fixtures if interface definitions have changed
4. Run specific failing tests with more detailed output:
   ```bash
   npm test -- -t "should convert expressions" --verbose
   ```

### Null and Undefined Errors

**Issue:** Runtime errors related to null or undefined values.

**Solution:**
1. Use optional chaining (`?.`) when accessing potentially undefined properties:
   ```typescript
   // Before
   const value = obj.prop.nested; // Error if obj.prop is undefined
   
   // After
   const value = obj.prop?.nested; // Safely returns undefined if obj.prop is undefined
   ```

2. Use nullish coalescing (`??`) for default values:
   ```typescript
   // Before
   const value = obj.prop || defaultValue; // Uses defaultValue if obj.prop is falsy (0, '', false, etc.)
   
   // After
   const value = obj.prop ?? defaultValue; // Uses defaultValue only if obj.prop is null or undefined
   ```

3. Add explicit null checks for critical code paths:
   ```typescript
   if (node === null || node === undefined) {
     return createDefaultNode();
   }
   ```

4. Use type guards to narrow types safely:
   ```typescript
   if (typeof value === 'string') {
     // TypeScript knows value is a string here
     return value.toUpperCase();
   }
   ```

## API Usage Issues

### Authentication Problems

**Issue:** API authentication failures.

**Solution:**
1. Verify API key format and validity
2. Check that your credentials have the correct permissions
3. Ensure your API requests include proper headers and authentication

### Rate Limiting

**Issue:** Hitting API rate limits.

**Solution:**
1. Implement exponential backoff and retry logic
2. Batch multiple small conversions together
3. Cache frequently converted workflows

## Debugging Techniques

### Verbose Logging

For advanced debugging, enable verbose logging:

```typescript
// In code
const converter = new WorkflowConverter({ 
  debug: true,
  logLevel: 'verbose'
});

// Or with environment variables
// DEBUG=n8n-make-converter:* npm run convert
```

### Debugging Conversion Steps

To understand the conversion process better:

```typescript
const converter = new WorkflowConverter({ debug: true });
const result = converter.convertN8nToMake(workflow);

// Examine conversion details
console.log(result.logs); // Conversion logs
console.log(result.unmappedNodes); // Nodes that couldn't be mapped
console.log(result.parametersNeedingReview); // Parameters that might need manual review
console.log(result.debug?.conversionSteps); // If available, shows intermediate steps
```

### Debugger Usage

When debugging locally, use breakpoints and inspect variables:

1. Add a `debugger` statement where you want to pause execution
2. Run with Node.js debugger:
   ```bash
   node --inspect-brk node_modules/.bin/jest -i some.test.js
   ```
3. Connect to the debugger using Chrome DevTools or VS Code

## Common Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| `MAPPING_001` | Node type not found | Check supported nodes or create mapping |
| `EXPR_002` | Expression syntax error | Fix syntax or use simpler expression |
| `VALID_003` | Invalid workflow structure | Check workflow JSON format |
| `PARAM_004` | Parameter conversion failed | Check parameter type compatibility |
| `CONN_005` | Connection mapping failed | Verify connection structure |

## Performance Issues

### Slow Conversion Performance

**Issue:** Converting large workflows causes performance issues.

**Solution:**
1. Enable performance logging to identify bottlenecks:
   ```typescript
   const converter = new WorkflowConverter({
     enablePerformanceLogging: true
   });
   ```
2. Check for expensive operations in loops
3. Consider lazy loading or caching for repeated operations
4. For large workflows, split into smaller sub-workflows

### Memory Usage

**Issue:** High memory usage when processing large workflows.

**Solution:**
1. Release references to large objects when no longer needed
2. Process large arrays in chunks
3. Avoid deep cloning large objects unless necessary
4. Use streams for file operations with large workflows

## Getting Help

If you've tried the solutions above and still have issues:

1. Check the [GitHub issues](https://github.com/your-repo/n8n-make-converter/issues) for similar problems
2. Review the documentation for updates
3. Create a new issue with:
   - Converter version
   - Node.js version
   - Detailed description of the problem
   - Sample workflow (with sensitive data removed)
   - Error messages and logs

## Contributing Solutions

If you find a solution to a common problem, please consider:

1. Adding it to this troubleshooting guide via a pull request
2. Creating an issue with the tag "documentation"
3. Sharing your solution in the project's discussions 