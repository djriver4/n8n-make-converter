import { Parser } from 'expr-eval';

/**
 * Expression evaluator for workflow converters.
 * Parses and evaluates expressions in the format {{...}} or ={{...}}.
 * 
 * Based on the n8n expression syntax.
 */

export interface ExpressionContext {
  // Data from previous nodes (JSON structure)
  $json?: Record<string, any>;
  // Environment variables
  $env?: Record<string, any>;
  // Workflow metadata
  $workflow?: Record<string, any>;
  // Any other custom context variables
  [key: string]: any;
}

/**
 * Extracts the expression content from a string
 * Handles both n8n format (={{...}}) and Make.com format ({{...}})
 * 
 * @param expressionString - The string containing the expression
 * @returns The extracted expression without delimiters
 */
export function extractExpressionContent(expressionString: string): string {
  if (!expressionString || typeof expressionString !== 'string') {
    return '';
  }

  // n8n format: ={{...}}
  if (expressionString.startsWith('={{') && expressionString.endsWith('}}')) {
    return expressionString.slice(3, -2).trim();
  }
  
  // Make.com format: {{...}}
  if (expressionString.startsWith('{{') && expressionString.endsWith('}}')) {
    return expressionString.slice(2, -2).trim();
  }

  return expressionString;
}

/**
 * Determines if a string contains an expression
 * 
 * @param value - The value to check
 * @returns True if the value contains an expression
 */
export function isExpression(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  return (
    (value.startsWith('={{') && value.endsWith('}}')) || 
    (value.startsWith('{{') && value.endsWith('}}'))
  );
}

/**
 * Gets a property value from a context object using a path string
 * Supports accessing array elements with [index]
 * 
 * @param context The context object
 * @param path The path string (e.g., $json.data.items[0])
 * @returns The value at the specified path or undefined if not found
 */
export function getValueByPath(context: Record<string, any>, path: string): any {
  if (!path) return undefined;
  
  // Handle array access
  const arrayAccessRegex = /(\w+)\[(\d+)\]/;
  
  const parts = path.split('.');
  let current = context;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const arrayMatch = part.match(arrayAccessRegex);
    
    if (arrayMatch) {
      // We have an array access like items[0]
      const arrayName = arrayMatch[1];
      const arrayIndex = parseInt(arrayMatch[2], 10);
      
      if (!current[arrayName] || !Array.isArray(current[arrayName])) {
        return undefined;
      }
      
      current = current[arrayName][arrayIndex];
    } else {
      // Regular property access
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
  }
  
  return current;
}

/**
 * Evaluates a simple mathematical expression
 * 
 * @param expression - The expression to evaluate (e.g., "1 + 2")
 * @param context - The context for variable substitution
 * @returns The result of the evaluation
 */
export function evaluateMathExpression(expression: string, context: Record<string, any>): any {
  try {
    // Replace variables with their values
    let processedExpression = expression;
    
    // Handle variables like $json.age
    const varRegex = /\$(\w+)\.([a-zA-Z0-9_\.\[\]]+)/g;
    processedExpression = processedExpression.replace(varRegex, (match, prefix, path) => {
      const fullPath = `${prefix}.${path}`;
      const value = getValueByPath(context, fullPath);
      return value !== undefined ? String(value) : '0'; // Default to 0 for undefined values
    });
    
    // Create parser with operators
    const parser = new Parser({
      operators: {
        'in': true,
      }
    });
    
    // Add custom functions
    parser.functions.json = (str: string) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return null;
      }
    };
    
    const result = parser.parse(processedExpression).evaluate({});
    return result;
  } catch (error) {
    console.error(`Failed to evaluate math expression "${expression}":`, error);
    return null; // Return null instead of undefined for consistency
  }
}

/**
 * Evaluates a string concatenation expression
 * 
 * @param expression - The expression to evaluate (e.g., "prefix" + $json.value)
 * @param context - The context for variable substitution
 * @returns The concatenated string
 */
