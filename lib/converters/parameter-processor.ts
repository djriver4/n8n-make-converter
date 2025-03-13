import { 
  isExpression, 
  processValueWithPossibleExpression, 
  processObjectWithExpressions,
  ExpressionContext
} from '../expression-evaluator';

/**
 * Processes node parameters for n8n to Make conversion.
 * Handles expression conversion and evaluation.
 */
export class NodeParameterProcessor {
  /**
   * Converts n8n expressions in parameters to Make.com format
   * 
   * @param params - The n8n parameters to convert
   * @param context - Optional context for expression evaluation
   * @returns Converted parameters
   */
  static convertN8nToMakeParameters(
    params: Record<string, any>, 
    context?: ExpressionContext
  ): Record<string, any> {
    if (!params || typeof params !== 'object') {
      return params;
    }

    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        result[key] = this.convertN8nToMakeParameters(value, context);
      } else if (typeof value === 'string' && value.includes('={{') && value.includes('}}')) {
        // Handle expression conversion
        result[key] = this.convertN8nToMakeExpression(value, context);
      } else {
        // Pass through non-expression values
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Converts Make.com expressions in parameters to n8n format
   * 
   * @param params - The Make.com parameters to convert
   * @param context - Optional context for expression evaluation
   * @returns Converted parameters
   */
  static convertMakeToN8nParameters(
    params: Record<string, any>, 
    context?: ExpressionContext
  ): Record<string, any> {
    if (!params || typeof params !== 'object') {
      return params;
    }

    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        result[key] = this.convertMakeToN8nParameters(value, context);
      } else if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        // Handle expression conversion
        result[key] = this.convertMakeToN8nExpression(value, context);
      } else {
        // Pass through non-expression values
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Converts an n8n expression to Make.com format
   * 
   * @param expression - The n8n expression to convert
   * @param context - Optional context for expression evaluation
   * @returns Converted expression in Make.com format
   */
  static convertN8nToMakeExpression(expression: string, context?: ExpressionContext): string {
    if (!expression || typeof expression !== 'string') {
      return expression;
    }

    // Check if this is a pure n8n expression (the entire string is an expression)
    if (expression.startsWith('={{') && expression.endsWith('}}')) {
      // Extract the expression content (remove the '={{' prefix and '}}' suffix)
      const extractedContent = expression.slice(3, -2).trim();
      
      // Convert n8n $json references to Make.com format
      let makeExpression = extractedContent;
      
      // Wrap in Make.com expression syntax
      return `{{${makeExpression}}}`;
    } 
    // Check if this is a string with embedded expressions
    else if (expression.includes('={{') && expression.includes('}}')) {
      // For now, just return the original expression
      // In a more complete implementation, we would parse and convert embedded expressions
      return expression;
    }
    
    return expression;
  }

  /**
   * Converts a Make.com expression to n8n format
   * 
   * @param expression - The Make.com expression to convert
   * @param context - Optional context for expression evaluation
   * @returns Converted expression in n8n format
   */
  static convertMakeToN8nExpression(expression: string, context?: ExpressionContext): string {
    if (!expression || typeof expression !== 'string') {
      return expression;
    }

    // Check if this is a pure Make.com expression (the entire string is an expression)
    if (expression.startsWith('{{') && expression.endsWith('}}')) {
      // Extract the expression content (remove the '{{' prefix and '}}' suffix)
      const extractedContent = expression.slice(2, -2).trim();
      
      // Wrap in n8n expression syntax
      return `={{ ${extractedContent} }}`;
    }
    // Check if this is a string with embedded expressions
    else if (expression.includes('{{') && expression.includes('}}')) {
      // For now, just return the original expression
      // In a more complete implementation, we would parse and convert embedded expressions
      return expression;
    }
    
    return expression;
  }

  /**
   * Identifies parameters that contain expressions for review
   * 
   * @param params - The parameters to analyze
   * @returns List of parameter paths containing expressions
   */
  static identifyExpressionsForReview(params: Record<string, any>): string[] {
    const expressionPaths: string[] = [];
    
    const findExpressions = (obj: Record<string, any>, path: string = '') => {
      if (!obj || typeof obj !== 'object') {
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          findExpressions(value, currentPath);
        } else if (
          (typeof value === 'string') && 
          (value.includes('={{') || value.includes('{{'))
        ) {
          expressionPaths.push(currentPath);
        }
      }
    };
    
    findExpressions(params);
    return expressionPaths;
  }
  
  /**
   * Evaluates all expressions in the parameters using the provided context
   * 
   * @param params - The parameters containing expressions to evaluate
   * @param context - The context for expression evaluation
   * @returns Parameters with expressions evaluated
   */
  static evaluateExpressions(
    params: Record<string, any>, 
    context: ExpressionContext
  ): Record<string, any> {
    if (!params || typeof params !== 'object') {
      return params;
    }

    const result: Record<string, any> = Array.isArray(params) ? [] : {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = this.evaluateExpressions(value, context);
      } else if (typeof value === 'string' && isExpression(value)) {
        const evaluated = processValueWithPossibleExpression(value, context);
        result[key] = evaluated !== null ? evaluated : value;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
} 