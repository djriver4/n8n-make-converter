import { getNodeMappings } from '../../lib/mappings/node-mapping';

/**
 * List of common n8n node types that should have mappings
 */
export const REQUIRED_N8N_NODE_TYPES = [
  'n8n-nodes-base.httpRequest',
  'n8n-nodes-base.function',
  'n8n-nodes-base.jsonParse',
  'n8n-nodes-base.switch',
  'n8n-nodes-base.set',
  'n8n-nodes-base.if',
  'n8n-nodes-base.googleSheets',
  'n8n-nodes-base.emailSend',
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.dateTime'
];

/**
 * List of common Make module types that should have mappings
 */
export const REQUIRED_MAKE_MODULE_TYPES = [
  'http:ActionSendData',
  'tools',
  'json',
  'builtin:BasicRouter',
  'google-sheets:addRow',
  'email:ActionSendEmail',
  'webhooks',
  'date'
];

/**
 * Type definitions for node mappings
 */
interface NodeMapping {
  type: string;
  parameterMap?: Record<string, string>;
  description: string;
  displayName: string;
}

interface NodeMappings {
  n8nToMake: Record<string, NodeMapping>;
  makeToN8n: Record<string, NodeMapping>;
}

/**
 * Validates that all required node mappings are present
 */
export function validateNodeMappings(): { 
  valid: boolean; 
  missing: { n8nToMake: string[]; makeToN8n: string[] };
  mapped: { n8nToMake: string[]; makeToN8n: string[] };
} {
  const mappings = getNodeMappings() as NodeMappings;
  const missing = {
    n8nToMake: [] as string[],
    makeToN8n: [] as string[]
  };
  const mapped = {
    n8nToMake: [] as string[],
    makeToN8n: [] as string[]
  };
  
  // Check n8n to Make mappings
  for (const nodeType of REQUIRED_N8N_NODE_TYPES) {
    if (!(nodeType in mappings.n8nToMake)) {
      missing.n8nToMake.push(nodeType);
    } else {
      mapped.n8nToMake.push(nodeType);
    }
  }
  
  // Check Make to n8n mappings
  for (const moduleType of REQUIRED_MAKE_MODULE_TYPES) {
    if (!(moduleType in mappings.makeToN8n)) {
      missing.makeToN8n.push(moduleType);
    } else {
      mapped.makeToN8n.push(moduleType);
    }
  }
  
  const valid = missing.n8nToMake.length === 0 && missing.makeToN8n.length === 0;
  
  return { valid, missing, mapped };
}

/**
 * Generates a report of node mapping coverage
 */
export function generateMappingReport(): string {
  const { valid, missing, mapped } = validateNodeMappings();
  const mappings = getNodeMappings() as NodeMappings;
  
  let report = "Node Mapping Report:\n\n";
  
  // Overall status
  report += `Overall Status: ${valid ? '✅ All required mappings present' : '❌ Missing required mappings'}\n\n`;
  
  // n8n to Make mappings
  report += "n8n to Make Mappings:\n";
  report += `- Required: ${REQUIRED_N8N_NODE_TYPES.length}\n`;
  report += `- Mapped: ${mapped.n8nToMake.length}\n`;
  report += `- Missing: ${missing.n8nToMake.length}\n`;
  
  if (missing.n8nToMake.length > 0) {
    report += "\nMissing n8n to Make mappings:\n";
    missing.n8nToMake.forEach(nodeType => {
      report += `- ${nodeType}\n`;
    });
  }
  
  report += "\nAll n8n to Make mappings:\n";
  Object.entries(mappings.n8nToMake).forEach(([nodeType, mapping]) => {
    report += `- ${nodeType} -> ${mapping.type || 'unknown'}\n`;
  });
  
  // Make to n8n mappings
  report += "\n\nMake to n8n Mappings:\n";
  report += `- Required: ${REQUIRED_MAKE_MODULE_TYPES.length}\n`;
  report += `- Mapped: ${mapped.makeToN8n.length}\n`;
  report += `- Missing: ${missing.makeToN8n.length}\n`;
  
  if (missing.makeToN8n.length > 0) {
    report += "\nMissing Make to n8n mappings:\n";
    missing.makeToN8n.forEach(moduleType => {
      report += `- ${moduleType}\n`;
    });
  }
  
  report += "\nAll Make to n8n mappings:\n";
  Object.entries(mappings.makeToN8n).forEach(([moduleType, mapping]) => {
    report += `- ${moduleType} -> ${mapping.type || 'unknown'}\n`;
  });
  
  return report;
}

/**
 * Provides guidance on implementing missing mappings
 */
export function generateMappingTemplate(nodeType: string, direction: 'n8nToMake' | 'makeToN8n'): string {
  if (direction === 'n8nToMake') {
    return `// Add this to the n8nToMake section of the node mapping file:
"${nodeType}": {
  type: "MAKE_MODULE_TYPE_HERE",
  parameterMap: {
    // Map n8n parameters to Make parameters
    "n8nParam": "makeParam"
  },
  description: "Description of the node's functionality",
  displayName: "Human readable name"
},`;
  } else {
    return `// Add this to the makeToN8n section of the node mapping file:
"${nodeType}": {
  type: "N8N_NODE_TYPE_HERE",
  parameterMap: {
    // Map Make parameters to n8n parameters
    "makeParam": "n8nParam"
  },
  description: "Description of the module's functionality",
  displayName: "Human readable name"
},`;
  }
} 