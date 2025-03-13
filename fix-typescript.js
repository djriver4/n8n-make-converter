const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/converters/n8n-to-make.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the questionable parameters section
content = content.replace(
  /for \(const \[key, value\] of Object\.entries\(mappedModule\.parameters\)\) \{\s*if \(typeof value === "string" && value\.includes\("\{\{"*\)\) \{\s*parameterReviewData\[node\.id\]\.questionableParameters\[key\] = \{\s*value,\s*reason: "Contains expression that may need review",\s*\}\s*\} else \{\s*parameterReviewData\[node\.id\]\.parameters\[key\] = value\s*\}\s*\}/g,
  `for (const [key, value] of Object.entries(mappedModule.parameters)) {
          if (typeof value === "string" && value.includes("{{")) {
            const reviewEntry = \`Module \${node.name}, parameter \${key}\`;
            if (!parameterReviewData.includes(reviewEntry)) {
              parameterReviewData.push(reviewEntry);
            }
          }
        }`
);

// Fix any function node handling that uses parameterReviewData as an object
content = content.replace(
  /parameterReviewData\[node\.name\] = \{\s*nodeName: node\.name,\s*nodeType: node\.type,\s*parameters: \{\},\s*questionableParameters: \{ code: \{ value: node\.parameters\.functionCode, reason: "Complex code that may need adaptation" \} \},\s*\};/g,
  `const codeReviewEntry = \`Module \${node.name}, parameter code\`;
            if (!parameterReviewData.includes(codeReviewEntry)) {
              parameterReviewData.push(codeReviewEntry);
            }`
);

// Fix any _manualAdjustments references
content = content.replace(
  /if \(parameterReviewData\._manualAdjustments\) \{\s*\/\/ Add to manual adjustments list\s*if \(!parameterReviewData\._manualAdjustments\.includes\(\`Module \$\{node\.name\}, parameter code\`\)\) \{\s*parameterReviewData\._manualAdjustments\.push\(\`Module \$\{node\.name\}, parameter code\`\);\s*\}\s*\} else \{\s*parameterReviewData\._manualAdjustments = \[\`Module \$\{node\.name\}, parameter code\`\];\s*\}/g,
  ''
);

// Write the fixed content back to the file
fs.writeFileSync(filePath, content);
console.log('TypeScript errors fixed in n8n-to-make.ts');
