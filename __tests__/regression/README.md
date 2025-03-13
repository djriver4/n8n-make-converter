# Workflow Regression Tests

This directory contains regression tests for workflow conversions. The system automatically compares the conversion results with expected outputs to detect any regressions in the conversion logic.

## Adding a New Test

1. Add a source workflow in `__tests__/regression/sources/{platform}/{workflow-name}.json`
2. Run the tests once to generate an expected output in `__tests__/regression/expected/{target-platform}/{workflow-name}.json`
3. Verify that the generated expected output is correct
4. Future test runs will compare conversions against this expected output

## Running the Tests

Run all regression tests:

```
npm run test:regression
```
