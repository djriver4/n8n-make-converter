"use strict";
/**
 * Compatibility Layer Benchmarks
 *
 * This file contains benchmark tests for the compatibility layer functions.
 * It measures the performance overhead of converting between modern and legacy interfaces.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const perf_hooks_1 = require("perf_hooks");
const compatibility_layer_1 = require("../../lib/utils/compatibility-layer");
const interface_adapters_1 = require("../../lib/utils/interface-adapters");
// Number of iterations to run for each benchmark
const ITERATIONS = 1000;
//const ITERATIONS = 100;
/**
 * Creates a mock modern result object with variable complexity
 * @param paramCount - Number of parameter reviews to include
 * @param logCount - Number of logs to include
 * @param includeDebug - Whether to include debug information
 * @returns A mock WorkflowConversionResult
 */
function createMockModernResult(paramCount = 5, logCount = 10, includeDebug = true) {
    // Create parameter reviews
    const paramsNeedingReview = [];
    for (let i = 0; i < paramCount; i++) {
        paramsNeedingReview.push({
            nodeId: `Node${i}`,
            parameters: [`param${i}`, `otherParam${i}`],
            reason: `Reason for review ${i}`
        });
    }
    // Create logs with correct type
    const logs = [];
    for (let i = 0; i < logCount; i++) {
        logs.push({
            type: i % 3 === 0 ? 'error' : i % 3 === 1 ? 'warning' : 'info',
            message: `Log message ${i}`,
            timestamp: new Date().toISOString()
        });
    }
    // Create debug info
    const debug = includeDebug ? {
        mappedModules: Array(5).fill(0).map((_, i) => ({ id: `m${i}`, type: 'module', mappedType: 'mapped' })),
        unmappedModules: Array(3).fill(0).map((_, i) => ({ id: `um${i}`, type: 'unknown' })),
        mappedNodes: Array(5).fill(0).map((_, i) => ({ id: `n${i}`, type: 'node', mappedType: 'mapped' })),
        unmappedNodes: Array(3).fill(0).map((_, i) => ({ id: `un${i}`, type: 'unknown' }))
    } : {
        mappedModules: [],
        unmappedModules: [],
        mappedNodes: [],
        unmappedNodes: []
    };
    return {
        convertedWorkflow: { name: 'Test Workflow', nodes: [] },
        logs,
        paramsNeedingReview,
        unmappedNodes: Array(3).fill(0).map((_, i) => `unmappedNode${i}`),
        debug
    };
}
/**
 * Creates a mock legacy result object with variable complexity
 * @param paramCount - Number of parameter strings to include
 * @param logCount - Number of logs to include
 * @param includeDebug - Whether to include debug information
 * @returns A mock ConversionResult
 */
function createMockLegacyResult(paramCount = 5, logCount = 10, includeDebug = true) {
    // Create parameter strings
    const parametersNeedingReview = [];
    for (let i = 0; i < paramCount; i++) {
        parametersNeedingReview.push(`Node${i} - param${i}, otherParam${i}: Reason for review ${i}`);
    }
    // Create logs with correct type
    const logs = [];
    for (let i = 0; i < logCount; i++) {
        logs.push({
            type: i % 3 === 0 ? 'error' : i % 3 === 1 ? 'warning' : 'info',
            message: `Log message ${i}`,
            timestamp: new Date().toISOString()
        });
    }
    // Create debug info
    const debug = includeDebug ? {
        mappedModules: Array(5).fill(0).map((_, i) => ({ id: `m${i}`, type: 'module', mappedType: 'mapped' })),
        unmappedModules: Array(3).fill(0).map((_, i) => ({ id: `um${i}`, type: 'unknown' })),
        mappedNodes: Array(5).fill(0).map((_, i) => ({ id: `n${i}`, type: 'node', mappedType: 'mapped' })),
        unmappedNodes: Array(3).fill(0).map((_, i) => ({ id: `un${i}`, type: 'unknown' }))
    } : undefined;
    return {
        convertedWorkflow: { name: 'Test Workflow', nodes: [] },
        logs,
        parametersNeedingReview,
        unmappedNodes: Array(3).fill(0).map((_, i) => `unmappedNode${i}`),
        isValidInput: true,
        debug
    };
}
/**
 * Run a single benchmark test
 * @param name - Name of the benchmark
 * @param callback - Function to benchmark
 * @param iterations - Number of iterations
 */
