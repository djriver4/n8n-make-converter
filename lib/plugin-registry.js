"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginRegistry = void 0;
exports.getPluginRegistry = getPluginRegistry;
class PluginRegistry {
    constructor() {
        this.plugins = new Map();
    }
    registerPlugin(plugin) {
        if (this.plugins.has(plugin.id)) {
            console.warn(`Plugin with ID ${plugin.id} is already registered. Overwriting.`);
        }
        this.plugins.set(plugin.id, plugin);
    }
    unregisterPlugin(pluginId) {
        return this.plugins.delete(pluginId);
    }
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
    getNodeMappings() {
        const result = {
            n8nToMake: {},
            makeToN8n: {},
        };
        // Combine mappings from all plugins
        for (const plugin of this.plugins.values()) {
            const mappings = plugin.getNodeMappings();
            // Merge n8n to Make mappings
            result.n8nToMake = Object.assign(Object.assign({}, result.n8nToMake), mappings.n8nToMake);
            // Merge Make to n8n mappings
            result.makeToN8n = Object.assign(Object.assign({}, result.makeToN8n), mappings.makeToN8n);
        }
        return result;
    }
    executeHook(hookName, params) {
        let result = params[0]; // Start with the first parameter (usually the workflow or node)
        for (const plugin of this.plugins.values()) {
            if (typeof plugin[hookName] === "function") {
                // Execute the hook and update the result
                // Handle each hook type separately to avoid spread operator issues
                if (hookName === "beforeConversion" || hookName === "afterConversion") {
                    // These hooks take workflow and direction
                    const workflow = result;
                    const direction = params[1];
                    result = plugin[hookName](workflow, direction);
                }
                else if (hookName === "afterNodeMapping") {
                    // This hook takes sourceNode, targetNode, and direction
                    const sourceNode = result;
                    const targetNode = params[1];
                    const direction = params[2];
                    result = plugin[hookName](sourceNode, targetNode, direction);
                }
            }
        }
        return result;
    }
}
// Create a singleton instance
exports.pluginRegistry = new PluginRegistry();
// Export a function to get the registry
function getPluginRegistry() {
    return exports.pluginRegistry;
}
