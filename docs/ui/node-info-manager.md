# Node Information Manager

The Node Information Manager is a component in the n8n-make-converter application that provides users with detailed information about both n8n and Make.com node types. This document outlines the functionality, implementation details, and usage of this component.

## Overview

The Node Information Manager serves as a knowledge base for the conversion process, displaying information about node types, their properties, and functionality. It helps users understand the mapping between n8n and Make.com nodes and provides context for creating custom mappings.

**Component Location**: `/components/node-info-manager.tsx`

## Features

The Node Information Manager includes the following key features:

1. **Node Type List** - Displays a list of available node types
2. **Node Details Panel** - Shows detailed information about selected nodes
3. **Search and Filter** - Allows finding specific node types
4. **Load from GitHub** - Fetches node information from repositories
5. **Local Storage Caching** - Stores node data for offline access

## Feature Flag Control

The Node Information Manager is controlled by the `showNodeInfoManager` feature flag, allowing it to be easily enabled or disabled without code changes. By default, this feature is currently disabled in the application.

## Component Structure

The component is structured as follows:

```tsx
export function NodeInfoManager() {
  // State management
  const [nodeTypeList, setNodeTypeList] = useState<string[]>([]);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [nodeData, setNodeData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Lifecycle methods
  useEffect(() => {
    loadNodeInfoFromLocalStorage();
  }, []);
  
  // Data loading methods
  const loadNodeInfoFromLocalStorage = () => {...};
  const loadNodeInfoFromGitHub = async () => {...};
  
  // Event handlers
  const handleNodeTypeSelect = (nodeType: string) => {...};
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {...};
  
  // Rendering methods
  const renderNodeDetails = () => {...};
  
  // UI rendering
  return (
    <div className="node-info-manager grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Node Type List */}
      <div className="md:col-span-3 lg:col-span-2">...</div>
      
      {/* Node Details */}
      <div className="md:col-span-9 lg:col-span-10">...</div>
    </div>
  );
}
```

## State Management

The component manages several state variables:

| State Variable | Type | Purpose |
|----------------|------|---------|
| `nodeTypeList` | `string[]` | List of available node types |
| `selectedNodeType` | `string \| null` | Currently selected node type |
| `nodeData` | `Record<string, any>` | Detailed data for all nodes |
| `isLoading` | `boolean` | Loading state indicator |
| `error` | `string \| null` | Error message, if any |
| `searchTerm` | `string` | Current search filter |

## Core Functionality

### Loading Node Information

Node information is loaded from local storage first, with fallback to GitHub:

```typescript
const loadNodeInfoFromLocalStorage = () => {
  try {
    const storedNodeInfo = localStorage.getItem('nodeInfo');
    if (storedNodeInfo) {
      const parsedData = JSON.parse(storedNodeInfo);
      setNodeData(parsedData);
      setNodeTypeList(Object.keys(parsedData).sort());
    } else {
      // No data in localStorage, load from GitHub
      loadNodeInfoFromGitHub();
    }
  } catch (error) {
    setError('Failed to load node information from local storage');
    console.error('Error loading node info from localStorage:', error);
    
    // Fallback to GitHub
    loadNodeInfoFromGitHub();
  }
};

const loadNodeInfoFromGitHub = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    // Fetch node information from GitHub repository
    const response = await fetch('https://raw.githubusercontent.com/username/repo/main/node-info.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch node information: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store in component state
    setNodeData(data);
    setNodeTypeList(Object.keys(data).sort());
    
    // Cache in localStorage
    localStorage.setItem('nodeInfo', JSON.stringify(data));
    
    setIsLoading(false);
  } catch (error) {
    setIsLoading(false);
    setError('Failed to load node information from GitHub');
    console.error('Error fetching node info:', error);
  }
};
```

### Node Selection and Display

When a user selects a node type, its details are displayed:

