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

You can automate the extraction of node definitions from n8n's `nodes-base` package to populate initial mappings. This process typically involves:

1. Parsing the n8n node definition files
2. Extracting relevant information about parameters, operations, etc.
3. Mapping these to Make.com equivalents
4. Generating or updating the `nodes-mapping.json` file

A simple script to assist with this process can be found in the `scripts` directory.

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