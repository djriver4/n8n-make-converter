"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugTracker = void 0;
class DebugTracker {
    constructor() {
        this.mappingDetails = {};
        this.generalLogs = [];
    }
    trackNodeMapping(sourceNode, targetNode, success, isStub = false, pluginSource) {
        const nodeId = sourceNode.id || sourceNode.name;
        // Determine mapping status
        let mappingStatus = "failed";
        if (isStub) {
            mappingStatus = "stub";
        }
        else if (success) {
            mappingStatus = "full";
        }
        else if (targetNode) {
            mappingStatus = "partial";
        }
        this.mappingDetails[nodeId] = {
            sourceId: sourceNode.id,
            sourceName: sourceNode.name || `Node ${sourceNode.id}`,
            sourceType: sourceNode.type || sourceNode.module,
            targetId: targetNode === null || targetNode === void 0 ? void 0 : targetNode.id,
            targetName: (targetNode === null || targetNode === void 0 ? void 0 : targetNode.name) || (targetNode === null || targetNode === void 0 ? void 0 : targetNode.id) ? `Module ${targetNode.id}` : undefined,
            targetType: (targetNode === null || targetNode === void 0 ? void 0 : targetNode.type) || (targetNode === null || targetNode === void 0 ? void 0 : targetNode.module),
            success,
            isStub,
            mappingStatus,
            parameterMappings: [],
            warnings: [],
            unmappedParameters: [],
            pluginSource,
        };
        return this;
    }
    trackParameterMapping(nodeId, sourceName, targetName, value, success, reason) {
        if (!this.mappingDetails[nodeId]) {
            this.mappingDetails[nodeId] = {
                sourceId: nodeId,
                sourceName: `Node ${nodeId}`,
                sourceType: "unknown",
                success: false,
                parameterMappings: [],
                warnings: [],
                unmappedParameters: [],
                mappingStatus: "failed",
            };
        }
        this.mappingDetails[nodeId].parameterMappings.push({
            source: sourceName,
            target: targetName,
            value,
            success,
            reason,
        });
        if (!success && !targetName) {
            this.mappingDetails[nodeId].unmappedParameters.push(sourceName);
        }
        return this;
    }
    addWarning(nodeId, message) {
        if (this.mappingDetails[nodeId]) {
            this.mappingDetails[nodeId].warnings.push(message);
        }
        return this;
    }
    addLog(type, message) {
        this.generalLogs.push({ type, message });
        return this;
    }
    getNodeMappingDetails() {
        return this.mappingDetails;
    }
    getGeneralLogs() {
        return this.generalLogs;
    }
    getDebugReport() {
        return {
            nodes: this.mappingDetails,
            logs: this.generalLogs,
            summary: this.generateSummary(),
        };
    }
    generateSummary() {
        const nodeCount = Object.keys(this.mappingDetails).length;
        const successfulNodes = Object.values(this.mappingDetails).filter((n) => n.success).length;
        const stubNodes = Object.values(this.mappingDetails).filter((n) => n.isStub).length;
        const partialNodes = Object.values(this.mappingDetails).filter((n) => n.mappingStatus === "partial").length;
        const failedNodes = Object.values(this.mappingDetails).filter((n) => n.mappingStatus === "failed").length;
        const warningCount = Object.values(this.mappingDetails).reduce((count, node) => count + node.warnings.length, 0);
        const unmappedParamsCount = Object.values(this.mappingDetails).reduce((count, node) => count + node.unmappedParameters.length, 0);
        // Track which plugins provided mappings
        const pluginUsage = Object.values(this.mappingDetails).reduce((acc, node) => {
            if (node.pluginSource) {
                acc[node.pluginSource] = (acc[node.pluginSource] || 0) + 1;
            }
            return acc;
        }, {});
        return {
            nodeCount,
            successfulNodes,
            partialNodes,
            failedNodes,
            stubNodes,
            warningCount,
            unmappedParamsCount,
            pluginUsage,
            successRate: nodeCount > 0 ? Math.round((successfulNodes / nodeCount) * 100) : 0,
            conversionTime: this.startTime ? Date.now() - this.startTime : undefined,
        };
    }
    // Add a method to start timing the conversion
    startTiming() {
        this.startTime = Date.now();
        return this;
    }
    // Add a method to finish timing the conversion
    finishTiming() {
        // If startTime is not set, do nothing
        if (!this.startTime) {
            return this;
        }
        // Calculate the conversion time and add it to the summary
        const conversionTime = Date.now() - this.startTime;
        this.addLog("info", `Conversion completed in ${conversionTime}ms`);
        return this;
    }
}
exports.DebugTracker = DebugTracker;
