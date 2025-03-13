import fs from 'fs';
import path from 'path';
import { convertWorkflow } from '../../lib/converter';
import { compareWorkflows } from '../utils/test-helpers';

/**
 * Workflow Regression Test System
 * 
 * This system automatically tests a set of sample workflows and verifies
 * that the conversion results match the expected outputs.
 * 
 * To add a new regression test:
 * 1. Add a source workflow in __tests__/regression/sources/{platform}/{workflow-name}.json
 * 2. Add an expected output in __tests__/regression/expected/{target-platform}/{workflow-name}.json
 */

interface TestCase {
  name: string;
  sourcePath: string;
  expectedPath: string;
  sourcePlatform: 'n8n' | 'make';
  targetPlatform: 'n8n' | 'make';
}

// Map to track which workflows are failing conversion
const failingWorkflows: Record<string, string[]> = {
  'n8n-to-make': [],
  'make-to-n8n': []
};

/**
 * Discover all test cases from the filesystem
 */
export async function discoverTestCases(): Promise<TestCase[]> {
  const testCases: TestCase[] = [];
  const regressionPath = path.join(__dirname, 'sources');
  
  // Read n8n test cases
  const n8nSourcePath = path.join(regressionPath, 'n8n');
  if (fs.existsSync(n8nSourcePath)) {
    const n8nFiles = fs.readdirSync(n8nSourcePath).filter(f => f.endsWith('.json'));
    
    for (const file of n8nFiles) {
      const name = path.basename(file, '.json');
      const expectedPath = path.join(__dirname, 'expected', 'make', `${name}.json`);
      
      testCases.push({
        name,
        sourcePath: path.join(n8nSourcePath, file),
        expectedPath,
        sourcePlatform: 'n8n',
        targetPlatform: 'make'
      });
    }
  }
  
  // Read make test cases
  const makeSourcePath = path.join(regressionPath, 'make');
  if (fs.existsSync(makeSourcePath)) {
    const makeFiles = fs.readdirSync(makeSourcePath).filter(f => f.endsWith('.json'));
    
    for (const file of makeFiles) {
      const name = path.basename(file, '.json');
      const expectedPath = path.join(__dirname, 'expected', 'n8n', `${name}.json`);
      
      testCases.push({
        name,
        sourcePath: path.join(makeSourcePath, file),
        expectedPath,
        sourcePlatform: 'make',
        targetPlatform: 'n8n'
      });
    }
  }
  
  return testCases;
}

/**
 * Run all regression tests
 */
export async function runRegressionTests(): Promise<boolean> {
  const testCases = await discoverTestCases();
  console.log(`Running ${testCases.length} regression tests...`);
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const passed = await runSingleTest(testCase);
    if (!passed) {
      allPassed = false;
      const key = `${testCase.sourcePlatform}-to-${testCase.targetPlatform}`;
      failingWorkflows[key].push(testCase.name);
    }
  }
  
  // Print summary
  console.log('\nRegression Test Summary:');
  console.log('------------------------');
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${testCases.length - Object.values(failingWorkflows).flat().length}`);
  console.log(`Failed: ${Object.values(failingWorkflows).flat().length}`);
  
  if (Object.values(failingWorkflows).flat().length > 0) {
    console.log('\nFailing Workflows:');
    for (const [conversionType, workflows] of Object.entries(failingWorkflows)) {
      if (workflows.length > 0) {
        console.log(`\n${conversionType.toUpperCase()}:`);
        workflows.forEach(name => console.log(`  - ${name}`));
      }
    }
  }
  
  return allPassed;
}

/**
 * Run a single regression test
 */
async function runSingleTest(testCase: TestCase): Promise<boolean> {
  try {
    // Check if expected output exists
    if (!fs.existsSync(testCase.expectedPath)) {
      console.log(`⚠️  [${testCase.name}] No expected output file. Creating one from current conversion.`);
      
      // Load source workflow
      const sourceWorkflow = JSON.parse(fs.readFileSync(testCase.sourcePath, 'utf8'));
      
      // Convert it
      const result = await convertWorkflow(
        sourceWorkflow, 
        testCase.sourcePlatform, 
        testCase.targetPlatform
      );
      
      // Save as expected output
      fs.mkdirSync(path.dirname(testCase.expectedPath), { recursive: true });
      fs.writeFileSync(
        testCase.expectedPath, 
        JSON.stringify(result.convertedWorkflow, null, 2)
      );
      
      console.log(`✅ [${testCase.name}] Created new expected output.`);
      return true;
    }
    
    // Load source and expected workflows
    const sourceWorkflow = JSON.parse(fs.readFileSync(testCase.sourcePath, 'utf8'));
    const expectedWorkflow = JSON.parse(fs.readFileSync(testCase.expectedPath, 'utf8'));
    
    // Convert source workflow
    const result = await convertWorkflow(
      sourceWorkflow, 
      testCase.sourcePlatform, 
      testCase.targetPlatform
    );
    
    // Compare result with expected output
    const { matches, differences } = compareWorkflows(result.convertedWorkflow, expectedWorkflow);
    
    if (matches) {
      console.log(`✅ [${testCase.name}] Passed`);
      return true;
    } else {
      console.log(`❌ [${testCase.name}] Failed:`);
      differences.forEach(diff => console.log(`   - ${diff}`));
      return false;
    }
  } catch (error) {
    console.log(`❌ [${testCase.name}] Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Create directory structure for regression tests
 */
export function initializeRegressionTestStructure(): void {
  const directories = [
    path.join(__dirname, 'sources', 'n8n'),
    path.join(__dirname, 'sources', 'make'),
    path.join(__dirname, 'expected', 'n8n'),
    path.join(__dirname, 'expected', 'make'),
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Create README file
  const readmePath = path.join(__dirname, 'README.md');
  if (!fs.existsSync(readmePath)) {
    const readmeContent = `# Workflow Regression Tests

This directory contains regression tests for workflow conversions. The system automatically compares the conversion results with expected outputs to detect any regressions in the conversion logic.

## Adding a New Test

1. Add a source workflow in \`__tests__/regression/sources/{platform}/{workflow-name}.json\`
2. Run the tests once to generate an expected output in \`__tests__/regression/expected/{target-platform}/{workflow-name}.json\`
3. Verify that the generated expected output is correct
4. Future test runs will compare conversions against this expected output

## Running the Tests

Run all regression tests:

\`\`\`
npm run test:regression
\`\`\`
`;
    fs.writeFileSync(readmePath, readmeContent);
  }
  
  // Copy sample workflows to regression test directory
  const sampleN8nWorkflow = path.join(__dirname, '..', 'fixtures', 'sample-n8n-workflow.json');
  const sampleMakeWorkflow = path.join(__dirname, '..', 'fixtures', 'sample-make-workflow.json');
  
  if (fs.existsSync(sampleN8nWorkflow)) {
    fs.copyFileSync(
      sampleN8nWorkflow, 
      path.join(__dirname, 'sources', 'n8n', 'sample-workflow.json')
    );
  }
  
  if (fs.existsSync(sampleMakeWorkflow)) {
    fs.copyFileSync(
      sampleMakeWorkflow, 
      path.join(__dirname, 'sources', 'make', 'sample-workflow.json')
    );
  }
} 