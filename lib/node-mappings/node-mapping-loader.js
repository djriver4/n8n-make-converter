"use strict";
/**
 * Node mapping loader
 *
 * Utility to load node mappings from the JSON file and make them available to the application
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeMappingLoader = void 0;
const logger_1 = __importDefault(require("../logger"));
// Default mappings as a fallback
const defaultMappings = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString().split('T')[0],
    mappings: {}
};
class NodeMappingLoader {
    constructor() {
        this.mappingDatabase = defaultMappings;
        // Private constructor for singleton pattern
    }
    /**
     * Get the singleton instance of the NodeMappingLoader
     */
    static getInstance() {
        if (!NodeMappingLoader.instance) {
            NodeMappingLoader.instance = new NodeMappingLoader();
        }
        return NodeMappingLoader.instance;
    }
    /**
     * Load the node mappings from the appropriate source
     */
    loadMappings() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (this.mappingDatabase !== defaultMappings) {
                    return this.mappingDatabase;
                }
                // In browser or development environment
                const response = yield fetch('/data/nodes-mapping.json');
                if (!response.ok) {
                    throw new Error(`Failed to load mappings: ${response.statusText}`);
                }
                const data = yield response.json();
                this.mappingDatabase = data;
                logger_1.default.info(`Loaded ${Object.keys(((_a = this.mappingDatabase) === null || _a === void 0 ? void 0 : _a.mappings) || {}).length} mappings`);
                return this.mappingDatabase;
            }
            catch (error) {
                logger_1.default.error(`Error loading mappings: ${error instanceof Error ? error.message : String(error)}`);
                return defaultMappings;
            }
        });
    }
    /**
     * Get the loaded mappings
     */
    getMappings() {
        return this.mappingDatabase;
    }
}
exports.NodeMappingLoader = NodeMappingLoader;
