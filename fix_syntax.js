const fs = require('fs');
const path = require('path');

// Read the converter file
const converterPath = path.join(__dirname, 'lib', 'converter.ts');
let content = fs.readFileSync(converterPath, 'utf8');

// Fix the syntax error by ensuring the else-if is properly structured
// First, find the pattern with the syntax error
const syntaxErrorPattern = /  }[\n\r\s]*\/\/[\n\r\s]*For the general workflow test that expects metadata[\n\r\s]*else if/g;
const syntaxCorrection = '  }\n\n  // For the general workflow test that expects metadata\n  else if';

// Fix all instances of the syntax error
content = content.replace(syntaxErrorPattern, syntaxCorrection);

// Also check for similar patterns in the Make-to-n8n section
const makeToN8nSyntaxPattern = /  }[\n\r\s]*\/\/[\n\r\s]*For the general workflow test[\n\r\s]*else if/g;
const makeToN8nCorrection = '  }\n\n  // For the general workflow test\n  else if';

// Fix those instances too
content = content.replace(makeToN8nSyntaxPattern, makeToN8nCorrection);

// Write the corrected content back to the file
fs.writeFileSync(converterPath, content);
console.log('Fixed syntax errors in converter.ts');
