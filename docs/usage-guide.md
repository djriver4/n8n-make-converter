# n8n-Make Converter: Usage Guide

This guide provides detailed instructions for using the n8n-Make Converter, covering both the web interface and programmatic usage.

## Web Interface

The web interface provides the most user-friendly way to convert workflows between n8n and Make.com formats.

### Converting a Workflow

1. **Access the Interface**: Open your browser and navigate to the converter (typically at http://localhost:3000 if running locally).

2. **Select Conversion Type**: Choose whether you're converting from n8n to Make.com or from Make.com to n8n.

3. **Upload Your Workflow**:
   - Click on the file upload area
   - Select your workflow JSON file
   - The file will automatically be validated

4. **Configure Options** (optional):
   - **Debug Mode**: Toggle to include debugging information in the output
   - **Skip Validation**: Toggle to skip validation checks (useful for partial workflows)
   - **Transform Expressions**: Toggle whether expressions should be transformed

5. **Convert**: Click the "Convert" button to start the conversion process.

6. **Review Results**:
   - The converted workflow will be displayed in the output panel
   - Any issues, warnings, or unmapped nodes will be highlighted
   - View the "Logs" tab for detailed processing information

7. **Download the Converted Workflow**: Click the "Download" button to save the converted workflow as a JSON file.

8. **Review Issues** (if any):
   - Pay special attention to any nodes marked as "unmapped"
   - Check for warnings about expressions that might need manual review
   - Look for any parameters marked as potentially incompatible

### Settings

Access the Settings page to configure global preferences:

- **Default Conversion Direction**: Set your most common conversion type
- **Theme**: Choose between light, dark, or system theme
- **Advanced Options**: Configure technical settings like timeout limits
- **Mapping Database**: View or update the node mapping database

## Programmatic Usage

You can also use the converter programmatically in your own JavaScript/TypeScript applications.

### Basic Usage

```typescript
import { 
  convertN8nToMake,
  convertMakeToN8n,
  WorkflowConverter
} from 'n8n-make-converter';

// Example 1: Simple n8n to Make.com conversion
const n8nWorkflow = {
  name: 'My Workflow',
  nodes: [
    // n8n nodes here
  ],
  connections: {
    // n8n connections here
  }
};

const result = await convertN8nToMake(n8nWorkflow);
console.log(result.convertedWorkflow); // The Make.com workflow
console.log(result.unmappedNodes);     // Any nodes that couldn't be mapped
console.log(result.logs);              // Conversion process logs

// Example 2: Simple Make.com to n8n conversion
const makeWorkflow = {
  name: 'My Scenario',
  modules: [
    // Make.com modules here
  ],
  routes: [
    // Make.com routes here
  ]
};

const result2 = await convertMakeToN8n(makeWorkflow);
console.log(result2.convertedWorkflow); // The n8n workflow
```

### Advanced Usage

For more control, you can create an instance of the `WorkflowConverter` class:

```typescript
import { WorkflowConverter } from 'n8n-make-converter';
import { customMappingDatabase } from './my-mappings';

// Create a converter with custom mapping database
const converter = new WorkflowConverter(customMappingDatabase);

// Convert with advanced options
const result = converter.convertN8nToMake(n8nWorkflow, {
  skipValidation: true,
  debug: true,
  transformParameterValues: true,
  // Add context for expression evaluation
  expressionContext: {
    testData: {
      name: 'Test User',
      email: 'test@example.com'
    }
  }
});

// Access detailed debug information
console.log(result.logs);
console.log(result.parametersNeedingReview);
```

### Custom Node Mappings

You can create and use your own node mappings:

```typescript
import { WorkflowConverter, NodeMappingDatabase } from 'n8n-make-converter';

// Define custom mappings
const customMappings: NodeMappingDatabase = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  mappings: {
    "myCustomNode": {
      source: "n8n",
      sourceNodeType: "my-nodes.customNode",
      targetNodeType: "customMakeModule",
      metadata: {
        displayName: "Custom Node",
        description: "My custom node",
        version: "1.0",
      },
      parameterMappings: {
        // Define parameter mappings here
        input: {
          sourcePath: "input",
          targetPath: "inputField"
        }
      }
    }
    // Add more mappings as needed
  }
};

// Create a converter with your custom mappings
const converter = new WorkflowConverter(customMappings);

// Use the converter as normal
const result = converter.convertN8nToMake(myWorkflow);
```

## Common Usage Scenarios

### Converting Large Workflows

For large workflows with many nodes:

1. Enable the "Skip Validation" option
2. Consider disabling "Debug Mode" for better performance
3. Use the programmatic API with custom timeout settings
4. Review the logs for any performance bottlenecks

### Handling Custom Nodes

When working with custom or unsupported nodes:

1. Check the "unmappedNodes" property in the conversion result
2. Create custom mappings for the unsupported nodes
3. Use the placeholder feature to mark nodes for manual review
4. Consider using the plugin system for complex custom nodes

### Express.js Server Integration

Example of using the converter in an Express.js application:

```typescript
import express from 'express';
import { convertN8nToMake, convertMakeToN8n } from 'n8n-make-converter';

const app = express();
app.use(express.json());

app.post('/convert/n8n-to-make', async (req, res) => {
  try {
    const n8nWorkflow = req.body;
    const result = await convertN8nToMake(n8nWorkflow);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

## Troubleshooting

### Common Issues

#### "No mapping found for node type"

This indicates that the converter doesn't have a mapping for a specific node type:

- Check if the node type is supported in the current version
- Consider creating a custom mapping for the node
- Look for alternative nodes that might be supported

#### "Expression conversion failed"

This indicates an issue with converting an expression:

- Check if the expression uses unsupported functions
- Verify that the expression syntax is correct
- Try simplifying complex expressions

#### "Parameter type mismatch"

This indicates a parameter type compatibility issue:

- Check the parameter types in both platforms
- Consider using a custom transformation function
- Add manual post-processing for the affected parameters

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub issues](https://github.com/yourusername/n8n-make-converter/issues) for similar problems
2. Review the detailed logs for clues about what went wrong
3. Submit a new issue with detailed information about your workflow and the problem

## Conclusion

The n8n-Make Converter offers both a user-friendly web interface and a powerful programmatic API for converting workflows between platforms. By understanding the options and features available, you can effectively convert even complex workflows while handling any special cases that might arise. 