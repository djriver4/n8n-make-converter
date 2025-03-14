# Conversion Logic: n8n ↔ Make.com

This document explains the conversion logic and algorithms used to transform workflows between n8n and Make.com platforms.

## Overview

The conversion process handles several key components:

1. **Node/Module Conversion**: Mapping between n8n nodes and Make.com modules
2. **Parameter Transformation**: Converting parameters and their values between platforms
3. **Expression Handling**: Transforming expressions from one syntax to another
4. **Connection/Route Management**: Converting the workflow structure and connections

## Expression Handling

Expressions are one of the most complex parts of the conversion process, as they use different syntaxes in each platform.

### n8n Expression Format

In n8n, expressions use the format:

```
={{ $json.fieldName }}
```

Key characteristics:
- Wrapped in `={{` and `}}`
- Uses variable references like `$json`, `$node`, `$parameter`, etc.
- Can contain JavaScript-like logic

### Make.com Expression Format

In Make.com, expressions use the format:

```
{{1.fieldName}}
```

Key characteristics:
- Wrapped in `{{` and `}}`
- Uses numeric module references (e.g., `1.`, `2.`) instead of variable names
- Different function names and syntax for operations

### Expression Conversion Logic

Our expression converter handles various expression patterns:

1. **Variable References**:
   - `$json.field` ↔ `1.field` (first module's data)
   - `$node["NodeName"].field` ↔ `NodeName.field`
   - `$parameter.field` ↔ `parameters.field`
   - `$env.VARIABLE` ↔ `env.VARIABLE`

2. **Function Calls**:
   - `$str.upper(value)` ↔ `upper(value)`
   - `$array.first(items)` ↔ `first(items)`
   - `$date.format(date, format)` ↔ `formatDate(date, format)`

3. **Conditional Logic**:
   - `$if(condition, trueVal, falseVal)` ↔ `ifThenElse(condition, trueVal, falseVal)`

The `ExpressionEvaluator` class handles this logic, using regex patterns to identify and transform expressions.

## Parameter Mapping

Parameter mapping defines how fields in one platform map to fields in the other platform.

### Key Components of Parameter Mapping

1. **Path Mapping**: Defines source and target parameter paths
   ```typescript
   {
     sourcePath: "url",
     targetPath: "URL"
   }
   ```

2. **Value Transformation**: Converting values between formats
   ```typescript
   {
     sourcePath: "method",
     targetPath: "httpMethod",
     transform: (value) => value.toUpperCase()
   }
   ```

3. **Default Values**: Setting defaults when parameters don't exist in the source
   ```typescript
   {
     targetPath: "parseResponse",
     defaultValue: true
   }
   ```

### Transformation Functions

The system supports various transformation functions:

- **Basic Transformations**:
  - `booleanToString`: Convert `true/false` to `"1"/"0"`
  - `stringToBoolean`: Convert `"1"/"0"` to `true/false`
  - `toUpperCase`/`toLowerCase`: Change string case
  
- **Complex Transformations**: Custom functions to handle complex conversions

## Node Type Mapping

Node types are mapped between platforms using a mapping database. Each mapping contains:

1. **Type Information**: Source and target node types
2. **Parameter Mappings**: How parameters convert between platforms
3. **Custom Logic**: Special handling for certain node types

Example mapping:

```javascript
{
  "httpRequest": {
    "source": "n8n",
    "sourceNodeType": "n8n-nodes-base.httpRequest",
    "targetNodeType": "http",
    "parameterMappings": {
      "url": {
        "targetPath": "URL",
        "required": true
      },
      "method": {
        "targetPath": "method",
        "required": true
      },
      "authentication": {
        "targetPath": "authentication.type"
      }
      // ...more parameter mappings
    }
  }
}
```

## Workflow Structure Conversion

### n8n to Make.com

1. Convert each n8n node to a Make.com module
2. Transform n8n connections to Make.com routes
3. Maintain position information for visual representation
4. Handle special node types (triggers, operations, etc.)

### Make.com to n8n

1. Convert each Make.com module to an n8n node
2. Transform Make.com routes to n8n connections
3. Preserve metadata and settings where applicable
4. Map special module types to appropriate n8n nodes

## Error Handling and Validation

The system includes several validation and error handling mechanisms:

1. **Schema Validation**: Ensure workflows match the expected structure
2. **Missing Mappings**: Identify nodes/modules without mappings
3. **Expression Analysis**: Flag complex expressions that may need manual review
4. **Parameter Validation**: Check required parameters and formats

## Usage Examples

### Example 1: Converting an HTTP Request Node

**n8n Node:**
```json
{
  "id": "123",
  "name": "HTTP Request",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.example.com",
    "method": "GET",
    "authentication": "none",
    "responseFormat": "json"
  }
}
```

**Converted Make.com Module:**
```json
{
  "id": "123",
  "name": "HTTP Request",
  "type": "http",
  "parameters": {
    "URL": "https://api.example.com",
    "method": "GET",
    "authentication": {
      "type": "none"
    },
    "parseResponse": true
  }
}
```

### Example 2: Converting an Expression

**n8n Expression:**
```
={{ $json.firstName + " " + $json.lastName }}
```

**Converted Make.com Expression:**
```
{{1.firstName + " " + 1.lastName}}
```

## Advanced Topics

### Handling Complex Functions

Some functions require special handling due to different implementations:

- **Array Manipulations**: Different ways of handling arrays between platforms
- **Date Functions**: Different date formatting options
- **Conditional Logic**: Different implementations of if/then/else

### Custom Transformations

For node types with significant differences, custom transformation functions are used:

```typescript
customTransform: (sourceNode, context) => {
  // Custom logic to handle special cases
  return transformedNode;
}
```

### Performance Considerations

The converter is optimized for:

1. **Memory Usage**: Processing large workflows efficiently
2. **Speed**: Converting workflows quickly for real-time use
3. **Accuracy**: Ensuring reliable conversions with minimum data loss

## Troubleshooting Common Issues

### Expression Conversion Failures

Common reasons expressions might not convert correctly:

1. Complex nested functions not supported in one platform
2. Platform-specific functions without direct equivalents
3. References to nodes/modules that don't exist in the target platform

### Missing Parameters

When parameters don't map directly:

1. Check if there's a custom transformation needed
2. Verify the parameter exists in both platforms
3. Consider adding a default value or custom mapping

### Connection Issues

Problems with workflow structure conversion:

1. Verify node IDs are consistent across the conversion
2. Check for special connection types (error handlers, etc.)
3. Ensure all nodes/modules have been successfully converted
4. Verify the workflow is valid in the source platform before conversion

## Best Practices

1. **Test Workflows**: Always test converted workflows before using in production
2. **Start Simple**: Begin with simpler workflows before trying complex ones
3. **Review Flags**: Pay attention to parameters and expressions flagged for review
4. **Incremental Conversion**: For large workflows, convert sections at a time
5. **Maintain Mappings**: Keep the mapping database updated as platforms evolve 