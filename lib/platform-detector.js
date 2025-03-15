"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectPlatform = detectPlatform;
function detectPlatform(workflow) {
    var _a, _b;
    if (!workflow)
        return null;
    // Check for Make.com specific properties
    if ((workflow.flow && Array.isArray(workflow.flow)) ||
        (workflow.name && workflow.flow && ((_b = (_a = workflow.metadata) === null || _a === void 0 ? void 0 : _a.zone) === null || _b === void 0 ? void 0 : _b.includes("make.com")))) {
        return "make";
    }
    // Check for n8n specific properties
    if (workflow.nodes &&
        Array.isArray(workflow.nodes) &&
        workflow.connections &&
        typeof workflow.connections === "object") {
        return "n8n";
    }
    return null;
}
