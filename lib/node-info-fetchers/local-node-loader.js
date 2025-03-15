"use strict";
/**
 * Local Node Loader Utility
 *
 * Loads n8n node information from a local JSON file
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
exports.loadNodesFromFile = loadNodesFromFile;
// Only import fs and path in Node.js environment
let fs;
let path;
if (typeof window === 'undefined') {
    // We're in a Node.js environment
    fs = require('fs');
    path = require('path');
}
// Import isomorphic-fetch for environments without native fetch
require('isomorphic-fetch');
/**
 * Loads node information from a local JSON file
 *
 * @param filePath Path to the JSON file containing node information
 * @returns Record of NodeInfo objects
 */
function loadNodesFromFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Loading n8n nodes from local file:", filePath);
        try {
            let resolvedPath = filePath;
            // In browser environment, we can't use path.isAbsolute
            if (typeof window === 'undefined' && path) {
                // Check if path is relative, and resolve it
                if (!path.isAbsolute(filePath)) {
                    resolvedPath = path.resolve(process.cwd(), filePath);
                }
                // Read file directly using fs instead of fetch for local files
                if (fs && fs.existsSync(resolvedPath)) {
                    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
                    return JSON.parse(fileContent);
                }
                else {
                    throw new Error(`File not found: ${resolvedPath}`);
                }
            }
            else {
                // In browser environment, we need to use fetch
                // Assuming the file is hosted and accessible via fetch
                try {
                    const response = yield fetch(filePath);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
                    }
                    return yield response.json();
                }
                catch (fetchError) {
                    console.error("Error fetching nodes file:", fetchError);
                    throw fetchError;
                }
            }
        }
        catch (error) {
            console.error("Error loading nodes from file:", error);
            throw error;
        }
    });
}
