# Workflow Conversion Examples

This document provides practical examples of using the n8n-Make Converter for different conversion scenarios.

## Basic Usage Examples

### Simple Programmatic Conversion

```typescript
import { convertN8nToMake, convertMakeToN8n } from '../lib/workflow-converter';

// Convert an n8n workflow to Make.com format
function convertMyN8nWorkflow(n8nWorkflow) {
  const result = convertN8nToMake(n8nWorkflow);
  
  if (result.logs.some(log => log.type === 'error')) {
    console.error('Conversion errors:', result.logs.filter(log => log.type === 'error'));
    return null;
  }
  
  return result.convertedWorkflow;
}

// Convert a Make.com workflow to n8n format
function convertMyMakeWorkflow(makeWorkflow) {
  const result = convertMakeToN8n(makeWorkflow);
  
  if (result.logs.some(log => log.type === 'error')) {
    console.error('Conversion errors:', result.logs.filter(log => log.type === 'error'));
    return null;
  }
  
  return result.convertedWorkflow;
}
```

### Using the Workflow Converter Class

```typescript
import { WorkflowConverter } from '../lib/workflow-converter';
import { NodeMappingLoader } from '../lib/node-mappings/node-mapping-loader';

// Load mapping database
const mappingLoader = new NodeMappingLoader();
const mappingDatabase = mappingLoader.loadMappings();

// Create a workflow converter instance
const converter = new WorkflowConverter(mappingDatabase);

// Convert with detailed options
const conversionResult = converter.convertN8nToMake(n8nWorkflowData, {
  evaluateExpressions: true,
  expressionContext: {
    $env: {
      API_KEY: 'test-key'
    }
  },
  debug: true,
  skipValidation: false
});

// Process the result
console.log('Converted workflow:', conversionResult.convertedWorkflow);
console.log('Unmapped nodes:', conversionResult.unmappedNodes);
console.log('Parameters needing review:', conversionResult.parametersNeedingReview);
```

## Advanced Usage Examples

### Handling Expressions During Conversion

```typescript
import { convertN8nToMake } from '../lib/workflow-converter';
import { ExpressionContext } from '../lib/expression-evaluator';

// Create an expression context for evaluation
const expressionContext: ExpressionContext = {
  $json: {
    user: {
      id: 1234,
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  $env: {
    API_URL: 'https://api.example.com'
  },
  $workflow: {
    id: 'workflow123',
    name: 'My Workflow'
  }
};

// Convert with expression evaluation
const result = convertN8nToMake(n8nWorkflow, {
  evaluateExpressions: true,
  expressionContext: expressionContext
});

console.log('Converted workflow with evaluated expressions:', result.convertedWorkflow);
```

### Custom Node Mappings

```typescript
import { WorkflowConverter } from '../lib/workflow-converter';
import { NodeMappingLoader } from '../lib/node-mappings/node-mapping-loader';
import { NodeMappingDatabase } from '../lib/node-mappings/schema';

// Load default mappings
const mappingLoader = new NodeMappingLoader();
const mappingDatabase = mappingLoader.loadMappings();

// Add custom node mapping
const customMapping: NodeMappingDatabase = {
  n8nToMake: {
    ...mappingDatabase.n8nToMake,
    'n8n-nodes-base.myCustomNode': {
      targetType: 'custom:myModule',
      parameterMappings: {
        inputField: 'targetField',
        apiKey: 'authKey',
        // Add more parameter mappings as needed
      }
    }
  },
  makeToN8n: {
    ...mappingDatabase.makeToN8n,
    'custom:myModule': {
      targetType: 'n8n-nodes-base.myCustomNode',
      parameterMappings: {
        targetField: 'inputField',
        authKey: 'apiKey',
        // Add more parameter mappings as needed
      }
    }
  }
};

// Create converter with custom mappings
const converter = new WorkflowConverter(customMapping);

// Use the converter
const result = converter.convertN8nToMake(n8nWorkflow);
```

## Web Interface Usage

When using the n8n-Make Converter web interface:

1. Upload your workflow file:

```javascript
// Client-side code
const fileInput = document.getElementById('workflow-file');
const conversionForm = document.getElementById('conversion-form');

conversionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a workflow file');
    return;
  }
  
  const formData = new FormData();
  formData.append('workflow', file);
  
  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Display the converted workflow
      document.getElementById('conversion-result').textContent = 
        JSON.stringify(result.convertedWorkflow, null, 2);
        
      // Show any warnings
      if (result.logs.some(log => log.type === 'warning')) {
        const warningsList = document.getElementById('warnings-list');
        warningsList.innerHTML = '';
        
        result.logs
          .filter(log => log.type === 'warning')
          .forEach(warning => {
            const li = document.createElement('li');
            li.textContent = warning.message;
            warningsList.appendChild(li);
          });
        
        document.getElementById('warnings-section').style.display = 'block';
      }
    } else {
      alert('Conversion failed: ' + result.error);
    }
  } catch (error) {
    console.error('Error during conversion:', error);
    alert('An error occurred during conversion');
  }
});
```

