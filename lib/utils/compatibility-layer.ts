/**
 * Compatibility Layer
 * 
 * This module provides adapter functions for converting between modern and legacy
 * interface formats for the n8n-make-converter. It ensures backward compatibility
 * while allowing for a cleaner modern interface design.
 * 
 * The module provides:
 * - Type validation functions
 * - Conversion between WorkflowConversionResult (modern) and ConversionResult (legacy)
 * - Robust error handling for all conversions
 * - ISO timestamp standardization
 * 
 * @example Converting modern to legacy result
 * ```typescript
 * import { convertToLegacyResult } from '../utils/compatibility-layer';
 * 
 * // Internal function that uses modern interface
 * function internalConvert(): WorkflowConversionResult {
 *   // ... processing logic
 *   return modernResult;
 * }
 * 
 * // Public API that needs to maintain backward compatibility
 * function publicConvert(): ConversionResult {
 *   const modernResult = internalConvert();
 *   return convertToLegacyResult(modernResult);
 * }
 * ```
 * 
 * @example Converting legacy to modern result
 * ```typescript
 * import { convertToModernResult } from '../utils/compatibility-layer';
 * 
 * // External function that returns legacy format
 * function externalConvert(): ConversionResult {
 *   // ... processing logic
 *   return legacyResult;
 * }
 * 
 * // Internal function that expects modern format
 * function internalProcess(result: WorkflowConversionResult) {
 *   const modernResult = convertToModernResult(externalConvert());
 *   // ... process with modern interface
 * }
 * ```
 */

import { 
  ConversionLog, 
  ConversionResult, 
  ParameterReview, 
  WorkflowConversionResult,
  WorkflowDebugInfo
} from '../workflow-converter';

// Constants for validation
const VALID_LOG_TYPES = ['info', 'warning', 'error', 'debug'];

/**
 * Creates an ISO timestamp string for current time
 * 
 * @returns A standardized ISO timestamp string
 * 
 * @example
 * ```typescript
 * const timestamp = createTimestamp();
 * // '2023-05-01T14:30:45.123Z'
 * ```
 */
export function createTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validates and normalizes a log entry to ensure it has the correct structure
 * 
 * @param entry - The log entry to normalize (can be string, object, or any other type)
 * @returns A properly formatted ConversionLog object
 * 
 * @example
 * ```typescript
 * // Normalizing a string
 * const stringLog = ensureValidLogEntry('Error occurred');
 * // { type: 'info', message: 'Error occurred', timestamp: '2023-05-01T14:30:45.123Z' }
 * 
 * // Normalizing an object with missing properties
 * const incompleteLog = ensureValidLogEntry({ message: 'Missing type' });
 * // { type: 'info', message: 'Missing type', timestamp: '2023-05-01T14:30:45.123Z' }
 * 
 * // Normalizing an invalid type
 * const invalidTypeLog = ensureValidLogEntry({ type: 'not-valid', message: 'Test' });
 * // { type: 'info', message: 'Test', timestamp: '2023-05-01T14:30:45.123Z' }
 * ```
 */
export function ensureValidLogEntry(entry: any): ConversionLog {
  // If entry is not an object, create a structured log
  if (typeof entry !== 'object' || entry === null) {
    return {
      type: 'info',
      message: String(entry),
      timestamp: createTimestamp()
    };
  }

  // Ensure valid type
  const type = VALID_LOG_TYPES.includes(entry.type) ? entry.type : 'info';
  
  // Ensure message exists
  const message = entry.message ? String(entry.message) : 'No message provided';
  
  // Ensure timestamp
  const timestamp = entry.timestamp || createTimestamp();

  return { type, message, timestamp };
}

/**
 * Creates a default debug info object with empty arrays for all required properties
 * 
 * @returns A properly structured WorkflowDebugInfo object
 */
export function createDefaultDebugInfo(): WorkflowDebugInfo {
  return {
    mappedModules: [],
    unmappedModules: [],
    mappedNodes: [],
    unmappedNodes: []
  };
}

/**
 * Ensures the input is a valid array, returning an empty array if not
 * 
 * @param input - The potentially array-like object to check
 * @returns A valid array (either the original if it was an array, or an empty array)
 * 
 * @example
 * ```typescript
 * ensureArray([1, 2, 3]); // [1, 2, 3]
 * ensureArray(null);      // []
 * ensureArray('string');  // []
 * ensureArray(undefined); // []
 * ```
 */
export function ensureArray<T>(input: unknown): T[] {
  return Array.isArray(input) ? input : [];
}

/**
 * Validates a modern WorkflowConversionResult
 * 
 * @param result - The object to validate
 * @returns True if valid, false otherwise
 */
export function isValidWorkflowConversionResult(result: any): boolean {
  return result !== null && 
         typeof result === 'object' && 
         typeof result.convertedWorkflow === 'object';
}

/**
 * Validates a legacy ConversionResult
 * 
 * @param result - The object to validate
 * @returns True if valid, false otherwise
 */
