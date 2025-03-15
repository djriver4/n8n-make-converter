# Data Flow

This document describes the data flow through the n8n-Make Converter, detailing how information is processed from input to output.

## Overview

The n8n-Make Converter processes workflow data through several stages, transforming it from one platform's format to another. Understanding this data flow is essential for contributors and anyone troubleshooting conversion issues.

## Workflow Conversion Data Flow

When converting a workflow, data flows through the system as follows:

```
┌─────────────┐     ┌───────────────────┐     ┌───────────────┐
│             │     │                   │     │               │
│  Input      │────►│  Workflow         │────►│  Node         │
│  Workflow   │     │  Converter        │     │  Mapper       │
│             │     │                   │     │               │
└─────────────┘     └───────────────────┘     └───────┬───────┘
                                                     │
                                                     ▼
┌─────────────┐     ┌───────────────────┐     ┌───────────────┐
│             │     │                   │     │               │
│  Output     │◄────│  Assembled        │◄────│  Parameter    │
│  Workflow   │     │  Workflow         │     │  Processor    │
│             │     │                   │     │               │
└─────────────┘     └───────────────────┘     └───────┬───────┘
                                                     │
                                                     ▼
                                             ┌───────────────┐
                                             │               │
                                             │  Expression   │
                                             │  Evaluator    │
                                             │               │
                                             └───────────────┘
```

### Step-by-Step Process

1. **Input Workflow Submission**
   - User submits a workflow through the web interface or API
   - Workflow is validated for basic structure and format
   - TypeScript interfaces ensure type safety during processing

2. **Initial Processing by Workflow Converter**
   - `WorkflowConverter` class receives the workflow
   - Input is validated against platform-specific schemas
   - Conversion options are applied (debug mode, skip validation, etc.)
   - Conversion direction is determined (n8n → Make or Make → n8n)

3. **Node/Module Conversion**
   - For each node in the source workflow:
     - Node type is identified
     - `NodeMapper` is called to find the appropriate mapping
     - Node properties are extracted and prepared for mapping

4. **Parameter Processing**
   - For each parameter in the node:
     - `ParameterProcessor` converts the parameter structure
     - Parameter names are mapped according to the mapping definition
     - Parameter values are transformed if needed
     - Nested parameters are recursively processed

5. **Expression Evaluation and Transformation**
   - Expressions within parameters are identified
   - `ExpressionEvaluator` converts expressions between formats:
     - n8n: `$json.data.field` → Make: `1.data.field`
     - Make: `toString(1.field)` → n8n: `$json.field.toString()`
   - String interpolation and concatenation are handled
   - Function calls are transformed according to platform equivalents

6. **Connection/Route Mapping**
   - Node connections or routes are processed
   - Source and target identifiers are updated
   - Connection metadata is transformed if needed

7. **Workflow Assembly**
   - Converted nodes/modules are assembled into the target workflow structure
   - Metadata about the conversion is collected (unmapped nodes, warnings, etc.)
   - Debug information is included if requested

8. **Result Preparation**
   - Final workflow is validated for the target platform
   - Conversion logs and warnings are compiled
   - List of unmapped nodes or potential issues is generated
   - Performance metrics are recorded

9. **Output Delivery**
   - Complete conversion result is returned
   - Web interface displays the results with visual indicators for issues
   - Download option is provided for the converted workflow
   - Logs and warnings are displayed for user review

## Data Structures During Conversion

### Input Workflow

```typescript
// Example n8n workflow (simplified)
{
  name: "My Workflow",
  nodes: [
    {
      name: "Start",
      type: "n8n-nodes-base.start",
      parameters: { /* ... */ },
      position: [100, 200]
    },
    // Additional nodes...
  ],
  connections: {
    "Start": {
      main: [
        [{ node: "NextNode", type: "main", index: 0 }]
      ]
    }
    // Additional connections...
  }
}
```

### Intermediate Mapping Data

During the conversion process, nodes are mapped to their target format along with parameter transformations:

```typescript
// Example mapping data (simplified)
{
  sourceNodeType: "n8n-nodes-base.httpRequest",
  targetNodeType: "http",
  parameters: {
    url: {
      sourcePath: "url",
      targetPath: "url",
      transformation: (value) => value // Identity or custom transformation
    },
    method: {
      sourcePath: "method",
      targetPath: "method",
      // Map values if needed (e.g., "GET" -> "get")
      valueMap: {
        "GET": "get",
        "POST": "post"
        // Additional methods...
      }
    }
    // Additional parameters...
  }
}
```

### Output Workflow

```typescript
// Example Make.com workflow (simplified)
{
  name: "My Scenario",
  modules: [
    {
      name: "Start",
      type: "scenario:trigger",
      parameters: { /* ... */ },
      position: { x: 100, y: 200 }
    },
    // Additional modules...
  ],
  routes: [
    {
      source: { id: "Start", socket: "output" },
      target: { id: "NextModule", socket: "input" }
    }
    // Additional routes...
  ]
}
```

## Error Handling During Data Flow

The data flow includes error handling at various stages:

1. **Validation Errors**
   - Input validation issues are caught early
   - Detailed error messages indicate the specific validation failure
   - Options like `skipValidation` allow processing to continue with warnings

2. **Mapping Errors**
   - When a node type doesn't have a mapping, it's added to `unmappedNodes`
   - Partial mappings are applied where possible
   - Warning logs indicate missing mappings

3. **Parameter Transformation Errors**
   - Issues during parameter transformation are logged
   - Fallback values are used when possible
   - Parameters with conversion issues are added to `parametersNeedingReview`

4. **Expression Evaluation Errors**
   - Complex expressions that can't be automatically converted are marked
   - Original expressions are preserved with warnings
   - Expression context may be provided for better evaluation

5. **Connection Mapping Errors**
   - Connection issues are logged
   - Partial connection mappings are applied where possible
   - Warnings indicate potential flow problems

## Performance Considerations

The data flow is optimized for performance:

- Node mapping lookups use efficient data structures
- Expressions are cached when possible to avoid repeated parsing
- Large workflows are processed in chunks to avoid memory issues
- Performance metrics are collected at each stage for optimization

## Conclusion

Understanding the data flow through the n8n-Make Converter is essential for troubleshooting issues and contributing to the project. By following the path of data through the various components, developers can identify where problems might occur and how to address them effectively. 