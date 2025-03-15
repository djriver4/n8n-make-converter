# Settings Page

The Settings page provides a comprehensive interface for configuring and customizing the n8n-make-converter application. This document details the structure, components, and functionality of the Settings page.

## Overview

The Settings page is organized using a tabbed interface, allowing users to access different configuration sections. The visibility of certain tabs is controlled by feature flags, enabling a customizable user experience.

**Location**: `/app/settings/page.tsx`

## Tab Structure

The Settings page includes the following tabs (subject to feature flag visibility):

1. **Custom Mappings** - Always visible, manages node type mapping configurations
2. **Node Information** - Toggleable via feature flags, displays node type information
3. **Preferences** - Configures general application preferences

## Component Implementation

The core of the Settings page is implemented as follows:

```tsx
// Simplified structure
export default function SettingsPage() {
  const [featureFlags, setFeatureFlags] = useState({
    showNodeInfoManager: false,
    showCustomMappingsManager: true,
    showPreferences: true
  });

  useEffect(() => {
    // Load feature flags from localStorage
    // Set up event listener for storage changes
  }, []);

  // Determine default tab based on visible components
  const defaultTab = featureFlags.showCustomMappingsManager 
    ? "custom-mappings" 
    : (featureFlags.showPreferences ? "preferences" : "node-info");

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4">
          {featureFlags.showCustomMappingsManager && (
            <TabsTrigger value="custom-mappings">Custom Mappings</TabsTrigger>
          )}
          {featureFlags.showNodeInfoManager && (
            <TabsTrigger value="node-info">Node Information</TabsTrigger>
          )}
          {featureFlags.showPreferences && (
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          )}
        </TabsList>
        
        {/* Tab content sections */}
        {featureFlags.showCustomMappingsManager && (
          <TabsContent value="custom-mappings">
            <CustomMappingsManager />
          </TabsContent>
        )}
        
        {featureFlags.showNodeInfoManager && (
          <TabsContent value="node-info">
            <NodeInfoManager />
          </TabsContent>
        )}
        
        {featureFlags.showPreferences && (
          <TabsContent value="preferences">
            <div className="p-4 border rounded-md">
              <h2 className="text-lg font-medium mb-4">Preferences</h2>
              {/* Preferences component content */}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
```

## Custom Mappings Tab

The Custom Mappings tab provides a comprehensive interface for managing node type mappings between n8n and Make.com.

### Features:

- **Mapping List View** - Displays existing mappings with search and filter capabilities
- **Create/Edit Mapping Form** - Allows adding and modifying mappings with validation
- **Import/Export** - Supports sharing mappings between users
- **Deletion** - Removes unwanted mappings with confirmation

### Implementation:

The Custom Mappings tab utilizes the `CustomMappingsManager` component, which integrates with the `UserMappingStore` for state management. Mappings are persisted in local storage.

## Node Information Tab (Feature Flag Controlled)

The Node Information tab provides detailed information about node types and their properties.

### Features:

- **Node List** - Displays available node types
- **Node Details** - Shows properties, inputs, outputs, and documentation
- **Search and Filter** - Helps locate specific node types
- **Load from GitHub** - Fetches current node data from repositories

### Implementation:

The Node Information tab is implemented via the `NodeInfoManager` component and is controlled by the `showNodeInfoManager` feature flag.

## Preferences Tab

The Preferences tab allows configuring application-wide settings.

### Features:

- **Theme Settings** - Configure light/dark mode preferences
- **Default Views** - Set preferred views and layouts
- **Data Storage** - Configure data persistence options
- **Developer Mode** - Enable additional developer features

## Feature Flag Integration

The Settings page respects feature flags defined in the application's feature management system. This allows for dynamic showing/hiding of tabs without code changes.

### Key Feature Flags:

```typescript
// Default feature flags
const defaultFeatureFlags = {
  showNodeInfoManager: false,    // Controls Node Information tab
  showCustomMappingsManager: true,  // Controls Custom Mappings tab
  showPreferences: true          // Controls Preferences tab
};
```

## Implementation Notes

- The Settings page uses conditional rendering based on feature flags
- Tab visibility is determined by the corresponding feature flag
- The default tab is dynamically selected based on visible tabs
- Component loading is optimized to improve performance

## Best Practices for Extending

When extending the Settings page:

1. Create a new component for your settings section
2. Add a corresponding feature flag in `lib/feature-management/feature-flags.ts`
3. Update the Settings page to include your new tab with proper conditional rendering
4. Ensure your component handles its own state management and persistence

## Related Components

- `CustomMappingsManager` - `/components/custom-mappings-manager.tsx`
- `NodeInfoManager` - `/components/node-info-manager.tsx`
- Feature Flag definitions - `/lib/feature-management/feature-flags.ts` 