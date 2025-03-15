"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeCredentials = sanitizeCredentials;
exports.hasCredentials = hasCredentials;
/**
 * Sanitizes workflow JSON to remove or mask sensitive credential information
 */
function sanitizeCredentials(workflowJson) {
    if (!workflowJson)
        return workflowJson;
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(workflowJson));
    // Handle n8n credentials
    if (sanitized.nodes && Array.isArray(sanitized.nodes)) {
        sanitized.nodes = sanitized.nodes.map((node) => {
            if (node.credentials) {
                // Replace credential values with placeholders
                const sanitizedCredentials = {};
                for (const [key, value] of Object.entries(node.credentials)) {
                    if (typeof value === "object" && value !== null) {
                        // Keep the structure but mask any potential secrets
                        sanitizedCredentials[key] = {
                            id: value.id || "[CREDENTIAL_ID]",
                            name: value.name || "[CREDENTIAL_NAME]",
                        };
                    }
                    else {
                        sanitizedCredentials[key] = "[CREDENTIAL_VALUE]";
                    }
                }
                return Object.assign(Object.assign({}, node), { credentials: sanitizedCredentials });
            }
            return node;
        });
    }
    // Handle Make.com credentials
    if (sanitized.flow && Array.isArray(sanitized.flow)) {
        sanitized.flow = sanitized.flow.map((module) => {
            if (module.parameters) {
                const sanitizedParams = Object.assign({}, module.parameters);
                // Look for credential parameters (usually prefixed with __IMTCONN__)
                for (const key of Object.keys(sanitizedParams)) {
                    if (key.startsWith("__IMTCONN__")) {
                        sanitizedParams[key] = "[CREDENTIAL_VALUE]";
                    }
                }
                return Object.assign(Object.assign({}, module), { parameters: sanitizedParams });
            }
            return module;
        });
    }
    return sanitized;
}
/**
 * Utility to check if a workflow contains credentials that need attention
 */
function hasCredentials(workflowJson) {
    if (!workflowJson)
        return false;
    // Check n8n credentials
    if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
        for (const node of workflowJson.nodes) {
            if (node.credentials && Object.keys(node.credentials).length > 0) {
                return true;
            }
        }
    }
    // Check Make.com credentials
    if (workflowJson.flow && Array.isArray(workflowJson.flow)) {
        for (const module of workflowJson.flow) {
            if (module.parameters) {
                for (const key of Object.keys(module.parameters)) {
                    if (key.startsWith("__IMTCONN__")) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
