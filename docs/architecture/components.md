# Components

This document provides a detailed breakdown of the main components in the n8n-Make Converter, their responsibilities, and how they interact with each other.

## Core Components Overview

The n8n-Make Converter is composed of several key components, each with specific responsibilities:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                 Workflow Converter              │
│                                                 │
└─────────────┬───────────────────┬───────────────┘
              │                   │
              ▼                   ▼
┌─────────────────────┐ ┌───────────────────────┐
│                     │ │                       │
│    Node Mapper      │ │  Connection Mapper    │
│                     │ │                       │
└─────────────┬───────┘ └───────────────────────┘
              │
              ▼
┌─────────────────────┐ ┌───────────────────────┐
│                     │ │                       │
│ Parameter Processor │ │  Expression Evaluator │
│                     │ │                       │
└─────────────────────┘ └───────────────────────┘
```

## Workflow Converter

**File Location**: `lib/workflow-converter.ts`

**Responsibilities**:

- Serve as the main entry point for conversion operations
- Validate input workflows against platform-specific schemas
- Coordinate the conversion process between different platforms
- Handle conversion in both directions (n8n to Make.com and vice versa)
- Assemble the final converted workflow
- Generate conversion reports and logs

**Key Methods**:

- `convertN8nToMake(n8nWorkflow, options?)`: Converts an n8n workflow to Make.com format
- `convertMakeToN8n(makeWorkflow, options?)`: Converts a Make.com workflow to n8n format
- `validateN8nWorkflow(workflow)`: Validates an n8n workflow structure
- `validateMakeWorkflow(workflow)`: Validates a Make.com workflow structure

**Example Usage**:

```typescript
import { WorkflowConverter } from 'n8n-make-converter';

const converter = new WorkflowConverter();
const result = await converter.convertN8nToMake(myN8nWorkflow, {
  debug: true,
  skipValidation: false
});

console.log(result.convertedWorkflow); // The Make.com workflow
console.log(result.logs);             // Conversion logs
console.log(result.unmappedNodes);    // Nodes that couldn't be mapped
```

## Node Mapper

**File Location**: `lib/node-mappings/node-mapper.ts`

**Responsibilities**:

- Locate appropriate mappings for node types
- Apply node type mappings to convert nodes between platforms
- Handle special cases for complex node types
- Manage the node mapping database

**Key Methods**:

- `mapNode(node, direction)`: Maps a node to its equivalent in the target platform
- `findMapping(nodeType, direction)`: Finds the appropriate mapping for a node type
- `loadMappings(mappings)`: Loads custom mappings into the mapper
- `getMappingStatistics()`: Returns statistics about available mappings

**Dependencies**:

- Relies on the Parameter Processor for transforming node parameters
- Interfaces with the Expression Evaluator for handling expressions within parameters

**Example Usage**:

```typescript
import { NodeMapper, MappingDirection } from 'n8n-make-converter';

const nodeMapper = new NodeMapper();
const convertedNode = await nodeMapper.mapNode(
  myNode,
  MappingDirection.N8N_TO_MAKE
);
```

## Parameter Processor

**File Location**: `lib/converters/parameter-processor.ts`

**Responsibilities**:

- Convert parameter structures between platforms
- Apply transformations to parameter values
- Handle nested parameters and arrays
- Ensure non-nullable return types for type safety

**Key Methods**:

- `processParameter(parameter, mapping)`: Processes a parameter according to its mapping
- `transformValue(value, transformation)`: Applies a transformation to a parameter value
- `handleNestedParameters(parameters)`: Processes nested parameter structures

**Dependencies**:

- Works closely with the Expression Evaluator for processing expressions in parameters
- Used by the Node Mapper to handle parameter conversion

**Example Usage**:

```typescript
import { ParameterProcessor } from 'n8n-make-converter';

const processor = new ParameterProcessor();
const convertedParams = processor.processParameter(
  nodeParameters,
  parameterMapping
);
```

## Expression Evaluator

**File Location**: `lib/expression-evaluator.ts`

**Responsibilities**:

- Parse expressions in different formats
- Convert expressions between n8n and Make.com formats
- Evaluate expressions for testing purposes
- Handle string interpolation and concatenation
- Process function calls and operators

**Key Methods**:

- `convertN8nToMakeExpression(expression)`: Converts n8n expressions to Make.com format
- `convertMakeToN8nExpression(expression)`: Converts Make.com expressions to n8n format
- `evaluateExpression(expression, context)`: Evaluates an expression with a given context
- `parseExpression(expression)`: Parses an expression into a structured format

**Recent Improvements**:

- Enhanced string concatenation handling
- Improved variable replacement in expressions
- Better handling of edge cases and malformed expressions
- Enhanced type coercion for mixed-type operations

**Example Usage**:

```typescript
import { ExpressionEvaluator } from 'n8n-make-converter';

