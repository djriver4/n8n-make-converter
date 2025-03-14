# Node Mapping System

This document describes the Node Mapping System, which facilitates the conversion of nodes between n8n and Make.com workflows.

## Overview

The Node Mapping System provides a structured approach to mapping nodes, parameters, operations, and credentials between n8n and Make.com platforms. It consists of several components:

- **Schema Definitions**: TypeScript interfaces that define the structure of node mappings.
- **Node Mapping Database**: A JSON file containing mappings between n8n and Make.com nodes.
- **Node Mapper**: A utility class that performs the conversion between n8n and Make.com nodes.
- **Node Mapping Loader**: A utility class that loads the mapping database from the JSON file.

## Architecture

The Node Mapping System follows a simple, modular architecture:

```
lib/node-mappings/
├── schema.ts              # TypeScript interfaces for mapping structure
├── node-types.ts          # TypeScript interfaces for n8n and Make.com node structures
├── node-mapper.ts         # The core NodeMapper class for node conversion
├── node-mapping-loader.ts # Utility to load node mappings
├── nodes-mapping.json     # The actual node mapping database
└── index.ts               # Export all components from the module
```

## Usage

### Basic Conversion from n8n to Make.com

```typescript
import { NodeMapper } from '../lib/node-mappings';
import { NodeMappingLoader } from '../lib/node-mappings/node-mapping-loader';
import { N8nNode } from '../lib/node-mappings/node-types';

// Load the node mappings
const mappingLoader = NodeMappingLoader.getInstance();
const mappingDatabase = mappingLoader.loadMappings();

// Create a NodeMapper instance
const nodeMapper = new NodeMapper(mappingDatabase);

// Convert an n8n node to Make.com
const n8nNode: N8nNode = {
  id: '1',
  name: 'HTTP Request',
  type: 'n8n-nodes-base.httpRequest',
  position: [100, 200],
  parameters: {
    operation: 'GET',
    url: 'https://example.com/api'
  }
};

try {
  const makeModule = nodeMapper.mapN8nNodeToMake(n8nNode);
  console.log('Converted Make.com module:', makeModule);
} catch (error) {
  console.error('Failed to convert n8n node:', error);
}
```

### Basic Conversion from Make.com to n8n

```typescript
import { NodeMapper } from '../lib/node-mappings';
import { NodeMappingLoader } from '../lib/node-mappings/node-mapping-loader';
import { MakeModule } from '../lib/node-mappings/node-types';

// Load the node mappings
const mappingLoader = NodeMappingLoader.getInstance();
const mappingDatabase = mappingLoader.loadMappings();

// Create a NodeMapper instance
const nodeMapper = new NodeMapper(mappingDatabase);

// Convert a Make.com module to n8n
const makeModule: MakeModule = {
  id: 1,
  name: 'HTTP',
  type: 'http',
  bundleId: 'http',
  definition: {
    type: 'get',
    parameters: {
      url: 'https://example.com/api'
    }
  }
};

try {
  const n8nNode = nodeMapper.mapMakeNodeToN8n(makeModule);
  console.log('Converted n8n node:', n8nNode);
} catch (error) {
  console.error('Failed to convert Make.com module:', error);
}
```

## Adding New Node Mappings

To add support for a new node type, you need to add a mapping entry to the `nodes-mapping.json` file with the appropriate structure.

Example mapping entry:

```json
{
  "newNode": {
    "n8nNodeType": "n8n-nodes-base.newNodeType",
    "n8nDisplayName": "New Node",
    "makeModuleId": "new-module",
    "makeModuleName": "New Module",
    "n8nTypeCategory": "Action",
    "makeTypeCategory": "App",
    "description": "Description of the new node",
    "operations": [
      {
        "n8nName": "operation1",
        "makeName": "operation1",
        "description": "Description of operation 1",
        "parameters": [
          {
            "n8nName": "param1",
            "makeName": "param1",
            "type": "string",
            "required": true,
            "description": "Parameter 1"
          },
          {
            "n8nName": "param2",
            "makeName": "param2",
            "type": "number",
            "required": false,
            "description": "Parameter 2"
          }
        ]
      }
    ],
    "credentials": [
      {
        "n8nType": "newNodeAuth",
        "makeType": "basic",
        "fields": [
          {
            "n8nName": "username",
            "makeName": "username",
            "type": "string"
          },
          {
            "n8nName": "password",
            "makeName": "password",
            "type": "string"
          }
        ]
      }
    ]
  }
}
```

## Extracting Mappings from n8n Source Code

The repository includes an automated extraction script that directly fetches node definitions from n8n's GitHub repository and generates mappings compatible with the node mapping system. This significantly reduces the manual effort required to maintain node mappings and eliminates the need to clone the n8n repository locally.

### Using the Extraction Script

To use the extraction script, simply run:

```bash
npm run extract-mappings
```

That's it! The script will automatically:
- Connect to the n8n GitHub repository
- Fetch and parse node definition files
- Generate structured mappings compatible with our schema
- Prioritize popular services defined in the script
- Save the mappings to `lib/node-mappings/nodes-mapping.json`
- Create a detailed log file at `scripts/extraction-log.txt`

### Improving Performance with GitHub Token (Optional)

For better performance and higher API rate limits, you can provide a GitHub personal access token:

```bash
# Set your GitHub token as an environment variable
export GITHUB_TOKEN=your_github_token_here

# Then run the extraction script
npm run extract-mappings
```

### Script Features

- **Intelligent Caching**: The script caches GitHub API responses to reduce API calls and speed up subsequent runs
- **Rate Limit Handling**: Built-in delays and rate limit monitoring to avoid GitHub API restrictions
- **Prioritized Extraction**: Processes the most common services first (Slack, Airtable, Google, etc.)
- **Error Handling**: Graceful error recovery and detailed logging

### Script Capabilities and Limitations

**What the script extracts:**
- Basic node information (node type, display name, description)
- Operations and methods
- Basic parameter information (name, type, required, description)
- Documentation URLs
- Node type categorization

**Limitations to be aware of:**
- Make.com mappings are approximations and will need manual review
- Complex parameter transformations require manual adjustments
- Not all node properties can be automatically extracted
- Custom nodes or nodes with unusual structures may not extract correctly

### Manual Adjustments

After running the extraction script, review the generated mappings and make manual adjustments where necessary:

1. **Make.com Module IDs and Names**: Correct the `makeModuleId` and `makeModuleName` fields to match actual Make.com modules
2. **Operation Mappings**: Ensure operations map correctly between platforms
3. **Parameter Mappings**: Verify parameter names, types, and required flags
4. **Credential Mappings**: Add or adjust credential mappings which aren't fully extracted

### Maintaining the Node Mappings

Best practices for maintaining the node mappings:

1. Run the extraction script periodically to identify new n8n nodes
2. Maintain a separate file for manual adjustments that can be merged with the auto-generated mappings
3. Test all mappings with real workflows to ensure they convert correctly
4. Document any special cases or complex mappings in code comments

## Testing

The Node Mapping System includes unit tests to ensure the correct functioning of the mapping operations. You can run the tests using:

```bash
npm test -- --testPathPattern=__tests__/unit/node-mappings
```

## Limitations and Future Enhancements

The current implementation has some limitations:

- Not all nodes and operations are mapped yet
- Complex parameter transformations may not be fully supported
- Some platform-specific features may not have direct equivalents

Future enhancements may include:

- Support for more node types
- Enhanced parameter transformation logic
- Improved error handling and reporting
- Automatic mapping extraction from n8n and Make.com APIs 