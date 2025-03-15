# Automated Testing Framework for n8n-make-converter

This directory contains the automated testing framework for the n8n-make-converter application. The framework is designed to ensure the reliability and correctness of the workflow conversion process.

## Documentation

The testing framework is documented in the following files:

- [Comprehensive Test Suite Documentation](DOCUMENTATION.md): Complete documentation for all aspects of the test suite
- [Workflow Converter Test Guide](guides/WORKFLOW_CONVERTER_TESTS.md): Detailed guide for working with workflow converter tests
- [Recent Test Fixes](notes/RECENT_TEST_FIXES.md): Documentation of recent fixes made to the workflow converter tests

## Test Structure

The testing framework is organized into the following directories:

- `__tests__/fixtures/`: Contains sample workflows used for testing
- `__tests__/integration/`: Integration tests that verify the end-to-end conversion process
- `__tests__/regression/`: Regression tests to detect breaking changes
- `__tests__/utils/`: Utility functions for testing
- `__tests__/unit/`: Unit tests for individual components
- `__tests__/mocks/`: Mock data and functions for testing
- `__tests__/guides/`: Detailed guides for specific testing topics
- `__tests__/notes/`: Documentation of changes and improvements

## Running Tests

You can run the tests using the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run regression tests
npm run test:regression

# Run a specific test file
npm test -- path/to/test/file.test.js

# Run tests with verbose output
npm test -- --verbose
```

## Regression Testing

The regression testing system automatically tests a set of sample workflows and verifies that the conversion results match the expected outputs. This helps detect any regressions in the conversion logic.

### Adding a New Regression Test

1. Add a source workflow in `__tests__/regression/sources/{platform}/{workflow-name}.json`
2. Run the tests once to generate an expected output in `__tests__/regression/expected/{target-platform}/{workflow-name}.json`
3. Verify that the generated expected output is correct
4. Future test runs will compare conversions against this expected output

### Running Regression Tests

```bash
# Run all regression tests
npm run test:regression

# Initialize regression test directory structure
npm run test:regression -- --init

# Initialize without running tests
npm run test:regression -- --init --no-run
```

## Custom Matchers

The testing framework includes custom matchers to make it easier to test workflow conversions:

- `toMatchWorkflowStructure`: Compares two workflows and checks if they have the same structure, ignoring non-essential properties like IDs and positions.

## Test Utilities

The `__tests__/utils/` directory contains utility functions for testing:

- `loadFixture`: Loads a fixture file from the fixtures directory
- `compareWorkflows`: Compares two workflows and returns whether they match and any differences found 

## Common Issues and Solutions

For information about common test issues and their solutions, see the [Workflow Converter Test Guide](guides/WORKFLOW_CONVERTER_TESTS.md#common-test-issues-and-solutions). 