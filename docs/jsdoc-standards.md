# JSDoc Documentation Standards

This document outlines the standards for JSDoc documentation in the n8n-Make Converter project. Consistent documentation improves code readability, maintainability, and helps new contributors understand the codebase more quickly.

## General Guidelines

- Document all public APIs, classes, interfaces, and methods
- Use clear, concise language
- Include examples for complex functionality
- Keep documentation updated when code changes
- Use TypeScript types instead of JSDoc types where possible

## File Headers

Every file should include a header comment that describes its purpose:

```typescript
/**
 * @file workflow-converter.ts
 * @description Converts workflows between n8n and Make.com formats
 * @module workflow-converter
 */
```

## Class Documentation

Classes should be documented with a description and appropriate tags:

```typescript
/**
 * Converts workflows between n8n and Make.com formats
 * 
 * This class orchestrates the workflow conversion process by mapping nodes,
 * processing parameters, and handling connections between nodes.
 * 
 * @class
 * @example
 * const converter = new WorkflowConverter(mappingDatabase);
 * const result = converter.convertN8nToMake(n8nWorkflow);
 */
export class WorkflowConverter {
  // Class implementation
}
```

## Method Documentation

Methods should include descriptions, parameter information, return types, and examples:

```typescript
/**
 * Converts an n8n workflow to Make.com format
 * 
 * This method transforms nodes, maps parameters, and preserves connections
 * to create an equivalent Make.com workflow.
 * 
 * @param {N8nWorkflow} n8nWorkflow - The n8n workflow to convert
 * @param {ConversionOptions} [options={}] - Options for the conversion process
 * @returns {ConversionResult} The conversion result with the Make.com workflow and logs
 * @throws {ValidationError} When the input workflow is invalid
 * @example
 * const result = converter.convertN8nToMake(n8nWorkflow, { debug: true });
 * console.log(result.convertedWorkflow);
 */
convertN8nToMake(n8nWorkflow: N8nWorkflow, options: ConversionOptions = {}): ConversionResult {
  // Method implementation
}
```

## Interface Documentation

Interfaces should be documented with descriptions for the interface and each property:

```typescript
/**
 * Options for workflow conversion
 * 
 * @interface
 */
export interface ConversionOptions {
  /**
   * Whether to evaluate expressions during conversion
   * @default false
   */
  evaluateExpressions?: boolean;
  
  /**
   * Context for expression evaluation
   */
  expressionContext?: ExpressionContext;
  
  /**
   * Whether to skip input validation
   * @default false
   */
  skipValidation?: boolean;
  
  // Other properties
}
```

## Function Documentation

Standalone functions should include descriptions, parameter information, return types, and examples:

```typescript
/**
 * Safely gets a property from an object that might be undefined
 * 
 * @param {T | undefined | null} obj - The object to access
 * @param {K} key - The key to access
 * @param {T[K]} defaultValue - The default value to return if the property is undefined
 * @returns {T[K]} The property value or the default value
 * @template T, K
 * @example
 * const value = safeGet(user, 'name', 'Anonymous');
 */
export function safeGet<T extends object, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue: T[K]
): T[K] {
  return (obj !== undefined && obj !== null && key in obj) ? obj[key] : defaultValue;
}
```

## Type Guards Documentation

Type guards should include descriptions explaining what they check:

```typescript
/**
 * Type guard to check if a workflow is an n8n workflow
 * 
 * Tests if the workflow has the required properties of an n8n workflow.
 * 
 * @param {any} workflow - The workflow to check
 * @returns {boolean} True if the workflow is an n8n workflow
 */
export function isN8nWorkflow(workflow: any): workflow is N8nWorkflow {
  return isDefined(workflow) && 
         Array.isArray(workflow.nodes) && 
         isDefined(workflow.connections);
}
```

## Enum Documentation

Enums should include descriptions for the enum itself and each value:

```typescript
/**
 * Direction of node mapping conversion
 */
enum MappingDirection {
  /**
   * Convert from n8n format to Make.com format
   */
  N8N_TO_MAKE = 'n8n_to_make',
  
  /**
   * Convert from Make.com format to n8n format
   */
  MAKE_TO_N8N = 'make_to_n8n'
}
```

## Common Tags

| Tag | Description | Example |
|-----|-------------|---------|
| `@file` | Describes the current file | `@file workflow-converter.ts` |
| `@module` | Identifies the module | `@module workflow-converter` |
| `@class` | Identifies a class | `@class` |
| `@interface` | Identifies an interface | `@interface` |
| `@enum` | Identifies an enum | `@enum` |
| `@param` | Describes a parameter | `@param {string} name - The name parameter` |
| `@returns` | Describes the return value | `@returns {boolean} True if successful` |
| `@throws` | Describes exceptions | `@throws {Error} When something fails` |
| `@example` | Provides an example | `@example const result = add(1, 2);` |
| `@deprecated` | Indicates deprecated features | `@deprecated Use newFunction() instead` |
| `@since` | Indicates when a feature was added | `@since 1.2.0` |
| `@see` | References other documentation | `@see OtherClass` |
| `@default` | Documents default values | `@default false` |
| `@template` | Documents generic types | `@template T` |

## Documenting Complex Types

For complex types like those with nested objects or unions, prefer TypeScript annotations over JSDoc type annotations:

```typescript
/**
 * Processes a node with possible expressions
 * 
 * @param node The node to process
 * @param context The expression context
 * @returns The processed node
 */
function processNode(
  node: Record<string, any>,
  context: ExpressionContext
): Record<string, any> {
  // Implementation
}
```

## Conclusion

Following these standards will help maintain a consistent, well-documented codebase that is easier to understand and maintain. All contributors should strive to adhere to these guidelines when adding or modifying code. 