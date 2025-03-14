const fs = require('fs');
const path = require('path');

const filePath = path.resolve(process.cwd(), 'lib/node-mappings/nodes-mapping.json');
console.log(`Reading file from: ${filePath}`);

try {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`File size: ${content.length} bytes`);
  console.log(`First 100 characters: ${content.substring(0, 100)}`);
  
  try {
    const parsed = JSON.parse(content);
    console.log(`Parsed successfully as JSON`);
    console.log(`Version: ${parsed.version}`);
    console.log(`Last updated: ${parsed.lastUpdated}`);
    console.log(`Number of mappings: ${Object.keys(parsed.mappings || {}).length}`);
    
    // Print first mapping
    const firstKey = Object.keys(parsed.mappings || {})[0];
    if (firstKey) {
      console.log(`First mapping: ${firstKey}`);
    }
  } catch (e) {
    console.error(`Error parsing JSON: ${e.message}`);
  }
} catch (e) {
  console.error(`Error reading file: ${e.message}`);
} 