"use strict";
/**
 * Generates stub nodes and markers for unmapped elements during conversion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createN8nStubNode = createN8nStubNode;
exports.createMakeStubModule = createMakeStubModule;
exports.isStubNode = isStubNode;
exports.getStubInfo = getStubInfo;
// Create a stub node for n8n when a Make.com module can't be directly mapped
function createN8nStubNode(sourceModule, nodeId = generateNodeId()) {
    var _a, _b, _c, _d;
    return {
        id: nodeId,
        name: `TODO_${sourceModule.module.replace(/:/g, "_")}`,
        type: "n8n-nodes-base.noOp",
        typeVersion: 1,
        position: [((_b = (_a = sourceModule.metadata) === null || _a === void 0 ? void 0 : _a.designer) === null || _b === void 0 ? void 0 : _b.x) || 0, ((_d = (_c = sourceModule.metadata) === null || _c === void 0 ? void 0 : _c.designer) === null || _d === void 0 ? void 0 : _d.y) || 0],
        parameters: {
            __stubInfo: {
                originalModuleType: sourceModule.module,
                originalModuleId: sourceModule.id,
                conversionNote: "This node was created as a stub during conversion. Please replace with appropriate n8n node.",
                originalParameters: sourceModule.parameters || {},
                originalMapper: sourceModule.mapper || {},
            },
            displayName: `TODO: Replace ${sourceModule.module}`,
            notes: `## Manual Conversion Required\nThis is a stub for a Make.com module of type "${sourceModule.module}" that couldn't be automatically converted.\n\nPlease review the original module data in the __stubInfo parameter and replace with an appropriate n8n node.`,
        },
    };
}
// Create a stub module for Make.com when an n8n node can't be directly mapped
function createMakeStubModule(sourceNode) {
    return {
        id: typeof sourceNode.id === 'number' ? sourceNode.id : (parseInt(sourceNode.id) || Math.floor(Math.random() * 10000)),
        module: "helper:Note",
        version: 1,
        parameters: {
            note: `TODO: Replace this stub. Original n8n node type: ${sourceNode.originalNodeType || sourceNode.type}`,
        },
        mapper: {
            __stubInfo: {
                originalNodeType: sourceNode.originalNodeType || sourceNode.type,
                originalNodeId: sourceNode.originalNodeId || sourceNode.id,
                originalNodeName: sourceNode.originalNodeName || sourceNode.name,
                conversionNote: "This module was created as a stub during conversion. Please replace with appropriate Make.com module.",
                originalParameters: typeof sourceNode.originalParameters === 'string' ?
                    sourceNode.originalParameters :
                    JSON.stringify(sourceNode.parameters || {}),
            },
        },
        metadata: {
            designer: {
                x: sourceNode.position ? sourceNode.position[0] : 0,
                y: sourceNode.position ? sourceNode.position[1] : 0,
            },
            note: {
                text: `## Manual Conversion Required\nThis is a stub for an n8n node of type "${sourceNode.originalNodeType || sourceNode.type}" that couldn't be automatically converted.\n\nPlease review the original node data in the mapper.__stubInfo property and replace with an appropriate Make.com module.`,
                color: "#FF9800",
            },
        },
    };
}
// Generate a unique ID for n8n nodes
function generateNodeId() {
    return `stub_${Math.random().toString(36).substring(2, 11)}`;
}
// Check if a node is a stub
function isStubNode(node) {
    var _a, _b;
    console.log("Checking node:", node); // Debug log
    if (!node)
        return false;
    // Check for n8n stub
    if (node.type === "n8n-nodes-base.noOp" && ((_a = node.parameters) === null || _a === void 0 ? void 0 : _a.__stubInfo)) {
        console.log("n8n stub node detected"); // Debug log
        return true;
    }
    // Check for Make.com stub
    if (node.module === "helper:Note" && ((_b = node.mapper) === null || _b === void 0 ? void 0 : _b.__stubInfo)) {
        console.log("Make.com stub node detected"); // Debug log
        return true;
    }
    return false;
}
function getStubInfo(node) {
    var _a, _b;
    if (!isStubNode(node))
        return null;
    if (node.type === "n8n-nodes-base.noOp") {
        return (_a = node.parameters) === null || _a === void 0 ? void 0 : _a.__stubInfo;
    }
    if (node.module === "helper:Note") {
        return (_b = node.mapper) === null || _b === void 0 ? void 0 : _b.__stubInfo;
    }
    return null;
}
