"use strict";
/**
 * Mapping Enhancer Utility
 *
 * Enhances the basic node mappings with detailed information from GitHub
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnhancedNodeTypes = getEnhancedNodeTypes;
exports.areMappingsEnhanced = areMappingsEnhanced;
exports.ensureMappingsEnhanced = ensureMappingsEnhanced;
exports.enhanceNodeMappings = enhanceNodeMappings;
const node_info_store_1 = require("./node-info-store");
const node_mapping_1 = require("../mappings/node-mapping");
// Track if mappings have been enhanced
let mappingsEnhanced = false;
// Track which node types have been enhanced
const enhancedNodeTypes = new Set();
// Polyfill fetch if needed
let fetchFunc;
try {
    // Check if fetch is available
    fetchFunc = typeof fetch !== 'undefined' ? fetch : undefined;
}
catch (e) {
    // If fetch is not defined, we're in a Node.js environment without fetch
    fetchFunc = undefined;
}
/**
 * Get the list of node types that have been enhanced
 */
function getEnhancedNodeTypes() {
    return Array.from(enhancedNodeTypes);
}
/**
 * Check if node mappings have been enhanced
 */
function areMappingsEnhanced() {
    return mappingsEnhanced;
}
// Ensure mappings are enhanced with node information
let enhancedMappings = false;
function ensureMappingsEnhanced() {
    return __awaiter(this, void 0, void 0, function* () {
        if (enhancedMappings) {
            return true;
        }
        try {
            const enhanced = yield enhanceNodeMappings();
            enhancedMappings = enhanced;
            return enhanced;
        }
        catch (error) {
            console.warn("Error enhancing node mappings:", error);
            console.log("Continuing with base mappings only...");
            return false;
        }
    });
}
// Helper function to update mappings with node info
function updateMappingsWithNodeInfo(nodeInfo) {
    if (!nodeInfo)
        return;
    // Update n8n to Make mappings with additional node info
    Object.keys(nodeInfo).forEach(nodeType => {
        const info = nodeInfo[nodeType];
        // Use type assertion to tell TypeScript this is a valid key
        if (nodeType in node_mapping_1.baseNodeMapping.n8nToMake) {
            // Use type assertion to treat the mapping as NodeMapping
            const mapping = node_mapping_1.baseNodeMapping.n8nToMake[nodeType];
            mapping.description = info.description || '';
            mapping.displayName = info.displayName || '';
        }
    });
}
/**
 * Enhances the basic node mappings with detailed information from GitHub or local file
 * This improves the conversion accuracy by having richer node information
 */
function enhanceNodeMappings() {
    return __awaiter(this, arguments, void 0, function* (options = {}) {
        try {
            // First, try to load from local file
            try {
                const localFilePath = options.localFilePath || "/nodes-n8n.json";
                const nodeInfo = yield node_info_store_1.NodeInfoStore.loadNodesFromFile(localFilePath);
                if (nodeInfo && Object.keys(nodeInfo).length > 0) {
                    updateMappingsWithNodeInfo(nodeInfo);
                    return true;
                }
            }
            catch (error) {
                console.warn("Could not enhance mappings with local file, trying GitHub:", error);
                // Skip GitHub fetch if fetch is not available
                if (!fetchFunc) {
                    console.warn("Fetch API not available, skipping remote node data fetching");
                    return false;
                }
                // If local file fails, try fetching from GitHub
                const nodes = yield node_info_store_1.NodeInfoStore.fetchNodes(options.forceUpdate);
                if (nodes && Object.keys(nodes).length > 0) {
                    updateMappingsWithNodeInfo(nodes);
                    console.log("Enhanced node mappings with data from GitHub");
                    return true;
                }
            }
            // If both methods fail
            console.warn("Could not enhance node mappings from any source, using base mappings only.");
            return false;
        }
        catch (error) {
            console.error("Error enhancing node mappings:", error);
            return false;
        }
    });
}
/**
 * Enhances an n8n-to-Make mapping with additional node information
 */
function enhanceN8nToMakeMapping(nodeType, nodeInfo, mapping) {
    if (!mapping)
        return;
    // Add description if not present
    if (nodeInfo.description && !mapping.description) {
        mapping.description = nodeInfo.description;
    }
    // Add node displayName if not present
    if (nodeInfo.displayName && !mapping.displayName) {
        mapping.displayName = nodeInfo.displayName;
    }
    // Enhance parameter mapping if properties are available
    if (nodeInfo.properties && Object.keys(nodeInfo.properties).length > 0) {
        if (!mapping.parameterMap) {
            mapping.parameterMap = {};
        }
        // For each property in the node, check if it's not already mapped
        // and try to find a reasonable mapping from the property name
        Object.keys(nodeInfo.properties).forEach(propName => {
            if (!Object.keys(mapping.parameterMap).includes(propName)) {
                // Simple heuristic: Try to map based on property name
                // In a real implementation, you'd use more sophisticated matching
                mapping.parameterMap[propName] = propName.toLowerCase();
            }
        });
    }
    // Track this node type as enhanced
    enhancedNodeTypes.add(nodeType);
}
/**
 * Enhances a Make-to-n8n mapping with additional node information
 */
function enhanceMakeToN8nMapping(moduleType, nodeInfo, mapping) {
    if (!mapping)
        return;
    // Add description if not present
    if (nodeInfo.description && !mapping.description) {
        mapping.description = nodeInfo.description;
    }
    // Add node displayName if not present
    if (nodeInfo.displayName && !mapping.displayName) {
        mapping.displayName = nodeInfo.displayName;
    }
    // Enhance parameter mapping if properties are available
    if (nodeInfo.properties && Object.keys(nodeInfo.properties).length > 0) {
        if (!mapping.parameterMap) {
            mapping.parameterMap = {};
        }
        // For each property in the node, check if it's not already mapped
        // and try to find a reasonable mapping from the property name
        Object.keys(nodeInfo.properties).forEach(propName => {
            const existingMappings = Object.values(mapping.parameterMap);
            if (!existingMappings.includes(propName)) {
                // Simple heuristic: Try to map based on property name
                // In a real implementation, you'd use more sophisticated matching
                mapping.parameterMap[propName.toLowerCase()] = propName;
            }
        });
    }
    // Track the n8n node type as enhanced
    const nodeType = nodeInfo.type;
    if (nodeType) {
        enhancedNodeTypes.add(nodeType);
    }
}
/**
 * Helper function to find the n8n node type for a given Make module type
 */
function findN8nNodeTypeForModule(moduleType, mappings) {
    const makeToN8n = mappings.makeToN8n;
    if (makeToN8n[moduleType]) {
        return makeToN8n[moduleType].type;
    }
    return null;
}
