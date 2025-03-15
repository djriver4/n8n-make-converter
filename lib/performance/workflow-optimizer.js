"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeWorkflow = optimizeWorkflow;
exports.isWorkflowLarge = isWorkflowLarge;
exports.getPerformanceWarning = getPerformanceWarning;
/**
 * Optimizes large workflows for better performance
 */
function optimizeWorkflow(workflowJson) {
    if (!workflowJson)
        return workflowJson;
    // For very large workflows, we might want to limit the number of nodes/modules
    // that are processed at once or implement pagination
    const isLargeWorkflow = isWorkflowLarge(workflowJson);
    if (!isLargeWorkflow) {
        return workflowJson; // No optimization needed
    }
    // Create a deep copy to avoid modifying the original
    const optimized = JSON.parse(JSON.stringify(workflowJson));
    // For n8n workflows
    if (optimized.nodes && Array.isArray(optimized.nodes) && optimized.nodes.length > 100) {
        // Add a warning property to indicate this is a large workflow
        optimized.__performance_warning = {
            message: "This is a large workflow which may affect performance",
            nodeCount: optimized.nodes.length,
        };
        // For extremely large workflows (1000+ nodes), we might want to truncate
        // or paginate the data for initial rendering
        if (optimized.nodes.length > 1000) {
            // Store the full node count
            optimized.__full_node_count = optimized.nodes.length;
            // Keep only the first 500 nodes for initial rendering
            optimized.__truncated = true;
            optimized.nodes = optimized.nodes.slice(0, 500);
        }
    }
    // For Make.com workflows
    if (optimized.flow && Array.isArray(optimized.flow) && optimized.flow.length > 100) {
        // Add a warning property
        optimized.__performance_warning = {
            message: "This is a large workflow which may affect performance",
            moduleCount: optimized.flow.length,
        };
        // For extremely large workflows
        if (optimized.flow.length > 1000) {
            optimized.__full_module_count = optimized.flow.length;
            optimized.__truncated = true;
            optimized.flow = optimized.flow.slice(0, 500);
        }
    }
    return optimized;
}
/**
 * Determines if a workflow is considered "large" and might cause performance issues
 */
function isWorkflowLarge(workflowJson) {
    if (!workflowJson)
        return false;
    // Check n8n workflow size
    if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
        if (workflowJson.nodes.length > 100) {
            return true;
        }
    }
    // Check Make.com workflow size
    if (workflowJson.flow && Array.isArray(workflowJson.flow)) {
        if (workflowJson.flow.length > 100) {
            return true;
        }
    }
    // Check overall JSON size
    const jsonSize = JSON.stringify(workflowJson).length;
    if (jsonSize > 1000000) {
        // 1MB
        return true;
    }
    return false;
}
/**
 * Provides a warning message if the workflow is large
 */
function getPerformanceWarning(workflowJson) {
    if (!workflowJson)
        return null;
    if (workflowJson.__performance_warning) {
        return workflowJson.__performance_warning.message;
    }
    if (isWorkflowLarge(workflowJson)) {
        if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
            return `Large workflow detected (${workflowJson.nodes.length} nodes). Performance may be affected.`;
        }
        if (workflowJson.flow && Array.isArray(workflowJson.flow)) {
            return `Large workflow detected (${workflowJson.flow.length} modules). Performance may be affected.`;
        }
        return "Large workflow detected. Performance may be affected.";
    }
    return null;
}
