# Fixture and Node Mapping Guidelines

This document provides guidelines for working with test fixtures and node mappings in the n8n-make-converter project.

## Test Fixtures

### Structure

Test fixtures are stored in the `__tests__/fixtures` directory, organized by platform:

```
__tests__/fixtures/
├── n8n/
│   ├── sample-workflow.json
│   └── expected-workflow.json
└── make/
    ├── sample-workflow.json
    └── expected-workflow.json
```

### Best Practices

1. **Always use hardcoded test data for critical tests**: 
   - Fixtures can be problematic due to path resolution issues in different environments.
   - For critical tests, define test data directly in the test file.

2. **Use fallback mechanisms**:
   - The enhanced `loadFixture` function now includes fallback mechanisms.
   - You can use `loadFixture('n8n', 'sample-workflow')` with confidence.

3. **Check for fixture origin**:
   - All fixtures now include a `__source` property that indicates if they came from a file or fallback data.
   - You can check this to handle different scenarios: `if (workflow.__source.type === 'fallback') { ... }`

4. **Validate fixtures regularly**:
   - Run `npm run validate` to check the integrity of all fixtures.

## Node Mappings

### Structure

Node mappings define how nodes from one platform are converted to the other. They're defined in `lib/mappings/node-mapping.ts`.

### Required Node Types

The following node types should always have mappings:

#### n8n Node Types:
- `n8n-nodes-base.httpRequest`
- `n8n-nodes-base.function`
- `n8n-nodes-base.jsonParse`
- `n8n-nodes-base.switch`
- `n8n-nodes-base.set`
- `n8n-nodes-base.if`
- `n8n-nodes-base.googleSheets`
- `n8n-nodes-base.emailSend`
- `n8n-nodes-base.webhook`
- `n8n-nodes-base.dateTime`

#### Make Module Types:
- `http:ActionSendData`
- `tools`
- `json`
- `builtin:BasicRouter`
- `google-sheets:addRow`
- `email:ActionSendEmail`
- `webhooks`
- `date`

### Adding New Mappings

When adding support for a new node/module type:

1. **Update both directions**:
   - Add mappings in both the `n8nToMake` and `makeToN8n` sections.

2. **Include parameter mappings**:
   - Define how parameters are mapped between platforms.

3. **Provide accurate descriptions**:
   - Include meaningful descriptions and displayNames.

4. **Follow the template**:
   ```typescript
   "n8n-nodes-base.newNodeType": {
     type: "make:ModuleType",
     parameterMap: {
       "n8nParam": "makeParam"
     },
     description: "Description of the node's functionality",
     displayName: "Human readable name"
   }
   ```

5. **Validate your changes**:
   - Run `npm run validate` to ensure all required mappings are present.

## Validation Tools

We've added several validation tools to maintain code quality:

### Fixture Validation

The `validateFixtures()` function checks that:
- Fixture directories exist
- Required fixtures are present
- Fixtures have valid structure

### Node Mapping Validation

The `validateNodeMappings()` function checks that:
- All required node types have mappings
- Mappings are properly defined in both directions

### Running Validation

Run the validation suite with:

```bash
npm run validate
```

This will:
1. Check fixture integrity
2. Validate node mappings
3. Generate reports on missing items
4. Provide templates for adding missing mappings

## Enhanced Testing

### Hardcoded Test Data

For critical tests, use hardcoded test data:

```typescript
// Define test data directly in test file
const sourceWorkflow = {
  "name": "Sample n8n Workflow",
  "nodes": [
    // Node definitions...
  ],
  "connections": {
    // Connection definitions...
  }
};

// Use in tests
const result = await n8nToMake(sourceWorkflow, debugTracker);
```

### Better Error Messages

The enhanced comparison functions now provide detailed error messages:

```typescript
// Use enhanced matcher
expect(result.convertedWorkflow).toMatchWorkflowStructure(expectedWorkflow);

// Or use detailed comparison
const { matches, differences } = compareWorkflows(
  result.convertedWorkflow, 
  expectedWorkflow,
  { ignoreFields: ['id', 'position'] }
);

if (!matches) {
  console.log('Differences:', differences);
}
```

## Continuous Integration

The validation tools can be integrated into CI pipelines:

```yaml
steps:
  - name: Validate fixtures and mappings
    run: npm run validate
```

The validation script exits with code 1 if any issues are found, allowing CI systems to fail the build when needed. 