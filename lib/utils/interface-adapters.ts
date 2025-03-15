/**
 * Interface Adapters
 * 
 * This module provides adapter functions to convert between different interfaces
 * used in the codebase, ensuring backward compatibility with older code.
 * 
 * @module utils/interface-adapters
 */

import { 
  ConversionLog,
  ParameterReview,
  WorkflowDebugInfo,
  ConversionResult,
  WorkflowConversionResult
} from "../workflow-converter";
import { N8nWorkflow, MakeWorkflow } from "../node-mappings/node-types";

/**
 * Convert from WorkflowConversionResult to ConversionResult
 * 
 * This allows newer internal code that uses WorkflowConversionResult
 * to be compatible with older code expecting ConversionResult.
 * 
 * @example
 * ```typescript
 * // Internal function that returns the new interface
 * function internalProcess(): WorkflowConversionResult {
 *   // Processing logic
 *   return result;
 * }
 * 
 * // Public API function that maintains backward compatibility
 * function publicApi(): ConversionResult {
 *   const result = internalProcess();
 *   return toConversionResult(result);
 * }
 * ```
 * 
 * @param result - The modern WorkflowConversionResult to convert
 * @returns A backward-compatible ConversionResult
 */
export function toConversionResult(result: WorkflowConversionResult): ConversionResult {
  return {
    convertedWorkflow: result.convertedWorkflow,
    logs: result.logs,
    parametersNeedingReview: result.paramsNeedingReview.map(p => 
      `${p.nodeId} - ${p.parameters.join(', ')}: ${p.reason}`
    ),
    unmappedNodes: result.unmappedNodes,
    isValidInput: !result.logs.some(log => 
      log.type === 'error' && log.message.includes('Invalid')
    ),
    debug: result.debug
  };
}

/**
 * Convert from ConversionResult to WorkflowConversionResult
 * 
 * This allows older code using ConversionResult to work with
 * newer code expecting WorkflowConversionResult.
 * 
 * The function carefully handles potential missing properties in the input object,
 * making it robust against partial or malformed input data.
 * 
 * @example
 * ```typescript
 * // External function that returns the old interface
 * function externalFunction(): ConversionResult {
 *   // External logic
 *   return oldResult;
 * }
 * 
 * // Internal function that expects the new interface
 * function internalProcess(result: WorkflowConversionResult) {
 *   const modernResult = toWorkflowConversionResult(externalFunction());
 *   // Process with new interface
 * }
 * ```
 * 
 * @param result - The legacy ConversionResult to convert
 * @returns A modern WorkflowConversionResult
 */
export function toWorkflowConversionResult(result: ConversionResult): WorkflowConversionResult {
  // Parse parameter reviews from string format to structured format
  const paramsNeedingReview: ParameterReview[] = [];
  
  // Handle cases where parametersNeedingReview might not exist in ConversionResult
  if (result.parametersNeedingReview) {
    result.parametersNeedingReview.forEach(paramStr => {
      const matches = paramStr.match(/^([^-]+) - ([^:]+): (.+)$/);
      if (matches && matches.length === 4) {
        paramsNeedingReview.push({
          nodeId: matches[1].trim(),
          parameters: matches[2].split(',').map(p => p.trim()),
          reason: matches[3].trim()
        });
      } else {
        paramsNeedingReview.push({
          nodeId: 'unknown',
          parameters: ['unknown'],
          reason: paramStr
        });
      }
    });
  }

  // Create a structured debug info object
  const debugInfo: WorkflowDebugInfo = {
    mappedModules: [],
    unmappedModules: [],
    mappedNodes: [],
    unmappedNodes: []
  };

  // Extract debug info if available
  if (result.debug) {
    if (Array.isArray(result.debug.mappedModules)) {
      debugInfo.mappedModules = result.debug.mappedModules;
    }
    if (Array.isArray(result.debug.unmappedModules)) {
      debugInfo.unmappedModules = result.debug.unmappedModules;
    }
    if (Array.isArray(result.debug.mappedNodes)) {
      debugInfo.mappedNodes = result.debug.mappedNodes;
    }
    if (Array.isArray(result.debug.unmappedNodes)) {
      debugInfo.unmappedNodes = result.debug.unmappedNodes;
    }
  }

  return {
    convertedWorkflow: result.convertedWorkflow as (N8nWorkflow | MakeWorkflow),
    logs: result.logs,
    paramsNeedingReview,
    unmappedNodes: result.unmappedNodes || [],
    debug: debugInfo
  };
} 