"use strict";
/**
 * Performance Logger
 *
 * This module provides utilities for logging and analyzing performance metrics
 * during the workflow conversion process.
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
exports.performanceLogger = exports.PerformanceLogger = void 0;
/**
 * Performance logger class for tracking conversion performance
 */
class PerformanceLogger {
    /**
     * Create a new performance logger
     */
    constructor() {
        this.metrics = [];
        this.enabled = true;
        this.runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Get or create the singleton instance
     */
    static getInstance() {
        if (!PerformanceLogger.instance) {
            PerformanceLogger.instance = new PerformanceLogger();
        }
        return PerformanceLogger.instance;
    }
    /**
     * Enable or disable performance logging
     * @param enabled Whether logging is enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Start timing a metric
     * @param name Metric name
     * @param operationType Operation type
     * @param metadata Additional metadata
     * @returns Metric ID
     */
    startMetric(name, operationType, metadata) {
        if (!this.enabled)
            return '';
        const id = `${this.runId}-${name}-${Date.now()}`;
        this.metrics.push({
            id,
            name,
            startTime: Date.now(),
            operationType,
            metadata
        });
        return id;
    }
    /**
     * End timing a metric
     * @param id Metric ID
     */
    endMetric(id) {
        if (!this.enabled || !id)
            return;
        const index = this.metrics.findIndex(m => m.id === id);
        if (index === -1)
            return;
        const endTime = Date.now();
        const metric = this.metrics[index];
        metric.endTime = endTime;
        metric.duration = endTime - metric.startTime;
        // Capture memory usage if available
        if (typeof process !== 'undefined' && process.memoryUsage) {
            metric.memoryUsage = process.memoryUsage();
        }
    }
    /**
     * Track a complete operation
     * @param name Metric name
     * @param operation Function to execute and measure
     * @param operationType Operation type
     * @param metadata Additional metadata
     * @returns Result of the operation function
     */
    trackOperation(name, operation, operationType, metadata) {
        if (!this.enabled)
            return operation();
        const id = this.startMetric(name, operationType, metadata);
        try {
            const result = operation();
            return result;
        }
        finally {
            this.endMetric(id);
        }
    }
    /**
     * Track an async operation
     * @param name Metric name
     * @param operation Async function to execute and measure
     * @param operationType Operation type
     * @param metadata Additional metadata
     * @returns Promise with the result of the operation
     */
    trackAsyncOperation(name, operation, operationType, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled)
                return operation();
            const id = this.startMetric(name, operationType, metadata);
            try {
                const result = yield operation();
                return result;
            }
            finally {
                this.endMetric(id);
            }
        });
    }
    /**
     * Get all recorded metrics
     */
    getMetrics() {
        return [...this.metrics];
    }
    /**
     * Clear all recorded metrics
     */
    clearMetrics() {
        this.metrics = [];
    }
    /**
     * Get a summary of the performance metrics
     */
    getSummary() {
        var _a;
        // Filter completed metrics
        const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
        if (completedMetrics.length === 0) {
            return {
                totalDuration: 0,
                averageNodeProcessingTime: 0,
                nodesProcessed: 0,
                operationBreakdown: {},
                slowestOperations: []
            };
        }
        // Calculate total duration
        const totalDuration = Math.max(...completedMetrics.map(m => m.endTime || 0)) -
            Math.min(...completedMetrics.map(m => m.startTime));
        // Count nodes processed
        const nodeProcessingMetrics = completedMetrics.filter(m => m.operationType === 'nodeProcessing' ||
            m.operationType === 'moduleProcessing');
        const nodesProcessed = nodeProcessingMetrics.length;
        // Calculate average node processing time
        const averageNodeProcessingTime = nodesProcessed > 0
            ? nodeProcessingMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / nodesProcessed
            : 0;
        // Group by operation type
        const operationGroups = {};
        for (const metric of completedMetrics) {
            if (!operationGroups[metric.operationType]) {
                operationGroups[metric.operationType] = [];
            }
            operationGroups[metric.operationType].push(metric);
        }
        // Compute breakdown by operation type
        const operationBreakdown = {};
        for (const [type, metrics] of Object.entries(operationGroups)) {
            const count = metrics.length;
            const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
            operationBreakdown[type] = {
                count,
                totalDuration,
                averageDuration: count > 0 ? totalDuration / count : 0
            };
        }
        // Find peak memory usage
        let peakMemoryUsage = undefined;
        for (const metric of completedMetrics) {
            if ((_a = metric.memoryUsage) === null || _a === void 0 ? void 0 : _a.heapUsed) {
                if (!peakMemoryUsage || metric.memoryUsage.heapUsed > peakMemoryUsage) {
                    peakMemoryUsage = metric.memoryUsage.heapUsed;
                }
            }
        }
        // Find slowest operations
        const sortedByDuration = [...completedMetrics]
            .filter(m => m.duration !== undefined)
            .sort((a, b) => (b.duration || 0) - (a.duration || 0));
        const slowestOperations = sortedByDuration.slice(0, 5).map(m => ({
            id: m.id,
            name: m.name,
            duration: m.duration || 0,
            operationType: m.operationType
        }));
        return {
            totalDuration,
            averageNodeProcessingTime,
            nodesProcessed,
            operationBreakdown,
            peakMemoryUsage,
            slowestOperations
        };
    }
    /**
     * Log the performance summary to the console
     */
    logSummary() {
        const summary = this.getSummary();
        console.log('\n=== Performance Summary ===');
        console.log(`Total Duration: ${summary.totalDuration}ms`);
        console.log(`Nodes Processed: ${summary.nodesProcessed}`);
        console.log(`Average Node Processing Time: ${summary.averageNodeProcessingTime.toFixed(2)}ms`);
        if (summary.peakMemoryUsage) {
            console.log(`Peak Memory Usage: ${(summary.peakMemoryUsage / (1024 * 1024)).toFixed(2)} MB`);
        }
        console.log('\nOperation Breakdown:');
        for (const [type, data] of Object.entries(summary.operationBreakdown)) {
            console.log(`  ${type}: ${data.count} operations, ${data.totalDuration}ms total, ${data.averageDuration.toFixed(2)}ms avg`);
        }
        console.log('\nSlowest Operations:');
        for (const op of summary.slowestOperations) {
            console.log(`  ${op.name} (${op.operationType}): ${op.duration}ms`);
        }
        console.log('===========================\n');
    }
}
exports.PerformanceLogger = PerformanceLogger;
// Export singleton instance for convenience
exports.performanceLogger = PerformanceLogger.getInstance();
