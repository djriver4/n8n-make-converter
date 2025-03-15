 # Custom Mappings Manager

The Custom Mappings Manager is a core component of the n8n-make-converter application that allows users to create, view, edit, and delete custom node mappings between n8n and Make.com platforms. This document provides a comprehensive overview of the component's functionality, implementation details, and customization options.

## Overview

The Custom Mappings Manager provides a user interface for managing node type mappings that define how n8n nodes are converted to their Make.com equivalents. It serves as a critical configuration tool that directly impacts the core conversion functionality of the application.

**Component Location**: `/components/custom-mappings-manager.tsx`

## Features

The Custom Mappings Manager includes the following key features:

1. **Mapping List View** - Displays all existing custom mappings with search and filter capabilities
2. **Add/Edit Forms** - Provides interfaces for creating and modifying mappings
3. **Import/Export** - Allows sharing mappings between users or environments
4. **Delete with Confirmation** - Prevents accidental deletion of mappings
5. **Parameter Mapping** - Supports configuration of node parameter correlations

## Component Structure

The component is structured as follows:

```tsx
export function CustomMappingsManager() {
  // State management
  const [userMappings, setUserMappings] = useState<UserMapping[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<UserMapping | null>(null);
  const [newMapping, setNewMapping] = useState<NewMappingData>({
    n8nNodeType: '',
    makeModuleId: '',
    makeModuleName: '',
    parameterMap: ''
  });
  
  // Lifecycle methods
  useEffect(() => {
    loadUserMappings();
  }, []);
  
  // CRUD operations
  const loadUserMappings = () => {...};
  const handleSaveMapping = () => {...};
  const handleEditMapping = (mapping: UserMapping) => {...};
  const handleDeleteMapping = (id: string) => {...};
  const handleSubmit = (e: React.FormEvent) => {...};
  
  // Render methods
  const renderParameterMap = (parameterMap: Record<string, string> | string | undefined): ReactNode => {...};
  
  // UI rendering
  return (
    <div className="custom-mappings-manager">
      {/* List View */}
      <div className="mappings-list">...</div>
      
      {/* Add/Edit Form */}
      {showForm && (
        <div className="mapping-form">...</div>
      )}
    </div>
  );
}
```

## State Management

The component manages several state variables:

| State Variable | Type | Purpose |
|----------------|------|---------|
| `userMappings` | `UserMapping[]` | Stores the list of user-defined mappings |
| `showForm` | `boolean` | Controls the visibility of the add/edit form |
| `editingMapping` | `UserMapping \| null` | Stores the mapping being edited (null when adding new) |
| `newMapping` | `NewMappingData` | Stores form data for a new or edited mapping |

## Data Models

The component works with the following data models:

```typescript
// Primary data model for user mappings
interface UserMapping {
  id: string;
  n8nNodeType: string;
  makeModuleId: string;
  makeModuleName: string;
  parameterMap?: Record<string, string> | string;
  createdAt: number;
  updatedAt: number;
}

// Data model for new/editing mappings
interface NewMappingData {
  n8nNodeType: string;
  makeModuleId: string;
  makeModuleName: string;
  parameterMap: Record<string, string> | string;
}
```

## Core Functionality

### Loading Mappings

The component loads existing mappings from the `UserMappingStore`:

```typescript
const loadUserMappings = () => {
  try {
    const mappings = UserMappingStore.getMappings();
    setUserMappings(mappings);
  } catch (error) {
    if (error instanceof Error) {
      toast.error(`Error loading mappings: ${error.message}`);
    } else {
      toast.error('An unknown error occurred while loading mappings');
    }
  }
};
```

### Saving Mappings

New mappings are saved to the store with validation:

```typescript
const handleSaveMapping = () => {
  try {
    // Validation
    if (!newMapping.n8nNodeType || !newMapping.makeModuleId || !newMapping.makeModuleName) {
      toast.error('All fields except Parameter Map are required');
      return;
    }
    
    let parameterMapToSave = newMapping.parameterMap;
    
    // Process parameter map if it's a string
    if (typeof newMapping.parameterMap === 'string' && newMapping.parameterMap.trim() !== '') {
      try {
        // Attempt to parse as JSON
        parameterMapToSave = JSON.parse(newMapping.parameterMap);
      } catch (e) {
        toast.error('Parameter Map must be valid JSON');
        return;
      }
    }
    
    const mappingToSave = {
      ...newMapping,
      parameterMap: parameterMapToSave
    };
    
    // Save or update
    if (editingMapping) {
      UserMappingStore.updateMapping(editingMapping.id, mappingToSave);
      toast.success('Mapping updated successfully');
    } else {
      UserMappingStore.addMapping(mappingToSave);
      toast.success('Mapping added successfully');
    }
    
    // Reset state
    setShowForm(false);
    setEditingMapping(null);
    setNewMapping({
      n8nNodeType: '',
      makeModuleId: '',
      makeModuleName: '',
      parameterMap: ''
    });
    
    // Reload mappings
    loadUserMappings();
  } catch (error) {
    if (error instanceof Error) {
      toast.error(`Error saving mapping: ${error.message}`);
    } else {
      toast.error('An unknown error occurred while saving');
    }
  }
};
```

