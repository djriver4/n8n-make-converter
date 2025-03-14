/**
 * Performance Logger
 * 
 * This module provides utilities for logging and analyzing performance metrics
 * during the workflow conversion process.
 */

/**
 * Performance metric type
 */
export interface PerformanceMetric {
  // Unique identifier for the metric
  id: string;
  // Name of the metric
  name: string;
  // Start time in milliseconds
  startTime: number;
  // End time in milliseconds
  endTime?: number;
  // Duration in milliseconds (calculated)
  duration?: number;
  // Additional metadata for the metric
  metadata?: Record<string, any>;
  // Operation type (e.g., 'conversion', 'nodeProcessing', 'parameterTransformation')
  operationType: string;
  // Memory usage at the end (if available)
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

/**
 * Performance summary for a conversion operation
 */
export interface PerformanceSummary {
  // Total duration in milliseconds
  totalDuration: number;
  // Average node/module processing time
  averageNodeProcessingTime: number;
  // Total number of nodes/modules processed
  nodesProcessed: number;
  // Breakdown by operation type
  operationBreakdown: Record<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
  }>;
  // Peak memory usage
  peakMemoryUsage?: number;
  // Slowest operations (top 5)
  slowestOperations: {
    id: string;
    name: string;
    duration: number;
    operationType: string;
  }[];
}

/**
 * Performance logger class for tracking conversion performance
 */
export class PerformanceLogger {
  private static instance: PerformanceLogger;
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = true;
  private runId: string;
  
  /**
   * Create a new performance logger
   */
  constructor() {
    this.runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get or create the singleton instance
   */
  public static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }
  
  /**
   * Enable or disable performance logging
   * @param enabled Whether logging is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Start timing a metric
   * @param name Metric name
   * @param operationType Operation type 
   * @param metadata Additional metadata
   * @returns Metric ID
   */
  public startMetric(name: string, operationType: string, metadata?: Record<string, any>): string {
    if (!this.enabled) return '';
    
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
  public endMetric(id: string): void {
    if (!this.enabled || !id) return;
    
    const index = this.metrics.findIndex(m => m.id === id);
    if (index === -1) return;
    
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
  public trackOperation<T>(
    name: string, 
    operation: () => T, 
    operationType: string,
    metadata?: Record<string, any>
  ): T {
    if (!this.enabled) return operation();
    
    const id = this.startMetric(name, operationType, metadata);
    try {
      const result = operation();
      return result;
    } finally {
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
  public async trackAsyncOperation<T>(
    name: string, 
    operation: () => Promise<T>, 
    operationType: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) return operation();
    
    const id = this.startMetric(name, operationType, metadata);
    try {
      const result = await operation();
      return result;
    } finally {
      this.endMetric(id);
    }
  }
  
  /**
   * Get all recorded metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  /**
   * Clear all recorded metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Get a summary of the performance metrics
   */
  public getSummary(): PerformanceSummary {
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
    const nodeProcessingMetrics = completedMetrics.filter(m => 
      m.operationType === 'nodeProcessing' || 
      m.operationType === 'moduleProcessing'
    );
    const nodesProcessed = nodeProcessingMetrics.length;
    
    // Calculate average node processing time
    const averageNodeProcessingTime = nodesProcessed > 0
      ? nodeProcessingMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / nodesProcessed
      : 0;
    
    // Group by operation type
    const operationGroups: Record<string, PerformanceMetric[]> = {};
    for (const metric of completedMetrics) {
      if (!operationGroups[metric.operationType]) {
        operationGroups[metric.operationType] = [];
      }
      operationGroups[metric.operationType].push(metric);
    }
    
    // Compute breakdown by operation type
    const operationBreakdown: Record<string, {
      count: number;
      totalDuration: number;
      averageDuration: number;
    }> = {};
    
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
    let peakMemoryUsage: number | undefined = undefined;
    for (const metric of completedMetrics) {
      if (metric.memoryUsage?.heapUsed) {
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
  public logSummary(): void {
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

// Export singleton instance for convenience
export const performanceLogger = PerformanceLogger.getInstance(); 