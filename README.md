# n8n-make-converter

A powerful tool for converting automation workflows between [n8n](https://n8n.io/) and [Make.com](https://make.com/) (formerly Integromat) platforms.

## Features

- **Bidirectional Conversion**: Convert workflows from n8n to Make.com and vice versa
- **Intelligent Expression Handling**: Automatically transforms expressions between platform formats
- **Advanced Node Mapping**: Maps node types and parameters between platforms
- **Connection Preservation**: Maintains the connections/routes between nodes
- **Visual UI**: Web interface for easy workflow conversion and visualization
- **Detailed Reporting**: Identifies potential issues or unmapped nodes
- **Performance Monitoring**: Built-in performance tracking for processing large workflows
- **Validation Tools**: Automated validation of fixtures and node mappings for code quality

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-make-converter.git
cd n8n-make-converter

# Install dependencies (use legacy peer deps to resolve conflicts)
npm install --legacy-peer-deps

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the converter.

### Usage

1. **Upload Workflow**: Upload your n8n or Make.com workflow JSON file
2. **Configure Options**: Set conversion options (if needed)
3. **Convert**: Click the convert button
4. **Review Results**: View the converted workflow with any warnings or issues
5. **Download**: Download the converted workflow

## Architecture

The converter is built with a modular architecture:

```
lib/                     # Core converter library
├── workflow-converter.ts # Main conversion orchestration
├── node-mappings/       # Node type mapping definitions
├── converters/          # Specialized conversion utilities
├── expression-evaluator.ts # Expression parsing and transformation
app/                     # Next.js frontend app
components/              # UI components
docs/                    # Documentation
__tests__/utils/         # Test utilities and validation tools
├── fixture-validator.ts # Validates test fixtures
├── mapping-validator.ts # Validates node mappings
├── validate-codebase.ts # Main validation script
```

### Core Components

- **Workflow Converter**: Orchestrates the entire conversion process
- **Node Mapper**: Maps nodes between platforms using mapping definitions
- **Parameter Processor**: Handles conversion of node parameters
- **Expression Evaluator**: Transforms expressions between platform formats
- **Validation Tools**: Ensures code quality and completeness of mappings

For detailed documentation on each component, see the [docs directory](./docs).

## Documentation

Comprehensive documentation is available in the [docs directory](./docs):

### Core Concepts
- [Architecture](docs/architecture.md): Overview of system architecture and design principles
- [Conversion Logic](docs/conversion-logic.md): Explains the workflow conversion process
- [Expression Evaluator](docs/expression-evaluator.md): Details on expression handling, including string concatenation
- [Node Mapping](docs/node-mapping.md): How nodes are mapped between platforms

### Implementation Guides
- [Contributing Node Mappings](docs/contributing-node-mappings.md): How to add new node type mappings
- [Fixture and Mapping Guidelines](docs/fixture-and-mapping-guidelines.md): Guidelines for test fixtures and mappings

### Project Status
- [Implementation Status](docs/implementation-status.md): Current project status
- [Version Compatibility](docs/version-compatibility.md): Platform version information
- [Recent Fixes](docs/recent-fixes.md): Latest improvements and bug fixes

### Developer Guides
- [Contributing](docs/contributing.md): How to contribute to the project
- [Usage Guide](docs/usage-guide.md): How to use the converter
- [Troubleshooting](docs/troubleshooting.md): Solutions for common issues

For a complete documentation index, please see [Documentation Index](./docs/README.md).

### Documentation Updates

The documentation has been recently audited and improved with:
- Comprehensive troubleshooting guide
- Recent fixes documentation
- Documentation navigation index
- TypeScript interface improvements guide

See the [Documentation Audit Summary](./docs/documentation-audit-summary.md) for details.

## Validation and Quality Tools

The project includes validation tools to ensure code quality:

```bash
# Run validation of fixtures and node mappings
npm run validate
```

This command:
- Validates that all required test fixtures exist and have the correct structure
- Ensures all required node mappings are present
- Generates reports on mapping coverage
- Provides templates for missing mappings

## Testing

```bash
# Run the test suite
npm test

# Run tests with coverage
npm run test:coverage

# Run specific tests
npx jest __tests__/path/to/test.ts
```

For detailed documentation on testing:

- [Test Updates Documentation](docs/test/test-updates.md) - Overview of test suite updates and fixed issues
- [Expression Conversion Testing](docs/test/expression-conversion-tests.md) - Guide for testing expression handling
- [Parameter Handling Testing](docs/test/parameter-handling-tests.md) - Guide for testing node parameter processing

The project includes comprehensive test suites for:
- Unit testing of individual components
- Integration testing of conversion processes
- End-to-end testing of workflow transformations
- Validation testing of mappings and fixtures

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Before submitting your PR, please:
- Run the validation tools (`npm run validate`)
- Ensure tests pass (`npm test`)
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [n8n](https://n8n.io/) - Open-source workflow automation tool
- [Make.com](https://make.com/) - Workflow automation platform (formerly Integromat)
