# Type System Guide

This document provides a comprehensive overview of the type system used in the n8n-Make Converter project, including key interfaces, recent updates, and best practices for working with types.

## Core Type Definitions

The n8n-Make Converter relies on a robust type system to ensure type safety when converting between different workflow formats. The core types are defined in `lib/node-mappings/node-types.ts` and include:

### n8n Types

```typescript
interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters?: Record<string, any>;
  typeVersion?: number;
  credentials?: Record<string, any>;
  disabled?: boolean;
  continueOnFail?: boolean;
  alwaysOutputData?: boolean;
  retryOnFail?: boolean;
  [key: string]: any;
}

interface N8nConnection {
  node?: string;              // Target node name
  index?: number;             // Target input index
  sourceNodeId?: string;      // Source node ID
  targetNodeId?: string;      // Target node ID
  sourceOutputIndex?: number; // Source output index
  targetInputIndex?: number;  // Target input index
}

interface N8nWorkflow {
  id?: string;
  name: string;
  nodes: N8nNode[];
  connections: {
    [nodeId: string]: {
      main?: {
        [outputIndex: string]: N8nConnection[];
      } | N8nConnection[][];
    };
  };
  active?: boolean;
  settings?: Record<string, any>;
  tags?: string[];
  pinData?: Record<string, any>;
  versionId?: string;
  staticData?: Record<string, any>;
  [key: string]: any;
}
```

### Make.com Types

```typescript
interface MakeModule {
  id: string | number;
  name?: string;
  type?: string;
  module?: string;            // Module type identifier (e.g., "http:ActionSendData")
  parameters?: Record<string, any>;
  mapper?: Record<string, any>; // Parameter mappings
  label?: string;             // Display name in Make.com UI
  routes?: MakeRoute[];       // For router/filter modules
  disabled?: boolean;
  [key: string]: any;
}

interface MakeRoute {
  id?: string | number;
  condition?: any;            // Condition for the route
  flow?: MakeModule[];        // Modules in this route
  label?: string;
  [key: string]: any;
}

interface MakeWorkflow {
  name: string;
  flow?: MakeModule[];        // Array of modules in the workflow
  metadata?: {
    blueprint?: boolean;
    instant?: boolean;
    folderName?: string;
    color?: string;
    scenario?: Record<string, any>;
    designer?: Record<string, any>;
    version?: number;         // Workflow version
  };
  [key: string]: any;
}
```

### Conversion Types

```typescript
interface ConversionLog {
  level: 'info' | 'warning' | 'error';
  message: string;
  nodeId?: string;
  timestamp?: Date;
  details?: any;
}

interface ParameterReview {
  nodeId: string;
  nodeName?: string;
  parameterName: string;
  originalValue: any;
  convertedValue: any;
  reason: string;
}

interface WorkflowDebugInfo {
  conversionSteps?: any[];
  performance?: {
    startTime: number;
    endTime: number;
    duration: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface ConversionResult {
  success: boolean;
  convertedWorkflow?: any;
  logs: ConversionLog[];
  unmappedNodes?: string[];
  parametersNeedingReview?: ParameterReview[];
  debug?: WorkflowDebugInfo;
}

interface WorkflowConversionResult extends ConversionResult {
  convertedWorkflow?: MakeWorkflow | N8nWorkflow;
  paramsNeedingReview?: ParameterReview[];
}
```

## Recent Type System Updates

The type system has undergone several updates to address issues and improve type safety:

### 1. MakeModule Interface Updates
- Added `module`, `mapper`, `routes`, and `label` properties
- Made `name` and `type` optional to match actual usage
- Added proper typing for router modules with routes

### 2. N8nConnection Interface Updates
- Made `sourceNodeId` and `targetNodeId` optional
- Added `node` and `index` properties as alternatives
- Improved flexibility for different connection formats

### 3. N8nWorkflow Interface Updates
- Enhanced connections structure to support both object and array indexing
- Added support for dynamic property access

### 4. ConversionResult Interface Updates
- Added `WorkflowConversionResult` interface extending `ConversionResult`
- Added proper typing for logs, parameters needing review, and debug info

## Type Safety Best Practices

When working with the n8n-Make Converter type system, follow these best practices:

### 1. Use Type Guards

Type guards help narrow types safely:

```typescript
function isMakeModule(obj: any): obj is MakeModule {
  return obj && typeof obj === 'object' && (
    typeof obj.id === 'string' || typeof obj.id === 'number'
  );
}

function isN8nNode(obj: any): obj is N8nNode {
  return obj && typeof obj === 'object' && 
    typeof obj.id === 'string' && 
    typeof obj.type === 'string';
}

// Usage
if (isN8nNode(node)) {
  // TypeScript knows node is N8nNode here
  console.log(node.type);
}
```

### 2. Handle Optional Properties Safely

Use optional chaining and nullish coalescing:

