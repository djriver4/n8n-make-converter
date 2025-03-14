# Expression Evaluator

The Expression Evaluator is a powerful component of the n8n-make-converter tool that handles expressions in workflow parameters. It provides capabilities for converting, evaluating, and transforming expressions between n8n and Make.com formats.

## Overview

Expressions in workflow automation platforms allow dynamic content and functionality, but n8n and Make.com use different syntaxes and features. The Expression Evaluator provides the following capabilities:

1. Identification of expressions in parameters
2. Conversion between n8n and Make.com expression formats
3. Evaluation of expressions using a context
4. Advanced functions for complex transformations
5. Tools for identifying expressions that may need manual review

## Expression Formats

### n8n Expressions

n8n uses the following expression format:

```
={{ $json.data }}
```

Key features of n8n expressions:
- Wrapped in `={{` and `}}`
- Uses `$` prefix for variable references
- Common variable references: `$json`, `$parameter`, `$binary`, `$env`, `$workflow`, `$node`
- Supports JavaScript expressions and functions

### Make.com Expressions

Make.com uses the following expression format:

```
{{1.data}}
```

Key features of Make.com expressions:
- Wrapped in `{{` and `}}`
- Uses numeric identifiers for module outputs (e.g., `1.`, `2.`)
- Common variable references: `parameters`, `binary`, `env`, `scenario`, `module`
- Has its own set of functions with different naming conventions

## Expression Detection

The Expression Evaluator can detect expressions in parameters using the `isExpression` function:

```typescript
import { isExpression } from './lib/expression-evaluator';

const param1 = '={{ $json.value }}';
const param2 = 'static text';

console.log(isExpression(param1)); // true
console.log(isExpression(param2)); // false
```

## Expression Conversion

### n8n to Make.com

The Expression Evaluator can convert n8n expressions to Make.com format:

```typescript
import { NodeParameterProcessor } from './lib/converters/parameter-processor';

const n8nExpression = '={{ $json.data }}';
const makeExpression = NodeParameterProcessor.convertN8nToMakeExpression(n8nExpression);
console.log(makeExpression); // {{1.data}}
```

Variable reference mappings:
- `$json.property` → `1.property`
- `$parameter.property` → `parameters.property`
- `$binary.property` → `binary.property`
- `$env.property` → `env.property`
- `$workflow.property` → `scenario.property`
- `$node.property` → `module.property`

Function mappings:
- `$if(condition, trueValue, falseValue)` → `ifThenElse(condition, trueValue, falseValue)`
- `$str.upper(text)` → `upper(text)`
- `$str.lower(text)` → `lower(text)`
- `$str.trim(text)` → `trim(text)`
- `$str.replace(text, search, replace)` → `replace(text, search, replace)`
- `$date.now()` → `now()`
- `$date.format(date, format)` → `formatDate(date, format)`

### Make.com to n8n

The Expression Evaluator can also convert Make.com expressions to n8n format:

```typescript
import { NodeParameterProcessor } from './lib/converters/parameter-processor';

const makeExpression = '{{1.data}}';
const n8nExpression = NodeParameterProcessor.convertMakeToN8nExpression(makeExpression);
console.log(n8nExpression); // ={{ $json.data }}
```

Variable reference mappings:
- `1.property` → `$json.property`
- `parameters.property` → `$parameter.property`
- `binary.property` → `$binary.property`
- `env.property` → `$env.property`
- `scenario.property` → `$workflow.property`
- `module.property` → `$node.property`

Function mappings:
- `ifThenElse(condition, trueValue, falseValue)` → `$if(condition, trueValue, falseValue)`
- `upper(text)` → `$str.upper(text)`
- `lower(text)` → `$str.lower(text)`
- `trim(text)` → `$str.trim(text)`
- `replace(text, search, replace)` → `$str.replace(text, search, replace)`
- `now()` → `$date.now()`
- `formatDate(date, format)` → `$date.format(date, format)`

## Expression Evaluation

The Expression Evaluator can evaluate expressions using a provided context:

```typescript
import { NodeParameterProcessor } from './lib/converters/parameter-processor';

const expression = '={{ $json.firstName + " " + $json.lastName }}';
const context = {
  $json: {
    firstName: 'John',
    lastName: 'Doe'
  }
};

const result = NodeParameterProcessor.evaluateExpressions({ greeting: expression }, context);
console.log(result.greeting); // John Doe
```

## Advanced Functions

The Expression Evaluator supports a rich set of functions for complex transformations:

### Conditional Functions

- `$if(condition, trueValue, falseValue)`: Returns trueValue if condition is true, otherwise falseValue
- Example: `$if($json.stock > 0, "In stock", "Out of stock")`

### String Functions

- `$str.upper(text)`: Converts text to uppercase
- `$str.lower(text)`: Converts text to lowercase
- `$str.trim(text)`: Removes whitespace from start and end of text
- `$str.replace(text, search, replace)`: Replaces occurrences of search with replace in text
- `$str.substr(text, start, length)`: Extracts a substring from text
- `$str.split(text, separator)`: Splits text into an array using separator
- `$str.indexOf(text, search)`: Returns the position of search in text
- `$str.includes(text, search)`: Checks if text includes search
- `$str.padStart(text, length, padChar)`: Pads the start of text to specified length
- `$str.padEnd(text, length, padChar)`: Pads the end of text to specified length

