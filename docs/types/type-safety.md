# Type Safety Guidelines

This document provides guidelines and best practices for maintaining type safety in the n8n-Make Converter project. Following these practices will help prevent runtime errors, improve code quality, and enhance developer experience.

## Why Type Safety Matters

Type safety is a cornerstone of the n8n-Make Converter project for several reasons:

1. **Prevents Runtime Errors**: Catching type errors at compile time prevents runtime exceptions
2. **Improves Code Quality**: Types serve as documentation and enforce consistent usage patterns
3. **Enhances Developer Experience**: Better autocompletion, navigation, and refactoring support
4. **Enables Safe Refactoring**: Types help ensure that changes don't break existing functionality
5. **Facilitates Testing**: Well-typed code is easier to test with proper type assertions

## TypeScript Configuration

The project uses strict TypeScript settings to maximize type safety:

```json
// tsconfig.json (simplified)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

These settings ensure that:
- No variables implicitly have the `any` type
- `null` and `undefined` are handled properly
- Functions are checked strictly
- Properties must be initialized in constructors
- Index access is type-safe
- Optional property types are treated correctly

## Type Safety Best Practices

### 1. Avoid `any` Type

The `any` type should be avoided whenever possible as it bypasses type checking:

```typescript
// ❌ Avoid
function processData(data: any): any {
  return data.processedValue;
}

// ✅ Better
function processData<T extends { processedValue: U }, U>(data: T): U {
  return data.processedValue;
}

// ✅ Or use more specific types
function processData(data: Record<string, unknown>): unknown {
  return data.processedValue;
}
```

When receiving data of unknown structure, use the `unknown` type instead of `any`:

```typescript
// ✅ Good practice
function processInput(input: unknown): string {
  if (typeof input === 'string') {
    return input.toUpperCase();
  }
  if (typeof input === 'number') {
    return input.toString();
  }
  throw new Error('Unsupported input type');
}
```

### 2. Use Non-Nullable Return Types

Ensure functions return non-nullable values to prevent null reference errors:

```typescript
// ❌ Avoid
function getNodeParameters(node?: Node): Record<string, any> | undefined {
  if (!node) return undefined;
  return node.parameters;
}

// ✅ Better
function getNodeParameters(node?: Node): Record<string, any> {
  if (!node || !node.parameters) return {};
  return node.parameters;
}
```

### 3. Implement Type Guards

Type guards help narrow types safely and improve IntelliSense:

```typescript
// Type guard for N8nNode
function isN8nNode(node: unknown): node is N8nNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    'id' in node &&
    'type' in node &&
    typeof (node as any).id === 'string' &&
    typeof (node as any).type === 'string'
  );
}

// Usage
function processNode(node: unknown): void {
  if (isN8nNode(node)) {
    // TypeScript knows node is N8nNode here
    console.log(node.type);
  } else {
    console.log('Not a valid n8n node');
  }
}
```

### 4. Use Discriminated Unions

Discriminated unions provide type safety for objects that can have different shapes:

```typescript
// Define a discriminated union for conversion results
type ConversionSuccessResult = {
  success: true;
  convertedWorkflow: MakeWorkflow | N8nWorkflow;
  logs: ConversionLog[];
};

type ConversionErrorResult = {
  success: false;
  error: string;
  logs: ConversionLog[];
};

type ConversionResult = ConversionSuccessResult | ConversionErrorResult;

// Usage
function handleResult(result: ConversionResult): void {
  if (result.success) {
    // TypeScript knows convertedWorkflow exists here
    console.log(result.convertedWorkflow);
  } else {
    // TypeScript knows error exists here
    console.log(result.error);
  }
}
```

### 5. Properly Handle Optional Properties

Use optional chaining and nullish coalescing to safely work with optional properties:

```typescript
// Safe property access
const nodeType = node?.type ?? 'unknown';

// Safe nested property access
const condition = makeModule?.routes?.[0]?.condition;

// Conditional execution
node?.parameters?.url && validateUrl(node.parameters.url);
```

### 6. Use Type Assertions Judiciously

Type assertions should be used sparingly and only when necessary:

```typescript
// ❌ Avoid unnecessary assertions
const node = getNode() as N8nNode;

// ✅ Better - use type guards
const node = getNode();
if (isN8nNode(node)) {
  // Use node safely
}

// When assertions are necessary, use the safer approach
const result = getResult() as unknown as WorkflowConversionResult;
```

### 7. Leverage Generics for Reusable Code

Use generics to create reusable, type-safe functions and classes:

```typescript
// Generic function to safely get a property
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  return obj?.[key];
}

// Generic validation function
function validate<T>(value: T, validator: (value: T) => boolean): T {
  if (!validator(value)) {
    throw new Error(`Invalid value: ${value}`);
  }
  return value;
}
```

### 8. Define Explicit Return Types

Always specify return types for functions, especially public API functions:

```typescript
// ❌ Avoid implicit return types
function convertNode(node) {
  // Implementation...
}

// ✅ Better
function convertNode(node: N8nNode): MakeModule {
  // Implementation...
}
```

### 9. Use Readonly Types for Immutability

Use readonly types to prevent accidental modifications:

```typescript
// Readonly properties
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

// Readonly arrays
function processNodes(nodes: readonly N8nNode[]): void {
  // nodes.push() // Error: Property 'push' does not exist on type 'readonly N8nNode[]'
}
```

### 10. Extend Interfaces Instead of Type Casting

Extend interfaces for specialized types instead of casting:

```typescript
// ❌ Avoid
type HttpNodeParameters = Record<string, any>;