## Debugging Conversion Issues

### Enabling Debug Mode

```typescript
import { convertN8nToMake } from '../lib/workflow-converter';

// Enable debug mode
const result = convertN8nToMake(n8nWorkflow, {
  debug: true
});

// Inspect debug information
console.log('Debug info:', result.debug);

// Check mapped and unmapped nodes
console.log('Mapped nodes:', result.debug.mappedNodes);
console.log('Unmapped nodes:', result.debug.unmappedNodes);
```

### Common Issues and Solutions

#### Handling Unmapped Nodes

```typescript
import { convertN8nToMake } from '../lib/workflow-converter';

const result = convertN8nToMake(n8nWorkflow);

// Check for unmapped nodes
if (result.unmappedNodes && result.unmappedNodes.length > 0) {
  console.warn('The following nodes could not be mapped:');
  result.unmappedNodes.forEach(nodeId => {
    const nodeInfo = n8nWorkflow.nodes.find(node => node.id === nodeId);
    console.warn(`- Node ${nodeId} (${nodeInfo?.type}): No mapping available`);
  });
  
  // You might want to add custom handling here
  // For example, add placeholder nodes or modify the workflow
}
```

#### Reviewing Parameters That Need Attention

```typescript
import { convertN8nToMake } from '../lib/workflow-converter';

const result = convertN8nToMake(n8nWorkflow);

// Check for parameters needing review
if (result.parametersNeedingReview && result.parametersNeedingReview.length > 0) {
  console.warn('The following parameters need review:');
  
  result.parametersNeedingReview.forEach(nodeId => {
    const node = result.convertedWorkflow.modules.find(m => m.id === nodeId);
    console.warn(`- Module ${nodeId} (${node?.type}): Parameters may need adjustment`);
  });
}
```

## Integration Examples

### Using the Converter in a Node.js CLI Tool

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { convertN8nToMake, convertMakeToN8n } = require('../lib/workflow-converter');

program
  .name('workflow-converter')
  .description('Convert workflows between n8n and Make.com formats')
  .version('1.0.0');

program
  .command('n8n-to-make <inputFile> <outputFile>')
  .description('Convert an n8n workflow to Make.com format')
  .action((inputFile, outputFile) => {
    try {
      // Read the input file
      const data = fs.readFileSync(path.resolve(inputFile), 'utf8');
      const workflow = JSON.parse(data);
      
      // Convert the workflow
      const result = convertN8nToMake(workflow);
      
      // Log any warnings or errors
      result.logs.forEach(log => {
        console[log.type === 'error' ? 'error' : log.type === 'warning' ? 'warn' : 'info'](log.message);
      });
      
      // Write the output file
      fs.writeFileSync(
        path.resolve(outputFile),
        JSON.stringify(result.convertedWorkflow, null, 2),
        'utf8'
      );
      
      console.log(`Conversion successful. Output written to ${outputFile}`);
      
      // Report unmapped nodes
      if (result.unmappedNodes && result.unmappedNodes.length > 0) {
        console.warn('\nUnmapped nodes:');
        result.unmappedNodes.forEach(nodeId => {
          console.warn(`- ${nodeId}`);
        });
      }
    } catch (error) {
      console.error('Conversion failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('make-to-n8n <inputFile> <outputFile>')
  .description('Convert a Make.com workflow to n8n format')
  .action((inputFile, outputFile) => {
    try {
      // Read the input file
      const data = fs.readFileSync(path.resolve(inputFile), 'utf8');
      const workflow = JSON.parse(data);
      
      // Convert the workflow
      const result = convertMakeToN8n(workflow);
      
      // Log any warnings or errors
      result.logs.forEach(log => {
        console[log.type === 'error' ? 'error' : log.type === 'warning' ? 'warn' : 'info'](log.message);
      });
      
      // Write the output file
      fs.writeFileSync(
        path.resolve(outputFile),
        JSON.stringify(result.convertedWorkflow, null, 2),
        'utf8'
      );
      
      console.log(`Conversion successful. Output written to ${outputFile}`);
    } catch (error) {
      console.error('Conversion failed:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
```

## Conclusion

These examples demonstrate how to use the n8n-Make Converter in various scenarios, from simple programmatic conversions to advanced use cases with custom node mappings and debugging. By leveraging these patterns, you can integrate the converter into your own applications and workflows. 