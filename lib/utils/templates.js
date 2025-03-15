"use strict";
/**
 * Template utility for workflow generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptyTemplate = void 0;
/**
 * Create an empty template for the given platform
 * @param platform The platform to create a template for (n8n or make)
 * @returns A JSON string for an empty workflow template
 */
const createEmptyTemplate = (platform) => {
    if (platform === 'n8n') {
        return JSON.stringify({
            nodes: [],
            connections: {},
            active: false,
            settings: {},
            name: "New n8n Workflow",
            versionId: "",
            staticData: null,
            pinData: {},
            tags: [],
        }, null, 2);
    }
    else {
        return JSON.stringify({
            name: "New Make.com Workflow",
            flow: [],
            metadata: {
                instant: false,
                version: 1,
            }
        }, null, 2);
    }
};
exports.createEmptyTemplate = createEmptyTemplate;
