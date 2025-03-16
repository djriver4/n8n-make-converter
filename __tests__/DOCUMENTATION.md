# n8n-make-converter Test Suite Documentation

This document provides comprehensive documentation for the test suite of the n8n-make-converter project, which is designed to convert workflows between n8n and Make.com platforms.

## Table of Contents

1. [Overview](#overview)
2. [Current Test Status](#current-test-status)
3. [Documentation Organization](#documentation-organization)
4. [Test Structure](#test-structure)
5. [Running Tests](#running-tests)
6. [Test Types](#test-types)
   - [Unit Tests](#unit-tests)
   - [Integration Tests](#integration-tests)
   - [Regression Tests](#regression-tests)
   - [End-to-End Tests](#end-to-end-tests)
   - [Manual Tests](#manual-tests)
   - [Benchmark Tests](#benchmark-tests)
7. [Test Fixtures](#test-fixtures)
8. [Mocks](#mocks)
9. [Test Utilities](#test-utilities)
10. [Writing New Tests](#writing-new-tests)
11. [Debugging Tests](#debugging-tests)
12. [Common Issues](#common-issues)

## Overview

The n8n-make-converter test suite is designed to ensure the reliability and correctness of the workflow conversion process between n8n and Make.com platforms. It includes a variety of test types, from unit tests for individual components to end-to-end tests for the complete conversion process.

## Current Test Status

As of the most recent test run, the test suite shows the following status:

- **Test Suites**: 6 failed, 31 passed, 37 total
- **Tests**: 14 failed, 300 passed, 314 total

The failing tests are primarily concentrated in the Make-to-n8n conversion functionality, with issues in the following areas:

1. **Make-to-n8n Converter Tests**: Tests in `__tests__/lib/converters/make-to-n8n.test.js` and `make-to-n8n.test.ts` are failing because HTTP nodes aren't being properly defined in the conversion process
   
2. **Workflow Conversion Integration Tests**: The round-trip conversion tests in `__tests__/integration/workflow-conversion.test.js` and `workflow-conversion.test.ts` are failing due to issues with HTTP module conversion

3. **Parameter and Expression Processing**: While most expression evaluation tests are passing, there are still issues with certain edge cases

The majority of unit tests are passing successfully, especially those related to compatibility layer, interface adapters, and expression evaluation core functionality.

## Documentation Organization

The testing framework is documented across several files:

- **`__tests__/DOCUMENTATION.md`** (this file): Comprehensive documentation for all aspects of the test suite
- **`__tests__/guides/WORKFLOW_CONVERTER_TESTS.md`**: Detailed guide for working with workflow converter tests
- **`__tests__/notes/RECENT_TEST_FIXES.md`**: Documentation of recent fixes made to the workflow converter tests
- **`__tests__/README.md`**: A quick overview of the test framework with key information

## Test Structure

The test suite is organized into the following directories:

- `__tests__/fixtures/`: Contains sample workflows and test data
- `__tests__/integration/`: Integration tests that verify the end-to-end conversion process
- `__tests__/unit/`: Unit tests for individual components and functions
- `__tests__/regression/`: Tests to detect breaking changes in the conversion process
- `__tests__/utils/`: Utility functions for testing
- `__tests__/mocks/`: Mock data and functions for testing
- `__tests__/benchmarks/`: Performance benchmarks
- `__tests__/examples/`: Example tests demonstrating specific features
- `__tests__/types/`: TypeScript type definitions for tests
- `__tests__/guides/`: Detailed guides for specific testing topics
- `__tests__/notes/`: Documentation of changes and improvements
- `__tests__/lib/`: Test-specific implementation files

## Running Tests

The test suite can be run using various npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage reporting
npm run test:coverage

# Run regression tests
npm run test:regression

# Run specific test file
npm test -- path/to/test/file.test.js

# Run test with verbose output
npm test -- --verbose

# Run tests matching a specific pattern
npm test -- -t "should evaluate expressions"
```

## Test Types

### Unit Tests

Unit tests focus on testing individual components and functions in isolation. These tests are located in the `__tests__/unit/` directory and are organized by component:

- `converters/`: Tests for parameter and workflow conversion functions
- `expression-evaluator/`: Tests for expression evaluation and conversion
- `node-mappings/`: Tests for node mapping system and database

**Key Unit Test Files:**

- `__tests__/unit/converters/parameter-processor.test.ts`: Tests for the NodeParameterProcessor class which handles parameter conversion between formats.
- `__tests__/unit/expression-evaluator/expression-evaluator.test.ts`: Tests for expression evaluation and conversion.
- `__tests__/unit/node-mappings/node-mapper.test.ts`: Tests for the NodeMapper class which maps between n8n and Make.com node types.

### Integration Tests

Integration tests verify the interaction between multiple components and subsystems. These tests are located in the `__tests__/integration/` directory:

**Key Integration Test Files:**

- `__tests__/integration/workflow-converter.test.ts`: Tests the complete workflow conversion process using the NodeMapping system and Expression Evaluator.
- `__tests__/integration/workflow-conversion.test.ts`: Tests converting workflows between n8n and Make.com formats.
- `__tests__/integration/workflow-converter-e2e.test.ts`: End-to-end tests for workflow conversion.
- `__tests__/integration/workflow-validation.test.ts`: Tests for validating workflow structure before and after conversion.

### Regression Tests

Regression tests ensure that new changes do not break existing functionality. These tests use a set of sample workflows and compare conversion results against expected outputs:

The regression testing system automatically tests a set of sample workflows and verifies that the conversion results match the expected outputs. This helps detect any regressions in the conversion logic.

**Adding a New Regression Test:**

1. Add a source workflow in `__tests__/regression/sources/{platform}/{workflow-name}.json`
2. Run the tests once to generate an expected output in `__tests__/regression/expected/{target-platform}/{workflow-name}.json`
3. Verify that the generated expected output is correct
4. Future test runs will compare conversions against this expected output

**Running Regression Tests:**

```bash
# Run all regression tests
npm run test:regression

# Initialize regression test directory structure
npm run test:regression -- --init

# Initialize without running tests
npm run test:regression -- --init --no-run
```

### End-to-End Tests

End-to-end tests verify the complete workflow conversion process from start to finish, including all components. These tests are primarily in the `__tests__/integration/workflow-converter-e2e.test.ts` file.

### Manual Tests

Manual tests are provided for interactive testing and debugging. These tests are located in:

- `__tests__/manual-test.js`: A manual test script for interactive testing
- `__tests__/manual-test.test.js`: A Jest test version of the manual tests

### Benchmark Tests

Benchmark tests evaluate the performance of core components:

- `__tests__/benchmarks/compatibility-layer-benchmark.ts`: Performance benchmarks for the compatibility layer
- `__tests__/benchmarks/README.md`: Documentation for performance benchmarking

To run benchmark tests:

```bash
# Run benchmark tests
npm test __tests__/benchmarks/
```

## Test Fixtures

The `__tests__/fixtures/` directory contains sample workflows and test data:

- `make-workflows.js`/`make-workflows.ts`: Sample Make.com workflows for testing
- `n8n-workflows.js`/`n8n-workflows.ts`: Sample n8n workflows for testing
- `sample-make-workflow.json`/`sample-n8n-workflow.json`: Example workflow files
- `expected-make-to-n8n.json`/`expected-n8n-to-make.json`: Expected conversion results
- `make/`: Directory containing additional Make.com workflow fixtures
- `n8n/`: Directory containing additional n8n workflow fixtures

## Mocks

The `__tests__/mocks/` directory contains mock data and functions used in tests:

- `mock-mapping-database.js`: A mock node mapping database for testing
- Other mock objects and functions to simulate parts of the system during testing

## Test Utilities

The `__tests__/utils/` directory contains utility functions for testing:

- `loadFixture`: Loads a fixture file from the fixtures directory
- `compareWorkflows`: Compares two workflows and returns whether they match and any differences found
- `validate-codebase.ts`: Utilities for validating the codebase structure
- Custom matchers for workflow comparison
- Validation utilities

## Custom Matchers

The testing framework includes custom matchers to make it easier to test workflow conversions:

- `toMatchWorkflowStructure`: Compares two workflows and checks if they have the same structure, ignoring non-essential properties like IDs and positions.

## Writing New Tests

When writing new tests, follow these guidelines:

1. **Organize tests properly**: Place unit tests in the appropriate subdirectory of `__tests__/unit/` and integration tests in `__tests__/integration/`.

2. **Use descriptive test names**: Test names should clearly describe what is being tested and what the expected outcome is.

3. **Use fixtures**: Use the provided fixtures for testing, or add new ones as needed.

4. **Mock external dependencies**: Use mocks for external dependencies to ensure tests are focused and reliable.

5. **Test both success and failure cases**: Make sure to test both expected successful outcomes and error handling.

Example of a well-structured test:

```typescript
describe('Component Name', () => {
  describe('functionName', () => {
    it('should handle valid input correctly', () => {
      // Test code for success case
    });

    it('should handle invalid input gracefully', () => {
      // Test code for error case
    });
  });
});
```

## Debugging Tests

To debug tests, you can use the following approaches:

1. **Run with verbose output**: Use `npm test -- --verbose` to see more detailed output.

2. **Run a specific test**: Use `npm test -- path/to/test/file.test.js` to run only a specific test file.

3. **Use console.log**: Add temporary `console.log` statements to your code to see what's happening.

4. **Use debugger**: Add a `debugger` statement in your code and run the test with `node --inspect-brk node_modules/.bin/jest path/to/test/file.test.js`.

## Common Issues

### HTTP Node Mapping Issues

The HTTP node is one of the most common nodes used in tests. Issues with HTTP node mapping typically involve:

- **URL parameter case sensitivity**: Make.com uses `URL` (uppercase) while n8n uses `url` (lowercase)
- **Parameter mismatch**: Different parameter structures between platforms
- **Missing mappings**: No mapping defined for HTTP modules

**Solution**: 
- Ensure the NodeMapper properly handles URL case conversion
- Add default fallback for HTTP modules in `convertMakeModuleToN8nNode`
- Use the NodeParameterProcessor to correctly convert parameters

### Expression Evaluation Issues

Tests involving expression evaluation often fail because of:

- **Expression format differences**: `{{1.id}}` (Make) vs `={{ $json.id }}` (n8n)
- **Context not provided**: Missing context for expression evaluation
- **Transformation errors**: Errors in the expression transformation logic

**Solution**:
- Use the correct regular expressions for transformation (e.g., `/(\d+)\.(\w+)/g` to match numeric references)
- Ensure expression context is provided via options
- Use the NodeParameterProcessor for parameter conversions

### Parameter Mapping Issues

Issues with parameter mapping include:

- **Missing parameterMappings**: The `parameterMappings` property is undefined
- **Type errors**: TypeScript type errors related to parameter types
- **Nested parameter access**: Issues accessing deeply nested parameters

**Solution**:
- Check if `parameterMappings` exists before using it
- Use proper TypeScript interfaces
- Use `getNestedValue` and `setNestedValue` for deep parameter access

### Tests not finding modules

If tests cannot find modules, ensure that:
- The path imports are correct (use relative paths starting with `../` or `./`)
- The module exists in the specified location
- TypeScript definitions are correct

### Tests failing with type errors

If tests fail with TypeScript errors, check:
- The interface definitions in your code
- The types of test fixtures match the expected types
- You're properly handling optional properties

### Tests timing out

If tests time out, it could be due to:
- Asynchronous code not resolving
- Infinite loops
- Missing mock responses

Increase the timeout limit for tests that legitimately need more time:

```typescript
jest.setTimeout(10000); // 10 seconds
```

For more detailed information on specific issues and their solutions, refer to the [Recent Test Fixes](notes/RECENT_TEST_FIXES.md) document. 