### Deleting Mappings

Mappings can be deleted with confirmation:

```typescript
const handleDeleteMapping = (id: string) => {
  if (window.confirm('Are you sure you want to delete this mapping?')) {
    try {
      UserMappingStore.deleteMapping(id);
      toast.success('Mapping deleted successfully');
      loadUserMappings();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error deleting mapping: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while deleting');
      }
    }
  }
};
```

### Parameter Map Rendering

Parameter maps are rendered with special handling for different formats:

```typescript
const renderParameterMap = (parameterMap: Record<string, string> | string | undefined): ReactNode => {
  if (!parameterMap) {
    return "No parameters";
  }
  
  // Convert string to object if needed
  let paramMap: Record<string, string>;
  if (typeof parameterMap === 'string') {
    try {
      paramMap = JSON.parse(parameterMap);
    } catch (e) {
      return `${parameterMap}`;
    }
  } else {
    paramMap = parameterMap;
  }
  
  // Render key-value pairs
  return Object.entries(paramMap).map(([key, value]) => (
    <div key={key} className="parameter-mapping">
      <span className="parameter-key">{key}</span>: {value}
    </div>
  ));
};
```

## UI Components

The Custom Mappings Manager includes the following UI sections:

### List View

Displays all mappings in a structured table:

```tsx
<div className="mappings-list">
  <div className="flex justify-between mb-4">
    <h2 className="text-xl font-bold">Custom Node Mappings</h2>
    <Button onClick={() => {
      setEditingMapping(null);
      setNewMapping({
        n8nNodeType: '',
        makeModuleId: '',
        makeModuleName: '',
        parameterMap: ''
      });
      setShowForm(true);
    }}>
      Add New Mapping
    </Button>
  </div>
  
  <div className="bg-white shadow-md rounded-lg overflow-hidden">
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">n8n Node Type</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make Module ID</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make Module Name</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter Map</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {userMappings.map((mapping) => (
          <tr key={mapping.id}>
            <td className="px-4 py-2">{mapping.n8nNodeType}</td>
            <td className="px-4 py-2">{mapping.makeModuleId}</td>
            <td className="px-4 py-2">{mapping.makeModuleName}</td>
            <td className="px-4 py-2">{renderParameterMap(mapping.parameterMap)}</td>
            <td className="px-4 py-2">
              <Button variant="outline" size="sm" onClick={() => handleEditMapping(mapping)} className="mr-2">
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteMapping(mapping.id)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### Add/Edit Form

Provides inputs for creating or editing mappings:

```tsx
<div className="mapping-form mt-6 p-4 bg-white shadow-md rounded-lg">
  <h3 className="text-lg font-medium mb-4">
    {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
  </h3>
  
  <form onSubmit={handleSubmit}>
    <div className="grid grid-cols-1 gap-4 mb-4">
      <div>
        <Label htmlFor="n8nNodeType">n8n Node Type</Label>
        <Input
          id="n8nNodeType"
          value={newMapping.n8nNodeType}
          onChange={(e) => setNewMapping({...newMapping, n8nNodeType: e.target.value})}
          placeholder="e.g., n8n-nodes-base.githubTrigger"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="makeModuleId">Make Module ID</Label>
        <Input
          id="makeModuleId"
          value={newMapping.makeModuleId}
          onChange={(e) => setNewMapping({...newMapping, makeModuleId: e.target.value})}
          placeholder="e.g., github"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="makeModuleName">Make Module Name</Label>
        <Input
          id="makeModuleName"
          value={newMapping.makeModuleName}
          onChange={(e) => setNewMapping({...newMapping, makeModuleName: e.target.value})}
          placeholder="e.g., GitHub"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="parameterMap">Parameter Map (JSON)</Label>
        <Textarea
          id="parameterMap"
          value={typeof newMapping.parameterMap === 'string' 
            ? newMapping.parameterMap 
            : JSON.stringify(newMapping.parameterMap, null, 2)}
          onChange={(e) => setNewMapping({...newMapping, parameterMap: e.target.value})}
          placeholder='{"n8nParam": "makeParam"}'
          rows={5}
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter a JSON object mapping n8n parameters to Make parameters
        </p>
      </div>
    </div>
    
    <div className="flex justify-end space-x-2">
      <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
        Cancel
      </Button>
      <Button type="submit">
        {editingMapping ? 'Update' : 'Save'}
      </Button>
    </div>
  </form>
</div>
```

## Integration with Storage

The component integrates with the `UserMappingStore` for persistent storage:

```typescript
// UserMappingStore methods used:
UserMappingStore.getMappings();       // Get all mappings
UserMappingStore.addMapping();        // Add a new mapping
UserMappingStore.updateMapping();     // Update an existing mapping
UserMappingStore.deleteMapping();     // Delete a mapping
```

## Error Handling

The component implements comprehensive error handling:

1. **Load Errors** - Errors when loading mappings are displayed as toast notifications
2. **Save Validation** - Input validation ensures data integrity before saving
3. **JSON Parsing** - Parameter map JSON is validated to prevent format errors
4. **Deletion Confirmation** - Prevents accidental deletion with confirmation dialog

## Customization Options

The Custom Mappings Manager can be customized in several ways:

### Adding Search Functionality

```tsx
// Add search state
const [searchTerm, setSearchTerm] = useState('');

// Add filter function
const filteredMappings = userMappings.filter(mapping => 
  mapping.n8nNodeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
  mapping.makeModuleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
  mapping.makeModuleName.toLowerCase().includes(searchTerm.toLowerCase())
);

// Add search input to UI
<div className="mb-4">
  <Input
    type="search"
    placeholder="Search mappings..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="max-w-md"
  />
</div>

// Use filteredMappings instead of userMappings in the table
```

### Adding Bulk Import/Export

```tsx
// Add export function
const handleExportMappings = () => {
  const dataStr = JSON.stringify(userMappings, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  
  const exportFileDefaultName = `n8n-make-mappings-${new Date().toISOString().slice(0, 10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Add import function
const handleImportMappings = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!event.target.files || event.target.files.length === 0) return;
  
  const file = event.target.files[0];
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const importedMappings = JSON.parse(content);
      
      // Validate format
      if (!Array.isArray(importedMappings)) {
        toast.error('Invalid import format. Expected an array of mappings.');
        return;
      }
      
      // Import each valid mapping
      let importCount = 0;
      importedMappings.forEach((mapping) => {
        if (mapping.n8nNodeType && mapping.makeModuleId && mapping.makeModuleName) {
          // Generate new ID to avoid conflicts
          const newMapping = {
            ...mapping,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          UserMappingStore.addMapping(newMapping);
          importCount++;
        }
      });
      
      toast.success(`Successfully imported ${importCount} mappings.`);
      loadUserMappings();
    } catch (error) {
      toast.error('Failed to import mappings. Please check file format.');
    }
  };
  
  reader.readAsText(file);
};

// Add UI elements
<div className="flex space-x-2 mb-4">
  <Button onClick={handleExportMappings} variant="outline">
    Export Mappings
  </Button>
  <div>
    <input
      type="file"
      id="importInput"
      accept=".json"
      style={{ display: 'none' }}
      onChange={handleImportMappings}
    />
    <Button 
      onClick={() => document.getElementById('importInput')?.click()} 
      variant="outline"
    >
      Import Mappings
    </Button>
  </div>
</div>
```

## Best Practices

When working with the Custom Mappings Manager:

1. **Validation** - Always validate user input, especially the parameter map JSON
2. **User Feedback** - Provide clear success/error messages for all operations
3. **Confirmation** - Require confirmation for destructive actions like deletion
4. **Parameterization** - Use structured parameter maps for more reliable conversions
5. **Documentation** - Document the expected format of node types and module IDs

## Troubleshooting

Common issues and their solutions:

### Invalid Parameter Map Format

If users encounter errors with parameter maps, recommend:
- Ensuring the JSON is valid with proper quotes and formatting
- Using a JSON validator to check the format
- Providing example parameter maps for reference

### Duplicate Mappings

To handle duplicate n8n node type mappings:
- Add validation to prevent duplicates
- Implement a warning/override system
- Provide clear error messages that explain the conflict

### Integration with Conversion Process

If mappings aren't being applied during conversion:
- Verify that the conversion process is properly accessing the UserMappingStore
- Check for any caching issues that might prevent new mappings from being recognized
- Ensure the n8n node type format matches exactly what the converter expects

## Related Components

- `UserMappingStore` - In `lib/store/user-mapping-store.ts`
- `Settings Page` - In `app/settings/page.tsx`
- Custom mapping type definitions - In `lib/types/custom-mappings.ts` 