// ✅ Better
interface HttpNodeParameters {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: 'none' | 'basic' | 'bearer';
  [key: string]: any;
}
```

## Advanced Type Safety Techniques

### 1. Template Literal Types

Use template literal types for string patterns:

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Endpoint = `/api/${string}`;
type HttpUrl = `https://${string}`;

// Validate at compile time
function sendRequest(method: HttpMethod, url: HttpUrl): void {
  // Implementation...
}

sendRequest('GET', 'https://example.com/api/data'); // Valid
// sendRequest('POST', 'http://example.com'); // Error: Argument doesn't match HttpUrl
```

### 2. Conditional Types

Use conditional types to create type relationships:

```typescript
type NodeType<T> = T extends N8nNode
  ? 'n8n'
  : T extends MakeModule
  ? 'make'
  : 'unknown';

type ExtractParameters<T> = T extends { parameters: infer P } ? P : never;
```

### 3. Mapped Types

Use mapped types to transform existing types:

```typescript
// Make all properties in a type optional
type PartialWorkflow = {
  [K in keyof N8nWorkflow]?: N8nWorkflow[K];
};

// Make all properties in a type required
type RequiredNodeParameters = {
  [K in keyof NodeParameters]-?: NodeParameters[K];
};

// Create a type with only the specified keys
type NodeIdentity = Pick<N8nNode, 'id' | 'name' | 'type'>;
```

### 4. Type Predicates with Assertions

Combine type predicates with assertions for safer validation:

```typescript
function assertIsN8nNode(node: unknown): asserts node is N8nNode {
  if (!isN8nNode(node)) {
    throw new TypeError('Value is not a valid N8nNode');
  }
}

// Usage
function processNodeSafely(node: unknown): void {
  assertIsN8nNode(node);
  // TypeScript now knows node is N8nNode
  console.log(node.type);
}
```

## Type Safety in Tests

Testing with proper type safety ensures your tests validate the correct behavior:

### 1. Type-Safe Mocks

Create properly typed mocks:

```typescript
// ❌ Avoid untyped mocks
const mockNode = {
  id: '1',
  // Missing required properties
};

// ✅ Better
const mockNode: N8nNode = {
  id: '1',
  name: 'Test Node',
  type: 'test-node',
  position: [0, 0],
  // Other required properties...
};
```

### 2. Type-Safe Assertions

Use type-safe assertions in tests:

```typescript
// ❌ Avoid
expect(result.node.parameters.url).toBe('https://example.com');

// ✅ Better
expect(result.node).toHaveProperty('parameters');
expect(result.node.parameters).toHaveProperty('url', 'https://example.com');

// ✅ or use type guards
if (result.node && result.node.parameters) {
  expect(result.node.parameters.url).toBe('https://example.com');
} else {
  fail('Node or parameters is missing');
}
```

### 3. Type Guards in Tests

Implement specialized type guards for testing:

```typescript
// Test helper for type checking
function assertHasProperty<T, K extends string>(
  obj: T,
  prop: K
): asserts obj is T & Record<K, unknown> {
  if (!(prop in obj)) {
    throw new Error(`Object does not have property '${prop}'`);
  }
}

// Usage in tests
test('converts node parameters correctly', () => {
  const result = convertNode(mockNode);
  assertHasProperty(result, 'parameters');
  expect(result.parameters.url).toBe('https://example.com');
});
```

## Common Type Safety Pitfalls

### 1. Type Assertions Without Validation

**Issue:** Using type assertions without validating the actual type:

```typescript
// ❌ Dangerous
const nodeData = JSON.parse(data) as N8nNode;
```

**Solution:** Validate before asserting:

```typescript
// ✅ Better
const data = JSON.parse(jsonString);
if (isN8nNode(data)) {
  const nodeData: N8nNode = data;
} else {
  throw new Error('Invalid node data');
}
```

### 2. Accessing Array Elements Without Checks

**Issue:** Accessing array elements without checking bounds:

```typescript
// ❌ Potential undefined error
const firstNode = nodes[0].id;
```

**Solution:** Check bounds or use optional chaining:

```typescript
// ✅ Better
const firstNode = nodes.length > 0 ? nodes[0].id : undefined;
// Or
const firstNode = nodes[0]?.id;
```

### 3. Ignoring Nullability

**Issue:** Ignoring that properties might be null or undefined:

```typescript
// ❌ Potential runtime error
const parameterValue = node.parameters.value.toString();
```

**Solution:** Use optional chaining and nullish coalescing:

```typescript
// ✅ Better
const parameterValue = node.parameters?.value?.toString() ?? '';
```

### 4. Type Widening

**Issue:** TypeScript might widen types in certain contexts:

```typescript
// ❌ Type gets widened to string
let nodeType = 'http'; // Type is string, not 'http'
```

**Solution:** Use const assertions or explicit types:

```typescript
// ✅ Better
const nodeType = 'http' as const; // Type is 'http'
// Or
let nodeType: 'http' | 'function' = 'http';
```

## Migrating to Stricter Types

When improving type safety in existing code:

1. **Start with Critical Paths**: Focus on core functionality first
2. **Add Type Guards**: Introduce type guards for improved safety
3. **Replace any with unknown**: Replace `any` with `unknown` plus type narrowing
4. **Add Explicit Return Types**: Add return types to all functions
5. **Enable Incremental Type Checking**: Enable TypeScript flags incrementally

## Conclusion

By following these type safety guidelines, you can significantly reduce the risk of runtime errors, improve code quality, and enhance the developer experience in the n8n-Make Converter project. Type safety is not just about avoiding errors—it's about creating self-documenting, maintainable, and robust code that can evolve with changing requirements. 