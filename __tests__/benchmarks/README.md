# Performance Benchmarks

This directory contains benchmarks for measuring the performance of various components in the n8n-make-converter project.

## Available Benchmarks

- **Compatibility Layer**: Measures performance of conversions between modern and legacy interfaces
- *More benchmarks will be added as needed*

## Running Benchmarks

### Using the Benchmark Script

The simplest way to run all benchmarks is using the provided script:

```bash
# Make the script executable
chmod +x scripts/run-benchmarks.sh

# Run the benchmarks
./scripts/run-benchmarks.sh
```

This will:
- Run all benchmarks
- Save detailed results to a file in `benchmark-results/`
- Generate summary statistics

### Running Individual Benchmarks

You can also run individual benchmark files:

```bash
# Run compatibility layer benchmarks
npx ts-node __tests__/benchmarks/compatibility-layer-benchmark.ts
```

## Interpreting Results

The benchmark results show:

- **Total time**: Total milliseconds to run all iterations
- **Average time per operation**: Milliseconds per operation
- **Operations per second**: How many operations can be performed per second

Higher "operations per second" numbers indicate better performance.

## Adding New Benchmarks

If you want to add new benchmarks, follow these guidelines:

1. Create a new TypeScript file in this directory named `*-benchmark.ts`
2. Include both small and large dataset tests
3. Include a warm-up phase before timing
4. Run a sufficient number of iterations (1000+ recommended). it 100
5. Include clear console output with results
6. Add the benchmark to the benchmark script if appropriate

## Best Practices

- Always run benchmarks on the same machine for fair comparisons
- Run multiple times and average the results for more accuracy
- Consider the real-world impact of performance differences
- Document performance changes in PRs that affect core functionality

## Documentation

For more details on specific benchmarks, see:

- [Compatibility Layer Performance](../../docs/performance/compatibility-layer-performance.md) 