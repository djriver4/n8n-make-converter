import fs from 'fs';
import path from 'path';
import { deepEqual } from 'fast-equals';

/**
 * Loads a fixture file from the fixtures directory
 */
export function loadFixture(platform: 'n8n' | 'make', name: string): any {
  const fixturePath = path.join(__dirname, '..', 'fixtures', `${platform}`, `${name}.json`);
  
  try {
    const fileContents = fs.readFileSync(fixturePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    throw new Error(`Failed to load fixture: ${fixturePath} - ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Compare two workflows and return whether they match and any differences found
 */
export function compareWorkflows(
  actual: any, 
  expected: any, 
  options: { 
    ignoreFields?: string[],
    path?: string 
  } = {}
): { matches: boolean; differences: string[] } {
  const differences: string[] = [];
  const currentPath = options.path || '';
  const ignoreFields = options.ignoreFields || ['id', 'position', 'createdAt', 'updatedAt'];
  
  // If one is null/undefined and the other isn't
  if ((actual === null || actual === undefined) !== (expected === null || expected === undefined)) {
    differences.push(`${currentPath}: One value is ${actual === null ? 'null' : 'undefined'} while the other is defined`);
    return { matches: false, differences };
  }
  
  // Both null or undefined - considered equal
  if (actual === null || actual === undefined) {
    return { matches: true, differences };
  }
  
  // Different types
  if (typeof actual !== typeof expected) {
    differences.push(`${currentPath}: Type mismatch - ${typeof actual} vs ${typeof expected}`);
    return { matches: false, differences };
  }
  
  // Compare arrays
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      differences.push(`${currentPath}: Array length mismatch - ${actual.length} vs ${expected.length}`);
      return { matches: false, differences };
    }
    
    // Different array comparison strategies based on the path
    if (currentPath.endsWith('nodes') || currentPath.includes('.nodes')) {
      // For nodes arrays, compare by name rather than position
      const actualNames = actual.map((node: any) => node.name).sort();
      const expectedNames = expected.map((node: any) => node.name).sort();
      
      if (!deepEqual(actualNames, expectedNames)) {
        differences.push(`${currentPath}: Node names do not match`);
      }
      
      // Check each node by name
      for (let i = 0; i < actual.length; i++) {
        const actualNode = actual[i];
        const expectedNode = expected.find((node: any) => node.name === actualNode.name);
        
        if (!expectedNode) {
          differences.push(`${currentPath}: Node "${actualNode.name}" is in actual but not in expected`);
          continue;
        }
        
        const result = compareWorkflows(
          actualNode, 
          expectedNode, 
          { 
            ignoreFields,
            path: `${currentPath}.${actualNode.name}` 
          }
        );
        
        if (!result.matches) {
          differences.push(...result.differences);
        }
      }
    } else {
      // For other arrays, compare items in order
      for (let i = 0; i < actual.length; i++) {
        const result = compareWorkflows(
          actual[i], 
          expected[i], 
          { 
            ignoreFields,
            path: `${currentPath}[${i}]` 
          }
        );
        
        if (!result.matches) {
          differences.push(...result.differences);
        }
      }
    }
  } 
  // Compare objects
  else if (typeof actual === 'object' && typeof expected === 'object') {
    // Get all keys from both objects
    const actualKeys = Object.keys(actual).filter(key => !ignoreFields.includes(key));
    const expectedKeys = Object.keys(expected).filter(key => !ignoreFields.includes(key));
    
    // Check for missing or extra keys
    const extraKeys = actualKeys.filter(key => !expectedKeys.includes(key));
    const missingKeys = expectedKeys.filter(key => !actualKeys.includes(key));
    
    if (extraKeys.length > 0) {
      differences.push(`${currentPath}: Extra keys found: ${extraKeys.join(', ')}`);
    }
    
    if (missingKeys.length > 0) {
      differences.push(`${currentPath}: Missing keys: ${missingKeys.join(', ')}`);
    }
    
    // Compare values for common keys
    for (const key of actualKeys) {
      if (expectedKeys.includes(key)) {
        const result = compareWorkflows(
          actual[key], 
          expected[key], 
          { 
            ignoreFields,
            path: currentPath ? `${currentPath}.${key}` : key 
          }
        );
        
        if (!result.matches) {
          differences.push(...result.differences);
        }
      }
    }
  }
  // Compare primitives
  else if (actual !== expected) {
    differences.push(`${currentPath}: Value mismatch - ${actual} vs ${expected}`);
  }
  
  return { 
    matches: differences.length === 0,
    differences
  };
}

/**
 * Custom matcher for comparing workflow structures
 */
export function toMatchWorkflowStructure(received: any, expected: any, options: any = {}) {
  const { matches, differences } = compareWorkflows(received, expected, options);
  
  if (matches) {
    return {
      message: () => 'Workflow structures match',
      pass: true
    };
  } else {
    return {
      message: () => `Workflow structures don't match:\n${differences.map(d => `- ${d}`).join('\n')}`,
      pass: false
    };
  }
}

/**
 * Validates parameter conversion between platforms
 * Returns information about parameters that need manual adjustment
 */
export function validateParameterConversion(workflow: any, options: { platform: 'n8n' | 'make' } = { platform: 'n8n' }) {
  const manualAdjustments: Record<string, any> = {};
  let totalParams = 0;
  let manualCount = 0;
  
  if (options.platform === 'n8n') {
    // For n8n workflows, check nodes with __stubInfo
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      workflow.nodes.forEach((node: any) => {
        if (node.parameters && node.parameters.__stubInfo) {
          manualAdjustments[node.name] = {
            nodeType: node.type,
            originalType: node.parameters.__stubInfo.originalModuleType,
            reason: 'Unsupported module type',
          };
          manualCount++;
        }
      });
      totalParams = workflow.nodes.length;
    }
  } else {
    // For Make.com workflows
    if (workflow.flow && Array.isArray(workflow.flow)) {
      workflow.flow.forEach((module: any) => {
        if (module.mapper && module.mapper.__stubInfo) {
          manualAdjustments[module.name] = {
            moduleType: module.module,
            originalType: module.mapper.__stubInfo.originalNodeType,
            reason: 'Unsupported node type',
          };
          manualCount++;
        }
      });
      totalParams = workflow.flow.length;
    }
  }
  
  return {
    valid: manualCount === 0,
    manualAdjustments,
    conversionRate: totalParams > 0 ? ((totalParams - manualCount) / totalParams) * 100 : 100,
  };
}