function runBenchmark(name, callback, iterations = ITERATIONS) {
    console.log(`\nRunning benchmark: ${name}`);
    // Warm-up run
    for (let i = 0; i < 100; i++) {
        callback();
    }
    // Benchmark run
    const start = perf_hooks_1.performance.now();
    for (let i = 0; i < iterations; i++) {
        callback();
    }
    const end = perf_hooks_1.performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    const opsPerSec = 1000 / avgTime;
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Avg time per operation: ${avgTime.toFixed(3)}ms`);
    console.log(`Operations per second: ${opsPerSec.toFixed(0)}`);
}
/**
 * Run all benchmarks
 */
function runAllBenchmarks() {
    console.log('==== COMPATIBILITY LAYER BENCHMARKS ====');
    // Benchmark: Legacy to Modern (small)
    const smallLegacyResult = createMockLegacyResult(2, 5, false);
    runBenchmark('Legacy to Modern (small - 2 params, 5 logs, no debug)', () => (0, compatibility_layer_1.convertToModernResult)(smallLegacyResult));
    // Benchmark: Modern to Legacy (small)
    const smallModernResult = createMockModernResult(2, 5, false);
    runBenchmark('Modern to Legacy (small - 2 params, 5 logs, no debug)', () => (0, compatibility_layer_1.convertToLegacyResult)(smallModernResult));
    // Benchmark: Legacy to Modern (medium)
    const mediumLegacyResult = createMockLegacyResult(10, 20, true);
    runBenchmark('Legacy to Modern (medium - 10 params, 20 logs, with debug)', () => (0, compatibility_layer_1.convertToModernResult)(mediumLegacyResult));
    // Benchmark: Modern to Legacy (medium)
    const mediumModernResult = createMockModernResult(10, 20, true);
    runBenchmark('Modern to Legacy (medium - 10 params, 20 logs, with debug)', () => (0, compatibility_layer_1.convertToLegacyResult)(mediumModernResult));
    // Benchmark: Legacy to Modern (large)
    const largeLegacyResult = createMockLegacyResult(50, 100, true);
    runBenchmark('Legacy to Modern (large - 50 params, 100 logs, with debug)', () => (0, compatibility_layer_1.convertToModernResult)(largeLegacyResult));
    // Benchmark: Modern to Legacy (large)
    const largeModernResult = createMockModernResult(50, 100, true);
    runBenchmark('Modern to Legacy (large - 50 params, 100 logs, with debug)', () => (0, compatibility_layer_1.convertToLegacyResult)(largeModernResult));
    // Compare with old adapter functions
    console.log('\n==== COMPARISON WITH LEGACY ADAPTERS ====');
    // Benchmark: Old Legacy to Modern (medium)
    runBenchmark('OLD Legacy to Modern (medium - 10 params, 20 logs, with debug)', () => (0, interface_adapters_1.toWorkflowConversionResult)(mediumLegacyResult));
    // Benchmark: Old Modern to Legacy (medium)
    runBenchmark('OLD Modern to Legacy (medium - 10 params, 20 logs, with debug)', () => (0, interface_adapters_1.toConversionResult)(mediumModernResult));
    // Benchmark: New Legacy to Modern (medium)
    runBenchmark('NEW Legacy to Modern (medium - 10 params, 20 logs, with debug)', () => (0, compatibility_layer_1.convertToModernResult)(mediumLegacyResult));
    // Benchmark: New Modern to Legacy (medium)
    runBenchmark('NEW Modern to Legacy (medium - 10 params, 20 logs, with debug)', () => (0, compatibility_layer_1.convertToLegacyResult)(mediumModernResult));
}
// Run all benchmarks
runAllBenchmarks();