export function isValidConversionResult(result: any): boolean {
  return result !== null && 
         typeof result === 'object' && 
         typeof result.convertedWorkflow === 'object';
}

/**
 * Creates an error result in the modern format
 * 
 * @param errorMessage - The error message to include
 * @returns A valid WorkflowConversionResult with error information
 */
export function createErrorWorkflowResult(errorMessage: string): WorkflowConversionResult {
  return {
    convertedWorkflow: { name: 'Error', nodes: [] },
    logs: [{ 
      type: 'error', 
      message: errorMessage, 
      timestamp: createTimestamp() 
    }],
    paramsNeedingReview: [],
    unmappedNodes: [],
    debug: createDefaultDebugInfo()
  };
}

/**
 * Creates an error result in the legacy format
 * 
 * @param errorMessage - The error message to include
 * @returns A valid ConversionResult with error information
 */
export function createErrorConversionResult(errorMessage: string): ConversionResult {
  return {
    convertedWorkflow: { name: 'Error', nodes: [] },
    logs: [{ 
      type: 'error', 
      message: errorMessage, 
      timestamp: createTimestamp() 
    }],
    parametersNeedingReview: [],
    unmappedNodes: [],
    isValidInput: false,
    debug: createDefaultDebugInfo()
  };
}

/**
 * Converts parameter reviews from structured format to string format
 * 
 * @param review - The structured parameter review to convert
 * @returns A string representation in the format "nodeId - param1, param2: reason"
 * 
 * @example
 * ```typescript
 * const review = {
 *   nodeId: 'HTTP Request',
 *   parameters: ['url', 'method'],
 *   reason: 'Complex expression'
 * };
 * 
 * paramReviewToString(review); 
 * // 'HTTP Request - url, method: Complex expression'
 * ```
 */
export function paramReviewToString(review: ParameterReview): string {
  try {
    const nodeId = review.nodeId || 'unknown';
    const params = Array.isArray(review.parameters) && review.parameters.length > 0 
      ? review.parameters.join(', ') 
      : 'unknown';
    const reason = review.reason || '';
    
    return `${nodeId} - ${params}: ${reason}`;
  } catch (error) {
    return 'unknown - unknown: Error in parameter format';
  }
}

/**
 * Converts parameter reviews from string format to structured format
 * 
 * @param str - The string to parse in the format "nodeId - param1, param2: reason"
 * @returns A structured ParameterReview object
 * 
 * @example
 * ```typescript
 * const str = 'HTTP Request - url, method: Complex expression';
 * 
 * stringToParamReview(str);
 * // {
 * //   nodeId: 'HTTP Request',
 * //   parameters: ['url', 'method'],
 * //   reason: 'Complex expression'
 * // }
 * ```
 */
