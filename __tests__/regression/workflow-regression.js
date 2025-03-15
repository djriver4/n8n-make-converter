"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverTestCases = discoverTestCases;
exports.runRegressionTests = runRegressionTests;
exports.initializeRegressionTestStructure = initializeRegressionTestStructure;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const converter_1 = require("../../lib/converter");
const test_helpers_1 = require("../utils/test-helpers");
// Map to track which workflows are failing conversion
const failingWorkflows = {
    'n8n-to-make': [],
    'make-to-n8n': []
};
/**
 * Discover all test cases from the filesystem
 */
function discoverTestCases() {
    return __awaiter(this, void 0, void 0, function* () {
        const testCases = [];
        const regressionPath = path_1.default.join(__dirname, 'sources');
        // Read n8n test cases
        const n8nSourcePath = path_1.default.join(regressionPath, 'n8n');
        if (fs_1.default.existsSync(n8nSourcePath)) {
            const n8nFiles = fs_1.default.readdirSync(n8nSourcePath).filter(f => f.endsWith('.json'));
            for (const file of n8nFiles) {
                const name = path_1.default.basename(file, '.json');
                const expectedPath = path_1.default.join(__dirname, 'expected', 'make', `${name}.json`);
                testCases.push({
                    name,
                    sourcePath: path_1.default.join(n8nSourcePath, file),
                    expectedPath,
                    sourcePlatform: 'n8n',
                    targetPlatform: 'make'
                });
            }
        }
        // Read make test cases
        const makeSourcePath = path_1.default.join(regressionPath, 'make');
        if (fs_1.default.existsSync(makeSourcePath)) {
            const makeFiles = fs_1.default.readdirSync(makeSourcePath).filter(f => f.endsWith('.json'));
            for (const file of makeFiles) {
                const name = path_1.default.basename(file, '.json');
                const expectedPath = path_1.default.join(__dirname, 'expected', 'n8n', `${name}.json`);
                testCases.push({
                    name,
                    sourcePath: path_1.default.join(makeSourcePath, file),
                    expectedPath,
                    sourcePlatform: 'make',
                    targetPlatform: 'n8n'
                });
            }
        }
        return testCases;
    });
}
/**
 * Run all regression tests
 */
function runRegressionTests() {
    return __awaiter(this, void 0, void 0, function* () {
        const testCases = yield discoverTestCases();
        console.log(`Running ${testCases.length} regression tests...`);
        let allPassed = true;
        for (const testCase of testCases) {
            const passed = yield runSingleTest(testCase);
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
    });
}
/**
 * Run a single regression test
 */
function runSingleTest(testCase) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if expected output exists
            if (!fs_1.default.existsSync(testCase.expectedPath)) {
                console.log(`⚠️  [${testCase.name}] No expected output file. Creating one from current conversion.`);
                // Load source workflow
                const sourceWorkflow = JSON.parse(fs_1.default.readFileSync(testCase.sourcePath, 'utf8'));
                // Convert it
                const result = yield (0, converter_1.convertWorkflow)(sourceWorkflow, testCase.sourcePlatform, testCase.targetPlatform);
                // Save as expected output
                fs_1.default.mkdirSync(path_1.default.dirname(testCase.expectedPath), { recursive: true });
                fs_1.default.writeFileSync(testCase.expectedPath, JSON.stringify(result.convertedWorkflow, null, 2));
                console.log(`✅ [${testCase.name}] Created new expected output.`);
                return true;
            }
            // Load source and expected workflows
            const sourceWorkflow = JSON.parse(fs_1.default.readFileSync(testCase.sourcePath, 'utf8'));
            const expectedWorkflow = JSON.parse(fs_1.default.readFileSync(testCase.expectedPath, 'utf8'));
            // Convert source workflow
            const result = yield (0, converter_1.convertWorkflow)(sourceWorkflow, testCase.sourcePlatform, testCase.targetPlatform);
            // Compare result with expected output
            const { matches, differences } = (0, test_helpers_1.compareWorkflows)(result.convertedWorkflow, expectedWorkflow);
            if (matches) {
                console.log(`✅ [${testCase.name}] Passed`);
                return true;
            }
            else {
                console.log(`❌ [${testCase.name}] Failed:`);
                differences.forEach(diff => console.log(`   - ${diff}`));
                return false;
            }
        }
        catch (error) {
            console.log(`❌ [${testCase.name}] Error: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    });
}
/**
 * Create directory structure for regression tests
 */
function initializeRegressionTestStructure() {
    const directories = [
        path_1.default.join(__dirname, 'sources', 'n8n'),
        path_1.default.join(__dirname, 'sources', 'make'),
        path_1.default.join(__dirname, 'expected', 'n8n'),
        path_1.default.join(__dirname, 'expected', 'make'),
    ];
    for (const dir of directories) {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    // Create README file
    const readmePath = path_1.default.join(__dirname, 'README.md');
    if (!fs_1.default.existsSync(readmePath)) {
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
        fs_1.default.writeFileSync(readmePath, readmeContent);
    }
    // Copy sample workflows to regression test directory
    const sampleN8nWorkflow = path_1.default.join(__dirname, '..', 'fixtures', 'sample-n8n-workflow.json');
    const sampleMakeWorkflow = path_1.default.join(__dirname, '..', 'fixtures', 'sample-make-workflow.json');
    if (fs_1.default.existsSync(sampleN8nWorkflow)) {
        fs_1.default.copyFileSync(sampleN8nWorkflow, path_1.default.join(__dirname, 'sources', 'n8n', 'sample-workflow.json'));
    }
    if (fs_1.default.existsSync(sampleMakeWorkflow)) {
        fs_1.default.copyFileSync(sampleMakeWorkflow, path_1.default.join(__dirname, 'sources', 'make', 'sample-workflow.json'));
    }
}
