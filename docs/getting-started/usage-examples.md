# Usage Examples

This guide provides practical examples for using the n8n-Make Converter in various scenarios.

## Web Interface Examples

### Basic Workflow Conversion

**Converting from n8n to Make.com:**

1. Access the web interface (http://localhost:3000)
2. Select "n8n to Make.com" as the conversion direction
3. Upload your n8n workflow JSON file
4. Click "Convert"
5. Review the result and download the converted Make.com workflow

**Converting from Make.com to n8n:**

1. Access the web interface (http://localhost:3000)
2. Select "Make.com to n8n" as the conversion direction
3. Upload your Make.com workflow JSON file
4. Click "Convert"
5. Review the result and download the converted n8n workflow

### Advanced Settings Usage

For complex workflows with special requirements:

1. Access the web interface
2. Select your conversion direction
3. Upload your workflow
4. Before converting, toggle the advanced settings:
   - Enable "Debug Mode" for detailed conversion logs
   - Enable "Skip Validation" for partial workflows
   - Disable "Transform Expressions" if you prefer to keep the original expressions
5. Click "Convert"
6. Review both the workflow and the logs for detailed information

## API Usage Examples

### Basic Conversion

```typescript
import { convertN8nToMake, convertMakeToN8n } from 'n8n-make-converter';

// Convert n8n to Make.com
const n8nWorkflow = {
  name: "My n8n Workflow",
  nodes: [
    {
      "parameters": {
        "interval": [
          {
            "field": "minutes",
            "value": 5
          }
        ]
      },
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [100, 100]
    }
    // Additional nodes...
  ],
  "connections": {
    // Connection data...
  }
};

const makeResult = await convertN8nToMake(n8nWorkflow);
console.log(makeResult.convertedWorkflow);
console.log(makeResult.logs);

// Convert Make.com to n8n
const makeWorkflow = {
  name: "My Make Scenario",
  modules: [
    {
      "type": "scenario:trigger",
      "module": "scheduler",
      "metadata": {
        "expect": {
          "interval": "300"
        }
      }
    }
    // Additional modules...
  ],
  "routes": [
    // Route data...
  ]
};

const n8nResult = await convertMakeToN8n(makeWorkflow);
console.log(n8nResult.convertedWorkflow);
console.log(n8nResult.logs);
```

### With Custom Options

```typescript
import { WorkflowConverter } from 'n8n-make-converter';

// Create a converter instance
const converter = new WorkflowConverter();

// Convert with custom options
const result = await converter.convertN8nToMake(myWorkflow, {
  skipValidation: true,
  debug: true,
  transformParameterValues: true
});

// Access conversion details
console.log(result.convertedWorkflow);
console.log(result.logs);
console.log(result.parametersNeedingReview);
```

### Handling Custom Node Mappings

```typescript
import { WorkflowConverter, NodeMappingDatabase } from 'n8n-make-converter';

// Define custom mappings
const customMappings: NodeMappingDatabase = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  mappings: {
    "myCustomNode": {
      source: "n8n",
      sourceNodeType: "my-custom-node-type",
      targetNodeType: "custom-make-module",
      metadata: {
        displayName: "Custom Node",
        description: "My custom node mapping",
        version: "1.0",
      },
      parameterMappings: {
        // Define parameter mappings
        "inputField": {
          sourcePath: "input",
          targetPath: "inputParameter"
        },
        "apiKey": {
          sourcePath: "credentials.apiKey",
          targetPath: "auth.apiKey"
        }
      }
    }
  }
};

// Create converter with custom mappings
const converter = new WorkflowConverter(customMappings);

// Use converter with custom mappings
const result = await converter.convertN8nToMake(workflowWithCustomNodes);
```

## Server Integration Examples

### Express.js Server

```typescript
import express from 'express';
import { convertN8nToMake, convertMakeToN8n } from 'n8n-make-converter';

const app = express();
app.use(express.json());

// n8n to Make.com endpoint
app.post('/convert/n8n-to-make', async (req, res) => {
  try {
    const n8nWorkflow = req.body;
    const result = await convertN8nToMake(n8nWorkflow);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Make.com to n8n endpoint
app.post('/convert/make-to-n8n', async (req, res) => {
  try {
    const makeWorkflow = req.body;
    const result = await convertMakeToN8n(makeWorkflow);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Conversion server running on port 3000');
});
```

### CLI Tool Usage

```bash
# Convert n8n workflow to Make.com format
n8n-make-converter convert --from n8n --to make --input workflow.json --output make-workflow.json

# Convert Make.com workflow to n8n format
n8n-make-converter convert --from make --to n8n --input scenario.json --output n8n-workflow.json

# Convert with debug information
n8n-make-converter convert --from n8n --to make --input workflow.json --output make-workflow.json --debug

# Get help with available commands
n8n-make-converter --help
```

## Common Use Cases

### Batch Conversion of Multiple Workflows

```typescript
import fs from 'fs';
import path from 'path';
import { convertN8nToMake } from 'n8n-make-converter';

async function batchConvert(inputDir, outputDir) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all JSON files in the input directory
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    try {
      // Read workflow file
      const workflowPath = path.join(inputDir, file);
      const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
      
      // Convert workflow
      console.log(`Converting ${file}...`);
      const result = await convertN8nToMake(workflow);
      
      // Write converted workflow to output directory
      const outputPath = path.join(outputDir, file.replace('.json', '_converted.json'));
      fs.writeFileSync(outputPath, JSON.stringify(result.convertedWorkflow, null, 2));
      
      console.log(`Converted ${file} successfully to ${outputPath}`);
      
      // Optionally, write logs to a separate file
      fs.writeFileSync(
        outputPath.replace('.json', '_logs.json'), 
        JSON.stringify(result.logs, null, 2)
      );
    } catch (error) {
      console.error(`Error converting ${file}: ${error.message}`);
    }
  }
}

// Example usage
batchConvert('./n8n-workflows', './converted-make-workflows');
```

### Integrating with CI/CD Pipelines

Example GitHub Actions workflow:

```yaml
name: Convert Workflows

on:
  push:
    paths:
      - 'workflows/**'

jobs:
  convert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'
          
      - name: Install dependencies
        run: npm install n8n-make-converter
        
      - name: Convert workflows
        run: |
          mkdir -p converted-workflows
          node -e '
          const { convertN8nToMake } = require("n8n-make-converter");
          const fs = require("fs");
          const path = require("path");
          
          async function convertWorkflows() {
            const workflowsDir = "./workflows";
            const outputDir = "./converted-workflows";
            
            const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith(".json"));
            
            for (const file of files) {
              try {
                const workflow = JSON.parse(fs.readFileSync(path.join(workflowsDir, file)));
                const result = await convertN8nToMake(workflow);
                fs.writeFileSync(
                  path.join(outputDir, file.replace(".json", "-make.json")),
                  JSON.stringify(result.convertedWorkflow, null, 2)
                );
                console.log(`Converted ${file} successfully`);
              } catch (err) {
                console.error(`Failed to convert ${file}: ${err.message}`);
                process.exit(1);
              }
            }
          }
          
          convertWorkflows();
          '
          
      - name: Upload converted workflows
        uses: actions/upload-artifact@v2
        with:
          name: converted-workflows
          path: converted-workflows/
```

## Next Steps

- Check the [Troubleshooting](../development/troubleshooting.md) guide if you encounter issues
- Explore the [Architecture Overview](../architecture/overview.md) to understand how the converter works
- Learn how to [contribute](../development/contributing.md) to the project 