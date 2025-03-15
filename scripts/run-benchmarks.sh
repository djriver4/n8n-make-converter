#!/bin/bash

# Run Compatibility Layer Benchmarks Script
#
# This script runs performance benchmarks for the compatibility layer
# and generates a report of the results.

set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Running Compatibility Layer Benchmarks ===${NC}"
echo "This will measure the performance of interface conversions"
echo ""

# Create benchmark results directory if it doesn't exist
RESULTS_DIR="benchmark-results"
mkdir -p $RESULTS_DIR

# Get timestamp for the results file
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
RESULTS_FILE="$RESULTS_DIR/compat-benchmark-$TIMESTAMP.txt"

# Run the TypeScript file with ts-node
echo -e "${YELLOW}Running benchmarks...${NC}"
echo "Results will be saved to $RESULTS_FILE"

# Redirect output to both the console and the file
npx ts-node __tests__/benchmarks/compatibility-layer-benchmark.ts | tee $RESULTS_FILE

echo ""
echo -e "${GREEN}Benchmarks completed!${NC}"
echo "Detailed results saved to: $RESULTS_FILE"

# Calculate averages and create a summary
echo -e "${YELLOW}Generating summary...${NC}"
echo "=== SUMMARY ===" >> $RESULTS_FILE
echo "Average operations per second:" >> $RESULTS_FILE

# Extract operations per second values and calculate averages
grep "Operations per second:" $RESULTS_FILE | awk '{print $4}' | awk '{sum+=$1; count++} END {print "Overall average: " sum/count " ops/sec" }' >> $RESULTS_FILE

# Compare old vs new adapter performance
OLD_AVG=$(grep "OLD" $RESULTS_FILE -A 3 | grep "Operations per second:" | awk '{print $4}' | awk '{sum+=$1; count++} END {print sum/count}')
NEW_AVG=$(grep "NEW" $RESULTS_FILE -A 3 | grep "Operations per second:" | awk '{print $4}' | awk '{sum+=$1; count++} END {print sum/count}')

echo "Old adapter average: $OLD_AVG ops/sec" >> $RESULTS_FILE
echo "New adapter average: $NEW_AVG ops/sec" >> $RESULTS_FILE

# Calculate improvement percentage
if (( $(echo "$OLD_AVG > 0" | bc -l) )); then
  IMPROVEMENT=$(echo "scale=2; (($NEW_AVG - $OLD_AVG) / $OLD_AVG) * 100" | bc)
  echo "Improvement: $IMPROVEMENT%" >> $RESULTS_FILE
fi

echo "Summary added to: $RESULTS_FILE"
echo -e "${GREEN}Done!${NC}"

# Print a preview of the summary
echo ""
echo "Preview of results summary:"
echo "--------------------------"
tail -n 5 $RESULTS_FILE 