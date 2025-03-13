# Expression Evaluator

This document describes the Expression Evaluator system, a lightweight but powerful tool for parsing and evaluating dynamic expressions within workflow definitions. This system was inspired by n8n's expression handling capabilities and adapted for use in our workflow converter.

## Overview

The Expression Evaluator allows for:

- Parsing expressions embedded in workflow parameters
- Evaluating these expressions at runtime
- Converting between n8n and Make.com expression formats
- Providing context-aware parameter processing

## Expression Syntax

### n8n Expression Format

In n8n, expressions are typically written in the following format:

```
={{ expression }}
```

For example:
```json
{
  "url": "={{ $json.baseUrl }}/api/data",
  "method": "GET"
}
```

### Make.com Expression Format

In Make.com, expressions are typically written in the following format:

```
{{expression}}
```

For example:
```json
{
  "url": "{{$json.baseUrl}}/api/data",
  "method": "GET"
}
```

## Expression Context

Expressions are evaluated within a context that provides access to various data sources:

- `$json`: Data from previous nodes or input
- `$env`: Environment variables
- `$workflow`: Workflow metadata (id, name, etc.)
- Custom variables: Any additional data needed for evaluation

Example context:
```javascript
{
  $json: {
    baseUrl: "https://api.example.com",
    userId: 123
  },
  $env: {
    API_KEY: "abc123"
  },
  $workflow: {
    id: "workflow-001",
    name: "Data Processor"
  }
}
```

## Usage Examples

### Basic Expression Evaluation

```typescript
import { evaluateExpression } from '../lib/expression-evaluator';

const context = {
  $json: {
    firstName: 'John',
    lastName: 'Doe'
  }
};

// Evaluate an n8n expression
const result1 = evaluateExpression('={{ $json.firstName }}', context);
// result1 = 'John'

// Evaluate a Make.com expression
const result2 = evaluateExpression('{{$json.firstName}}', context);
// result2 = 'John'
```

### Converting Between Expression Formats

```typescript
import { NodeParameterProcessor } from '../lib/converters/parameter-processor';

const n8nParams = {
  url: '={{ $json.baseUrl }}/api',
  headers: {
    Authorization: '={{ $json.token }}'
  }
};

// Convert to Make.com format
const makeParams = NodeParameterProcessor.convertN8nToMakeParameters(n8nParams);
// makeParams = {
//   url: '{{$json.baseUrl}}/api',
//   headers: {
//     Authorization: '{{$json.token}}'
//   }
// }

// Convert back to n8n format
const backToN8n = NodeParameterProcessor.convertMakeToN8nParameters(makeParams);
```

### Processing Objects with Expressions

```typescript
import { processObjectWithExpressions } from '../lib/expression-evaluator';

const context = {
  $json: {
    baseUrl: 'https://api.example.com',
    userId: 123
  }
};

const params = {
  url: '={{ $json.baseUrl }}/users/{{ $json.userId }}',
  method: 'GET'
};

const evaluated = processObjectWithExpressions(params, context);
// evaluated = {
//   url: 'https://api.example.com/users/123',
//   method: 'GET'
// }
```

### Building Expression Contexts

```typescript
import { ExpressionContextBuilder } from '../lib/expression-context-builder';

// Create a context with the builder pattern
const context = new ExpressionContextBuilder()
  .withJsonData({ 
    baseUrl: 'https://api.example.com',
    userId: 123
  })
  .withWorkflowMetadata({ 
    id: 'workflow-001', 
    name: 'Data Processor' 
  })
  .withCustomVariable('customVar', 'custom value')
  .build();

// Or use static helpers
const n8nContext = ExpressionContextBuilder.fromN8nWorkflow(workflowObject);
const makeContext = ExpressionContextBuilder.fromMakeWorkflow(workflowObject);
```

## Integration with Workflow Conversion

The Expression Evaluator is fully integrated with the workflow conversion process:

1. **Detecting Expressions**: The system can identify expressions in node parameters that might need special handling or review.

2. **Converting Expressions**: When converting workflows between n8n and Make.com, the system automatically converts expression formats.

3. **Evaluating Expressions**: During testing or workflow simulation, expressions can be evaluated to see their actual values.

4. **Contextual Awareness**: The system allows for platform-specific context building to ensure expressions work as expected in both environments.

## Advanced Features

### Expression Identification

The system can scan parameters to identify those containing expressions for special handling:

```typescript
import { NodeParameterProcessor } from '../lib/converters/parameter-processor';

const params = {
  url: '={{ $json.baseUrl }}/users',
  method: 'GET',
  nested: {
    value: '={{ $json.userId }}'
  }
};

const expressionPaths = NodeParameterProcessor.identifyExpressionsForReview(params);
// expressionPaths = ['url', 'nested.value']
```

### Error Handling

The Expression Evaluator includes robust error handling to prevent failures during workflow conversion:

- Invalid expressions are gracefully handled and return null or a sensible default
- Detailed error logging helps identify issues
- Type checking ensures proper input and output handling

## Conclusion

The Expression Evaluator system provides a powerful mechanism for handling dynamic expressions in workflows, making the conversion between n8n and Make.com more accurate and reliable. By understanding the expression formats and contexts used by both platforms, the system can ensure that expressions are properly preserved during conversion. 