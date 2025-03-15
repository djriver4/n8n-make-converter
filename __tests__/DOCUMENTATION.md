# n8n-make-converter Test Suite Documentation

This document provides comprehensive documentation for the test suite of the n8n-make-converter project, which is designed to convert workflows between n8n and Make.com platforms.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Types](#test-types)
   - [Unit Tests](#unit-tests)
   - [Integration Tests](#integration-tests)
   - [Regression Tests](#regression-tests)
   - [End-to-End Tests](#end-to-end-tests)
   - [Manual Tests](#manual-tests)
5. [Test Fixtures](#test-fixtures)
6. [Mocks](#mocks)
7. [Test Utilities](#test-utilities)
8. [Writing New Tests](#writing-new-tests)
9. [Debugging Tests](#debugging-tests)
10. [Common Issues](#common-issues)

## Overview

The n8n-make-converter test suite is designed to ensure the reliability and correctness of the workflow conversion process between n8n and Make.com platforms. It includes a variety of test types, from unit tests for individual components to end-to-end tests for the complete conversion process.

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

### Regression Tests

Regression tests ensure that new changes do not break existing functionality. These tests use a set of sample workflows and compare conversion results against expected outputs:

The regression testing system automatically tests a set of sample workflows and verifies that the conversion results match the expected outputs. This helps detect any regressions in the conversion logic.

**Adding a New Regression Test:**

1. Add a source workflow in `__tests__/regression/sources/{platform}/{workflow-name}.json`
2. Run the tests once to generate an expected output in `__tests__/regression/expected/{target-platform}/{workflow-name}.json`
3. Verify that the generated expected output is correct
4. Future test runs will compare conversions against this expected output

### End-to-End Tests

End-to-end tests verify the complete workflow conversion process from start to finish, including all components. These tests are primarily in the `__tests__/integration/workflow-converter-e2e.test.ts` file.

### Manual Tests

Manual tests are provided for interactive testing and debugging. These tests are located in:

- `__tests__/manual-test.js`: A manual test script for interactive testing
- `__tests__/manual-test.test.js`: A Jest test version of the manual tests

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
- Custom matchers for workflow comparison
- Validation utilities

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