```typescript
// Optional chaining
const moduleName = makeModule?.name ?? 'Unnamed Module';

// Safe access to nested properties
const condition = makeModule?.routes?.[0]?.condition;

// Default values for potentially undefined properties
const parameters = n8nNode.parameters ?? {};
```

### 3. Type Assertions

Use type assertions when necessary, but prefer type guards:

```typescript
// Less safe approach
const result = someFunction() as WorkflowConversionResult;

// Safer approach with double assertion for complex cases
const result = someFunction() as unknown as WorkflowConversionResult;

// Best approach with type guard
const result = someFunction();
if (isWorkflowConversionResult(result)) {
  // Use result safely
}
```

### 4. Index Signatures

Use index signatures for objects with dynamic properties:

```typescript
interface DynamicParameters {
  [key: string]: any;
}

// With type constraints
interface TypedParameters {
  [key: string]: string | number | boolean | null | undefined;
}
```

## Common Type Issues and Solutions

### Issue 1: Missing Properties in Type Definitions

**Problem:** Code uses properties that don't exist in the type definition.

```typescript
// Type definition
interface MakeModule {
  id: string | number;
  // Missing 'module' property
}

// Usage
const moduleType = makeModule.module; // TypeScript error
```

**Solution:** Update the interface to include all used properties:

```typescript
interface MakeModule {
  id: string | number;
  module?: string;
  // Other properties...
}
```

### Issue 2: Optional Properties Not Properly Marked

**Problem:** Properties that might be undefined are not marked with `?`.

```typescript
// Type definition
interface N8nNode {
  name: string; // Required but sometimes undefined
}

// Usage
const nodeName = n8nNode.name.toUpperCase(); // Potential runtime error
```

**Solution:** Mark optional properties with `?` and use safe access:

```typescript
interface N8nNode {
  name?: string;
}

// Usage
const nodeName = n8nNode.name?.toUpperCase() ?? 'UNNAMED';
```

### Issue 3: Type Mismatches

**Problem:** Properties with incorrect types.

```typescript
// Type definition
interface SwitchNodeParameters {
  rules: string;
}

// Actual structure
// rules: { conditions: Array<{value1: string, operation: string, value2: string}> }
```

**Solution:** Update the type to match the actual structure:

```typescript
interface SwitchNodeParameters {
  rules: {
    conditions: Array<{
      value1: string;
      operation: string;
      value2: string;
    }>;
  };
}
```

### Issue 4: Index Signature Issues

**Problem:** Missing index signatures for objects with dynamic properties.

```typescript
// Type definition
interface Parameters {
  url: string;
  // No index signature for additional properties
}

// Usage
parameters.customProperty = 'value'; // TypeScript error
```

**Solution:** Add an index signature:

```typescript
interface Parameters {
  url: string;
  [key: string]: any;
}
```

## Working with Conversion Result Types

The `ConversionResult` and `WorkflowConversionResult` interfaces are central to the conversion process. Here's how to work with them effectively:

### Accessing Conversion Logs

```typescript
const result = converter.convertN8nToMake(workflow);

// Check for errors
const errors = result.logs.filter(log => log.level === 'error');
if (errors.length > 0) {
  console.error('Conversion errors:', errors);
}

// Process logs by node
const nodeIssues = result.logs.filter(log => log.nodeId === targetNodeId);
```

### Handling Parameters Needing Review

```typescript
const result = converter.convertN8nToMake(workflow);

// Check for parameters needing review
if (result.parametersNeedingReview && result.parametersNeedingReview.length > 0) {
  console.warn('Parameters needing review:', result.parametersNeedingReview);
  
  // Group by node
  const byNode = result.parametersNeedingReview.reduce((acc, param) => {
    acc[param.nodeId] = acc[param.nodeId] || [];
    acc[param.nodeId].push(param);
    return acc;
  }, {} as Record<string, ParameterReview[]>);
}
```

### Type-Safe Access to Converted Workflow

```typescript
const result = converter.convertN8nToMake(workflow);

if (result.success && result.convertedWorkflow) {
  // Type guard for Make workflow
  if ('flow' in result.convertedWorkflow) {
    const makeWorkflow = result.convertedWorkflow as MakeWorkflow;
    // Process Make workflow
    const modules = makeWorkflow.flow || [];
  } 
  // Type guard for n8n workflow
  else if ('nodes' in result.convertedWorkflow) {
    const n8nWorkflow = result.convertedWorkflow as N8nWorkflow;
    // Process n8n workflow
    const nodes = n8nWorkflow.nodes || [];
  }
}
```

## Conclusion

The n8n-Make Converter's type system is designed to provide strong type safety while handling the complex structures of both n8n and Make.com workflows. By following the best practices outlined in this guide, you can work effectively with the type system and avoid common pitfalls.

Remember that the type system is continually evolving to better match the actual implementation and improve type safety. If you encounter type issues, consider updating the relevant interfaces or implementing type guards to ensure type safety. 