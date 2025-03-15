# Documentation Assets

This directory contains assets such as images, diagrams, and screenshots used throughout the n8n-Make Converter documentation.

## Structure

```
assets/
├── diagrams/            # Architecture and flow diagrams
├── screenshots/         # UI screenshots and examples
└── images/              # Other images such as logos and icons
```

## Using Assets in Documentation

When including assets in documentation pages, use the following relative path format:

```markdown
![Alt text](../assets/category/image-name.png "Optional title")
```

For example, to reference an architecture diagram:

```markdown
![Architecture Diagram](../assets/diagrams/architecture-overview.png "n8n-Make Converter Architecture")
```

## Asset Guidelines

### 1. File Formats

- **Diagrams**: Use PNG or SVG format for best clarity
- **Screenshots**: Use PNG format
- **Logos and Icons**: Use SVG format when possible, otherwise PNG

### 2. Naming Convention

- Use kebab-case for asset filenames (e.g., `architecture-overview.png`)
- Include the asset type in the filename when appropriate (e.g., `workflow-example-diagram.png`)
- Use descriptive names that clearly indicate the content

### 3. Size and Resolution

- Keep file sizes under 500KB when possible
- Use appropriate resolution for screenshots (typically 1200-1600px width)
- Optimize images to reduce file size while maintaining clarity
- For diagrams, ensure text is readable at the displayed size

### 4. Diagram Creation

When creating diagrams:

1. Use consistent styling across all diagrams
2. Follow the project's color scheme
3. Include a legend if the diagram uses special symbols or colors
4. Export to SVG for vector graphics, or high-resolution PNG

### 5. Screenshots

When creating screenshots:

1. Use a standard window size and zoom level
2. Highlight relevant areas when appropriate
3. Remove sensitive information
4. Ensure UI is in a clean state (no unrelated notifications or popups)
5. Use dark theme or light theme consistently

## Updating Assets

When updating an existing asset:

1. Keep the same filename to avoid breaking links
2. Update all references if the filename must change
3. Document significant changes in the commit message

## Adding New Assets

When adding new assets:

1. Place them in the appropriate subdirectory
2. Follow the naming conventions
3. Optimize the file size
4. Include proper alt text in all references
5. Reference the asset in a relevant documentation page

## Missing Assets

If you notice documentation referencing missing assets, or assets that need updating, please create an issue or a pull request to address the problem.

## Legal Considerations

- Only include assets that we have the rights to use
- For third-party content, ensure proper attribution
- Do not include screenshots containing sensitive or private information 