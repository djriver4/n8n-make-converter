const fs = require('fs');
const path = require('path');

const filePath = path.resolve(process.cwd(), 'lib/node-mappings/nodes-mapping.json');

console.log('File exists:', fs.existsSync(filePath));

try {
  const data = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(data);
  console.log('Valid JSON:', true);
  console.log('Has mappings:', !!json.mappings);
  console.log('Mappings count:', Object.keys(json.mappings).length);
  
  // Check if httpRequest mapping exists
  if (json.mappings.httpRequest) {
    console.log('httpRequest mapping exists:', true);
    console.log('n8nNodeType:', json.mappings.httpRequest.n8nNodeType);
    console.log('makeModuleId:', json.mappings.httpRequest.makeModuleId);
  } else {
    console.log('httpRequest mapping exists:', false);
  }
} catch (error) {
  console.error('Error:', error.message);
} 