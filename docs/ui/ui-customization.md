# UI Customization

This document provides guidance on customizing and extending the UI of the n8n-make-converter application. Whether you're looking to adjust the theme, add new components, or modify existing ones, this guide will help you understand the UI architecture and how to make changes effectively.

## Table of Contents

1. [Theming](#theming)
2. [Adding New Components](#adding-new-components)
3. [Extending Existing Components](#extending-existing-components)
4. [Layout Customization](#layout-customization)
5. [Custom Styling](#custom-styling)
6. [Accessibility Considerations](#accessibility-considerations)
7. [Internationalization](#internationalization)

## Theming

The n8n-make-converter application uses a theme system based on CSS variables, allowing for easy customization of colors, spacing, and other design elements.

### Theme Variables

The theme variables are defined in the global CSS file (`app/globals.css`):

```css
:root {
  /* Base colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* Primary colors */
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  
  /* Secondary colors */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  /* Accent colors */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  /* UI element colors */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  /* Interactive element colors */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  
  /* Status colors */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  /* Layout variables */
  --radius: 0.5rem;
}

.dark {
  /* Dark theme variables... */
}
```

### Creating a Custom Theme

To create a custom theme:

1. Create a new CSS file (e.g., `custom-theme.css`) with your own variable definitions
2. Import this file in the main layout component (`app/layout.tsx`)
3. Optionally, create a theme switcher component to toggle between multiple themes

### Theme Switching

A simple theme switcher can be implemented as follows:

```tsx
function ThemeSwitcher() {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
}
```

## Adding New Components

The application follows a component-based architecture, making it easy to add new UI elements without disrupting existing functionality.

### Component Structure

Follow this structure when creating new components:

```tsx
// components/my-new-component.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MyNewComponentProps {
  title?: string;
  data?: Array<any>;
  onAction?: (data: any) => void;
}

export function MyNewComponent({ 
  title = 'Default Title', 
  data = [], 
  onAction 
}: MyNewComponentProps) {
  // Component state
  const [localState, setLocalState] = useState<any>(null);
  
  // Side effects
  useEffect(() => {
    // Initialize component
  }, []);
  
  // Handler functions
  const handleSomeAction = () => {
    // Handle action
    if (onAction) {
      onAction(localState);
    }
  };
  
  // Component rendering
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
        <button onClick={handleSomeAction}>
          Take Action
        </button>
      </CardContent>
    </Card>
  );
}
```

### Integration into Pages

To add a new component to a page:

1. Import the component at the top of the page file
2. Add it to the JSX where appropriate
3. Pass any required props

```tsx
// Example: Adding to settings page
import { MyNewComponent } from '@/components/my-new-component';

export default function SettingsPage() {
  // Page logic...
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Existing components... */}
      
      {/* New component */}
      <MyNewComponent 
        title="Custom Settings" 
        data={someData}
        onAction={handleCustomAction}
      />
    </div>
  );
}
```

## Extending Existing Components

Many components in the application are designed to be extensible. Here's how to extend existing components:

### Adding Props

To extend a component with new props:

```tsx
// Original component
interface ButtonProps {
  label: string;
  onClick: () => void;
}

// Extended component
interface EnhancedButtonProps extends ButtonProps {
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function EnhancedButton({ 
  label, 
  onClick, 
  icon, 
  variant = 'primary' 
}: EnhancedButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-500 hover:bg-gray-600',
    danger: 'bg-red-500 hover:bg-red-600'
  };
  
  return (
    <button 
      className={`px-4 py-2 rounded text-white ${variantClasses[variant]}`}
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
}
```

### Composition Pattern

Use composition to extend components without modifying their source:

```tsx
// Wrapping an existing component
import { CustomMappingsManager } from '@/components/custom-mappings-manager';

export function EnhancedMappingsManager({ extraData, ...props }) {
  return (
    <div className="enhanced-wrapper">
      <div className="extra-controls">
        {/* Additional UI elements */}
      </div>
      <CustomMappingsManager {...props} />
      <div className="extra-footer">
        {/* Footer UI elements */}
      </div>
    </div>
  );
}
```

## Layout Customization

The application uses a flexible layout system that can be customized to fit different needs.

### Page Layout Structure

The main layout is defined in `app/layout.tsx`:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
```

### Customizing the Layout

To customize the layout:

1. Modify the `app/layout.tsx` file to adjust the global structure
2. Create new layout components for specific sections
3. Use CSS Grid or Flexbox for responsive layouts

Example of a custom section layout:

```tsx
// components/custom-section-layout.tsx
interface CustomSectionLayoutProps {
  sidebar?: React.ReactNode;
  content: React.ReactNode;
  showSidebar?: boolean;
}

export function CustomSectionLayout({ 
  sidebar, 
  content, 
  showSidebar = true 
}: CustomSectionLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {showSidebar && (
        <div className="md:col-span-3 lg:col-span-2">
          {sidebar}
        </div>
      )}
      <div className={showSidebar ? "md:col-span-9 lg:col-span-10" : "col-span-full"}>
        {content}
      </div>
    </div>
  );
}
```

## Custom Styling

The application uses Tailwind CSS for styling, combined with CSS modules for component-specific styles.

### Using Tailwind CSS

To style components with Tailwind:

1. Use utility classes directly in JSX
2. Use the `@apply` directive in CSS for repeated patterns
3. Extend the Tailwind configuration for custom values

```tsx
// Example component with Tailwind styling
function StyledCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  );
}
```

### Using CSS Modules

For component-specific styles:

1. Create a CSS module file (e.g., `MyComponent.module.css`)
2. Import and use the styles in your component

```css
/* MyComponent.module.css */
.container {
  position: relative;
  overflow: hidden;
}

.specialEffect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0));
  transform: skewX(-20deg);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-20deg); }
  100% { transform: translateX(200%) skewX(-20deg); }
}
```

```tsx
// MyComponent.tsx
import styles from './MyComponent.module.css';

