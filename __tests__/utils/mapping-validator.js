"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUIRED_MAKE_MODULE_TYPES = exports.REQUIRED_N8N_NODE_TYPES = void 0;
exports.validateNodeMappings = validateNodeMappings;
exports.generateMappingReport = generateMappingReport;
exports.generateMappingTemplate = generateMappingTemplate;
const node_mapping_1 = require("../../lib/mappings/node-mapping");
/**
 * List of common n8n node types that should have mappings
 */
exports.REQUIRED_N8N_NODE_TYPES = [
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
exports.REQUIRED_MAKE_MODULE_TYPES = [
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
 * Validates that all required node mappings are present
 */
function validateNodeMappings() {
    const mappings = (0, node_mapping_1.getNodeMappings)();
    const missing = {
        n8nToMake: [],
        makeToN8n: []
    };
    const mapped = {
        n8nToMake: [],
        makeToN8n: []
    };
    // Check n8n to Make mappings
    for (const nodeType of exports.REQUIRED_N8N_NODE_TYPES) {
        if (!(nodeType in mappings.n8nToMake)) {
            missing.n8nToMake.push(nodeType);
        }
        else {
            mapped.n8nToMake.push(nodeType);
        }
    }
    // Check Make to n8n mappings
    for (const moduleType of exports.REQUIRED_MAKE_MODULE_TYPES) {
        if (!(moduleType in mappings.makeToN8n)) {
            missing.makeToN8n.push(moduleType);
        }
        else {
            mapped.makeToN8n.push(moduleType);
        }
    }
    const valid = missing.n8nToMake.length === 0 && missing.makeToN8n.length === 0;
    return { valid, missing, mapped };
}
/**
 * Generates a report of node mapping coverage
 */
function generateMappingReport() {
    const { valid, missing, mapped } = validateNodeMappings();
    const mappings = (0, node_mapping_1.getNodeMappings)();
    let report = "Node Mapping Report:\n\n";
    // Overall status
    report += `Overall Status: ${valid ? '✅ All required mappings present' : '❌ Missing required mappings'}\n\n`;
    // n8n to Make mappings
    report += "n8n to Make Mappings:\n";
    report += `- Required: ${exports.REQUIRED_N8N_NODE_TYPES.length}\n`;
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
    report += `- Required: ${exports.REQUIRED_MAKE_MODULE_TYPES.length}\n`;
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
function generateMappingTemplate(nodeType, direction) {
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
    }
    else {
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