export function evaluateStringConcatenation(expression: string, context: ExpressionContext = {}): string {
  try {
    // Check if the expression contains string concatenation
    if (expression.includes('+') && (expression.includes('"') || expression.includes("'"))) {
      // Split by + operator, but respect quotes
      const parts = [];
      let currentPart = '';
      let inSingleQuote = false;
      let inDoubleQuote = false;
      
      for (let i = 0; i < expression.length; i++) {
        const char = expression[i];
        
        if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote;
          currentPart += char;
        } else if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
          currentPart += char;
        } else if (char === '+' && !inSingleQuote && !inDoubleQuote) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      
      if (currentPart) {
        parts.push(currentPart.trim());
      }
      
      // Evaluate each part
      const evaluatedParts = parts.map(part => {
        // If it's a quoted string, remove the quotes
        if ((part.startsWith('"') && part.endsWith('"')) || 
            (part.startsWith("'") && part.endsWith("'"))) {
          return part.slice(1, -1);
        }
        
        // If it's a variable reference, get its value
        if (part.startsWith('$')) {
          const value = getValueByPath(context, part);
          return value !== undefined ? String(value) : '';
        }
        
        // Otherwise, try to evaluate it as an expression
        return String(evaluateExpression(part, context) || '');
      });
      
      // Join the parts
      return evaluatedParts.join('');
    }
    
    return expression;
  } catch (error) {
    console.error(`Failed to evaluate string concatenation "${expression}":`, error);
    return expression; // Return the original expression on error
  }
}

/**
 * Evaluates an expression using the given context
 * 
 * @param expression - The expression to evaluate
 * @param context - The context object containing variables for the expression
 * @returns The evaluated result, or null if evaluation fails
 */
export function evaluateExpression(expression: string, context: ExpressionContext = {}): any {
  // If the expression is wrapped in delimiters, extract it
  const extractedExpression = extractExpressionContent(expression);
  
  if (!extractedExpression) {
    return null;
  }
  
  try {
    // Check for string concatenation (e.g., "prefix" + $json.value)
    if (extractedExpression.includes('+') && 
        (extractedExpression.includes('"') || extractedExpression.includes("'"))) {
      return evaluateStringConcatenation(extractedExpression, context);
    }
    
    // Direct variable access (e.g., $json.data)
    if (extractedExpression.match(/^\$[a-zA-Z0-9_]+\.[a-zA-Z0-9_\.\[\]]+$/)) {
      return getValueByPath(context, extractedExpression);
    }
    
    // Mathematical operations
    if (extractedExpression.match(/[\+\-\*\/\(\)]/)) {
      return evaluateMathExpression(extractedExpression, context);
    }
    
    // If it's not a recognized pattern, try direct property access
    const result = getValueByPath(context, extractedExpression);
    return result !== undefined ? result : null;
  } catch (error) {
    console.error(`Failed to evaluate expression "${expression}":`, error);
    return null;
  }
}

/**
 * Processes a value that might contain an expression
 * If the value is an expression, evaluates it; otherwise returns the value as is
 * 
 * @param value - The value to process
 * @param context - The context for evaluation
 * @returns The processed value
 */
export function processValueWithPossibleExpression(value: any, context: ExpressionContext = {}): any {
  if (isExpression(value)) {
    return evaluateExpression(value, context);
  }
  
  return value;
}

/**
 * Processes an object recursively, evaluating any expressions found in its properties
 * 
 * @param obj - The object to process
 * @param context - The context for evaluating expressions
 * @returns A new object with all expressions evaluated
 */
export function processObjectWithExpressions(obj: Record<string, any>, context: ExpressionContext = {}): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result: Record<string, any> = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = processObjectWithExpressions(value, context);
    } else {
      result[key] = processValueWithPossibleExpression(value, context);
    }
  }
  
  return result;
} 