# n8n-make-converter
A tool for converting workflows between n8n and Make platforms

## Features

- Convert workflows from n8n to Make.com
- Convert workflows from Make.com to n8n
- Dynamic expression handling between platforms
- Intelligent node mapping and parameter conversion
- Web interface for easy workflow conversion

## Expression Handling

The converter includes a powerful expression parsing and evaluation system inspired by n8n's expression engine. This system allows for:

- Converting expressions between n8n and Make.com formats
- Evaluating expressions at runtime with contextual data
- Identifying expressions that might need special handling or review

For more details, see the [Expression Evaluator documentation](docs/expression-evaluator.md).

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the converter.
