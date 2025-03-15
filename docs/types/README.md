# Types Documentation

This section provides comprehensive information about the TypeScript type system used in the n8n-Make Converter project. Understanding these types is essential for maintaining type safety and preventing runtime errors.

## Key Documents

- [**Interface Reference**](./interfaces.md) - Comprehensive documentation of all TypeScript interfaces used in the project, including recent updates and improvements
- [**Type Safety Guidelines**](./type-safety.md) - Best practices and guidelines for maintaining type safety in the codebase

## Why Types Matter

Types are a cornerstone of the n8n-Make Converter project for several reasons:

1. **Runtime Error Prevention**: Strong typing catches errors at compile time
2. **Code Quality**: Types serve as living documentation
3. **Developer Experience**: Better autocomplete and code navigation
4. **Refactoring Safety**: Easier and safer code changes
5. **API Contracts**: Clear contracts between components

## Key Type Categories

The n8n-Make Converter uses several categories of types:

### 1. Workflow Types

Types that represent the structure of workflows in both n8n and Make.com platforms:

- `N8nWorkflow` - Structure of n8n workflows
- `MakeWorkflow` - Structure of Make.com workflows

### 2. Node/Module Types

Types that represent nodes and modules, which are the building blocks of workflows:

- `N8nNode` - Structure of n8n nodes
- `MakeModule` - Structure of Make.com modules

### 3. Connection Types

Types that represent connections between nodes/modules:

- `N8nConnection` - Structure of n8n connections
- `MakeRoute` - Structure of Make.com routes

### 4. Conversion Types

Types that represent conversion results and metadata:

- `ConversionResult` - Result of workflow conversion
- `WorkflowConversionResult` - Extended conversion result with specific workflow types
- `ConversionLog` - Log entry during conversion
- `ParameterReview` - Parameter that needs review

### 5. Utility Types

Utility types used throughout the codebase:

- Discriminated unions for type safety
- Generic types for reusable code
- Type guards for runtime type checking

## Recent Type Improvements

The type system has undergone several improvements to enhance type safety:

1. **Interface Updates**: Updated interfaces to better match actual usage
2. **Optional Properties**: Improved handling of optional properties
3. **Type Guards**: Added type guards for better runtime type checking
4. **Non-Nullable Return Types**: Ensured functions return non-nullable values
5. **Strict TypeScript Config**: Enabled stricter TypeScript configuration

## Working with Types

For developers working with the n8n-Make Converter codebase, understanding and properly using these types is essential. The [Type Safety Guidelines](./type-safety.md) document provides comprehensive guidance on how to use types effectively and avoid common pitfalls.

## Contributing to Type Definitions

If you identify issues with the current type definitions or have suggestions for improvements, please follow the [Contributing Guide](../development/contributing.md) to submit your changes. When updating type definitions, ensure that they:

1. Accurately represent the actual data structures used in the code
2. Maintain backward compatibility where possible
3. Include proper documentation
4. Are consistently used throughout the codebase

By contributing to improved type definitions, you help make the n8n-Make Converter more robust and maintainable. 