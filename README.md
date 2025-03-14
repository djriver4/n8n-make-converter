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
```

### Core Components

- **Workflow Converter**: Orchestrates the entire conversion process
- **Node Mapper**: Maps nodes between platforms using mapping definitions
- **Parameter Processor**: Handles conversion of node parameters
- **Expression Evaluator**: Transforms expressions between platform formats

For detailed documentation on each component, see the [docs directory](./docs).

## Documentation

- [Conversion Logic](docs/conversion-logic.md): Explains how the conversion process works
- [Expression Evaluator](docs/expression-evaluator.md): Details on expression handling
- [Node Mapping](docs/node-mapping.md): How nodes are mapped between platforms
- [Version Compatibility](docs/version-compatibility.md): Platform version information
- [Implementation Status](docs/implementation-status.md): Current project status

## Testing

```bash
# Run the test suite
npm test

# Run tests with coverage
npm run test:coverage

# Run specific tests
npx jest __tests__/path/to/test.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [n8n](https://n8n.io/) - Open-source workflow automation tool
- [Make.com](https://make.com/) - Workflow automation platform (formerly Integromat)
