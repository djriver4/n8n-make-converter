/**
 * Script to validate and fix mock data to conform to schemas
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  validateMakeWorkflow, 
  validateN8nWorkflow,
  formatValidationErrors 
} from '../lib/utils/validate-workflow';
import { MakeWorkflow, N8nWorkflow } from '../lib/schemas';

// Directories containing mock data
const FIXTURES_DIR = path.join(__dirname, '../__tests__/fixtures');
const MAKE_DIR = path.join(FIXTURES_DIR, 'make');
const N8N_DIR = path.join(FIXTURES_DIR, 'n8n');

/**
 * Validate and fix a Make.com workflow
 * @param filePath Path to the workflow file
 * @param output Whether to output detailed results
 * @returns Information about the validation
 */
function validateAndFixMakeWorkflow(filePath: string, output: boolean = true): {
  valid: boolean;
  originalPath: string;
  fixedPath?: string;
} {
  try {
    const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = validateMakeWorkflow(workflowData);
    
    if (output) {
      console.log(`\nValidating Make.com workflow: ${filePath}`);
      console.log(`Valid: ${result.valid}`);
      
      if (!result.valid && result.errors) {
        console.log('Errors:');
        formatValidationErrors(result.errors).forEach(err => console.log(`- ${err}`));
      }
    }
    
    if (!result.valid) {
      // Attempt to fix common issues
      const fixedWorkflow = fixMakeWorkflow(workflowData);
      const fixedResult = validateMakeWorkflow(fixedWorkflow);
      
      if (fixedResult.valid) {
        const fixedPath = filePath.replace(/\.json$/, '.fixed.json');
        fs.writeFileSync(fixedPath, JSON.stringify(fixedWorkflow, null, 2));
        
        if (output) {
          console.log(`\nFixed workflow saved to: ${fixedPath}`);
        }
        
        return {
          valid: true,
          originalPath: filePath,
          fixedPath
        };
      }
    }
    
    return {
      valid: result.valid,
      originalPath: filePath
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return {
      valid: false,
      originalPath: filePath
    };
  }
}

/**
 * Validate and fix an n8n workflow
 * @param filePath Path to the workflow file
 * @param output Whether to output detailed results
 * @returns Information about the validation
 */
function validateAndFixN8nWorkflow(filePath: string, output: boolean = true): {
  valid: boolean;
  originalPath: string;
  fixedPath?: string;
} {
  try {
    const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = validateN8nWorkflow(workflowData);
    
    if (output) {
      console.log(`\nValidating n8n workflow: ${filePath}`);
      console.log(`Valid: ${result.valid}`);
      
      if (!result.valid && result.errors) {
        console.log('Errors:');
        formatValidationErrors(result.errors).forEach(err => console.log(`- ${err}`));
      }
    }
    
    if (!result.valid) {
      // Attempt to fix common issues
      const fixedWorkflow = fixN8nWorkflow(workflowData);
      const fixedResult = validateN8nWorkflow(fixedWorkflow);
      
      if (fixedResult.valid) {
        const fixedPath = filePath.replace(/\.json$/, '.fixed.json');
        fs.writeFileSync(fixedPath, JSON.stringify(fixedWorkflow, null, 2));
        
        if (output) {
          console.log(`\nFixed workflow saved to: ${fixedPath}`);
        }
        
        return {
          valid: true,
          originalPath: filePath,
          fixedPath
        };
      }
    }
    
    return {
      valid: result.valid,
      originalPath: filePath
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return {
      valid: false,
      originalPath: filePath
    };
  }
}

/**
 * Fix common issues in Make.com workflows
 * @param workflow The workflow to fix
 * @returns The fixed workflow
 */
function fixMakeWorkflow(workflow: any): MakeWorkflow {
  // Start with creating a valid workflow structure
  const fixedWorkflow: MakeWorkflow = {
    name: workflow.name || 'Untitled Workflow',
    flow: []
  };
  
  // Copy any extra properties from the original workflow
  Object.keys(workflow).forEach(key => {
    if (key !== 'name' && key !== 'flow') {
      (fixedWorkflow as any)[key] = workflow[key];
    }
  });
  
  // Fix the flow modules
  if (Array.isArray(workflow.flow)) {
    fixedWorkflow.flow = workflow.flow.map((module: any) => {
      // Ensure each module has required properties
      return {
        id: module.id || `${Date.now()}`,
        name: module.name || 'Unnamed Module',
        type: module.type || 'unknown',
        parameters: module.parameters || {},
        metadata: module.metadata || {
          designer: {
            x: 0,
            y: 0
          }
        }
      };
    });
  }
  
  return fixedWorkflow;
}

/**
 * Fix common issues in n8n workflows
 * @param workflow The workflow to fix
 * @returns The fixed workflow
 */
function fixN8nWorkflow(workflow: any): N8nWorkflow {
  // Create a valid basic structure
  const fixedWorkflow: Partial<N8nWorkflow> = {
    nodes: [],
    connections: {}
  };
  
  // Copy the name if it exists
  if (workflow.name) {
    fixedWorkflow.name = workflow.name;
  } else {
    fixedWorkflow.name = 'Untitled Workflow';
  }
  
  // Set active status
  fixedWorkflow.active = workflow.active === undefined ? true : workflow.active;
  
  // Fix nodes
  if (Array.isArray(workflow.nodes)) {
    fixedWorkflow.nodes = workflow.nodes.map((node: any) => {
      return {
        id: node.id || `node_${Date.now()}`,
        name: node.name || 'Unnamed Node',
        type: node.type || 'n8n-nodes-base.unknown',
        parameters: node.parameters || {},
        position: Array.isArray(node.position) ? node.position : [0, 0]
      };
    });
  }
  
  // Fix connections
  if (workflow.connections) {
    fixedWorkflow.connections = workflow.connections;
  }
  
  // Copy other optional properties
  ['settings', 'tags', 'pinData', 'versionId', 'staticData'].forEach(key => {
    if (workflow[key] !== undefined) {
      (fixedWorkflow as any)[key] = workflow[key];
    }
  });
  
  return fixedWorkflow as N8nWorkflow;
}

/**
 * Scan a directory for workflow files and validate/fix them
 * @param directory Directory to scan
 * @param validateFn Validation function to use
 */
function scanAndFixDirectory(directory: string, validateFn: Function): void {
  if (!fs.existsSync(directory)) {
    console.log(`Directory not found: ${directory}`);
    return;
  }
  
  const files = fs.readdirSync(directory)
    .filter(file => file.endsWith('.json') && !file.includes('.fixed.'));
  
  console.log(`\nScanning ${directory} (${files.length} files found)`);
  
  let validCount = 0;
  let fixedCount = 0;
  let invalidCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const result = validateFn(filePath, false);
    
    if (result.valid) {
      validCount++;
    } else if (result.fixedPath) {
      fixedCount++;
      console.log(`Fixed: ${file} -> ${path.basename(result.fixedPath)}`);
    } else {
      invalidCount++;
      console.log(`Invalid: ${file}`);
    }
  });
  
  console.log(`\nResults for ${directory}:`);
  console.log(`- Valid: ${validCount}`);
  console.log(`- Fixed: ${fixedCount}`);
  console.log(`- Still Invalid: ${invalidCount}`);
}

// Main execution
console.log('=== Mock Data Validation and Fixing Tool ===');

// Process any specific files passed as arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  args.forEach(arg => {
    if (fs.existsSync(arg)) {
      if (arg.includes('make')) {
        validateAndFixMakeWorkflow(arg);
      } else if (arg.includes('n8n')) {
        validateAndFixN8nWorkflow(arg);
      } else {
        console.log(`Cannot determine workflow type for ${arg}`);
      }
    } else {
      console.log(`File not found: ${arg}`);
    }
  });
} else {
  // Scan directories
  scanAndFixDirectory(MAKE_DIR, validateAndFixMakeWorkflow);
  scanAndFixDirectory(N8N_DIR, validateAndFixN8nWorkflow);
  
  // Also validate the sample files
  console.log('\n=== Validating Sample Files ===');
  validateAndFixMakeWorkflow(path.join(FIXTURES_DIR, 'sample-make-workflow.json'));
  validateAndFixN8nWorkflow(path.join(FIXTURES_DIR, 'sample-n8n-workflow.json'));
}

console.log('\nValidation complete!'); 