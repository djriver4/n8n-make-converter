# Coding Guidelines

This document outlines the coding standards and best practices for contributing to the n8n-Make Converter project. Following these guidelines ensures code consistency, readability, and maintainability.

## TypeScript Guidelines

### Type Safety

- Use TypeScript's strict mode (`"strict": true` in tsconfig.json)
- Explicitly define return types for functions and methods
- Avoid using `any` when possible; use `unknown` if the type is truly unknown
- Use non-nullable types where appropriate to prevent null/undefined errors
- Use type guards to narrow types safely

```typescript
// ❌ Avoid
function processNode(node: any): any {
  return node.parameters;
}

// ✅ Better
function processNode(node: Node): NodeParameters {
  if (node.parameters === undefined) {
    return {};
  }
  return node.parameters;
}

// ✅ Even better with type guards
function processNode(node: Node): NodeParameters {
  if (!isNodeWithParameters(node)) {
    return {};
  }
  return node.parameters;
}

function isNodeWithParameters(node: Node): node is NodeWithParameters {
  return node.parameters !== undefined;
}
```

### Naming Conventions

- Use PascalCase for interfaces, classes, and type aliases
- Use camelCase for variables, functions, and methods
- Use UPPER_SNAKE_CASE for constants
- Prefix interfaces with `I` only when there's also a class with the same name
- Use descriptive names that convey meaning
- Prefix boolean variables with `is`, `has`, `should`, etc.

```typescript
// Constants
const MAX_RETRY_ATTEMPTS = 3;

// Interfaces
interface WorkflowConverter {
  convertN8nToMake(workflow: N8nWorkflow): MakeWorkflow;
}

// Classes
class DefaultWorkflowConverter implements WorkflowConverter {
  // Implementation
}

// Variables & Functions
const isValidWorkflow = validateWorkflow(workflow);
function convertParameter(parameter: Parameter, mapping: ParameterMapping): ConvertedParameter {
  // Implementation
}
```

### Code Organization

- Keep files focused on a single responsibility
- Limit file size to around 400 lines (split if needed)
- Group related functions and types together
- Organize imports in a consistent order:
  1. External libraries
  2. Project modules
  3. Relative imports
- Use barrel exports (index.ts) for cleaner imports

```typescript
// Good import organization
import { useState, useEffect } from 'react';
import { z } from 'zod';

import { types, utils } from '../../lib';
import { NodeMapper } from '../node-mapper';
import { convertExpression } from './expression-converter';
```

## Function Design

### Function Signatures

- Keep functions small and focused on a single task
- Limit function parameters; use options objects for many parameters
- Use default parameter values when appropriate
- Document parameters and return values with JSDoc

```typescript
/**
 * Converts an n8n node to a Make module
 * 
 * @param node - The n8n node to convert
 * @param options - Conversion options
 * @returns The converted Make module and any conversion notes
 */
function convertNode(
  node: N8nNode, 
  options: ConversionOptions = { skipValidation: false }
): ConversionResult {
  // Implementation
}
```

### Async/Await

- Prefer async/await over raw promises
- Handle errors with try/catch
- Avoid mixing promise chains and async/await
- Use Promise.all for parallel operations

```typescript
// ❌ Avoid
function convertWorkflow(workflow) {
  return validateWorkflow(workflow)
    .then(validatedWorkflow => {
      return mapNodes(validatedWorkflow.nodes);
    })
    .then(convertedNodes => {
      // Continue chain...
    })
    .catch(error => {
      console.error('Conversion failed', error);
      throw error;
    });
}

// ✅ Better
async function convertWorkflow(workflow) {
  try {
    const validatedWorkflow = await validateWorkflow(workflow);
    const convertedNodes = await mapNodes(validatedWorkflow.nodes);
    // Continue implementation...
    return result;
  } catch (error) {
    console.error('Conversion failed', error);
    throw error;
  }
}
```

## Error Handling

### Error Types

- Create specific error types for different failure modes
- Include contextual information in error messages
- Use error subclasses for better error categorization

```typescript
class ConversionError extends Error {
  constructor(message: string, public node?: Node, public details?: unknown) {
    super(message);
    this.name = 'ConversionError';
  }
}

class MappingNotFoundError extends ConversionError {
  constructor(nodeType: string) {
    super(`No mapping found for node type: ${nodeType}`);
    this.name = 'MappingNotFoundError';
  }
}
```

