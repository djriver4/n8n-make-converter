# Contributing to n8n-Make Converter

Thank you for your interest in contributing to the n8n-Make Converter! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Setting Up the Development Environment

1. **Fork and Clone the Repository**

   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/yourusername/n8n-make-converter.git
   cd n8n-make-converter
   ```

2. **Install Dependencies**

   ```bash
   # Install dependencies with legacy peer deps to resolve conflicts
   npm install --legacy-peer-deps
   ```

3. **Set Up Development Environment**

   ```bash
   # Start the development server
   npm run dev
   ```

4. **Run Tests**

   ```bash
   # Run the test suite
   npm test
   
   # Run tests with coverage
   npm run test:coverage
   ```

## Project Structure

Understanding the project structure will help you find the right place to make changes:

```
├── app/                     # Next.js frontend application
├── components/              # React components
├── docs/                    # Documentation
├── lib/                     # Core conversion library
│   ├── converters/          # Specialized converters
│   ├── expression-evaluator.ts # Expression handling
│   ├── node-mappings/       # Node mapping definitions
│   └── workflow-converter.ts # Main converter
├── __tests__/               # Tests
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── fixtures/            # Test data
└── scripts/                 # Utility scripts
```

## Code Style and Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Ensure strict type checking is enabled
- Avoid using `any` types where possible
- Use interfaces for object shapes and type aliases for unions/intersections
- Document public APIs with JSDoc comments

Example of good type usage:

```typescript
/**
 * Options for node conversion
 */
interface ConversionOptions {
  /**
   * Whether to skip validation of the input workflow
   */
  skipValidation?: boolean;
  
  /**
   * Include debug information in the result
   */
  debug?: boolean;
}

/**
 * Convert a node with the given options
 * 
 * @param node - The node to convert
 * @param options - Conversion options
 * @returns The conversion result
 */
function convertNode(
  node: Record<string, unknown>,
  options: ConversionOptions = {}
): ConversionResult {
  // Implementation
}
```

### Testing Standards

- Write unit tests for all new functionality
- Include integration tests for complex features
- Aim for at least 80% test coverage for new code
- Use descriptive test names that explain what's being tested
- Structure tests with arrange-act-assert pattern

Example of a good test:

```typescript
describe('NodeMapper', () => {
  describe('convertN8nNodeToMakeModule', () => {
    it('should correctly map parameters according to the mapping', () => {
      // Arrange
      const mapper = new NodeMapper(testMappingDatabase);
      const n8nNode = {
        id: '1',
        name: 'Test Node',
        type: 'n8n-nodes-base.httpRequest',
        parameters: {
          url: 'https://example.com',
          method: 'GET'
        }
      };
      
      // Act
      const result = mapper.convertN8nNodeToMakeModule(n8nNode);
      
      // Assert
      expect(result.node).toHaveProperty('type', 'http');
      expect(result.node.parameters).toHaveProperty('URL', 'https://example.com');
      expect(result.node.parameters).toHaveProperty('method', 'GET');
    });
  });
});
```

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(node-mapper): add support for HTTP request parameters

Added mapping for advanced HTTP request parameters including headers,
query parameters, and authentication options.

Closes #123
```

## Contribution Workflow

### 1. Create a New Branch

Create a branch with a descriptive name based on the feature or fix you're implementing:

```bash
git checkout -b feat/add-http-advanced-params
```

### 2. Make Your Changes

- Make the necessary code changes
- Add or update tests as needed
- Add or update documentation
- Run linting and tests to ensure quality

```bash
# Run linting
npm run lint

# Run tests
npm test
```

### 3. Commit Your Changes

Follow the commit message guidelines described above:

```bash
git commit -m "feat(node-mapper): add support for HTTP request parameters"
```

### 4. Push to Your Fork

```bash
git push origin feat/add-http-advanced-params
```

### 5. Create a Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your fork and branch
- Provide a clear description of the changes
- Reference any related issues

### 6. Code Review

- Be responsive to feedback and questions
- Make requested changes if needed
- Ensure tests pass in the CI environment

## Adding Node Mappings

One of the most valuable contributions is adding support for more node types. Here's how to add a new node mapping:

### 1. Identify the Node Type

Find the node type identifier in both n8n and Make.com:
- n8n: Look for the `type` property in the node JSON
- Make.com: Look for the `type` property in the module JSON

### 2. Create the Mapping

Add a new mapping to `lib/node-mappings/base-mappings.ts` or create a specialized mapping in `lib/node-mappings/specialized-mappings.ts` if needed:

```typescript
export const httpMapping: NodeMapping = {
  source: "n8n",
  sourceNodeType: "n8n-nodes-base.httpRequest",
  targetNodeType: "http",
  metadata: {
    displayName: "HTTP Request",
    description: "Make HTTP requests",
    version: "1.0",
  },
  parameterMappings: {
    url: {
      sourcePath: "url",
      targetPath: "URL"
    },
    method: {
      sourcePath: "method",
      targetPath: "method"
    }
    // Add more parameter mappings as needed
  }
};
```

### 3. Register the Mapping

Add your mapping to the database in `lib/node-mappings/mapping-database.ts`:

```typescript
import { httpMapping } from './base-mappings';

export const nodeMappingDatabase: NodeMappingDatabase = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  mappings: {
    // Existing mappings...
    "n8n-nodes-base.httpRequest": httpMapping,
    // Your new mapping...
  }
};
```

### 4. Add Tests

Create tests for your mapping in the appropriate test file:

```typescript
it('should convert a HTTP Request node correctly', () => {
  const n8nNode = {
    // Test node definition
  };
  
  const result = mapper.convertN8nNodeToMakeModule(n8nNode);
  
  // Assertions for your mapping
});
```

## Reporting Issues

If you encounter a bug or have a feature request, please report it through GitHub Issues:

1. Check if the issue already exists
2. Use the appropriate template (bug report or feature request)
3. Provide detailed reproduction steps for bugs
4. Include relevant logs and error messages
5. Describe expected behavior vs. actual behavior

## Getting Help

If you have questions about contributing:

1. Check the [documentation](../README.md) for information
2. Ask in GitHub Discussions
3. Contact the project maintainers

Thank you for contributing to the n8n-Make Converter! Your efforts help make workflow conversion between platforms more seamless for users. 


## Code of Conduct

Please note that this project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](LICENSE). 