"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFixtures = validateFixtures;
exports.generateFixtureReport = generateFixtureReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const test_helpers_1 = require("./test-helpers");
/**
 * Validates that fixture files exist and can be loaded
 */
function validateFixtures() {
    const errors = [];
    const platforms = ['n8n', 'make'];
    const requiredFixtures = [
        'sample-workflow',
        'expected-workflow'
    ];
    let valid = true;
    // Check if fixture directories exist
    const fixtureBasePath = path_1.default.join(__dirname, '..', 'fixtures');
    if (!fs_1.default.existsSync(fixtureBasePath)) {
        errors.push(`Main fixtures directory not found at: ${fixtureBasePath}`);
        valid = false;
        return { valid, errors };
    }
    // Check platform directories
    for (const platform of platforms) {
        const platformPath = path_1.default.join(fixtureBasePath, platform);
        if (!fs_1.default.existsSync(platformPath)) {
            errors.push(`Platform directory not found: ${platformPath}`);
            valid = false;
            continue;
        }
        // Check required fixtures
        for (const fixtureName of requiredFixtures) {
            const fixturePath = path_1.default.join(platformPath, `${fixtureName}.json`);
            if (!fs_1.default.existsSync(fixturePath)) {
                errors.push(`Required fixture not found: ${fixturePath}`);
                valid = false;
                continue;
            }
            // Try to load and validate the fixture
            try {
                const fixture = (0, test_helpers_1.loadFixture)(platform, fixtureName);
                if (!fixture) {
                    errors.push(`Fixture is empty or null: ${platform}/${fixtureName}`);
                    valid = false;
                    continue;
                }
                // Validate structure based on platform
                if (platform === 'n8n') {
                    if (!fixture.nodes || !Array.isArray(fixture.nodes)) {
                        errors.push(`Invalid n8n workflow structure - nodes array missing: ${platform}/${fixtureName}`);
                        valid = false;
                    }
                    if (!fixture.connections) {
                        errors.push(`Invalid n8n workflow structure - connections missing: ${platform}/${fixtureName}`);
                        valid = false;
                    }
                }
                else if (platform === 'make') {
                    // Make.com workflow needs modules/flow array
                    if ((!fixture.modules && !fixture.flow) ||
                        (fixture.modules && !Array.isArray(fixture.modules)) ||
                        (fixture.flow && !Array.isArray(fixture.flow))) {
                        errors.push(`Invalid Make workflow structure - modules/flow array missing: ${platform}/${fixtureName}`);
                        valid = false;
                    }
                }
            }
            catch (error) {
                errors.push(`Error loading fixture ${platform}/${fixtureName}: ${error instanceof Error ? error.message : String(error)}`);
                valid = false;
            }
        }
    }
    return { valid, errors };
}
/**
 * Generates reports about available fixtures
 */
function generateFixtureReport() {
    const fixtureBasePath = path_1.default.join(__dirname, '..', 'fixtures');
    let fixtureCount = 0;
    let report = 'Fixture Report:\n';
    // Check main fixtures directory
    report += `\nBase Fixtures:\n`;
    try {
        const files = fs_1.default.readdirSync(fixtureBasePath).filter(file => file.endsWith('.json'));
        report += files.map(file => `  - ${file}`).join('\n');
        fixtureCount += files.length;
    }
    catch (error) {
        report += `  Error reading directory: ${error instanceof Error ? error.message : String(error)}`;
    }
    // Check platform directories
    const platforms = ['n8n', 'make'];
    for (const platform of platforms) {
        report += `\n\n${platform.toUpperCase()} Fixtures:\n`;
        const platformPath = path_1.default.join(fixtureBasePath, platform);
        try {
            if (fs_1.default.existsSync(platformPath)) {
                const files = fs_1.default.readdirSync(platformPath).filter(file => file.endsWith('.json'));
                files.forEach(file => {
                    var _a, _b, _c;
                    report += `  - ${file}\n`;
                    fixtureCount += 1;
                    // Try to show info about this fixture
                    try {
                        const fixture = (0, test_helpers_1.loadFixture)(platform, file.replace('.json', ''));
                        if (platform === 'n8n') {
                            report += `    Nodes: ${((_a = fixture.nodes) === null || _a === void 0 ? void 0 : _a.length) || 0}, `;
                            report += `Connections: ${Object.keys(fixture.connections || {}).length}\n`;
                        }
                        else {
                            report += `    Modules: ${((_b = fixture.flow) === null || _b === void 0 ? void 0 : _b.length) || ((_c = fixture.modules) === null || _c === void 0 ? void 0 : _c.length) || 0}\n`;
                        }
                    }
                    catch (error) {
                        report += `    Error reading fixture: ${error instanceof Error ? error.message : String(error)}\n`;
                    }
                });
            }
            else {
                report += `  Directory not found: ${platformPath}\n`;
            }
        }
        catch (error) {
            report += `  Error reading directory: ${error instanceof Error ? error.message : String(error)}\n`;
        }
    }
    return { report, fixtureCount };
}
