# Architecture Overview

This document provides a comprehensive overview of the n8n-Make Converter's architecture, explaining how the different components interact and the design principles that guide the implementation.

## System Overview

The n8n-Make Converter is designed as a modular application with a clear separation of concerns:

1. **Core Library**: A TypeScript library that handles all conversion logic
2. **Web Interface**: A Next.js application that provides a user-friendly frontend
3. **Plugins System**: Extensible architecture allowing for custom node mappings

```
┌─────────────────┐      ┌───────────────────┐
│                 │      │                   │
│  Next.js UI     │◄────►│  Converter Core   │
│                 │      │                   │
└─────────────────┘      └───────┬───────────┘
                                 │
                                 ▼
                         ┌───────────────────┐
                         │                   │
                         │  Node Mappings    │
                         │                   │
                         └───────────────────┘
```

## Core Components

### Workflow Converter (`workflow-converter.ts`)

The central orchestrator of the conversion process. Responsibilities include:

- Validating input workflows
- Coordinating the conversion of individual nodes/modules
- Converting connections/routes between nodes
- Assembling the final converted workflow
- Generating reports of unmapped nodes or potential issues

### Node Mapper (`node-mappings/node-mapper.ts`)

Responsible for mapping individual nodes between platforms:

- Locating the appropriate mapping for a given node type
- Applying the mapping to convert parameters
- Handling special cases for complex node types
- Transforming expressions within parameters

### Expression Evaluator (`expression-evaluator.ts`)

Handles the parsing, evaluation, and conversion of expressions:

- Converts between n8n's `$json.property` format and Make's `1.property` format
- Handles complex expressions with functions and operators
- Manages string interpolation with embedded expressions
- Provides evaluation capabilities for testing expressions
- Supports string concatenation operations (e.g., `"prefix" + $json.value`)
- Processes nested function calls and mixed data types

### Parameter Processor (`converters/parameter-processor.ts`)

Specialized utility for converting parameters between platforms:

- Handles different parameter structures between platforms
- Ensures non-nullable return types for type safety
- Processes nested parameters and arrays
- Applies transformations based on parameter types

## Design Principles

The n8n-Make Converter follows several key design principles:

### 1. Type Safety

- Extensive use of TypeScript interfaces and type definitions
- Non-nullable return types to prevent runtime errors
- Comprehensive type checking across component boundaries

### 2. Modularity

- Clear separation of concerns between components
- Well-defined interfaces between modules
- Independent testing of each component

### 3. Extensibility

- Plugin system for custom node mappings
- Abstract base classes and interfaces for extending functionality
- Configuration options for customizing conversion behavior

### 4. Error Handling

- Comprehensive error reporting
- Graceful degradation when mappings are incomplete
- Clear identification of conversion issues

## Implementation Status

The following components have been fully implemented:

1. **Core Type Definitions**
   - Comprehensive type definitions for n8n and Make.com structures
   - Interface definitions for nodes, modules, connections, and workflow structures

2. **Expression Evaluator**
   - Implementation of expression evaluation and conversion
   - Support for converting expressions between n8n and Make.com formats
   - Handling of complex expressions, string interpolation, and function calls

3. **Node Parameter Processor**
   - Implementation of parameter transformation
   - Support for converting parameter structures between platforms
   - Expression handling within parameters
   - Robust handling of null/undefined values with non-nullable return types

4. **Node Mappings**
   - Schema definitions for node mappings
   - Base mappings for common node types
   - Specialized mappings for specific node types

5. **Workflow Converter**
   - Main converter implementation
   - Support for converting complete workflows in both directions
   - Handling of connections/routes between nodes/modules
   - Improved parameter handling with more robust type safety

Components currently in progress:

1. **Node Mapper** - Core functions implemented, some issues remain with certain node types
2. **Integration Tests** - Basic tests passing, complex expression tests pending

## Recent Architectural Improvements

The n8n-Make Converter has undergone several architectural improvements to enhance stability, maintainability, and functionality:

### 1. Enhanced Expression Evaluation

The Expression Evaluator has been strengthened with:

- Improved string concatenation handling for URL construction and dynamic content
- More robust variable replacement in expressions
- Better handling of edge cases and malformed expressions
- Enhanced type coercion for mixed-type operations

### 2. Null Safety Enhancements

Implemented throughout the codebase:

- Optional chaining for accessing potentially undefined properties
- Null coalescence for providing default values
- Defensive programming with explicit null checks
- Type guards to ensure type safety

### 3. Advanced Error Handling

Error handling has been improved with:

- More detailed error messages providing context about the failure
- Hierarchical error classification for better debugging
- Safe error recovery to prevent cascading failures
- Comprehensive logging of errors with relevant context

## Future Architecture

Planned enhancements to the architecture include:

1. **Microservice Architecture**: Split into separate services for front-end, conversion, and mapping
2. **Real-time Collaboration**: WebSocket integration for collaborative workflow editing
3. **Server-Side Caching**: Redis-based caching for improved performance
4. **Workflow Visualization**: Interactive graph visualization of workflows 