# Installation Guide

This guide provides detailed instructions for installing the n8n-Make Converter in various environments.

## Prerequisites

Before installing, ensure you have:

- Node.js (v14 or later)
- npm (v6 or later) or yarn (v1.22 or later)
- At least 100MB of free disk space

## Installation Methods

### NPM/Yarn Installation

The recommended way to install the converter is via npm or yarn:

```bash
# Using npm
npm install n8n-make-converter

# Using yarn
yarn add n8n-make-converter

# Using pnpm
pnpm add n8n-make-converter
```

### Global Installation

For command-line usage, you might prefer a global installation:

```bash
# Using npm
npm install -g n8n-make-converter

# Using yarn
yarn global add n8n-make-converter
```

### Docker Installation

For containerized environments, use our Docker image:

```bash
# Pull the image
docker pull n8nmakeconverter/converter:latest

# Run the container
docker run -p 3000:3000 n8nmakeconverter/converter:latest
```

## Development Setup

For contributing to the project:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/n8n-make-converter.git
   cd n8n-make-converter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## Verifying Installation

To verify that the installation was successful:

```bash
# For local installations
npx n8n-make-converter --version

# For global installations
n8n-make-converter --version
```

## Configuration

After installation, you can configure the converter:

1. Create a configuration file at `~/.n8n-make-converter/config.json` (or use the web interface)
2. Set your preferences:
   ```json
   {
     "defaultDirection": "n8n-to-make",
     "theme": "dark",
     "advancedOptions": {
       "timeout": 30000,
       "skipValidation": false
     }
   }
   ```

## Troubleshooting Installation Issues

If you encounter problems during installation:

### Common Issues

#### 1. Node version compatibility

Error: `Error: The engine "node" is incompatible with this module`

Solution: Update Node.js to v14 or later:
```bash
nvm install 14
nvm use 14
```

#### 2. Permission errors

Error: `EACCES: permission denied`

Solution: Try using sudo (for global installs) or fix npm permissions:
```bash
sudo npm install -g n8n-make-converter
# Or fix permissions
chown -R $(whoami) ~/.npm
```

#### 3. Network issues

Error: `npm ERR! network timeout`

Solution: Try using a different npm registry or check your network connection:
```bash
npm config set registry https://registry.npmjs.org/
npm install n8n-make-converter
```

## Next Steps

After installation:

- Read the [Quick Start Guide](./quick-start.md) to begin using the converter
- Explore [Usage Examples](./usage-examples.md) for common scenarios
- Check out the [Architecture Overview](../architecture/overview.md) to understand how it works 