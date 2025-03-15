# Feature Management System

The n8n-make-converter application includes a feature management system that enables dynamic enabling and disabling of UI components and functionality without code changes. This document explains the design, implementation, and usage of this system.

## Overview

The feature management system uses feature flags (also known as feature toggles) to control the visibility and functionality of various parts of the application. This allows for:

- Hiding experimental or incomplete features in production
- A/B testing of different UI components
- Enabling advanced features for power users
- Rolling out features gradually to different user segments

## Core Components

The feature management system consists of:

1. **Feature Flag Definitions** - Constants defining available flags
2. **Local Storage Persistence** - For saving user preferences
3. **Feature Management UI** - Optional interface for toggling features (developer tool)
4. **Feature Flag Integration** - Components that respect feature flags

## Feature Flag Definition

Feature flags are defined in `lib/feature-management/feature-flags.ts`:

```typescript
// Default feature flag definitions
export const defaultFeatureFlags = {
  // UI Components
  showNodeInfoManager: false,       // Controls Node Information panel visibility
  showCustomMappingsManager: true,   // Controls Custom Mappings panel visibility
  showPreferences: true,            // Controls Preferences panel visibility

  // Functionality
  enableAdvancedFiltering: false,   // Enables advanced filtering in components
  enableDeveloperTools: false,      // Shows developer tools and information
  enableAutoNodeInfo: false,        // Automatically loads node information
  
  // Experimental
  enableExperimentalFeatures: false, // Master toggle for experimental features
  enableBetaComponents: false       // Enables beta/experimental components
};

// Type definition for feature flags
export type FeatureFlags = typeof defaultFeatureFlags;
```

## Usage in Components

Feature flags are used throughout the application to conditionally render components:

```typescript
// Example usage in a component
function SomeComponent() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(defaultFeatureFlags);
  
  // Load feature flags
  useEffect(() => {
    try {
      const savedFlags = localStorage.getItem('featureFlags');
      if (savedFlags) {
        setFeatureFlags(JSON.parse(savedFlags));
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  }, []);
  
  return (
    <div>
      {featureFlags.someFeature && (
        <FeatureComponent />
      )}
    </div>
  );
}
```

## Feature Management UI

The application includes a Feature Management UI component (`components/feature-management.tsx`) that allows toggling features at runtime:

### Implementation

```typescript
// Simplified structure
export function FeatureManagement() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(defaultFeatureFlags);
  const [activeTab, setActiveTab] = useState('ui');
  
  // Load saved flags
  useEffect(() => {
    try {
      const savedFlags = localStorage.getItem('featureFlags');
      if (savedFlags) {
        setFeatureFlags(JSON.parse(savedFlags));
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  }, []);
  
  // Update flag and save to localStorage
  const toggleFlag = (flag: keyof FeatureFlags) => {
    const updatedFlags = {
      ...featureFlags,
      [flag]: !featureFlags[flag]
    };
    setFeatureFlags(updatedFlags);
    localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('featureFlagsChanged'));
  };
  
  // Reset to defaults
  const resetFlags = () => {
    setFeatureFlags(defaultFeatureFlags);
    localStorage.setItem('featureFlags', JSON.stringify(defaultFeatureFlags));
    window.dispatchEvent(new Event('featureFlagsChanged'));
    alert('Feature flags have been reset to defaults');
  };
  
  // Group flags by category
  const uiFlags = ['showNodeInfoManager', 'showCustomMappingsManager', 'showPreferences'];
  const functionalityFlags = ['enableAdvancedFiltering', 'enableDeveloperTools', 'enableAutoNodeInfo'];
  const experimentalFlags = ['enableExperimentalFeatures', 'enableBetaComponents'];
  
  // ... render UI with toggle switches
}
```

### User Interface

The Feature Management UI organizes flags into three categories:

1. **UI Components** - Toggles for visual components
2. **Functionality** - Toggles for functional features
3. **Experimental** - Toggles for experimental features

Each flag is presented with:
- Toggle switch
- Descriptive label
- Helper text explaining the feature's purpose

A "Reset to Defaults" button allows restoring all flags to their default values.

## Feature Flag Event System

The application uses a custom event system to notify components when feature flags change:

```typescript
// In feature management component (when flags change)
window.dispatchEvent(new Event('featureFlagsChanged'));

// In consuming components
useEffect(() => {
  const handleFlagsChanged = () => {
    // Reload flags from localStorage
    try {
      const savedFlags = localStorage.getItem('featureFlags');
      if (savedFlags) {
        setFeatureFlags(JSON.parse(savedFlags));
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  };
  
  // Listen for changes
  window.addEventListener('featureFlagsChanged', handleFlagsChanged);
  
  // Clean up
  return () => {
    window.removeEventListener('featureFlagsChanged', handleFlagsChanged);
  };
}, []);
```

## Programmatic Control

For programmatic control without the UI, developers can directly manipulate feature flags:

```typescript
// To enable a feature programmatically
const enableFeature = (featureName: keyof FeatureFlags) => {
  try {
    // Get current flags
    const savedFlags = localStorage.getItem('featureFlags');
    const currentFlags = savedFlags 
      ? JSON.parse(savedFlags) 
      : defaultFeatureFlags;
    
    // Update specific flag
    const updatedFlags = {
      ...currentFlags,
      [featureName]: true
    };
    
    // Save and notify
    localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
    window.dispatchEvent(new Event('featureFlagsChanged'));
  } catch (error) {
    console.error('Error updating feature flag:', error);
  }
};
```

## Best Practices for Using Feature Flags

When working with feature flags in the application:

1. **Default to Off** - New experimental features should default to off
2. **Clean Documentation** - Document each flag's purpose in the code
3. **Graceful Fallbacks** - Components should handle missing flags gracefully
4. **Avoid Nesting** - Minimize nested feature flags to prevent complexity
5. **Remove Obsolete Flags** - Once a feature is fully deployed, consider removing its flag

## Extending the Feature Management System

To add a new feature flag:

1. Add the flag to `defaultFeatureFlags` in `lib/feature-management/feature-flags.ts`
2. Update the Feature Management UI to include the new flag in the appropriate category
3. Use the flag in components with conditional rendering
4. Document the new flag in this documentation

## Feature Management UI Status

The Feature Management UI is currently disabled in the application to simplify the user experience. The feature flag system remains fully functional, with flags manipulated programmatically or through direct localStorage edits.

To re-enable the Feature Management UI:
1. Uncomment the import in `app/settings/page.tsx`
2. Reintroduce the Feature Management tab in the TabsList
3. Add the TabsContent section for the Feature Management component 