const evaluator = new ExpressionEvaluator();

// Converting n8n to Make.com
const makeExpression = evaluator.convertN8nToMakeExpression(
  'Hello {{$json.name}}, your order #{{$json.order.id}} is ready!'
);
// Result: 'Hello {{1.name}}, your order #{{1.order.id}} is ready!'

// Converting Make.com to n8n
const n8nExpression = evaluator.convertMakeToN8nExpression(
  'formatDate(1.created_at, "YYYY-MM-DD")'
);
// Result: '$json.created_at.formatDate("YYYY-MM-DD")'
```

## Connection Mapper

**File Location**: `lib/converters/connection-mapper.ts`

**Responsibilities**:

- Convert connections/routes between platforms
- Update node/module identifiers in connections
- Handle different connection structures

**Key Methods**:

- `mapN8nConnectionsToMakeRoutes(connections, nodeIdMap)`: Converts n8n connections to Make.com routes
- `mapMakeRoutesToN8nConnections(routes, moduleIdMap)`: Converts Make.com routes to n8n connections

**Example Usage**:

```typescript
import { ConnectionMapper } from 'n8n-make-converter';

const mapper = new ConnectionMapper();
const makeRoutes = mapper.mapN8nConnectionsToMakeRoutes(
  n8nWorkflow.connections,
  nodeIdMappings
);
```

## Plugin System

**File Location**: `lib/plugins/plugin-registry.ts`

**Responsibilities**:

- Register and manage plugins
- Provide a way to extend converter functionality
- Load plugins when needed

**Key Methods**:

- `registerPlugin(plugin)`: Registers a plugin with the system
- `getPluginForNodeType(nodeType)`: Gets a plugin that can handle a specific node type
- `hasPluginForNodeType(nodeType)`: Checks if a plugin exists for a node type

**Example Usage**:

```typescript
import { PluginRegistry, NodeTypePlugin } from 'n8n-make-converter';

// Create a custom plugin
const myPlugin: NodeTypePlugin = {
  nodeTypes: ['my-custom-node-type'],
  convertNode: (node, direction) => {
    // Custom conversion logic
    return convertedNode;
  }
};

// Register the plugin
PluginRegistry.getInstance().registerPlugin(myPlugin);
```

## Performance Logger

**File Location**: `lib/performance-logger.ts`

**Responsibilities**:

- Track performance metrics
- Provide timing information for optimization
- Log performance bottlenecks

**Key Methods**:

- `startTimer(label)`: Starts a timer for a specific operation
- `endTimer(label)`: Ends a timer and logs the duration
- `getMetrics()`: Returns all collected performance metrics

**Example Usage**:

```typescript
import { PerformanceLogger } from 'n8n-make-converter';

const logger = PerformanceLogger.getInstance();
logger.startTimer('nodeConversion');
// Perform node conversion
logger.endTimer('nodeConversion');

const metrics = logger.getMetrics();
console.log(metrics.nodeConversion); // Time taken for node conversion
```

## Component Interactions

### Workflow Conversion Process

1. **User initiates conversion**:
   - User provides a workflow (n8n or Make.com format)
   - Workflow Converter validates the input structure

2. **Node/Module conversion**:
   - For each node/module:
     - Workflow Converter calls Node Mapper to convert the node
     - Node Mapper finds the appropriate mapping
     - Parameter Processor converts each parameter
     - Expression Evaluator transforms expressions within parameters
     - Node Mapper returns the converted node to the Workflow Converter

3. **Connection/Route conversion**:
   - Workflow Converter calls Connection Mapper
   - Connection Mapper updates node identifiers
   - Connection Mapper transforms connection structure
   - Connection Mapper returns converted connections to the Workflow Converter

4. **Workflow assembly**:
   - Workflow Converter assembles converted nodes and connections
   - Validation is performed on the converted workflow
   - Logs and warnings are compiled
   - Performance metrics are recorded

5. **Result returned to user**:
   - Converted workflow
   - Conversion logs
   - Unmapped nodes
   - Performance metrics (if requested)

## Component Dependencies

```
┌─────────────────┐
│                 │
│     User        │
│    Interface    │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│    Workflow     │────►│  Performance    │
│    Converter    │     │    Logger       │
│                 │     │                 │
└────────┬────────┘     └─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│         │ │             │
│  Node   │ │ Connection  │
│ Mapper  │ │   Mapper    │
│         │ │             │
└────┬────┘ └─────────────┘
     │
     ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Parameter     │────►│   Expression    │
│   Processor     │     │    Evaluator    │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

## Conclusion

The components of the n8n-Make Converter work together to provide a robust and extensible system for converting workflows between platforms. Each component has clearly defined responsibilities and interfaces, enabling independent development and testing. This modular design ensures the converter can be extended to support new node types and features without requiring changes to the core architecture. 