### Array Functions

- `$array.first(array)`: Returns the first element of an array
- `$array.last(array)`: Returns the last element of an array
- `$array.join(array, separator)`: Joins array elements with separator
- `$array.length(array)`: Returns the length of an array
- `$array.map(array, function)`: Applies function to each element of array
- `$array.filter(array, function)`: Filters array by function
- `$array.reduce(array, function, initialValue)`: Reduces array using function
- `$array.forEach(array, function)`: Executes function for each element of array
- `$array.find(array, function)`: Returns the first element that matches function
- `$array.some(array, function)`: Checks if at least one element matches function
- `$array.every(array, function)`: Checks if all elements match function
- `$array.sort(array, function)`: Sorts array by function

### Object Functions

- `$object.keys(obj)`: Returns array of object's keys
- `$object.values(obj)`: Returns array of object's values
- `$object.entries(obj)`: Returns array of object's key-value pairs
- `$object.hasKey(obj, key)`: Checks if object has key
- `$object.get(obj, path, defaultValue)`: Gets value at path or returns defaultValue
- `$object.set(obj, path, value)`: Sets value at path

### Date Functions

- `$date.now()`: Returns current timestamp
- `$date.format(date, format)`: Formats date according to format string
- `$date.parse(dateString, format)`: Parses dateString according to format
- `$date.addDays(date, days)`: Adds days to date
- `$date.addMonths(date, months)`: Adds months to date
- `$date.addYears(date, years)`: Adds years to date
- `$date.diff(date1, date2, unit)`: Returns difference between dates in specified unit

### Math Functions

- `$math.round(number, decimals)`: Rounds number to specified decimals
- `$math.floor(number)`: Rounds number down to nearest integer
- `$math.ceil(number)`: Rounds number up to nearest integer
- `$math.abs(number)`: Returns absolute value of number
- `$math.max(...numbers)`: Returns largest of provided numbers
- `$math.min(...numbers)`: Returns smallest of provided numbers
- `$math.random(min, max)`: Returns random number between min and max
- `$math.sum(...numbers)`: Returns sum of provided numbers
- `$math.avg(...numbers)`: Returns average of provided numbers

## Processing Objects with Expressions

The Expression Evaluator can process entire objects with expressions:

```typescript
import { processObjectWithExpressions } from './lib/expression-evaluator';

const obj = {
  greeting: '={{ "Hello, " + $json.name }}',
  details: {
    age: '={{ $json.age }}',
    isAdult: '={{ $json.age >= 18 }}'
  },
  items: ['={{ $json.items[0] }}', '={{ $json.items[1] }}']
};

const context = {
  $json: {
    name: 'John',
    age: 30,
    items: ['apple', 'banana', 'orange']
  }
};

const result = processObjectWithExpressions(obj, context);
console.log(result);
// {
//   greeting: 'Hello, John',
//   details: {
//     age: 30,
//     isAdult: true
//   },
//   items: ['apple', 'banana']
// }
```

## Complex Expression Identification

The Expression Evaluator can identify complex expressions that may need manual review:

```typescript
import { NodeParameterProcessor } from './lib/converters/parameter-processor';

const params = {
  simple: '={{ $json.value }}',
  complex: '={{ $json.items.filter(i => i.value > 10).map(i => i.name) }}'
};

const result = NodeParameterProcessor.identifyExpressionsForReview(params);
console.log(result);
// {
//   'complex': {
//     nodeType: 'unknown',
//     reason: 'Complex expression needs review'
//   }
// }
```

Complex expressions that are flagged include:
- Expressions with multiple function calls
- Expressions using advanced functions (map, filter, reduce)
- Expressions with complex conditional logic
- JSON manipulations
- Regular expressions
- Date formatting with complex patterns

## Best Practices

1. **Test Expression Conversions**: Always test conversions between n8n and Make.com formats, especially for complex expressions.
2. **Use Expression Context**: Provide a realistic context for expression evaluation to get accurate results.
3. **Handle Complex Expressions**: Identify complex expressions that may need manual review or adaptation.
4. **Document Custom Functions**: If adding custom functions to the Expression Evaluator, document their behavior and mappings.
5. **Validate Results**: Verify that converted expressions produce the expected results in the target platform.
6. **Graceful Fallbacks**: Implement fallbacks for expressions that cannot be automatically converted.
7. **Evaluate in Context**: Use expression evaluation in context of the entire workflow, not just isolated parameters.

## Limitations

The Expression Evaluator has some limitations to be aware of:

1. Not all JavaScript functions in n8n expressions can be automatically mapped to Make.com functions and vice versa.
2. Complex expressions with nested function calls may not convert perfectly.
3. Platform-specific features and functions may not have direct equivalents.
4. The Expression Evaluator executes JavaScript code, so use it with caution on untrusted inputs.
5. Performance may be affected when evaluating large amounts of complex expressions.

## Future Enhancements

Potential future enhancements to the Expression Evaluator:

1. Support for more advanced JavaScript features in expressions
2. More comprehensive mapping between n8n and Make.com functions
3. Better error handling and reporting for invalid expressions
4. Performance optimizations for large workflows
5. Support for other workflow automation platforms
6. Visual expression builder integration 