```typescript
const handleNodeTypeSelect = (nodeType: string) => {
  setSelectedNodeType(nodeType);
};

const renderNodeDetails = () => {
  if (!selectedNodeType) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-500">Select a node type to view details</p>
      </div>
    );
  }
  
  const nodeInfo = nodeData[selectedNodeType];
  
  if (!nodeInfo) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-red-500">No information available for {selectedNodeType}</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">{selectedNodeType}</h3>
      
      {/* Node Type Information */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-2">General Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><span className="font-medium">Display Name:</span> {nodeInfo.displayName || 'N/A'}</p>
            <p><span className="font-medium">Type:</span> {nodeInfo.type || 'N/A'}</p>
            <p><span className="font-medium">Group:</span> {nodeInfo.group || 'N/A'}</p>
          </div>
          <div>
            <p><span className="font-medium">Version:</span> {nodeInfo.version || 'N/A'}</p>
            <p><span className="font-medium">Icon:</span> {nodeInfo.icon || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      {/* Properties */}
      {nodeInfo.properties && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Properties</h4>
          <div className="border rounded overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(nodeInfo.properties).map(([propName, propInfo]: [string, any]) => (
                  <tr key={propName}>
                    <td className="px-4 py-2 text-sm">{propName}</td>
                    <td className="px-4 py-2 text-sm">{propInfo.type || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm">{propInfo.description || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Inputs and Outputs */}
      {nodeInfo.inputs && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Inputs</h4>
          <ul className="list-disc pl-5">
            {nodeInfo.inputs.map((input: string, index: number) => (
              <li key={index}>{input}</li>
            ))}
          </ul>
        </div>
      )}
      
      {nodeInfo.outputs && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Outputs</h4>
          <ul className="list-disc pl-5">
            {nodeInfo.outputs.map((output: string, index: number) => (
              <li key={index}>{output}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Documentation */}
      {nodeInfo.documentation && (
        <div>
          <h4 className="text-lg font-semibold mb-2">Documentation</h4>
          <p>{nodeInfo.documentation}</p>
          {nodeInfo.documentationUrl && (
            <a 
              href={nodeInfo.documentationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              View Documentation
            </a>
          )}
        </div>
      )}
    </div>
  );
};
```

### Searching and Filtering

Users can search for specific node types:

```typescript
const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(e.target.value);
};

// In the render method
const filteredNodeTypes = nodeTypeList.filter(nodeType => 
  nodeType.toLowerCase().includes(searchTerm.toLowerCase())
);
```

## UI Components

The Node Information Manager includes the following UI sections:

### Node Type List Panel

Displays a searchable list of node types:

```tsx
<div className="md:col-span-3 lg:col-span-2 bg-white rounded-lg shadow p-4">
  <div className="mb-4">
    <Input
      type="search"
      placeholder="Search node types..."
      value={searchTerm}
      onChange={handleSearch}
      className="w-full"
    />
  </div>
  
  <div className="mb-4">
    <Button 
      onClick={loadNodeInfoFromGitHub} 
      variant="outline" 
      size="sm"
      className="w-full"
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Refresh from GitHub'}
    </Button>
  </div>
  
  {error && (
    <div className="text-red-500 text-sm mb-4">
      {error}
    </div>
  )}
  
  <div className="overflow-y-auto max-h-[500px]">
    <ul className="space-y-1">
      {filteredNodeTypes.map(nodeType => (
        <li 
          key={nodeType} 
          className={`px-3 py-2 text-sm cursor-pointer rounded hover:bg-gray-100 ${
            selectedNodeType === nodeType ? 'bg-gray-100 font-medium' : ''
          }`}
          onClick={() => handleNodeTypeSelect(nodeType)}
        >
          {nodeType}
        </li>
      ))}
    </ul>
  </div>
</div>
```

### Node Details Panel

Displays information about the selected node:

```tsx
<div className="md:col-span-9 lg:col-span-10">
  {renderNodeDetails()}
</div>
```

## Data Format

The node information is stored in the following format:

```json
{
  "n8n-nodes-base.github": {
    "displayName": "GitHub",
    "type": "action",
    "group": "Integration",
    "version": "1.0",
    "icon": "github.svg",
    "properties": {
      "resource": {
        "type": "options",
        "description": "Resource to use",
        "options": ["issue", "repository", "user"]
      },
      "operation": {
        "type": "options",
        "description": "Operation to perform",
        "options": ["create", "get", "delete"]
      }
    },
    "inputs": ["Main"],
    "outputs": ["Main", "Error"],
    "documentation": "GitHub node lets you automate using GitHub's API.",
    "documentationUrl": "https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.github/"
  },
  "integromat.make": {
    "displayName": "HTTP",
    "type": "action",
    "group": "Integration",
    "properties": {
      "url": {
        "type": "string",
        "description": "URL to make the request to"
      },
      "method": {
        "type": "options",
        "description": "HTTP method to use",
        "options": ["GET", "POST", "PUT", "DELETE"]
      }
    }
  }
}
```

## Integration with Storage

The Node Information Manager uses local storage for caching node data:

