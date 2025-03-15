"use strict";
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
const workflow_regression_1 = require("./workflow-regression");
/**
 * Command-line test runner for workflow regression tests
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        const options = parseOptions(args);
        if (options.help) {
            printHelp();
            process.exit(0);
        }
        if (options.init) {
            console.log('Initializing regression test directory structure...');
            (0, workflow_regression_1.initializeRegressionTestStructure)();
            console.log('Done. Test directories created.');
        }
        if (options.run) {
            console.log('Running regression tests...');
            const allPassed = yield (0, workflow_regression_1.runRegressionTests)();
            if (!allPassed && !options.noExit) {
                process.exit(1);
            }
        }
    });
}
/**
 * Parse command-line arguments
 */
function parseOptions(args) {
    const options = {
        help: false,
        init: false,
        run: true,
        noExit: false,
    };
    for (const arg of args) {
        if (arg === '--help' || arg === '-h') {
            options.help = true;
        }
        else if (arg === '--init') {
            options.init = true;
        }
        else if (arg === '--no-run') {
            options.run = false;
        }
        else if (arg === '--no-exit') {
            options.noExit = true;
        }
    }
    return options;
}
/**
 * Print help information
 */
function printHelp() {
    console.log(`
Workflow Regression Test Runner

Usage: 
  npm run test:regression -- [options]

Options:
  --help, -h    Show this help message
  --init        Initialize test directory structure
  --no-run      Don't run tests (useful with --init)
  --no-exit     Don't exit with code 1 on test failure
  
Examples:
  npm run test:regression               Run all regression tests
  npm run test:regression -- --init     Initialize test directory structure and run tests
  npm run test:regression -- --init --no-run  Only initialize without running tests
`);
}
// Run the script if it's called directly
if (require.main === module) {
    main().catch(err => {
        console.error('Error running tests:', err);
        process.exit(1);
    });
}
exports.default = main;