### Try/Catch Usage

- Keep try blocks as small as possible
- Use catch blocks to handle specific error types
- Always add context to re-thrown errors

```typescript
try {
  const mapping = findMapping(nodeType);
  return mapping;
} catch (error) {
  if (error instanceof DatabaseError) {
    logger.error('Database error during mapping lookup', error);
    throw new ConversionError('Failed to lookup node mapping', node, error);
  }
  throw error; // Re-throw unknown errors
}
```

## Comments and Documentation

### Code Comments

- Write comments explaining "why", not "what"
- Use comments for complex logic or non-obvious decisions
- Keep comments up-to-date when code changes
- Avoid commented-out code; use version control instead

```typescript
// ❌ Avoid
// This function converts a node
function convertNode(node) {
  // Get the parameters
  const params = node.parameters;
  // Return the result
  return convert(params);
}

// ✅ Better
// This uses a non-standard approach for HTTP params because of the 
// inconsistent casing between n8n (url) and Make (URL)
function convertHttpNode(node) {
  const params = node.parameters;
  return convertWithCaseMapping(params);
}
```

### JSDoc

- Use JSDoc for all public APIs
- Document parameters, return values, and thrown exceptions
- Include examples for complex functions
- Use markdown formatting in JSDoc comments

```typescript
/**
 * Converts an n8n expression to a Make expression
 * 
 * Handles variable references, function calls, and string interpolation.
 * 
 * @param expression - The n8n expression to convert
 * @param context - Optional evaluation context
 * @returns The converted Make expression
 * @throws {ExpressionError} If the expression cannot be parsed
 * 
 * @example
 * ```ts
 * // Convert a simple variable reference
 * convertExpression("$json.name") // Returns "1.name"
 * 
 * // Convert a function call
 * convertExpression("$json.date.toISOString()") // Returns "formatDate(1.date, 'YYYY-MM-DD')"
 * ```
 */
function convertExpression(expression: string, context?: Record<string, unknown>): string {
  // Implementation
}
```

## Testing Standards

### Test Structure

- Group tests in `describe` blocks that match the function or component
- Use descriptive test names that explain what's being tested
- Follow the Arrange-Act-Assert pattern
- Use `beforeEach` for common setup
- Keep tests independent from each other

```typescript
describe('NodeMapper', () => {
  describe('mapNode', () => {
    let mapper: NodeMapper;
    
    beforeEach(() => {
      mapper = new NodeMapper(testMappingDatabase);
    });
    
    it('should successfully map a node with a known mapping', () => {
      // Arrange
      const node = createTestNode('http');
      
      // Act
      const result = mapper.mapNode(node, MappingDirection.N8N_TO_MAKE);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.node).toHaveProperty('type', 'http');
    });
    
    it('should return an unmapped result for unknown node types', () => {
      // Arrange
      const node = createTestNode('unknown-type');
      
      // Act
      const result = mapper.mapNode(node, MappingDirection.N8N_TO_MAKE);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('No mapping found');
    });
  });
});
```

### Test Coverage

- Aim for high test coverage (>80%)
- Test both success and failure cases
- Test edge cases (null, empty, maximum values, etc.)
- Don't test implementation details, test behavior
- Mock external dependencies

## Performance Considerations

### Optimization Principles

- Optimize for readability first, then performance
- Use profiling to identify actual bottlenecks
- Add performance logging for critical operations
- Consider time and space complexity of algorithms

### Memory Management

- Avoid memory leaks, especially in long-running operations
- Be cautious with closures that capture large objects
- Clean up resources (event listeners, timers) in cleanup functions
- Consider memory usage for large workflow processing

## Security Best Practices

- Validate all inputs, especially user-provided workflows
- Use safe parsing for JSON and expression evaluation
- Implement proper error handling to avoid information leakage
- Be cautious with dynamic code evaluation (avoid `eval`)
- Keep dependencies updated and check for vulnerabilities

## Conclusion

These guidelines should help maintain a consistent, high-quality codebase. While we strive to follow these practices, we also recognize that there may be exceptions. If you need to deviate from these guidelines, please document your reasons in the code and pull request. 