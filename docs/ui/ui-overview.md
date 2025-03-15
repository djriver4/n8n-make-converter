# UI Overview

The n8n-make-converter application features a modern, component-based UI architecture built with Next.js and React. This document provides an overview of the UI structure, key components, and architectural decisions.

## Architecture

The UI follows a modular architecture with clearly separated concerns:

```
app/                  # Next.js app directory
  ├── page.tsx        # Home page
  ├── settings/       # Settings page
  │   └── page.tsx    # Settings UI
  └── layout.tsx      # Root layout with navigation
components/           # Reusable UI components
  ├── custom-mappings-manager.tsx  # Custom mappings UI
  ├── feature-management.tsx       # Feature flags management
  ├── nav-bar.tsx                  # Navigation component
  ├── node-info-manager.tsx        # Node information panel
  └── ui/                          # Shadcn UI components
lib/                  # Utility functions and types
  ├── feature-management/          # Feature management system
  │   └── feature-flags.ts         # Feature flag definitions
  ├── store/                       # State management
  │   ├── user-mapping-store.ts    # Mapping state store
  │   └── node-info-store.ts       # Node info state store
  └── types/                       # TypeScript types
      └── custom-mappings.ts       # Type definitions for mappings
```

## Component Hierarchy

The application follows this component hierarchy:

1. **Root Layout** (`app/layout.tsx`) - Provides the app shell with:
   - Global CSS
   - Navigation
   - Theme provider

2. **Page Components**:
   - **Home Page** (`app/page.tsx`) - Main conversion interface
   - **Settings Page** (`app/settings/page.tsx`) - Configuration interface with tabs:
     - Custom Mappings tab
     - Node Information tab (optional via feature flag)
     - Preferences tab

3. **Core Components**:
   - `CustomMappingsManager` - Manages custom node mappings
   - `NodeInfoManager` - Displays node information (toggleable via feature flags)
   - `FeatureManagement` - UI for managing feature flags (disabled in production)

## State Management

The application uses a combination of:

1. **React useState/useEffect** - For component-level state
2. **Local Storage** - For persistent storage of:
   - User mappings
   - Feature flags
   - Application preferences

## Feature Flag System

The application includes a feature flag system that allows enabling/disabling features without code changes. Key features that can be toggled include:

- Node Information Manager
- Custom Mappings Manager
- Preferences Panel

Feature flags are stored in local storage and have default values defined in `lib/feature-management/feature-flags.ts`.

## Styling Approach

The UI uses:
- **Tailwind CSS** - For utility-first styling
- **Shadcn UI** - For base components
- **Custom CSS Modules** - For component-specific styling when needed

## Responsive Design

The UI is designed to work on:
- Desktop environments (primary use case)
- Tablet devices
- Mobile devices (with adjusted layouts)

## Accessibility Considerations

The UI implements:
- Proper heading hierarchy
- ARIA attributes
- Keyboard navigation
- Color contrast compliance
- Screen reader support through semantic HTML

## Future UI Enhancements

Planned enhancements include:
- Advanced theming options
- User preferences synchronization
- Additional visualization components
- Improved error handling and user feedback

For more detailed information about specific UI components, refer to the corresponding documentation files. 