```typescript
// Save to localStorage
localStorage.setItem('nodeInfo', JSON.stringify(data));

// Load from localStorage
const storedNodeInfo = localStorage.getItem('nodeInfo');
```

## Error Handling

The component implements error handling for data loading:

1. **Loading Errors** - Displayed in the UI when GitHub fetching fails
2. **LocalStorage Errors** - Fallback to GitHub when local storage fails
3. **Missing Data** - Graceful handling of missing node information

## Customization Options

The Node Information Manager can be customized in several ways:

### Auto-load Feature

Enable automatic loading of node data with a feature flag:

```tsx
// Add to useEffect
useEffect(() => {
  loadNodeInfoFromLocalStorage();
  
  // Auto-load from GitHub if feature flag is enabled
  const featureFlags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
  if (featureFlags.enableAutoNodeInfo) {
    loadNodeInfoFromGitHub();
  }
}, []);
```

### Category Filtering

Add category-based filtering:

```tsx
// Add state
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

// Add categories extraction
const getNodeCategories = () => {
  const categories = new Set<string>();
  Object.values(nodeData).forEach(node => {
    if (node.group) {
      categories.add(node.group);
    }
  });
  return Array.from(categories).sort();
};

// Add filtering logic
const filteredNodeTypes = nodeTypeList.filter(nodeType => {
  const matchesSearch = nodeType.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = !selectedCategory || nodeData[nodeType]?.group === selectedCategory;
  return matchesSearch && matchesCategory;
});

// Add category selector to UI
<div className="mb-4">
  <Select
    value={selectedCategory || ''}
    onValueChange={(value) => setSelectedCategory(value || null)}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Categories" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">All Categories</SelectItem>
      {getNodeCategories().map(category => (
        <SelectItem key={category} value={category}>{category}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### Node Comparison View

Add functionality to compare multiple nodes:

```tsx
// Add state for comparison
const [comparisonNodes, setComparisonNodes] = useState<string[]>([]);

// Add toggle function
const toggleComparisonNode = (nodeType: string) => {
  if (comparisonNodes.includes(nodeType)) {
    setComparisonNodes(comparisonNodes.filter(n => n !== nodeType));
  } else {
    setComparisonNodes([...comparisonNodes, nodeType]);
  }
};

// Add comparison UI
{comparisonNodes.length > 0 && (
  <div className="mt-6 p-6 bg-white rounded-lg shadow">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-bold">Node Comparison</h3>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setComparisonNodes([])}
      >
        Clear Comparison
      </Button>
    </div>
    
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
            {comparisonNodes.map(nodeType => (
              <th key={nodeType} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {nodeType}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {/* Comparison rows */}
          <tr>
            <td className="px-4 py-2 font-medium">Type</td>
            {comparisonNodes.map(nodeType => (
              <td key={nodeType} className="px-4 py-2">
                {nodeData[nodeType]?.type || 'N/A'}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium">Group</td>
            {comparisonNodes.map(nodeType => (
              <td key={nodeType} className="px-4 py-2">
                {nodeData[nodeType]?.group || 'N/A'}
              </td>
            ))}
          </tr>
          {/* Additional comparison rows */}
        </tbody>
      </table>
    </div>
  </div>
)}
```

## Best Practices

When working with the Node Information Manager:

1. **Efficient Data Loading** - Load data only when needed, with appropriate caching
2. **Responsive Design** - Ensure the component works on both desktop and mobile devices
3. **Error Recovery** - Provide clear error messages and recovery options
4. **Incremental Updates** - Update local cache when partial data is available
5. **Search Optimization** - Implement efficient search to handle large node lists

## Troubleshooting

Common issues and their solutions:

### Missing Node Information

If node information is missing:
- Check the network connection for GitHub API access
- Verify the node information JSON format is correct
- Try manually refreshing from GitHub using the provided button

### Large Data Sets

For handling large node information sets:
- Implement virtualized lists for better performance
- Add pagination to the node type list
- Consider loading node details on-demand rather than all at once

### Integration with Custom Mappings

To better integrate with the Custom Mappings Manager:
- Add direct links to create mappings from the node details view
- Show existing custom mapping information in the node details
- Provide mapping suggestions based on node properties

## Related Components

- `CustomMappingsManager` - In `/components/custom-mappings-manager.tsx`
- `Settings Page` - In `/app/settings/page.tsx`
- Feature Flag definitions - In `/lib/feature-management/feature-flags.ts` 