export function MyComponent({ children }) {
  return (
    <div className={styles.container}>
      {children}
      <div className={styles.specialEffect} />
    </div>
  );
}
```

## Accessibility Considerations

When customizing the UI, keep these accessibility guidelines in mind:

### Semantic HTML

Use appropriate HTML elements for their semantic purpose:
- `<button>` for interactive controls
- `<a>` for navigation links
- Heading elements (`<h1>` through `<h6>`) in proper hierarchy
- `<form>`, `<input>`, and `<label>` for form elements

### ARIA Attributes

Use ARIA attributes for complex components:

```tsx
function ExpandableSection({ title, children, isExpanded = false }) {
  const [expanded, setExpanded] = useState(isExpanded);
  
  return (
    <div className="expandable-section">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="section-content"
        className="w-full text-left py-2 flex justify-between items-center"
      >
        <span>{title}</span>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
      <div 
        id="section-content"
        className={`overflow-hidden transition-all ${expanded ? 'max-h-96' : 'max-h-0'}`}
      >
        {children}
      </div>
    </div>
  );
}
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:
- Maintain proper tab order with `tabIndex`
- Provide keyboard handlers (`onKeyDown`, etc.)
- Support standard keyboard interactions (Enter, Space, arrow keys)

### Color Contrast

Maintain sufficient color contrast for text and UI elements:
- Use the Tailwind `text-*` and `bg-*` classes that meet WCAG standards
- Test contrast using tools like WebAIM's Contrast Checker
- Provide visual cues beyond just color (icons, underlines, etc.)

## Internationalization

The application currently does not have full internationalization support, but here's how you can prepare your UI components for it:

### Text Extraction

Extract all user-facing text strings:

```tsx
// Before
function Greeting() {
  return <h1>Welcome to the app!</h1>;
}

// After
function Greeting({ t }) {
  return <h1>{t('greeting')}</h1>;
}
```

### Layout Considerations

Design UI to accommodate text expansion in other languages:
- Avoid fixed-width text containers
- Allow for text that may be 30-40% longer in some languages
- Use flexible layouts that can adapt to different text lengths

### Right-to-Left Support

Consider RTL language support for interfaces:
- Use CSS logical properties (`margin-inline-start` instead of `margin-left`)
- Test with RTL languages by adding `dir="rtl"` to HTML elements

## Conclusion

This guide provides the foundation for customizing and extending the UI of the n8n-make-converter application. By following these guidelines, you can create a consistent, accessible, and maintainable user interface that aligns with the overall design system while meeting your specific requirements. 