export function stringToParamReview(str: string): ParameterReview {
  try {
    if (typeof str !== 'string') {
      return { 
        nodeId: 'unknown', 
        parameters: ['unknown'], 
        reason: `Parse error: ${String(str)}` 
      };
    }

    // Split by the first colon to separate reason
    const colonIndex = str.indexOf(': ');
    let nodePart = str;
    let reason = '';
    
    if (colonIndex !== -1) {
      nodePart = str.substring(0, colonIndex);
      reason = str.substring(colonIndex + 2);
    }
    
    // Split the node part by the first " - " to separate nodeId and parameters
    const dashIndex = nodePart.indexOf(' - ');
    
    if (dashIndex === -1) {
      return { 
        nodeId: 'unknown', 
        parameters: ['unknown'], 
        reason: str 
      };
    }
    
    const nodeId = nodePart.substring(0, dashIndex);
    const paramStr = nodePart.substring(dashIndex + 3);
    const parameters = paramStr.split(', ').filter(p => p.trim().length > 0);
    
    return {
      nodeId,
      parameters: parameters.length > 0 ? parameters : ['unknown'],
      reason
    };
  } catch (error) {
    return { 
      nodeId: 'unknown', 
      parameters: ['unknown'], 
      reason: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Converts a modern WorkflowConversionResult to a legacy ConversionResult
 * 
 * This function enables backward compatibility when internal code uses the
 * modern interface but needs to expose a legacy interface to external users.
 * It handles all error cases and ensures a valid result is always returned.
 * 
 * @param result - The modern result to convert
 * @returns A backward-compatible ConversionResult
 * 
 * @example
 * ```typescript
 * const modernResult = {
 *   convertedWorkflow: { name: 'Workflow', nodes: [] },
 *   logs: [{ type: 'info', message: 'Converted', timestamp: '2023-01-01T00:00:00.000Z' }],
 *   paramsNeedingReview: [{ nodeId: 'HTTP', parameters: ['url'], reason: 'Complex' }],
 *   unmappedNodes: ['CustomNode'],
 *   debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
 * };
 * 
 * const legacyResult = convertToLegacyResult(modernResult);
 * // {
 * //   convertedWorkflow: { name: 'Workflow', nodes: [] },
 * //   logs: [{ type: 'info', message: 'Converted', timestamp: '2023-01-01T00:00:00.000Z' }],
 * //   parametersNeedingReview: ['HTTP - url: Complex'],
 * //   unmappedNodes: ['CustomNode'],
 * //   isValidInput: true,
 * //   debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
 * // }
 * ```
 */
export function convertToLegacyResult(result: WorkflowConversionResult): ConversionResult {
  // Handle invalid input
  if (!isValidWorkflowConversionResult(result)) {
    return createErrorConversionResult('Invalid workflow conversion result');
  }
  
  try {
    // Convert logs - ensure they all have the right structure
    const logs = Array.isArray(result.logs) 
      ? result.logs.map(entry => ensureValidLogEntry(entry))
      : [];
    
    // Convert parameter reviews to strings
    const parametersNeedingReview = Array.isArray(result.paramsNeedingReview)
      ? result.paramsNeedingReview.map(paramReviewToString)
      : [];
    
    // Ensure unmapped nodes is an array
    const unmappedNodes = ensureArray<string>(result.unmappedNodes);
    
    // Check for validation errors in logs to determine isValidInput
    const hasValidationErrors = logs.some(log => 
      log.type === 'error' && 
      (log.message.includes('Invalid') || log.message.includes('validation'))
    );
    
    // Construct the legacy result
    const conversionResult: ConversionResult = {
      convertedWorkflow: result.convertedWorkflow,
      logs,
      parametersNeedingReview,
      unmappedNodes,
      isValidInput: !hasValidationErrors,
      debug: result.debug || createDefaultDebugInfo()
    };
    
    return conversionResult;
  } catch (error) {
    // If any error occurs during conversion, return an error result
    return createErrorConversionResult(
      `Error converting to legacy result: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Converts a legacy ConversionResult to a modern WorkflowConversionResult
 * 
 * This function enables forward compatibility when external code uses the
 * legacy interface but internal code expects the modern interface.
 * It handles all error cases and ensures a valid result is always returned.
 * 
 * @param result - The legacy result to convert
 * @returns A modern WorkflowConversionResult
 * 
 * @example
 * ```typescript
 * const legacyResult = {
 *   convertedWorkflow: { name: 'Workflow', nodes: [] },
 *   logs: [{ type: 'info', message: 'Converted', timestamp: '2023-01-01T00:00:00.000Z' }],
 *   parametersNeedingReview: ['HTTP - url: Complex'],
 *   unmappedNodes: ['CustomNode'],
 *   isValidInput: true,
 *   debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
 * };
 * 
 * const modernResult = convertToModernResult(legacyResult);
 * // {
 * //   convertedWorkflow: { name: 'Workflow', nodes: [] },
 * //   logs: [{ type: 'info', message: 'Converted', timestamp: '2023-01-01T00:00:00.000Z' }],
 * //   paramsNeedingReview: [{ nodeId: 'HTTP', parameters: ['url'], reason: 'Complex' }],
 * //   unmappedNodes: ['CustomNode'],
 * //   debug: { mappedModules: [], unmappedModules: [], mappedNodes: [], unmappedNodes: [] }
 * // }
 * ```
 */
export function convertToModernResult(result: ConversionResult): WorkflowConversionResult {
  // Handle invalid input
  if (!isValidConversionResult(result)) {
    return createErrorWorkflowResult('Invalid conversion result');
  }
  
  try {
    // Convert logs - ensure they all have the right structure
    const logs = Array.isArray(result.logs) 
      ? result.logs.map(entry => ensureValidLogEntry(entry))
      : [];
    
    // Convert string parameter reviews to structured format
    const paramsNeedingReview = Array.isArray(result.parametersNeedingReview)
      ? result.parametersNeedingReview.map(str => {
          try {
            return stringToParamReview(String(str));
          } catch (error) {
            return { 
              nodeId: 'unknown', 
              parameters: ['unknown'], 
              reason: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        })
      : [];
    
    // Ensure unmapped nodes is an array
    const unmappedNodes = ensureArray<string>(result.unmappedNodes);
    
    // Validate debug info or create default if invalid
    let debug = createDefaultDebugInfo();
    
    if (result.debug && typeof result.debug === 'object') {
      debug = {
        mappedModules: ensureArray(result.debug.mappedModules),
        unmappedModules: ensureArray(result.debug.unmappedModules),
        mappedNodes: ensureArray(result.debug.mappedNodes),
        unmappedNodes: ensureArray(result.debug.unmappedNodes)
      };
    }
    
    // Construct the modern result
    const workflowResult: WorkflowConversionResult = {
      convertedWorkflow: result.convertedWorkflow,
      logs,
      paramsNeedingReview,
      unmappedNodes,
      debug
    };
    
    return workflowResult;
  } catch (error) {
    // If any error occurs during conversion, return an error result
    return createErrorWorkflowResult(
      `Error converting to modern result: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Export aliases for backwards compatibility
/**
 * Alias for convertToLegacyResult - maintained for backwards compatibility
 */
export const toConversionResult = convertToLegacyResult;

/**
 * Alias for convertToModernResult - maintained for backwards compatibility
 */
export const toWorkflowConversionResult = convertToModernResult; 