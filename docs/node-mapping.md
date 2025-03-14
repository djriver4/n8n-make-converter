# Node Mapping System

The Node Mapping System provides a way to convert between n8n nodes and Make.com modules. This document describes how the system works and how to use it.

## Overview

The Node Mapping System is responsible for:

1. Converting n8n nodes to Make.com modules
2. Converting Make.com modules to n8n nodes
3. Handling parameter mappings between the two formats
4. Managing expression transformations
5. Providing advanced parameter value transformations

## Components

The Node Mapping System consists of the following components:

- **NodeMapper**: The main class responsible for converting nodes between n8n and Make.com
- **Parameter Processor**: Handles transforming parameters and expressions
- **Expression Evaluator**: Evaluates expressions during conversion
- **Node Mapping Definitions**: JSON-based mappings that define the conversion rules

## Node Mapper

The `NodeMapper` class provides the following key methods:

- `convertN8nNodeToMakeModule(n8nNode, options)`: Converts an n8n node to a Make.com module
- `convertMakeModuleToN8nNode(makeModule, options)`: Converts a Make.com module to an n8n node
- `findMapping(sourceType, direction)`: Finds a mapping for a specific node type

### Conversion Options

When converting nodes, you can specify various options to control the conversion process:

```typescript
interface ConversionOptions {
  // Evaluate expressions during conversion
  evaluateExpressions?: boolean;
  
  // Context for expression evaluation
  expressionContext?: Record<string, any>;
  
  // Debug mode to collect detailed information about the conversion
  debug?: boolean;
  
  // User-defined mappings to override or extend the base mappings
  userMappings?: Record<string, any>;
  
  // Flag to indicate whether to transform parameter values according to target platform format
  transformParameterValues?: boolean;
}
```

### Conversion Result

The result of a conversion includes the converted node and optionally debug information:

```typescript
interface ConversionResult {
  // The converted node
  node: Record<string, any>;
  
  // Debug information about the conversion
  debug?: {
    // Original node before conversion
    originalNode: Record<string, any>;
    
    // Mapping used for the conversion
    mapping: NodeMapping | null;
    
    // Parameters that required manual review
    parametersForReview?: Record<string, { nodeType: string; reason: string }>;
  };
}
```

## Parameter Mappings

Parameter mappings define how parameters are transformed between n8n and Make.com. Each mapping includes:

- Source parameter path
- Target parameter path
- Optional transformation function

Example mapping:

```json
{
  "n8nToMake": {
    "location": { "targetPath": "city" },
    "units": { "targetPath": "units" },
    "includeAlerts": { "targetPath": "includeAlerts", "transform": "booleanToString" }
  },
  "makeToN8n": {
    "city": { "targetPath": "location" },
    "units": { "targetPath": "units" },
    "includeAlerts": { "targetPath": "includeAlerts", "transform": "stringToBoolean" }
  }
}
```

## Advanced Parameter Transformations

The Node Mapping System supports advanced parameter transformations to handle differences between n8n and Make.com:

### Data Type Transformations

- **Boolean transformations**: Convert between native booleans and string representations ("true"/"false" or "1"/"0")
- **Number transformations**: Convert between native numbers and string representations
- **Array transformations**: Convert between arrays and comma-separated strings
- **Date format transformations**: Convert between ISO dates and platform-specific date formats

### Expression Transformations

The system can transform expressions between n8n and Make.com formats, including:

- Converting variable references (e.g., `$json.value` to `1.value`)
- Converting function calls (e.g., `$if()` to `ifThenElse()`)
- Handling nested expressions and complex transformations

### Built-in Transformations

The following built-in transformations are available:

- `booleanToString`: Convert boolean values to strings
- `stringToBoolean`: Convert string values ("true", "false", "1", "0") to booleans
- `numberToString`: Convert number values to strings
- `stringToNumber`: Convert string values to numbers
- `arrayToString`: Convert arrays to comma-separated strings
- `stringToArray`: Convert comma-separated strings to arrays

## Using the Node Mapper

### Basic Usage

```typescript
import { NodeMapper } from './lib/node-mappings/node-mapper';

// Create a new NodeMapper instance
const nodeMapper = new NodeMapper();

// Convert an n8n node to a Make.com module
const n8nNode = {
  name: 'Weather Node',
  type: 'n8n.weather',
  parameters: {
    location: 'New York',
    units: 'imperial',
    includeAlerts: true
  }
};

const makeResult = nodeMapper.convertN8nNodeToMakeModule(n8nNode);
console.log(makeResult.node);

// Convert a Make.com module to an n8n node
const makeModule = {
  name: 'Weather Module',
  type: 'weather:ActionGetCurrentWeather',
  parameters: {
    city: 'London',
    units: 'metric',
    includeAlerts: '1'
  }
};

const n8nResult = nodeMapper.convertMakeModuleToN8nNode(makeModule);
console.log(n8nResult.node);
```

### Advanced Usage

```typescript
// With advanced options
const options = {
  evaluateExpressions: true,
  expressionContext: {
    $json: {
      recipient: 'test@example.com',
      name: 'John'
    }
  },
  debug: true,
  transformParameterValues: true
};

const result = nodeMapper.convertN8nNodeToMakeModule(n8nNode, options);

// Access the converted node
console.log(result.node);

// Access debug information
if (result.debug) {
  console.log(`Original node: ${JSON.stringify(result.debug.originalNode)}`);
  console.log(`Used mapping: ${JSON.stringify(result.debug.mapping)}`);
  console.log(`Parameters for review: ${JSON.stringify(result.debug.parametersForReview)}`);
}
```

## Creating Custom Mappings

To create custom mappings for your own nodes, define a mapping object with the following structure:

```typescript
const customMapping = {
  targetType: 'target:NodeType',
  parameterMappings: {
    n8nToMake: {
      'sourceParam': { targetPath: 'targetParam' },
      'sourceNestedParam.nested': { targetPath: 'targetNestedParam' }
    },
    makeToN8n: {
      'targetParam': { targetPath: 'sourceParam' },
      'targetNestedParam': { targetPath: 'sourceNestedParam.nested' }
    }
  }
};
```

Then provide this mapping when converting nodes:

```typescript
const options = {
  userMappings: {
    'custom.node': customMapping
  }
};

const result = nodeMapper.convertN8nNodeToMakeModule(customNode, options);
```

## Expression Handling

The Node Mapping System includes an advanced Expression Evaluator that:

1. Converts expressions between n8n and Make.com formats
2. Evaluates expressions using a provided context
3. Identifies complex expressions that may need manual review

### Expression Conversion

- n8n expressions typically use the format `={{ $json.value }}`
- Make.com expressions typically use the format `{{1.value}}`

The system automatically converts between these formats, including:

- Variable references (`$json`, `$parameter`, etc.)
- Function calls (`$if`, `$str.upper`, etc.)
- Nested expressions and complex transformations

### Expression Evaluation

When the `evaluateExpressions` option is enabled, the system will:

1. Parse expressions in parameters
2. Evaluate them using the provided context
3. Replace them with their evaluated values

This is useful for preview and testing purposes.

### Complex Expression Identification

The system can identify complex expressions that may need manual review, such as:

- Expressions with multiple function calls
- Expressions using advanced functions (map, filter, reduce)
- Expressions with complex conditional logic

Use the `debug` option to get a list of parameters with complex expressions.

## Best Practices

1. Always provide clear and accurate mappings between node types
2. Use appropriate transformations for parameter values
3. Test conversions with debug mode enabled to identify potential issues
4. Handle complex expressions that may require manual review
5. Use the Expression Evaluator to preview expression results
6. Document custom mappings and transformations 