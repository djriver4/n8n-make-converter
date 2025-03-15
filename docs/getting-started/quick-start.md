# Quick Start Guide

This guide will help you get up and running with the n8n-Make Converter quickly.

## Installation

```bash
# Install via npm
npm install n8n-make-converter

# Or using yarn
yarn add n8n-make-converter
```

## Web Interface Usage

1. **Start the web interface**:
   ```bash
   npx n8n-make-converter serve
   ```

2. **Access the interface**: Open your browser and navigate to http://localhost:3000

3. **Convert a workflow**:
   - Select conversion direction (n8n to Make.com or Make.com to n8n)
   - Upload your workflow JSON file
   - Click "Convert"
   - Download the converted workflow

## Programmatic Usage

### Basic Conversion

```typescript
import { convertN8nToMake, convertMakeToN8n } from 'n8n-make-converter';

// Convert n8n to Make.com
const n8nWorkflow = { /* your n8n workflow JSON */ };
const makeResult = await convertN8nToMake(n8nWorkflow);
console.log(makeResult.convertedWorkflow);

// Convert Make.com to n8n
const makeWorkflow = { /* your Make.com workflow JSON */ };
const n8nResult = await convertMakeToN8n(makeWorkflow);
console.log(n8nResult.convertedWorkflow);
```

## What's Next?

- Read the [Installation Guide](./installation.md) for detailed setup options
- Explore [Usage Examples](./usage-examples.md) for common scenarios
- Check the [Troubleshooting](../development/troubleshooting.md) guide if you encounter issues 